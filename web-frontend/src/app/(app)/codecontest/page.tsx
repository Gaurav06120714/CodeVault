"use client";

import { useEffect, useRef, useState } from "react";

/* ─────────── mock data (swap for real APIs later) ─────────── */
const AVCOL = [
  "linear-gradient(135deg,var(--brand),var(--rose))",
  "linear-gradient(135deg,#1f8acb,var(--green))",
  "linear-gradient(135deg,var(--amber),var(--brand))",
  "linear-gradient(135deg,var(--green),#0f7a48)",
];
const platName: Record<string, string> = { cv: "CodeVault", lc: "LeetCode", cf: "Codeforces", cc: "CodeChef", hr: "HackerRank" };
const platAbbr: Record<string, string> = { cv: "CV", lc: "LC", cf: "CF", cc: "CC", hr: "HR" };

type Peep = { name: string; init: string; score: number; solved: number; prog: number; time: string; me?: boolean };
const PARTICIPANTS: Peep[] = [
  { name: "Aishwarya", init: "A", score: 340, solved: 3, prog: 60, time: "4m 02s" },
  { name: "Gaurav", init: "G", score: 240, solved: 2, prog: 40, time: "6m 55s", me: true },
  { name: "Rahul", init: "R", score: 200, solved: 2, prog: 40, time: "2m 10s" },
  { name: "Priya", init: "P", score: 120, solved: 1, prog: 20, time: "8m 40s" },
];
const RECENT = [
  { n: "Array Warmup", plat: "lc", probs: 4, rank: 1, res: "win" },
  { n: "DP Deep Dive", plat: "cf", probs: 6, rank: 3, res: "lost" },
  { n: "Weekly Blitz", plat: "cv", probs: 5, rank: 2, res: "2nd" },
];
const HISTORY = [
  { n: "Array Warmup", d: "Jul 20", plat: "lc", players: 4, rank: 1, res: "win" },
  { n: "DP Deep Dive", d: "Jul 18", plat: "cf", players: 6, rank: 3, res: "lost" },
  { n: "Weekly Blitz", d: "Jul 14", plat: "cv", players: 5, rank: 2, res: "2nd" },
  { n: "Greedy Games", d: "Jul 11", plat: "hr", players: 3, rank: 1, res: "win" },
  { n: "String Sprint", d: "Jul 07", plat: "cc", players: 4, rank: 2, res: "2nd" },
];
const CATALOG = [
  { n: "Number of Islands", d: "med", plat: "lc" },
  { n: "Course Schedule", d: "med", plat: "lc" },
  { n: "Two Sum", d: "easy", plat: "lc" },
  { n: "Dijkstra Shortest Path", d: "hard", plat: "cf" },
  { n: "Merge Intervals", d: "med", plat: "cv" },
  { n: "Binary Search Basics", d: "easy", plat: "hr" },
];

const HINTS: Record<string, Record<string, string>> = {
  explain: {
    beginner: "This asks you to count separate groups of connected '1' cells in a grid. Each group is one island — cells touching up/down/left/right belong together.",
    intermediate: "You're counting connected components in a 2D grid graph. Each land cell is a node; edges connect 4-directional land neighbours.",
    advanced: "Connected-components over an implicit grid graph. Cost is O(R·C); the interesting part is the traversal choice and in-place visited marking.",
  },
  hint: {
    beginner: "Scan every cell. When you find land you haven't visited, that's a new island — then 'flood' outward to mark the rest.",
    intermediate: "Iterate cells; on unvisited land, start a DFS/BFS that sinks the whole island (mark visited), and increment your count once.",
    advanced: "Sink-the-island: mutate the grid to '0' as you visit to avoid a separate visited array. Watch recursion depth on huge grids — prefer BFS.",
  },
  approach: {
    beginner: "1) Loop over cells. 2) If it's land, add 1. 3) Turn that island and its neighbours into water so you don't count them again.",
    intermediate: "For each cell: if land, count++ and run flood-fill (DFS/BFS) marking connected land as visited. Return count.",
    advanced: "DFS (simple, stack risk), BFS (safe depth), or Union-Find (good for streaming/dynamic connectivity). O(R·C) either way.",
  },
  mistake: {
    beginner: "Common slip: counting the same island twice. Mark every connected land cell as visited before moving on.",
    intermediate: "Check bounds and that you only move in 4 directions (not diagonals). Off-by-one on row/col limits is the usual bug.",
    advanced: "If it TLE'd: you may re-scan visited cells or recurse too deep. Convert to iterative BFS and mark visited on enqueue, not dequeue.",
  },
};

type ChatMsg = { who: "ai" | "me"; text: string; label?: string };
type Prob = { n: string; d: string; plat: string };
type Friend = { id: string; init: string };

