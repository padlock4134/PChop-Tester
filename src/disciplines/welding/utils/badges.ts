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
  // --- WEEKLY CHALLENGE BADGES (28+) ---
  { id: 'bead_master', name: 'Bead Master', icon: '🔥', category: 'Weekly Challenge', description: 'Won a bead quality challenge.' },
  { id: 'arc_starter', name: 'Arc Starter', icon: '⚡', category: 'Weekly Challenge', description: 'Won an arc striking challenge.' },
  { id: 'fillet_king', name: 'Fillet King', icon: '🔩', category: 'Weekly Challenge', description: 'Won a fillet weld challenge.' },
  { id: 'groove_guru', name: 'Groove Guru', icon: '⚙️', category: 'Weekly Challenge', description: 'Won a groove weld challenge.' },
  { id: 'pipe_pro', name: 'Pipe Pro', icon: '�️', category: 'Weekly Challenge', description: 'Won a pipe welding challenge.' },
  { id: 'vertical_victor', name: 'Vertical Victor', icon: '📐', category: 'Weekly Challenge', description: 'Won a vertical weld challenge.' },
  { id: 'overhead_ace', name: 'Overhead Ace', icon: '🛡️', category: 'Weekly Challenge', description: 'Won an overhead weld challenge.' },
  { id: 'tack_titan', name: 'Tack Titan', icon: '🔧', category: 'Weekly Challenge', description: 'Won a tacking challenge.' },
  { id: 'fitup_fanatic', name: 'Fit-Up Fanatic', icon: '📏', category: 'Weekly Challenge', description: 'Won a fit-up challenge.' },
  { id: 'blueprint_boss', name: 'Blueprint Boss', icon: '📋', category: 'Weekly Challenge', description: 'Won a blueprint reading challenge.' },
  { id: 'safety_star', name: 'Safety Star', icon: '�', category: 'Weekly Challenge', description: 'Won a safety compliance challenge.' },
  { id: 'stainless_specialist', name: 'Stainless Specialist', icon: '✨', category: 'Weekly Challenge', description: 'Won a stainless steel challenge.' },
  { id: 'aluminum_ace', name: 'Aluminum Ace', icon: '🪶', category: 'Weekly Challenge', description: 'Won an aluminum challenge.' },
  { id: 'holiday_hero', name: 'Holiday Hero', icon: '�', category: 'Weekly Challenge', description: 'Won a holiday challenge.' },
  { id: 'heat_control', name: 'Heat Controller', icon: '🌡️', category: 'Weekly Challenge', description: 'Won a heat control challenge.' },
  { id: 'multi_pass', name: 'Multi-Pass Master', icon: '🔄', category: 'Weekly Challenge', description: 'Won a multi-pass weld challenge.' },
  { id: 'torch_tech', name: 'Torch Technician', icon: '🔦', category: 'Weekly Challenge', description: 'Won a torch cutting challenge.' },
  { id: 'root_pass_pro', name: 'Root Pass Pro', icon: '🎯', category: 'Weekly Challenge', description: 'Won a root pass challenge.' },
  { id: 'cap_champion', name: 'Cap Champion', icon: '👑', category: 'Weekly Challenge', description: 'Won a cap pass challenge.' },
  { id: 'repair_ranger', name: 'Repair Ranger', icon: '🔨', category: 'Weekly Challenge', description: 'Won a repair welding challenge.' },
  { id: 'distortion_dominator', name: 'Distortion Dominator', icon: '📐', category: 'Weekly Challenge', description: 'Won a distortion control challenge.' },
  { id: 'inspection_ace', name: 'Inspection Ace', icon: '🔍', category: 'Weekly Challenge', description: 'Won a weld inspection challenge.' },
  { id: 'fabrication_fanatic', name: 'Fabrication Fanatic', icon: '🏭', category: 'Weekly Challenge', description: 'Won a fabrication challenge.' },
  { id: 'coupon_crusher', name: 'Coupon Crusher', icon: '💪', category: 'Weekly Challenge', description: 'Won a test coupon challenge.' },
  { id: 'festive_welder', name: 'Festive Welder', icon: '🎉', category: 'Weekly Challenge', description: 'Won a festive challenge.' },
  { id: 'thin_gauge_pro', name: 'Thin Gauge Pro', icon: '�', category: 'Weekly Challenge', description: 'Won a thin material challenge.' },
  { id: 'heavy_plate_hero', name: 'Heavy Plate Hero', icon: '�️', category: 'Weekly Challenge', description: 'Won a heavy plate challenge.' },
  { id: 'position_master', name: 'Position Master', icon: '�', category: 'Weekly Challenge', description: 'Won an all-position challenge.' },

  // --- MILESTONE BADGES (20) ---
  { id: 'weld_novice', name: 'Weld Novice', icon: '🔥', category: 'Milestone', description: 'Completed 10 welds.' },
  { id: 'weld_apprentice', name: 'Weld Apprentice', icon: '🔥', category: 'Milestone', description: 'Completed 25 welds.' },
  { id: 'weld_pro', name: 'Weld Pro', icon: '⚙️', category: 'Milestone', description: 'Completed 50 welds.' },
  { id: 'weld_veteran', name: 'Weld Veteran', icon: '⚙️', category: 'Milestone', description: 'Completed 100 welds.' },
  { id: 'weld_hero', name: 'Weld Hero', icon: '🛡️', category: 'Milestone', description: 'Completed 200 welds.' },
  { id: 'weld_master', name: 'Weld Master', icon: '🛡️', category: 'Milestone', description: 'Completed 300 welds.' },
  { id: 'weld_legend', name: 'Weld Legend', icon: '�️', category: 'Milestone', description: 'Completed 400 welds.' },
  { id: 'weld_icon', name: 'Weld Icon', icon: '�️', category: 'Milestone', description: 'Completed 500 welds.' },
  { id: 'weld_champion', name: 'Weld Champion', icon: '🦾', category: 'Milestone', description: 'Completed 750 welds.' },
  { id: 'weld_god', name: 'Weld God', icon: '🦾', category: 'Milestone', description: 'Completed 1000 welds.' },
  { id: 'specbook_5', name: 'Spec Collector', icon: '�', category: 'Milestone', description: 'Added 5 projects to your spec book.' },
  { id: 'specbook_10', name: 'Spec Curator', icon: '�', category: 'Milestone', description: 'Added 10 projects to your spec book.' },
  { id: 'specbook_20', name: 'Spec Librarian', icon: '�', category: 'Milestone', description: 'Added 20 projects to your spec book.' },
  { id: 'specbook_40', name: 'Spec Archivist', icon: '�', category: 'Milestone', description: 'Added 40 projects to your spec book.' },
  { id: 'specbook_60', name: 'Spec Historian', icon: '�', category: 'Milestone', description: 'Added 60 projects to your spec book.' },
  { id: 'specbook_80', name: 'Spec Scholar', icon: '�', category: 'Milestone', description: 'Added 80 projects to your spec book.' },
  { id: 'specbook_100', name: 'Spec Sage', icon: '�', category: 'Milestone', description: 'Added 100 projects to your spec book.' },
  { id: 'first_weld', name: 'First Weld', icon: '�', category: 'Milestone', description: 'Completed your first weld.' },
  { id: 'first_added', name: 'First Addition', icon: '📝', category: 'Milestone', description: 'Added your first project.' },
  { id: 'first_challenge', name: 'First Challenge', icon: '🏆', category: 'Milestone', description: 'Completed your first challenge.' },

  // --- DIFFICULTY BADGES (10) ---
  { id: 'easy_first', name: 'Easy Starter', icon: '⚡', category: 'Difficulty', description: 'Completed your first basic project.' },
  { id: 'intermediate_first', name: 'Intermediate Initiate', icon: '⚙️', category: 'Difficulty', description: 'Completed your first intermediate project.' },
  { id: 'hard_first', name: 'Advanced Specialist', icon: '🔥', category: 'Difficulty', description: 'Completed your first advanced project.' },
  { id: 'easy_10', name: 'Easy Veteran', icon: '⚡', category: 'Difficulty', description: 'Completed 10 basic projects.' },
  { id: 'intermediate_10', name: 'Intermediate Veteran', icon: '⚙️', category: 'Difficulty', description: 'Completed 10 intermediate projects.' },
  { id: 'hard_10', name: 'Hardcore Veteran', icon: '🔥', category: 'Difficulty', description: 'Completed 10 advanced projects.' },
  { id: 'easy_25', name: 'Easy Master', icon: '⚡', category: 'Difficulty', description: 'Completed 25 basic projects.' },
  { id: 'intermediate_25', name: 'Intermediate Master', icon: '⚙️', category: 'Difficulty', description: 'Completed 25 intermediate projects.' },
  { id: 'hard_25', name: 'Hardcore Master', icon: '🔥', category: 'Difficulty', description: 'Completed 25 advanced projects.' },
  { id: 'iron_welder', name: 'Master Technician', icon: '🦾', category: 'Difficulty', description: 'Completed 50 advanced projects.' },

  // --- THEME/PROCESS BADGES (50) ---
  // SMAW, GMAW, GTAW, FCAW, Pipe, Structural, Aluminum, Stainless, Repair, Fabrication
  // Each theme has 5 tiers: 1, 5, 10, 25, 50
  ...(() => {
    const themes = [
      { key: 'smaw', name: 'Stick Welder', icon: '🔥' },
      { key: 'gmaw', name: 'MIG Specialist', icon: '⚙️' },
      { key: 'gtaw', name: 'TIG Artist', icon: '✨' },
      { key: 'fcaw', name: 'Flux Core Pro', icon: '🔩' },
      { key: 'pipe', name: 'Pipe Welder', icon: '🏗️' },
      { key: 'structural', name: 'Structural Pro', icon: '�' },
      { key: 'aluminum', name: 'Aluminum Specialist', icon: '�' },
      { key: 'stainless', name: 'Stainless Expert', icon: '🛡️' },
      { key: 'repair', name: 'Repair Specialist', icon: '🔧' },
      { key: 'fabrication', name: 'Fabricator', icon: '�' },
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
          description: `${tier.desc} ${theme.name.replace(/ .*/, '').toLowerCase()} projects.`
        });
      }
    }
    return out;
  })(),

  // --- STREAK BADGES (10) ---
  { id: 'streak_3', name: '3-Day Streak', icon: '🔥', category: 'Streak', description: 'Welded 3 days in a row.' },
  { id: 'streak_7', name: 'One-Week Streak', icon: '🔥', category: 'Streak', description: 'Welded 7 days in a row.' },
  { id: 'streak_14', name: 'Two-Week Streak', icon: '🔥', category: 'Streak', description: 'Welded 14 days in a row.' },
  { id: 'streak_30', name: 'One-Month Streak', icon: '🔥', category: 'Streak', description: 'Welded 30 days in a row.' },
  { id: 'streak_60', name: 'Two-Month Streak', icon: '🔥', category: 'Streak', description: 'Welded 60 days in a row.' },
  { id: 'streak_90', name: 'Three-Month Streak', icon: '🔥', category: 'Streak', description: 'Welded 90 days in a row.' },
  { id: 'challenge_streak_3', name: 'Challenge Streak 3', icon: '🏅', category: 'Streak', description: 'Completed 3 weekly challenges in a row.' },
  { id: 'challenge_streak_5', name: 'Challenge Streak 5', icon: '🏅', category: 'Streak', description: 'Completed 5 weekly challenges in a row.' },
  { id: 'challenge_streak_10', name: 'Challenge Streak 10', icon: '🏅', category: 'Streak', description: 'Completed 10 weekly challenges in a row.' },
  { id: 'challenge_streak_20', name: 'Challenge Streak 20', icon: '🏅', category: 'Streak', description: 'Completed 20 weekly challenges in a row.' },

  // --- COMMUNITY BADGES (14) ---
  { id: 'project_sharer_1', name: 'Project Sharer', icon: '📤', category: 'Community', description: 'Shared your first project.' },
  { id: 'project_sharer_5', name: 'Project Contributor', icon: '📤', category: 'Community', description: 'Shared 5 projects.' },
  { id: 'project_sharer_10', name: 'Project Publisher', icon: '📤', category: 'Community', description: 'Shared 10 projects.' },
  { id: 'project_sharer_25', name: 'Project Influencer', icon: '📤', category: 'Community', description: 'Shared 25 projects.' },
  { id: 'project_sharer_50', name: 'Project Mentor', icon: '📤', category: 'Community', description: 'Shared 50 projects.' },
  { id: 'commenter_1', name: 'First Comment', icon: '💬', category: 'Community', description: 'Commented on a project.' },
  { id: 'commenter_10', name: 'Conversationalist', icon: '💬', category: 'Community', description: 'Commented on 10 projects.' },
  { id: 'commenter_25', name: 'Discussion Leader', icon: '💬', category: 'Community', description: 'Commented on 25 projects.' },
  { id: 'commenter_50', name: 'Community Voice', icon: '💬', category: 'Community', description: 'Commented on 50 projects.' },
  { id: 'liker_1', name: 'First Like', icon: '❤️', category: 'Community', description: 'Liked a project.' },
  { id: 'liker_10', name: 'Project Fan', icon: '❤️', category: 'Community', description: 'Liked 10 projects.' },
  { id: 'liker_25', name: 'Project Enthusiast', icon: '❤️', category: 'Community', description: 'Liked 25 projects.' },
  { id: 'liker_50', name: 'Project Specialist', icon: '❤️', category: 'Community', description: 'Liked 50 projects.' },
  { id: 'liker_100', name: 'Project Champion', icon: '❤️', category: 'Community', description: 'Liked 100 projects.' },

  // --- SPECIAL / HIDDEN BADGES (10+) ---
  { id: 'birthday_welder', name: 'Birthday Welder', icon: '🎂', category: 'Special', description: 'Completed a weld on your birthday.' },
  { id: 'all_challenges', name: 'Jack of All Challenges', icon: '🌟', category: 'Special', description: 'Completed every challenge type.' },
  { id: 'hidden_bead', name: 'Hidden Bead', icon: '🕵️‍♂️', category: 'Special', description: 'Discovered a hidden feature.' },
  { id: 'holiday_welder', name: 'Holiday Welder', icon: '🎁', category: 'Special', description: 'Completed a weld on a holiday.' },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', category: 'Special', description: 'Completed a weld after midnight.' },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦', category: 'Special', description: 'Completed a weld before 6am.' },
  { id: 'all_themes', name: 'Process Master', icon: '🏆', category: 'Special', description: 'Completed at least one project from every welding process.' },
  { id: 'challenge_perfect', name: 'Perfect Challenger', icon: '💯', category: 'Special', description: 'Completed every weekly challenge in a month.' },
  { id: 'welder_of_the_year', name: 'Welder of the Year', icon: '🏅', category: 'Special', description: 'Earned the most badges in a year.' },
  { id: 'legendary_welder', name: 'Legendary Welder', icon: '🐉', category: 'Special', description: 'Unlocked all milestone badges.' },
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
