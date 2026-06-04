"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import LinearKeyModal from "@/components/LinearKeyModal";
import TeamStateSelect from "@/components/TeamStateSelect";
import { createIssue } from "@/lib/linear";

interface ImageData {
  id: string;
  base64: string;
  mediaType: string;
  preview: string;
}

interface Ticket {
  id: string;
  title: string;
  body: string;
  selected: boolean;
  expanded: boolean;
  status: "ready" | "pushing" | "done" | "error";
  issueId?: string;
  issueUrl?: string;
  errorMsg?: string;
}

type AnalyseState = "idle" | "analysing" | "done";

const ANALYSE_STEPS = [
  "Reading screens",
  "Identifying UI patterns",
  "Writing user stories",
  "Generating acceptance criteria",
];

function recordActivity(issue: { id: string; identifier: string; title: string; url: string }) {
  const existing = JSON.parse(localStorage.getItem("pushed_activity") ?? "[]");
  const updated = [{ ...issue, pushedAt: new Date().toISOString() }, ...existing].slice(0, 50);
  localStorage.setItem("pushed_activity", JSON.stringify(updated));
}

async function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(",");
      const mediaType = header.match(/:(.*?);/)?.[1] ?? "image/png";
      resolve({ id: crypto.randomUUID(), base64, mediaType, preview: dataUrl });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function BulkPage() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [figmaFileUrl, setFigmaFileUrl] = useState("");
  const [teamId, setTeamId] = useState("");
  const [stateId, setStateId] = useState("");
  const [analyseState, setAnalyseState] = useState<AnalyseState>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [pushing, setPushing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = localStorage.getItem("linear_api_key");
    setHasKey(!!key);
  }, []);

  const addImages = useCallback(async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) { setError("Please upload image files."); return; }
    setError("");
    const newImages = await Promise.all(imageFiles.map(fileToImageData));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItems = items.filter((item) => item.type.startsWith("image/"));
      const files = imageItems.map((item) => item.getAsFile()).filter(Boolean) as File[];
      if (files.length > 0) addImages(files);
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [addImages]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) addImages(files);
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  function reset() {
    setImages([]);
    setTickets([]);
    setAnalyseState("idle");
    setError("");
    setFigmaFileUrl("");
  }

  async function handleAnalyse() {
    if (images.length === 0) return;
    setError("");
    setAnalyseState("analysing");
    setStepIdx(0);

    const stepInterval = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, ANALYSE_STEPS.length - 1));
    }, 1400);

    try {
      const res = await fetch("/api/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: images.map((img) => ({ imageBase64: img.base64, mediaType: img.mediaType })),
          figmaFileUrl: figmaFileUrl.trim() || undefined,
        }),
      });
      clearInterval(stepInterval);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `API error ${res.status}`);
      }
      const data = await res.json();
      setTickets(
        data.tickets.map((t: { title: string; body: string }, i: number) => ({
          id: `ticket-${i}`,
          title: t.title,
          body: t.body,
          selected: true,
          expanded: false,
          status: "ready" as const,
        }))
      );
      setAnalyseState("done");
    } catch (err) {
      clearInterval(stepInterval);
      setError((err as Error).message);
      setAnalyseState("idle");
    }
  }

  async function handlePushSelected() {
    const key = localStorage.getItem("linear_api_key") ?? "";
    if (!key || !teamId || !stateId) return;
    setPushing(true);

    for (const ticket of tickets.filter((t) => t.selected && t.status === "ready")) {
      setTickets((ts) => ts.map((t) => t.id === ticket.id ? { ...t, status: "pushing" } : t));
      try {
        const issue = await createIssue(key, { title: ticket.title, description: ticket.body, teamId, stateId });
        recordActivity(issue);
        setTickets((ts) =>
          ts.map((t) => t.id === ticket.id ? { ...t, status: "done", issueId: issue.identifier, issueUrl: issue.url } : t)
        );
      } catch (err) {
        setTickets((ts) =>
          ts.map((t) => t.id === ticket.id ? { ...t, status: "error", errorMsg: (err as Error).message } : t)
        );
      }
    }
    setPushing(false);
  }

  const selected = tickets.filter((t) => t.selected);
  const allSelected = tickets.length > 0 && tickets.every((t) => t.selected);
  const anyReady = tickets.some((t) => t.selected && t.status === "ready");
  const allPushed = tickets.length > 0 && tickets.every((t) => t.status === "done");

  function toggleAll() {
    setTickets((ts) => ts.map((t) => ({ ...t, selected: !allSelected })));
  }

  if (hasKey === null) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {hasKey === false && <LinearKeyModal onConnect={() => setHasKey(true)} />}
      <Nav />

      <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden">
        {/* Left sidebar */}
        <aside
          className="w-full md:w-[420px] shrink-0 border-b md:border-b-0 md:border-r flex flex-col"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="p-6 flex flex-col gap-6 md:flex-1 md:overflow-auto">
            <div>
              <Link href="/" className="text-xs flex items-center gap-1 mb-6" style={{ color: "var(--text-muted)" }}>
                ← Dashboard
              </Link>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>Screen analyser</h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Paste or drop screenshots of your designs. Claude identifies each screen and writes a ticket per screen.
              </p>
            </div>

            {/* Drop zone */}
            <div
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 p-6 cursor-pointer transition-colors"
              style={{
                borderColor: isDragging ? "var(--primary)" : "var(--border)",
                background: isDragging ? "color-mix(in srgb, var(--primary) 5%, transparent)" : "var(--bg)",
                minHeight: 120,
              }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ color: "var(--text-muted)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  {isDragging ? "Drop to add" : images.length > 0 ? "Add more screenshots" : "Paste or drop screenshots"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  or <span style={{ color: "var(--primary)" }}>browse files</span> · PNG, JPG, WebP
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { const files = Array.from(e.target.files ?? []); if (files.length) addImages(files); e.target.value = ""; }}
              />
            </div>

            {/* Image thumbnails */}
            {images.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  {images.length} screenshot{images.length !== 1 ? "s" : ""} added
                </p>
                <div className="flex flex-wrap gap-2">
                  {images.map((img) => (
                    <div key={img.id} className="relative rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)", width: 72, height: 72 }}>
                      <img src={img.preview} alt="Screenshot" className="w-full h-full object-cover" />
                      <button
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: "rgba(0,0,0,0.65)", color: "white" }}
                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Figma URL */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--text)" }}>
                Figma file URL
                <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--text-muted)" }}>(optional)</span>
              </label>
              <input
                placeholder="https://www.figma.com/design/..."
                value={figmaFileUrl}
                onChange={(e) => setFigmaFileUrl(e.target.value)}
              />
              <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                Added to every ticket's Design section as a reference.
              </p>
            </div>

            <TeamStateSelect onTeamChange={setTeamId} onStateChange={setStateId} />

            {error && (
              <p className="text-xs p-3 rounded-lg" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              onClick={handleAnalyse}
              disabled={images.length === 0 || analyseState === "analysing"}
            >
              {analyseState === "analysing" ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  Analyse {images.length > 0 ? `${images.length} screenshot${images.length !== 1 ? "s" : ""}` : "screens"}
                </>
              )}
            </button>

            <div className="rounded-lg p-4 text-sm" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <p className="font-medium mb-2" style={{ color: "var(--text)" }}>Tips</p>
              <ul className="space-y-1.5" style={{ color: "var(--text-muted)" }}>
                <li>• Screenshot your whole Figma artboard — Claude handles the rest</li>
                <li>• Add multiple screenshots for a complete flow</li>
                <li>• Press <kbd className="px-1 py-0.5 rounded text-xs" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>Ctrl+V</kbd> anywhere to paste</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Right panel */}
        <main className="flex-1 md:overflow-auto flex flex-col">
          {analyseState === "idle" && tickets.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "var(--border)", color: "var(--text-muted)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
                  </svg>
                </div>
                <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>No tickets yet</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Drop screenshots on the left and click Analyse.
                </p>
              </div>
            </div>
          )}

          {analyseState === "analysing" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col gap-4 w-full max-w-sm px-6">
                <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>
                  Analysing {images.length} screenshot{images.length !== 1 ? "s" : ""}…
                </h2>
                {ANALYSE_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                      {i < stepIdx ? (
                        <span style={{ color: "#22c55e" }}>✓</span>
                      ) : i === stepIdx ? (
                        <span className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
                      ) : (
                        <span className="w-4 h-4 rounded-full border-2" style={{ borderColor: "var(--border)" }} />
                      )}
                    </div>
                    <span className="text-sm" style={{
                      color: i < stepIdx ? "#22c55e" : i === stepIdx ? "var(--text)" : "var(--text-muted)",
                      fontWeight: i === stepIdx ? 500 : 400,
                    }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analyseState === "done" && tickets.length > 0 && (
            <div className="flex flex-col h-full">
              {/* Toolbar */}
              <div
                className="flex items-center justify-between px-6 py-3 border-b shrink-0 gap-3"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4"
                    style={{ accentColor: "var(--primary)" }}
                  />
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {selected.length} of {tickets.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {allPushed && (
                    <button
                      className="btn-secondary text-sm"
                      onClick={reset}
                    >
                      New batch
                    </button>
                  )}
                  <button
                    className="btn-primary flex items-center gap-2"
                    onClick={handlePushSelected}
                    disabled={pushing || !anyReady || !teamId || !stateId}
                  >
                    {pushing ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Pushing…
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                        Push {selected.filter(t => t.status === "ready").length} ticket{selected.filter(t => t.status === "ready").length !== 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Ticket list */}
              <div className="flex-1 overflow-auto px-6 py-4 flex flex-col gap-3">
                {tickets.map((ticket, idx) => (
                  <div key={ticket.id} className="card overflow-hidden" style={{ opacity: ticket.selected ? 1 : 0.5 }}>
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      onClick={() => setTickets((ts) => ts.map((t) => t.id === ticket.id ? { ...t, expanded: !t.expanded } : t))}
                    >
                      <input
                        type="checkbox"
                        checked={ticket.selected}
                        onChange={(e) => { e.stopPropagation(); setTickets((ts) => ts.map((t) => t.id === ticket.id ? { ...t, selected: !t.selected } : t)); }}
                        disabled={ticket.status === "done" || ticket.status === "pushing"}
                        className="w-4 h-4 shrink-0"
                        style={{ accentColor: "var(--primary)" }}
                      />
                      <span className="text-xs font-mono font-semibold shrink-0 w-6 text-center" style={{ color: "var(--primary)" }}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                          {ticket.title}
                        </p>
                      </div>
                      {ticket.status === "pushing" && (
                        <span className="inline-flex items-center gap-1 text-xs shrink-0" style={{ color: "var(--primary)" }}>
                          <span className="inline-block w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
                          Pushing
                        </span>
                      )}
                      {ticket.status === "done" && (
                        <a href={ticket.issueUrl} target="_blank" rel="noreferrer"
                          className="text-xs font-mono shrink-0" style={{ color: "#22c55e" }}
                          onClick={(e) => e.stopPropagation()}>
                          {ticket.issueId} ↗
                        </a>
                      )}
                      {ticket.status === "error" && (
                        <span className="text-xs shrink-0" style={{ color: "#ef4444" }} title={ticket.errorMsg}>Error</span>
                      )}
                      <span className="text-xs shrink-0 ml-1" style={{ color: "var(--text-muted)" }}>
                        {ticket.expanded ? "▲" : "▼"}
                      </span>
                    </div>

                    {ticket.expanded && (
                      <div className="border-t" style={{ borderColor: "var(--border)" }}>
                        <div className="px-4 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                          <input
                            value={ticket.title}
                            onChange={(e) => setTickets((ts) => ts.map((t) => t.id === ticket.id ? { ...t, title: e.target.value } : t))}
                            className="text-sm font-semibold w-full"
                            style={{ border: "none", padding: 0, background: "transparent", outline: "none" }}
                          />
                        </div>
                        <textarea
                          value={ticket.body}
                          onChange={(e) => setTickets((ts) => ts.map((t) => t.id === ticket.id ? { ...t, body: e.target.value } : t))}
                          className="w-full font-mono text-xs p-4 resize-none"
                          style={{ minHeight: 280, border: "none", background: "var(--bg)", outline: "none", color: "var(--text)" }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
