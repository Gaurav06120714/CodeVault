"use client";

import { useEffect, useState } from "react";
import { AccessDenied } from "../page";

type AdminUser = {
  id: string;
  githubLogin: string | null;
  handle: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string;
  plan: string;
  createdAt: string;
  deletedAt: string | null;
};

export default function UsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const take = 25;

  const load = (query: string, offset: number) => {
    fetch(`/api/users?query=${encodeURIComponent(query)}&skip=${offset}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { items: AdminUser[]; total: number }) => {
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
      <h1 className="admin-page-title">Users</h1>
      <p className="admin-page-subtitle">All users — search by login, handle, email, or name.</p>

      <form
        onSubmit={(e) => { e.preventDefault(); setSkip(0); load(q, 0); }}
        style={{ display: "flex", gap: 8, marginBottom: 18 }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search users…"
          className="admin-input"
          style={{ flex: 1 }}
        />
        <button type="submit" className="admin-btn admin-btn-primary">Search</button>
      </form>

      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {state === "loading" ? (
              <tr><td colSpan={6} className="loading">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="loading">No users found.</td></tr>
            ) : (
              items.map((u) => (
                <tr
                  key={u.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => window.location.href = `/users/${u.id}`}
                >
                  <td>
                    <div className="user-cell">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="avatar" />
                      ) : (
                        <div className="avatar" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--text2)" }}>
                          {(u.displayName || u.handle || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="user-cell-name">{u.displayName || u.githubLogin || u.handle}</div>
                        <div className="user-cell-handle">@{u.githubLogin || u.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: u.email ? "var(--text)" : "var(--text2)" }}>{u.email || "—"}</td>
                  <td>
                    <span className={`badge ${u.role === "admin" ? "badge-purple" : "badge-gray"}`}>{u.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.plan === "pro" ? "badge-amber" : "badge-gray"}`}>{u.plan}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.deletedAt ? "badge-red" : "badge-green"}`}>
                      {u.deletedAt ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td style={{ color: "var(--text2)" }}>{new Date(u.createdAt).toLocaleDateString("en-GB")}</td>
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
            <button
              className="admin-btn"
              disabled={skip === 0}
              onClick={() => { const s = Math.max(0, skip - take); setSkip(s); load(q, s); }}
            >
              ← Prev
            </button>
            <button
              className="admin-btn"
              disabled={skip + take >= total}
              onClick={() => { const s = skip + take; setSkip(s); load(q, s); }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
