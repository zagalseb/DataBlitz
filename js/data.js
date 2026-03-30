// ══════════════════════════════════════════
// data.js — PlaySync Playbook
// ══════════════════════════════════════════

const PLAYBOOK = {
  formations: [
    { id: 'max',         name: 'Max',         group: 'M' },
    { id: 'trips',       name: 'Trips',       group: 'T' },
    { id: 'split',       name: 'Split',       group: 'S' },
    { id: 'empty',       name: 'Empty',       group: 'E' },
    { id: 'pistol',      name: 'Pistol',      group: 'P' },
    { id: 'undercenter', name: 'Undercenter', group: 'U' },
  ],

  plays: {
    // ── MAX — heavy run formation ──────────
    'max': [
    // ── Run game ──
    { id: 'max-power',        name: 'Power',            type: 'run'  },
    { id: 'max-counter',      name: 'Counter',          type: 'run'  },
    { id: 'max-inside-zone',  name: 'Inside Zone',      type: 'run'  },
    { id: 'max-outside-zone', name: 'Outside Zone',     type: 'run'  },
    { id: 'max-iso',          name: 'ISO',              type: 'run'  },
    { id: 'max-sweep',        name: 'Sweep',            type: 'run'  },
    { id: 'max-trap',         name: 'Trap',             type: 'run'  },
    { id: 'max-draw',         name: 'Draw',             type: 'run'  },
    { id: 'max-qb-sneak',     name: 'QB Draw',          type: 'run'  },
    // ── RPO ──
    { id: 'max-rpo-slant',    name: 'RPO Slant',        type: 'run'  },
    { id: 'max-rpo-bubble',   name: 'RPO Bubble',       type: 'run'  },
    { id: 'max-rpo-screen',   name: 'RPO Screen',       type: 'run'  },
    { id: 'max-rpo-peek',     name: 'RPO Peek',         type: 'run'  },
    // ── Play Action ──
    { id: 'max-pa-post',      name: 'PA Post',          type: 'pass' },
    { id: 'max-pa-corner',    name: 'PA Corner',        type: 'pass' },
    { id: 'max-pa-cross',     name: 'PA Cross',         type: 'pass' },
    { id: 'max-pa-seam',      name: 'PA Seam',          type: 'pass' },
    { id: 'max-pa-boot',      name: 'PA Bootleg',       type: 'pass' },
    { id: 'max-pa-wheel',     name: 'PA Wheel',         type: 'pass' },
    // ── Pass profundo ──
    { id: 'max-four-verts',   name: 'Four Verticals',   type: 'pass' },
    { id: 'max-post',         name: 'Post',             type: 'pass' },
    { id: 'max-corner',       name: 'Corner',           type: 'pass' },
    { id: 'max-go',           name: 'Go Route',         type: 'pass' },
    { id: 'max-post-corner',  name: 'Post Corner',      type: 'pass' },
    // ── Pass medio ──
    { id: 'max-mesh',         name: 'Mesh',             type: 'pass' },
    { id: 'max-cross',        name: 'Cross',            type: 'pass' },
    { id: 'max-dig',          name: 'Dig',              type: 'pass' },
    { id: 'max-drive',        name: 'Drive',            type: 'pass' },
    { id: 'max-levels',       name: 'Levels',           type: 'pass' },
    { id: 'max-shallow',      name: 'Shallow Cross',    type: 'pass' },
    { id: 'max-pivot',        name: 'Pivot',            type: 'pass' },
    // ── Pass corto ──
    { id: 'max-slant',        name: 'Slant',            type: 'pass' },
    { id: 'max-curl-flat',    name: 'Curl Flat',        type: 'pass' },
    { id: 'max-smash',        name: 'Smash',            type: 'pass' },
    { id: 'max-stick',        name: 'Stick',            type: 'pass' },
    { id: 'max-spacing',      name: 'Spacing',          type: 'pass' },
    { id: 'max-snag',         name: 'Snag',             type: 'pass' },
    { id: 'max-hitch',        name: 'Hitch',            type: 'pass' },
    { id: 'max-out',          name: 'Out Route',        type: 'pass' },
    { id: 'max-quick-slant',  name: 'Quick Slant',      type: 'pass' },
    // ── Screens ──
    { id: 'max-wr-screen',    name: 'WR Screen',        type: 'pass' },
    { id: 'max-hb-screen',    name: 'HB Screen',        type: 'pass' },
    { id: 'max-slip-screen',  name: 'Slip Screen',      type: 'pass' },
    { id: 'max-tunnel',       name: 'Tunnel Screen',    type: 'pass' },
  ],

    // ── TRIPS — 3 receivers one side ──────
    'trips': [
      { id: 'trips-mesh',      name: 'Mesh',            type: 'pass' },
      { id: 'trips-drive',     name: 'Drive',           type: 'pass' },
      { id: 'trips-stick',     name: 'Stick',           type: 'pass' },
      { id: 'trips-flood',     name: 'Flood',           type: 'pass' },
      { id: 'trips-verticals', name: 'Verticals',       type: 'pass' },
      { id: 'trips-corner',    name: 'Corner',          type: 'pass' },
      { id: 'trips-post',      name: 'Post',            type: 'pass' },
      { id: 'trips-screen',    name: 'WR Screen',       type: 'pass' },
      { id: 'trips-bubble',    name: 'Bubble Screen',   type: 'pass' },
      { id: 'trips-zone',      name: 'Outside Zone',    type: 'run'  },
      { id: 'trips-rpo',       name: 'RPO Peek',        type: 'run'  },
    ],

    // ── SPLIT — 2x2 balanced ──────────────
    'split': [
      { id: 'split-four-verts', name: 'Four Verticals',  type: 'pass' },
      { id: 'split-mesh',       name: 'Mesh',            type: 'pass' },
      { id: 'split-cross',      name: 'Cross',           type: 'pass' },
      { id: 'split-dig',        name: 'Dig',             type: 'pass' },
      { id: 'split-curl-flat',  name: 'Curl Flat',       type: 'pass' },
      { id: 'split-smash',      name: 'Smash',           type: 'pass' },
      { id: 'split-shallow',    name: 'Shallow Cross',   type: 'pass' },
      { id: 'split-slant',      name: 'Slant',           type: 'pass' },
      { id: 'split-zone',       name: 'Inside Zone',     type: 'run'  },
      { id: 'split-power',      name: 'Power',           type: 'run'  },
      { id: 'split-rpo-slant',  name: 'RPO Slant',       type: 'run'  },
    ],

    // ── EMPTY — 5 receivers ───────────────
    'empty': [
      { id: 'empty-four-verts', name: 'Four Verticals',  type: 'pass' },
      { id: 'empty-mesh',       name: 'Mesh',            type: 'pass' },
      { id: 'empty-shallow',    name: 'Shallow Cross',   type: 'pass' },
      { id: 'empty-stick',      name: 'Stick',           type: 'pass' },
      { id: 'empty-spacing',    name: 'Spacing',         type: 'pass' },
      { id: 'empty-snag',       name: 'Snag',            type: 'pass' },
      { id: 'empty-levels',     name: 'Levels',          type: 'pass' },
      { id: 'empty-screen',     name: 'WR Screen',       type: 'pass' },
      { id: 'empty-qb-draw',    name: 'QB Draw',         type: 'run'  },
    ],

    // ── PISTOL — hybrid run/pass ───────────
    'pistol': [
      { id: 'pistol-power',     name: 'Power',           type: 'run'  },
      { id: 'pistol-counter',   name: 'Counter',         type: 'run'  },
      { id: 'pistol-zone',      name: 'Inside Zone',     type: 'run'  },
      { id: 'pistol-sweep',     name: 'Sweep',           type: 'run'  },
      { id: 'pistol-rpo-slant', name: 'RPO Slant',       type: 'run'  },
      { id: 'pistol-rpo-screen',name: 'RPO Screen',      type: 'run'  },
      { id: 'pistol-pa-cross',  name: 'PA Cross',        type: 'pass' },
      { id: 'pistol-pa-post',   name: 'PA Post',         type: 'pass' },
      { id: 'pistol-mesh',      name: 'Mesh',            type: 'pass' },
      { id: 'pistol-verticals', name: 'Verticals',       type: 'pass' },
    ],

    // ── UNDERCENTER — traditional ──────────
    'undercenter': [
      { id: 'uc-power',         name: 'Power',           type: 'run'  },
      { id: 'uc-counter',       name: 'Counter',         type: 'run'  },
      { id: 'uc-iso',           name: 'ISO',             type: 'run'  },
      { id: 'uc-outside-zone',  name: 'Outside Zone',    type: 'run'  },
      { id: 'uc-sweep',         name: 'Sweep',           type: 'run'  },
      { id: 'uc-fb-dive',       name: 'FB Dive',         type: 'run'  },
      { id: 'uc-pa-boot',       name: 'PA Bootleg',      type: 'pass' },
      { id: 'uc-pa-cross',      name: 'PA Cross',        type: 'pass' },
      { id: 'uc-pa-corner',     name: 'PA Corner',       type: 'pass' },
      { id: 'uc-slant',         name: 'Slant',           type: 'pass' },
    ],

  },

  motions: [
    { id: 'none',            name: 'No Motion'       },
    { id: 'jet',             name: 'Jet'             },
    { id: 'orbit',           name: 'Orbit'           },
    { id: 'fly',             name: 'Fly'             },
    { id: 'hb-left',         name: 'HB Left'         },
    { id: 'hb-right',        name: 'HB Right'        },
    { id: 'slot-motion',     name: 'Slot Motion'     },
    { id: 'shift-trips',     name: 'Shift Trips'     },
    { id: 'shift-empty',     name: 'Shift Empty'     },
  ],
};

