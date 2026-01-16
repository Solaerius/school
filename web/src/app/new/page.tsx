"use client";

import { useState } from "react";
import { buildApiUrl } from "../../lib/apiBase";

export default function NewCardPage() {
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState(""); // local datetime string
  const [labels, setLabels] = useState(""); // comma separated
  const [checklist, setChecklist] = useState(""); // one per line
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate() {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    try {
      const labelNames = labels
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const checklistItems = checklist
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      // Convert local datetime-local input to ISO string
      const dueIso = dueAt ? new Date(dueAt).toISOString() : null;

      const res = await fetch(buildApiUrl("/cards"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          status: "todo",
          dueAt: dueIso,
          labelNames,
          checklist: checklistItems,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Request failed: ${res.status}`);
      }

      // Go back to Today after create
      window.location.href = "/today";
    } catch (e: any) {
      setError(e?.message ?? "Failed to create card");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 16, background: "#0b0b0f", minHeight: "100vh", color: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>New card</h1>
        <a href="/today" style={{ color: "#9aa0a6", textDecoration: "none", fontWeight: 700 }}>
          Cancel
        </a>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#9aa0a6", fontSize: 12 }}>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Essay: History - French Revolution"
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid #222",
              background: "#11121a",
              color: "white",
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#9aa0a6", fontSize: 12 }}>Due</span>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid #222",
              background: "#11121a",
              color: "white",
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#9aa0a6", fontSize: 12 }}>Labels (comma separated)</span>
          <input
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            placeholder="Essay, History"
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid #222",
              background: "#11121a",
              color: "white",
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#9aa0a6", fontSize: 12 }}>Checklist (one per line)</span>
          <textarea
            value={checklist}
            onChange={(e) => setChecklist(e.target.value)}
            placeholder={`Understand prompt\nOutline\nSources (3)\nDraft\nEdit\nSubmit`}
            rows={8}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid #222",
              background: "#11121a",
              color: "white",
              outline: "none",
              resize: "vertical",
            }}
          />
        </label>

        {error && (
          <div style={{ color: "#ff8a8a", fontWeight: 700 }}>
            {error}
          </div>
        )}

        <button
          onClick={onCreate}
          disabled={saving}
          style={{
            padding: 14,
            borderRadius: 14,
            border: "none",
            background: saving ? "#444" : "#ffffff",
            color: "#0b0b0f",
            fontWeight: 900,
            fontSize: 16,
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Creating…" : "Create card"}
        </button>
      </div>
    </div>
  );
}
