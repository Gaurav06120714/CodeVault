"use client";

import { useEffect, useState } from "react";

type Overview = {
  users: number;
  admins: number;
  activeSubscriptions: number;
  payments: number;
  problemsSynced: number;
  syncRuns: number;
  failedSyncs: number;
  revenueMinor: number;
  recentSignups: { id: string; displayName: string | null; githubLogin: string | null; handle: string; avatarUrl: string | null; createdAt: string }[];
  recentSyncs: { id: string; status: string; trigger: string; itemsFetched: number; itemsPushed: number; errorCode: string | null; createdAt: string; user: { displayName: string | null; githubLogin: string | null; handle: string }; connection: { platform: string } }[];
};

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const statusColor: Record<string, string> = {
  success: "var(--green)",
  running: "var(--blue)",
  queued: "var(--text2)",
  failed: "var(--red)",
  partial: "var(--amber)",
  expired: "var(--text2)",
};

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    fetch("/admin/api/overview")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Overview) => { setData(d); setState("ok"); })
      .catch(() => setState("denied"));
  }, []);

  if (state === "denied") return <AccessDenied />;
  if (!data) return <div className="loading">Loading…</div>;

  const kpis: { label: string; value: string; icon: string; color: string }[] = [
    { label: "Total Users", value: data.users.toLocaleString(), icon: "👥", color: "var(--blue)" },
    { label: "Admins", value: data.admins.toLocaleString(), icon: "🛡️", color: "var(--accent2)" },
    { label: "Problems Synced", value: data.problemsSynced.toLocaleString(), icon: "💻", color: "var(--green)" },
    { label: "Total Syncs", value: data.syncRuns.toLocaleString(), icon: "🔄", color: "var(--blue)" },
    { label: "Failed Syncs", value: data.failedSyncs.toLocaleString(), icon: "⚠️", color: data.failedSyncs > 0 ? "var(--red)" : "var(--green)" },
    { label: "Revenue", value: `₹${(data.revenueMinor / 100).toLocaleString()}`, icon: "💰", color: "var(--amber)" },
  ];

  return (
    <section>
      <h1 className="admin-page-title">Overview</h1>
      <p className="admin-page-subtitle">System KPIs across users, billing, and sync.</p>

      <div className="kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-icon" style={{ background: `${k.color}20`, color: k.color }}>{k.icon}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Recent Signups */}
        <div className="admin-card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Recent Signups</div>
          {data.recentSignups.length === 0 ? (
            <div style={{ color: "var(--text2)", fontSize: 13 }}>No users yet.</div>
          ) : (
            data.recentSignups.map((u) => (
              <div key={u.id} className="activity-item">
                <div className="activity-dot" style={{ background: "var(--green)" }} />
                <div>
                  <span style={{ fontWeight: 600 }}>{u.displayName || u.githubLogin || u.handle}</span>
                  <span style={{ color: "var(--text2)", fontSize: 12, marginLeft: 6 }}>@{u.githubLogin || u.handle}</span>
                </div>
                <span className="activity-time">{timeAgo(u.createdAt)}</span>
              </div>
            ))
          )}
        </div>

        {/* Recent Syncs */}
        <div className="admin-card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Recent Syncs</div>
          {data.recentSyncs.length === 0 ? (
            <div style={{ color: "var(--text2)", fontSize: 13 }}>No syncs yet.</div>
          ) : (
            data.recentSyncs.map((s) => (
              <div key={s.id} className="activity-item">
                <div className="activity-dot" style={{ background: statusColor[s.status] || "var(--text2)" }} />
                <div>
                  <span style={{ fontWeight: 600 }}>{s.user.displayName || s.user.githubLogin || s.user.handle}</span>
                  <span style={{ fontSize: 12, color: "var(--text2)", marginLeft: 6 }}>{s.connection.platform} · {s.status}</span>
                  {s.errorCode && <span style={{ fontSize: 11, color: "var(--red)", marginLeft: 6 }}>({s.errorCode})</span>}
                </div>
                <span className="activity-time">{timeAgo(s.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export function AccessDenied() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">🔒</div>
      <h2 style={{ color: "var(--text)" }}>Access denied</h2>
      <p>This console is restricted to CodeVault owners. Sign in to the main app first.</p>
      <a href="http://localhost:3000/login" className="admin-btn admin-btn-primary" style={{ display: "inline-block", marginTop: 12, textDecoration: "none" }}>
        Go to sign-in →
      </a>
    </div>
  );
}
