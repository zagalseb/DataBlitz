// ══════════════════════════════════════════
// teamConfig.js — Multi-team identity
// ══════════════════════════════════════════

const TeamConfig = (() => {

  const ACTIVE_KEY = 'playsync_active_team'; // código del equipo activo
  const TEAMS_KEY  = 'playsync_teams';        // lista de equipos registrados

  const DEFAULTS = {
    name:        'Mi Equipo',
    initials:    'ME',
    color:       '#00C896',
    logo:        null,
    configuredAt: null,
  };

  // ── Equipo activo ─────────────────────
  function getActiveTeam() {
    return localStorage.getItem(ACTIVE_KEY) || null;
  }

  function setActiveTeam(code) {
    localStorage.setItem(ACTIVE_KEY, code);
  }

  function clearActiveTeam() {
    localStorage.removeItem(ACTIVE_KEY);
  }

  // ── Namespace ─────────────────────────
  // Todas las keys de localStorage usan el código como prefijo
  function key(k) {
    const team = getActiveTeam();
    return team ? `${team}:${k}` : k;
  }

  // ── Equipos registrados ───────────────
  function getTeams() {
    try {
      const raw = localStorage.getItem(TEAMS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function saveTeams(teams) {
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  }

  function teamExists(code) {
    return getTeams().some(t => t.code === code.toUpperCase().trim());
  }

  function registerTeam(code, products) {
    const teams = getTeams();
    const normalized = code.toUpperCase().trim();
    if (!teams.some(t => t.code === normalized)) {
      teams.push({
        code: normalized,
        createdAt: new Date().toISOString(),
        products: Array.isArray(products) ? products : ['gametime', 'pp'],
      });
      saveTeams(teams);
    }
  }

  function getTeamProducts(code) {
    const normalized = (code || '').toUpperCase().trim();
    const team = getTeams().find(t => t.code === normalized);
    if (!team) return [];
    // Backward compatible: si no tiene products, asumir acceso a ambos
    return Array.isArray(team.products) ? team.products : ['gametime', 'pp'];
  }

  function updateTeamProducts(code, products) {
    const normalized = (code || '').toUpperCase().trim();
    const teams = getTeams();
    const idx = teams.findIndex(t => t.code === normalized);
    if (idx === -1) return;
    teams[idx] = { ...teams[idx], products: Array.isArray(products) ? products : [] };
    saveTeams(teams);
  }

  function removeTeam(code) {
    const normalized = code.toUpperCase().trim();
    // Borrar todas las keys del equipo
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`${normalized}:`)) keysToDelete.push(k);
    }
    keysToDelete.forEach(k => localStorage.removeItem(k));
    // Borrar de la lista
    saveTeams(getTeams().filter(t => t.code !== normalized));
    // Si era el activo, limpiar
    if (getActiveTeam() === normalized) clearActiveTeam();
  }

  // ── Config del equipo activo ──────────
  function get() {
    try {
      const raw = localStorage.getItem(key('playsync_team_config'));
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch { return { ...DEFAULTS }; }
  }

  function set(data) {
    const current = get();
    localStorage.setItem(
      key('playsync_team_config'),
      JSON.stringify({ ...current, ...data })
    );
  }

  function isConfigured() {
    try {
      const raw = localStorage.getItem(key('playsync_team_config'));
      if (!raw) return false;
      const cfg = JSON.parse(raw);
      return !!(cfg.configuredAt && cfg.name);
    } catch { return false; }
  }

  // ── Login ─────────────────────────────
  function login(code) {
    const normalized = code.toUpperCase().trim();
    if (!teamExists(normalized)) return false;
    setActiveTeam(normalized);
    return true;
  }

  function logout() {
    clearActiveTeam();
    window.location.href = 'login.html';
  }

  // ── Apply al DOM ──────────────────────
  function apply() {
    const cfg = get();

    // Color accent
    document.documentElement.style.setProperty('--accent', cfg.color);
    const hex = cfg.color.replace('#', '');
    const r   = parseInt(hex.slice(0,2), 16);
    const g   = parseInt(hex.slice(2,4), 16);
    const b   = parseInt(hex.slice(4,6), 16);
    document.documentElement.style.setProperty(
      '--accent-muted', `rgba(${r},${g},${b},0.12)`
    );

    // Logo / initials
    const logoIcon = document.querySelector('.logo-icon');
    const logoText = document.querySelector('.logo-text');

    if (logoIcon) {
      if (cfg.logo) {
        logoIcon.innerHTML = `<img src="${cfg.logo}" alt="${cfg.name}"
          style="width:100%;height:100%;object-fit:cover;border-radius:6px;">`;
        logoIcon.style.padding  = '0';
        logoIcon.style.overflow = 'hidden';
      } else {
        logoIcon.textContent   = cfg.initials || cfg.name.slice(0,2).toUpperCase();
        logoIcon.style.padding = '';
      }
      logoIcon.style.background = cfg.color;
      logoIcon.style.color      = _contrastColor(cfg.color);
    }

    if (logoText) logoText.textContent = cfg.name;
  }

  function _contrastColor(hex) {
    const h = hex.replace('#','');
    const r = parseInt(h.slice(0,2),16);
    const g = parseInt(h.slice(2,4),16);
    const b = parseInt(h.slice(4,6),16);
    return (0.299*r + 0.587*g + 0.114*b)/255 > 0.55 ? '#000000' : '#ffffff';
  }

  // ── Guard: redirigir si no hay equipo activo ──
  function requireTeam() {
    if (!getActiveTeam()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  return {
    key,
    get, set, isConfigured,
    getActiveTeam, setActiveTeam, clearActiveTeam,
    getTeams, registerTeam, removeTeam, teamExists, getTeamProducts, updateTeamProducts,
    login, logout,
    apply, requireTeam,
  };

})();
