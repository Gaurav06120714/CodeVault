'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlatformChip } from '@/components/PlatformChip';

export default function ConnectPage() {
  const router = useRouter();
  
  // Track selected platforms as a Set
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['leetcode']));
  
  // Track credentials for all platforms
  const [credentials, setCredentials] = useState<Record<string, { username: string; sessionToken: string }>>({
    leetcode: { username: '', sessionToken: '' },
    codeforces: { username: '', sessionToken: '' },
    codechef: { username: '', sessionToken: '' },
    hackerrank: { username: '', sessionToken: '' },
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const platforms = [
    { id: 'leetcode', name: 'LeetCode', short: 'LC', class: 'lc', url: 'leetcode.com/u/…' },
    { id: 'codeforces', name: 'Codeforces', short: 'CF', class: 'cf', url: 'codeforces.com/profile/…' },
    { id: 'codechef', name: 'CodeChef', short: 'CC', class: 'cc', url: 'codechef.com/users/…' },
    { id: 'hackerrank', name: 'HackerRank', short: 'HR', class: 'hr', url: 'hackerrank.com/…' },
  ];

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateCredential = (platformId: string, field: 'username' | 'sessionToken', value: string) => {
    setCredentials(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        [field]: value
      }
    }));
  };

  const handleConnect = async (withSync: boolean) => {
    if (selectedPlatforms.size === 0) {
      setError('Please select at least one platform to connect.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not logged in');

      const platformsArr = Array.from(selectedPlatforms);
      
      const promises = platformsArr.map(async (platform) => {
        const creds = credentials[platform];
        
        if (!creds.username.trim()) {
          throw new Error(`Username is required for ${platforms.find(p => p.id === platform)?.name}`);
        }

        // 1. Connect Platform
        const res = await fetch(`${API_URL}/platforms/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            platform,
            username: creds.username.trim(),
            sessionToken: withSync ? creds.sessionToken.trim() : undefined
          })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to connect ${platform}`);
        }

        // 2. Setup GitHub Repo (if sync enabled)
        if (withSync) {
          const repoRes = await fetch(`${API_URL}/github-repos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              platform,
              repoFullName: 'CodeVault-Solutions',
              visibility: 'public',
              folderConvention: 'number',
              defaultBranch: 'main'
            })
          });

          if (!repoRes.ok) {
            const data = await repoRes.json();
            throw new Error(data.error || `Failed to setup repository for ${platform}`);
          }
        }
      });

      await Promise.all(promises);

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wrap" style={{ maxWidth: 680, margin: '40px auto', padding: '0 24px' }}>
      <div className="step-label" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--brand-d)', fontWeight: 700 }}>Step 1 of 2</div>
      <h1 style={{ fontSize: 26, letterSpacing: '-.02em', margin: '8px 0 6px' }}>Connect your platforms</h1>
      <p className="sub" style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 24 }}>Select one or more platforms to add to your dashboard. You can connect them all at once!</p>

      <div className="panel">
        <div className="plats">
          {platforms.map(p => (
            <button
              key={p.id}
              className={`pcard ${selectedPlatforms.has(p.id) ? 'sel' : ''}`}
              type="button"
              onClick={() => togglePlatform(p.id)}
            >
              <PlatformChip platformId={p.id} size="lg" showName={false} variant="ghost" />
              <div>
                <div className="nm">{p.name}</div>
                <div className="m">{p.url}</div>
              </div>
            </button>
          ))}
        </div>

        {Array.from(selectedPlatforms).map(platformId => {
          const p = platforms.find(p => p.id === platformId)!;
          return (
            <div key={p.id} style={{ marginTop: 24, padding: 20, border: '1px solid var(--border-2)', borderRadius: 12, background: 'var(--paper)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)' }}>
                <PlatformChip platformId={p.id} size="sm" showName={false} variant="ghost" /> 
                {p.name} Credentials
              </h3>
              
              <div className="field">
                <label htmlFor={`uname-${p.id}`} style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Your {p.name} username</label>
                <div className="inwrap">
                  <span className="pfx">@</span>
                  <input 
                    id={`uname-${p.id}`}
                    type="text" 
                    placeholder={`e.g. gaurav`}
                    autoComplete="off" 
                    value={credentials[p.id].username}
                    onChange={(e) => updateCredential(p.id, 'username', e.target.value)}
                  />
                </div>
              </div>

              <div className="field" style={{ marginTop: 16 }}>
                <label htmlFor={`token-${p.id}`} style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Session Token (Optional, required for code sync)</label>
                <div className="inwrap">
                  <span className="pfx">🔑</span>
                  <input 
                    id={`token-${p.id}`}
                    type="password" 
                    placeholder="e.g. session cookie" 
                    autoComplete="off" 
                    value={credentials[p.id].sessionToken}
                    onChange={(e) => updateCredential(p.id, 'sessionToken', e.target.value)}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {selectedPlatforms.size === 0 && (
          <div style={{ marginTop: 24, padding: 20, textAlign: 'center', color: 'var(--faint)', border: '1px dashed var(--border-2)', borderRadius: 12 }}>
            Please select at least one platform above to enter your credentials.
          </div>
        )}

        {error && <p style={{ color: 'var(--brand-d)', fontSize: 13, marginTop: 16, fontWeight: 600 }}>{error}</p>}

        <div className="modes" style={{ marginTop: 24 }}>
          <div className="mode">
            <div className="mt">Stats only <span className="tag free">no login</span></div>
            <div className="md">Pull public stats for your dashboard. Nothing is pushed to GitHub.</div>
            <button 
              type="button"
              disabled={isSubmitting || selectedPlatforms.size === 0}
              onClick={() => handleConnect(false)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, borderRadius: 10, border: '1px solid var(--border-2)', background: '#fff', padding: 11, cursor: selectedPlatforms.size > 0 ? 'pointer' : 'not-allowed', color: 'var(--ink)', opacity: selectedPlatforms.size > 0 ? 1 : 0.5 }}
            >
              {isSubmitting ? 'Connecting...' : 'Add for stats'}
            </button>
          </div>
          <div className="mode">
            <div className="mt">Stats + code sync <span className="tag auth">authorize once</span></div>
            <div className="md">Also push your accepted solutions to GitHub, organized by problem number.</div>
            <button 
              type="button"
              disabled={isSubmitting || selectedPlatforms.size === 0}
              onClick={() => handleConnect(true)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, borderRadius: 10, border: '1px solid var(--brand)', background: 'var(--brand)', padding: 11, cursor: selectedPlatforms.size > 0 ? 'pointer' : 'not-allowed', color: '#fff', opacity: selectedPlatforms.size > 0 ? 1 : 0.5 }}
            >
              {isSubmitting ? 'Syncing...' : 'Authorize & sync'}
            </button>
          </div>
        </div>
        <div className="note" style={{ fontSize: 12, color: 'var(--faint)', marginTop: 14, textAlign: 'center' }}>Your passwords are never stored in CodeVault.</div>
      </div>
    </div>
  );
}
