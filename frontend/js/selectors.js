// ══════════════════════════════════════════
// selectors.js — Formation / Play / Motion
// ══════════════════════════════════════════

function renderFormationList() {
  const list = document.getElementById('formation-list');
  list.innerHTML = '';

  let currentGroup = null;

  getActivePlaybook().formations.forEach(f => {
    if (f.group !== currentGroup) {
      currentGroup = f.group;
      const groupEl = document.createElement('div');
      groupEl.className = 'group-label';
      groupEl.textContent = f.group;
      list.appendChild(groupEl);
    }

    const item = document.createElement('div');
    item.className = 'selector-item' + (f.id === State.selectedFormation ? ' selected' : '');
    item.dataset.id = f.id;
    item.textContent = f.name;

    item.addEventListener('click', () => {
      State.selectedFormation = f.id;
      // Reset play selection when formation changes
      const plays = getPlaysForFormation(f.id);
      State.selectedPlay = plays[0]?.id || '';
      State.selectedMotion = 'none';
      renderAll();
      MotionChip.render();
    });

    list.appendChild(item);
  });
}

function renderPlayList() {
  const list = document.getElementById('play-list');
  list.innerHTML = '';

  const plays = getPlaysForFormation(State.selectedFormation);

  // Split into run and pass
  const runs  = plays.filter(p => p.type === 'run');
  const passes = plays.filter(p => p.type === 'pass');
  const maxLen = Math.max(runs.length, passes.length);

  // Header row
  const header = document.createElement('div');
  header.className = 'play-list-header';
  header.innerHTML = `
    <span class="play-col-label run">RUN</span>
    <span class="play-col-label pass">PASS</span>
  `;
  list.appendChild(header);

  // Rows — one run + one pass per row
  for (let i = 0; i < maxLen; i++) {
    const row = document.createElement('div');
    row.className = 'play-list-row';

    // Run cell
    const runCell = document.createElement('div');
    runCell.className = 'play-cell run-cell';
    if (runs[i]) {
      runCell.classList.add('play-item');
      if (runs[i].id === State.selectedPlay) runCell.classList.add('selected');
      runCell.textContent = runs[i].name;
      runCell.addEventListener('click', () => {
        State.selectedPlay = runs[i].id;
        State.playType = 'run';
        renderAll();
        MotionChip.render();
      });
    }

    // Pass cell
    const passCell = document.createElement('div');
    passCell.className = 'play-cell pass-cell';
    if (passes[i]) {
      passCell.classList.add('play-item');
      if (passes[i].id === State.selectedPlay) passCell.classList.add('selected');
      passCell.textContent = passes[i].name;
      passCell.addEventListener('click', () => {
        State.selectedPlay = passes[i].id;
        State.playType = 'pass';
        renderAll();
        MotionChip.render();
      });
    }

    row.appendChild(runCell);
    row.appendChild(passCell);
    list.appendChild(row);
  }
}

// renderMotionList() removed — replaced by MotionChip in motionChip.js
