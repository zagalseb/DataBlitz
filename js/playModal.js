// ══════════════════════════════════════════
// playModal.js — Bottom-sheet play logger
// ══════════════════════════════════════════

const PlayModal = (() => {
  // ── Internal state ─────────────────────
  let _yardsGained = 0;
  let _result      = null;
  let _player      = '';
  let _sack        = false;
  let _scramble    = false;
  let _penaltyOn   = false;
  let _penaltyType = '';
  let _penaltyYards= 0;
  let _penaltyTeam = 'OFF';
  let _notes       = '';

  // ── Build DOM (runs once) ──────────────
  function _buildDOM() {
    if (document.getElementById('play-modal-backdrop')) return;

    const el = document.createElement('div');
    el.id = 'play-modal-backdrop';
    el.innerHTML = `
      <div id="play-modal" role="dialog" aria-modal="true" aria-label="Log Play">

        <div class="modal-handle"></div>

        <div class="modal-header">
          <span class="modal-title">Log Play</span>
          <button class="modal-cancel-btn" id="modal-btn-cancel">Cancel</button>
        </div>

        <div class="modal-body">

          <!-- ① Yards Gained -->
          <div class="modal-section">
            <div class="modal-label">Yards Gained</div>
            <div class="modal-yards-row">
              <button class="modal-quick-btn" data-delta="-5">−5</button>
              <button class="modal-quick-btn" data-delta="-1">−1</button>
              <div class="modal-yards-display" id="modal-yards-display" title="Tap to enter">0</div>
              <button class="modal-quick-btn" data-delta="1">+1</button>
              <button class="modal-quick-btn" data-delta="5">+5</button>
            </div>
          </div>

          <!-- ② Result -->
          <div class="modal-section">
            <div class="modal-label">Result</div>
            <div class="modal-result-row" id="modal-result-row">
              <button class="modal-result-btn" data-result="TD">TD</button>
              <button class="modal-result-btn" data-result="1st Down">1st Down</button>
              <button class="modal-result-btn" data-result="Incomplete">Incomplete</button>
              <button class="modal-result-btn" data-result="Turnover">Turnover</button>
              <button class="modal-result-btn" data-result="Punt">Punt</button>
              <button class="modal-result-btn" data-result="FG">FG</button>
              <button class="modal-result-btn" data-result="Safety">Safety</button>
            </div>
          </div>

          <!-- ③ Player # + Pass Options -->
          <div class="modal-section modal-section-inline">
            <div class="modal-inline-group">
              <div class="modal-label">Player #</div>
              <input
                class="modal-player-input"
                id="modal-player-num"
                type="number"
                min="0" max="99"
                placeholder="—"
                inputmode="numeric"
              />
            </div>
            <div class="modal-inline-group" id="modal-pass-extras">
              <div class="modal-label">Pass Options</div>
              <div class="modal-toggles-row">
                <button class="modal-toggle-btn" id="modal-sack">Sack</button>
                <button class="modal-toggle-btn" id="modal-scramble">Scramble</button>
              </div>
            </div>
          </div>

          <!-- ④ Penalty -->
          <div class="modal-section">
            <div class="modal-penalty-header">
              <div class="modal-label">Penalty</div>
              <button class="modal-toggle-btn" id="modal-penalty-toggle">Off</button>
            </div>
            <div class="modal-penalty-body" id="modal-penalty-body">
              <input
                class="modal-text-input"
                id="modal-penalty-type"
                type="text"
                placeholder="Penalty type (e.g. Holding)"
                maxlength="60"
              />
              <div class="modal-penalty-row2">
                <input
                  class="modal-player-input"
                  id="modal-penalty-yards"
                  type="number"
                  min="0" max="99"
                  placeholder="Yds"
                  inputmode="numeric"
                />
                <div class="modal-team-toggle" id="modal-penalty-team">
                  <button class="modal-team-btn active" data-team="OFF">OFF</button>
                  <button class="modal-team-btn"        data-team="DEF">DEF</button>
                </div>
              </div>
            </div>
          </div>

          <!-- ⑤ Notes -->
          <div class="modal-section">
            <div class="modal-label">Notes</div>
            <input
              class="modal-text-input"
              id="modal-notes"
              type="text"
              placeholder="Quick note…"
              maxlength="80"
            />
          </div>

        </div><!-- /modal-body -->

        <div class="modal-footer">
          <button class="modal-confirm-btn" id="modal-btn-confirm">Confirm Play</button>
        </div>

      </div>
    `;

    document.body.appendChild(el);
    _bindEvents();
  }

  // ── Reset to defaults ──────────────────
  function _reset() {
    _yardsGained  = 0;
    _result       = null;
    _player       = '';
    _sack         = false;
    _scramble     = false;
    _penaltyOn    = false;
    _penaltyType  = '';
    _penaltyYards = 0;
    _penaltyTeam  = 'OFF';
    _notes        = '';
  }

  // ── Populate DOM from internal state ───
  function _syncDOM() {
    // Yards
    document.getElementById('modal-yards-display').textContent = _yardsGained;

    // Result — clear all
    document.querySelectorAll('.modal-result-btn').forEach(b =>
      b.classList.remove('active')
    );

    // Pass extras visibility
    const isPass = State.playType === 'pass';
    document.getElementById('modal-pass-extras').style.display = isPass ? '' : 'none';

    // Sack / Scramble
    document.getElementById('modal-sack').classList.toggle('active', _sack);
    document.getElementById('modal-scramble').classList.toggle('active', _scramble);

    // Player
    document.getElementById('modal-player-num').value = _player;

    // Penalty toggle
    const pToggle = document.getElementById('modal-penalty-toggle');
    pToggle.textContent = 'Off';
    pToggle.classList.remove('active');
    document.getElementById('modal-penalty-body').style.display = 'none';

    // Penalty fields
    document.getElementById('modal-penalty-type').value  = '';
    document.getElementById('modal-penalty-yards').value = '';
    document.querySelectorAll('.modal-team-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.team === 'OFF')
    );

    // Notes
    document.getElementById('modal-notes').value = '';
  }

  // ── Bind all events (once after build) ─
  function _bindEvents() {
    // Backdrop tap — close
    document.getElementById('play-modal-backdrop').addEventListener('click', e => {
      if (e.target.id === 'play-modal-backdrop') close();
    });

    // Cancel
    document.getElementById('modal-btn-cancel').addEventListener('click', close);

    // Yards quick buttons
    document.querySelectorAll('.modal-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _yardsGained = Math.max(-99, Math.min(99, _yardsGained + parseInt(btn.dataset.delta, 10)));
        document.getElementById('modal-yards-display').textContent = _yardsGained;
      });
    });

    // Yards display — tap to type
    document.getElementById('modal-yards-display').addEventListener('click', function () {
      const raw = prompt('Yards gained:', _yardsGained);
      if (raw !== null && raw.trim() !== '' && !isNaN(parseInt(raw, 10))) {
        _yardsGained = Math.max(-99, Math.min(99, parseInt(raw, 10)));
        this.textContent = _yardsGained;
      }
    });

    // Result buttons
    document.querySelectorAll('.modal-result-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _result = (_result === btn.dataset.result) ? null : btn.dataset.result;
        document.querySelectorAll('.modal-result-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.result === _result)
        );
      });
    });

    // Sack
    document.getElementById('modal-sack').addEventListener('click', function () {
      _sack = !_sack;
      this.classList.toggle('active', _sack);
    });

    // Scramble
    document.getElementById('modal-scramble').addEventListener('click', function () {
      _scramble = !_scramble;
      this.classList.toggle('active', _scramble);
    });

    // Player #
    document.getElementById('modal-player-num').addEventListener('input', function () {
      _player = this.value;
    });

    // Penalty toggle
    document.getElementById('modal-penalty-toggle').addEventListener('click', function () {
      _penaltyOn = !_penaltyOn;
      this.textContent = _penaltyOn ? 'On' : 'Off';
      this.classList.toggle('active', _penaltyOn);
      document.getElementById('modal-penalty-body').style.display = _penaltyOn ? '' : 'none';
    });

    // Penalty type text
    document.getElementById('modal-penalty-type').addEventListener('input', function () {
      _penaltyType = this.value;
    });

    // Penalty yards
    document.getElementById('modal-penalty-yards').addEventListener('input', function () {
      _penaltyYards = parseInt(this.value, 10) || 0;
    });

    // OFF / DEF team buttons
    document.querySelectorAll('.modal-team-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _penaltyTeam = btn.dataset.team;
        document.querySelectorAll('.modal-team-btn').forEach(b =>
          b.classList.toggle('active', b === btn)
        );
      });
    });

    // Notes
    document.getElementById('modal-notes').addEventListener('input', function () {
      _notes = this.value;
    });

    // Confirm
    document.getElementById('modal-btn-confirm').addEventListener('click', _confirm);
  }

  // ── Confirm: log + advance + close ─────
  function _confirm() {
    const prevLen = State.history.length;

    // 1. Log base play entry (history.js)
    logPlay();

    // 2. Patch with modal data if entry was added
    if (State.history.length > prevLen) {
      const entry = State.history[State.history.length - 1];
      entry.yardsGained  = _yardsGained;
      entry.result       = _result;
      entry.playerNumber = _player;
      entry.sack         = State.playType === 'pass' ? _sack     : false;
      entry.scramble     = State.playType === 'pass' ? _scramble : false;
      entry.penalty      = _penaltyOn
        ? { type: _penaltyType, yards: _penaltyYards, team: _penaltyTeam }
        : null;
      entry.notes        = _notes;
    }

    // 3. Advance down & distance
    _applyResult(_result, _yardsGained);

    // 4. Close + refresh UI
    close();
    renderAll();
    renderHistory();
  }

  // ── Down / distance business logic ─────
  function _applyResult(result, yards) {
    // Scoring / possession-ending plays → kickoff state
    if (
      result === 'TD'       ||
      result === 'FG'       ||
      result === 'Punt'     ||
      result === 'Turnover' ||
      result === 'Safety'
    ) {
      State.down    = 1;
      State.toFirst = 10;
      return;
    }

    // First down achieved
    if (result === '1st Down') {
      State.down    = 1;
      State.toFirst = 10;
      return;
    }

    // Incomplete — no yards, same distance
    if (result === 'Incomplete') {
      if (State.down >= 4) {
        State.down    = 1;   // turnover on downs
        State.toFirst = 10;
      } else {
        State.down += 1;
        // toFirst unchanged on incomplete
      }
      return;
    }

    // Default (null or any other) — apply yards
    const newToFirst = State.toFirst - yards;
    if (newToFirst <= 0) {
      // Auto first down by yardage
      State.down    = 1;
      State.toFirst = 10;
    } else if (State.down >= 4) {
      // Turnover on downs
      State.down    = 1;
      State.toFirst = 10;
    } else {
      State.down   += 1;
      State.toFirst = Math.max(1, newToFirst);
    }
  }

  // ── Public API ─────────────────────────
  function open() {
    _buildDOM();
    _reset();
    _syncDOM();

    document.getElementById('play-modal-backdrop').classList.add('visible');
    // Next frame so the transform transition actually fires
    requestAnimationFrame(() => {
      document.getElementById('play-modal').classList.add('open');
    });
  }

  function close() {
    const backdrop = document.getElementById('play-modal-backdrop');
    const sheet    = document.getElementById('play-modal');
    if (!backdrop) return;

    sheet.classList.remove('open');
    setTimeout(() => backdrop.classList.remove('visible'), 300);
  }

  return { open, close };
})();
