// ══════════════════════════════════════════
// app.js — Init & render orchestrator
// ══════════════════════════════════════════

// ── Render everything from State ──────────
function renderAll() {
  // Scores
  const homeEl = document.getElementById('score-home');
  const awayEl = document.getElementById('score-away');
  if (document.activeElement !== homeEl) homeEl.value = State.scoreHome;
  if (document.activeElement !== awayEl) awayEl.value = State.scoreAway;

  // Team names
  const homeNameEl = document.getElementById('team-home-name');
  const awayNameEl = document.getElementById('team-away-name');
  if (document.activeElement !== homeNameEl) homeNameEl.value = State.teamHome;
  if (document.activeElement !== awayNameEl) awayNameEl.value = State.teamAway;

  // Quarter buttons
  document.querySelectorAll('.quarter-btn').forEach(btn => {
    const q = isNaN(btn.dataset.q) ? btn.dataset.q : parseInt(btn.dataset.q);
    btn.classList.toggle('active', q === State.quarter);
  });

  // Situation chip
  updateSituationChip();

  // Counters
  renderAllCounters();

  // Play type toggle
  document.getElementById('btn-run').classList.toggle('active', State.playType === 'run');
  document.getElementById('btn-pass').classList.toggle('active', State.playType === 'pass');

  // Strength
  document.querySelectorAll('.strength-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.strength === State.strength);
  });

  // Hash
  document.querySelectorAll('.hash-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.hash === State.hash);
  });

  // Selectors
  renderFormationList();
  renderPlayList();
  MotionChip.render();

  // Play bar
  const badge = document.getElementById('play-badge');
  const nameEl = document.getElementById('play-name');
  badge.textContent = State.playType.toUpperCase();
  badge.className = `play-type-badge ${State.playType}`;
  nameEl.textContent = State.getFullPlayName();

  // Field
  updateBallMarker();

  // Defense lists
  renderDefenseLists();

  // Drive chip
  renderDriveChip();

  // Sync toggle visual
  document.querySelectorAll('.poss-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.mode === State.possessionMode)
  );

  // Sync ST role toggle visibility and active state
  const stToggle = document.getElementById('st-role-toggle');
  if (stToggle) {
    stToggle.style.display = State.possessionMode === 'st' ? 'flex' : 'none';
    document.querySelectorAll('.st-role-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.role === State.stRole)
    );
  }

  // Auto-save
  GameManager.autosave();
}

