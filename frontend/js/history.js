// ══════════════════════════════════════════
// history.js — Play history log
// ══════════════════════════════════════════

// renderHistory() is now provided by drives.js

function logPlay(extra = {}) {
  const plays = getPlaysForFormation(State.selectedFormation);
  const playObj = plays.find(p => p.id === State.selectedPlay);
  const motionObj = getActivePlaybook().motions.find(m => m.id === State.selectedMotion);

  if (!playObj && State.possessionMode !== 'st') return;

  const entry = {
    timestamp:    new Date().toISOString(),
    formation:    State.selectedFormation,
    formationName:State.getSelectedFormationName(),
    play:         State.selectedPlay,
    playName:     playObj?.name || (State.possessionMode === 'st' ? State.getSelectedFormationName() : ''),
    type:         State.playType,
    motion:       State.selectedMotion,
    motionName:   motionObj?.name || '',
    strength:     State.strength,
    hash:         State.hash,
    down:         State.down,
    toFirst:      State.toFirst,
    oppYardLine:  State.oppYardLine,
    yardDisplay:  formatYardLine(State.oppYardLine),
    scoreHome:    State.scoreHome,
    scoreAway:    State.scoreAway,
    quarter:      State.quarter,
    teamHome: State.teamHome,
    teamAway: State.teamAway,
    // Extended fields from PlayLogic
    yardsGained:  State.yardsGained,
    result:       State.selectedResult,
    playerNumber: State.playerNumber > 0 ? State.playerNumber : null,
    noPlay:  extra.noPlay || false,
    penalty: extra.penaltyData || null,
    notes:        extra.notes || '',
    // Possession mode
    mode:             State.possessionMode,
    // Defense
    selectedFront:    State.selectedFront,
    selectedBlitz:    State.selectedBlitz,
    selectedCoverage: State.selectedCoverage,
  };

  State.history.push(entry);
  GameManager.autosave();
  renderHistory();
}
