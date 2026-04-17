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
  { id: 'wiring_star', name: 'Wiring Star', icon: '🔌', category: 'Weekly Challenge', description: 'Won a wiring challenge.' },
  { id: 'conduit_guru', name: 'Conduit Guru', icon: '🛠️', category: 'Weekly Challenge', description: 'Won a conduit challenge.' },
  { id: 'panel_master', name: 'Panel Master', icon: '⚡', category: 'Weekly Challenge', description: 'Won a panel challenge.' },
  { id: 'circuit_ninja', name: 'Circuit Ninja', icon: '💡', category: 'Weekly Challenge', description: 'Won a circuit challenge.' },
  { id: 'code_pro', name: 'Code Pro', icon: '📐', category: 'Weekly Challenge', description: 'Won an NEC code challenge.' },
  { id: 'safety_savant', name: 'Safety Savant', icon: '�', category: 'Weekly Challenge', description: 'Won a safety challenge.' },
  { id: 'voltage_boss', name: 'Voltage Boss', icon: '🔋', category: 'Weekly Challenge', description: 'Won a voltage challenge.' },
  { id: 'motor_devotee', name: 'Motor Devotee', icon: '⚙️', category: 'Weekly Challenge', description: 'Won a motor control challenge.' },
  { id: 'grounding_specialist', name: 'Grounding Specialist', icon: '🟢', category: 'Weekly Challenge', description: 'Won a grounding challenge.' },
  { id: 'troubleshoot_boss', name: 'Troubleshoot Boss', icon: '🔍', category: 'Weekly Challenge', description: 'Won a troubleshooting challenge.' },
  { id: 'transformer_victor', name: 'Transformer Victor', icon: '🔄', category: 'Weekly Challenge', description: 'Won a transformer challenge.' },
  { id: 'lighting_victor', name: 'Lighting Victor', icon: '💡', category: 'Weekly Challenge', description: 'Won a lighting challenge.' },
  { id: 'holiday_hero', name: 'Holiday Hero', icon: '🎄', category: 'Weekly Challenge', description: 'Won a holiday challenge.' },
  { id: 'arc_flash_supreme', name: 'Arc Flash Supreme', icon: '🔥', category: 'Weekly Challenge', description: 'Won an arc flash safety challenge.' },
  { id: 'renovation_king', name: 'Renovation King', icon: '🏠', category: 'Weekly Challenge', description: 'Won a renovation challenge.' },
  { id: 'blueprint_fanatic', name: 'Blueprint Fanatic', icon: '📏', category: 'Weekly Challenge', description: 'Won a blueprint reading challenge.' },
  { id: 'raceway_pro', name: 'Raceway Pro', icon: '🚧', category: 'Weekly Challenge', description: 'Won a raceway challenge.' },
  { id: 'junction_boss', name: 'Junction Boss', icon: '📦', category: 'Weekly Challenge', description: 'Won a junction box challenge.' },
  { id: 'load_calc_hero', name: 'Load Calc Hero', icon: '🧮', category: 'Weekly Challenge', description: 'Won a load calculation challenge.' },
  { id: 'splice_boss', name: 'Splice Boss', icon: '�', category: 'Weekly Challenge', description: 'Won a splice & termination challenge.' },
  { id: 'meter_star', name: 'Meter Star', icon: '📊', category: 'Weekly Challenge', description: 'Won a metering challenge.' },
  { id: 'toolbox_pro', name: 'Toolbox Pro', icon: '�', category: 'Weekly Challenge', description: 'Won a tool skills challenge.' },
  { id: 'code_compliant', name: 'Code Compliant', icon: '✅', category: 'Weekly Challenge', description: 'Won an inspection challenge.' },
  { id: 'ohms_law', name: 'Ohm\'s Law', icon: 'Ω', category: 'Weekly Challenge', description: 'Won an electrical theory challenge.' },
  { id: 'festive_sparky', name: 'Festive Champion', icon: '🎉', category: 'Weekly Challenge', description: 'Won a festive challenge.' },
  { id: 'green_energy', name: 'Green Energy', icon: '♻️', category: 'Weekly Challenge', description: 'Won a renewable energy challenge.' },
  { id: 'precision_guru', name: 'Precision Guru', icon: '�', category: 'Weekly Challenge', description: 'Won a precision challenge.' },
  { id: 'fire_alarm_star', name: 'Fire Alarm Star', icon: '🚨', category: 'Weekly Challenge', description: 'Won a fire alarm challenge.' },
  { id: 'low_voltage_master', name: 'Low Voltage Master', icon: '📶', category: 'Weekly Challenge', description: 'Won a low voltage challenge.' },
  // ...add 24 more unique weekly challenge badges for a total of 52

  // --- MILESTONE BADGES (20) ---
  { id: 'circuit_novice', name: 'Circuit Novice', icon: '⚡', category: 'Milestone', description: 'Completed 10 circuits.' },
  { id: 'circuit_apprentice', name: 'Circuit Apprentice', icon: '⚡', category: 'Milestone', description: 'Completed 25 circuits.' },
  { id: 'circuit_pro', name: 'Circuit Pro', icon: '🔌', category: 'Milestone', description: 'Completed 50 circuits.' },
  { id: 'circuit_veteran', name: 'Circuit Veteran', icon: '🔌', category: 'Milestone', description: 'Completed 100 circuits.' },
  { id: 'circuit_hero', name: 'Circuit Hero', icon: '💡', category: 'Milestone', description: 'Completed 200 circuits.' },
  { id: 'circuit_master', name: 'Circuit Master', icon: '💡', category: 'Milestone', description: 'Completed 300 circuits.' },
  { id: 'circuit_legend', name: 'Circuit Legend', icon: '�', category: 'Milestone', description: 'Completed 400 circuits.' },
  { id: 'circuit_icon', name: 'Circuit Icon', icon: '�', category: 'Milestone', description: 'Completed 500 circuits.' },
  { id: 'circuit_champion', name: 'Circuit Champion', icon: '�', category: 'Milestone', description: 'Completed 750 circuits.' },
  { id: 'circuit_god', name: 'Circuit God', icon: '👑', category: 'Milestone', description: 'Completed 1000 circuits.' },
  { id: 'cookbook_5', name: 'Project Collector', icon: '📚', category: 'Milestone', description: 'Added 5 projects to your playbook.' },
  { id: 'cookbook_10', name: 'Project Curator', icon: '📚', category: 'Milestone', description: 'Added 10 projects to your playbook.' },
  { id: 'cookbook_20', name: 'Project Librarian', icon: '📚', category: 'Milestone', description: 'Added 20 projects to your playbook.' },
  { id: 'cookbook_40', name: 'Project Archivist', icon: '📚', category: 'Milestone', description: 'Added 40 projects to your playbook.' },
  { id: 'cookbook_60', name: 'Project Historian', icon: '📚', category: 'Milestone', description: 'Added 60 projects to your playbook.' },
  { id: 'cookbook_80', name: 'Project Scholar', icon: '📚', category: 'Milestone', description: 'Added 80 projects to your playbook.' },
  { id: 'cookbook_100', name: 'Project Sage', icon: '📚', category: 'Milestone', description: 'Added 100 projects to your playbook.' },
  { id: 'first_circuit', name: 'First Completion', icon: '⚡', category: 'Milestone', description: 'Completed your first circuit.' },
  { id: 'first_added', name: 'First Addition', icon: '📝', category: 'Milestone', description: 'Added your first project.' },
  { id: 'first_challenge', name: 'First Challenge', icon: '🏆', category: 'Milestone', description: 'Completed your first challenge.' },

  // --- DIFFICULTY BADGES (10) ---
  { id: 'easy_first', name: 'Easy Starter', icon: '🔌', category: 'Difficulty', description: 'Completed your first basic circuit.' },
  { id: 'intermediate_first', name: 'Intermediate Initiate', icon: '🔌', category: 'Difficulty', description: 'Completed your first intermediate circuit.' },
  { id: 'hard_first', name: 'Advanced Specialist', icon: '🔥', category: 'Difficulty', description: 'Completed your first advanced circuit.' },
  { id: 'easy_10', name: 'Easy Veteran', icon: '🔌', category: 'Difficulty', description: 'Completed 10 basic circuits.' },
  { id: 'intermediate_10', name: 'Intermediate Veteran', icon: '🔌', category: 'Difficulty', description: 'Completed 10 intermediate circuits.' },
  { id: 'hard_10', name: 'Hardcore Veteran', icon: '🔥', category: 'Difficulty', description: 'Completed 10 advanced circuits.' },
  { id: 'easy_25', name: 'Easy Master', icon: '🔌', category: 'Difficulty', description: 'Completed 25 basic circuits.' },
  { id: 'intermediate_25', name: 'Intermediate Master', icon: '🔌', category: 'Difficulty', description: 'Completed 25 intermediate circuits.' },
  { id: 'hard_25', name: 'Hardcore Master', icon: '🔥', category: 'Difficulty', description: 'Completed 25 advanced circuits.' },
  { id: 'iron_electrician', name: 'Master Technician', icon: '🦾', category: 'Difficulty', description: 'Completed 50 advanced circuits.' },

  // --- THEME/TRADE BADGES (50) ---
  // Residential, Commercial, Industrial, Low Voltage, Motor Controls, PLC, Lighting, Fire Alarm, Solar, Code
  // Each theme has 5 tiers: 1, 5, 10, 25, 50
  ...(() => {
    const themes = [
      { key: 'residential', name: 'Residential Pro', icon: '🏠' },
      { key: 'commercial', name: 'Commercial Commander', icon: '🏢' },
      { key: 'industrial', name: 'Industrial Expert', icon: '🏭' },
      { key: 'low_voltage', name: 'Low Voltage Pro', icon: '📶' },
      { key: 'motor_controls', name: 'Motor Controls Maven', icon: '⚙️' },
      { key: 'plc', name: 'PLC Programmer', icon: '�' },
      { key: 'lighting', name: 'Lighting Specialist', icon: '💡' },
      { key: 'fire_alarm', name: 'Fire Alarm Expert', icon: '🚨' },
      { key: 'solar', name: 'Solar Specialist', icon: '☀️' },
      { key: 'code', name: 'Code Expert', icon: '📐' },
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
  { id: 'birthday_sparky', name: 'Birthday Sparky', icon: '🎂', category: 'Special', description: 'Completed a circuit on your birthday.' },
  { id: 'all_challenges', name: 'Jack of All Challenges', icon: '🌟', category: 'Special', description: 'Completed every challenge type.' },
  { id: 'secret_sauce', name: 'Secret Sauce', icon: '🕵️‍♂️', category: 'Special', description: 'Discovered a hidden feature.' },
  { id: 'holiday_sparky', name: 'Holiday Sparky', icon: '🎁', category: 'Special', description: 'Completed a circuit on a holiday.' },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', category: 'Special', description: 'Completed a project after midnight.' },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦', category: 'Special', description: 'Completed a project before 6am.' },
  { id: 'all_themes', name: 'Domain Master', icon: '🏆', category: 'Special', description: 'Completed at least one project from every theme.' },
  { id: 'challenge_perfect', name: 'Perfect Challenger', icon: '💯', category: 'Special', description: 'Completed every weekly challenge in a month.' },
  { id: 'electrician_of_the_year', name: 'Electrician of the Year', icon: '🏅', category: 'Special', description: 'Earned the most badges in a year.' },
  { id: 'legendary_electrician', name: 'Legendary Electrician', icon: '🐉', category: 'Special', description: 'Unlocked all milestone badges.' },
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
