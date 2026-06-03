"use client";

import { useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  title: string;
  onTitleChange: (v: string) => void;
  teamName?: string;
  onPush: () => void;
  pushing?: boolean;
  successId?: string;
  successUrl?: string;
  figmaUrl?: string;
}

export default function TicketPreview({
  value, onChange, title, onTitleChange,
  teamName, onPush, pushing, successId, successUrl, figmaUrl
}: Props) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#fef3c7", color: "#92400e" }}>Draft</span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>from Figma · just now</span>
        <div className="ml-auto flex items-center gap-2">
          {["edit", "preview"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as "edit" | "preview")}
              className="text-xs px-2.5 py-1 rounded-md capitalize"
              style={{
                background: tab === t ? "var(--bg)" : "transparent",
                color: tab === t ? "var(--text)" : "var(--text-muted)",
                border: tab === t ? "1px solid var(--border)" : "1px solid transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Issue title"
          className="text-base font-semibold border-none outline-none bg-transparent w-full"
          style={{ color: "var(--text)", borderColor: "transparent", padding: 0 }}
        />
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "edit" ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm resize-none border-none outline-none bg-transparent"
            style={{ color: "var(--text)", minHeight: "300px" }}
            placeholder="Ticket content will appear here…"
          />
        ) : (
          <div className="p-4 prose prose-sm max-w-none" style={{ color: "var(--text)" }}>
            <pre className="whitespace-pre-wrap text-sm font-sans">{value}</pre>
          </div>
        )}
      </div>

      {figmaUrl && (
        <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Linked Figma frames</p>
          <div className="flex gap-2 flex-wrap">
            <a
              href={figmaUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
              style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 5.5A3.5 3.5 0 018.5 2H12v7H8.5A3.5 3.5 0 015 5.5z"/><path d="M12 2h3.5a3.5 3.5 0 110 7H12V2z"/><path d="M12 12.5a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z"/><path d="M5 19.5A3.5 3.5 0 018.5 16H12v3.5a3.5 3.5 0 11-7 0z"/><path d="M5 12.5A3.5 3.5 0 018.5 9H12v7H8.5A3.5 3.5 0 015 12.5z"/></svg>
              Figma frame
            </a>
            <button className="text-xs px-2 py-1 rounded-md" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              + Add
            </button>
          </div>
        </div>
      )}

      <div
        className="flex items-center justify-between px-4 py-3 border-t"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {successId ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: "#22c55e" }}>Pushed!</span>
            <a
              href={successUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-mono font-medium"
              style={{ color: "var(--primary)" }}
            >
              {successId}
            </a>
          </div>
        ) : (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {teamName ? `Pushes to ${teamName}` : "Select a team above"}
          </span>
        )}
        <button
          className="btn-primary flex items-center gap-2"
          onClick={onPush}
          disabled={pushing || !value.trim()}
        >
          {pushing ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Pushing…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Push to Linear
            </>
          )}
        </button>
      </div>
    </div>
  );
}
