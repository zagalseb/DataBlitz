// ══════════════════════════════════════════
// playLogic.js — Play commit & down/distance
// ══════════════════════════════════════════

const PlayLogic = {

  // ── Main entry point ───────────────────
  commit() {
    // 1. Read penalty from DOM
    const penaltyActive = document.getElementById('btn-penalty-toggle')?.dataset.active === 'true';

    let penaltyData = null;
    if (penaltyActive) {
      const decision = document.querySelector('.pen-dec-btn.active')?.dataset.decision || 'accepted';
      const noPlayChk = document.getElementById('pen-noplay')?.checked || false;
      const preSnap   = document.getElementById('pen-presnap')?.checked || false;
      penaltyData = {
        team:     document.querySelector('.pen-team-btn.active')?.dataset.team || 'OFF',
        player:   parseInt(document.getElementById('pen-player-num')?.value) || null,
        foul:     document.getElementById('pen-foul')?.value.trim() || '',
        yards:    parseInt(document.getElementById('pen-yards')?.value) || 0,
        netYards: parseInt(document.getElementById('pen-net-yards')?.value) || 0,
        decision,
        noPlay:   noPlayChk || preSnap,
        preSnap,
      };
    }

    const noPlay = penaltyData?.noPlay || false;
    const notes  = document.getElementById('play-notes')?.value.trim() || '';

    // 3. Save to history with all fields
    logPlay({ penaltyData, noPlay, notes });

    // 4. Apply down & distance logic
    this._applyResult(penaltyData);

    // 5. Move ball marker
    this._moveBall();

    // 6. Reset play fields
    this._resetPlayFields();

    // 7. Render
    renderAll();
    renderHistory();
  },

  // ── Down & distance ────────────────────
  _applyResult(penaltyData) {
    const result = State.selectedResult;
    const yards  = State.yardsGained;

    // Penalty takes full priority — play result is nullified
    if (penaltyData && penaltyData.decision === 'accepted') {
      if (penaltyData.noPlay) return; // Repeat same down/distance
      const net = penaltyData.netYards;
      if (penaltyData.team === 'OFF') {
        State.toFirst += net;
        // no change de down
        return;
      }
      if (penaltyData.team === 'DEF') {
        const newToFirst = State.toFirst - net;
        if (newToFirst <= 0) {
          State.down    = 1;
          State.toFirst = 10;
        } else {
          State.toFirst = newToFirst;
          // repeat down — no incrementar
        }
        return;
      }
    }
    if (penaltyData && (penaltyData.decision === 'declined' || penaltyData.decision === 'offsetting')) {
      // Play stands as-is — fall through to normal result logic
    }

    switch (result) {
      case 'TD':
        State.down       = 1;
        State.toFirst    = 10;
        State.oppYardLine = 35; // kickoff position
        return;

      case '1st Down':
        State.down    = 1;
        State.toFirst = 10;
        return;

      case 'Incomplete':
        if (State.down >= 4) {
          State.down    = 1;
          State.toFirst = 10;
        } else {
          State.down += 1;
          // toFirst unchanged on incomplete
        }
        return;

      case 'Turnover':
        State.down    = 1;
        State.toFirst = 10;
        return;

      case 'Sack':
        State.toFirst = State.toFirst + Math.abs(yards); // yards lost
        if (State.down >= 4) {
          State.down    = 1;
          State.toFirst = 10;
        } else {
          State.down += 1;
        }
        return;

      case 'Punt':
        State.down    = 1;
        State.toFirst = 10;
        return;

      case 'FG':
        State.down       = 1;
        State.toFirst    = 10;
        State.oppYardLine = 35;
        return;

      case 'Safety':
        State.down    = 1;
        State.toFirst = 10;
        return;

      default:
        // 'Scramble', '' or anything else — apply yardsGained normally
        const newToFirst = State.toFirst - yards;
        if (newToFirst <= 0) {
          // Automatic 1st down by yardage
          State.down    = 1;
          State.toFirst = 10;
        } else if (State.down >= 4) {
          // Turnover on downs
          State.down    = 1;
          State.toFirst = 10;
        } else {
          State.down   += 1;
          State.toFirst = newToFirst;
        }
    }
  },

  // ── Move ball on field ─────────────────
  _moveBall() {
    const result = State.selectedResult;
    // Position already set by _applyResult for these outcomes
    if (result === 'TD' || result === 'FG' || result === 'Punt' || result === 'Safety') {
      updateBallMarker();
      return;
    }
    const direction = State.flipped ? -1 : 1;
    State.oppYardLine = Math.max(1, Math.min(99,
      State.oppYardLine - (State.yardsGained * direction)
    ));
    updateBallMarker();
  },

  // ── Reset inline play fields ───────────
  _resetPlayFields() {
    State.yardsGained    = 0;
    State.playerNumber   = 0;
    State.selectedResult = '';

    document.getElementById('player-num-grid')
      ?.querySelector('.pnum-btn.active')
      ?.classList.remove('active');

    const notesEl = document.getElementById('play-notes');
    if (notesEl) notesEl.value = '';

    // Reset penalty
    _clearPenaltySheet();
    document.getElementById('btn-penalty-toggle').dataset.active = 'false';
    document.getElementById('btn-penalty-toggle').classList.remove('pen-active');

    document.querySelectorAll('.result-btn').forEach(b => b.classList.remove('selected'));

    renderCounterValue('yards');

    // Reset defense selections
    const defPb = State.possessionMode === 'st' ? getSTDefPlaybook()
      : (State.possessionMode === 'opp' ? getOwnDefPlaybook() : getOppDefPlaybook());
    const hasNone = defPb.blitzes.some(b => b.id === 'none');
    State.selectedFront    = '';
    State.selectedBlitz    = hasNone ? 'none' : (defPb.blitzes[0]?.id || 'none');
    State.selectedCoverage = '';
    renderDefenseLists();

    // Reset motion chip
    MotionChip.reset();
  },
};
