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

// Level titles and icons — welding career progression
export const LEVEL_TITLES_AND_ICONS = [
  { title: "Shop Sweeper", icon: "\uD83E\uDDF9" },       // � Levels 1-4
  { title: "Shop Sweeper II", icon: "\uD83E\uDDF9" },
  { title: "Shop Sweeper III", icon: "\uD83E\uDDF9" },
  { title: "Shop Sweeper IV", icon: "\uD83E\uDDF9" },
  { title: "Tack Welder", icon: "\u26A1" },               // ⚡ Levels 5-8
  { title: "Tack Welder II", icon: "\u26A1" },
  { title: "Tack Welder III", icon: "\u26A1" },
  { title: "Tack Welder IV", icon: "\u26A1" },
  { title: "Stick Welder", icon: "\uD83D\uDD25" },        // 🔥 Levels 9-12
  { title: "Stick Welder II", icon: "\uD83D\uDD25" },
  { title: "Stick Welder III", icon: "\uD83D\uDD25" },
  { title: "Stick Welder IV", icon: "\uD83D\uDD25" },
  { title: "MIG Welder", icon: "\u2699\uFE0F" },          // ⚙️ Levels 13-15
  { title: "MIG Welder II", icon: "\u2699\uFE0F" },
  { title: "MIG Welder III", icon: "\u2699\uFE0F" },
  { title: "TIG Welder", icon: "\u2728" },                 // ✨ Levels 16-18
  { title: "TIG Welder II", icon: "\u2728" },
  { title: "TIG Welder III", icon: "\u2728" },
  { title: "Combo Welder", icon: "\uD83D\uDD29" },        // 🔩 Levels 19-21
  { title: "Combo Welder II", icon: "\uD83D\uDD29" },
  { title: "Combo Welder III", icon: "\uD83D\uDD29" },
  { title: "Pipe Welder", icon: "\uD83C\uDFD7\uFE0F" },  // 🏗️ Levels 22-24
  { title: "Pipe Welder II", icon: "\uD83C\uDFD7\uFE0F" },
  { title: "Pipe Welder III", icon: "\uD83C\uDFD7\uFE0F" },
  { title: "Structural Welder", icon: "\uD83C\uDFE2" },   // 🏢 Levels 25-27
  { title: "Structural Welder II", icon: "\uD83C\uDFE2" },
  { title: "Structural Welder III", icon: "\uD83C\uDFE2" },
  { title: "Fabricator", icon: "\uD83C\uDFED" },           // � Levels 28-30
  { title: "Fabricator II", icon: "\uD83C\uDFED" },
  { title: "Fabricator III", icon: "\uD83C\uDFED" },
  { title: "Weld Inspector", icon: "\uD83D\uDD0D" },      // 🔍 Levels 31-33
  { title: "Weld Inspector II", icon: "\uD83D\uDD0D" },
  { title: "Weld Inspector III", icon: "\uD83D\uDD0D" },
  { title: "Certified Welder", icon: "\uD83D\uDCCB" },    // 📋 Levels 34-36
  { title: "Certified Welder II", icon: "\uD83D\uDCCB" },
  { title: "Certified Welder III", icon: "\uD83D\uDCCB" },
  { title: "Shop Foreman", icon: "\uD83D\uDC68\u200D\uD83D\uDD27" }, // 👨‍🔧 Levels 37-39
  { title: "Shop Foreman II", icon: "\uD83D\uDC68\u200D\uD83D\uDD27" },
  { title: "Shop Foreman III", icon: "\uD83D\uDC68\u200D\uD83D\uDD27" },
  { title: "Lead Welder", icon: "\uD83C\uDF93" },          // 🎓 Levels 40-42
  { title: "Lead Welder II", icon: "\uD83C\uDF93" },
  { title: "Lead Welder III", icon: "\uD83C\uDF93" },
  { title: "Master Welder", icon: "\uD83C\uDFC5" },        // 🏅 Levels 43-45
  { title: "Master Welder II", icon: "\uD83C\uDFC5" },
  { title: "Master Welder III", icon: "\uD83C\uDFC5" },
  { title: "Welding Engineer", icon: "\uD83D\uDC68\u200D\uD83D\uDCBC" }, // 👨‍💼 Levels 46-48
  { title: "Welding Engineer II", icon: "\uD83D\uDC68\u200D\uD83D\uDCBC" },
  { title: "Welding Engineer III", icon: "\uD83D\uDC68\u200D\uD83D\uDCBC" },
  { title: "Elite Welder", icon: "\u2B50" },                // ⭐ Levels 49-51
  { title: "Elite Welder II", icon: "\u2B50" },
  { title: "Elite Welder III", icon: "\u2B50" },
  { title: "Iron Worker", icon: "\uD83E\uDDBE" },          // 🦾 Levels 52-54
  { title: "Iron Worker II", icon: "\uD83E\uDDBE" },
  { title: "Iron Worker III", icon: "\uD83E\uDDBE" },
  { title: "Legendary Welder", icon: "\uD83D\uDC09" },     // 🐉 Levels 55-59
  { title: "Legendary Welder II", icon: "\uD83D\uDC09" },
  { title: "Legendary Welder III", icon: "\uD83D\uDC09" },
  { title: "Legendary Welder IV", icon: "\uD83D\uDC09" },
  { title: "Legendary Welder V", icon: "\uD83D\uDC09" },
  { title: "Welding God", icon: "\uD83D\uDD25" },          // 🔥 Level 60
];

// XP per activity (example)
export const XP_ACTIVITY_TABLE = {
  create_account: 10,
  confirm_email: 5,
  complete_profile: 10,
  complete_weekly_challenge: 40,
  create_project: 15,
  run_project: 20,        // "Build It"
  add_to_specbook: 5,
  view_project: 2,
  scan_material: 5,
  save_project: 3,
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