const OPPONENT_PLAYBOOK = {
  formations: [
    { id: 'opp-shotgun',     name: 'Shotgun',      group: 'S' },
    { id: 'opp-undercenter', name: 'Under Center',  group: 'U' },
    { id: 'opp-pistol',      name: 'Pistol',        group: 'P' },
    { id: 'opp-wildcat',     name: 'Wildcat',       group: 'W' },
    { id: 'opp-empty',       name: 'Empty',         group: 'E' },
  ],
  plays: {
    'opp-shotgun': [
      { id: 'opp-sg-inside-zone',  name: 'Inside Zone',    type: 'run'  },
      { id: 'opp-sg-outside-zone', name: 'Outside Zone',   type: 'run'  },
      { id: 'opp-sg-power',        name: 'Power',          type: 'run'  },
      { id: 'opp-sg-draw',         name: 'Draw',           type: 'run'  },
      { id: 'opp-sg-rpo-slant',    name: 'RPO Slant',      type: 'run'  },
      { id: 'opp-sg-rpo-bubble',   name: 'RPO Bubble',     type: 'run'  },
      { id: 'opp-sg-four-verts',   name: 'Four Verticals', type: 'pass' },
      { id: 'opp-sg-mesh',         name: 'Mesh',           type: 'pass' },
      { id: 'opp-sg-shallow',      name: 'Shallow Cross',  type: 'pass' },
      { id: 'opp-sg-curl-flat',    name: 'Curl Flat',      type: 'pass' },
      { id: 'opp-sg-slant',        name: 'Slant',          type: 'pass' },
      { id: 'opp-sg-screen',       name: 'WR Screen',      type: 'pass' },
      { id: 'opp-sg-bubble',       name: 'Bubble Screen',  type: 'pass' },
    ],
    'opp-undercenter': [
      { id: 'opp-uc-power',        name: 'Power',          type: 'run'  },
      { id: 'opp-uc-counter',      name: 'Counter',        type: 'run'  },
      { id: 'opp-uc-iso',          name: 'ISO',            type: 'run'  },
      { id: 'opp-uc-outside-zone', name: 'Outside Zone',   type: 'run'  },
      { id: 'opp-uc-sweep',        name: 'Sweep',          type: 'run'  },
      { id: 'opp-uc-pa-boot',      name: 'PA Bootleg',     type: 'pass' },
      { id: 'opp-uc-pa-cross',     name: 'PA Cross',       type: 'pass' },
      { id: 'opp-uc-slant',        name: 'Slant',          type: 'pass' },
    ],
    'opp-pistol': [
      { id: 'opp-ps-power',        name: 'Power',          type: 'run'  },
      { id: 'opp-ps-counter',      name: 'Counter',        type: 'run'  },
      { id: 'opp-ps-inside-zone',  name: 'Inside Zone',    type: 'run'  },
      { id: 'opp-ps-rpo-slant',    name: 'RPO Slant',      type: 'run'  },
      { id: 'opp-ps-pa-cross',     name: 'PA Cross',       type: 'pass' },
      { id: 'opp-ps-pa-post',      name: 'PA Post',        type: 'pass' },
      { id: 'opp-ps-mesh',         name: 'Mesh',           type: 'pass' },
      { id: 'opp-ps-verticals',    name: 'Verticals',      type: 'pass' },
    ],
    'opp-wildcat': [
      { id: 'opp-wc-inside-zone',  name: 'Inside Zone',    type: 'run'  },
      { id: 'opp-wc-outside-zone', name: 'Outside Zone',   type: 'run'  },
      { id: 'opp-wc-power',        name: 'Power',          type: 'run'  },
      { id: 'opp-wc-sweep',        name: 'Sweep',          type: 'run'  },
      { id: 'opp-wc-pass',         name: 'Wildcat Pass',   type: 'pass' },
    ],
    'opp-empty': [
      { id: 'opp-em-qb-draw',      name: 'QB Draw',        type: 'run'  },
      { id: 'opp-em-four-verts',   name: 'Four Verticals', type: 'pass' },
      { id: 'opp-em-mesh',         name: 'Mesh',           type: 'pass' },
      { id: 'opp-em-shallow',      name: 'Shallow Cross',  type: 'pass' },
      { id: 'opp-em-spacing',      name: 'Spacing',        type: 'pass' },
      { id: 'opp-em-screen',       name: 'WR Screen',      type: 'pass' },
    ],
  },
  motions: [
    { id: 'none',        name: 'No Motion' },
    { id: 'jet',         name: 'Jet'       },
    { id: 'orbit',       name: 'Orbit'     },
    { id: 'fly',         name: 'Fly'       },
    { id: 'slot-motion', name: 'Slot'      },
  ],
};

