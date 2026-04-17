import { supabase } from '../api/supabaseClient';

export type BadgeCategory =
  | 'Weekly Challenge'
  | 'Milestone'
  | 'Difficulty'
  | 'Theme'
  | 'Streak'
  | 'Community'
  | 'Special';

export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;
  category: BadgeCategory;
  description: string;
}

export const BADGES: BadgeDefinition[] = [
  // --- WEEKLY CHALLENGE BADGES ---
  { id: 'oil_change_ace', name: 'Oil Change Ace', icon: '🛢️', category: 'Weekly Challenge', description: 'Won an oil change challenge.' },
  { id: 'brake_boss', name: 'Brake Boss', icon: '🛑', category: 'Weekly Challenge', description: 'Won a brake service challenge.' },
  { id: 'tire_titan', name: 'Tire Titan', icon: '🛞', category: 'Weekly Challenge', description: 'Won a tire challenge.' },
  { id: 'spark_plug_pro', name: 'Spark Plug Pro', icon: '⚡', category: 'Weekly Challenge', description: 'Won an ignition challenge.' },
  { id: 'belt_master', name: 'Belt Master', icon: '🔧', category: 'Weekly Challenge', description: 'Won a belt/hose challenge.' },
  { id: 'coolant_king', name: 'Coolant King', icon: '❄️', category: 'Weekly Challenge', description: 'Won a cooling system challenge.' },
  { id: 'exhaust_expert', name: 'Exhaust Expert', icon: '💨', category: 'Weekly Challenge', description: 'Won an exhaust challenge.' },
  { id: 'alignment_ace', name: 'Alignment Ace', icon: '�', category: 'Weekly Challenge', description: 'Won an alignment challenge.' },
  { id: 'battery_boss', name: 'Battery Boss', icon: '🔋', category: 'Weekly Challenge', description: 'Won a battery/electrical challenge.' },
  { id: 'suspension_star', name: 'Suspension Star', icon: '🔩', category: 'Weekly Challenge', description: 'Won a suspension challenge.' },
  { id: 'transmission_tech', name: 'Transmission Tech', icon: '⚙️', category: 'Weekly Challenge', description: 'Won a transmission challenge.' },
  { id: 'fuel_system_pro', name: 'Fuel System Pro', icon: '⛽', category: 'Weekly Challenge', description: 'Won a fuel system challenge.' },
  { id: 'diagnostic_detective', name: 'Diagnostic Detective', icon: '🔍', category: 'Weekly Challenge', description: 'Won a diagnostics challenge.' },
  { id: 'ac_specialist', name: 'A/C Specialist', icon: '�️', category: 'Weekly Challenge', description: 'Won an HVAC challenge.' },
  { id: 'steering_star', name: 'Steering Star', icon: '🚗', category: 'Weekly Challenge', description: 'Won a steering challenge.' },
  { id: 'obd_oracle', name: 'OBD Oracle', icon: '📟', category: 'Weekly Challenge', description: 'Won a code reading challenge.' },
  { id: 'wiring_wizard', name: 'Wiring Wizard', icon: '🔌', category: 'Weekly Challenge', description: 'Won a wiring challenge.' },
  { id: 'turbo_tech', name: 'Turbo Tech', icon: '🏎️', category: 'Weekly Challenge', description: 'Won a turbo/supercharger challenge.' },
  { id: 'hybrid_hero', name: 'Hybrid Hero', icon: '🔋', category: 'Weekly Challenge', description: 'Won a hybrid vehicle challenge.' },
  { id: 'diesel_doctor', name: 'Diesel Doctor', icon: '🚛', category: 'Weekly Challenge', description: 'Won a diesel challenge.' },
  { id: 'paint_pro', name: 'Paint Pro', icon: '�', category: 'Weekly Challenge', description: 'Won a body/paint challenge.' },
  { id: 'safety_inspector', name: 'Safety Inspector', icon: '�', category: 'Weekly Challenge', description: 'Won a safety inspection challenge.' },
  { id: 'timing_master', name: 'Timing Master', icon: '⏱️', category: 'Weekly Challenge', description: 'Won a timing belt/chain challenge.' },
  { id: 'clutch_commander', name: 'Clutch Commander', icon: '🕹️', category: 'Weekly Challenge', description: 'Won a clutch/manual trans challenge.' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', icon: '🎉', category: 'Weekly Challenge', description: 'Won a weekend repair challenge.' },
  { id: 'ev_expert', name: 'EV Expert', icon: '⚡', category: 'Weekly Challenge', description: 'Won an electric vehicle challenge.' },
  { id: 'sensor_sleuth', name: 'Sensor Sleuth', icon: '📡', category: 'Weekly Challenge', description: 'Won a sensor diagnostics challenge.' },
  { id: 'gasket_guru', name: 'Gasket Guru', icon: '🔧', category: 'Weekly Challenge', description: 'Won a gasket/seal challenge.' },
  { id: 'radiator_ruler', name: 'Radiator Ruler', icon: '♨️', category: 'Weekly Challenge', description: 'Won a radiator challenge.' },

  // --- MILESTONE BADGES (20) ---
  { id: 'repair_novice', name: 'Repair Novice', icon: '🔧', category: 'Milestone', description: 'Completed 10 repairs.' },
  { id: 'repair_apprentice', name: 'Repair Apprentice', icon: '🔧', category: 'Milestone', description: 'Completed 25 repairs.' },
  { id: 'repair_pro', name: 'Repair Pro', icon: '🔧', category: 'Milestone', description: 'Completed 50 repairs.' },
  { id: 'repair_veteran', name: 'Repair Veteran', icon: '🛠️', category: 'Milestone', description: 'Completed 100 repairs.' },
  { id: 'repair_hero', name: 'Repair Hero', icon: '🛠️', category: 'Milestone', description: 'Completed 200 repairs.' },
  { id: 'repair_master', name: 'Repair Master', icon: '🛠️', category: 'Milestone', description: 'Completed 300 repairs.' },
  { id: 'repair_legend', name: 'Repair Legend', icon: '�', category: 'Milestone', description: 'Completed 400 repairs.' },
  { id: 'repair_icon', name: 'Repair Icon', icon: '�', category: 'Milestone', description: 'Completed 500 repairs.' },
  { id: 'repair_champion', name: 'Repair Champion', icon: '�', category: 'Milestone', description: 'Completed 750 repairs.' },
  { id: 'repair_god', name: 'Repair God', icon: '�', category: 'Milestone', description: 'Completed 1000 repairs.' },
  { id: 'manual_5', name: 'Manual Collector', icon: '📚', category: 'Milestone', description: 'Added 5 repairs to your manual.' },
  { id: 'manual_10', name: 'Manual Curator', icon: '📚', category: 'Milestone', description: 'Added 10 repairs to your manual.' },
  { id: 'manual_20', name: 'Manual Librarian', icon: '📚', category: 'Milestone', description: 'Added 20 repairs to your manual.' },
  { id: 'manual_40', name: 'Manual Archivist', icon: '📚', category: 'Milestone', description: 'Added 40 repairs to your manual.' },
  { id: 'manual_60', name: 'Manual Historian', icon: '📚', category: 'Milestone', description: 'Added 60 repairs to your manual.' },
  { id: 'manual_80', name: 'Manual Scholar', icon: '📚', category: 'Milestone', description: 'Added 80 repairs to your manual.' },
  { id: 'manual_100', name: 'Manual Sage', icon: '📚', category: 'Milestone', description: 'Added 100 repairs to your manual.' },
  { id: 'first_repair', name: 'First Repair', icon: '�', category: 'Milestone', description: 'Completed your first repair.' },
  { id: 'first_added', name: 'First Addition', icon: '📝', category: 'Milestone', description: 'Added your first repair order.' },
  { id: 'first_challenge', name: 'First Challenge', icon: '🏆', category: 'Milestone', description: 'Completed your first challenge.' },

  // --- DIFFICULTY BADGES (10) ---
  { id: 'easy_first', name: 'Easy Starter', icon: '🔧', category: 'Difficulty', description: 'Completed your first basic repair.' },
  { id: 'intermediate_first', name: 'Intermediate Initiate', icon: '🛠️', category: 'Difficulty', description: 'Completed your first intermediate repair.' },
  { id: 'hard_first', name: 'Advanced Specialist', icon: '🔥', category: 'Difficulty', description: 'Completed your first advanced repair.' },
  { id: 'easy_10', name: 'Easy Veteran', icon: '🔧', category: 'Difficulty', description: 'Completed 10 basic repairs.' },
  { id: 'intermediate_10', name: 'Intermediate Veteran', icon: '🛠️', category: 'Difficulty', description: 'Completed 10 intermediate repairs.' },
  { id: 'hard_10', name: 'Hardcore Veteran', icon: '🔥', category: 'Difficulty', description: 'Completed 10 advanced repairs.' },
  { id: 'easy_25', name: 'Easy Master', icon: '🔧', category: 'Difficulty', description: 'Completed 25 basic repairs.' },
  { id: 'intermediate_25', name: 'Intermediate Master', icon: '🛠️', category: 'Difficulty', description: 'Completed 25 intermediate repairs.' },
  { id: 'hard_25', name: 'Hardcore Master', icon: '🔥', category: 'Difficulty', description: 'Completed 25 advanced repairs.' },
  { id: 'master_tech', name: 'Master Technician', icon: '🦾', category: 'Difficulty', description: 'Completed 50 advanced repairs.' },

  // --- THEME/SPECIALTY BADGES (50) ---
  // Engine, Brakes, Electrical, Transmission, Suspension, Diagnostics, HVAC, Fuel, Exhaust, Body
  // Each theme has 5 tiers: 1, 5, 10, 25, 50
  ...(() => {
    const themes = [
      { key: 'engine', name: 'Engine Expert', icon: '⛽' },
      { key: 'brakes', name: 'Brake Specialist', icon: '🛑' },
      { key: 'electrical', name: 'Electrical Pro', icon: '⚡' },
      { key: 'transmission', name: 'Trans Tech', icon: '⚙️' },
      { key: 'suspension', name: 'Suspension Pro', icon: '🔩' },
      { key: 'diagnostics', name: 'Diagnostic Ace', icon: '🔍' },
      { key: 'hvac', name: 'HVAC Hero', icon: '❄️' },
      { key: 'fuel', name: 'Fuel System Pro', icon: '⛽' },
      { key: 'exhaust', name: 'Exhaust Expert', icon: '💨' },
      { key: 'body', name: 'Body Work Pro', icon: '�' },
    ];
    const tiers = [
      { suffix: '_1', desc: 'Completed 1', n: 1 },
      { suffix: '_5', desc: 'Completed 5', n: 5 },
      { suffix: '_10', desc: 'Completed 10', n: 10 },
      { suffix: '_25', desc: 'Completed 25', n: 25 },
      { suffix: '_50', desc: 'Completed 50', n: 50 },
    ];
    const out: BadgeDefinition[] = [];
    for (const theme of themes) {
      for (const tier of tiers) {
        out.push({
          id: `${theme.key}${tier.suffix}`,
          name: `${theme.name}${tier.n > 1 ? ' ' + tier.n : ''}`,
          icon: theme.icon,
          category: 'Theme',
          description: `${tier.desc} ${theme.name.replace(/ .*/, '').toLowerCase()} repairs.`
        });
      }
    }
    return out;
  })(),

  // --- STREAK BADGES (10) ---
  { id: 'streak_3', name: '3-Day Streak', icon: '🔥', category: 'Streak', description: 'Completed 3 days in a row.' },
  { id: 'streak_7', name: 'One-Week Streak', icon: '🔥', category: 'Streak', description: 'Completed 7 days in a row.' },
  { id: 'streak_14', name: 'Two-Week Streak', icon: '🔥', category: 'Streak', description: 'Completed 14 days in a row.' },
  { id: 'streak_30', name: 'One-Month Streak', icon: '🔥', category: 'Streak', description: 'Completed 30 days in a row.' },
  { id: 'streak_60', name: 'Two-Month Streak', icon: '🔥', category: 'Streak', description: 'Completed 60 days in a row.' },
  { id: 'streak_90', name: 'Three-Month Streak', icon: '🔥', category: 'Streak', description: 'Completed 90 days in a row.' },
  { id: 'challenge_streak_3', name: 'Challenge Streak 3', icon: '🏅', category: 'Streak', description: 'Completed 3 weekly challenges in a row.' },
  { id: 'challenge_streak_5', name: 'Challenge Streak 5', icon: '🏅', category: 'Streak', description: 'Completed 5 weekly challenges in a row.' },
  { id: 'challenge_streak_10', name: 'Challenge Streak 10', icon: '🏅', category: 'Streak', description: 'Completed 10 weekly challenges in a row.' },
  { id: 'challenge_streak_20', name: 'Challenge Streak 20', icon: '🏅', category: 'Streak', description: 'Completed 20 weekly challenges in a row.' },

  // --- COMMUNITY BADGES (14) ---
  { id: 'repair_sharer_1', name: 'Repair Sharer', icon: '📤', category: 'Community', description: 'Shared your first repair.' },
  { id: 'repair_sharer_5', name: 'Repair Contributor', icon: '📤', category: 'Community', description: 'Shared 5 repairs.' },
  { id: 'repair_sharer_10', name: 'Repair Publisher', icon: '📤', category: 'Community', description: 'Shared 10 repairs.' },
  { id: 'repair_sharer_25', name: 'Repair Influencer', icon: '📤', category: 'Community', description: 'Shared 25 repairs.' },
  { id: 'repair_sharer_50', name: 'Repair Mentor', icon: '📤', category: 'Community', description: 'Shared 50 repairs.' },
  { id: 'commenter_1', name: 'First Comment', icon: '💬', category: 'Community', description: 'Commented on a repair.' },
  { id: 'commenter_10', name: 'Conversationalist', icon: '💬', category: 'Community', description: 'Commented on 10 repairs.' },
  { id: 'commenter_25', name: 'Discussion Leader', icon: '💬', category: 'Community', description: 'Commented on 25 repairs.' },
  { id: 'commenter_50', name: 'Community Voice', icon: '💬', category: 'Community', description: 'Commented on 50 repairs.' },
  { id: 'liker_1', name: 'First Like', icon: '❤️', category: 'Community', description: 'Liked a repair.' },
  { id: 'liker_10', name: 'Repair Fan', icon: '❤️', category: 'Community', description: 'Liked 10 repairs.' },
  { id: 'liker_25', name: 'Repair Enthusiast', icon: '❤️', category: 'Community', description: 'Liked 25 repairs.' },
  { id: 'liker_50', name: 'Repair Specialist', icon: '❤️', category: 'Community', description: 'Liked 50 repairs.' },
  { id: 'liker_100', name: 'Repair Champion', icon: '❤️', category: 'Community', description: 'Liked 100 repairs.' },

  // --- SPECIAL / HIDDEN BADGES (10+) ---
  { id: 'birthday_mechanic', name: 'Birthday Mechanic', icon: '🎂', category: 'Special', description: 'Completed a repair on your birthday.' },
  { id: 'all_challenges', name: 'Jack of All Challenges', icon: '🌟', category: 'Special', description: 'Completed every challenge type.' },
  { id: 'secret_feature', name: 'Hidden Feature', icon: '🕵️‍♂️', category: 'Special', description: 'Discovered a hidden feature.' },
  { id: 'holiday_mechanic', name: 'Holiday Mechanic', icon: '🎁', category: 'Special', description: 'Completed a repair on a holiday.' },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', category: 'Special', description: 'Completed a repair after midnight.' },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦', category: 'Special', description: 'Completed a repair before 6am.' },
  { id: 'all_systems', name: 'All Systems Go', icon: '🏆', category: 'Special', description: 'Completed at least one repair from every system category.' },
  { id: 'challenge_perfect', name: 'Perfect Challenger', icon: '💯', category: 'Special', description: 'Completed every weekly challenge in a month.' },
  { id: 'tech_of_the_year', name: 'Technician of the Year', icon: '🏅', category: 'Special', description: 'Earned the most badges in a year.' },
  { id: 'legendary_tech', name: 'Legendary Technician', icon: '🐉', category: 'Special', description: 'Unlocked all milestone badges.' },
];

// --- Badge Utilities ---

/**
 * Award a badge to a user if not already awarded.
 * Returns true if badge awarded or already present, false on error.
 */
export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  if (!userId || !badgeId) return false;
  // Try to insert, ignore duplicate errors (unique constraint)
  const { error } = await supabase
    .from('user_badges')
    .insert([{ user_id: userId, badge_id: badgeId }]);
  if (error && !error.message.includes('duplicate')) {
    console.error('Failed to award badge:', error);
    return false;
  }
  return true;
}

/**
 * Fetch all badge IDs a user has earned.
 */
export async function getUserBadges(userId: string): Promise<{ badge_id: string; awarded_at: string }[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id, awarded_at')
    .eq('user_id', userId);
  if (error) {
    console.error('Failed to fetch user badges:', error);
    return [];
  }
  return data || [];
}
