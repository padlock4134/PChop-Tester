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
  { title: "Wire Stripper", icon: "🧹" },
  { title: "Wire Stripper II", icon: "🧹" },
  { title: "Wire Stripper III", icon: "🧹" },
  { title: "Wire Stripper IV", icon: "🧹" },
  { title: "Helper", icon: "🔌" },
  { title: "Helper II", icon: "🔌" },
  { title: "Helper III", icon: "🔌" },
  { title: "Helper IV", icon: "🔌" },
  { title: "Circuit Runner", icon: "⚡" },
  { title: "Circuit Runner II", icon: "⚡" },
  { title: "Circuit Runner III", icon: "⚡" },
  { title: "Circuit Runner IV", icon: "⚡" },
  { title: "Apprentice Electrician", icon: "🔧" },
  { title: "Apprentice Electrician II", icon: "🔧" },
  { title: "Apprentice Electrician III", icon: "🔧" },
  { title: "Journeyman", icon: "💡" },
  { title: "Journeyman II", icon: "💡" },
  { title: "Journeyman III", icon: "💡" },
  { title: "Panel Specialist", icon: "🔋" },
  { title: "Panel Specialist II", icon: "🔋" },
  { title: "Panel Specialist III", icon: "🔋" },
  { title: "Conduit Specialist", icon: "🛠️" },
  { title: "Conduit Specialist II", icon: "🛠️" },
  { title: "Conduit Specialist III", icon: "🛠️" },
  { title: "Controls Tech", icon: "🎮" },
  { title: "Controls Tech II", icon: "🎮" },
  { title: "Controls Tech III", icon: "🎮" },
  { title: "Code Specialist", icon: "📐" },
  { title: "Code Specialist II", icon: "📐" },
  { title: "Code Specialist III", icon: "📐" },
  { title: "Field Specialist", icon: "🚧" },
  { title: "Field Specialist II", icon: "🚧" },
  { title: "Field Specialist III", icon: "🚧" },
  { title: "Inventory Specialist", icon: "📦" },
  { title: "Inventory Specialist II", icon: "📦" },
  { title: "Inventory Specialist III", icon: "📦" },
  { title: "Foreman", icon: "🏢" },
  { title: "Foreman II", icon: "🏢" },
  { title: "Foreman III", icon: "🏢" },
  { title: "Lead Electrician", icon: "🎓" },
  { title: "Lead Electrician II", icon: "🎓" },
  { title: "Lead Electrician III", icon: "🎓" },
  { title: "Master Electrician", icon: "🏅" },
  { title: "Master Electrician II", icon: "🏅" },
  { title: "Master Electrician III", icon: "🏅" },
  { title: "Program Director", icon: "👨‍💼" },
  { title: "Program Director II", icon: "👨‍💼" },
  { title: "Program Director III", icon: "👨‍💼" },
  { title: "Celebrity Sparky", icon: "⭐" },
  { title: "Celebrity Sparky II", icon: "⭐" },
  { title: "Celebrity Sparky III", icon: "⭐" },
  { title: "Iron Electrician", icon: "🦾" },
  { title: "Iron Electrician II", icon: "🦾" },
  { title: "Iron Electrician III", icon: "🦾" },
  { title: "Legendary Electrician", icon: "🐉" },
  { title: "Legendary Electrician II", icon: "🐉" },
  { title: "Legendary Electrician III", icon: "🐉" },
  { title: "Legendary Electrician IV", icon: "🐉" },
  { title: "Legendary Electrician V", icon: "🐉" },
  { title: "Craft Master", icon: "🏆" },
];

// XP per activity (example)
export const XP_ACTIVITY_TABLE = {
  create_account: 10,
  confirm_email: 5,
  complete_profile: 10,
  complete_weekly_challenge: 40,
  create_circuit: 15,
  run_circuit: 20,         // "Wire It"
  add_to_codebook: 5,
  view_circuit: 2,
  scan_component: 5,
  save_circuit: 3,
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
