"use client";

import { useMemo, useState } from "react";
import type { Card } from "../../../lib/api";
import { getApiBase } from "../../../lib/apiBase";

type Props = {
  initialCard: Card;
};

export default function CardDetailClient({ initialCard }: Props) {
  const [card, setCard] = useState<Card>(initialCard);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState("");

  const dueLabel = useMemo(() => {
    if (!card.dueAt) return "No due date";
    const parsed = new Date(card.dueAt);
    if (Number.isNaN(parsed.getTime())) return card.dueAt;
    return parsed.toLocaleString();
  }, [card.dueAt]);

  async function updateStatus(status: Card["status"]) {
    setError(null);
    setSaving(true);
    const previous = card.status;
    setCard({ ...card, status });
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err: any) {
      setCard({ ...card, status: previous });
      setError(err?.message ?? "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  async function toggleChecklist(itemId: string, isDone: boolean) {
    setError(null);
    const previous = card.checklistItems;
    setCard({
      ...card,
      checklistItems: card.checklistItems.map((item) =>
        item.id === itemId ? { ...item, isDone } : item
      ),
    });

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isDone }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err: any) {
      setCard({ ...card, checklistItems: previous });
      setError(err?.message ?? "Failed to update checklist");
    }
  }

  async function addChecklistItem(event: React.FormEvent) {
    event.preventDefault();
    const text = newItem.trim();
    if (!text) return;
    setError(null);
    setSaving(true);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/cards/${card.id}/checklist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setCard({
        ...card,
        checklistItems: [...card.checklistItems, created],
      });
      setNewItem("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to add checklist item");
    } finally {
      setSaving(false);
    }
  }

  const statusOptions: Card["status"][] = ["todo", "in_progress", "done"];

  return (
    <div style={{ padding: 16, paddingBottom: 88, color: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/today" style={{ color: "#9aa0a6", textDecoration: "none", fontWeight: 700 }}>
          Back
        </a>
        <span style={{ color: "#9aa0a6", fontSize: 12 }}>{saving ? "Saving…" : ""}</span>
      </div>

      <h1 style={{ margin: "12px 0 6px 0", fontSize: 22 }}>{card.title}</h1>
      <div style={{ color: "#9aa0a6", fontSize: 13 }}>{dueLabel}</div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {card.labels.map((labelLink) => (
          <span
            key={labelLink.label.id}
            style={{
              fontSize: 12,
              color: "#c7c7ff",
              border: "1px solid #2a2a66",
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            {labelLink.label.name}
          </span>
        ))}
        {card.labels.length === 0 && (
          <span style={{ fontSize: 12, color: "#9aa0a6" }}>No labels</span>
        )}
      </div>

      {card.description && (
        <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.5 }}>{card.description}</div>
      )}

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 8 }}>Status</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => updateStatus(status)}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #2a2a66",
                background: card.status === status ? "#ffffff" : "transparent",
                color: card.status === status ? "#0b0b0f" : "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 8 }}>Checklist</div>
        <div style={{ display: "grid", gap: 10 }}>
          {card.checklistItems.map((item) => (
            <label
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 10,
                border: "1px solid #222",
                borderRadius: 12,
                background: "#11121a",
              }}
            >
              <input
                type="checkbox"
                checked={item.isDone}
                onChange={(e) => toggleChecklist(item.id, e.target.checked)}
              />
              <span
                style={{
                  textDecoration: item.isDone ? "line-through" : "none",
                  color: item.isDone ? "#9aa0a6" : "white",
                }}
              >
                {item.text}
              </span>
            </label>
          ))}
          {card.checklistItems.length === 0 && (
            <div style={{ color: "#9aa0a6", fontSize: 13 }}>No checklist items yet.</div>
          )}
        </div>

        <form onSubmit={addChecklistItem} style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add checklist item"
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 12,
              border: "1px solid #222",
              background: "#11121a",
              color: "white",
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "none",
              background: "#ffffff",
              color: "#0b0b0f",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </form>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "#ff8a8a", fontWeight: 700 }}>{error}</div>
      )}
    </div>
  );
}
