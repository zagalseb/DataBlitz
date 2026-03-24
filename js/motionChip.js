// ══════════════════════════════════════════
// motionChip.js — Motion chip in play bar
// ══════════════════════════════════════════

const MotionChip = {

  init() {
    this._buildDropdown();
    this._bindEvents();
    this.render();
  },

  _buildDropdown() {
    const dropdown = document.getElementById('motion-dropdown');
    if (!dropdown) return;

    dropdown.innerHTML = getActivePlaybook().motions.map(m => `
      <div class="motion-dropdown-item ${m.id === State.selectedMotion ? 'selected' : ''}"
           data-id="${m.id}">
        ${m.name}
      </div>
    `).join('');

    dropdown.querySelectorAll('.motion-dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        State.selectedMotion = item.dataset.id;
        this.close();
        this.render();
        // Update play bar name
        const nameEl = document.getElementById('play-name');
        if (nameEl) nameEl.textContent = State.getFullPlayName();
      });
    });
  },

  _bindEvents() {
    // Chip button — toggle dropdown
    document.getElementById('motion-chip').addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = document.getElementById('motion-dropdown');
      const isOpen = dropdown.style.display !== 'none';
      isOpen ? this.close() : this.open();
    });

    // Click outside — close
    document.addEventListener('click', () => this.close());
  },

  open() {
    this._buildDropdown(); // re-render with current selection
    document.getElementById('motion-dropdown').style.display = 'block';
  },

  close() {
    const dropdown = document.getElementById('motion-dropdown');
    if (dropdown) dropdown.style.display = 'none';
  },

  render() {
    const chip = document.getElementById('motion-chip');
    if (!chip) return;

    const motion = getActivePlaybook().motions.find(m => m.id === State.selectedMotion);
    const hasMotion = State.selectedMotion && State.selectedMotion !== 'none';

    chip.className = 'motion-chip' + (hasMotion ? ' has-motion' : '');

    if (hasMotion) {
      chip.innerHTML = `
        ${motion.name}
        <span class="motion-chip-clear" id="motion-chip-clear-btn">✕</span>
        <span class="motion-chip-arrow">▾</span>
      `;
      // Wire clear button
      document.getElementById('motion-chip-clear-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        State.selectedMotion = 'none';
        this.render();
        const nameEl = document.getElementById('play-name');
        if (nameEl) nameEl.textContent = State.getFullPlayName();
      });
    } else {
      chip.innerHTML = `Motion: None <span class="motion-chip-arrow">▾</span>`;
    }
  },

  reset() {
    State.selectedMotion = 'none';
    this.close();
    this.render();
  },
};
