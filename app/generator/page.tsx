"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import LinearKeyModal from "@/components/LinearKeyModal";
import TicketPreview from "@/components/TicketPreview";
import TeamStateSelect from "@/components/TeamStateSelect";
import { parseFigmaUrl } from "@/lib/figma";
import { createIssue, fetchTeams } from "@/lib/linear";

type GenState = "idle" | "generating" | "done";

const GENERATION_STEPS = [
  "Reading Figma frames",
  "Extracting layers & annotations",
  "Drafting ticket structure",
  "Writing acceptance criteria",
];

function recordActivity(issue: { id: string; identifier: string; title: string; url: string }) {
  const existing = JSON.parse(localStorage.getItem("pushed_activity") ?? "[]");
  const updated = [{ ...issue, pushedAt: new Date().toISOString() }, ...existing].slice(0, 50);
  localStorage.setItem("pushed_activity", JSON.stringify(updated));
}

export default function GeneratorPage() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [figmaUrl, setFigmaUrl] = useState("");
  const [genState, setGenState] = useState<GenState>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [teamId, setTeamId] = useState("");
  const [stateId, setStateId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [pushing, setPushing] = useState(false);
  const [successId, setSuccessId] = useState("");
  const [successUrl, setSuccessUrl] = useState("");
  const [fetchingFigma, setFetchingFigma] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");

  useEffect(() => {
    const key = localStorage.getItem("linear_api_key");
    setHasKey(!!key);
  }, []);

  async function handleFetch() {
    const parsed = parseFigmaUrl(figmaUrl);
    if (!parsed) { setError("Invalid Figma URL. Make sure it includes a node-id parameter."); return; }
    setError("");
    setFetchingFigma(true);
    try {
      const res = await fetch(`/api/generate?action=preview&fileKey=${parsed.fileKey}&nodeId=${encodeURIComponent(parsed.nodeId)}`);
      const data = await res.json();
      if (data.imageUrl) setPreviewImageUrl(data.imageUrl);
    } catch {
      setError("Could not fetch Figma frame. Check the URL and try again.");
    } finally {
      setFetchingFigma(false);
    }
  }

  async function handleGenerate() {
    const parsed = parseFigmaUrl(figmaUrl);
    if (!parsed) { setError("Invalid Figma URL."); return; }
    setError("");
    setGenState("generating");
    setStepIdx(0);

    const stepInterval = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, GENERATION_STEPS.length - 1));
    }, 1200);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey: parsed.fileKey, nodeId: parsed.nodeId }),
      });
      clearInterval(stepInterval);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `API error ${res.status}`);
      }
      const data = await res.json();
      setTitle(data.title ?? "Untitled ticket");
      setBody((data.body ?? "").replace("[Figma embed link — provided by the caller]", figmaUrl));
      setGenState("done");
    } catch (err) {
      clearInterval(stepInterval);
      setError((err as Error).message);
      setGenState("idle");
    }
  }

  async function handlePush() {
    const key = localStorage.getItem("linear_api_key") ?? "";
    if (!key || !teamId || !stateId) return;
    setPushing(true);
    try {
      const issue = await createIssue(key, { title, description: body, teamId, stateId });
      setSuccessId(issue.identifier);
      setSuccessUrl(issue.url);
      recordActivity(issue);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPushing(false);
    }
  }

  async function loadTeamName(id: string) {
    const key = localStorage.getItem("linear_api_key") ?? "";
    try {
      const teams = await fetchTeams(key);
      const t = teams.find((x) => x.id === id);
      if (t) setTeamName(t.name);
    } catch {}
  }

  if (hasKey === null) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {hasKey === false && <LinearKeyModal onConnect={() => setHasKey(true)} />}
      <Nav />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside
          className="w-[420px] shrink-0 border-r flex flex-col"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="p-6 flex flex-col gap-6 flex-1 overflow-auto">
            <div>
              <Link href="/" className="text-xs flex items-center gap-1 mb-6" style={{ color: "var(--text-muted)" }}>
                ← Dashboard
              </Link>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>AI generator</h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Paste a Figma frame URL and Claude will write a structured Linear ticket.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Figma frame URL</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                    </svg>
                  </div>
                  <input
                    className="pl-9"
                    placeholder="https://www.figma.com/design/..."
                    value={figmaUrl}
                    onChange={(e) => setFigmaUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && figmaUrl && handleFetch()}
                  />
                </div>
                <button
                  className="btn-secondary shrink-0"
                  onClick={handleFetch}
                  disabled={!figmaUrl || fetchingFigma}
                >
                  {fetchingFigma ? "Fetching…" : "Fetch"}
                </button>
              </div>
              <button
                className="text-xs text-left"
                style={{ color: "var(--primary)" }}
                onClick={() => {
                  setFigmaUrl("https://www.figma.com/design/example?node-id=1-2");
                }}
              >
                Use a sample frame →
              </button>
            </div>

            {previewImageUrl && (
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                <img src={previewImageUrl} alt="Figma frame preview" className="w-full h-48 object-cover" />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <TeamStateSelect
                onTeamChange={(id) => { setTeamId(id); loadTeamName(id); }}
                onStateChange={setStateId}
              />
            </div>

            {error && (
              <p className="text-xs p-3 rounded-lg" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              onClick={handleGenerate}
              disabled={!figmaUrl || genState === "generating"}
            >
              {genState === "generating" ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                "Generate ticket"
              )}
            </button>

            <div
              className="rounded-lg p-4 text-sm"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <p className="font-medium mb-2" style={{ color: "var(--text)" }}>Tips</p>
              <ul className="space-y-1.5" style={{ color: "var(--text-muted)" }}>
                <li>• Select a specific frame or component, not a whole page</li>
                <li>• Frames with visible text and layers generate better tickets</li>
                <li>• Edit the output before pushing — Claude gives you a head start</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Right panel */}
        <main className="flex-1 overflow-auto flex flex-col">
          {genState === "idle" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "var(--border)", color: "var(--text-muted)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                </div>
                <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>No ticket yet</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Paste a Figma URL on the left and click Generate ticket.
                </p>
              </div>
            </div>
          )}

          {genState === "generating" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col gap-4 w-full max-w-sm">
                <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>Generating your ticket…</h2>
                {GENERATION_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                      {i < stepIdx ? (
                        <span style={{ color: "#22c55e" }}>✓</span>
                      ) : i === stepIdx ? (
                        <span className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
                      ) : (
                        <span className="w-4 h-4 rounded-full border-2" style={{ borderColor: "var(--border)" }} />
                      )}
                    </div>
                    <span
                      className="text-sm"
                      style={{
                        color: i < stepIdx ? "#22c55e" : i === stepIdx ? "var(--text)" : "var(--text-muted)",
                        fontWeight: i === stepIdx ? 500 : 400,
                      }}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {genState === "done" && (
            <div className="flex flex-col h-full">
              <div className="card m-6 flex-1 flex flex-col overflow-hidden">
                <TicketPreview
                  value={body}
                  onChange={setBody}
                  title={title}
                  onTitleChange={setTitle}
                  teamName={teamName}
                  onPush={handlePush}
                  pushing={pushing}
                  successId={successId}
                  successUrl={successUrl}
                  figmaUrl={figmaUrl}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
