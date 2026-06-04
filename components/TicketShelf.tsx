"use client";

import { useState, useEffect, ReactNode } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body: string;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onFigmaFrameUrl?: (url: string) => void;
  ticketIndex?: number;
  totalTickets?: number;
  onPrev?: () => void;
  onNext?: () => void;
}

function updateDesignSection(body: string, url: string): string {
  const linked = `[Figma frame](${url})`;
  if (/^## Design$/m.test(body)) {
    return body.replace(
      /(^## Design\n)([\s\S]*?)(?=\n## |\s*$)/m,
      `$1${linked}\n`
    );
  }
  return body;
}

// ── Inline renderer: **bold**, [text](url) ──────────────────────────────────
function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} style={{ fontWeight: 600, color: "var(--text)" }}>{part.slice(2, -2)}</strong>;
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          return <a key={i} href={link[2]} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>{link[1]}</a>;
        }
        return part;
      })}
    </>
  );
}

// ── Block parser ────────────────────────────────────────────────────────────
type Block = { type: "list"; items: string[] } | { type: "para"; text: string };

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let list: string[] | null = null;
  for (const line of lines) {
    if (!line.trim()) {
      if (list) { blocks.push({ type: "list", items: list }); list = null; }
      continue;
    }
    if (/^[-*] /.test(line)) {
      if (!list) list = [];
      list.push(line.replace(/^[-*] /, ""));
    } else {
      if (list) { blocks.push({ type: "list", items: list }); list = null; }
      blocks.push({ type: "para", text: line });
    }
  }
  if (list) blocks.push({ type: "list", items: list });
  return blocks;
}

// ── Markdown renderer ───────────────────────────────────────────────────────
function TicketMarkdown({ body }: { body: string }) {
  const sections = body.split(/\n(?=## )/);

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section, si) => {
        const lines = section.split("\n");
        const isHeading = lines[0].startsWith("## ");
        const heading = isHeading ? lines[0].replace(/^## /, "") : null;
        const contentLines = isHeading ? lines.slice(1) : lines;
        const blocks = parseBlocks(contentLines);

        return (
          <div key={si}>
            {heading && (
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--primary)" }}
              >
                {heading}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              {blocks.map((block, bi) =>
                block.type === "list" ? (
                  <ul key={bi} className="flex flex-col gap-1" style={{ paddingLeft: 0, listStyle: "none" }}>
                    {block.items.map((item, ii) => (
                      <li key={ii} className="flex gap-2 text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                        <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--text-muted)", flexShrink: 0 }} />
                        <span>{renderInline(item)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p key={bi} className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                    {renderInline(block.text)}
                  </p>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function TicketShelf({
  isOpen, onClose,
  title, body, onTitleChange, onBodyChange,
  onFigmaFrameUrl,
  ticketIndex, totalTickets, onPrev, onNext,
}: Props) {
  const [tab, setTab] = useState<"preview" | "edit">("preview");
  const [figmaInput, setFigmaInput] = useState("");

  useEffect(() => { setFigmaInput(""); }, [ticketIndex, title]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  function applyFigmaUrl() {
    if (!figmaInput.trim()) return;
    onBodyChange(updateDesignSection(body, figmaInput.trim()));
    onFigmaFrameUrl?.(figmaInput.trim());
  }

  const hasNav = (totalTickets ?? 0) > 1;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{
          background: "rgba(0,0,0,0.3)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.2s",
        }}
        onClick={onClose}
      />

      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: "min(560px, 100vw)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: isOpen ? "-8px 0 32px rgba(0,0,0,0.08)" : "none",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          {hasNav && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onPrev} disabled={ticketIndex === 0}
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{ color: ticketIndex === 0 ? "var(--border)" : "var(--text-muted)", border: "1px solid var(--border)" }}
              >‹</button>
              <span className="text-xs font-mono px-1" style={{ color: "var(--text-muted)" }}>
                {(ticketIndex ?? 0) + 1}/{totalTickets}
              </span>
              <button
                onClick={onNext} disabled={ticketIndex === (totalTickets ?? 1) - 1}
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{ color: ticketIndex === (totalTickets ?? 1) - 1 ? "var(--border)" : "var(--text-muted)", border: "1px solid var(--border)" }}
              >›</button>
            </div>
          )}
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="flex-1 min-w-0 text-sm font-semibold"
            style={{ border: "none", padding: 0, background: "transparent", outline: "none", color: "var(--text)" }}
            placeholder="Ticket title"
          />
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center shrink-0"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 py-2 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          {(["preview", "edit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="text-xs px-3 py-1 rounded-md capitalize"
              style={{
                background: tab === t ? "var(--bg)" : "transparent",
                color: tab === t ? "var(--text)" : "var(--text-muted)",
                border: tab === t ? "1px solid var(--border)" : "1px solid transparent",
                fontWeight: tab === t ? 500 : 400,
              }}
            >{t}</button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {tab === "preview" ? (
            <div className="p-6">
              <TicketMarkdown body={body} />
            </div>
          ) : (
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              className="w-full font-mono text-xs p-5 resize-none"
              style={{ border: "none", background: "var(--bg)", outline: "none", color: "var(--text)", height: "100%", minHeight: 400 }}
            />
          )}
        </div>

        {/* Figma footer */}
        <div className="border-t px-5 py-4 shrink-0" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text)" }}>Figma frame link</p>
          <div className="flex gap-2">
            <input
              placeholder="https://www.figma.com/design/...?node-id=..."
              value={figmaInput}
              onChange={(e) => setFigmaInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFigmaUrl()}
              className="flex-1 text-xs"
            />
            <button className="btn-secondary text-xs shrink-0 px-3" onClick={applyFigmaUrl} disabled={!figmaInput.trim()}>
              Apply
            </button>
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
            Paste any Figma frame URL — no API key needed. Updates the Design section.
          </p>
        </div>
      </div>
    </>
  );
}
