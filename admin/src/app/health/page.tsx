"use client";

import { useEffect, useState } from "react";
import { AccessDenied } from "../page";

type PlatformResult = {
  name: string;
  status: "up" | "down";
  responseMs: number;
  endpoint: string;
};

const platformIcon: Record<string, string> = {
  LeetCode: "🟠",
  Codeforces: "🔵",
  CodeChef: "⭐",
  HackerRank: "🟢",
};

const platformColor: Record<string, string> = {
  LeetCode: "#ffa116",
  Codeforces: "#1890ff",
  CodeChef: "#5b4638",
  HackerRank: "#00ea64",
};

export default function HealthPage() {
  const [results, setResults] = useState<PlatformResult[]>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const [checking, setChecking] = useState(false);

  const load = () => {
    setChecking(true);
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { results: PlatformResult[]; checkedAt: string }) => {
        setResults(d.results);
        setCheckedAt(d.checkedAt);
        setState("ok");
        setChecking(false);
      })
      .catch(() => { setState("denied"); setChecking(false); });
  };

  useEffect(() => { load(); }, []);

  if (state === "denied") return <AccessDenied />;

  const allUp = results.length > 0 && results.every((r) => r.status === "up");
  const someDown = results.some((r) => r.status === "down");

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h1 className="admin-page-title">Platform Health</h1>
        <button className="admin-btn admin-btn-primary" onClick={load} disabled={checking}>
          {checking ? "Checking…" : "🔄 Check Now"}
        </button>
      </div>
      <p className="admin-page-subtitle">
        Live status of coding platform APIs.
        {checkedAt && <span> Last checked: {new Date(checkedAt).toLocaleTimeString("en-GB")}</span>}
      </p>

      {/* Overall Status Banner */}
      {state === "ok" && (
        <div className="admin-card" style={{
          marginBottom: 20,
          background: allUp ? "rgba(0,206,201,0.08)" : someDown ? "rgba(255,107,107,0.08)" : "var(--surface)",
          borderColor: allUp ? "var(--green)" : someDown ? "var(--red)" : "var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <div style={{ fontSize: 32 }}>{allUp ? "✅" : someDown ? "🚨" : "⏳"}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {allUp ? "All systems operational" : someDown ? "Some platforms are down" : "Checking…"}
            </div>
            <div style={{ color: "var(--text2)", fontSize: 13 }}>
              {results.filter((r) => r.status === "up").length}/{results.length} platforms responding
            </div>
          </div>
        </div>
      )}

      {/* Platform Cards */}
      {state === "loading" ? (
        <div className="loading">Checking platform health…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {results.map((r) => (
            <div key={r.name} className="health-card" style={{
              borderColor: r.status === "up" ? "var(--border)" : "var(--red)",
            }}>
              <div className="health-icon" style={{
                background: `${platformColor[r.name] || "var(--accent)"}20`,
                color: platformColor[r.name] || "var(--accent)",
              }}>
                {platformIcon[r.name] || "📦"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", wordBreak: "break-all" }}>{r.endpoint}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ marginBottom: 4 }}>
                  <span className={`badge ${r.status === "up" ? "badge-green" : "badge-red"}`} style={{ fontSize: 13, padding: "4px 12px" }}>
                    {r.status === "up" ? "🟢 Up" : "🔴 Down"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>
                  {r.responseMs}ms
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
