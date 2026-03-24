// ══════════════════════════════════════════
// counters.js — +/- counter controls
// ══════════════════════════════════════════

function formatYardLine(v) {
  if (v <= 50) return v;        // opponent territory: 1–50
  return -(100 - v);            // own territory: -49 to -1
}

const COUNTER_CONFIG = {
  opp:     { stateKey: 'oppYardLine',  min: 1,   max: 99, elId: 'val-opp',     format: formatYardLine },
  tofirst: { stateKey: 'toFirst',      min: 0,   max: 99, elId: 'val-tofirst', format: v => v },
  down:    { stateKey: 'down',         min: 0,   max: 4,  elId: 'val-down',    format: formatDown },
  yards:   { stateKey: 'yardsGained',  min: -99, max: 99, elId: 'val-yards',   format: v => (v > 0 ? '+' : '') + v },
};

function formatDown(n) {
  const labels = ['—', '1<sup>st</sup>', '2<sup>nd</sup>', '3<sup>rd</sup>', '4<sup>th</sup>'];
  return labels[n] ?? n;
}

function initCounters() {
  document.querySelectorAll('.counter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      const cfg = COUNTER_CONFIG[target];
      if (!cfg) return;

      const delta = btn.classList.contains('plus') ? 1 : -1;
      const current = State[cfg.stateKey];
      const next = Math.max(cfg.min, Math.min(cfg.max, current + delta));
      State[cfg.stateKey] = next;

      renderCounterValue(target);
      updateSituationChip();
      updateBallMarker();
    });
  });

  initTappableCounters();
}

function initTappableCounters() {
  // Only yards and opp are tappable — down/tofirst stay as +/-
  ['yards', 'opp'].forEach(target => {
    const cfg = COUNTER_CONFIG[target];
    const el  = document.getElementById(cfg.elId);
    if (!el) return;

    // Visual hint
    el.style.cursor = 'text';
    el.title = 'Tap to enter value';

    el.addEventListener('click', () => {
      // Read current display value (not internal — for opp show the formatted yard line)
      const currentDisplay = target === 'opp'
        ? formatYardLine(State[cfg.stateKey])
        : State[cfg.stateKey];

      const raw = prompt(
        target === 'opp'
          ? 'Yard line (negative = own territory, e.g. -25 or 40):'
          : 'Yards gained:',
        currentDisplay
      );

      if (raw === null || raw.trim() === '') return;
      const num = parseInt(raw.trim(), 10);
      if (isNaN(num)) return;

      if (target === 'opp') {
        // Convert display value back to internal 1-99
        // Positive = OPP territory (1-50), negative = OWN territory (51-99)
        let internal;
        if (num >= 0) {
          internal = Math.max(1, Math.min(50, num));
        } else {
          internal = Math.max(51, Math.min(99, 100 + num));
        }
        State[cfg.stateKey] = internal;
      } else {
        State[cfg.stateKey] = Math.max(cfg.min, Math.min(cfg.max, num));
      }

      renderCounterValue(target);
      updateSituationChip();
      updateBallMarker();
    });
  });
}

function renderCounterValue(target) {
  const cfg = COUNTER_CONFIG[target];
  if (!cfg) return;
  const el = document.getElementById(cfg.elId);
  if (!el) return;
  el.innerHTML = cfg.format(State[cfg.stateKey]);
}

function renderAllCounters() {
  Object.keys(COUNTER_CONFIG).forEach(renderCounterValue);
}

function updateSituationChip() {
  const chip = document.getElementById('situation-chip');
  if (chip) chip.textContent = State.getSituationText();
}