// ── Wire up events ────────────────────────
function initEvents() {
  // Run / Pass toggle
  document.getElementById('btn-run').addEventListener('click', () => {
    State.playType = 'run';
    renderAll();
  });
  document.getElementById('btn-pass').addEventListener('click', () => {
    State.playType = 'pass';
    renderAll();
  });

  // Strength
  document.querySelectorAll('.strength-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      State.strength = btn.dataset.strength;
      renderAll();
    });
  });

  // Hash
  document.querySelectorAll('.hash-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      State.hash = btn.dataset.hash;
      renderAll();
    });
  });

  // Flip direction
  document.getElementById('btn-flip').addEventListener('click', () => {
    State.flipped = !State.flipped;
    updateBallMarker();
  });

  // Player # — number grid (0–99, 5 per row)
  (function buildPlayerGrid() {
    const grid = document.getElementById('player-num-grid');
    if (!grid) return;
    const nums = [
      ...Array.from({length: 35}, (_, i) => i + 1),  // 1–35
      ...Array.from({length: 10}, (_, i) => i + 80),  // 80–89
    ];
    let html = '';
    nums.forEach(i => {
      html += `<button class="pnum-btn" data-num="${i}">${i}</button>`;
    });
    grid.innerHTML = html;
    grid.addEventListener('click', e => {
      const btn = e.target.closest('.pnum-btn');
      if (!btn) return;
      const num = parseInt(btn.dataset.num, 10);
      if (State.playerNumber === num) {
        State.playerNumber = 0;
        btn.classList.remove('active');
      } else {
        grid.querySelector('.pnum-btn.active')?.classList.remove('active');
        State.playerNumber = num;
        btn.classList.add('active');
      }
    });
  })();

  // Next Play — delegate entirely to PlayLogic
  document.getElementById('btn-next-play').addEventListener('click', () => {
    PlayLogic.commit();
  });

  // ── Penalty sheet ─────────────────────────
  document.getElementById('btn-penalty-toggle').addEventListener('click', openPenaltySheet);
  document.getElementById('pen-sheet-close').addEventListener('click', closePenaltySheet);
  document.getElementById('pen-backdrop').addEventListener('click', closePenaltySheet);

  // Team buttons
  document.querySelectorAll('.pen-team-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pen-team-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Decision buttons
  document.querySelectorAll('.pen-dec-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pen-dec-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Pre-snap → auto-check No Play
  document.getElementById('pen-presnap').addEventListener('change', function() {
    if (this.checked) document.getElementById('pen-noplay').checked = true;
  });

  // Yards → auto-sync Net Yards
  document.getElementById('pen-yards').addEventListener('input', function() {
    const netEl = document.getElementById('pen-net-yards');
    if (netEl.dataset.manual !== 'true') netEl.value = this.value;
  });
  document.getElementById('pen-net-yards').addEventListener('input', function() {
    this.dataset.manual = 'true';
  });

  // Confirm — marca el penalty como activo y cierra el sheet
  document.getElementById('pen-confirm-btn').addEventListener('click', () => {
    document.getElementById('btn-penalty-toggle').dataset.active = 'true';
    document.getElementById('btn-penalty-toggle').classList.add('pen-active');
    closePenaltySheet();
  });

  // Clear — limpia y desactiva
  document.getElementById('pen-clear-btn').addEventListener('click', () => {
    _clearPenaltySheet();
    document.getElementById('btn-penalty-toggle').dataset.active = 'false';
    document.getElementById('btn-penalty-toggle').classList.remove('pen-active');
  });

  // Result selection
  document.querySelectorAll('.result-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.result-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      State.selectedResult = btn.dataset.result;
    });
  });

  // Score inputs — sync to State on change
  document.getElementById('score-home').addEventListener('input', function () {
    State.scoreHome = parseInt(this.value, 10) || 0;
    GameManager.autosave();
  });
  document.getElementById('score-away').addEventListener('input', function () {
    State.scoreAway = parseInt(this.value, 10) || 0;
    GameManager.autosave();
  });

  const homeNameEl = document.getElementById('team-home-name');
  const awayNameEl = document.getElementById('team-away-name');
  if (document.activeElement !== homeNameEl) homeNameEl.value = State.teamHome;
  if (document.activeElement !== awayNameEl) awayNameEl.value = State.teamAway;

  document.getElementById('team-home-name').addEventListener('input', function () {
    State.teamHome = this.value || 'HOME';
    GameManager.autosave();
  });
  document.getElementById('team-away-name').addEventListener('input', function () {
    State.teamAway = this.value || 'AWAY';
    GameManager.autosave();
  });

  // Quarter selector
  document.querySelectorAll('.quarter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      State.quarter = isNaN(btn.dataset.q) ? btn.dataset.q : parseInt(btn.dataset.q);
      document.querySelectorAll('.quarter-btn').forEach(b =>
        b.classList.toggle('active', b === btn)
      );
    });
  });

  // Menu → Game selection screen
  document.getElementById('btn-menu').addEventListener('click', () => {
    GameManager.autosave();
    window.location.href = 'games.html';
  });

  // Playbook Editor button
  document.getElementById('btn-playbook-editor').addEventListener('click', () => {
    GameManager.autosave();
    window.location.href = 'playbook.html';
  });

  // End Drive
  document.getElementById('btn-end-drive').addEventListener('click', () => {
    endDrive();
    State.down    = 1;
    State.toFirst = 10;
    renderAll();
  });

  // History filter — All / Own / Opp
  document.querySelectorAll('.hist-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      State.historyFilter = btn.dataset.filter;
      document.querySelectorAll('.hist-filter-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.filter === State.historyFilter)
      );
      renderHistory();
    });
  });

  // Possession toggle — OWN / OPP / ST
  document.querySelectorAll('.poss-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.mode === State.possessionMode) return;
      State.possessionMode = btn.dataset.mode;
      if (btn.dataset.mode === 'st') {
        State.stRole = 'kicking';
        document.getElementById('st-role-toggle').style.display = 'flex';
        State.selectedFormation = 'st-kicking';
        const stPlays = getPlaysForFormation('st-kicking');
        State.selectedPlay = stPlays[0]?.id || '';
        State.playType = 'run';
      } else {
        document.getElementById('st-role-toggle').style.display = 'none';
        if (btn.dataset.mode === 'opp') {
          State.selectedFormation = 'opp-shotgun';
          const oppPlays = getPlaysForFormation('opp-shotgun');
          State.selectedPlay = oppPlays[0]?.id || '';
        } else {
          State.selectedFormation = 'max';
          const ownPlays = getPlaysForFormation('max');
          State.selectedPlay = ownPlays[0]?.id || '';
        }
      }
      State.selectedMotion = 'none';
      renderAll();
    });
  });

  // ST role toggle — Kicking / Return
  document.querySelectorAll('.st-role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.role === State.stRole) return;
      State.stRole = btn.dataset.role;
      document.querySelectorAll('.st-role-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.role === State.stRole)
      );
      if (State.stRole === 'kicking') {
        State.selectedFormation = 'st-kicking';
      } else {
        State.selectedFormation = 'st-return';
      }
      const stPlays = getPlaysForFormation(State.selectedFormation);
      State.selectedPlay = stPlays[0]?.id || '';
      renderAll();
    });
  });

}

// ── Penalty sheet helpers ─────────────────
function openPenaltySheet() {
  document.getElementById('pen-backdrop').classList.add('open');
  document.getElementById('pen-sheet').classList.add('open');
}
function closePenaltySheet() {
  document.getElementById('pen-backdrop').classList.remove('open');
  document.getElementById('pen-sheet').classList.remove('open');
}
function _clearPenaltySheet() {
  document.getElementById('pen-foul').value       = '';
  document.getElementById('pen-player-num').value = '';
  document.getElementById('pen-yards').value      = '10';
  document.getElementById('pen-net-yards').value  = '10';
  document.getElementById('pen-net-yards').dataset.manual = 'false';
  document.getElementById('pen-presnap').checked  = false;
  document.getElementById('pen-noplay').checked   = false;
  document.querySelectorAll('.pen-team-btn').forEach((b,i) => b.classList.toggle('active', i===0));
  document.querySelectorAll('.pen-dec-btn').forEach((b,i) => b.classList.toggle('active', i===0));
}

// ── Boot ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  PlaybookEditor.init();   // first — loads localStorage before everything else
  PlayEditor.init();
  HistoryOverlay.init();
  initField();
  initCounters();
  initExport();
  MotionChip.init();
  Opponent.init();
  initEvents();
  renderAll();
  renderHistory();
  renderDriveChip();
  GameManager.init(); // last — shows game selection screen
});
