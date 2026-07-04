"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlatformChip } from "@/components/PlatformChip";

export default function RepositoriesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; githubLogin: string; displayName: string | null } | null>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error("Failed to parse user data", e);
    }

    const fetchRepos = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${API_URL}/github-repos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRepos(data);
        }
      } catch (err) {
        console.error("Failed to fetch repos", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepos();
  }, [router]);

  if (isLoading || !user) {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--faint)" }}>Loading repositories...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 className="h" style={{ fontSize: 24, marginBottom: 24 }}>Connected Repositories</h1>
      
      {repos.length === 0 ? (
        <section className="panel" style={{ textAlign: "center", padding: "60px 20px" }}>
          <svg className="ico" style={{ width: 48, height: 48, opacity: 0.2, marginBottom: 16 }} aria-hidden="true"><use href="#ic-github"/></svg>
          <p style={{ color: "var(--muted)", marginBottom: 20 }}>You have not connected any platforms for code syncing yet.</p>
          <Link href="/connect" className="btn brand" style={{ display: "inline-flex" }}>Connect a Platform</Link>
        </section>
      ) : (
        repos.map((repo) => (
          <section className="panel" key={repo.platform} style={{ marginBottom: 24 }}>
            <div className="repohead">
              <div className="ghmark"><svg viewBox="0 0 24 24"><use href="#ic-github"/></svg></div>
              <div>
                <div className="nm">
                  <span style={{ marginRight: 8, display: 'inline-flex', verticalAlign: 'middle' }}>
                    <PlatformChip platformId={repo.platform} size="sm" showName={false} variant="ghost" />
                  </span>
                  {user.githubLogin} / <a href={`https://github.com/${user.githubLogin}/${repo.repoFullName}`} target="_blank" rel="noopener noreferrer">{repo.repoFullName}</a> 
                  <span className="pubpill" style={{ textTransform: 'capitalize' }}>{repo.visibility}</span>
                </div>
                <div className="meta">
                  <span>default branch <b>{repo.defaultBranch}</b></span>
                  <span>folder format: <b>{repo.folderConvention}</b></span>
                  <span>auto-sync on</span>
                </div>
              </div>
              <div className="acts">
                <a className="btn" href={`https://github.com/${user.githubLogin}/${repo.repoFullName}`} target="_blank" rel="noopener noreferrer">Open on GitHub ↗</a>
                <Link className="btn brand" href="/sync-status">
                  <svg className="ico sm" aria-hidden="true"><use href="#ic-sync"/></svg> Re-sync now
                </Link>
              </div>
            </div>

            <div style={{ marginTop: 24, padding: "30px 20px", background: "var(--paper)", border: "1px dashed var(--border-2)", borderRadius: 8, textAlign: "center", color: "var(--muted)" }}>
              <p style={{ fontSize: 14 }}>No files synced yet. CodeVault will automatically push your first accepted solution here.</p>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
