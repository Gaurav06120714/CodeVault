"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CodeVaultLoader } from "@/components/CodeVaultLoader";
import { PLATFORM_ORDER, platformName } from "@/constants/platforms";

// Build the last-6-months submission bars from a single platform's heatmap
// (timestamp[seconds] -> count). Returns the bars plus the max for scaling.
function buildMonthBars(heatmap: unknown): { bars: { name: string; count: number }[]; max: number } {
  const counts: Record<string, number> = {};
  const hm: Record<string, number> =
    typeof heatmap === "string" ? JSON.parse(heatmap || "{}") : ((heatmap as Record<string, number>) || {});
  Object.entries(hm).forEach(([ts, count]) => {
    const d = new Date(parseInt(ts) * 1000);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    counts[k] = (counts[k] || 0) + (count as number);
  });
  const bars: { name: string; count: number }[] = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    bars.push({ name: d.toLocaleString("default", { month: "short" }), count: counts[k] || 0 });
  }
  return { bars, max: Math.max(1, ...bars.map((b) => b.count)) };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; githubLogin: string; displayName: string | null } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<string>("all");
  const [hoveredCell, setHoveredCell] = useState<{ x: number, y: number, text: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error("Failed to parse user data", e);
    }

    const fetchStats = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${API_URL}/stats`, {
          credentials: 'include'
        });
        
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else if (res.status === 404) {
          router.push("/connect");
        }
      } catch (err) {
        console.warn("Stats API unreachable — is web-backend (:4000) running?", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (isLoading || !user) {
    return <CodeVaultLoader text="Loading deep analytics" />;
  }

  // Stats failed to load (e.g. backend down) — don't spin forever.
  if (!stats) {
    return (
      <div role="alert" style={{ margin: "48px auto", maxWidth: 460, textAlign: "center", padding: 24, borderRadius: 12, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <h2 style={{ margin: "8px 0 4px" }}>Couldn&apos;t load analytics</h2>
        <p style={{ fontSize: 14 }}>The backend (:4000) looks unreachable. Start web-backend and refresh.</p>
      </div>
    );
  }

  // Connected platforms present in the stats, in a stable order.
  const connectedPlatforms = PLATFORM_ORDER.filter((p) => stats.platforms?.[p]);
  // Which platform(s) feed this view — respects the active tab.
  const activeKeys = activePlatform === "all" ? connectedPlatforms : connectedPlatforms.filter((k) => k === activePlatform);
  const showCf = activeKeys.includes("codeforces");
  const showLc = activeKeys.includes("leetcode");

  // --- MERGE DEEP DATA (only for the active platform(s)) ---
  const mergedLanguages: Record<string, number> = {};
  const mergedTopics: Record<string, number> = {};
  const mergedHeatmap: Record<string, number> = {};

  activeKeys.map((k) => stats.platforms[k]).forEach((p: any) => {
    // Merge Heatmap
    if (p.heatmap) {
      const pHeatmap = typeof p.heatmap === 'string' ? JSON.parse(p.heatmap) : p.heatmap;
      Object.entries(pHeatmap).forEach(([ts, count]) => {
        const dateStr = new Date(parseInt(ts) * 1000).toISOString().split('T')[0];
        mergedHeatmap[dateStr] = (mergedHeatmap[dateStr] || 0) + (count as number);
      });
    }

    // Merge Languages
    if (p.languages) {
      if (Array.isArray(p.languages)) { // LeetCode format: [{ languageName, problemsSolved }]
        p.languages.forEach((l: any) => {
          mergedLanguages[l.languageName] = (mergedLanguages[l.languageName] || 0) + l.problemsSolved;
        });
      } else { // Codeforces format: { "C++": 10 }
        Object.entries(p.languages).forEach(([l, c]) => {
          mergedLanguages[l] = (mergedLanguages[l] || 0) + (c as number);
        });
      }
    }
    
    // Merge Topics
    if (p.topics) {
      if (p.topics.advanced) { // LeetCode format: { advanced: [{ tagName, problemsSolved }] }
        const mergeArr = (arr: any[]) => {
          arr.forEach(t => { mergedTopics[t.tagName] = (mergedTopics[t.tagName] || 0) + t.problemsSolved; });
        };
        if (p.topics.advanced) mergeArr(p.topics.advanced);
        if (p.topics.intermediate) mergeArr(p.topics.intermediate);
        if (p.topics.fundamental) mergeArr(p.topics.fundamental);
      } else { // Codeforces format: { "math": 5 }
        Object.entries(p.topics).forEach(([t, c]) => {
          // Capitalize codeforces tags
          const tag = t.charAt(0).toUpperCase() + t.slice(1);
          mergedTopics[tag] = (mergedTopics[tag] || 0) + (c as number);
        });
      }
    }
  });

  // Helper: generate 365 cells from a date→count map
  const buildCells = (hmap: Record<string, number>): { cls: string; count: number; dateStr: string }[] => {
    const cells: { cls: string; count: number; dateStr: string }[] = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dStrLocal = `${year}-${month}-${day}`;
      const dStrUtc = d.toISOString().split('T')[0];
      const count = hmap[dStrUtc] || hmap[dStrLocal] || 0;
      
      let cls = "";
      if (count >= 5) cls = "l4";
      else if (count >= 3) cls = "l3";
      else if (count >= 2) cls = "l2";
      else if (count >= 1) cls = "l1";
      
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      cells.push({ cls, count, dateStr });
    }
    return cells;
  };

  const activeCells = buildCells(mergedHeatmap);

  // Per-platform monthly submission bars (one chart per active platform).
  const perPlatformMonthly = activeKeys.map((k) => ({
    platform: k,
    ...buildMonthBars(stats.platforms?.[k]?.heatmap),
  }));

  // Sort Languages
  const sortedLanguages = Object.entries(mergedLanguages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const topLangCount = sortedLanguages[0]?.[1] || 1;

  // Sort Topics
  const sortedTopics = Object.entries(mergedTopics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const topTopicCount = sortedTopics[0]?.[1] || 1;

  // Process Codeforces Sparkline
  let cfPeak = 0;
  let cfPoints = "";
  let cfLastRating = 0;
  const cfRatingHist = showCf ? (stats.platforms?.codeforces?.ratingHistory || []) : [];
  if (cfRatingHist.length > 0) {
    // Normalize to 320x95 box
    const ratings = cfRatingHist.map((r: any) => r.newRating);
    cfPeak = Math.max(...ratings);
    const minR = Math.min(...ratings, 1000);
    const maxR = Math.max(cfPeak, 2000);
    const range = maxR - minR;
    
    // Take last 10 contests
    const recentHist = cfRatingHist.slice(-10);
    const step = 320 / Math.max(1, recentHist.length - 1);
    
    cfPoints = recentHist.map((r: any, i: number) => {
      const x = i * step;
      const y = 95 - ((r.newRating - minR) / range) * 80; // keep in top part
      return `${x},${y}`;
    }).join(" L");
    
    cfLastRating = recentHist[recentHist.length - 1].newRating;
  }

  const colors = ["var(--brand)", "var(--amber)", "var(--rose)", "#8a8378", "#1f8acb", "#1aa260"];

  return (
    <>
      <div className="filters">
        <div className="seg" role="tablist">
          <button type="button" className={activePlatform === "all" ? "on" : ""} onClick={() => setActivePlatform("all")}>
            All Platforms
          </button>
          {connectedPlatforms.map((p) => (
            <button key={p} type="button" role="tab" aria-selected={activePlatform === p}
              className={activePlatform === p ? "on" : ""} onClick={() => setActivePlatform(p)}>
              {platformName(p)}
            </button>
          ))}
        </div>
      </div>

      <section className="stats" aria-label="Headline analytics">
        <div className="stat">
          <div className="l">Total solved</div>
          <div className="n">{(activePlatform === "all" ? stats?.totalSolved : stats.platforms?.[activePlatform]?.total)?.toLocaleString() || "0"}</div>
          <div className="d">{activePlatform === "all" ? "across all platforms" : `on ${platformName(activePlatform)}`}</div>
        </div>
        {cfRatingHist.length > 0 && (
          <div className="stat">
            <div className="l">CF Rating</div>
            <div className="n">{cfLastRating.toLocaleString()}</div>
            <div className="d pink">Peak {cfPeak.toLocaleString()}</div>
          </div>
        )}
      </section>

      <section className="panel" style={{ marginBottom: 16 }}>
        <h2 className="h">
          Submission activity <span className="tag">last 12 months</span>
        </h2>
        {(() => {
          const legendColors: Record<string, string[]> = {
            all:        ["#efe7df", "#fbd6c6", "#f5a888", "#f0764f", "#d8431f"],
            leetcode:   ["#efe7df", "#ffe4b5", "#ffc14d", "#ffa116", "#d48400"],
            codeforces: ["#efe7df", "#b8ddf5", "#6cb8e6", "#1f8acb", "#14608e"],
            codechef:   ["#efe7df", "#d9c4ac", "#b89070", "#7a5230", "#5a3a1e"],
            hackerrank: ["#efe7df", "#a8e6c3", "#4fcf8a", "#1aa260", "#117a44"],
          };
          const colors = legendColors[activePlatform] || legendColors.all;
          const heatClass = activePlatform === "all" ? "heat" : `heat heat-${activePlatform}`;

          return (
            <>
              <div className={heatClass} role="img" aria-label="Submission heatmap" aria-hidden="true">
                {activeCells.map((c, i) => (
                  <i 
                    key={i} 
                    className={c.cls || undefined} 
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredCell({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                        text: `${c.count} submission${c.count === 1 ? '' : 's'} on ${c.dateStr}`
                      });
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                  ></i>
                ))}
              </div>
              {hoveredCell && (
                <div style={{
                  position: 'fixed',
                  top: hoveredCell.y - 8,
                  left: hoveredCell.x,
                  transform: 'translate(-50%, -100%)',
                  background: 'var(--tooltip-bg, #222)',
                  color: '#fff',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  pointerEvents: 'none',
                  zIndex: 9999,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {hoveredCell.text}
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderWidth: '4px 4px 0',
                    borderStyle: 'solid',
                    borderColor: 'var(--tooltip-bg, #222) transparent transparent transparent'
                  }} />
                </div>
              )}
              <div className="heat-legend">
                Less {colors.map((c, i) => (
                  <i key={i} style={{ background: c }}></i>
                ))} More
              </div>
            </>
          );
        })()}
      </section>

      <div className="grid g-2">
        {perPlatformMonthly.map(({ platform, bars, max }) => (
          <section className="panel" key={platform}>
            <h2 className="h">
              Submissions per month <span className="tag">{platformName(platform)} · last 6 months</span>
            </h2>
            <div className="mbars">
              {bars.map((bar, i) => {
                const h = Math.max(5, (bar.count / max) * 100);
                return (
                  <div key={i} className="col" style={{ flex: 1, minWidth: 40 }}>
                    <div className="bar" style={{ height: `${h}%` }}>
                      <span>{bar.count}</span>
                    </div>
                    <div className="lbl">{bar.name}</div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="grid g-2">
        <section className="panel">
          <h2 className="h">Difficulty mix <span className="tag">LeetCode</span></h2>
          {showLc && stats?.platforms?.leetcode ? (
            <div className="ringwrap">
              <div className="ring" role="img" aria-label="Difficulty breakdown">
                <div className="rc"><b>{stats.platforms.leetcode.total?.toLocaleString() || "0"}</b><span>solved</span></div>
              </div>
              <div className="rleg">
                <div className="r"><span className="sw e"></span> Easy <span className="v">{stats.platforms.leetcode.easy || 0}</span></div>
                <div className="r"><span className="sw m"></span> Medium <span className="v">{stats.platforms.leetcode.medium || 0}</span></div>
                <div className="r"><span className="sw h"></span> Hard <span className="v">{stats.platforms.leetcode.hard || 0}</span></div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              {showLc ? "No LeetCode data." : "Difficulty breakdown is available for LeetCode only."}
            </div>
          )}
        </section>

        <section className="panel">
          <h2 className="h">Languages used</h2>
          {sortedLanguages.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No language data found.</div>
          ) : (
            <div className="hb">
              {sortedLanguages.map(([lang, count], i) => {
                const color = colors[i % colors.length];
                const width = (count / topLangCount) * 100;
                return (
                  <div className="hb-row" key={lang}>
                    <span className="lab"><span className="dot" style={{ background: color }}></span>{lang}</span>
                    <span className="hb-bar"><i style={{ width: `${width}%`, background: color }}></i></span>
                    <span className="v">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="grid g-2">
        <section className="panel">
          <h2 className="h">Topic distribution</h2>
          {sortedTopics.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No topic data found.</div>
          ) : (
            <div className="hb">
              {sortedTopics.map(([topic, count], i) => {
                const color = colors[i % colors.length];
                const width = (count / topTopicCount) * 100;
                return (
                  <div className="hb-row" key={topic}>
                    <span className="lab">{topic}</span>
                    <span className="hb-bar"><i style={{ width: `${width}%`, background: color }}></i></span>
                    <span className="v">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {cfRatingHist.length > 0 && (
          <section className="panel">
            <h2 className="h">Codeforces rating <span className="tag">peak {cfPeak}</span></h2>
            <svg className="spark" viewBox="0 0 320 120" preserveAspectRatio="none" role="img">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#f1543f" stopOpacity="0.25"/>
                  <stop offset="1" stopColor="#f1543f" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d={`M0,95 L${cfPoints} L320,120 L0,120 Z`} fill="url(#g)"/>
              <path d={`M0,95 L${cfPoints}`} fill="none" stroke="#f1543f" strokeWidth="2.5" strokeLinejoin="round"/>
              <circle cx="320" cy={cfPoints.split(' ').pop()?.split(',')[1] || "28"} r="3.5" fill="#f1543f"/>
            </svg>
          </section>
        )}
      </div>
    </>
  );
}
