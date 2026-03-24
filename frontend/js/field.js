// ══════════════════════════════════════════
// field.js — Field visualization
// ══════════════════════════════════════════

function initField() {
  renderYardLines();
  updateBallMarker();
}

function renderYardLines() {
  const linesEl = document.getElementById('yard-lines');
  const labelsEl = document.getElementById('yard-labels');
  linesEl.innerHTML = '';
  labelsEl.innerHTML = '';

  const yardMarkers = [10, 20, 30, 40, 50, 40, 30, 20, 10];

  yardMarkers.forEach((yds, i) => {
    const pct = ((i + 1) / (yardMarkers.length + 1)) * 100;

    // Line
    const line = document.createElement('div');
    line.className = 'yard-line-el';
    line.style.left = pct + '%';
    linesEl.appendChild(line);

    // Label
    const label = document.createElement('div');
    label.className = 'yard-label';
    label.style.position = 'absolute';
    label.style.left = pct + '%';
    label.textContent = yds;
    labelsEl.appendChild(label);
  });
}

function updateBallMarker() {
  const marker = document.getElementById('ball-marker');
  const field = document.querySelector('.field');
  if (!marker || !field) return;

  // oppYardLine 0-50: position within the field's 84% play area
  const clampedYard = Math.max(0, Math.min(100, State.oppYardLine));
  // Map 0–100 yard line to 8%–92% of field width
  const pct = 8 + (clampedYard / 100) * 84;
  marker.style.left = (State.flipped ? (100 - pct) : pct) + '%';
}