const DEFENSE_DATA = {
  fronts: [
    { id: '4-3',        name: '4-3'          },
    { id: '3-4',        name: '3-4'          },
    { id: '5-2',        name: '5-2'          },
    { id: '4-4',        name: '4-4'          },
    { id: '3-3',        name: '3-3'          },
    { id: '3-2',        name: '3-2'          },
    { id: '2-3',        name: '2-3'          },
    { id: 'nickel-4-2', name: 'Nickel (4-2)' },
  ],
  blitzes: [
    { id: 'none',      name: 'No Blitz'    },
    { id: 'a-gap',     name: 'A-Gap Blitz' },
    { id: 'b-gap',     name: 'B-Gap Blitz' },
    { id: 'edge',      name: 'Edge Blitz'  },
    { id: 'db-blitz',  name: 'DB Blitz'    },
    { id: 'zero',      name: 'Zero Blitz'  },
    { id: 'fire-zone', name: 'Fire Zone'   },
    { id: 'overload',  name: 'Overload'    },
  ],
  coverages: [
    { id: 'cover-0',  name: 'Cover 0'           },
    { id: 'cover-1',  name: 'Cover 1'           },
    { id: 'cover-2',  name: 'Cover 2'           },
    { id: 'cover-2m', name: 'Cover 2 Man'       },
    { id: 'cover-3',  name: 'Cover 3'           },
    { id: 'cover-4',  name: 'Cover 4 (Quarters)'},
    { id: 'cover-6',  name: 'Cover 6'           },
    { id: 'tampa-2',  name: 'Tampa 2'           },
  ],
};

