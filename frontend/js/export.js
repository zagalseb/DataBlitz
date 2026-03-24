// ══════════════════════════════════════════
// export.js — XLSX export (HUDL format)
// ══════════════════════════════════════════

function _csvDefName(listKey, id) {
  if (!id || id === 'none') return '';
  for (const pb of [getOwnDefPlaybook(), getOppDefPlaybook()]) {
    const item = (pb[listKey] || []).find(x => x.id === id);
    if (item) return item.name;
  }
  return id;
}

function exportXLSX() {
  if (State.history.length === 0) {
    alert('No hay jugadas registradas para exportar.');
    return;
  }

  const HEADERS = [
    'PLAY #', 'QTR', 'ODK', 'DN', 'DIST', 'HASH', 'YARD LN',
    'PLAY TYPE', 'OFF FORM', 'GN/LS', 'RESULT',
    'DEF FRONT', 'COVERAGE', 'BLITZ', 'MOTION', 'STRENGTH',
    'PLAYER #', 'SCORE OFF', 'SCORE DEF', 'DRIVE', 'NOTES',
  ];

  const rows = State.history.map((p, i) => {
    // Drive lookup
    let driveNum = State.currentDrive;
    let cumulative = 0;
    for (const drive of State.drives) {
      cumulative += drive.playEntries.length;
      if (i < cumulative) { driveNum = drive.driveNum; break; }
    }

    const isST = p.mode === 'st';
    const odk  = isST ? 'K' : p.mode === 'opp' ? 'D' : 'O';

    return [
      i + 1,
      p.quarter || '',
      odk,
      isST ? '' : (p.down || ''),
      isST ? '' : (p.toFirst !== undefined ? p.toFirst : ''),
      p.hash || '',
      p.oppYardLine !== undefined ? formatYardLine(p.oppYardLine) : '',
      p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : '',
      p.formationName || '',
      p.yardsGained !== undefined ? p.yardsGained : '',
      p.result || '',
      _csvDefName('fronts',    p.selectedFront),
      _csvDefName('coverages', p.selectedCoverage),
      _csvDefName('blitzes',   p.selectedBlitz),
      p.motionName || '',
      isST ? '' : (p.strength || ''),
      p.playerNumber || '',
      p.scoreHome !== undefined ? p.scoreHome : '',
      p.scoreAway !== undefined ? p.scoreAway : '',
      driveNum,
      p.notes || '',
    ];
  });

  // Build worksheet data
  const wsData = [HEADERS, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths: auto-fit to longest content
  const colWidths = HEADERS.map((h, ci) => {
    let max = h.length;
    rows.forEach(row => {
      const val = row[ci] !== undefined && row[ci] !== null ? String(row[ci]) : '';
      if (val.length > max) max = val.length;
    });
    return { wch: max + 2 };
  });
  ws['!cols'] = colWidths;

  // Styles — requires xlsx-style or manual cell styling via XLSX cell objects
  // We use cell-level 's' property (supported by xlsx full build via SheetJS Pro style shim)
  const headerStyle = {
    font:  { bold: true, name: 'Arial', sz: 10, color: { rgb: 'FFFFFF' } },
    fill:  { fgColor: { rgb: '1F3864' } },
    alignment: { horizontal: 'center' },
  };
  const stStyle = {
    fill: { fgColor: { rgb: 'FFF3E0' } },
  };
  const altStyle = {
    fill: { fgColor: { rgb: 'F2F2F2' } },
  };

  // Apply header styles
  HEADERS.forEach((_, ci) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (!ws[cellRef]) ws[cellRef] = { v: HEADERS[ci], t: 's' };
    ws[cellRef].s = headerStyle;
  });

  // Apply row styles
  rows.forEach((row, ri) => {
    const isST = row[2] === 'K'; // ODK column
    row.forEach((_, ci) => {
      const cellRef = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      if (!ws[cellRef]) return;
      if (isST) {
        ws[cellRef].s = stStyle;
      } else if ((ri + 1) % 2 === 0) {
        ws[cellRef].s = altStyle;
      }
    });
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Play Log');

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `HUDL_${State.teamHome}_vs_${State.teamAway}_${date}.xlsx`);
}

function initExport() {
  const btn = document.getElementById('btn-export');
  if (btn) btn.addEventListener('click', exportXLSX);
}
