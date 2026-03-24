// opponent-data.js
// Datos de referencia para el tracker de tendencias del rival
// Importado desde opponent.html

const DEFENSE_OPPONENT_DATA = {

  quarters: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],

  downs: [
    { value: '1', label: '1st' },
    { value: '2', label: '2nd' },
    { value: '3', label: '3rd' },
    { value: '4', label: '4th' }
  ],

  distances: [
    { value: '1-3',  label: '1–3' },
    { value: '4-6',  label: '4–6' },
    { value: '7-10', label: '7–10' },
    { value: '10+',  label: '10+' }
  ],

  formations: [
    { value: 'Shotgun',      label: 'Shotgun' },
    { value: 'Under Center', label: 'Under Center' },
    { value: 'Pistol',       label: 'Pistol' },
    { value: 'Wildcat',      label: 'Wildcat' },
    { value: 'Empty',        label: 'Empty' }
  ],

  personnel: [
    { value: '11', label: '11' },
    { value: '12', label: '12' },
    { value: '21', label: '21' },
    { value: '10', label: '10' },
    { value: '22', label: '22' }
  ],

  playTypes: [
    { value: 'Run',  label: '&#x1F3C3; Run' },
    { value: 'Pass', label: '&#x1F3C8; Pass' },
    { value: 'RPO',  label: 'RPO' }
  ],

  directions: [
    { value: 'Left',   label: '&larr; Left' },
    { value: 'Middle', label: 'Middle' },
    { value: 'Right',  label: 'Right &rarr;' }
  ],

  results: [
    { value: 'Stop',     label: 'Stop',     colorClass: 'res-stop' },
    { value: '1st Down', label: '1st Down', colorClass: 'res-firstdown' },
    { value: 'TD',       label: 'TD',       colorClass: 'res-td' },
    { value: 'Turnover', label: 'Turnover', colorClass: 'res-turnover' },
    { value: 'Penalty',  label: 'Penalty',  colorClass: 'res-penalty' }
  ]

};
