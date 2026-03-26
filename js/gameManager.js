// ══════════════════════════════════════════
// gameManager.js — Multi-game management
// ══════════════════════════════════════════

const GameManager = (() => {

  let _ready = false;

  // ── Storage helpers ───────────────────
  function _loadGames() {
    try {
      return JSON.parse(
        localStorage.getItem(TeamConfig.key('playsync_games')) || '[]'
      );
    } catch { return []; }
  }

  function _saveGames(games) {
    localStorage.setItem(
      TeamConfig.key('playsync_games'),
      JSON.stringify(games)
    );
  }

  function _getCurrentId() {
    return localStorage.getItem(TeamConfig.key('playsync_current_game_id'));
  }

  function _setCurrentId(id) {
    localStorage.setItem(TeamConfig.key('playsync_current_game_id'), id);
  }

  // ── Serialize current State ───────────
  function _serializeState() {
    return {
      scoreHome:         State.scoreHome,
      scoreAway:         State.scoreAway,
      teamHome:          State.teamHome,
      teamAway:          State.teamAway,
      quarter:           State.quarter,
      down:              State.down,
      toFirst:           State.toFirst,
      oppYardLine:       State.oppYardLine,
      flipped:           State.flipped,
      playType:          State.playType,
      strength:          State.strength,
      hash:              State.hash,
      selectedFormation: State.selectedFormation,
      selectedPlay:      State.selectedPlay,
      selectedMotion:    State.selectedMotion,
      history:           State.history,
      currentDrive:      State.currentDrive,
      currentDriveStart: State.currentDriveStart,
      drives:            State.drives,
      opponentPlays:     State.opponentPlays,
      possessionMode:    State.possessionMode,
      stRole:            State.stRole,
    };
  }

  // ── Restore State from saved data ─────
  function _restoreState(saved) {
    Object.assign(State, saved);
    State.stRole = saved.stRole ?? 'kicking';
  }

  // ── Auto-save current game ────────────
  function autosave() {
    if (!_ready) return;
    const id = _getCurrentId();
    if (!id) return;

    const games = _loadGames();
    const idx   = games.findIndex(g => g.id === id);
    if (idx === -1) return;

    games[idx].scoreHome = State.scoreHome;
    games[idx].scoreAway = State.scoreAway;
    games[idx].teamHome  = State.teamHome;
    games[idx].teamAway  = State.teamAway;
    games[idx].plays     = State.history.length;
    games[idx].state     = _serializeState();

    _saveGames(games);
  }

  // ── Create new game ───────────────────
  function createGame(teamHome = 'HOME', teamAway = 'AWAY', week = '1') {
    const id = 'game_' + Date.now();
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-MX', {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    const game = {
      id, teamHome, teamAway,
      scoreHome: 0, scoreAway: 0,
      date: dateStr, week, plays: 0,
      state: null,
    };

    const games = _loadGames();
    games.unshift(game);
    _saveGames(games);
    _setCurrentId(id);

    if (typeof State !== 'undefined' && typeof renderAll === 'function') {
      Object.assign(State, {
        scoreHome: 0, scoreAway: 0,
        teamHome, teamAway,
        quarter: 1, down: 1, toFirst: 10,
        oppYardLine: 75, flipped: false,
        playType: 'pass', strength: 'L', hash: 'M',
        selectedFormation: 'max', selectedPlay: '',
        selectedMotion: 'none', yardsGained: 0,
        playerNumber: 0, selectedResult: '',
        history: [], currentDrive: 1,
        currentDriveStart: 0, drives: [],
        opponentPlays: [], possessionMode: 'own',
        stRole: 'kicking', historyFilter: 'all',
      });
      renderAll();
      renderHistory();
      renderDriveChip();
    } else {
      window.location.href = 'game.html';
    }
  }

  // ── Load existing game ────────────────
  function loadGame(id) {
    const games = _loadGames();
    const game  = games.find(g => g.id === id);
    if (!game) return;

    _setCurrentId(id);

    if (typeof State !== 'undefined' && typeof renderAll === 'function') {
      if (game.state) {
        _restoreState(game.state);
      } else {
        Object.assign(State, {
          scoreHome:         game.scoreHome || 0,
          scoreAway:         game.scoreAway || 0,
          teamHome:          game.teamHome  || 'HOME',
          teamAway:          game.teamAway  || 'AWAY',
          quarter:           1, down: 1, toFirst: 10,
          oppYardLine:       75, flipped: false,
          playType:          'pass', strength: 'L', hash: 'M',
          selectedFormation: 'max', selectedPlay: '',
          selectedMotion:    'none', yardsGained: 0,
          playerNumber:      0, selectedResult: '',
          history:           [], currentDrive: 1,
          currentDriveStart: 0, drives: [],
          opponentPlays:     [], possessionMode: 'own',
          stRole:            'kicking', historyFilter: 'all',
        });
      }
      renderAll();
      renderHistory();
      renderDriveChip();
    } else {
      window.location.href = 'game.html';
    }
  }

  // ── Delete game ───────────────────────
  function deleteGame(id) {
    let games = _loadGames();
    games = games.filter(g => g.id !== id);
    _saveGames(games);
    if (_getCurrentId() === id) {
      localStorage.removeItem(TeamConfig.key('playsync_current_game_id'));
    }
  }

  // ── Navigation ────────────────────────
  function showScreen() {
    autosave();
    window.location.href = 'games.html';
  }

  function closeScreen() {
    // DOM now lives in games.html — nothing to close
  }

  // ── Build DOM (stub) ──────────────────
  function _buildDOM() {
    // DOM now lives in games.html
  }

  // ── Init — called on DOMContentLoaded ─
  function init() {
    _ready = true;
    window.addEventListener('pagehide', autosave);

    if (!TeamConfig.requireTeam()) return;
    if (!TeamConfig.isConfigured()) {
      window.location.href = 'onboarding.html';
      return;
    }

    const currentId = _getCurrentId();
    const games     = _loadGames();

    if (currentId && games.find(g => g.id === currentId)) {
      loadGame(currentId);
    } else {
      window.location.href = 'games.html';
    }
  }

  return { init, autosave, showScreen, createGame, loadGame, deleteGame };
})();
