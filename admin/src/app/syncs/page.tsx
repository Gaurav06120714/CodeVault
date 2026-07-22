"use client";

import { useEffect, useState } from "react";
import { AccessDenied } from "../page";

type SyncItem = {
  id: string;
  status: string;
  trigger: string;
  itemsFetched: number;
  itemsPushed: number;
  errorCode: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  user: { id: string; displayName: string | null; githubLogin: string | null; handle: string; avatarUrl: string | null };
  connection: { platform: string; username: string };
};

const statusBadge: Record<string, string> = {
  success: "badge-green",
  running: "badge-blue",
  queued: "badge-gray",
  failed: "badge-red",
  partial: "badge-amber",
  expired: "badge-gray",
};

const platformIcon: Record<string, string> = {
  leetcode: "🟠",
  codeforces: "🔵",
  codechef: "⭐",
  hackerrank: "🟢",
};

const FILTERS = ["", "queued", "running", "success", "partial", "failed"];
const FILTER_LABELS: Record<string, string> = { "": "All", queued: "Queued", running: "Running", success: "Success", partial: "Partial", failed: "Failed" };

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function duration(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function SyncsPage() {
  const [items, setItems] = useState<SyncItem[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [filter, setFilter] = useState("");
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const take = 25;

  const load = (status: string, offset: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("skip", String(offset));
    fetch(`/admin/api/syncs?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { items: SyncItem[]; total: number }) => {
        setItems(d.items);
        setTotal(d.total);
        setState("ok");
      })
      .catch(() => setState("denied"));
  };

  useEffect(() => load("", 0), []);

  if (state === "denied") return <AccessDenied />;

  return (
    <section>
      <h1 className="admin-page-title">Sync Monitoring</h1>
      <p className="admin-page-subtitle">All sync runs across all users — filter by status.</p>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => { setFilter(f); setSkip(0); load(f, 0); }}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Trigger</th>
              <th>Fetched</th>
              <th>Pushed</th>
              <th>Duration</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {state === "loading" ? (
              <tr><td colSpan={8} className="loading">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-icon">🔄</div>
                <div>No sync runs found.</div>
              </td></tr>
            ) : (
              items.map((s) => (
                <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => window.location.href = `/users/${s.user.id}`}>
                  <td>
                    <div className="user-cell">
                      {s.user.avatarUrl ? (
                        <img src={s.user.avatarUrl} alt="" className="avatar" />
                      ) : (
                        <div className="avatar" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--text2)" }}>
                          {(s.user.displayName || s.user.handle || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="user-cell-name">{s.user.displayName || s.user.githubLogin || s.user.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span>{platformIcon[s.connection.platform] || "📦"} {s.connection.platform}</span>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>{s.connection.username}</div>
                  </td>
                  <td>
                    <span className={`badge ${statusBadge[s.status] || "badge-gray"}`}>{s.status}</span>
                    {s.errorCode && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 2 }}>{s.errorCode}</div>}
                  </td>
                  <td><span className={`badge ${s.trigger === "manual" ? "badge-blue" : "badge-gray"}`}>{s.trigger}</span></td>
                  <td>{s.itemsFetched}</td>
                  <td>{s.itemsPushed}</td>
                  <td style={{ color: "var(--text2)", fontSize: 12 }}>{duration(s.startedAt, s.finishedAt)}</td>
                  <td style={{ color: "var(--text2)", fontSize: 12 }}>{formatDate(s.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > take && (
        <div className="pagination">
          <span>Showing {skip + 1}–{Math.min(skip + take, total)} of {total}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="admin-btn" disabled={skip === 0} onClick={() => { const s = Math.max(0, skip - take); setSkip(s); load(filter, s); }}>← Prev</button>
            <button className="admin-btn" disabled={skip + take >= total} onClick={() => { const s = skip + take; setSkip(s); load(filter, s); }}>Next →</button>
          </div>
        </div>
      )}
    </section>
  );
}
