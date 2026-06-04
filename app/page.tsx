"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import LinearKeyModal from "@/components/LinearKeyModal";
import { fetchViewer, fetchTeams } from "@/lib/linear";

interface Activity {
  id: string;
  identifier: string;
  title: string;
  url: string;
  pushedAt: string;
}

export default function Dashboard() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [viewerName, setViewerName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    const key = localStorage.getItem("linear_api_key");
    if (!key) { setHasKey(false); return; }
    setHasKey(true);
    loadUser(key);
    const stored = localStorage.getItem("pushed_activity");
    if (stored) setActivity(JSON.parse(stored));
  }, []);

  async function loadUser(key: string) {
    try {
      const viewer = await fetchViewer(key);
      setViewerName(viewer.name);
    } catch {}
    try {
      const teams = await fetchTeams(key);
      if (teams[0]) setWorkspaceName(teams[0].name.split(" ")[0] + " workspace");
    } catch {}
  }

  function handleConnect(key: string) {
    setHasKey(true);
    loadUser(key);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const cards = [
    {
      href: "/bulk",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
        </svg>
      ),
      title: "Screen analyser",
      description: "Screenshot your Figma artboard and Claude generates a ticket for every screen it finds.",
      meta: "Bulk · Powered by Claude",
    },
    {
      href: "/generator",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
      ),
      title: "Single generator",
      description: "Paste a Figma frame URL and Claude drafts one fully structured ticket with precision.",
      meta: "Single frame · Powered by Claude",
    },
    {
      href: "/templates",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
      ),
      title: "Template library",
      description: "Save and reuse ticket structures across your team. Standardise your formats.",
      meta: "3 default templates",
    },
  ];

  if (hasKey === null) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {hasKey === false && <LinearKeyModal onConnect={handleConnect} />}
      <Nav />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          {workspaceName && (
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--primary)" }}>
              {workspaceName}
            </p>
          )}
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>
            {greeting}{viewerName ? `, ${viewerName.split(" ")[0]}` : ""}.
          </h1>
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            What would you like to build today?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="block group">
              <div
                className="card p-6 flex flex-col gap-4 h-full transition-all cursor-pointer"
                style={{ minHeight: 200 }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}
                >
                  {card.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>{card.title}</h2>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{card.description}</p>
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{card.meta}</span>
              </div>
            </Link>
          ))}
        </div>

        {activity.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)" }}>Recent activity</h2>
            <div className="card divide-y" style={{ borderColor: "var(--border)" }}>
              {activity.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono shrink-0" style={{ color: "var(--primary)" }}>
                      {item.identifier}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm truncate hover:underline"
                      style={{ color: "var(--text)" }}
                    >
                      {item.title}
                    </a>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                    {new Date(item.pushedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activity.length === 0 && hasKey && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No activity yet — push your first ticket to see it here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
