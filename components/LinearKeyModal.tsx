"use client";

import { useState } from "react";

interface Props {
  onConnect: (key: string) => void;
}

export default function LinearKeyModal({ onConnect }: Props) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    const trimmed = key.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: trimmed },
        body: JSON.stringify({ query: "{ viewer { id name } }" }),
      });
      const data = await res.json();
      if (data?.data?.viewer?.id) {
        localStorage.setItem("linear_api_key", trimmed);
        onConnect(trimmed);
      } else {
        setError("Invalid API key. Check your key and try again.");
      }
    } catch {
      setError("Could not reach Linear. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="card w-full max-w-md p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>Kit</span>
            <span className="text-lg font-semibold" style={{ color: "var(--text)" }}>Ticket Maker</span>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--text)", lineHeight: 1.2 }}>
            Ship Linear tickets straight from Figma.
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Connect your Linear account to get started. Your API key is stored only in your browser.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Linear API key
            </label>
            <input
              type="password"
              placeholder="lin_api_••••••••••••••••••••••"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              autoFocus
            />
            {error && (
              <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
            )}
          </div>
          <button
            className="btn-primary w-full py-2.5"
            onClick={handleConnect}
            disabled={loading || !key.trim()}
          >
            {loading ? "Connecting…" : "Connect to Linear"}
          </button>
        </div>

        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Generate your key at{" "}
          <a
            href="https://linear.app/settings/api"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--primary)" }}
          >
            linear.app/settings/api
          </a>
        </p>
      </div>
    </div>
  );
}
