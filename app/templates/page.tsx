"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { DEFAULT_TEMPLATES, TicketTemplate } from "@/data/templates";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Section {
  id: string;
  heading: string;
  content: string;
}

function parseBody(body: string): Section[] {
  return body.split(/\n(?=## )/).map((block) => {
    const lines = block.split("\n");
    const heading = lines[0].replace(/^## /, "").trim();
    const content = lines.slice(1).join("\n").trim();
    return { id: crypto.randomUUID(), heading, content };
  }).filter((s) => s.heading);
}

function sectionsToBody(sections: Section[]): string {
  return sections.map((s) => `## ${s.heading}\n${s.content}`).join("\n\n");
}

function SortableSection({
  section,
  onUpdate,
  onRemove,
  isOverlay = false,
}: {
  section: Section;
  onUpdate: (id: string, field: "heading" | "content", value: string) => void;
  onRemove: (id: string) => void;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    borderColor: isOverlay ? "var(--primary)" : "var(--border)",
    background: "var(--surface)",
    boxShadow: isOverlay ? "0 8px 24px rgba(0,0,0,0.12)" : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border">
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 flex items-center justify-center rounded p-0.5 transition-colors"
          style={{ color: "var(--text-muted)", cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
          title="Drag to reorder"
          tabIndex={-1}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="4.5" cy="3.5" r="1.2"/><circle cx="9.5" cy="3.5" r="1.2"/>
            <circle cx="4.5" cy="7" r="1.2"/><circle cx="9.5" cy="7" r="1.2"/>
            <circle cx="4.5" cy="10.5" r="1.2"/><circle cx="9.5" cy="10.5" r="1.2"/>
          </svg>
        </button>
        <input
          value={section.heading}
          onChange={(e) => onUpdate(section.id, "heading", e.target.value)}
          placeholder="Section name"
          className="flex-1 text-sm font-medium"
          style={{ border: "none", padding: 0, background: "transparent", outline: "none" }}
        />
        <button
          onClick={() => onRemove(section.id)}
          className="text-xs shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors"
          style={{ color: "var(--text-muted)" }}
          title="Remove section"
        >
          ✕
        </button>
      </div>
      <textarea
        value={section.content}
        onChange={(e) => onUpdate(section.id, "content", e.target.value)}
        placeholder={`Hint for Claude — e.g. "As a [persona], I want to [action]..."`}
        rows={3}
        className="w-full text-xs font-mono p-3 resize-none"
        style={{ border: "none", background: "transparent", outline: "none", color: "var(--text)" }}
      />
    </div>
  );
}

function SectionEditor({
  sections,
  onChange,
}: {
  sections: Section[];
  onChange: (sections: Section[]) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeSection = sections.find((s) => s.id === activeId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    onChange(arrayMove(sections, oldIndex, newIndex));
  }

  function updateSection(id: string, field: "heading" | "content", value: string) {
    onChange(sections.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }

  function removeSection(id: string) {
    onChange(sections.filter((s) => s.id !== id));
  }

  function addSection() {
    onChange([...sections, { id: crypto.randomUUID(), heading: "", content: "" }]);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {sections.map((s) => (
            <SortableSection key={s.id} section={s} onUpdate={updateSection} onRemove={removeSection} />
          ))}

          <button
            onClick={addSection}
            className="text-xs py-2.5 rounded-lg border-2 border-dashed transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            + Add section
          </button>
        </div>
      </SortableContext>

      <DragOverlay>
        {activeSection && (
          <SortableSection section={activeSection} onUpdate={() => {}} onRemove={() => {}} isOverlay />
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TicketTemplate[]>(DEFAULT_TEMPLATES);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSections, setCreateSections] = useState<Section[]>([
    { id: crypto.randomUUID(), heading: "User Story", content: "As a [persona], I want to [action], so that [outcome]." },
    { id: crypto.randomUUID(), heading: "Acceptance Criteria", content: "- **Given** [context]\n- **When** [action]\n- **Then** [outcome]" },
    { id: crypto.randomUUID(), heading: "Requirements", content: "- [specific requirement]" },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSections, setEditSections] = useState<Section[]>([]);

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

  function saveNewTemplate() {
    if (!createName.trim() || createSections.length === 0) return;
    const body = sectionsToBody(createSections);
    const t: TicketTemplate = {
      id: `custom-${Date.now()}`,
      name: createName.trim(),
      description: "Custom template",
      sections: createSections.map((s) => s.heading).filter(Boolean),
      body,
    };
    const custom = templates.filter((x) => x.id.startsWith("custom-"));
    const updated = [...custom, t];
    localStorage.setItem("custom_templates", JSON.stringify(updated));
    setTemplates([...DEFAULT_TEMPLATES, ...updated]);
    setCreating(false);
    setCreateName("");
    setCreateSections([
      { id: crypto.randomUUID(), heading: "User Story", content: "As a [persona], I want to [action], so that [outcome]." },
      { id: crypto.randomUUID(), heading: "Acceptance Criteria", content: "- **Given** [context]\n- **When** [action]\n- **Then** [outcome]" },
      { id: crypto.randomUUID(), heading: "Requirements", content: "- [specific requirement]" },
    ]);
  }

  function startEditing(t: TicketTemplate) {
    setEditingId(t.id);
    setEditName(t.name);
    setEditSections(parseBody(t.body));
  }

  function startCustomising(t: TicketTemplate) {
    setCreating(true);
    setCreateName(`${t.name} (copy)`);
    setCreateSections(parseBody(t.body));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveEdit() {
    if (!editName.trim() || editSections.length === 0 || !editingId) return;
    const body = sectionsToBody(editSections);
    const updated = templates.map((t) =>
      t.id === editingId
        ? { ...t, name: editName.trim(), sections: editSections.map((s) => s.heading).filter(Boolean), body }
        : t
    );
    const custom = updated.filter((t) => t.id.startsWith("custom-"));
    localStorage.setItem("custom_templates", JSON.stringify(custom));
    setTemplates(updated);
    setEditingId(null);
  }

  function deleteTemplate(id: string) {
    const updated = templates.filter((t) => t.id !== id);
    const custom = updated.filter((t) => t.id.startsWith("custom-"));
    localStorage.setItem("custom_templates", JSON.stringify(custom));
    setTemplates(updated);
    if (editingId === id) setEditingId(null);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/" className="text-xs flex items-center gap-1 mb-6" style={{ color: "var(--text-muted)" }}>← Dashboard</Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Template library</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Reusable ticket structures. "Use template" loads it into Spark.
            </p>
          </div>
          {!creating && (
            <button className="btn-secondary" onClick={() => { setCreating(true); setEditingId(null); }}>
              + New template
            </button>
          )}
        </div>

        {/* Create form */}
        {creating && (
          <div className="card p-5 mb-4 flex flex-col gap-4">
            <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>New template</h3>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>Template name</label>
              <input
                placeholder="e.g. Mobile feature, API endpoint, Bug report"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
                Sections
                <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                  — drag to reorder, add hints in each field for Claude
                </span>
              </label>
              <SectionEditor sections={createSections} onChange={setCreateSections} />
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={saveNewTemplate}
                disabled={!createName.trim() || createSections.length === 0}
              >
                Save template
              </button>
            </div>
          </div>
        )}

        {/* Template list */}
        <div className="flex flex-col gap-3">
          {templates.map((t) => (
            <div key={t.id} className="card overflow-hidden">
              {/* Card header */}
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {editingId === t.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-sm font-semibold"
                          style={{ border: "none", padding: 0, background: "transparent", outline: "none", width: "100%" }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : t.name}
                    </h3>
                    {t.id.startsWith("custom-") && editingId !== t.id && (
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                        Custom
                      </span>
                    )}
                  </div>
                  {editingId !== t.id && (
                    <>
                      <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{t.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {t.sections.map((s) => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-md" style={{ background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {editingId === t.id ? (
                    <>
                      <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => setEditingId(null)}>Cancel</button>
                      <button className="btn-primary text-xs py-1.5 px-3" onClick={saveEdit} disabled={!editName.trim() || editSections.length === 0}>Save</button>
                    </>
                  ) : (
                    <>
                      {t.id.startsWith("custom-") ? (
                        <>
                          <button className="text-xs" style={{ color: "#ef4444" }} onClick={() => deleteTemplate(t.id)}>Delete</button>
                          <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => startEditing(t)}>Edit</button>
                        </>
                      ) : (
                        <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => startCustomising(t)}>Customise</button>
                      )}
                      <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => useTemplate(t)}>Use template</button>
                    </>
                  )}
                </div>
              </div>

              {/* Inline edit panel */}
              {editingId === t.id && (
                <div className="border-t px-4 py-4 flex flex-col gap-3" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Drag sections to reorder. The content of each section is shown to Claude as a hint for what to write there.
                  </p>
                  <SectionEditor sections={editSections} onChange={setEditSections} />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
