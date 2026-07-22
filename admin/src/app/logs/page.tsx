"use client";

import { useEffect, useState } from "react";
import { AccessDenied } from "../page";

type SyncError = {
  id: string;
  status: string;
  trigger: string;
  errorCode: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  user: { id: string; displayName: string | null; githubLogin: string | null; handle: string };
  connection: { platform: string; username: string };
};

type AuditEntry = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  ip: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  user: { displayName: string | null; githubLogin: string | null; handle: string } | null;
};

const platformIcon: Record<string, string> = {
  leetcode: "🟠",
  codeforces: "🔵",
  codechef: "⭐",
  hackerrank: "🟢",
};

const actionIcon: Record<string, string> = {
  login: "🔑",
  logout: "🚪",
  connect: "🔌",
  disconnect: "🔗",
  authorize: "✅",
  token_refresh: "🔄",
  delete: "🗑️",
  admin: "🛡️",
};

function formatDate(d: string): string {
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function LogsPage() {
  const [tab, setTab] = useState<"errors" | "audit">("errors");
  const [errors, setErrors] = useState<SyncError[]>([]);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const take = 25;

  const load = (type: string, offset: number) => {
    setState("loading");
    fetch(`/admin/api/logs?type=${type}&skip=${offset}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        if (type === "audit") setAudits(d.items);
        else setErrors(d.items);
        setTotal(d.total);
        setState("ok");
      })
      .catch(() => setState("denied"));
  };

  useEffect(() => { load("errors", 0); }, []);

  const switchTab = (t: "errors" | "audit") => {
    setTab(t);
    setSkip(0);
    load(t, 0);
  };

  if (state === "denied") return <AccessDenied />;

  return (
    <section>
      <h1 className="admin-page-title">Logs</h1>
      <p className="admin-page-subtitle">Sync errors and audit trail.</p>

      <div className="tabs">
        <button className={`tab ${tab === "errors" ? "active" : ""}`} onClick={() => switchTab("errors")}>
          ⚠️ Sync Errors
        </button>
        <button className={`tab ${tab === "audit" ? "active" : ""}`} onClick={() => switchTab("audit")}>
          📋 Audit Trail
        </button>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        {tab === "errors" ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Platform</th>
                <th>Error</th>
                <th>Trigger</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {state === "loading" ? (
                <tr><td colSpan={5} className="loading">Loading…</td></tr>
              ) : errors.length === 0 ? (
                <tr><td colSpan={5} className="empty-state" style={{ padding: 40 }}>
                  <div className="empty-state-icon">✅</div>
                  <div>No sync errors — everything is healthy!</div>
                </td></tr>
              ) : (
                errors.map((e) => (
                  <tr key={e.id} style={{ cursor: "pointer" }} onClick={() => window.location.href = `/users/${e.user.id}`}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{e.user.displayName || e.user.githubLogin || e.user.handle}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)" }}>@{e.user.githubLogin || e.user.handle}</div>
                    </td>
                    <td>{platformIcon[e.connection.platform] || "📦"} {e.connection.platform}</td>
                    <td>
                      <span className="badge badge-red">{e.errorCode || "Unknown error"}</span>
                    </td>
                    <td><span className={`badge ${e.trigger === "manual" ? "badge-blue" : "badge-gray"}`}>{e.trigger}</span></td>
                    <td style={{ color: "var(--text2)", fontSize: 12 }}>{formatDate(e.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Target</th>
                <th>IP</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {state === "loading" ? (
                <tr><td colSpan={5} className="loading">Loading…</td></tr>
              ) : audits.length === 0 ? (
                <tr><td colSpan={5} className="empty-state" style={{ padding: 40 }}>
                  <div className="empty-state-icon">📋</div>
                  <div>No audit entries yet.</div>
                </td></tr>
              ) : (
                audits.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.user ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{a.user.displayName || a.user.githubLogin || a.user.handle}</div>
                          <div style={{ fontSize: 11, color: "var(--text2)" }}>@{a.user.githubLogin || a.user.handle}</div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text2)" }}>System</span>
                      )}
                    </td>
                    <td>
                      <span>{actionIcon[a.action] || "📌"} {a.action}</span>
                    </td>
                    <td>
                      {a.targetType && (
                        <span style={{ fontSize: 12 }}>
                          {a.targetType}
                          {a.targetId && <span style={{ color: "var(--text2)", marginLeft: 4 }}>({a.targetId.slice(0, 8)}…)</span>}
                        </span>
                      )}
                      {!a.targetType && <span style={{ color: "var(--text2)" }}>—</span>}
                    </td>
                    <td style={{ color: "var(--text2)", fontFamily: "monospace", fontSize: 12 }}>{a.ip || "—"}</td>
                    <td style={{ color: "var(--text2)", fontSize: 12 }}>{formatDate(a.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {total > take && (
        <div className="pagination">
          <span>Showing {skip + 1}–{Math.min(skip + take, total)} of {total}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="admin-btn" disabled={skip === 0} onClick={() => { const s = Math.max(0, skip - take); setSkip(s); load(tab, s); }}>← Prev</button>
            <button className="admin-btn" disabled={skip + take >= total} onClick={() => { const s = skip + take; setSkip(s); load(tab, s); }}>Next →</button>
          </div>
        </div>
      )}
    </section>
  );
}
