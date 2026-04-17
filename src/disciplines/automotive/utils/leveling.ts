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
  { title: "Lot Attendant", icon: "🔑" },
  { title: "Lot Attendant II", icon: "🔑" },
  { title: "Lot Attendant III", icon: "🔑" },
  { title: "Lot Attendant IV", icon: "🔑" },
  { title: "Lube Tech", icon: "🛢️" },
  { title: "Lube Tech II", icon: "🛢️" },
  { title: "Lube Tech III", icon: "🛢️" },
  { title: "Lube Tech IV", icon: "🛢️" },
  { title: "Tire Tech", icon: "🛞" },
  { title: "Tire Tech II", icon: "🛞" },
  { title: "Tire Tech III", icon: "🛞" },
  { title: "Tire Tech IV", icon: "🛞" },
  { title: "Apprentice Mechanic", icon: "🔧" },
  { title: "Apprentice Mechanic II", icon: "🔧" },
  { title: "Apprentice Mechanic III", icon: "🔧" },
  { title: "Brake Specialist", icon: "🛑" },
  { title: "Brake Specialist II", icon: "🛑" },
  { title: "Brake Specialist III", icon: "🛑" },
  { title: "Suspension Tech", icon: "🔩" },
  { title: "Suspension Tech II", icon: "🔩" },
  { title: "Suspension Tech III", icon: "🔩" },
  { title: "Electrical Tech", icon: "⚡" },
  { title: "Electrical Tech II", icon: "⚡" },
  { title: "Electrical Tech III", icon: "⚡" },
  { title: "Engine Tech", icon: "⛽" },
  { title: "Engine Tech II", icon: "⛽" },
  { title: "Engine Tech III", icon: "⛽" },
  { title: "Diagnostic Tech", icon: "🔍" },
  { title: "Diagnostic Tech II", icon: "🔍" },
  { title: "Diagnostic Tech III", icon: "🔍" },
  { title: "Transmission Tech", icon: "⚙️" },
  { title: "Transmission Tech II", icon: "⚙️" },
  { title: "Transmission Tech III", icon: "⚙️" },
  { title: "Drivetrain Specialist", icon: "🏎️" },
  { title: "Drivetrain Specialist II", icon: "🏎️" },
  { title: "Drivetrain Specialist III", icon: "🏎️" },
  { title: "Senior Technician", icon: "🛠️" },
  { title: "Senior Technician II", icon: "🛠️" },
  { title: "Senior Technician III", icon: "🛠️" },
  { title: "Shop Foreman", icon: "👷" },
  { title: "Shop Foreman II", icon: "👷" },
  { title: "Shop Foreman III", icon: "👷" },
  { title: "Master Technician", icon: "🏅" },
  { title: "Master Technician II", icon: "🏅" },
  { title: "Master Technician III", icon: "🏅" },
  { title: "Service Manager", icon: "📋" },
  { title: "Service Manager II", icon: "📋" },
  { title: "Service Manager III", icon: "📋" },
  { title: "ASE Master", icon: "⭐" },
  { title: "ASE Master II", icon: "⭐" },
  { title: "ASE Master III", icon: "⭐" },
  { title: "Shop Director", icon: "🦾" },
  { title: "Shop Director II", icon: "🦾" },
  { title: "Shop Director III", icon: "🦾" },
  { title: "Automotive Legend", icon: "🐉" },
  { title: "Automotive Legend II", icon: "🐉" },
  { title: "Automotive Legend III", icon: "🐉" },
  { title: "Automotive Legend IV", icon: "🐉" },
  { title: "Automotive Legend V", icon: "🐉" },
  { title: "Garage Master", icon: "🏆" },
];

// XP per activity (example)
export const XP_ACTIVITY_TABLE = {
  create_account: 10,
  confirm_email: 5,
  complete_profile: 10,
  complete_weekly_challenge: 40,
  create_repair: 15,
  run_repair: 20,           // "Diagnose It"
  add_to_manual: 5,
  view_repair: 2,
  scan_part: 5,
  save_repair: 3,
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
