const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3100";

export type Card = {
  id: string;
  title: string;
  description: string;
  status: string;
  dueAt: string | null;
  startAt: string | null;
  priority: number;
  checklistItems: { id: string; text: string; isDone: boolean; sortOrder: number }[];
  labels: { label: { id: string; name: string } }[];
};

export async function fetchCards(view: "today" | "week" | "month" | "upcoming"): Promise<Card[]> {
  const res = await fetch(`${API_BASE}/cards?view=${view}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch cards: ${res.status}`);
  return res.json();
}

export async function fetchCard(id: string): Promise<Card> {
  const res = await fetch(`${API_BASE}/cards/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch card: ${res.status}`);
  return res.json();
}
