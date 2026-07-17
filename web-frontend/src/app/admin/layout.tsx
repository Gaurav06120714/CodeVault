// Admin route-group layout + shell. See /admin/plan.md §2 & §7.
// The real access gate is the backend: every /api/admin/* route is behind requireAuth +
// requireAdmin (owner-only, fails closed with 404). Pages below reflect that — if the API
// denies access, they render an "access denied" state. Non-owners simply see no data.

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#faf7f2", color: "#1a160f", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#1a160f", color: "#fff", padding: "9px 18px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
        🔐 CodeVault Admin <span style={{ fontWeight: 500, opacity: 0.7 }}>· owners only</span>
      </div>
      <div style={{ display: "flex" }}>
        <nav style={{ width: 210, padding: 18, borderRight: "1px solid #ecece4", fontSize: 13, position: "sticky", top: 0, alignSelf: "flex-start" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
            {[
              ["/admin", "📊 Overview"],
              ["/admin/users", "👥 Users"],
              ["/admin/logins", "🔑 Logins & sessions"],
              ["/admin/audit", "📜 Audit log"],
              ["/admin/payments", "💳 Payments"],
              ["/admin/moderation", "🛡 Moderation"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} style={{ display: "block", padding: "8px 10px", borderRadius: 9, color: "#3a352c", textDecoration: "none" }}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <a href="/dashboard" style={{ display: "block", marginTop: 18, fontSize: 12, color: "#6b7280" }}>← Back to app</a>
        </nav>
        <main style={{ flex: 1, padding: 28 }}>{children}</main>
      </div>
    </div>
  );
}
