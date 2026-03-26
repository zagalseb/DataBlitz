/* ============================================================
   Player Participation — app.js
   Shared logic, data modules, and utilities
   ============================================================ */

'use strict';

/* ────────────────────────────────────────────
   CONSTANTS
──────────────────────────────────────────── */
const POS_UNIT_MAP = {
  'QB': 'OFE', 'OL-LT': 'OFE', 'OL-LG': 'OFE', 'OL-C': 'OFE',
  'OL-RG': 'OFE', 'OL-RT': 'OFE', 'WR': 'OFE', 'SLOT': 'OFE',
  'TE': 'OFE', 'RB': 'OFE', 'FB': 'OFE', 'H-Back': 'OFE',
  'DE': 'DEF', 'DT': 'DEF', 'NT': 'DEF', 'MLB': 'DEF',
  'WILL': 'DEF', 'SAM': 'DEF', 'CB': 'DEF', 'FS': 'DEF',
  'SS': 'DEF', 'NB': 'DEF', 'LB': 'DEF',
  'K': 'ST', 'P': 'ST', 'LS': 'ST', 'KR': 'ST', 'PR': 'ST',
};

/* ────────────────────────────────────────────
   KEYS
──────────────────────────────────────────── */
const PP_KEYS = {
  roster:     () => TeamConfig.key('pp_roster'),
  games:      () => TeamConfig.key('pp_games'),
  formations: () => TeamConfig.key('pp_formations'),
  plays:      (gameId) => TeamConfig.key(`pp_plays_${gameId}`),
};

/* ────────────────────────────────────────────
   LOCALSTORAGE HELPERS
──────────────────────────────────────────── */
function ppGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function ppSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('ppSet failed:', key, e);
  }
}

function ppUpdate(key, fn) {
  const current = ppGet(key);
  const next    = fn(current);
  ppSet(key, next);
  return next;
}

/* ────────────────────────────────────────────
   MODULE: ROSTER
──────────────────────────────────────────── */
function getRoster() {
  return ppGet(PP_KEYS.roster()) ?? [];
}

function savePlayer({ id, number, name, position, unit }) {
  ppUpdate(PP_KEYS.roster(), (roster) => {
    const list = roster ?? [];
    const idx  = list.findIndex(p => p.id === id);
    const player = { id: id || generateId(), number, name, position: position || '', unit };
    if (idx >= 0) {
      list[idx] = player;
    } else {
      list.push(player);
    }
    return list;
  });
}

function deletePlayer(id) {
  ppUpdate(PP_KEYS.roster(), (roster) =>
    (roster ?? []).filter(p => p.id !== id)
  );
}

/**
 * Parse CSV text into an array of player objects.
 * Expected format (header optional):
 *   #,Nombre,Posición,Unidad
 *   7,Carlos Ramos,QB,OFE
 */
function parseRosterCSV(text) {
  const players = [];
  const lines   = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const cols = parseCSVLine(line);
    if (!cols[0] || cols[0] === '#') continue;          // skip header / empty
    const [number, name, position, unit] = cols.map(c => c.trim());
    if (!name) continue;

    // 1. Intentar usar la columna unit (normalizar a mayúsculas y trim)
    const unitNorm = (unit || '').toUpperCase().trim();
    let resolvedUnit = ['OFE', 'DEF', 'ST'].includes(unitNorm) ? unitNorm : null;

    // 2. Si no viene unit válida, inferir desde la posición
    if (!resolvedUnit && position) {
      resolvedUnit = POS_UNIT_MAP[position.trim()] ?? null;
    }

    // 3. Fallback final
    resolvedUnit = resolvedUnit ?? 'OFE';

    players.push({ id: generateId(), number, name, position: position || '', unit: resolvedUnit });
  }
  return players;
}

/* ────────────────────────────────────────────
   MODULE: GAMES (PARTIDOS)
──────────────────────────────────────────── */
function getGames() {
  return ppGet(PP_KEYS.games()) ?? [];
}

function getGame(id) {
  return getGames().find(g => g.id === id) ?? null;
}

