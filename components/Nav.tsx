"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavProps {
  onDisconnect?: () => void;
}

export default function Nav({ onDisconnect }: NavProps) {
  const pathname = usePathname();
  const [hasKey, setHasKey] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [viewerName, setViewerName] = useState<string | null>(null);

  useEffect(() => {
    const key = localStorage.getItem("linear_api_key");
    setHasKey(!!key);
    const dark = localStorage.getItem("dark_mode") === "1";
    setDarkMode(dark);
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    if (key) fetchViewer(key);
  }, []);

  async function fetchViewer(key: string) {
    try {
      const res = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: key },
        body: JSON.stringify({ query: "{ viewer { name } }" }),
      });
      const data = await res.json();
      if (data?.data?.viewer?.name) setViewerName(data.data.viewer.name);
    } catch {}
  }

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("dark_mode", next ? "1" : "0");
    document.documentElement.classList.toggle("dark", next);
  }

  function disconnect() {
    localStorage.removeItem("linear_api_key");
    setHasKey(false);
    setViewerName(null);
    onDisconnect?.();
    window.location.reload();
  }

  const initials = viewerName
    ? viewerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const navLinks = [
    { href: "/generator", label: "AI generator" },
    { href: "/templates", label: "Templates" },
  ];

  return (
    <nav
      className="sticky top-0 z-40 border-b px-6 flex items-center justify-between h-14"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-sm">
          <span style={{ color: "var(--text)" }}>Tic</span>
          <span style={{ color: "var(--primary)", fontWeight: 700 }}>Kit</span>
          <span style={{ color: "var(--text)" }}>Maker</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 rounded-md text-sm transition-colors"
              style={{
                color: pathname.startsWith(l.href) ? "var(--primary)" : "var(--text-muted)",
                background: pathname.startsWith(l.href) ? "color-mix(in srgb, var(--primary) 8%, transparent)" : "transparent",
                fontWeight: pathname.startsWith(l.href) ? 500 : 400,
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleDark}
          className="w-8 h-8 rounded-md flex items-center justify-center text-sm transition-colors"
          style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          title="Toggle dark mode"
        >
          {darkMode ? "☀" : "◑"}
        </button>

        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: hasKey ? "#22c55e" : "#d1d5db" }}
          />
          <span className="hidden sm:inline text-xs" style={{ color: "var(--text-muted)" }}>
            {hasKey ? "Linear connected" : "Not connected"}
          </span>
        </div>

        {hasKey && (
          <button
            onClick={disconnect}
            className="hidden sm:block text-xs px-2.5 py-1 rounded-md transition-colors"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            Disconnect
          </button>
        )}

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
          style={{ background: "var(--primary)" }}
        >
          {initials}
        </div>
      </div>
    </nav>
  );
}
