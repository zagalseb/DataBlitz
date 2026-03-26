// ══════════════════════════════════════════════════════════════
// supabase.js — PlaySync Cloud Adapter
// Supabase como capa primaria, localStorage como fallback offline
// ══════════════════════════════════════════════════════════════

const SupabaseDB = (() => {
  'use strict';

  const URL     = 'https://jaavutcczjshpxdoylwy.supabase.co';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphYXZ1dGNjempzaHB4ZG95bHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDkzNTAsImV4cCI6MjA5MDEyNTM1MH0.QKajbSImavHha9P9jY8xk_4BMFbdjV4Lv_7zUL2KFSk';
  const HEADERS = {
    'Content-Type':  'application/json',
    'apikey':        ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'Prefer':        'return=representation',
  };

  // ── Online check ──────────────────────────────────────────────
  function isOnline() {
    return navigator.onLine;
  }

  // ── Base fetch helper ─────────────────────────────────────────
  async function _req(path, options = {}) {
    // Pasar apikey como query param además de header (fix CORS en GitHub Pages)
    const separator = path.includes('?') ? '&' : '?';
    const url = `${URL}/rest/v1/${path}${separator}apikey=${ANON_KEY}`;
    const res = await fetch(url, {
      headers: { ...HEADERS, ...(options.headers || {}) },
      ...options,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase error ${res.status}: ${err}`);
    }
    // 204 No Content (DELETE / upserts sin return)
    if (res.status === 204) return null;
    return res.json();
  }

  // ══════════════════════════════════════════════════════════════
  //  TEAMS
  // ══════════════════════════════════════════════════════════════

  /**
   * Asegura que el equipo exista en Supabase.
   * Si no existe lo crea; si existe lo actualiza (upsert).
   */
  async function upsertTeam(teamCode) {
    if (!isOnline()) return;
    const cfg = TeamConfig.get();
    if (!cfg) return;

    await _req('teams?on_conflict=team_code', {
      method: 'POST',
      headers: {
        'Prefer': 'resolution=merge-duplicates',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        team_code:   teamCode,
        name:        cfg.name,
        initials:    cfg.initials,
        color:       cfg.color,
        logo:        cfg.logo || null,
        config_json: cfg,
      }),
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  GAMES
  // ══════════════════════════════════════════════════════════════

  /**
   * Carga todos los partidos del equipo desde Supabase.
   * Retorna array en el mismo formato que _loadGames() de gameManager.js
   */
  async function loadGames(teamCode) {
    const rows = await _req(
      `games?team_code=eq.${teamCode}&order=created_at.desc&select=*`
    );
    // Convertir formato Supabase → formato PlaySync
    return (rows || []).map(r => ({
      id:        r.id,
      teamHome:  r.meta_json?.teamHome  || r.name || 'HOME',
      teamAway:  r.meta_json?.teamAway  || r.opponent || 'AWAY',
      scoreHome: r.meta_json?.scoreHome || 0,
      scoreAway: r.meta_json?.scoreAway || 0,
      date:      r.date,
      week:      r.meta_json?.week || '1',
      plays:     r.meta_json?.plays || 0,
      state:     r.meta_json?.state || null,
      _sbId:     r.id,   // UUID real de Supabase (por si el id local era 'game_xxx')
    }));
  }

  /**
   * Guarda (upsert) el array completo de partidos en Supabase.
   * Replica exactamente lo que hace _saveGames() de gameManager.js
   */
  async function saveGames(teamCode, games) {
    if (!isOnline()) return;

    // Upsert cada partido individualmente para no sobrescribir otros
    for (const g of games) {
      await _req('games?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
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

  /**
   * Elimina un partido de Supabase (y sus jugadas en cascade).
   */
  async function deleteGame(gameId) {
    if (!isOnline()) return;
    await _req(`games?id=eq.${gameId}`, { method: 'DELETE' });
  }

  // ══════════════════════════════════════════════════════════════
  //  SYNC — La función principal
  // ══════════════════════════════════════════════════════════════

  /**
   * Sincroniza localStorage ↔ Supabase.
   * 
   * Estrategia: localStorage es la fuente de verdad durante el juego.
   * Al llamar sync(), se hace un merge: los partidos más recientes ganan.
   * 
   * Llamar en:
   *   - Al abrir games.html (pull desde nube)
   *   - Después de autosave() cuando hay internet (push a nube)
   */
  async function sync(teamCode) {
    if (!isOnline()) {
      console.log('[SupabaseDB] Offline — skip sync');
      return { ok: false, reason: 'offline' };
    }

    try {
      await upsertTeam(teamCode);

      // 1. Leer local
      const localKey   = TeamConfig.key('playsync_games');
      const localGames = JSON.parse(localStorage.getItem(localKey) || '[]');

      // 2. Leer remoto
      const remoteGames = await loadGames(teamCode);

      // 3. Merge: combinar por id, el state más reciente gana
      //    (usa created_at o plays count como tie-breaker)
      const merged = _mergeGames(localGames, remoteGames);

      // 4. Guardar merged en local
      localStorage.setItem(localKey, JSON.stringify(merged));

      // 5. Push merged a Supabase
      await saveGames(teamCode, merged);

      console.log(`[SupabaseDB] Sync OK — ${merged.length} partidos`);
      return { ok: true, count: merged.length };

    } catch (err) {
      console.error('[SupabaseDB] Sync failed:', err);
      return { ok: false, reason: err.message };
    }
  }

  /**
   * Merge de arrays de partidos.
   * Para cada id único, gana el que tenga más jugadas (plays).
   */
  function _mergeGames(local, remote) {
    const map = new Map();

    // Primero el remoto como base
    for (const g of remote) map.set(g.id, g);

    // Local sobreescribe si tiene más jugadas o igual (local es fuente de verdad en cancha)
    for (const g of local) {
      const existing = map.get(g.id);
      if (!existing || (g.plays || 0) >= (existing.plays || 0)) {
        map.set(g.id, g);
      }
    }

    // Ordenar por fecha descendente (más reciente primero)
    return [...map.values()].sort((a, b) => {
      const da = new Date(a.date || 0);
      const db = new Date(b.date || 0);
      return db - da;
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  PLAYBOOKS
  // ══════════════════════════════════════════════════════════════

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
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        team_code:  teamCode,
        unit,
        data_json:  data,
        updated_at: new Date().toISOString(),
      }),
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  STATUS UI HELPER
  // ══════════════════════════════════════════════════════════════

  /**
   * Muestra un chip de estado de sync en el elemento con id="sync-status".
   * Opcional — agrégalo al HTML si quieres feedback visual.
   */
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

  // ── Public API ────────────────────────────────────────────────
  return {
    sync,
    upsertTeam,
    loadGames,
    saveGames,
    deleteGame,
    loadPlaybook,
    savePlaybook,
    showSyncStatus,
    isOnline,
  };
})();