const OPP_DEFENSE_DATA = {
  fronts:    DEFENSE_DATA.fronts.slice(),
  blitzes:   DEFENSE_DATA.blitzes.slice(),
  coverages: DEFENSE_DATA.coverages.slice(),
};

const ST_PLAYBOOK = {
  formations: [
    { id: 'st-kickoff',         name: 'Kickoff',            group: 'K' },
    { id: 'st-kickoff-return',  name: 'Kickoff Return',     group: 'K' },
    { id: 'st-punt',            name: 'Punt',               group: 'P' },
    { id: 'st-punt-return',     name: 'Punt Return',        group: 'P' },
    { id: 'st-field-goal',      name: 'Field Goal',         group: 'F' },
    { id: 'st-fg-defense',      name: 'Field Goal Defense', group: 'F' },
  ],
  plays: {
    'st-kickoff': [
      { id: 'st-ko-normal',  name: 'Kickoff Normal', type: 'run' },
      { id: 'st-ko-sky',     name: 'Kickoff Sky',    type: 'run' },
      { id: 'st-ko-squib',   name: 'Squib Kick',     type: 'run' },
      { id: 'st-ko-onside',  name: 'Onside Kick',    type: 'run' },
    ],
    'st-kickoff-return': [
      { id: 'st-kr-return',    name: 'Return',      type: 'run' },
      { id: 'st-kr-fair',      name: 'Fair Catch',  type: 'run' },
      { id: 'st-kr-touchback', name: 'Touchback',   type: 'run' },
    ],
    'st-punt': [
      { id: 'st-p-normal',    name: 'Punt Normal',    type: 'run' },
      { id: 'st-p-fake',      name: 'Fake Punt Run',  type: 'run' },
      { id: 'st-p-fake-pass', name: 'Fake Punt Pass', type: 'pass' },
    ],
    'st-punt-return': [
      { id: 'st-pr-return', name: 'Return',        type: 'run' },
      { id: 'st-pr-fair',   name: 'Fair Catch',    type: 'run' },
      { id: 'st-pr-block',  name: 'Block Attempt', type: 'run' },
    ],
    'st-field-goal': [
      { id: 'st-fg-normal',    name: 'Field Goal',     type: 'run' },
      { id: 'st-pat-normal',   name: 'PAT',            type: 'run' },
      { id: 'st-fg-fake',      name: 'Fake FG Run',    type: 'run' },
      { id: 'st-fg-fake-pass', name: 'Fake FG Pass',   type: 'pass' },
    ],
    'st-fg-defense': [
      { id: 'st-fgd-block',  name: 'Block Attempt', type: 'run' },
      { id: 'st-fgd-normal', name: 'Defend Normal', type: 'run' },
    ],
  },
  motions: [
    { id: 'none', name: 'No Motion' },
  ],
};