function saveGame({ id, name, date, opponent, status }) {
  ppUpdate(PP_KEYS.games(), (games) => {
    const list = games ?? [];
    const game = {
      id:       id || generateId(),
      name:     name || '',
      date:     date || '',
      opponent: opponent || '',
      status:   status || 'active',
    };
    const idx = list.findIndex(g => g.id === game.id);
    if (idx >= 0) {
      list[idx] = game;
    } else {
      list.unshift(game);
    }
    return list;
  });
}

function deleteGame(id) {
  ppUpdate(PP_KEYS.games(), (games) =>
    (games ?? []).filter(g => g.id !== id)
  );
  // cascade: remove plays
  localStorage.removeItem(PP_KEYS.plays(id));
}

function setCurrentGame(id) {
  try { sessionStorage.setItem('pp_current_game', id); } catch {}
}

function getCurrentGame() {
  try {
    const id = sessionStorage.getItem('pp_current_game');
    return id ? getGame(id) : null;
  } catch {
    return null;
  }
}

/* ────────────────────────────────────────────
   MODULE: PLAYS (JUGADAS)
──────────────────────────────────────────── */
function getPlays(gameId) {
  return ppGet(PP_KEYS.plays(gameId)) ?? [];
}

function savePlays(gameId, plays) {
  ppSet(PP_KEYS.plays(gameId), plays);
}

function updatePlay(gameId, playIndex, patch) {
  ppUpdate(PP_KEYS.plays(gameId), (plays) => {
    const list = plays ?? [];
    if (playIndex < 0 || playIndex >= list.length) return list;
    list[playIndex] = { ...list[playIndex], ...patch };
    return list;
  });
}

/* ────────────────────────────────────────────
   MODULE: FORMATIONS
──────────────────────────────────────────── */
function getFormations() {
  return ppGet(PP_KEYS.formations()) ?? [];
}

function getFormationByName(name) {
  const target = name?.trim().toLowerCase();
  return getFormations().find(f => f.name.trim().toLowerCase() === target) ?? null;
}

function saveFormation({ id, name, unit, positions }) {
  ppUpdate(PP_KEYS.formations(), (formations) => {
    const list = formations ?? [];
    const formation = {
      id:        id || generateId(),
      name:      name || '',
      unit:      unit || 'OFE',
      positions: positions || [],
      isDefault: false,
    };
    const idx = list.findIndex(f => f.id === formation.id);
    if (idx >= 0) {
      // preserve isDefault flag if it was set
      formation.isDefault = list[idx].isDefault ?? false;
      list[idx] = formation;
    } else {
      list.push(formation);
    }
    return list;
  });
}

function deleteFormation(id) {
  ppUpdate(PP_KEYS.formations(), (formations) =>
    (formations ?? []).filter(f => f.id !== id)
  );
}

