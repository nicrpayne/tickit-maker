"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import LinearKeyModal from "@/components/LinearKeyModal";
import TeamStateSelect from "@/components/TeamStateSelect";
import { POWER_PORTAL_TICKETS } from "@/data/tickets";
import { createIssue } from "@/lib/linear";

type TicketStatus = "ready" | "pushing" | "done" | "error";

interface TicketState {
  id: string;
  title: string;
  body: string;
  selected: boolean;
  status: TicketStatus;
  issueId?: string;
  issueUrl?: string;
  errorMsg?: string;
}

function recordActivity(issue: { id: string; identifier: string; title: string; url: string }) {
  const existing = JSON.parse(localStorage.getItem("pushed_activity") ?? "[]");
  const updated = [{ ...issue, pushedAt: new Date().toISOString() }, ...existing].slice(0, 50);
  localStorage.setItem("pushed_activity", JSON.stringify(updated));
}

export default function PusherPage() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [tickets, setTickets] = useState<TicketState[]>(
    POWER_PORTAL_TICKETS.map((t) => ({ ...t, selected: true, status: "ready" }))
  );
  const [teamId, setTeamId] = useState("");
  const [stateId, setStateId] = useState("");
  const [pushing, setPushing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const key = localStorage.getItem("linear_api_key");
    setHasKey(!!key);
  }, []);

  const selected = tickets.filter((t) => t.selected);
  const allSelected = tickets.every((t) => t.selected);
  const someSelected = tickets.some((t) => t.selected);

  function toggleAll() {
    setTickets((ts) => ts.map((t) => ({ ...t, selected: !allSelected })));
  }

  function toggleTicket(id: string) {
    setTickets((ts) => ts.map((t) => t.id === id ? { ...t, selected: !t.selected } : t));
  }

  async function pushSelected() {
    const key = localStorage.getItem("linear_api_key") ?? "";
    if (!key || !teamId || !stateId || !someSelected) return;
    setPushing(true);

    for (const ticket of tickets.filter((t) => t.selected && t.status === "ready")) {
      setTickets((ts) => ts.map((t) => t.id === ticket.id ? { ...t, status: "pushing" } : t));
      try {
        const issue = await createIssue(key, {
          title: ticket.title,
          description: ticket.body,
          teamId,
          stateId,
        });
        recordActivity(issue);
        setTickets((ts) =>
          ts.map((t) =>
            t.id === ticket.id
              ? { ...t, status: "done", issueId: issue.identifier, issueUrl: issue.url }
              : t
          )
        );
      } catch (err) {
        setTickets((ts) =>
          ts.map((t) =>
            t.id === ticket.id
              ? { ...t, status: "error", errorMsg: (err as Error).message }
              : t
          )
        );
      }
    }
    setPushing(false);
  }

  if (hasKey === null) return null;

  const statusBadge = (t: TicketState) => {
    if (t.status === "pushing") return (
      <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--primary)" }}>
        <span className="inline-block w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        Pushing…
      </span>
    );
    if (t.status === "done") return (
      <a href={t.issueUrl} target="_blank" rel="noreferrer" className="text-xs font-mono" style={{ color: "#22c55e" }}>
        {t.issueId} ↗
      </a>
    );
    if (t.status === "error") return (
      <span className="text-xs" style={{ color: "#ef4444" }} title={t.errorMsg}>Error</span>
    );
    return null;
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {hasKey === false && <LinearKeyModal onConnect={() => setHasKey(true)} />}
      <Nav />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/" className="text-xs flex items-center gap-1 mb-6" style={{ color: "var(--text-muted)" }}>← Dashboard</Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Ticket pusher</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Select tickets and push them to Linear in one go.
            </p>
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={pushSelected}
            disabled={pushing || !someSelected || !teamId || !stateId}
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
                Push {someSelected ? `${selected.length} ticket${selected.length !== 1 ? "s" : ""}` : "selected"}
              </>
            )}
          </button>
        </div>

        <div className="card mb-4 p-4">
          <TeamStateSelect onTeamChange={setTeamId} onStateChange={setStateId} />
        </div>

        <div className="card divide-y overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 px-4 py-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 rounded"
              style={{ accentColor: "var(--primary)", width: "1rem", height: "1rem" }}
            />
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {someSelected ? `${selected.length} of ${tickets.length} selected` : "Select all"}
            </span>
          </div>

          {tickets.map((ticket) => (
            <div key={ticket.id}>
              <div
                className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                onClick={() => setExpanded(expanded === ticket.id ? null : ticket.id)}
              >
                <input
                  type="checkbox"
                  checked={ticket.selected}
                  onChange={(e) => { e.stopPropagation(); toggleTicket(ticket.id); }}
                  disabled={ticket.status === "done" || ticket.status === "pushing"}
                  className="mt-0.5 w-4 h-4"
                  style={{ accentColor: "var(--primary)" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: ticket.status === "done" ? "var(--text-muted)" : "var(--text)" }}
                    >
                      {ticket.title}
                    </span>
                    {statusBadge(ticket)}
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                    {ticket.body.split("\n")[0].replace(/^#+\s*/, "")}
                  </p>
                </div>
                <span className="text-xs mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }}>
                  {expanded === ticket.id ? "▲" : "▼"}
                </span>
              </div>
              {expanded === ticket.id && (
                <div
                  className="px-4 py-3 border-t"
                  style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                >
                  <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {ticket.body}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
