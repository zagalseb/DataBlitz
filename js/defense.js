// ══════════════════════════════════════════
// defense.js — Defense side selectors
// DEFENSE_DATA lives in data.js
// ══════════════════════════════════════════

function renderDefenseLists() {
  // ST mode: use ST defense data
  // OWN mode (you offense): opponent is on defense → OPP DEF
  // OPP mode (opponent offense): you are on defense → OWN DEF
  const mode = typeof State !== 'undefined' ? State.possessionMode : 'own';
  const d = mode === 'st'  ? getSTDefPlaybook()
          : mode === 'opp' ? getOwnDefPlaybook()
          :                  getOppDefPlaybook();
  _renderList('front-list',    d.fronts,    State.selectedFront,    id => { State.selectedFront    = id; renderDefenseLists(); });
  _renderList('blitz-list',    d.blitzes,   State.selectedBlitz,    id => { State.selectedBlitz    = id; renderDefenseLists(); });
  _renderList('coverage-list', d.coverages, State.selectedCoverage, id => { State.selectedCoverage = id; renderDefenseLists(); });
}

function _renderList(elId, items, selectedId, onSelect) {
  const list = document.getElementById(elId);
  if (!list) return;
  list.innerHTML = '';
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'selector-item' + (item.id === selectedId ? ' selected' : '');
    el.textContent = item.name;
    el.addEventListener('click', () => onSelect(item.id));
    list.appendChild(el);
  });
}