/* ────────────────────────────────────────────
   DEFAULT FORMATIONS
──────────────────────────────────────────── */
const DEFAULT_FORMATIONS = [
  {
    id:        'default-max',
    name:      'Max',
    unit:      'OFE',
    isDefault: true,
    positions: [
      { id: 'WR-X',  label: 'WR-X',  x: 12, y: 66 },
      { id: 'WR-Z',  label: 'WR-Z',  x: 88, y: 66 },
      { id: 'WR-Y',  label: 'WR-Y',  x: 28, y: 69 },
      { id: 'WR-F',  label: 'WR-F',  x: 72, y: 69 },
      { id: 'OL-LT', label: 'OL-LT', x: 42, y: 66 },
      { id: 'OL-LG', label: 'OL-LG', x: 46, y: 66 },
      { id: 'OL-C',  label: 'OL-C',  x: 50, y: 66 },
      { id: 'OL-RG', label: 'OL-RG', x: 54, y: 66 },
      { id: 'OL-RT', label: 'OL-RT', x: 58, y: 66 },
      { id: 'QB',    label: 'QB',    x: 50, y: 82 },
      { id: 'RB',    label: 'RB',    x: 46, y: 82 },
    ],
  },
  {
    id:        'default-trips',
    name:      'Trips',
    unit:      'OFE',
    isDefault: true,
    positions: [
      { id: 'WR-X',  label: 'WR-X',  x: 12, y: 66 },
      { id: 'WR-Z',  label: 'WR-Z',  x: 88, y: 66 },
      { id: 'WR-Y',  label: 'WR-Y',  x: 72, y: 69 },
      { id: 'WR-F',  label: 'WR-F',  x: 80, y: 69 },
      { id: 'OL-LT', label: 'OL-LT', x: 42, y: 66 },
      { id: 'OL-LG', label: 'OL-LG', x: 46, y: 66 },
      { id: 'OL-C',  label: 'OL-C',  x: 50, y: 66 },
      { id: 'OL-RG', label: 'OL-RG', x: 54, y: 66 },
      { id: 'OL-RT', label: 'OL-RT', x: 58, y: 66 },
      { id: 'QB',    label: 'QB',    x: 50, y: 82 },
      { id: 'RB',    label: 'RB',    x: 46, y: 82 },
    ],
  },
  {
    id:        'default-empty',
    name:      'Empty',
    unit:      'OFE',
    isDefault: true,
    positions: [
      { id: 'WR-X',  label: 'WR-X',  x: 12, y: 66 },
      { id: 'WR-Z',  label: 'WR-Z',  x: 88, y: 66 },
      { id: 'WR-Y',  label: 'WR-Y',  x: 72, y: 69 },
      { id: 'WR-F',  label: 'WR-F',  x: 80, y: 69 },
      { id: 'OL-LT', label: 'OL-LT', x: 42, y: 66 },
      { id: 'OL-LG', label: 'OL-LG', x: 46, y: 66 },
      { id: 'OL-C',  label: 'OL-C',  x: 50, y: 66 },
      { id: 'OL-RG', label: 'OL-RG', x: 54, y: 66 },
      { id: 'OL-RT', label: 'OL-RT', x: 58, y: 66 },
      { id: 'QB',    label: 'QB',    x: 50, y: 82 },
      { id: 'RB',    label: 'RB',    x: 28, y: 69 },
    ],
  },

  // ── KICKOFF ──────────────────────────────────────
  {
    id:        'default-st-kickoff',
    name:      'Kickoff',
    unit:      'ST',
    isDefault: true,
    positions: [
      { id: 'K',   label: 'K',  x: 50, y: 72 },
      { id: 'L1',  label: 'L1', x: 38, y: 56 },
      { id: 'L2',  label: 'L2', x: 30, y: 56 },
      { id: 'L3',  label: 'L3', x: 22, y: 56 },
      { id: 'L4',  label: 'L4', x: 14, y: 56 },
      { id: 'L5',  label: 'L5', x:  6, y: 56 },
      { id: 'R1',  label: 'R1', x: 62, y: 56 },
      { id: 'R2',  label: 'R2', x: 70, y: 56 },
      { id: 'R3',  label: 'R3', x: 78, y: 56 },
      { id: 'R4',  label: 'R4', x: 86, y: 56 },
      { id: 'R5',  label: 'R5', x: 94, y: 56 },
    ],
  },

  // ── KICKOFF RETURN ───────────────────────────────
  {
    id:        'default-st-kickoff-return',
    name:      'Kickoff Return',
    unit:      'ST',
    isDefault: true,
    positions: [
      { id: 'KR1', label: 'KR1', x: 40, y: 88 },
      { id: 'KR2', label: 'KR2', x: 60, y: 88 },
      { id: 'B1',  label: 'B1',  x: 25, y: 72 },
      { id: 'B2',  label: 'B2',  x: 50, y: 72 },
      { id: 'B3',  label: 'B3',  x: 75, y: 72 },
      { id: 'W1',  label: 'W1',  x: 10, y: 60 },
      { id: 'W2',  label: 'W2',  x: 28, y: 60 },
      { id: 'W3',  label: 'W3',  x: 50, y: 60 },
      { id: 'W4',  label: 'W4',  x: 72, y: 60 },
      { id: 'W5',  label: 'W5',  x: 90, y: 60 },
      { id: 'W6',  label: 'W6',  x: 50, y: 50 },
    ],
  },

  // ── PUNT SPREAD ──────────────────────────────────
  {
    id:        'default-st-punt-spread',
    name:      'Punt Spread',
    unit:      'ST',
    isDefault: true,
    positions: [
      { id: 'P',   label: 'P',   x: 50, y: 78 },
      { id: 'LS',  label: 'LS',  x: 50, y: 66 },
      { id: 'PL1', label: 'PL1', x: 43, y: 66 },
      { id: 'PL2', label: 'PL2', x: 36, y: 66 },
      { id: 'PL3', label: 'PL3', x: 29, y: 66 },
      { id: 'PR1', label: 'PR1', x: 57, y: 66 },
      { id: 'PR2', label: 'PR2', x: 64, y: 66 },
      { id: 'PR3', label: 'PR3', x: 71, y: 66 },
      { id: 'G1',  label: 'G',   x: 20, y: 60 },
      { id: 'G2',  label: 'G',   x: 80, y: 60 },
      { id: 'UP',  label: 'UP',  x: 50, y: 72 },
    ],
  },

  // ── PUNT TIGHT ───────────────────────────────────
  {
    id:        'default-st-punt-tight',
    name:      'Punt Tight',
    unit:      'ST',
    isDefault: true,
    positions: [
      { id: 'P',   label: 'P',   x: 50, y: 78 },
      { id: 'LS',  label: 'LS',  x: 50, y: 66 },
      { id: 'PL1', label: 'PL1', x: 43, y: 66 },
      { id: 'PL2', label: 'PL2', x: 36, y: 66 },
      { id: 'PL3', label: 'PL3', x: 29, y: 66 },
      { id: 'PL4', label: 'PL4', x: 22, y: 66 },
      { id: 'PR1', label: 'PR1', x: 57, y: 66 },
      { id: 'PR2', label: 'PR2', x: 64, y: 66 },
      { id: 'PR3', label: 'PR3', x: 71, y: 66 },
      { id: 'PR4', label: 'PR4', x: 78, y: 66 },
      { id: 'UP',  label: 'UP',  x: 50, y: 72 },
    ],
  },

  // ── PUNT RETURN ──────────────────────────────────
  {
    id:        'default-st-punt-return',
    name:      'Punt Return',
    unit:      'ST',
    isDefault: true,
    positions: [
      { id: 'PR',   label: 'PR',  x: 50, y: 88 },
      { id: 'PRL1', label: 'RL1', x: 25, y: 72 },
      { id: 'PRL2', label: 'RL2', x: 10, y: 66 },
      { id: 'PRL3', label: 'RL3', x: 22, y: 66 },
      { id: 'PRR1', label: 'RR1', x: 75, y: 72 },
      { id: 'PRR2', label: 'RR2', x: 90, y: 66 },
      { id: 'PRR3', label: 'RR3', x: 78, y: 66 },
      { id: 'PRB1', label: 'RB1', x: 36, y: 66 },
      { id: 'PRB2', label: 'RB2', x: 50, y: 66 },
      { id: 'PRB3', label: 'RB3', x: 64, y: 66 },
      { id: 'VP',   label: 'VP',  x: 50, y: 78 },
    ],
  },

  // ── FIELD GOAL ───────────────────────────────────
  {
    id:        'default-st-fg',
    name:      'Field Goal',
    unit:      'ST',
    isDefault: true,
    positions: [
      { id: 'K',   label: 'K',   x: 50, y: 78 },
      { id: 'H',   label: 'H',   x: 50, y: 72 },
      { id: 'LS',  label: 'LS',  x: 50, y: 66 },
      { id: 'GL1', label: 'GL1', x: 43, y: 66 },
      { id: 'GL2', label: 'GL2', x: 36, y: 66 },
      { id: 'GL3', label: 'GL3', x: 29, y: 66 },
      { id: 'GL4', label: 'GL4', x: 22, y: 66 },
      { id: 'GR1', label: 'GR1', x: 57, y: 66 },
      { id: 'GR2', label: 'GR2', x: 64, y: 66 },
      { id: 'GR3', label: 'GR3', x: 71, y: 66 },
      { id: 'GR4', label: 'GR4', x: 78, y: 66 },
    ],
  },

  // ── FIELD GOAL DEFENSE ───────────────────────────
  {
    id:        'default-st-fg-defense',
    name:      'Field Goal Defense',
    unit:      'ST',
    isDefault: true,
    positions: [
      { id: 'FGD-N',  label: 'NT',  x: 50, y: 62 },
      { id: 'FGD-L1', label: 'DL1', x: 43, y: 62 },
      { id: 'FGD-L2', label: 'DL2', x: 36, y: 62 },
      { id: 'FGD-L3', label: 'DL3', x: 29, y: 62 },
      { id: 'FGD-R1', label: 'DR1', x: 57, y: 62 },
      { id: 'FGD-R2', label: 'DR2', x: 64, y: 62 },
      { id: 'FGD-R3', label: 'DR3', x: 71, y: 62 },
      { id: 'FGD-B1', label: 'LB1', x: 33, y: 70 },
      { id: 'FGD-B2', label: 'LB2', x: 67, y: 70 },
      { id: 'FGD-S1', label: 'S1',  x: 20, y: 56 },
      { id: 'FGD-S2', label: 'S2',  x: 80, y: 56 },
    ],
  },
];

