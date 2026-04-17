// WoW Classic XP table for levels 1–60 (total XP required to reach each level)
export const WOW_CLASSIC_XP_TABLE = [
  0,      // Level 1 (start)
  400,    // Level 2
  900,    // Level 3
  1400,   // Level 4
  2100,   // Level 5
  2800,   // Level 6
  3600,   // Level 7
  4500,   // Level 8
  5400,   // Level 9
  6500,   // Level 10
  7600,   // Level 11
  8800,   // Level 12
  10100,  // Level 13
  11400,  // Level 14
  12900,  // Level 15
  14400,  // Level 16
  15900,  // Level 17
  17500,  // Level 18
  19200,  // Level 19
  20900,  // Level 20
  22700,  // Level 21
  24600,  // Level 22
  26600,  // Level 23
  28700,  // Level 24
  30900,  // Level 25
  33200,  // Level 26
  35600,  // Level 27
  38100,  // Level 28
  40700,  // Level 29
  43400,  // Level 30
  46200,  // Level 31
  49100,  // Level 32
  52100,  // Level 33
  55200,  // Level 34
  58400,  // Level 35
  61700,  // Level 36
  65100,  // Level 37
  68600,  // Level 38
  72200,  // Level 39
  75900,  // Level 40
  79700,  // Level 41
  83600,  // Level 42
  87600,  // Level 43
  91700,  // Level 44
  95900,  // Level 45
  100200, // Level 46
  104600, // Level 47
  109100, // Level 48
  113700, // Level 49
  118400, // Level 50
  123200, // Level 51
  128100, // Level 52
  133100, // Level 53
  138200, // Level 54
  143400, // Level 55
  148700, // Level 56
  154100, // Level 57
  159600, // Level 58
  165200, // Level 59
  170900, // Level 60
];

// Level titles and icons (milestones and in-betweens)
export const LEVEL_TITLES_AND_ICONS = [
  { title: "Tool Runner", icon: "🧹" },
  { title: "Tool Runner II", icon: "🧹" },
  { title: "Tool Runner III", icon: "🧹" },
  { title: "Tool Runner IV", icon: "🧹" },
  { title: "Pipe Cutter", icon: "🔧" },
  { title: "Pipe Cutter II", icon: "🔧" },
  { title: "Pipe Cutter III", icon: "🔧" },
  { title: "Pipe Cutter IV", icon: "🔧" },
  { title: "Apprentice Plumber", icon: "🔩" },
  { title: "Apprentice Plumber II", icon: "🔩" },
  { title: "Apprentice Plumber III", icon: "🔩" },
  { title: "Apprentice Plumber IV", icon: "🔩" },
  { title: "Service Plumber", icon: "🚿" },
  { title: "Service Plumber II", icon: "🚿" },
  { title: "Service Plumber III", icon: "🚿" },
  { title: "Residential Plumber", icon: "🏠" },
  { title: "Residential Plumber II", icon: "🏠" },
  { title: "Residential Plumber III", icon: "🏠" },
  { title: "Commercial Plumber", icon: "🏢" },
  { title: "Commercial Plumber II", icon: "🏢" },
  { title: "Commercial Plumber III", icon: "🏢" },
  { title: "Drain Specialist", icon: "🚰" },
  { title: "Drain Specialist II", icon: "🚰" },
  { title: "Drain Specialist III", icon: "🚰" },
  { title: "Gas Fitter", icon: "🔥" },
  { title: "Gas Fitter II", icon: "🔥" },
  { title: "Gas Fitter III", icon: "🔥" },
  { title: "Hydronics Tech", icon: "♨️" },
  { title: "Hydronics Tech II", icon: "♨️" },
  { title: "Hydronics Tech III", icon: "♨️" },
  { title: "Backflow Specialist", icon: "💧" },
  { title: "Backflow Specialist II", icon: "💧" },
  { title: "Backflow Specialist III", icon: "💧" },
  { title: "Code Inspector", icon: "📋" },
  { title: "Code Inspector II", icon: "📋" },
  { title: "Code Inspector III", icon: "📋" },
  { title: "Lead Plumber", icon: "🛠️" },
  { title: "Lead Plumber II", icon: "🛠️" },
  { title: "Lead Plumber III", icon: "🛠️" },
  { title: "Foreman", icon: "👷" },
  { title: "Foreman II", icon: "👷" },
  { title: "Foreman III", icon: "👷" },
  { title: "Master Plumber", icon: "🏅" },
  { title: "Master Plumber II", icon: "🏅" },
  { title: "Master Plumber III", icon: "🏅" },
  { title: "Plumbing Contractor", icon: "📐" },
  { title: "Plumbing Contractor II", icon: "📐" },
  { title: "Plumbing Contractor III", icon: "📐" },
  { title: "Estimator", icon: "⭐" },
  { title: "Estimator II", icon: "⭐" },
  { title: "Estimator III", icon: "⭐" },
  { title: "Project Manager", icon: "🦾" },
  { title: "Project Manager II", icon: "🦾" },
  { title: "Project Manager III", icon: "🦾" },
  { title: "Legendary Plumber", icon: "🐉" },
  { title: "Legendary Plumber II", icon: "🐉" },
  { title: "Legendary Plumber III", icon: "🐉" },
  { title: "Legendary Plumber IV", icon: "🐉" },
  { title: "Legendary Plumber V", icon: "🐉" },
  { title: "Pipe Master", icon: "🏆" },
];

// XP per activity (example)
export const XP_ACTIVITY_TABLE = {
  create_account: 10,
  confirm_email: 5,
  complete_profile: 10,
  complete_weekly_challenge: 40,
  create_fit: 15,
  run_fit: 20,            // "Build It"
  add_to_pipebook: 5,
  view_fit: 2,
  scan_part: 5,
  save_fit: 3,
  achieve_streak: 20,
};

// Utility: Get level from total XP
export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpSum = 0;
  for (let i = 1; i < WOW_CLASSIC_XP_TABLE.length; i++) {
    xpSum += WOW_CLASSIC_XP_TABLE[i];
    if (totalXP < xpSum) {
      return i;
    }
    level = i + 1;
  }
  return Math.min(level, 60);
}

// Utility: Get XP needed for next level
export function getXPForNextLevel(level: number): number {
  if (level < 1 || level >= WOW_CLASSIC_XP_TABLE.length) return 0;
  return WOW_CLASSIC_XP_TABLE[level];
}

// Utility: Get XP progress toward next level
export function getXPProgress(totalXP: number): { level: number; current: number; required: number } {
  let xpSum = 0;
  for (let i = 1; i < WOW_CLASSIC_XP_TABLE.length; i++) {
    if (totalXP < xpSum + WOW_CLASSIC_XP_TABLE[i]) {
      return { level: i, current: totalXP - xpSum, required: WOW_CLASSIC_XP_TABLE[i] };
    }
    xpSum += WOW_CLASSIC_XP_TABLE[i];
  }
  return { level: 60, current: WOW_CLASSIC_XP_TABLE[59], required: 0 };
}
