"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AccessDenied } from "../../page";

type Connection = {
  id: string;
  platform: string;
  username: string;
  syncEnabled: boolean;
  tokenStatus: string;
  solvedCount: number;
  lastSyncedAt: string | null;
  createdAt: string;
};

type SyncRun = {
  id: string;
  status: string;
  trigger: string;
  itemsFetched: number;
  itemsPushed: number;
  errorCode: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  connection: { platform: string };
};

type UserDetail = {
  id: string;
  githubLogin: string | null;
  handle: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string;
  plan: string;
  publicProfileEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  connections: Connection[];
  syncRuns: SyncRun[];
  _count: { problems: number; syncRuns: number; followers: number; following: number; notifications: number };
};

type PlatformCount = { platform: string; _count: { id: number } };

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

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [problemsByPlatform, setProblemsByPlatform] = useState<PlatformCount[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "denied" | "not_found">("loading");
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    fetch(`/admin/api/users/${id}`)
      .then((r) => {
        if (r.status === 404) { setState("not_found"); return null; }
        if (!r.ok) { setState("denied"); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setUser(d.user);
        setProblemsByPlatform(d.problemsByPlatform);
        setState("ok");
      })
      .catch(() => setState("denied"));
  };

  useEffect(() => { load(); }, [id]);

  const doAction = async (body: Record<string, string>) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/admin/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) load();
    } finally {
      setActionLoading(false);
    }
  };

  if (state === "denied") return <AccessDenied />;
  if (state === "not_found") return (
    <div className="empty-state">
      <div className="empty-state-icon">🔍</div>
      <h2 style={{ color: "var(--text)" }}>User not found</h2>
      <a href="/users" className="back-link">← Back to users</a>
    </div>
  );
  if (!user) return <div className="loading">Loading…</div>;

  return (
    <section>
      <a href="/users" className="back-link">← Back to users</a>

      {/* User Header */}
      <div className="user-header">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="user-header-avatar" />
        ) : (
          <div className="user-header-avatar" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "var(--text2)" }}>
            {(user.displayName || user.handle || "?")[0].toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div className="user-header-name">{user.displayName || user.githubLogin || user.handle}</div>
          <div style={{ color: "var(--text2)", fontSize: 13, marginTop: 2 }}>
            @{user.githubLogin || user.handle}
            {user.email && <span style={{ marginLeft: 12 }}>· {user.email}</span>}
          </div>
          <div className="user-header-badges">
            <span className={`badge ${user.role === "admin" ? "badge-purple" : "badge-gray"}`}>{user.role}</span>
            <span className={`badge ${user.plan === "pro" ? "badge-amber" : "badge-gray"}`}>{user.plan}</span>
            <span className={`badge ${user.deletedAt ? "badge-red" : "badge-green"}`}>{user.deletedAt ? "Banned" : "Active"}</span>
          </div>
          <div className="actions-row">
            {user.role === "user" ? (
              <button className="admin-btn" disabled={actionLoading} onClick={() => doAction({ role: "admin" })}>
                Promote to Admin
              </button>
            ) : (
              <button className="admin-btn" disabled={actionLoading} onClick={() => doAction({ role: "user" })}>
                Demote to User
              </button>
            )}
            {user.deletedAt ? (
              <button className="admin-btn admin-btn-primary" disabled={actionLoading} onClick={() => doAction({ action: "unban" })}>
                Unban User
              </button>
            ) : (
              <button className="admin-btn admin-btn-danger" disabled={actionLoading} onClick={() => doAction({ action: "ban" })}>
                Ban User
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Problems Synced</div>
          <div className="kpi-value">{user._count.problems}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Syncs</div>
          <div className="kpi-value">{user._count.syncRuns}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Followers</div>
          <div className="kpi-value">{user._count.followers}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Following</div>
          <div className="kpi-value">{user._count.following}</div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Connected Platforms */}
        <div>
          <div className="detail-section">
            <div className="detail-section-title">Connected Platforms</div>
            <div className="admin-card">
              {user.connections.length === 0 ? (
                <div style={{ color: "var(--text2)", fontSize: 13 }}>No platforms connected.</div>
              ) : (
                user.connections.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{platformIcon[c.platform] || "📦"}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.platform}</div>
                        <div style={{ fontSize: 12, color: "var(--text2)" }}>{c.username}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{c.solvedCount} solved</div>
                      <div style={{ fontSize: 11, color: "var(--text2)" }}>Last sync: {formatDate(c.lastSyncedAt)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Problems by Platform */}
          <div className="detail-section">
            <div className="detail-section-title">Problems by Platform</div>
            <div className="admin-card">
              {problemsByPlatform.length === 0 ? (
                <div style={{ color: "var(--text2)", fontSize: 13 }}>No problems synced.</div>
              ) : (
                problemsByPlatform.map((p) => (
                  <div key={p.platform} className="detail-row">
                    <span>{platformIcon[p.platform] || "📦"} {p.platform}</span>
                    <span style={{ fontWeight: 700 }}>{p._count.id}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Syncs */}
        <div>
          <div className="detail-section">
            <div className="detail-section-title">Recent Syncs (last 10)</div>
            <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
              {user.syncRuns.length === 0 ? (
                <div style={{ color: "var(--text2)", fontSize: 13, padding: 18 }}>No syncs yet.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Platform</th>
                      <th>Status</th>
                      <th>Fetched</th>
                      <th>Pushed</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.syncRuns.map((s) => (
                      <tr key={s.id}>
                        <td>{platformIcon[s.connection.platform] || "📦"} {s.connection.platform}</td>
                        <td>
                          <span className={`badge ${statusBadge[s.status] || "badge-gray"}`}>
                            {s.status}
                          </span>
                          {s.errorCode && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 2 }}>{s.errorCode}</div>}
                        </td>
                        <td>{s.itemsFetched}</td>
                        <td>{s.itemsPushed}</td>
                        <td style={{ color: "var(--text2)", fontSize: 12 }}>{formatDate(s.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="detail-section">
            <div className="detail-section-title">Account Info</div>
            <div className="admin-card">
              <div className="detail-row">
                <span className="detail-label">ID</span>
                <span style={{ fontFamily: "monospace", fontSize: 12 }}>{user.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Handle</span>
                <span>@{user.handle}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Public Profile</span>
                <span>{user.publicProfileEnabled ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Joined</span>
                <span>{formatDate(user.createdAt)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Updated</span>
                <span>{formatDate(user.updatedAt)}</span>
              </div>
              {user.deletedAt && (
                <div className="detail-row">
                  <span className="detail-label">Banned At</span>
                  <span style={{ color: "var(--red)" }}>{formatDate(user.deletedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