/**
 * Seed default formations if pp_formations is empty or missing.
 * Preserves any user-created formations; only adds defaults by id.
 */
function initDefaultFormations() {
  const existing = ppGet(PP_KEYS.formations()) ?? [];

  // Actualizar formaciones default existentes con nuevas coordenadas
  let updated = existing.filter(f => !f.isDefault); // conservar las custom
  DEFAULT_FORMATIONS.forEach(df => {
    updated.push(JSON.parse(JSON.stringify(df)));
  });

  ppSet(PP_KEYS.formations(), updated);
}

/* ────────────────────────────────────────────
   MODULE: GRADE CONFIG
──────────────────────────────────────────── */
const DEFAULT_GRADE_CATS = [
  { key: 'asignacion', label: 'Asignación' },
  { key: 'ejecucion',  label: 'Ejecución'  },
  { key: 'decision',   label: 'Decisión'   },
  { key: 'impacto',    label: 'Impacto'    },
  { key: 'disciplina', label: 'Disciplina' },
];

function getGradeCats() {
  try {
    const raw = localStorage.getItem(TeamConfig.key('pp_grade_cats'));
    if (!raw) return DEFAULT_GRADE_CATS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_GRADE_CATS;
  } catch { return DEFAULT_GRADE_CATS; }
}