export default function CodeContestPage() {
  const [tab, setTab] = useState("dash");

  // create contest
  const [cPlat, setCPlat] = useState("cv");
  const [cDur, setCDur] = useState(60);
  const [cUnit, setCUnit] = useState("min");
  const [cDiff, setCDiff] = useState("all");
  const [probs, setProbs] = useState<Prob[]>(CATALOG.slice(0, 4).map((p) => ({ ...p })));
  const [friends, setFriends] = useState<Friend[]>([{ id: "@aishwarya", init: "A" }, { id: "@rahul", init: "R" }]);
  const [inviteIn, setInviteIn] = useState("");
  const [copyTxt, setCopyTxt] = useState("Copy");

  // compare
  const [friendId, setFriendId] = useState("");
  const [cmp, setCmp] = useState<null | { name: string }>(null);

  // AI
  const [aiProb, setAiProb] = useState("Number of Islands (Medium · Graphs)");
  const [aiLevel, setAiLevel] = useState("beginner");
  const [chat, setChat] = useState<ChatMsg[]>([
    { who: "ai", text: "Pick a problem and a hint level, then tap a button. I'll nudge you toward the idea without spoiling it — unless you ask for the full solution. 🙂", label: "Assistant" },
  ]);
  const chatRef = useRef<HTMLDivElement>(null);

  // timer
  const [secs, setSecs] = useState(42 * 60 + 18);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [chat]);

  const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const sorted = [...PARTICIPANTS].sort((a, b) => b.score - a.score);
  const medal = (i: number) => (i < 3 ? ["g1", "g2", "g3"][i] : "");

  const addProblem = () => { if (probs.length < 6) setProbs([...probs, { ...CATALOG[probs.length % CATALOG.length] }]); };
  const addFriend = () => { const v = inviteIn.trim(); if (!v) return; setFriends([...friends, { id: v, init: v.replace("@", "")[0].toUpperCase() }]); setInviteIn(""); };
  const copyLink = () => { navigator.clipboard?.writeText("https://codevault.dev/cc/gr-8fx2").catch(() => {}); setCopyTxt("Copied!"); setTimeout(() => setCopyTxt("Copy"), 1500); };
  const startContest = () => { if (probs.length < 4) { alert("Add at least 4 problems to start."); return; } setTab("live"); };

  const loadFriend = () => {
    const raw = friendId.trim().replace(/^@/, "").replace(/^.*:/, "") || "Aishwarya";
    setCmp({ name: raw.charAt(0).toUpperCase() + raw.slice(1) });
  };

  const aiAsk = (kind: string) => {
    const prob = aiProb.split(" (")[0];
    const qlabel: Record<string, string> = { explain: "Explain", hint: "Hint", approach: "Approach", mistake: "Analyze mistake", solution: "Full solution" };
    const next: ChatMsg[] = [...chat, { who: "me", text: `${qlabel[kind]} · ${prob} · ${aiLevel}` }];
    if (kind === "solution") {
      next.push({ who: "ai", label: "Full solution", text: `Here's the full approach for ${prob} (you asked): iterate the grid; on unvisited land, BFS/DFS to sink the whole island and add 1. Time O(R·C), space O(min(R,C)). Want it in Python or C++?` });
    } else {
      next.push({ who: "ai", label: `${aiLevel} · ${qlabel[kind]}`, text: HINTS[kind][aiLevel] });
    }
    setChat(next);
  };

  const resPill = (r: string) =>
    r === "win" ? <span className="cc-pill ok">🏆 Win</span> : r === "2nd" ? <span className="cc-pill wait">2nd</span> : <span className="cc-pill mut">{r}</span>;

  const cmpRows = () => {
    const me = { solved: 1248, diff: "42/560/148", rating: 1720, streak: "14d", contests: 27, acc: "86%" };
    const fr = { solved: 1360, diff: "55/610/95", rating: 1810, streak: "9d", contests: 31, acc: "82%" };
    const rows: [string, string | number, string | number, boolean][] = [
      ["Problems solved", me.solved, fr.solved, true],
      ["Difficulty (E/M/H)", me.diff, fr.diff, false],
      ["Rating (UCPR)", me.rating, fr.rating, true],
      ["Current streak", me.streak, fr.streak, true],
      ["Contests played", me.contests, fr.contests, true],
      ["Accuracy", me.acc, fr.acc, true],
    ];
    return rows.map(([lab, a, b, num], i) => {
      let aw = "", bw = "";
      if (num) { const pa = parseFloat(String(a)), pb = parseFloat(String(b)); if (pa > pb) aw = "win"; else if (pb > pa) bw = "win"; }
      return (
        <div className="cc-cmprow" key={i}>
          <div className={`v l ${aw}`}>{a}</div><div className="lab">{lab}</div><div className={`v ${bw}`}>{b}</div>
        </div>
      );
    });
  };

  const TABS = [
    ["dash", "Dashboard"], ["create", "Create"], ["live", "Live & Rivalry"], ["history", "History"],
    ["compare", "Compare"], ["analysis", "Post-contest"], ["ai", "AI Assistant"],
  ];

  return (
    <div className="cc-root">
      <style>{CSS}</style>

      {/* internal tab nav */}
      <div className="cc-tabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab === "dash" && (
        <div className="cc-view">
          <div className="cc-stats">
            <div className="cc-stat"><div className="l">🏆 Contests played</div><div className="n">27</div><div className="d">+3 this week</div></div>
            <div className="cc-stat"><div className="l">✅ Wins</div><div className="n">11</div><div className="d" style={{ color: "var(--green)" }}>41% win rate</div></div>
            <div className="cc-stat"><div className="l">⚡ Global rank</div><div className="n">#842</div><div className="d">Top 6%</div></div>
            <div className="cc-stat"><div className="l">🔥 Streak</div><div className="n">14</div><div className="d" style={{ color: "var(--rose-d)" }}>days active</div></div>
          </div>
          <div className="cc-grid g-2">
            <div className="cc-card">
              <h3>Active contest <span className="cc-pill live"><span className="dot" />LIVE</span></h3>
              <div className="desc">Weekend Graph Sprint · CodeVault + LeetCode · 5 problems</div>
              <div className="cc-row" style={{ justifyContent: "space-between" }}>
                <div><div className={`cc-timer ${secs < 300 ? "low" : ""}`}>{fmt(secs)}</div><div className="sub">time remaining</div></div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>2<span style={{ color: "var(--faint)", fontSize: 15 }}>/5 solved</span></div>
                  <div className="cc-pill ok" style={{ marginTop: 6 }}>Rank #2 of 4</div>
                </div>
              </div>
              <button className="cc-btn brand" style={{ marginTop: 16, width: "100%" }} onClick={() => setTab("live")}>Enter contest room →</button>
            </div>
            <div className="cc-card">
              <h3>Live leaderboard</h3><div className="desc">Weekend Graph Sprint</div>
              {sorted.map((p, i) => (
                <div className="cc-pk" key={i} style={{ border: "none", padding: "7px 0", marginBottom: 0 }}>
                  <span className={`cc-rank ${medal(i)}`}>{i + 1}</span>
                  <span className="cc-av" style={{ background: AVCOL[i % 4] }}>{p.init}</span>
                  <span className="nm">{p.name}</span>
                  <span className="mono" style={{ color: "var(--brand-d)", fontWeight: 700 }}>{p.score}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="cc-card">
            <h3>Recent contests</h3>
            <div className="cc-tbl-wrap"><table>
              <thead><tr><th>Contest</th><th>Platform</th><th>Problems</th><th>Rank</th><th>Result</th></tr></thead>
              <tbody>{RECENT.map((r, i) => (
                <tr key={i}><td style={{ fontWeight: 600 }}>{r.n}</td>
                  <td><span className="cc-who"><span className={`cc-plat ${r.plat}`}>{platAbbr[r.plat]}</span>{platName[r.plat]}</span></td>
                  <td className="mono">{r.probs}</td><td className="mono">#{r.rank}</td><td>{resPill(r.res)}</td></tr>
              ))}</tbody>
            </table></div>
          </div>
        </div>
      )}

      {/* ── CREATE ── */}
      {tab === "create" && (
        <div className="cc-view">
          <div className="cc-grid g-2">
            <div className="cc-card">
              <h3>Create a contest</h3><div className="desc">Set up a friendly contest and invite friends.</div>
              <div className="cc-field"><label className="fl">Contest name</label><input className="cc-in" defaultValue="Weekend Graph Sprint" /></div>
              <div className="cc-two">
                <div className="cc-field"><label className="fl">Platform</label>
                  <select className="cc-in" value={cPlat} onChange={(e) => setCPlat(e.target.value)}>
                    {Object.entries(platName).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="cc-field"><label className="fl">Duration</label>
                  <div className="cc-row" style={{ gap: 8 }}>
                    <input className="cc-in" type="number" value={cDur} min={5} onChange={(e) => setCDur(+e.target.value)} style={{ flex: 1 }} />
                    <select className="cc-in" value={cUnit} onChange={(e) => setCUnit(e.target.value)} style={{ width: 110 }}><option value="min">minutes</option><option value="hr">hours</option></select>
                  </div>
                </div>
              </div>
              <div className="cc-field"><label className="fl">Difficulty filter</label>
                <div className="cc-seg">{["all", "easy", "med", "hard"].map((d) => (
                  <button key={d} className={cDiff === d ? "on" : ""} onClick={() => setCDiff(d)}>{d === "all" ? "All" : d === "med" ? "Medium" : d[0].toUpperCase() + d.slice(1)}</button>
                ))}</div>
              </div>
              <div className="cc-field">
                <label className="fl">Problems <span className="sub">(add 4–6)</span></label>
                {probs.length === 0 && <div className="cc-empty" style={{ padding: 14 }}>No problems yet — add 4 to 6.</div>}
                {probs.map((p, i) => (
                  <div className="cc-pk" key={i}><span className={`cc-plat ${p.plat}`}>{platAbbr[p.plat]}</span><span className="nm">{p.n}</span>
                    <span className={`cc-diff ${p.d}`}>{p.d.toUpperCase()}</span>
                    <button className="cc-btn ghost sm" onClick={() => setProbs(probs.filter((_, j) => j !== i))}>✕</button></div>
                ))}
                <button className="cc-btn sm" disabled={probs.length >= 6} onClick={addProblem}>+ Add problem from platform</button>
              </div>
              <div className="cc-field"><label className="fl">Invite friends</label>
                <div className="cc-chipin">
                  {friends.map((f, i) => (
                    <span className="cc-fchip" key={i}><span className="cc-av sm" style={{ background: AVCOL[i % 4] }}>{f.init}</span>{f.id}
                      <span className="x" onClick={() => setFriends(friends.filter((_, j) => j !== i))}>✕</span></span>
                  ))}
                  <input className="cc-in" placeholder="Friend's ID + Enter" value={inviteIn} onChange={(e) => setInviteIn(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFriend(); } }} style={{ flex: 1, minWidth: 170 }} />
                </div>
              </div>
              <button className="cc-btn brand" style={{ width: "100%" }} onClick={startContest}>Open lobby &amp; start</button>
            </div>

            <div className="cc-card">
              <h3>Contest lobby</h3><div className="desc">Preview before you start.</div>
              <div className="cc-row" style={{ gap: 8, flexWrap: "wrap" }}>
                <span className="cc-pill brand"><span className={`cc-plat ${cPlat}`} style={{ width: 16, height: 16, fontSize: 8 }}>{platAbbr[cPlat]}</span>{platName[cPlat]}</span>
                <span className="cc-pill wait">⏱ {cDur} {cUnit}</span>
                <span className="cc-pill ok">{probs.length} problems</span>
              </div>
              <div className="cc-lbl">Participants</div>
              {[{ id: "@gaurav (you)", init: "G" }, ...friends].map((f, i) => (
                <div className="cc-pk" key={i}><span className="cc-av" style={{ background: AVCOL[i % 4] }}>{f.init}</span><span className="nm">{f.id}</span><span className="cc-pill ok">Ready</span></div>
              ))}
              <div className="cc-linkbox">
                <div><div className="cc-lbl" style={{ margin: 0 }}>Shareable invite link</div><div className="mono" style={{ fontSize: 12, color: "var(--brand-d)", marginTop: 3 }}>codevault.dev/cc/gr-8fx2</div></div>
                <button className="cc-btn sm" onClick={copyLink}>📋 {copyTxt}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE ── */}
      {tab === "live" && (
        <div className="cc-view">
          <div className="cc-grid g-2">
            <div className="cc-card">
              <h3>Weekend Graph Sprint <span className="cc-pill live"><span className="dot" />LIVE</span></h3>
              <div className="desc">CodeVault + LeetCode · practice-mode timer</div>
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div className={`cc-timer ${secs < 300 ? "low" : ""}`}>{fmt(secs)}</div><div className="sub">time remaining</div>
              </div>
              <div className="cc-row" style={{ justifyContent: "center", gap: 8 }}>
                <button className="cc-btn sm" onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Resume"}</button>
                <button className="cc-btn sm" onClick={() => { setSecs(42 * 60 + 18); setRunning(true); }}>Restart</button>
              </div>
            </div>
            <div className="cc-card">
              <h3>Your progress</h3><div className="desc">2 of 5 problems solved · 240 pts</div>
              {[["Number of Islands", "med", "solved"], ["Course Schedule", "med", "solved"], ["Word Ladder", "hard", "active"], ["Dijkstra Path", "hard", "todo"], ["Merge Intervals", "med", "todo"]].map(([n, d, s], i) => (
                <div className="cc-pk" key={i}><span className="cc-plat lc">LC</span><span className="nm">{n}</span><span className={`cc-diff ${d}`}>{(d as string).toUpperCase()}</span>
                  {s === "solved" ? <span className="cc-pill ok">Solved</span> : s === "active" ? <span className="cc-pill live"><span className="dot" />Solving</span> : <span className="cc-pill mut">To do</span>}</div>
              ))}
            </div>
          </div>
          <div className="cc-card">
            <h3>Live leaderboard</h3><div className="desc">Rank · score · progress · solved · time</div>
            <div className="cc-tbl-wrap"><table>
              <thead><tr><th>#</th><th>Participant</th><th>Score</th><th>Progress</th><th>Solved</th><th>Time</th></tr></thead>
              <tbody>{sorted.map((p, i) => (
                <tr key={i}><td><span className={`cc-rank ${medal(i)}`}>{i + 1}</span></td>
                  <td><span className="cc-who"><span className="cc-av" style={{ background: AVCOL[i % 4] }}>{p.init}</span>{p.name}{p.me && <span className="cc-pill ok" style={{ marginLeft: 4 }}>You</span>}</span></td>
                  <td className="mono">{p.score}</td>
                  <td><div className="cc-row"><div className="cc-bar" style={{ flex: 1 }}><i style={{ width: `${p.prog}%` }} /></div><span className="mono" style={{ fontSize: 12, color: "var(--faint)" }}>{p.prog}%</span></div></td>
                  <td className="mono">{p.solved}/5</td><td className="mono" style={{ color: "var(--faint)" }}>{p.time}</td></tr>
              ))}</tbody>
            </table></div>
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === "history" && (
        <div className="cc-view">
          <div className="cc-card">
            <h3>Recent contests</h3><div className="desc">Your last contests.</div>
            <div className="cc-tbl-wrap"><table>
              <thead><tr><th>Contest</th><th>Date</th><th>Platform</th><th>Players</th><th>Rank</th><th>Result</th></tr></thead>
              <tbody>{HISTORY.map((h, i) => (
                <tr key={i}><td style={{ fontWeight: 600 }}>{h.n}</td><td className="mono" style={{ color: "var(--faint)" }}>{h.d}</td>
                  <td><span className="cc-who"><span className={`cc-plat ${h.plat}`}>{platAbbr[h.plat]}</span>{platName[h.plat]}</span></td>
                  <td className="mono">{h.players}</td><td className="mono">#{h.rank}</td><td>{resPill(h.res)}</td></tr>
              ))}</tbody>
            </table></div>
          </div>
        </div>
      )}

      {/* ── COMPARE ── */}
      {tab === "compare" && (
        <div className="cc-view">
          <div className="cc-card">
            <h3>Compare with a friend</h3><div className="desc">Enter a CodeVault ID or platform ID to load and compare their data.</div>
            <div className="cc-row" style={{ gap: 8, flexWrap: "wrap" }}>
              <input className="cc-in" placeholder="e.g. @aish or leetcode:aishwarya" value={friendId} onChange={(e) => setFriendId(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
              <button className="cc-btn brand" onClick={loadFriend}>Load &amp; compare</button>
            </div>
          </div>
          {cmp && (
            <div className="cc-card">
              <div className="cc-cmprow" style={{ borderTop: "none" }}>
                <div className="cc-who" style={{ justifyContent: "flex-end" }}><b>Gaurav</b><span className="cc-av" style={{ background: AVCOL[0] }}>G</span></div>
                <div className="lab">vs</div>
                <div className="cc-who"><span className="cc-av" style={{ background: AVCOL[1] }}>{cmp.name[0]}</span><b>{cmp.name}</b></div>
              </div>
              {cmpRows()}
              <div className="cc-lbl">Platform performance</div>
              {([["LeetCode", 612, 680], ["Codeforces", 341, 410], ["CodeChef", 184, 150], ["HackerRank", 111, 120]] as [string, number, number][]).map(([lab, a, b], i) => {
                const max = 680;
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div className="cc-row" style={{ justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}><span style={{ fontWeight: 600 }}>{lab}</span><span className="mono" style={{ color: "var(--faint)" }}>{a} vs {b}</span></div>
                    <div className="cc-row" style={{ gap: 6 }}>
                      <div className="cc-bar" style={{ flex: 1 }}><i style={{ width: `${(a / max) * 100}%`, background: "var(--brand)" }} /></div>
                      <div className="cc-bar" style={{ flex: 1 }}><i style={{ width: `${(b / max) * 100}%`, background: "#1f8acb" }} /></div>
                    </div>
                  </div>
                );
              })}
              <div className="cc-row" style={{ gap: 16, fontSize: 12, marginTop: 4 }}>
                <span className="cc-row" style={{ gap: 6 }}><span className="cc-key" style={{ background: "var(--brand)" }} />You</span>
                <span className="cc-row" style={{ gap: 6 }}><span className="cc-key" style={{ background: "#1f8acb" }} />Friend</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── POST-CONTEST ── */}
      {tab === "analysis" && (
        <div className="cc-view">
          <div className="cc-card">
            <h3>Post-contest analysis</h3><div className="desc">Weekend Graph Sprint · 4 participants · 5 problems</div>
            <div className="cc-lbl">Score over time</div>
            <LineChart series={[
              { name: "Aishwarya", pts: [0, 120, 120, 240, 340] },
              { name: "Gaurav", pts: [0, 100, 180, 180, 240] },
              { name: "Rahul", pts: [0, 0, 100, 200, 200] },
              { name: "Priya", pts: [0, 0, 0, 120, 120] },
            ]} />
          </div>
          <div className="cc-card">
            <h3>Badges awarded</h3><div className="desc">Fun awards from this contest.</div>
            <div className="cc-badges">
              {[["⚡", "Fastest Solve", "Aishwarya · 3m 12s", "var(--brand)"], ["📈", "Most Consistent", "Gaurav · all ≤ 20m", "var(--amber)"], ["🔥", "Best Comeback", "Rahul · last→2nd", "var(--rose)"], ["✨", "Clean Coder", "Priya · 0 wrong subs", "var(--green)"]].map(([e, t, m, c], i) => (
                <div className="cc-badge" key={i}><div className="hex" style={{ background: c }}>{e}</div><div className="bt">{t}</div><div className="bm">{m}</div></div>
              ))}
            </div>
          </div>
          <div className="cc-card">
            <h3>Final standings</h3>
            <div className="cc-tbl-wrap"><table>
              <thead><tr><th>#</th><th>Participant</th><th>Score</th><th>Solved</th><th>Accuracy</th><th>Avg time</th></tr></thead>
              <tbody>{[["Aishwarya", 340, "3/5", "92%", "5m"], ["Gaurav", 240, "2/5", "88%", "7m"], ["Rahul", 200, "2/5", "71%", "4m"], ["Priya", 120, "1/5", "100%", "9m"]].map((r, i) => (
                <tr key={i}><td><span className={`cc-rank ${medal(i)}`}>{i + 1}</span></td>
                  <td><span className="cc-who"><span className="cc-av" style={{ background: AVCOL[i % 4] }}>{String(r[0])[0]}</span>{r[0]}</span></td>
                  <td className="mono">{r[1]}</td><td className="mono">{r[2]}</td><td className="mono">{r[3]}</td><td className="mono" style={{ color: "var(--faint)" }}>{r[4]}</td></tr>
              ))}</tbody>
            </table></div>
          </div>
        </div>
      )}

      {/* ── AI ── */}
      {tab === "ai" && (
        <div className="cc-view">
          <div className="cc-grid g-2">
            <div className="cc-card">
              <h3>AI coding assistant</h3><div className="desc">Hints &amp; approaches — full solutions only on request.</div>
              <div className="cc-field"><label className="fl">Problem</label>
                <select className="cc-in" value={aiProb} onChange={(e) => setAiProb(e.target.value)}>
                  <option>Number of Islands (Medium · Graphs)</option><option>Course Schedule (Medium · Topo sort)</option><option>Word Ladder (Hard · BFS)</option><option>Two Sum (Easy · Hashing)</option>
                </select>
              </div>
              <div className="cc-field"><label className="fl">Hint level</label>
                <div className="cc-seg">{["beginner", "intermediate", "advanced"].map((l) => (
                  <button key={l} className={aiLevel === l ? "on" : ""} onClick={() => setAiLevel(l)}>{l[0].toUpperCase() + l.slice(1)}</button>
                ))}</div>
              </div>
              <div className="cc-row" style={{ flexWrap: "wrap", gap: 8 }}>
                <button className="cc-btn sm" onClick={() => aiAsk("explain")}>Explain problem</button>
                <button className="cc-btn sm" onClick={() => aiAsk("hint")}>Give a hint</button>
                <button className="cc-btn sm" onClick={() => aiAsk("approach")}>Suggest approach</button>
                <button className="cc-btn sm" onClick={() => aiAsk("mistake")}>Analyze my mistake</button>
                <button className="cc-btn sm danger" onClick={() => aiAsk("solution")}>Reveal full solution</button>
              </div>
            </div>
            <div className="cc-card">
              <h3>Assistant</h3><div className="desc">Mock responses — ready for real LLM wiring.</div>
              <div className="cc-chat" ref={chatRef}>
                {chat.map((m, i) => (
                  <div className={`cc-msg ${m.who}`} key={i}>{m.label && <div className="lvl">{m.label}</div>}{m.text}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── SVG line chart ─────────── */
function LineChart({ series }: { series: { name: string; pts: number[] }[] }) {
  const W = 560, H = 200, pad = 28, max = 400;
  const x = (i: number) => pad + i * ((W - pad * 2) / (series[0].pts.length - 1));
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const colors = ["var(--brand)", "#1f8acb", "var(--amber)", "var(--green)"];
  const grid = [];
  for (let v = 0; v <= max; v += 100) grid.push(<g key={v}><line x1={pad} y1={y(v)} x2={W - pad} y2={y(v)} stroke="var(--border)" strokeWidth={1} /><text x={4} y={y(v) + 3} fontSize={9} fill="var(--faint)">{v}</text></g>);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
        {grid}
        {series.map((s, si) => (
          <g key={si}>
            <polyline points={s.pts.map((p, i) => `${x(i)},${y(p)}`).join(" ")} fill="none" stroke={colors[si]} strokeWidth={2.5} strokeLinejoin="round" />
            {s.pts.map((p, i) => <circle key={i} cx={x(i)} cy={y(p)} r={3} fill={colors[si]} />)}
          </g>
        ))}
      </svg>
      <div className="cc-row" style={{ gap: 16, flexWrap: "wrap", marginTop: 8 }}>
        {series.map((s, i) => <span className="cc-row" key={i} style={{ gap: 6, fontSize: 12 }}><span style={{ width: 12, height: 3, borderRadius: 2, background: colors[i], display: "inline-block" }} />{s.name}</span>)}
      </div>
    </div>
  );
}

/* ─────────── scoped styles (cc- prefixed; uses app theme vars → dark mode works) ─────────── */
const CSS = `
.cc-root{display:flex;flex-direction:column;gap:18px}
.cc-root .sub{font-size:12.5px;color:var(--faint)}
.cc-root .mono{font-family:var(--font-mono,'JetBrains Mono',monospace)}
.cc-tabs{display:flex;gap:4px;flex-wrap:wrap;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:4px}
.cc-tabs button{border:0;background:none;font-family:inherit;font-size:13px;font-weight:600;color:var(--muted);padding:8px 13px;border-radius:8px;cursor:pointer;transition:.12s}
.cc-tabs button:hover{color:var(--ink)}
.cc-tabs button.on{background:var(--brand);color:#fff}
.cc-view{display:flex;flex-direction:column;gap:16px}
.cc-grid{display:grid;gap:16px}
.cc-grid.g-2{grid-template-columns:1fr 1fr}
.cc-row{display:flex;align-items:center;gap:12px}
.cc-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px}
.cc-card h3{font-size:14px;font-weight:700;display:flex;align-items:center;gap:8px;margin-bottom:4px}
.cc-card .desc{font-size:12.5px;color:var(--faint);margin-bottom:14px}
.cc-lbl{font-size:12px;font-weight:700;color:var(--faint);text-transform:uppercase;letter-spacing:.04em;margin:16px 0 10px}
.cc-btn{display:inline-flex;align-items:center;gap:7px;font-family:inherit;font-weight:600;font-size:13.5px;border-radius:9px;border:1px solid var(--border-2);background:var(--card);padding:9px 14px;cursor:pointer;transition:.12s;color:var(--ink)}
.cc-btn:hover{background:var(--paper,var(--subtle))}
.cc-btn.brand{background:var(--brand);color:#fff;border-color:var(--brand)}
.cc-btn.brand:hover{background:var(--brand-d)}
.cc-btn.sm{padding:6px 11px;font-size:12.5px}
.cc-btn.ghost{background:transparent;border-color:transparent;color:var(--muted)}
.cc-btn.danger{border-color:var(--rose-soft);color:var(--rose-d)}
.cc-btn:disabled{opacity:.5;cursor:not-allowed}
.cc-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.cc-stat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px}
.cc-stat .l{font-size:12.5px;color:var(--muted);font-weight:600}
.cc-stat .n{font-size:27px;font-weight:800;letter-spacing:-.03em;margin-top:8px}
.cc-stat .d{font-size:12px;color:var(--brand-d);font-weight:600;margin-top:2px}
.cc-pill{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.cc-pill.live{background:var(--rose-soft);color:var(--rose-d)}
.cc-pill.live .dot{width:7px;height:7px;border-radius:50%;background:var(--rose);animation:ccpulse 1.4s infinite}
.cc-pill.ok{background:var(--green-soft);color:var(--green)}
.cc-pill.wait{background:var(--amber-soft);color:var(--amber-d)}
.cc-pill.brand{background:var(--brand-soft);color:var(--brand-d)}
.cc-pill.mut{background:var(--paper,var(--subtle));color:var(--muted)}
@keyframes ccpulse{0%,100%{opacity:1}50%{opacity:.35}}
.cc-diff{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:6px}
.cc-diff.easy{background:var(--green-soft);color:var(--green)}
.cc-diff.med{background:var(--amber-soft);color:var(--amber-d)}
.cc-diff.hard{background:var(--rose-soft);color:var(--rose-d)}
.cc-plat{width:22px;height:22px;border-radius:6px;display:grid;place-items:center;font-size:9px;font-weight:800;font-family:var(--font-mono,monospace);color:#fff;flex:none}
.cc-plat.lc{background:#ffa116}.cc-plat.cf{background:#1f8acb}.cc-plat.cc{background:#7a5230}.cc-plat.hr{background:#1aa260}.cc-plat.cv{background:linear-gradient(135deg,var(--brand),var(--rose))}
.cc-root table{width:100%;border-collapse:collapse;font-size:13.5px}
.cc-root thead th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--faint);font-weight:700;padding:0 10px 12px}
.cc-root tbody td{padding:11px 10px;border-top:1px solid var(--border)}
.cc-root tbody tr:hover{background:var(--paper,var(--subtle))}
.cc-tbl-wrap{overflow-x:auto}
.cc-rank{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;font-weight:800;font-size:12px;font-family:var(--font-mono,monospace);background:var(--paper,var(--subtle));color:var(--muted);flex:none}
.cc-rank.g1{background:linear-gradient(135deg,#f6c945,#e8a200);color:#fff}
.cc-rank.g2{background:linear-gradient(135deg,#cdd2da,#9aa2ad);color:#fff}
.cc-rank.g3{background:linear-gradient(135deg,#e2a06a,#c47a3f);color:#fff}
.cc-who{display:inline-flex;align-items:center;gap:9px;font-weight:600}
.cc-av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;font-size:12px;flex:none}
.cc-av.sm{width:22px;height:22px;font-size:10px}
.cc-bar{height:8px;border-radius:5px;background:var(--paper,var(--subtle));overflow:hidden;min-width:70px}
.cc-bar i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,var(--brand),var(--amber));transition:width .5s}
.cc-key{width:12px;height:8px;border-radius:3px;display:inline-block}
.cc-field{margin-bottom:14px}
.cc-field .fl{display:block;font-size:12.5px;font-weight:600;margin-bottom:6px;color:var(--ink-2)}
.cc-field .fl .sub{font-weight:500}
.cc-in{width:100%;font-family:inherit;font-size:14px;color:var(--ink);background:var(--card);border:1px solid var(--border-2);border-radius:10px;padding:10px 12px}
.cc-in:focus{outline:none;border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-soft)}
.cc-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.cc-seg{display:inline-flex;background:var(--paper,var(--subtle));border:1px solid var(--border-2);border-radius:10px;padding:3px;flex-wrap:wrap}
.cc-seg button{border:0;background:none;font-family:inherit;font-size:13px;font-weight:600;color:var(--muted);padding:7px 13px;border-radius:7px;cursor:pointer}
.cc-seg button.on{background:var(--card);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.08)}
.cc-chipin{display:flex;flex-wrap:wrap;gap:7px;align-items:center}
.cc-fchip{display:inline-flex;align-items:center;gap:7px;background:var(--paper,var(--subtle));border:1px solid var(--border-2);border-radius:999px;padding:4px 8px 4px 4px;font-size:12.5px;font-weight:600}
.cc-fchip .x{cursor:pointer;color:var(--faint);width:16px;height:16px;display:grid;place-items:center;border-radius:50%;font-size:11px}
.cc-fchip .x:hover{background:var(--rose-soft);color:var(--rose-d)}
.cc-pk{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:11px;margin-bottom:8px;background:var(--card)}
.cc-pk .nm{flex:1;min-width:0;font-weight:600;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cc-linkbox{margin-top:16px;padding:12px;border:1px dashed var(--border-2);border-radius:11px;display:flex;align-items:center;justify-content:space-between;gap:10px}
.cc-badges{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.cc-badge{text-align:center;padding:16px 10px;border:1px solid var(--border);border-radius:12px;background:var(--card)}
.cc-badge .hex{width:46px;height:46px;margin:0 auto 10px;display:grid;place-items:center;color:#fff;font-size:20px;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)}
.cc-badge .bt{font-size:12.5px;font-weight:700}
.cc-badge .bm{font-size:11px;color:var(--faint);margin-top:2px}
.cc-timer{font-family:var(--font-mono,monospace);font-size:34px;font-weight:700;letter-spacing:-.02em}
.cc-timer.low{color:var(--rose-d)}
.cc-cmprow{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:11px 0;border-top:1px solid var(--border);font-size:14px}
.cc-cmprow .lab{text-align:center;font-size:11.5px;font-weight:700;color:var(--faint);text-transform:uppercase;letter-spacing:.03em;padding:0 12px}
.cc-cmprow .v{font-weight:700}
.cc-cmprow .v.l{text-align:right}
.cc-cmprow .v.win{color:var(--green)}
.cc-chat{display:flex;flex-direction:column;gap:12px;max-height:340px;overflow-y:auto;padding:4px}
.cc-msg{max-width:88%;padding:11px 14px;border-radius:13px;font-size:13.5px;line-height:1.55}
.cc-msg.ai{background:var(--paper,var(--subtle));border:1px solid var(--border);align-self:flex-start;border-bottom-left-radius:4px}
.cc-msg.me{background:var(--brand);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
.cc-msg .lvl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--brand-d);margin-bottom:4px}
.cc-empty{text-align:center;color:var(--faint);font-size:13.5px}
@media(max-width:1040px){.cc-grid.g-2{grid-template-columns:1fr}.cc-stats{grid-template-columns:repeat(2,1fr)}.cc-badges{grid-template-columns:repeat(2,1fr)}}
@media(max-width:480px){.cc-stats,.cc-badges,.cc-two{grid-template-columns:1fr}}
`;
