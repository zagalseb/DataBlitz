// ══════════════════════════════════════════
// playEditor.js — Edit recorded plays
// ══════════════════════════════════════════

const PlayEditor = (() => {

  let _playId = null; // timestamp used as unique ID

  // ── Find play by timestamp ─────────────
  function _findPlay(id) {
    return State.history.find(p => p.timestamp === id) || null;
  }

  // ── Open modal ────────────────────────
  function open(playId) {
    const play = _findPlay(playId);
    if (!play) return;
    _playId = playId;
    _populate(play);
    document.getElementById('play-editor-overlay').style.display = 'flex';
  }

  function close() {
    document.getElementById('play-editor-overlay').style.display = 'none';
    _playId = null;
  }

  // ── Populate form from play object ────
  function _populate(play) {
    // Formation select
    const formSel = document.getElementById('pe-formation');
    formSel.innerHTML = PLAYBOOK.formations.map(f =>
      `<option value="${f.id}" ${f.id === play.formation ? 'selected' : ''}>${f.name}</option>`
    ).join('');

    // Trigger play list population
    _populatePlays(play.formation, play.play);

    // Type
    document.getElementById('pe-type-run').classList.toggle('active', play.type === 'run');
    document.getElementById('pe-type-pass').classList.toggle('active', play.type === 'pass');

    // Yards
    document.getElementById('pe-yards').value = play.yardsGained ?? 0;

    // Result
    document.querySelectorAll('.pe-result-btn').forEach(b => {
      b.classList.toggle('selected', b.dataset.result === play.result);
    });

    // Player + Notes
    document.getElementById('pe-player').value = play.playerNumber || '';
    document.getElementById('pe-notes').value  = play.notes || '';

    // Defense — use the playbook that was active when the play was recorded
    const defPb = (play.mode === 'opp') ? getOwnDefPlaybook() : getOppDefPlaybook();
    _selectDef('pe-front-list',    defPb.fronts,    play.selectedFront);
    _selectDef('pe-blitz-list',    defPb.blitzes,   play.selectedBlitz);
    _selectDef('pe-coverage-list', defPb.coverages, play.selectedCoverage);
  }

  function _populatePlays(formationId, selectedPlayId) {
    const playSel = document.getElementById('pe-play');
    const plays = getPlaysForFormation(formationId);
    playSel.innerHTML = plays.map(p =>
      `<option value="${p.id}" ${p.id === selectedPlayId ? 'selected' : ''}>${p.name}</option>`
    ).join('');
  }

  function _selectDef(listId, items, selectedId) {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = '';
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'pe-def-item' + (item.id === selectedId ? ' selected' : '');
      el.textContent = item.name;
      el.dataset.id = item.id;
      el.addEventListener('click', () => {
        list.querySelectorAll('.pe-def-item').forEach(i => i.classList.remove('selected'));
        el.classList.add('selected');
      });
      list.appendChild(el);
    });
  }

  // ── Save changes ──────────────────────
  function _save() {
    const play = _findPlay(_playId);
    if (!play) return;

    // Formation & play
    const formationId = document.getElementById('pe-formation').value;
    const playId      = document.getElementById('pe-play').value;
    const formation   = PLAYBOOK.formations.find(f => f.id === formationId);
    const plays       = getPlaysForFormation(formationId);
    const playObj     = plays.find(p => p.id === playId);

    play.formation     = formationId;
    play.formationName = formation?.name || '';
    play.play          = playId;
    play.playName      = playObj?.name || '';

    // Type
    play.type = document.getElementById('pe-type-run').classList.contains('active') ? 'run' : 'pass';

    // Yards
    play.yardsGained = parseInt(document.getElementById('pe-yards').value, 10) || 0;

    // Result
    const selectedResult = document.querySelector('.pe-result-btn.selected');
    play.result = selectedResult ? selectedResult.dataset.result : '';

    // Player + Notes
    play.playerNumber = parseInt(document.getElementById('pe-player').value, 10) || null;
    play.notes        = document.getElementById('pe-notes').value.trim();

    // Defense
    play.selectedFront    = document.querySelector('#pe-front-list .pe-def-item.selected')?.dataset.id    || '';
    play.selectedBlitz    = document.querySelector('#pe-blitz-list .pe-def-item.selected')?.dataset.id    || 'none';
    play.selectedCoverage = document.querySelector('#pe-coverage-list .pe-def-item.selected')?.dataset.id || '';

    // Sync into completed drives if needed
    State.drives.forEach(drive => {
      const idx = drive.playEntries.findIndex(p => p.timestamp === _playId);
      if (idx !== -1) drive.playEntries[idx] = play;
    });

    close();
    renderHistory();
  }

  // ── Delete play ───────────────────────
  function _delete() {
    if (!confirm('Delete this play? This cannot be undone.')) return;

    // Remove from history
    const idx = State.history.findIndex(p => p.timestamp === _playId);
    if (idx !== -1) State.history.splice(idx, 1);

    // Remove from completed drives
    State.drives.forEach(drive => {
      const di = drive.playEntries.findIndex(p => p.timestamp === _playId);
      if (di !== -1) {
        drive.playEntries.splice(di, 1);
        drive.plays = drive.playEntries.length;
        drive.yards = drive.playEntries.reduce((s, p) => s + (p.yardsGained || 0), 0);
      }
    });

    // Adjust currentDriveStart if needed
    if (idx !== -1 && idx < State.currentDriveStart) {
      State.currentDriveStart = Math.max(0, State.currentDriveStart - 1);
    }

    close();
    renderHistory();
  }

  // ── Build DOM ─────────────────────────
  function _buildDOM() {
    if (document.getElementById('play-editor-overlay')) return;

    const el = document.createElement('div');
    el.id = 'play-editor-overlay';
    el.style.display = 'none';
    el.innerHTML = `
      <div id="play-editor">

        <div class="pe-header">
          <span class="pe-title">Edit Play</span>
          <div class="pe-header-actions">
            <button class="pe-delete-btn" id="pe-btn-delete">Delete play</button>
            <button class="icon-btn" id="pe-btn-close">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="pe-body">

          <!-- Col 1: Formation + Play + Type -->
          <div class="pe-section">
            <div class="pe-field">
              <label class="pe-label">Formation</label>
              <select class="pe-select" id="pe-formation"></select>
            </div>
            <div class="pe-field">
              <label class="pe-label">Play</label>
              <select class="pe-select" id="pe-play"></select>
            </div>
            <div class="pe-field">
              <label class="pe-label">Type</label>
              <div class="pe-type-toggle">
                <button class="pe-type-btn" id="pe-type-run">RUN</button>
                <button class="pe-type-btn" id="pe-type-pass">PASS</button>
              </div>
            </div>
            <div class="pe-field">
              <label class="pe-label">Yards Gained</label>
              <input class="pe-input" id="pe-yards" type="number"
                     min="-99" max="99" inputmode="numeric" />
            </div>
            <div class="pe-field">
              <label class="pe-label">Player #</label>
              <input class="pe-input" id="pe-player" type="number"
                     min="0" max="99" inputmode="numeric" placeholder="—" />
            </div>
            <div class="pe-field">
              <label class="pe-label">Notes</label>
              <textarea class="pe-textarea" id="pe-notes" maxlength="80" placeholder="Quick note..."></textarea>
            </div>
          </div>

          <!-- Col 2: Result -->
          <div class="pe-section">
            <label class="pe-label">Result</label>
            <div class="pe-result-grid">
              <button class="pe-result-btn" data-result="1st Down">1st Down</button>
              <button class="pe-result-btn" data-result="TD">🏈 TD</button>
              <button class="pe-result-btn" data-result="Incomplete">Incomplete</button>
              <button class="pe-result-btn" data-result="Complete">Complete</button>
              <button class="pe-result-btn" data-result="Gain">Gain</button>
              <button class="pe-result-btn" data-result="TFL">TFL</button>
              <button class="pe-result-btn" data-result="Turnover">Turnover</button>
              <button class="pe-result-btn" data-result="Sack">Sack</button>
              <button class="pe-result-btn" data-result="Scramble">Scramble</button>
              <button class="pe-result-btn" data-result="Punt">Punt</button>
              <button class="pe-result-btn" data-result="FG">FG</button>
              <button class="pe-result-btn" data-result="Safety">Safety</button>
            </div>
          </div>

          <!-- Col 3: Defense -->
          <div class="pe-section">
            <div class="pe-field">
              <label class="pe-label pe-label-def">Front</label>
              <div class="pe-def-list" id="pe-front-list"></div>
            </div>
            <div class="pe-field">
              <label class="pe-label pe-label-def">Blitz</label>
              <div class="pe-def-list" id="pe-blitz-list"></div>
            </div>
            <div class="pe-field">
              <label class="pe-label pe-label-def">Coverage</label>
              <div class="pe-def-list" id="pe-coverage-list"></div>
            </div>
          </div>

        </div>

        <div class="pe-footer">
          <button class="btn-secondary" id="pe-btn-cancel">Cancel</button>
          <button class="btn-primary" id="pe-btn-save">Save Changes</button>
        </div>

      </div>
    `;

    document.body.appendChild(el);

    // Close
    document.getElementById('pe-btn-close').addEventListener('click', close);
    document.getElementById('pe-btn-cancel').addEventListener('click', close);
    el.addEventListener('click', e => { if (e.target === el) close(); });

    // Delete
    document.getElementById('pe-btn-delete').addEventListener('click', _delete);

    // Save
    document.getElementById('pe-btn-save').addEventListener('click', _save);

    // Formation change → repopulate plays
    document.getElementById('pe-formation').addEventListener('change', function () {
      _populatePlays(this.value, null);
    });

    // Type toggle
    document.getElementById('pe-type-run').addEventListener('click', () => {
      document.getElementById('pe-type-run').classList.add('active');
      document.getElementById('pe-type-pass').classList.remove('active');
    });
    document.getElementById('pe-type-pass').addEventListener('click', () => {
      document.getElementById('pe-type-pass').classList.add('active');
      document.getElementById('pe-type-run').classList.remove('active');
    });

    // Result buttons
    document.querySelectorAll('.pe-result-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pe-result-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  }

  function init() {
    _buildDOM();
  }

  return { init, open, close };
})();