function saveGradeCats(cats) {
  localStorage.setItem(TeamConfig.key('pp_grade_cats'), JSON.stringify(cats));
}

function resetGradeCats() {
  localStorage.removeItem(TeamConfig.key('pp_grade_cats'));
}

/* ────────────────────────────────────────────
   PLAYSYNC CSV PARSER
──────────────────────────────────────────── */

/**
 * Parse a single CSV line respecting double-quoted fields.
 * Returns array of string values (quotes stripped).
 */
function parseCSVLine(line) {
  const result = [];
  let cur      = '';
  let inQuote  = false;

  for (let i = 0; i < line.length; i++) {
    const ch   = line[i];
    const next = line[i + 1];

    if (inQuote) {
      if (ch === '"' && next === '"') { cur += '"'; i++; }   // escaped quote
      else if (ch === '"')           { inQuote = false; }
      else                           { cur += ch; }
    } else {
      if (ch === '"')      { inQuote = true; }
      else if (ch === ',') { result.push(cur); cur = ''; }
      else                 { cur += ch; }
    }
  }
  result.push(cur);
  return result;
}

/**
 * Parse a PlaySync CSV export into an array of play objects.
 * The first non-empty line is treated as the header row.
 */
function parsePlaySyncCSV(text) {
  const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.trim());

  const plays = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    if (vals.every(v => !v.trim())) continue;   // skip blank rows

    const col = (name) => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? (vals[idx] ?? '').trim() : '';
    };

    plays.push({
      playNumber:   col('#'),
      timestamp:    col('Timestamp'),
      drive:        col('Drive'),
      poss:         col('Poss'),
      down:         col('Down'),
      toFirst:      col('To First'),
      yardLine:     col('Yard Line'),
      yardDisplay:  col('Yard Display'),
      quarter:      col('Quarter'),
      formation:    col('Formation'),
      play:         col('Play'),
      type:         col('Type'),
      motion:       col('Motion'),
      strength:     col('Strength'),
      hash:         col('Hash'),
      yardsGained:  col('Yards Gained'),
      result:       col('Result'),
      playerNumber: col('Player #'),
      noPlay:       col('No Play'),
      penaltyType:  col('Penalty Type'),
      front:        col('Front'),
      blitz:        col('Blitz'),
      coverage:     col('Coverage'),
      notes:        col('Notes'),
      // Player Participation fields (empty on import)
      unit:         '',
      lineup:       {},    // { positionId: playerId }
      grades:       {},    // { playerId: { asignacion, ejecucion, decision, impacto, disciplina } }
    });
  }
  return plays;
}

