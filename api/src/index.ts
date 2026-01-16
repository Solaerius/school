import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  endOfDay,
  endOfISOWeek,
  endOfMonth,
  startOfDay,
  startOfISOWeek,
  startOfMonth,
} from "date-fns";

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

// Single-user behind Tailscale: optional hardening hook.
// For now we allow all origins so the web UI can write to the API.
app.addHook("onRequest", async (req, reply) => {
  reply.header("access-control-allow-origin", "*");
  reply.header("access-control-allow-methods", "GET,POST,PATCH,OPTIONS");
  reply.header("access-control-allow-headers", "content-type");

  if (req.method === "OPTIONS") {
    reply.code(204);
    return reply.send();
  }
});

const CardStatusSchema = z.enum([
  "inbox",
  "todo",
  "in_progress",
  "waiting",
  "done",
  "archived",
]);

const CardCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  status: CardStatusSchema.default("inbox"),
  dueAt: z.string().datetime().nullable().default(null),
  startAt: z.string().datetime().nullable().default(null),
  priority: z.number().int().min(0).max(3).default(0),
  labelNames: z.array(z.string().min(1)).default([]),
  checklist: z.array(z.string().min(1)).default([]),
  customFields: z.record(z.any()).default({}),
});

const CardPatchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: CardStatusSchema.optional(),
  dueAt: z.string().datetime().nullable().optional(),
  startAt: z.string().datetime().nullable().optional(),
  priority: z.number().int().min(0).max(3).optional(),
});

app.get("/health", async () => ({ ok: true }));

/**
 * Views:
 * - today: due today OR start today OR in_progress
 * - week: due within week OR start within week
 * - month: due within month OR start within month
 * - upcoming: all not done/archived sorted by due date, then priority
 */
app.get("/cards", async (req) => {
  const q = z
    .object({
      view: z.enum(["today", "week", "month", "upcoming"]).optional(),
      status: CardStatusSchema.optional(),
    })
    .parse(req.query);

  const now = new Date();

  const baseWhere: any = {};
  if (q.status) baseWhere.status = q.status;

  let where: any = { ...baseWhere };
  let orderBy: any[] = [
    { dueAt: "asc" },
    { priority: "desc" },
    { createdAt: "desc" },
  ];

  if (q.view === "today") {
    const a = startOfDay(now);
    const b = endOfDay(now);
    where = {
      ...baseWhere,
      OR: [
        { dueAt: { gte: a, lte: b } },
        { startAt: { gte: a, lte: b } },
        { status: "in_progress" },
      ],
      NOT: [{ status: "archived" }],
    };
    orderBy = [
      { dueAt: "asc" },
      { priority: "desc" },
      { createdAt: "desc" },
    ];
  }

  if (q.view === "week") {
    const a = startOfISOWeek(now);
    const b = endOfISOWeek(now);
    where = {
      ...baseWhere,
      OR: [{ dueAt: { gte: a, lte: b } }, { startAt: { gte: a, lte: b } }],
      NOT: [{ status: "archived" }],
    };
  }

  if (q.view === "month") {
    const a = startOfMonth(now);
    const b = endOfMonth(now);
    where = {
      ...baseWhere,
      OR: [{ dueAt: { gte: a, lte: b } }, { startAt: { gte: a, lte: b } }],
      NOT: [{ status: "archived" }],
    };
  }

  if (q.view === "upcoming") {
    where = {
      ...baseWhere,
      NOT: [{ status: "done" }, { status: "archived" }],
    };
    // Note: ordering of NULL dueAt differs across DBs.
    // In the web UI we can group "no due date" separately.
  }

  const cards = await prisma.card.findMany({
    where,
    orderBy,
    include: {
      checklistItems: { orderBy: { sortOrder: "asc" } },
      labels: { include: { label: true } },
      customFields: true,
    },
  });

  return cards;
});

app.get("/cards/:id", async (req, reply) => {
  const params = z.object({ id: z.string().uuid() }).parse(req.params);

  const card = await prisma.card.findUnique({
    where: { id: params.id },
    include: {
      checklistItems: { orderBy: { sortOrder: "asc" } },
      labels: { include: { label: true } },
      customFields: true,
    },
  });

  if (!card) {
    reply.code(404);
    return { message: "Card not found" };
  }

  return card;
});

app.post("/cards", async (req, reply) => {
  const data = CardCreateSchema.parse(req.body);

  const labels = await Promise.all(
    data.labelNames.map(async (name: string) => {
      const label = await prisma.label.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      return label;
    })
  );

  const created = await prisma.card.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      startAt: data.startAt ? new Date(data.startAt) : null,
      priority: data.priority,
      labels: {
        create: labels.map((l) => ({ labelId: l.id })),
      },
      checklistItems: {
        create: data.checklist.map((text: string, i: number) => ({
          text,
          sortOrder: i,
        })),
      },
      customFields: {
        create: Object.entries(data.customFields).map(([key, value]) => ({
          key,
          value,
        })),
      },
    },
    include: {
      checklistItems: { orderBy: { sortOrder: "asc" } },
      labels: { include: { label: true } },
      customFields: true,
    },
  });

  reply.code(201);
  return created;
});

app.patch("/cards/:id", async (req) => {
  const params = z.object({ id: z.string().uuid() }).parse(req.params);
  const body = CardPatchSchema.parse(req.body);

  return prisma.card.update({
    where: { id: params.id },
    data: {
      ...body,
      dueAt:
        body.dueAt === undefined
          ? undefined
          : body.dueAt === null
            ? null
            : new Date(body.dueAt),
      startAt:
        body.startAt === undefined
          ? undefined
          : body.startAt === null
            ? null
            : new Date(body.startAt),
    },
    include: {
      checklistItems: { orderBy: { sortOrder: "asc" } },
      labels: { include: { label: true } },
      customFields: true,
    },
  });
});

app.post("/cards/:id/checklist", async (req) => {
  const params = z.object({ id: z.string().uuid() }).parse(req.params);
  const body = z.object({ text: z.string().min(1) }).parse(req.body);

  const last = await prisma.checklistItem.findFirst({
    where: { cardId: params.id },
    orderBy: { sortOrder: "desc" },
  });

  return prisma.checklistItem.create({
    data: {
      cardId: params.id,
      text: body.text,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });
});

app.patch("/checklist/:id", async (req) => {
  const params = z.object({ id: z.string().uuid() }).parse(req.params);
  const body = z
    .object({
      isDone: z.boolean().optional(),
      text: z.string().min(1).optional(),
    })
    .parse(req.body);

  return prisma.checklistItem.update({
    where: { id: params.id },
    data: body,
  });
});

// Google Calendar import stub (we’ll add OAuth + sync later)
app.post("/integrations/google-calendar/sync", async () => {
  return {
    ok: true,
    message: "Not implemented yet. We'll add Google OAuth + event import later.",
  };
});

const port = 3100;
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
