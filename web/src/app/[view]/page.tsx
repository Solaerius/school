import { fetchCards } from "../../lib/api";

const allowed = new Set(["today", "week", "month", "upcoming"]);

function BottomNav({ active }: { active: string }) {
  const items = [
    { key: "today", label: "Today" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "upcoming", label: "Upcoming" },
  ];
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: "1px solid #222",
        background: "#0b0b0f",
        display: "flex",
        justifyContent: "space-around",
        padding: "10px 8px",
        zIndex: 50,
      }}
    >
      {items.map((it) => (
        <a
          key={it.key}
          href={`/${it.key}`}
          style={{
            color: active === it.key ? "white" : "#9aa0a6",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          {it.label}
        </a>
      ))}
    </nav>
  );
}

function FloatingAddButton() {
  return (
    <a
      href="/new"
      aria-label="Create new card"
      style={{
        position: "fixed",
        right: 16,
        bottom: 78,
        width: 54,
        height: 54,
        borderRadius: 999,
        background: "#ffffff",
        color: "#0b0b0f",
        display: "grid",
        placeItems: "center",
        fontSize: 28,
        fontWeight: 900,
        textDecoration: "none",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        zIndex: 60,
      }}
    >
      +
    </a>
  );
}

export default async function ViewPage({ params }: { params: { view: string } }) {
  const view = params.view;
  if (!allowed.has(view)) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Unknown view</h1>
        <a href="/today">Go to Today</a>
      </div>
    );
  }

  const cards = await fetchCards(view as any);

  const withDue = cards.filter((c) => c.dueAt);
  const noDue = cards.filter((c) => !c.dueAt);

  return (
    <div
      style={{
        padding: 16,
        paddingBottom: 88,
        background: "#0b0b0f",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <h1 style={{ margin: "6px 0 14px 0", fontSize: 22 }}>
        {view.charAt(0).toUpperCase() + view.slice(1)}
      </h1>

      <div style={{ display: "grid", gap: 12 }}>
        {(view === "upcoming" ? withDue : cards).map((c) => {
          const doneCount = c.checklistItems.filter((x) => x.isDone).length;
          const total = c.checklistItems.length;

          return (
            <a
              key={c.id}
              href={`/card/${c.id}`}
              style={{
                border: "1px solid #222",
                borderRadius: 14,
                padding: 12,
                background: "#11121a",
                color: "white",
                textDecoration: "none",
                display: "block",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 800 }}>{c.title}</div>
                <div style={{ color: "#9aa0a6", fontSize: 12 }}>
                  {c.dueAt ? new Date(c.dueAt).toLocaleDateString() : ""}
                </div>
              </div>

              <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {c.labels.map((l) => (
                  <span
                    key={l.label.id}
                    style={{
                      fontSize: 12,
                      color: "#c7c7ff",
                      border: "1px solid #2a2a66",
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {l.label.name}
                  </span>
                ))}

                {total > 0 && (
                  <span style={{ fontSize: 12, color: "#9aa0a6" }}>
                    {doneCount}/{total}
                  </span>
                )}
              </div>
            </a>
          );
        })}
      </div>

      {view === "upcoming" && noDue.length > 0 && (
        <>
          <h2 style={{ marginTop: 18, fontSize: 14, color: "#9aa0a6" }}>No due date</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {noDue.map((c) => (
              <a
                key={c.id}
                href={`/card/${c.id}`}
                style={{
                  border: "1px solid #222",
                  borderRadius: 14,
                  padding: 12,
                  background: "#11121a",
                  color: "white",
                  textDecoration: "none",
                  display: "block",
                }}
              >
                <div style={{ fontWeight: 800 }}>{c.title}</div>
              </a>
            ))}
          </div>
        </>
      )}

      <FloatingAddButton />
      <BottomNav active={view} />
    </div>
  );
}