const ST_DEFENSE_DATA = {
  fronts: [
    { id: 'st-fg-rush',     name: 'FG Rush'      },
    { id: 'st-punt-rush',   name: 'Punt Rush'     },
    { id: 'st-ko-def',      name: 'KO Defense'    },
    { id: 'st-pr-def',      name: 'PR Defense'    },
    { id: 'st-safe',        name: 'Safe'          },
  ],
  blitzes: [
    { id: 'none',           name: 'No Rush'       },
    { id: 'st-all-out',     name: 'All Out Rush'  },
    { id: 'st-edge-rush',   name: 'Edge Rush'     },
    { id: 'st-middle-rush', name: 'Middle Rush'   },
  ],
  coverages: [
    { id: 'st-zone',        name: 'Zone'          },
    { id: 'st-man',         name: 'Man'           },
    { id: 'st-wedge',       name: 'Wedge'         },
    { id: 'st-sky',         name: 'Sky'           },
    { id: 'st-pooch',       name: 'Pooch'         },
  ],
};

// Reads a playbook from localStorage, falls back to defaultData
function getPlaybook(key, defaultData) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultData;
  } catch { return defaultData; }
}

function getOwnOffPlaybook() { return getPlaybook(TeamConfig.key('playsync_playbook_own_off'), PLAYBOOK);        }
function getOwnDefPlaybook() { return getPlaybook(TeamConfig.key('playsync_playbook_own_def'), DEFENSE_DATA);    }
function getOppOffPlaybook() { return getPlaybook(TeamConfig.key('playsync_playbook_opp_off'), OPPONENT_PLAYBOOK);}
function getOppDefPlaybook() { return getPlaybook(TeamConfig.key('playsync_playbook_opp_def'), OPP_DEFENSE_DATA); }
function getSTPlaybook()     { return getPlaybook(TeamConfig.key('playsync_playbook_st'),      ST_PLAYBOOK);      }
function getSTDefPlaybook()  { return getPlaybook(TeamConfig.key('playsync_playbook_st_def'),  ST_DEFENSE_DATA);  }

// Returns the active offensive playbook based on possession mode
function getActivePlaybook() {
  if (typeof State !== 'undefined') {
    if (State.possessionMode === 'opp') return getOppOffPlaybook();
    if (State.possessionMode === 'st')  return getSTPlaybook();
  }
  return getOwnOffPlaybook();
}

// Helper: get plays for a formation (fallback to first formation)
function getPlaysForFormation(formationId) {
  const pb = getActivePlaybook();
  const fallback = pb.formations[0]?.id || null;
  return pb.plays[formationId] || (fallback ? pb.plays[fallback] : []) || [];
}
