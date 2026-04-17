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
  // --- WEEKLY CHALLENGE BADGES (52) ---
  { id: 'framing_star', name: 'Framing Star', icon: '🪵', category: 'Weekly Challenge', description: 'Won a framing challenge.' },
  { id: 'concrete_guru', name: 'Concrete Guru', icon: '🧱', category: 'Weekly Challenge', description: 'Won a concrete challenge.' },
  { id: 'plumbing_master', name: 'Plumbing Master', icon: '🔧', category: 'Weekly Challenge', description: 'Won a plumbing challenge.' },
  { id: 'wiring_ninja', name: 'Wiring Ninja', icon: '🔌', category: 'Weekly Challenge', description: 'Won an electrical challenge.' },
  { id: 'blueprint_pro', name: 'Blueprint Pro', icon: '📐', category: 'Weekly Challenge', description: 'Won a blueprint challenge.' },
  { id: 'safety_savant', name: 'Safety Savant', icon: '�', category: 'Weekly Challenge', description: 'Won a safety challenge.' },
  { id: 'foundation_boss', name: 'Foundation Boss', icon: '🏗️', category: 'Weekly Challenge', description: 'Won a foundation challenge.' },
  { id: 'drywall_devotee', name: 'Drywall Devotee', icon: '�', category: 'Weekly Challenge', description: 'Won a drywall challenge.' },
  { id: 'roofing_specialist', name: 'Roofing Specialist', icon: '🏠', category: 'Weekly Challenge', description: 'Won a roofing challenge.' },
  { id: 'demolition_boss', name: 'Demolition Boss', icon: '💥', category: 'Weekly Challenge', description: 'Won a demolition challenge.' },
  { id: 'tile_victor', name: 'Tile Victor', icon: '🔲', category: 'Weekly Challenge', description: 'Won a tile challenge.' },
  { id: 'insulation_victor', name: 'Insulation Victor', icon: '�', category: 'Weekly Challenge', description: 'Won an insulation challenge.' },
  { id: 'holiday_hero', name: 'Holiday Hero', icon: '🎄', category: 'Weekly Challenge', description: 'Won a holiday challenge.' },
  { id: 'welding_supreme', name: 'Welding Supreme', icon: '🔥', category: 'Weekly Challenge', description: 'Won a welding challenge.' },
  { id: 'renovation_king', name: 'Renovation King', icon: '🏚️', category: 'Weekly Challenge', description: 'Won a renovation challenge.' },
  { id: 'survey_fanatic', name: 'Survey Fanatic', icon: '📏', category: 'Weekly Challenge', description: 'Won a surveying challenge.' },
  { id: 'excavation_pro', name: 'Excavation Pro', icon: '⛏️', category: 'Weekly Challenge', description: 'Won an excavation challenge.' },
  { id: 'masonry_boss', name: 'Masonry Boss', icon: '�', category: 'Weekly Challenge', description: 'Won a masonry challenge.' },
  { id: 'hardware_hero', name: 'Hardware Hero', icon: '🔩', category: 'Weekly Challenge', description: 'Won a hardware challenge.' },
  { id: 'scaffold_boss', name: 'Scaffold Boss', icon: '�', category: 'Weekly Challenge', description: 'Won a scaffolding challenge.' },
  { id: 'crane_star', name: 'Crane Star', icon: '�️', category: 'Weekly Challenge', description: 'Won a heavy equipment challenge.' },
  { id: 'toolbox_pro', name: 'Toolbox Pro', icon: '�', category: 'Weekly Challenge', description: 'Won a tool skills challenge.' },
  { id: 'code_compliant', name: 'Code Compliant', icon: '✅', category: 'Weekly Challenge', description: 'Won a building code challenge.' },
  { id: 'load_bearing', name: 'Load Bearer', icon: '🏋️', category: 'Weekly Challenge', description: 'Won a structural challenge.' },
  { id: 'festive_builder', name: 'Festive Champion', icon: '🎉', category: 'Weekly Challenge', description: 'Won a festive challenge.' },
  { id: 'green_builder', name: 'Green Builder', icon: '♻️', category: 'Weekly Challenge', description: 'Won a sustainable building challenge.' },
  { id: 'precision_guru', name: 'Precision Guru', icon: '�', category: 'Weekly Challenge', description: 'Won a precision challenge.' },
  { id: 'siding_star', name: 'Siding Star', icon: '�', category: 'Weekly Challenge', description: 'Won a siding challenge.' },
  { id: 'trim_master', name: 'Trim Master', icon: '✂️', category: 'Weekly Challenge', description: 'Won a trim challenge.' },
  // ...add 24 more unique weekly challenge badges for a total of 52

  // --- MILESTONE BADGES (20) ---
  { id: 'project_novice', name: 'Project Novice', icon: '🔨', category: 'Milestone', description: 'Completed 10 projects.' },
  { id: 'project_apprentice', name: 'Project Apprentice', icon: '🔨', category: 'Milestone', description: 'Completed 25 projects.' },
  { id: 'project_pro', name: 'Project Pro', icon: '�️', category: 'Milestone', description: 'Completed 50 projects.' },
  { id: 'project_veteran', name: 'Project Veteran', icon: '�️', category: 'Milestone', description: 'Completed 100 projects.' },
  { id: 'project_hero', name: 'Project Hero', icon: '🧱', category: 'Milestone', description: 'Completed 200 projects.' },
  { id: 'project_master', name: 'Project Master', icon: '🧱', category: 'Milestone', description: 'Completed 300 projects.' },
  { id: 'project_legend', name: 'Project Legend', icon: '�', category: 'Milestone', description: 'Completed 400 projects.' },
  { id: 'project_icon', name: 'Project Icon', icon: '�', category: 'Milestone', description: 'Completed 500 projects.' },
  { id: 'project_champion', name: 'Project Champion', icon: '�', category: 'Milestone', description: 'Completed 750 projects.' },
  { id: 'project_god', name: 'Project God', icon: '👑', category: 'Milestone', description: 'Completed 1000 projects.' },
  { id: 'cookbook_5', name: 'Project Collector', icon: '📚', category: 'Milestone', description: 'Added 5 projects to your playbook.' },
  { id: 'cookbook_10', name: 'Project Curator', icon: '📚', category: 'Milestone', description: 'Added 10 projects to your playbook.' },
  { id: 'cookbook_20', name: 'Project Librarian', icon: '📚', category: 'Milestone', description: 'Added 20 projects to your playbook.' },
  { id: 'cookbook_40', name: 'Project Archivist', icon: '📚', category: 'Milestone', description: 'Added 40 projects to your playbook.' },
  { id: 'cookbook_60', name: 'Project Historian', icon: '📚', category: 'Milestone', description: 'Added 60 projects to your playbook.' },
  { id: 'cookbook_80', name: 'Project Scholar', icon: '📚', category: 'Milestone', description: 'Added 80 projects to your playbook.' },
  { id: 'cookbook_100', name: 'Project Sage', icon: '📚', category: 'Milestone', description: 'Added 100 projects to your playbook.' },
  { id: 'first_project', name: 'First Completion', icon: '�', category: 'Milestone', description: 'Completed your first project.' },
  { id: 'first_added', name: 'First Addition', icon: '📝', category: 'Milestone', description: 'Added your first project.' },
  { id: 'first_challenge', name: 'First Challenge', icon: '🏆', category: 'Milestone', description: 'Completed your first challenge.' },

  // --- DIFFICULTY BADGES (10) ---
  { id: 'easy_first', name: 'Easy Starter', icon: '🔧', category: 'Difficulty', description: 'Completed your first basic project.' },
  { id: 'intermediate_first', name: 'Intermediate Initiate', icon: '🔧', category: 'Difficulty', description: 'Completed your first intermediate project.' },
  { id: 'hard_first', name: 'Advanced Specialist', icon: '🔥', category: 'Difficulty', description: 'Completed your first advanced project.' },
  { id: 'easy_10', name: 'Easy Veteran', icon: '🔧', category: 'Difficulty', description: 'Completed 10 basic projects.' },
  { id: 'intermediate_10', name: 'Intermediate Veteran', icon: '🔧', category: 'Difficulty', description: 'Completed 10 intermediate projects.' },
  { id: 'hard_10', name: 'Hardcore Veteran', icon: '🔥', category: 'Difficulty', description: 'Completed 10 advanced projects.' },
  { id: 'easy_25', name: 'Easy Master', icon: '🔧', category: 'Difficulty', description: 'Completed 25 basic projects.' },
  { id: 'intermediate_25', name: 'Intermediate Master', icon: '🔧', category: 'Difficulty', description: 'Completed 25 intermediate projects.' },
  { id: 'hard_25', name: 'Hardcore Master', icon: '🔥', category: 'Difficulty', description: 'Completed 25 advanced projects.' },
  { id: 'iron_builder', name: 'Master Technician', icon: '🦾', category: 'Difficulty', description: 'Completed 50 advanced projects.' },

  // --- THEME/TRADE BADGES (50) ---
  // Framing, Concrete, Electrical, Plumbing, Roofing, Drywall, Masonry, Excavation, Welding, Finishing
  // Each theme has 5 tiers: 1, 5, 10, 25, 50
  ...(() => {
    const themes = [
      { key: 'framing', name: 'Framing Pro', icon: '�' },
      { key: 'concrete', name: 'Concrete Commander', icon: '�' },
      { key: 'electrical', name: 'Electrical Expert', icon: '🔌' },
      { key: 'plumbing', name: 'Plumbing Pro', icon: '🔧' },
      { key: 'roofing', name: 'Roofing Ranger', icon: '🏠' },
      { key: 'drywall', name: 'Drywall Pro', icon: '�' },
      { key: 'masonry', name: 'Masonry Maven', icon: '�' },
      { key: 'excavation', name: 'Excavation Expert', icon: '⛏️' },
      { key: 'welding', name: 'Welding Warrior', icon: '🔥' },
      { key: 'finishing', name: 'Finish Specialist', icon: '✨' },
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
  { id: 'recipe_sharer_1', name: 'Project Sharer', icon: '📤', category: 'Community', description: 'Shared your first project.' },
  { id: 'recipe_sharer_5', name: 'Project Contributor', icon: '📤', category: 'Community', description: 'Shared 5 projects.' },
  { id: 'recipe_sharer_10', name: 'Project Publisher', icon: '📤', category: 'Community', description: 'Shared 10 projects.' },
  { id: 'recipe_sharer_25', name: 'Project Influencer', icon: '📤', category: 'Community', description: 'Shared 25 projects.' },
  { id: 'recipe_sharer_50', name: 'Project Mentor', icon: '📤', category: 'Community', description: 'Shared 50 projects.' },
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
  { id: 'birthday_builder', name: 'Birthday Builder', icon: '🎂', category: 'Special', description: 'Completed a project on your birthday.' },
  { id: 'all_challenges', name: 'Jack of All Challenges', icon: '🌟', category: 'Special', description: 'Completed every challenge type.' },
  { id: 'secret_sauce', name: 'Secret Sauce', icon: '🕵️‍♂️', category: 'Special', description: 'Discovered a hidden feature.' },
  { id: 'holiday_builder', name: 'Holiday Builder', icon: '🎁', category: 'Special', description: 'Completed a project on a holiday.' },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', category: 'Special', description: 'Completed a project after midnight.' },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦', category: 'Special', description: 'Completed a project before 6am.' },
  { id: 'all_themes', name: 'Domain Master', icon: '🏆', category: 'Special', description: 'Completed at least one project from every theme.' },
  { id: 'challenge_perfect', name: 'Perfect Challenger', icon: '💯', category: 'Special', description: 'Completed every weekly challenge in a month.' },
  { id: 'builder_of_the_year', name: 'Builder of the Year', icon: '🏅', category: 'Special', description: 'Earned the most badges in a year.' },
  { id: 'legendary_builder', name: 'Legendary Builder', icon: '🐉', category: 'Special', description: 'Unlocked all milestone badges.' },
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
