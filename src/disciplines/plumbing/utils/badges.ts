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
  { id: 'copper_king', name: 'Copper King', icon: '🔧', category: 'Weekly Challenge', description: 'Won a copper piping challenge.' },
  { id: 'pvc_pro', name: 'PVC Pro', icon: '🔩', category: 'Weekly Challenge', description: 'Won a PVC challenge.' },
  { id: 'drain_master', name: 'Drain Master', icon: '🚰', category: 'Weekly Challenge', description: 'Won a drain challenge.' },
  { id: 'solder_star', name: 'Solder Star', icon: '🔥', category: 'Weekly Challenge', description: 'Won a soldering challenge.' },
  { id: 'fixture_fanatic', name: 'Fixture Fanatic', icon: '🚿', category: 'Weekly Challenge', description: 'Won a fixture challenge.' },
  { id: 'valve_victor', name: 'Valve Victor', icon: '💧', category: 'Weekly Challenge', description: 'Won a valve challenge.' },
  { id: 'backflow_boss', name: 'Backflow Boss', icon: '♻️', category: 'Weekly Challenge', description: 'Won a backflow challenge.' },
  { id: 'hydronics_hero', name: 'Hydronics Hero', icon: '♨️', category: 'Weekly Challenge', description: 'Won a hydronics challenge.' },
  { id: 'gas_guru', name: 'Gas Guru', icon: '🔥', category: 'Weekly Challenge', description: 'Won a gas fitting challenge.' },
  { id: 'code_champ', name: 'Code Champion', icon: '📋', category: 'Weekly Challenge', description: 'Won a code compliance challenge.' },
  { id: 'fitting_ace', name: 'Fitting Ace', icon: '🔩', category: 'Weekly Challenge', description: 'Won a fitting challenge.' },
  { id: 'blueprint_boss', name: 'Blueprint Boss', icon: '📐', category: 'Weekly Challenge', description: 'Won a blueprint reading challenge.' },
  { id: 'holiday_hero', name: 'Holiday Hero', icon: '🎄', category: 'Weekly Challenge', description: 'Won a holiday challenge.' },
  { id: 'pressure_pro', name: 'Pressure Pro', icon: '📏', category: 'Weekly Challenge', description: 'Won a pressure testing challenge.' },
  { id: 'rough_in_king', name: 'Rough-In King', icon: '🏗️', category: 'Weekly Challenge', description: 'Won a rough-in challenge.' },
  { id: 'trim_out_ace', name: 'Trim-Out Ace', icon: '✨', category: 'Weekly Challenge', description: 'Won a trim-out challenge.' },
  { id: 'water_heater_wiz', name: 'Water Heater Wiz', icon: '🔥', category: 'Weekly Challenge', description: 'Won a water heater challenge.' },
  { id: 'pipe_threading_pro', name: 'Threading Pro', icon: '🔧', category: 'Weekly Challenge', description: 'Won a pipe threading challenge.' },
  { id: 'excavation_expert', name: 'Excavation Expert', icon: '⛏️', category: 'Weekly Challenge', description: 'Won an excavation challenge.' },
  { id: 'repair_ace', name: 'Repair Ace', icon: '🛠️', category: 'Weekly Challenge', description: 'Won a service repair challenge.' },
  { id: 'tankless_pro', name: 'Tankless Pro', icon: '🚿', category: 'Weekly Challenge', description: 'Won a tankless water heater challenge.' },
  { id: 'well_pump_wiz', name: 'Well Pump Wiz', icon: '💧', category: 'Weekly Challenge', description: 'Won a well pump challenge.' },
  { id: 'septic_specialist', name: 'Septic Specialist', icon: '🏠', category: 'Weekly Challenge', description: 'Won a septic challenge.' },
  { id: 'irrigation_ace', name: 'Irrigation Ace', icon: '🌿', category: 'Weekly Challenge', description: 'Won an irrigation challenge.' },
  { id: 'festive_plumber', name: 'Festive Plumber', icon: '🎉', category: 'Weekly Challenge', description: 'Won a festive challenge.' },
  { id: 'lead_free_pro', name: 'Lead-Free Pro', icon: '✅', category: 'Weekly Challenge', description: 'Won a lead-free compliance challenge.' },
  { id: 'pex_guru', name: 'PEX Guru', icon: '🔴', category: 'Weekly Challenge', description: 'Won a PEX challenge.' },
  { id: 'cast_iron_star', name: 'Cast Iron Star', icon: '⚙️', category: 'Weekly Challenge', description: 'Won a cast iron challenge.' },
  { id: 'trap_master', name: 'Trap Master', icon: '🔩', category: 'Weekly Challenge', description: 'Won a trap & vent challenge.' },
  // ...add more unique weekly challenge badges for a total of 52

  // --- MILESTONE BADGES (20) ---
  { id: 'job_novice', name: 'Job Novice', icon: '🔧', category: 'Milestone', description: 'Completed 10 jobs.' },
  { id: 'job_apprentice', name: 'Job Apprentice', icon: '🔧', category: 'Milestone', description: 'Completed 25 jobs.' },
  { id: 'job_pro', name: 'Job Pro', icon: '🔧', category: 'Milestone', description: 'Completed 50 jobs.' },
  { id: 'job_veteran', name: 'Job Veteran', icon: '🔧', category: 'Milestone', description: 'Completed 100 jobs.' },
  { id: 'job_hero', name: 'Job Hero', icon: '🔧', category: 'Milestone', description: 'Completed 200 jobs.' },
  { id: 'job_master', name: 'Job Master', icon: '🔧', category: 'Milestone', description: 'Completed 300 jobs.' },
  { id: 'job_legend', name: 'Job Legend', icon: '🔧', category: 'Milestone', description: 'Completed 400 jobs.' },
  { id: 'job_icon', name: 'Job Icon', icon: '🔧', category: 'Milestone', description: 'Completed 500 jobs.' },
  { id: 'job_champion', name: 'Job Champion', icon: '🔧', category: 'Milestone', description: 'Completed 750 jobs.' },
  { id: 'job_god', name: 'Job God', icon: '🔧', category: 'Milestone', description: 'Completed 1000 jobs.' },
  { id: 'pipebook_5', name: 'PipeBook Collector', icon: '📚', category: 'Milestone', description: 'Added 5 fits to your PipeBook.' },
  { id: 'pipebook_10', name: 'PipeBook Curator', icon: '📚', category: 'Milestone', description: 'Added 10 fits to your PipeBook.' },
  { id: 'pipebook_20', name: 'PipeBook Librarian', icon: '📚', category: 'Milestone', description: 'Added 20 fits to your PipeBook.' },
  { id: 'pipebook_40', name: 'PipeBook Archivist', icon: '📚', category: 'Milestone', description: 'Added 40 fits to your PipeBook.' },
  { id: 'pipebook_60', name: 'PipeBook Historian', icon: '📚', category: 'Milestone', description: 'Added 60 fits to your PipeBook.' },
  { id: 'pipebook_80', name: 'PipeBook Scholar', icon: '📚', category: 'Milestone', description: 'Added 80 fits to your PipeBook.' },
  { id: 'pipebook_100', name: 'PipeBook Sage', icon: '📚', category: 'Milestone', description: 'Added 100 fits to your PipeBook.' },
  { id: 'first_fit', name: 'First Completion', icon: '�', category: 'Milestone', description: 'Completed your first fit.' },
  { id: 'first_added', name: 'First Addition', icon: '📝', category: 'Milestone', description: 'Added your first fit.' },
  { id: 'first_challenge', name: 'First Challenge', icon: '🏆', category: 'Milestone', description: 'Completed your first challenge.' },

  // --- DIFFICULTY BADGES (10) ---
  { id: 'easy_first', name: 'Easy Starter', icon: '🔩', category: 'Difficulty', description: 'Completed your first basic job.' },
  { id: 'intermediate_first', name: 'Intermediate Initiate', icon: '🔩', category: 'Difficulty', description: 'Completed your first intermediate job.' },
  { id: 'hard_first', name: 'Advanced Specialist', icon: '🔥', category: 'Difficulty', description: 'Completed your first advanced job.' },
  { id: 'easy_10', name: 'Easy Veteran', icon: '🔩', category: 'Difficulty', description: 'Completed 10 basic jobs.' },
  { id: 'intermediate_10', name: 'Intermediate Veteran', icon: '🔩', category: 'Difficulty', description: 'Completed 10 intermediate jobs.' },
  { id: 'hard_10', name: 'Hardcore Veteran', icon: '🔥', category: 'Difficulty', description: 'Completed 10 advanced jobs.' },
  { id: 'easy_25', name: 'Easy Master', icon: '🔩', category: 'Difficulty', description: 'Completed 25 basic jobs.' },
  { id: 'intermediate_25', name: 'Intermediate Master', icon: '🔩', category: 'Difficulty', description: 'Completed 25 intermediate jobs.' },
  { id: 'hard_25', name: 'Hardcore Master', icon: '🔥', category: 'Difficulty', description: 'Completed 25 advanced jobs.' },
  { id: 'master_plumber', name: 'Master Plumber', icon: '🦾', category: 'Difficulty', description: 'Completed 50 advanced jobs.' },

  // --- THEME/SPECIALTY BADGES (50) ---
  // Residential, Commercial, Gas, Drain, Hydronics, Backflow, Service, Repair, Fixtures, Code
  // Each theme has 5 tiers: 1, 5, 10, 25, 50
  ...(() => {
    const themes = [
      { key: 'residential', name: 'Residential Pro', icon: '🏠' },
      { key: 'commercial', name: 'Commercial Pro', icon: '🏢' },
      { key: 'gas', name: 'Gas Fitter', icon: '🔥' },
      { key: 'drain', name: 'Drain Specialist', icon: '🚰' },
      { key: 'hydronics', name: 'Hydronics Tech', icon: '♨️' },
      { key: 'backflow', name: 'Backflow Expert', icon: '♻️' },
      { key: 'service', name: 'Service Plumber', icon: '🛠️' },
      { key: 'repair', name: 'Repair Pro', icon: '🔧' },
      { key: 'fixtures', name: 'Fixture Specialist', icon: '🚿' },
      { key: 'code', name: 'Code Compliance', icon: '📋' },
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
          description: `${tier.desc} ${theme.name.replace(/ .*/, '').toLowerCase()} jobs.`
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
  { id: 'fit_sharer_1', name: 'Fit Sharer', icon: '📤', category: 'Community', description: 'Shared your first fit.' },
  { id: 'fit_sharer_5', name: 'Fit Contributor', icon: '📤', category: 'Community', description: 'Shared 5 fits.' },
  { id: 'fit_sharer_10', name: 'Fit Publisher', icon: '📤', category: 'Community', description: 'Shared 10 fits.' },
  { id: 'fit_sharer_25', name: 'Fit Influencer', icon: '📤', category: 'Community', description: 'Shared 25 fits.' },
  { id: 'fit_sharer_50', name: 'Fit Mentor', icon: '📤', category: 'Community', description: 'Shared 50 fits.' },
  { id: 'commenter_1', name: 'First Comment', icon: '💬', category: 'Community', description: 'Commented on a fit.' },
  { id: 'commenter_10', name: 'Conversationalist', icon: '💬', category: 'Community', description: 'Commented on 10 fits.' },
  { id: 'commenter_25', name: 'Discussion Leader', icon: '💬', category: 'Community', description: 'Commented on 25 fits.' },
  { id: 'commenter_50', name: 'Community Voice', icon: '💬', category: 'Community', description: 'Commented on 50 fits.' },
  { id: 'liker_1', name: 'First Like', icon: '❤️', category: 'Community', description: 'Liked a fit.' },
  { id: 'liker_10', name: 'Fit Fan', icon: '❤️', category: 'Community', description: 'Liked 10 fits.' },
  { id: 'liker_25', name: 'Fit Enthusiast', icon: '❤️', category: 'Community', description: 'Liked 25 fits.' },
  { id: 'liker_50', name: 'Fit Supporter', icon: '❤️', category: 'Community', description: 'Liked 50 fits.' },
  { id: 'liker_100', name: 'Fit Champion', icon: '❤️', category: 'Community', description: 'Liked 100 fits.' },

  // --- SPECIAL / HIDDEN BADGES (10+) ---
  { id: 'birthday_plumber', name: 'Birthday Plumber', icon: '🎂', category: 'Special', description: 'Completed a job on your birthday.' },
  { id: 'all_challenges', name: 'Jack of All Challenges', icon: '🌟', category: 'Special', description: 'Completed every challenge type.' },
  { id: 'hidden_valve', name: 'Hidden Valve', icon: '🕵️‍♂️', category: 'Special', description: 'Discovered a hidden feature.' },
  { id: 'holiday_plumber', name: 'Holiday Plumber', icon: '🎁', category: 'Special', description: 'Completed a job on a holiday.' },
  { id: 'night_owl', name: 'Night Shift Pro', icon: '🦉', category: 'Special', description: 'Completed a job after midnight.' },
  { id: 'early_bird', name: 'Early Shift Pro', icon: '🐦', category: 'Special', description: 'Completed a job before 6am.' },
  { id: 'all_themes', name: 'Domain Master', icon: '🏆', category: 'Special', description: 'Completed at least one job from every specialty.' },
  { id: 'challenge_perfect', name: 'Perfect Challenger', icon: '💯', category: 'Special', description: 'Completed every weekly challenge in a month.' },
  { id: 'plumber_of_the_year', name: 'Plumber of the Year', icon: '🏅', category: 'Special', description: 'Earned the most badges in a year.' },
  { id: 'legendary_plumber', name: 'Legendary Plumber', icon: '🐉', category: 'Special', description: 'Unlocked all milestone badges.' },
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
