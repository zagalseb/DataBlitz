// ══════════════════════════════════════════════════════════════
// supabase.js — PlaySync Cloud Adapter
// ══════════════════════════════════════════════════════════════

const SupabaseDB = (() => {
  'use strict';

  const SB_URL  = 'https://jaavutcczjshpxdoylwy.supabase.co';
  const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphYXZ1dGNjempzaHB4ZG95bHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDkzNTAsImV4cCI6MjA5MDEyNTM1MH0.QKajbSImavHha9P9jY8xk_4BMFbdjV4Lv_7zUL2KFSk';

  // Headers base — SIN Prefer, cada función lo define explícitamente
  const BASE_HEADERS = {
    'Content-Type':  'application/json',
    'apikey':        SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
  };

  function isOnline() { return navigator.onLine; }

  // ── Base fetch ────────────────────────────────────────────────
  async function _req(path, options = {}) {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${SB_URL}/rest/v1/${path}${sep}apikey=${SB_KEY}`;
    const res = await fetch(url, {
      headers: { ...BASE_HEADERS, ...(options.headers || {}) },
      ...options,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase error ${res.status}: ${err}`);
    }
    const text = await res.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return null; }
  }

  // ── Teams ─────────────────────────────────────────────────────
  async function upsertTeam(teamCode) {
    if (!isOnline()) return;
    const cfg = TeamConfig.get();
    if (!cfg) return;

    const body = JSON.stringify({
      team_code:   teamCode,
      name:        cfg.name,
      initials:    cfg.initials,
      color:       cfg.color,
      logo:        cfg.logo || null,
      config_json: cfg,
    });

    // Intentar INSERT primero
    const res = await fetch(
      `${SB_URL}/rest/v1/teams?apikey=${SB_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body,
      }
    );

    // 409 = ya existe, hacer PATCH
    if (res.status === 409 || res.status === 400) {
      await fetch(
        `${SB_URL}/rest/v1/teams?team_code=eq.${teamCode}&apikey=${SB_KEY}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Prefer': 'return=minimal',
          },
          body,
        }
      );
    }
  }

  // ── Games ─────────────────────────────────────────────────────
  async function loadGames(teamCode) {
    const rows = await _req(
      `games?team_code=eq.${teamCode}&order=created_at.desc&select=*`
    );
    return (rows || []).map(r => ({
      id:        r.id,
      teamHome:  r.meta_json?.teamHome  || r.name     || 'HOME',
      teamAway:  r.meta_json?.teamAway  || r.opponent || 'AWAY',
      scoreHome: r.meta_json?.scoreHome || 0,
      scoreAway: r.meta_json?.scoreAway || 0,
      date:      r.date,
      week:      r.meta_json?.week  || '1',
      plays:     r.meta_json?.plays || 0,
      state:     r.meta_json?.state || null,
    }));
  }

  async function saveGames(teamCode, games) {
    if (!isOnline()) return;
    for (const g of games) {
      await _req('games?on_conflict=id', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          id:        g.id,
          team_code: teamCode,
          name:      `${g.teamHome} vs ${g.teamAway}`,
          opponent:  g.teamAway,
          date:      g.date,
          meta_json: {
            teamHome:  g.teamHome,
            teamAway:  g.teamAway,
            scoreHome: g.scoreHome,
            scoreAway: g.scoreAway,
            week:      g.week,
            plays:     g.plays,
            state:     g.state,
          },
        }),
      });
    }
  }

  async function deleteGame(gameId) {
    if (!isOnline()) return;
    await _req(`games?id=eq.${gameId}`, { method: 'DELETE' });
  }

  // ── Sync ──────────────────────────────────────────────────────
  async function sync(teamCode) {
    if (!isOnline()) {
      console.log('[SupabaseDB] Offline — skip sync');
      return { ok: false, reason: 'offline' };
    }
    try {
      await upsertTeam(teamCode);
      const localKey   = TeamConfig.key('playsync_games');
      const localGames = JSON.parse(localStorage.getItem(localKey) || '[]');
      const remoteGames = await loadGames(teamCode);
      const merged = _mergeGames(localGames, remoteGames);
      localStorage.setItem(localKey, JSON.stringify(merged));
      await saveGames(teamCode, merged);
      console.log(`[SupabaseDB] Sync OK — ${merged.length} partidos`);
      return { ok: true, count: merged.length };
    } catch (err) {
      console.error('[SupabaseDB] Sync failed:', err);
      return { ok: false, reason: err.message };
    }
  }

  function _mergeGames(local, remote) {
    const map = new Map();
    for (const g of remote) map.set(g.id, g);
    for (const g of local) {
      const existing = map.get(g.id);
      if (!existing || (g.plays || 0) >= (existing.plays || 0)) {
        map.set(g.id, g);
      }
    }
    return [...map.values()].sort((a, b) => {
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
  }

  // ── Playbooks ─────────────────────────────────────────────────
  async function loadPlaybook(teamCode, unit) {
    const rows = await _req(
      `playbooks?team_code=eq.${teamCode}&unit=eq.${unit}&select=data_json`
    );
    return rows?.[0]?.data_json || null;
  }

  async function savePlaybook(teamCode, unit, data) {
    if (!isOnline()) return;
    await _req('playbooks?on_conflict=team_code,unit', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({
        team_code:  teamCode,
        unit,
        data_json:  data,
        updated_at: new Date().toISOString(),
      }),
    });
  }

  // ── Status UI ─────────────────────────────────────────────────
  function showSyncStatus(result) {
    const el = document.getElementById('sync-status');
    if (!el) return;
    if (!isOnline()) {
      el.textContent = '⚫ Offline';
      el.style.color = 'var(--text-muted)';
    } else if (result?.ok) {
      el.textContent = '🟢 Sincronizado';
      el.style.color = 'var(--accent)';
    } else {
      el.textContent = '🔴 Error sync';
      el.style.color = '#ff4d4d';
    }
  }

  return {
    sync, upsertTeam,
    loadGames, saveGames, deleteGame,
    loadPlaybook, savePlaybook,
    showSyncStatus, isOnline,
  };
})();
