import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CodeVault Admin",
  description: "Owner-only admin console.",
};

const nav: [string, string, string][] = [
  ["/", "📊", "Overview"],
  ["/users", "👥", "Users"],
  ["/syncs", "🔄", "Syncs"],
  ["/logs", "📋", "Logs"],
  ["/health", "💚", "Platform Health"],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; }
          :root {
            --bg: #f5f6fa;
            --sidebar: #ffffff;
            --surface: #ffffff;
            --surface2: #f0f1f5;
            --border: #e2e4ea;
            --text: #1a1d2e;
            --text2: #6b7194;
            --accent: #6c5ce7;
            --accent2: #5a4bd1;
            --green: #10b981;
            --red: #ef4444;
            --amber: #f59e0b;
            --blue: #3b82f6;
          }
          body {
            margin: 0;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: var(--bg);
            color: var(--text);
            -webkit-font-smoothing: antialiased;
          }
          .admin-shell { display: flex; min-height: 100vh; }
          .admin-sidebar {
            width: 220px;
            background: var(--sidebar);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            padding: 0;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 10;
            box-shadow: 1px 0 6px rgba(0,0,0,0.04);
          }
          .admin-logo {
            padding: 20px 18px;
            border-bottom: 1px solid var(--border);
            font-size: 14px;
            font-weight: 700;
            letter-spacing: -0.3px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .admin-logo-badge {
            background: var(--accent);
            color: #fff;
            font-size: 9px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .admin-nav { padding: 12px 10px; flex: 1; }
          .admin-nav a {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 8px;
            color: var(--text2);
            text-decoration: none;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.15s;
            margin-bottom: 2px;
          }
          .admin-nav a:hover {
            background: var(--surface2);
            color: var(--text);
          }
          .admin-nav-icon { font-size: 16px; width: 20px; text-align: center; }
          .admin-main {
            flex: 1;
            margin-left: 220px;
            padding: 28px 32px;
            min-height: 100vh;
          }
          .admin-page-title {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 4px;
            letter-spacing: -0.5px;
          }
          .admin-page-subtitle {
            color: var(--text2);
            font-size: 13px;
            margin: 0 0 24px;
          }
          .admin-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 18px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          }
          .admin-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          .admin-table thead tr {
            border-bottom: 1px solid var(--border);
          }
          .admin-table th {
            text-align: left;
            padding: 10px 14px;
            color: var(--text2);
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .admin-table td {
            padding: 12px 14px;
            border-bottom: 1px solid var(--border);
          }
          .admin-table tbody tr:hover {
            background: var(--surface2);
          }
          .admin-table tbody tr:last-child td {
            border-bottom: none;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.2px;
          }
          .badge-green { background: #ecfdf5; color: #059669; }
          .badge-red { background: #fef2f2; color: #dc2626; }
          .badge-amber { background: #fffbeb; color: #d97706; }
          .badge-blue { background: #eff6ff; color: #2563eb; }
          .badge-purple { background: #f5f3ff; color: #7c3aed; }
          .badge-gray { background: #f3f4f6; color: #6b7280; }
          .admin-btn {
            padding: 8px 16px;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--text);
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
            font-family: inherit;
          }
          .admin-btn:hover { background: var(--surface2); }
          .admin-btn-primary {
            background: var(--accent);
            border-color: var(--accent);
            color: #fff;
          }
          .admin-btn-primary:hover { opacity: 0.85; }
          .admin-btn-danger {
            background: #fef2f2;
            border-color: #fca5a5;
            color: #dc2626;
          }
          .admin-btn-danger:hover { background: #fee2e2; }
          .admin-input {
            padding: 9px 14px;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--text);
            font-size: 13px;
            font-family: inherit;
            outline: none;
            transition: border 0.15s;
          }
          .admin-input:focus { border-color: var(--accent); }
          .admin-input::placeholder { color: var(--text2); }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 14px;
            margin-bottom: 28px;
          }
          .kpi-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 18px;
          }
          .kpi-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--text2);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .kpi-value {
            font-size: 28px;
            font-weight: 800;
            margin-top: 6px;
            letter-spacing: -1px;
          }
          .kpi-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            margin-bottom: 10px;
          }
          .filter-bar {
            display: flex;
            gap: 6px;
            margin-bottom: 18px;
            flex-wrap: wrap;
          }
          .filter-btn {
            padding: 6px 14px;
            border-radius: 20px;
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text2);
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
            font-family: inherit;
          }
          .filter-btn:hover { background: var(--surface); color: var(--text); }
          .filter-btn.active {
            background: var(--accent);
            border-color: var(--accent);
            color: #fff;
          }
          .detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
          }
          .detail-section { margin-bottom: 24px; }
          .detail-section-title {
            font-size: 14px;
            font-weight: 700;
            margin: 0 0 12px;
            letter-spacing: -0.3px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid var(--border);
            font-size: 13px;
          }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: var(--text2); }
          .health-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 22px;
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .health-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
          }
          .tabs {
            display: flex;
            gap: 0;
            border-bottom: 1px solid var(--border);
            margin-bottom: 18px;
          }
          .tab {
            padding: 10px 20px;
            border: none;
            background: none;
            color: var(--text2);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.15s;
            font-family: inherit;
          }
          .tab:hover { color: var(--text); }
          .tab.active {
            color: var(--accent2);
            border-bottom-color: var(--accent);
          }
          .pagination {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 0 0;
            font-size: 12px;
            color: var(--text2);
          }
          .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
            background: var(--surface2);
          }
          .user-cell {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .user-cell-name { font-weight: 600; }
          .user-cell-handle { font-size: 11px; color: var(--text2); }
          .activity-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 0;
            border-bottom: 1px solid var(--border);
            font-size: 13px;
          }
          .activity-item:last-child { border-bottom: none; }
          .activity-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
          }
          .activity-time {
            margin-left: auto;
            color: var(--text2);
            font-size: 11px;
            white-space: nowrap;
          }
          .empty-state {
            text-align: center;
            padding: 48px 20px;
            color: var(--text2);
          }
          .empty-state-icon { font-size: 36px; margin-bottom: 8px; }
          .back-link {
            color: var(--text2);
            text-decoration: none;
            font-size: 13px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-bottom: 18px;
            transition: color 0.15s;
          }
          .back-link:hover { color: var(--text); }
          .user-header {
            display: flex;
            align-items: center;
            gap: 18px;
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border);
          }
          .user-header-avatar {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            object-fit: cover;
            background: var(--surface2);
          }
          .user-header-name {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .user-header-badges { display: flex; gap: 6px; margin-top: 4px; }
          .actions-row { display: flex; gap: 8px; margin-top: 8px; }
          .loading {
            color: var(--text2);
            padding: 40px;
            text-align: center;
            font-size: 13px;
          }
        `}</style>
      </head>
      <body>
        <div className="admin-shell">
          <aside className="admin-sidebar">
            <div className="admin-logo">
              🔐 CodeVault
              <span className="admin-logo-badge">Admin</span>
            </div>
            <nav className="admin-nav">
              {nav.map(([href, icon, label]) => (
                <a key={href} href={href}>
                  <span className="admin-nav-icon">{icon}</span>
                  {label}
                </a>
              ))}
            </nav>
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text2)' }}>
              Owner console · port 3100
            </div>
          </aside>
          <main className="admin-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
