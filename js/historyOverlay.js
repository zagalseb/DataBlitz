// ══════════════════════════════════════════
// historyOverlay.js — Fullscreen history view
// ══════════════════════════════════════════

const HistoryOverlay = (() => {

  function open() {
    _render();
    document.getElementById('history-overlay').style.display = 'flex';
  }

  function close() {
    document.getElementById('history-overlay').style.display = 'none';
  }

  function _render() {
    const tbody = document.getElementById('ho-tbody');
    if (!tbody) return;

    const allPlays = [];

    // Completed drives
    State.drives.forEach(drive => {
      drive.playEntries.forEach((p, i) => {
        allPlays.push({ play: p, driveNum: drive.driveNum, playNum: i + 1, live: false });
      });
    });

    // Current live drive
    const currentPlays = State.history.slice(State.currentDriveStart);
    currentPlays.forEach((p, i) => {
      allPlays.push({ play: p, driveNum: State.currentDrive, playNum: i + 1, live: true });
    });

    const countEl = document.getElementById('ho-count');
    if (countEl) countEl.textContent = allPlays.length ? `${allPlays.length} plays` : '';

    if (allPlays.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">
            No plays recorded yet
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = allPlays.map(({ play: p, driveNum, playNum, live }) => {
      const yd      = p.yardDisplay !== undefined ? p.yardDisplay : formatYardLine(p.oppYardLine);
      const ydLabel = `${yd > 0 ? 'OPP' : 'OWN'} ${Math.abs(yd)}`;
      const yards   = p.yardsGained !== undefined
        ? `<span class="ho-yards ${p.yardsGained > 0 ? 'pos' : p.yardsGained < 0 ? 'neg' : ''}">${p.yardsGained > 0 ? '+' : ''}${p.yardsGained}</span>`
        : '—';

      const result = p.result
        ? `<span class="ho-result result-${p.result.toLowerCase().replace(' ', '-')}">${p.result}</span>`
        : '—';

      const def = [
        _defName('fronts',    p.selectedFront,    p.mode),
        _defName('blitzes',   p.selectedBlitz,    p.mode),
        _defName('coverages', p.selectedCoverage, p.mode),
      ].filter(Boolean).join(' · ') || '—';

      const driveLabel = live
        ? `<span class="ho-drive-live">D${driveNum}</span>`
        : `<span class="ho-drive">D${driveNum}</span>`;

      return `
        <tr class="ho-row" onclick="PlayEditor.open('${p.timestamp}'); HistoryOverlay.close();">
          <td class="ho-td ho-td-drive">${driveLabel}<span class="ho-play-num">#${playNum}</span></td>
          <td class="ho-td ho-td-dn">
            <span class="ho-down">${p.down}&amp;${p.toFirst}</span>
            <span class="ho-ydline">${ydLabel}</span>
          </td>
          <td class="ho-td ho-td-formation">
            <span class="ho-formation">${p.formationName || '—'}</span>
          </td>
          <td class="ho-td ho-td-play">
            <span class="play-badge ${p.type}">${p.type.toUpperCase()}</span>
            <span class="ho-play-name">${p.playName || '—'}</span>
          </td>
          <td class="ho-td ho-td-yards">${yards}</td>
          <td class="ho-td ho-td-result">${result}</td>
          <td class="ho-td ho-td-def">${def}</td>
        </tr>
      `;
    }).join('');
  }

  function _buildDOM() {
    if (document.getElementById('history-overlay')) return;

    const el = document.createElement('div');
    el.id = 'history-overlay';
    el.style.display = 'none';
    el.innerHTML = `
      <div id="history-overlay-panel">

        <div class="ho-header">
          <div class="ho-title">
            History
            <span class="ho-count" id="ho-count"></span>
          </div>
          <button class="icon-btn" id="ho-btn-close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="ho-table-wrap">
          <table class="ho-table">
            <thead>
              <tr>
                <th class="ho-th">Drive</th>
                <th class="ho-th">Dn &amp; Dist</th>
                <th class="ho-th">Formation</th>
                <th class="ho-th">Play</th>
                <th class="ho-th">Yds</th>
                <th class="ho-th">Result</th>
                <th class="ho-th">Defense</th>
              </tr>
            </thead>
            <tbody id="ho-tbody"></tbody>
          </table>
        </div>

      </div>
    `;

    document.body.appendChild(el);
    document.getElementById('ho-btn-close').addEventListener('click', close);
    el.addEventListener('click', e => { if (e.target === el) close(); });
  }

  function init() {
    _buildDOM();
  }

  return { init, open, close };
})();
