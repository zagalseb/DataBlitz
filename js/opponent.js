// ══════════════════════════════════════════
// opponent.js — Embedded OPP tracking module
// ══════════════════════════════════════════

const Opponent = (() => {

  // ── Play field data ─────────────────────
  const FIELDS = {
    downs:      [['1','1st'], ['2','2nd'], ['3','3rd'], ['4','4th']],
    distances:  [['1-3','1–3'], ['4-6','4–6'], ['7-10','7–10'], ['10+','10+']],
    formations: [
      ['Shotgun','Shotgun'], ['Under Center','Under Center'],
      ['Pistol','Pistol'], ['Wildcat','Wildcat'], ['Empty','Empty']
    ],
    personnel:  [['11','11'], ['12','12'], ['21','21'], ['10','10'], ['22','22']],
    playTypes:  [['Run','Run'], ['Pass','Pass'], ['RPO','RPO']],
    directions: [['Left','← Left'], ['Middle','Middle'], ['Right','Right →']],
    results:    [
      ['Stop','Stop'], ['1st Down','1st Down'], ['TD','TD'],
      ['Turnover','Turnover'], ['Penalty','Penalty']
    ],
  };

  // ── UI state (not persisted) ─────────────
  let _activeTab = 'capture';
  let _yards     = 0;
  const _sel     = {};    // current chip selection
  const _sticky  = {};    // formation, personnel survive play reset

  // ── Helpers ──────────────────────────────
  function _pct(n, total) {
    return total ? Math.round(n / total * 100) + '%' : '—';
  }
  function _ords(n) {
    return { 1:'st', 2:'nd', 3:'rd', 4:'th' }[n] || 'th';
  }
  function _currentGameId() {
    return localStorage.getItem(TeamConfig.key('playsync_current_game_id'));
  }
  function _currentPlays() {
    const id = _currentGameId();
    if (!id) return State.opponentPlays;
    return State.opponentPlays.filter(p => p.gameId === id);
  }
  function _rpStats(arr) {
    const n    = arr.length;
    const runs = arr.filter(p => p.playType === 'Run').length;
    const pass = arr.filter(p => p.playType === 'Pass').length;
    const rpo  = arr.filter(p => p.playType === 'RPO').length;
    return {
      n, runs, pass, rpo,
      runPct:  _pct(runs, n),
      passPct: _pct(pass + rpo, n)
    };
  }
  function _freqOf(arr, field) {
    const counts = {};
    arr.forEach(p => { if (p[field]) counts[p[field]] = (counts[p[field]] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  // ── Build DOM ─────────────────────────────
  function _chipRow(field, items) {
    return `<div class="opp-chip-row">` +
      items.map(([val, label]) =>
        `<button class="opp-chip" data-field="${field}" data-value="${val}">${label}</button>`
      ).join('') +
      `</div>`;
  }

  function _buildCapture() {
    return `
      <div class="opp-capture">
        <div class="opp-grid">

          <div class="opp-field-group">
            <div class="opp-field-label">Down</div>
            ${_chipRow('down', FIELDS.downs)}
          </div>

          <div class="opp-field-group">
            <div class="opp-field-label">Distance</div>
            ${_chipRow('distance', FIELDS.distances)}
          </div>

          <div class="opp-field-group opp-full">
            <div class="opp-field-label">Formation <span class="opp-sticky-dot" title="Sticky"></span></div>
            ${_chipRow('formation', FIELDS.formations)}
          </div>

          <div class="opp-field-group">
            <div class="opp-field-label">Personnel <span class="opp-sticky-dot" title="Sticky"></span></div>
            ${_chipRow('personnel', FIELDS.personnel)}
          </div>

          <div class="opp-field-group">
            <div class="opp-field-label">Play Type</div>
            ${_chipRow('playType', FIELDS.playTypes)}
          </div>

          <div class="opp-field-group">
            <div class="opp-field-label">Direction</div>
            ${_chipRow('direction', FIELDS.directions)}
          </div>

          <div class="opp-field-group">
            <div class="opp-field-label">Yards Gained</div>
            <div class="opp-yards-ctrl">
              <button class="opp-yards-btn" id="opp-yards-minus">&minus;</button>
              <span class="opp-yards-val" id="opp-yards-display">0</span>
              <button class="opp-yards-btn" id="opp-yards-plus">+</button>
            </div>
          </div>

          <div class="opp-field-group">
            <div class="opp-field-label">Result</div>
            ${_chipRow('result', FIELDS.results)}
          </div>

        </div>
        <button class="opp-log-play-btn" id="btn-log-opp-play">+ LOG OPP PLAY</button>
        <div class="opp-validation-msg" id="opp-validation-msg"></div>
      </div>
    `;
  }

  function _buildTrends() {
    return `<div class="opp-stats" id="opp-trends-inner">
      <div class="opp-empty-state">No hay jugadas registradas</div>
    </div>`;
  }

  function _buildLog() {
    return `
      <div class="opp-log">
        <div class="opp-log-controls">
          <button class="opp-log-btn" id="btn-opp-undo">&#x21A9; UNDO</button>
          <button class="opp-log-btn opp-log-btn-danger" id="btn-opp-reset">RESET PARTIDO</button>
        </div>
        <div id="opp-log-list"></div>
      </div>
    `;
  }

  function _buildPrintout() {
    return `
      <div class="opp-printout">
        <button class="opp-print-btn" id="btn-opp-print">&#128438; IMPRIMIR</button>
        <div id="opp-printout-content">Sin jugadas a&uacute;n</div>
      </div>
    `;
  }

  function _buildPanel() {
    const panel = document.getElementById('opp-panel');
    panel.innerHTML = `
      <div class="opp-tabs" id="opp-tabs">
        <button class="opp-tab active" data-opp-tab="capture">CAPTURA</button>
        <button class="opp-tab" data-opp-tab="trends">TENDENCIAS</button>
        <button class="opp-tab" data-opp-tab="log">LOG</button>
        <button class="opp-tab" data-opp-tab="printout">PRINTOUT</button>
      </div>
      <div class="opp-tab-body" id="opp-body-capture">${_buildCapture()}</div>
      <div class="opp-tab-body" id="opp-body-trends" style="display:none">${_buildTrends()}</div>
      <div class="opp-tab-body" id="opp-body-log" style="display:none">${_buildLog()}</div>
      <div class="opp-tab-body" id="opp-body-printout" style="display:none">${_buildPrintout()}</div>
    `;
  }

  // ── Wire events ───────────────────────────
  function _wireEvents() {
    const panel = document.getElementById('opp-panel');

    // Tab switching
    panel.querySelectorAll('.opp-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        _activeTab = btn.dataset.oppTab;
        panel.querySelectorAll('.opp-tab').forEach(b => b.classList.toggle('active', b === btn));
        panel.querySelectorAll('.opp-tab-body').forEach(b => { b.style.display = 'none'; });
        document.getElementById(`opp-body-${_activeTab}`).style.display = '';
        renderActiveTab();
      });
    });

    // Chip clicks — event delegation on panel
    panel.addEventListener('click', e => {
      const chip = e.target.closest('.opp-chip');
      if (!chip) return;
      const field = chip.dataset.field;
      const val   = chip.dataset.value;
      const wasActive = chip.classList.contains('selected');

      // Deselect siblings
      panel.querySelectorAll(`.opp-chip[data-field="${field}"]`)
           .forEach(c => c.classList.remove('selected'));

      if (!wasActive) {
        chip.classList.add('selected');
        _sel[field] = val;
        if (field === 'formation') _sticky.formation = val;
        if (field === 'personnel') _sticky.personnel = val;
      } else {
        _sel[field]  = null;
        if (field === 'formation') _sticky.formation = null;
        if (field === 'personnel') _sticky.personnel = null;
      }
    });

    // Yards stepper
    document.getElementById('opp-yards-minus').addEventListener('click', () => { _yards--; _renderYards(); });
    document.getElementById('opp-yards-plus').addEventListener('click',  () => { _yards++; _renderYards(); });

    // Log play
    document.getElementById('btn-log-opp-play').addEventListener('click', logPlay);

    // Print
    document.getElementById('btn-opp-print').addEventListener('click', () => {
      _renderPrintout(); // ensure up-to-date before printing
      window.print();
    });

    // Undo
    document.getElementById('btn-opp-undo').addEventListener('click', () => {
      const plays = _currentPlays();
      if (!plays.length) return;
      if (plays.length > 10 && !confirm('Deshacer la última jugada del rival?')) return;
      const id = _currentGameId();
      let lastIdx = -1;
      for (let i = State.opponentPlays.length - 1; i >= 0; i--) {
        if (!id || State.opponentPlays[i].gameId === id) { lastIdx = i; break; }
      }
      if (lastIdx >= 0) {
        State.opponentPlays.splice(lastIdx, 1);
        GameManager.autosave();
        renderActiveTab();
      }
    });

    // Reset
    document.getElementById('btn-opp-reset').addEventListener('click', () => {
      if (!confirm('¿Borrar TODAS las jugadas del rival en este partido?')) return;
      const id = _currentGameId();
      State.opponentPlays = id
        ? State.opponentPlays.filter(p => p.gameId !== id)
        : [];
      GameManager.autosave();
      renderActiveTab();
    });
  }

  // ── Render helpers ────────────────────────
  function _renderYards() {
    const el = document.getElementById('opp-yards-display');
    if (!el) return;
    el.textContent = _yards;
    el.className = 'opp-yards-val' + (_yards > 0 ? ' pos' : _yards < 0 ? ' neg' : '');
  }

  function _restoreSticky() {
    ['formation', 'personnel'].forEach(f => {
      if (_sticky[f]) {
        const el = document.querySelector(`.opp-chip[data-field="${f}"][data-value="${_sticky[f]}"]`);
        if (el) el.classList.add('selected');
      }
    });
  }

  // ── Render: Trends ────────────────────────
  function _renderTrends() {
    const el = document.getElementById('opp-trends-inner');
    if (!el) return;
    const plays = _currentPlays();

    if (!plays.length) {
      el.innerHTML = '<div class="opp-empty-state">No hay jugadas registradas</div>';
      return;
    }

    const total  = plays.length;
    const ov     = _rpStats(plays);
    const runW   = ov.n ? Math.round(ov.runs / ov.n * 100) : 0;
    const fFreq  = _freqOf(plays, 'formation');
    const pFreq  = _freqOf(plays, 'personnel');

    const td3      = plays.filter(p => p.down === 3);
    const td3s     = _rpStats(td3);
    const td3Short = td3.filter(p => p.distance === '1-3');
    const td3Mid   = td3.filter(p => p.distance === '4-6');
    const td3Long  = td3.filter(p => p.distance === '7-10' || p.distance === '10+');
    const top3F    = _freqOf(td3, 'formation')[0]?.[0] || '—';

    function freqBars(freq, label) {
      if (!freq.length) return `<div style="color:var(--text-muted);font-size:11px">Sin datos de ${label}</div>`;
      return freq.map(([name, cnt], i) => `
        <div class="opp-stat-row">
          <div class="opp-stat-label${i === 0 ? ' opp-top-label' : ''}">${name}</div>
          <div class="opp-bar-wrap">
            <div class="opp-bar${i === 0 ? ' opp-bar-top' : ''}" style="width:${Math.round(cnt/total*100)}%"></div>
          </div>
          <div class="opp-stat-val">${cnt}x (${Math.round(cnt/total*100)}%)</div>
        </div>
      `).join('');
    }

    function downRow(d) {
      const s = _rpStats(plays.filter(p => p.down === d));
      return `<tr${d === 3 ? ' class="opp-third-row"' : ''}>
        <td class="opp-down-cell">${d}${_ords(d)}</td>
        <td style="color:#e85d30;font-weight:700;padding:5px 8px">${s.runPct}</td>
        <td style="color:#4a9eff;font-weight:700;padding:5px 8px">${s.passPct}</td>
        <td style="color:var(--text-muted);padding:5px 8px">${s.n}</td>
      </tr>`;
    }

    el.innerHTML = `
      <div class="opp-stat-section">
        <div class="opp-stat-title">RUN / PASS &mdash; ${total} jugadas</div>
        <div class="opp-rp-labels">
          <span style="color:#e85d30;font-weight:700">&#x25B6; Run ${ov.runPct} (${ov.runs})</span>
          <span style="color:#4a9eff;font-weight:700">Pass/RPO ${ov.passPct} (${ov.pass + ov.rpo})</span>
        </div>
        <div class="opp-rp-bar">
          <div class="opp-rp-run" style="width:${runW}%"></div>
          <div class="opp-rp-pass" style="width:${100 - runW}%"></div>
        </div>
        <table class="opp-down-table">
          <thead><tr><th>Down</th><th>Run%</th><th>Pass%</th><th>N</th></tr></thead>
          <tbody>${[1,2,3,4].map(downRow).join('')}</tbody>
        </table>
      </div>

      <div class="opp-stat-section">
        <div class="opp-stat-title">FORMACIONES</div>
        ${freqBars(fFreq, 'formaciones')}
      </div>

      <div class="opp-stat-section">
        <div class="opp-stat-title">PERSONNEL</div>
        ${freqBars(pFreq, 'personnel')}
      </div>

      <div class="opp-stat-section">
        <div class="opp-stat-title">3RD DOWN &mdash; ${td3.length} jugadas</div>
        ${td3.length ? `
          <div class="opp-stat-row">
            <div class="opp-stat-label">Tendencia</div>
            <div style="font-size:12px">
              <span style="color:#e85d30;font-weight:700">Run ${td3s.runPct}</span>
              &nbsp;/&nbsp;
              <span style="color:#4a9eff;font-weight:700">Pass ${td3s.passPct}</span>
            </div>
          </div>
          <div class="opp-stat-row">
            <div class="opp-stat-label">Form. m&aacute;s com&uacute;n</div>
            <div style="font-size:12px;font-weight:700;color:var(--text-primary)">${top3F}</div>
          </div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:6px;padding:0 4px">
            Short (1-3):&nbsp;<b>${_pct(td3Short.filter(p=>p.playType==='Run').length, td3Short.length)}</b> run
            &nbsp;&middot;&nbsp;
            Mid (4-6):&nbsp;<b>${_pct(td3Mid.filter(p=>p.playType==='Run').length, td3Mid.length)}</b> run
            &nbsp;&middot;&nbsp;
            Long (7+):&nbsp;<b>${_pct(td3Long.filter(p=>p.playType==='Run').length, td3Long.length)}</b> run
          </div>
        ` : '<div style="color:var(--text-muted);font-size:11px">Sin jugadas de 3rd down</div>'}
      </div>
    `;
  }

  // ── Render: Log ───────────────────────────
  function _renderLog() {
    const el = document.getElementById('opp-log-list');
    if (!el) return;
    const plays = _currentPlays();

    if (!plays.length) {
      el.innerHTML = '<div class="opp-empty-state">Sin jugadas registradas</div>';
      return;
    }

    const resultCls = {
      'Stop':     'result-stop',
      '1st Down': 'result-firstdown',
      'TD':       'result-td',
      'Turnover': 'result-turnover'
    };
    const typeCls = {
      'Run': 'opp-badge-run',
      'Pass': 'opp-badge-pass',
      'RPO': 'opp-badge-rpo'
    };

    el.innerHTML = [...plays].reverse().map(p => {
      const y    = parseInt(p.yardsGained) || 0;
      const yStr = y > 0 ? `+${y}` : String(y);
      const yCol = y > 0 ? '#00c896' : y < 0 ? '#e85d30' : '';
      const dn   = p.down ? `${p.down}${_ords(p.down)}` : '?';
      return `
        <div class="opp-log-item ${resultCls[p.result] || ''}">
          <span class="opp-log-q">Q${p.quarter}</span>
          <span class="opp-log-sit">${dn} &amp; ${p.distance || '?'}</span>
          <span class="opp-log-detail">${p.formation || ''} ${p.personnel ? `[${p.personnel}]` : ''}</span>
          <span class="opp-badge ${typeCls[p.playType] || ''}">${p.playType || '?'}</span>
          ${p.direction ? `<span class="opp-log-dir">${p.direction}</span>` : ''}
          <span style="font-size:12px;font-weight:700;min-width:36px;text-align:right${yCol ? `;color:${yCol}` : ''}">${yStr}y</span>
          <span class="opp-log-result">${p.result || '?'}</span>
        </div>
      `;
    }).join('');
  }

  // ── Render: Printout ──────────────────────
  function _renderPrintout() {
    const el = document.getElementById('opp-printout-content');
    if (!el) return;
    const plays = _currentPlays();

    if (!plays.length) {
      el.textContent = 'Sin jugadas registradas.';
      return;
    }

    const time   = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    const total  = plays.length;
    const ov     = _rpStats(plays);
    const fFreq  = _freqOf(plays, 'formation');
    const pFreq  = _freqOf(plays, 'personnel');
    const rival  = State.teamAway || 'AWAY';
    const qn     = State.quarter;

    const td3      = plays.filter(p => p.down === 3);
    const td3s     = _rpStats(td3);
    const td3Short = td3.filter(p => p.distance === '1-3');
    const td3Mid   = td3.filter(p => p.distance === '4-6');
    const td3Long  = td3.filter(p => p.distance === '7-10' || p.distance === '10+');
    const top3F    = _freqOf(td3, 'formation')[0]?.[0] || '—';

    const downLines = [1,2,3,4].map(d => {
      const s = _rpStats(plays.filter(p => p.down === d));
      return `    ${d}${_ords(d)}: Run ${s.runPct} / Pass ${s.passPct}  (${s.n} jug.)${d === 3 ? '  ← CRÍTICO' : ''}`;
    }).join('\n');

    const fLines = fFreq.length
      ? fFreq.map(([n,c]) => `    ${n}: ${c} veces (${Math.round(c/total*100)}%)`).join('\n')
      : '    Sin datos';

    const persDesc = { '11':'1RB 1TE', '12':'1RB 2TE', '21':'2RB 1TE', '10':'0RB 0TE', '22':'2RB 2TE' };
    const pLines = pFreq.length
      ? pFreq.map(([n,c]) => `    ${n}${persDesc[n] ? ` (${persDesc[n]})` : ''}: ${c} veces (${Math.round(c/total*100)}%)`).join('\n')
      : '    Sin datos';

    const last5 = plays.slice(-5).reverse().map((p, i) => {
      const dn = p.down ? `${p.down}${_ords(p.down)}` : '?';
      const y  = parseInt(p.yardsGained) || 0;
      return `    ${i+1}. Q${p.quarter} ${dn}&${p.distance||'?'} ${p.formation||''} ${p.playType||'?'} ${y>0?'+':''}${y}yds ${p.result||'?'}`;
    }).join('\n');

    el.textContent =
`═══════════════════════════════════════
TENDENCIAS DEFENSIVAS — ${rival} — Q${qn}  ${time}
═══════════════════════════════════════

RUN / PASS TOTAL
    Run:  ${ov.runPct}  (${ov.runs} jugadas)
    Pass: ${ov.passPct}  (${ov.pass + ov.rpo} jugadas)

POR DOWN
${downLines}

FORMACIONES (por frecuencia)
${fLines}

PERSONNEL
${pLines}

3RD DOWN DETAIL
    Total: ${td3.length} jugadas · Run ${td3s.runPct} · Pass ${td3s.passPct}
    Formación más usada: ${top3F}
    Short (1-3): ${_pct(td3Short.filter(p=>p.playType==='Run').length, td3Short.length)} run  Med (4-6): ${_pct(td3Mid.filter(p=>p.playType==='Run').length, td3Mid.length)} run  Long (7+): ${_pct(td3Long.filter(p=>p.playType==='Run').length, td3Long.length)} run

ÚLTIMAS 5 JUGADAS
${last5}
═══════════════════════════════════════`;
  }

  // ── Public: logPlay ───────────────────────
  function logPlay() {
    const missing = [];
    if (!_sel.down)     missing.push('Down');
    if (!_sel.playType) missing.push('Play Type');

    if (missing.length) {
      const msgEl = document.getElementById('opp-validation-msg');
      if (msgEl) {
        msgEl.textContent = 'Falta: ' + missing.join(', ');
        setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 3000);
      }
      const btn = document.getElementById('btn-log-opp-play');
      if (btn) {
        btn.classList.add('opp-btn-shake');
        btn.addEventListener('animationend', () => btn.classList.remove('opp-btn-shake'), { once: true });
      }
      return;
    }

    const id = _currentGameId();
    State.opponentPlays.push({
      id:          Date.now(),
      gameId:      id || null,
      quarter:     State.quarter,
      down:        parseInt(_sel.down),
      distance:    _sel.distance  || null,
      formation:   _sel.formation || null,
      personnel:   _sel.personnel || null,
      playType:    _sel.playType,
      direction:   _sel.direction || null,
      yardsGained: _yards,
      result:      _sel.result    || null,
    });

    GameManager.autosave();

    // Flash confirm
    const btn = document.getElementById('btn-log-opp-play');
    if (btn) {
      btn.classList.add('opp-btn-flash');
      btn.addEventListener('animationend', () => btn.classList.remove('opp-btn-flash'), { once: true });
    }

    // Reset non-sticky fields
    ['down', 'distance', 'playType', 'direction', 'result'].forEach(f => {
      _sel[f] = null;
      document.querySelectorAll(`#opp-panel .opp-chip[data-field="${f}"]`)
               .forEach(c => c.classList.remove('selected'));
    });
    _yards = 0;
    _renderYards();

    const msgEl = document.getElementById('opp-validation-msg');
    if (msgEl) msgEl.textContent = '';
  }

  // ── Public: renderActiveTab ───────────────
  function renderActiveTab() {
    if (_activeTab === 'capture')  { _restoreSticky(); }
    if (_activeTab === 'trends')   { _renderTrends(); }
    if (_activeTab === 'log')      { _renderLog(); }
    if (_activeTab === 'printout') { _renderPrintout(); }
  }

  // ── Public: init ──────────────────────────
  function init() {
    _buildPanel();
    _wireEvents();
  }

  return { init, renderActiveTab, logPlay };

})();
