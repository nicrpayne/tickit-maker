"use client";

import { useEffect, useState } from "react";
import { fetchTeams, fetchStates } from "@/lib/linear";

interface Team { id: string; name: string }
interface State { id: string; name: string; type: string }

interface Props {
  onTeamChange?: (teamId: string) => void;
  onStateChange?: (stateId: string) => void;
  selectedTeamId?: string;
  selectedStateId?: string;
}

export default function TeamStateSelect({ onTeamChange, onStateChange, selectedTeamId, selectedStateId }: Props) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [teamId, setTeamId] = useState(selectedTeamId ?? "");
  const [stateId, setStateId] = useState(selectedStateId ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const key = localStorage.getItem("linear_api_key") ?? "";
    if (!key) { setLoading(false); return; }
    fetchTeams(key)
      .then((t) => { setTeams(t); if (t.length) { setTeamId(t[0].id); onTeamChange?.(t[0].id); } })
      .catch(() => setError("Failed to load teams"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!teamId) return;
    const key = localStorage.getItem("linear_api_key") ?? "";
    fetchStates(key, teamId)
      .then((s) => {
        setStates(s);
        const triage = s.find((x) => x.type === "triage") ?? s[0];
        if (triage) { setStateId(triage.id); onStateChange?.(triage.id); }
      })
      .catch(() => {});
  }, [teamId]);

  if (loading) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading teams…</p>;
  if (error) return <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>;

  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Team</label>
        <select
          value={teamId}
          onChange={(e) => { setTeamId(e.target.value); onTeamChange?.(e.target.value); }}
        >
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>State</label>
        <select
          value={stateId}
          onChange={(e) => { setStateId(e.target.value); onStateChange?.(e.target.value); }}
        >
          {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
    </div>
  );
}
