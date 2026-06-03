"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { DEFAULT_TEMPLATES, TicketTemplate } from "@/data/templates";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TicketTemplate[]>(DEFAULT_TEMPLATES);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBody, setNewBody] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("custom_templates");
    if (stored) {
      const custom: TicketTemplate[] = JSON.parse(stored);
      setTemplates([...DEFAULT_TEMPLATES, ...custom]);
    }
  }, []);

  function useTemplate(t: TicketTemplate) {
    localStorage.setItem("generator_template", JSON.stringify(t));
    router.push("/generator");
  }

  function saveTemplate() {
    if (!newName.trim() || !newBody.trim()) return;
    const t: TicketTemplate = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      description: "Custom template",
      sections: newBody.match(/^## .+/gm)?.map((l) => l.replace("## ", "")) ?? [],
      body: newBody.trim(),
    };
    const custom = templates.filter((x) => x.id.startsWith("custom-"));
    const updated = [...custom, t];
    localStorage.setItem("custom_templates", JSON.stringify(updated));
    setTemplates([...DEFAULT_TEMPLATES, ...updated]);
    setCreating(false);
    setNewName("");
    setNewBody("");
  }

  function deleteTemplate(id: string) {
    const updated = templates.filter((t) => t.id !== id);
    const custom = updated.filter((t) => t.id.startsWith("custom-"));
    localStorage.setItem("custom_templates", JSON.stringify(custom));
    setTemplates(updated);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/" className="text-xs flex items-center gap-1 mb-6" style={{ color: "var(--text-muted)" }}>← Dashboard</Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Template library</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Reusable ticket structures. "Use template" loads it into the AI generator.
            </p>
          </div>
          <button className="btn-secondary" onClick={() => setCreating(true)}>+ New template</button>
        </div>

        {creating && (
          <div className="card p-5 mb-4 flex flex-col gap-4">
            <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>New template</h3>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Name</label>
              <input placeholder="Template name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
                Body (markdown — use ## for sections)
              </label>
              <textarea
                rows={12}
                placeholder="## User Story&#10;As a [persona]...&#10;&#10;## Acceptance Criteria&#10;..."
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveTemplate} disabled={!newName.trim() || !newBody.trim()}>Save template</button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {templates.map((t) => (
            <div key={t.id} className="card p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t.name}</h3>
                  {t.id.startsWith("custom-") && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                      Custom
                    </span>
                  )}
                </div>
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{t.description}</p>
                <div className="flex flex-wrap gap-1">
                  {t.sections.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2 py-0.5 rounded-md"
                      style={{ background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {t.id.startsWith("custom-") && (
                  <button
                    className="text-xs"
                    style={{ color: "#ef4444" }}
                    onClick={() => deleteTemplate(t.id)}
                  >
                    Delete
                  </button>
                )}
                <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => useTemplate(t)}>
                  Use template
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