/**
 * Create a game record and persist its plays from a PlaySync CSV.
 * @param {string} csvText  - raw CSV content
 * @param {{ name, date, opponent }} meta - game metadata
 * @returns {string} - id of the created game
 */
function createGameFromCSV(csvText, meta) {
  const id    = generateId();
  const plays = parsePlaySyncCSV(csvText);
  saveGame({ id, name: meta.name || 'Partido', date: meta.date || '', opponent: meta.opponent || '', status: 'active' });
  savePlays(id, plays);
  return id;
}

/* ────────────────────────────────────────────
   UTILITIES
──────────────────────────────────────────── */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    // Parse as local date (avoid UTC offset shift)
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getUnitLabel(unit) {
  const map = { OFE: 'Ofensiva', DEF: 'Defensiva', ST: 'Equipos Especiales' };
  return map[unit] ?? unit;
}

/* ────────────────────────────────────────────
   MODULE: GAMETIME IMPORT
──────────────────────────────────────────── */

/**
 * Importa un partido de Gametime a PP.
 * Lee de TeamConfig.key('playsync_games'), mapea history[] → plays[].
 * @param {string} gametimeGameId - id del partido en Gametime
 * @returns {string} - id del partido creado en PP
 */
function importGameFromGametime(gametimeGameId, customName) {
  const raw   = localStorage.getItem(TeamConfig.key('playsync_games'));
  const games = raw ? JSON.parse(raw) : [];
  const game  = games.find(g => g.id === gametimeGameId);
  if (!game) throw new Error('Partido no encontrado en Gametime');

  const history = game.state?.history ?? [];

  const plays = history.map((h, i) => ({
    playNumber:   i + 1,
    timestamp:    h.timestamp || new Date().toISOString(),
    down:         h.down,
    toFirst:      h.toFirst,
    yardLine:     h.oppYardLine,
    yardDisplay:  h.yardDisplay || '',
    quarter:      h.quarter,
    formation:    h.formationName || '',
    play:         h.playName || '',
    type:         h.type || '',
    unit:         h.mode === 'opp'
                    ? 'DEF'
                    : h.mode === 'st'
                      ? (h.stRole === 'return' ? 'ST-RET' : 'ST-KICK')
                      : 'OFE',
    yardsGained:  h.yardsGained ?? '',
    result:       h.result || '',
    noPlay:       h.noPlay || false,
    penaltyType:  h.penalty?.foul || '',
    front:        h.selectedFront || '',
    blitz:        h.selectedBlitz || '',
    coverage:     h.selectedCoverage || '',
    lineup:       {},
    grades:       {},
  }));

  const newId = generateId();
  saveGame({
    id:       newId,
    name:     customName || [
                game.teamHome, 'vs', game.teamAway,
                game.week && !isNaN(game.week) ? `— Sem. ${game.week}` : (game.week || ''),
              ].filter(Boolean).join(' ') || 'Partido importado',
    date:     (() => {
      if (!game.date) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(game.date)) return game.date;
      try {
        const parsed = new Date(game.date);
        if (!isNaN(parsed)) return parsed.toISOString().split('T')[0];
      } catch {}
      return '';
    })(),
    opponent: game.teamAway || '',
    status:   'active',
  });
  savePlays(newId, plays);
  return newId;
}

/**
 * Retorna los partidos disponibles en Gametime que aún no han sido importados a PP.
 */
function getGametimeGamesAvailable() {
  try {
    const raw        = localStorage.getItem(TeamConfig.key('playsync_games'));
    const gtGames    = raw ? JSON.parse(raw) : [];
    const ppGames    = getGames();
    // Filtrar los que ya fueron importados (mismo nombre + fecha)
    return gtGames.filter(g => {
      const hasHistory = (g.state?.history?.length ?? 0) > 0;
      const alreadyImported = ppGames.some(p =>
        p.opponent === g.teamAway && p.name.includes(g.teamHome || '')
      );
      return hasHistory && !alreadyImported;
    });
  } catch { return []; }
}

/* ────────────────────────────────────────────
   INIT
──────────────────────────────────────────── */
initDefaultFormations();
