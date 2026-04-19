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
  { id: 'airflow_ace', name: 'Airflow Ace', icon: '�️', category: 'Weekly Challenge', description: 'Won an airflow diagnostics challenge.' },
  { id: 'refrigerant_pro', name: 'Refrigerant Pro', icon: '❄️', category: 'Weekly Challenge', description: 'Won a refrigerant handling challenge.' },
  { id: 'duct_detective', name: 'Duct Detective', icon: '🔍', category: 'Weekly Challenge', description: 'Won a duct leakage challenge.' },
  { id: 'thermostat_tuner', name: 'Thermostat Tuner', icon: '�️', category: 'Weekly Challenge', description: 'Won a controls/thermostat challenge.' },
  { id: 'compressor_champ', name: 'Compressor Champ', icon: '⚙️', category: 'Weekly Challenge', description: 'Won a compressor diagnostics challenge.' },
  { id: 'heat_specialist', name: 'Heat Specialist', icon: '🔥', category: 'Weekly Challenge', description: 'Won a heating systems challenge.' },
  { id: 'filter_focus', name: 'Filter Focus', icon: '�', category: 'Weekly Challenge', description: 'Won a filtration/maintenance challenge.' },
  { id: 'load_planner', name: 'Load Planner', icon: '📐', category: 'Weekly Challenge', description: 'Won a load calculation challenge.' },
  { id: 'ventilation_verified', name: 'Ventilation Verified', icon: '💨', category: 'Weekly Challenge', description: 'Won a ventilation challenge.' },
  { id: 'commissioning_star', name: 'Commissioning Star', icon: '✅', category: 'Weekly Challenge', description: 'Won a startup/commissioning challenge.' },
  { id: 'brazing_boss', name: 'Brazing Boss', icon: '🔧', category: 'Weekly Challenge', description: 'Won a brazing/soldering challenge.' },
  { id: 'epa_expert', name: 'EPA Expert', icon: '📋', category: 'Weekly Challenge', description: 'Won an EPA compliance challenge.' },
  { id: 'superheat_star', name: 'Superheat Star', icon: '�️', category: 'Weekly Challenge', description: 'Won a superheat/subcooling challenge.' },
  { id: 'wiring_wizard', name: 'Wiring Wizard', icon: '⚡', category: 'Weekly Challenge', description: 'Won an electrical wiring challenge.' },
  { id: 'safety_sentinel', name: 'Safety Sentinel', icon: '�', category: 'Weekly Challenge', description: 'Won a safety procedures challenge.' },
  { id: 'gauge_guru', name: 'Gauge Guru', icon: '🔬', category: 'Weekly Challenge', description: 'Won a manifold gauge challenge.' },
  { id: 'recovery_ranger', name: 'Recovery Ranger', icon: '♻️', category: 'Weekly Challenge', description: 'Won a refrigerant recovery challenge.' },
  { id: 'condensate_captain', name: 'Condensate Captain', icon: '💧', category: 'Weekly Challenge', description: 'Won a condensate/drainage challenge.' },
  { id: 'static_specialist', name: 'Static Specialist', icon: '📊', category: 'Weekly Challenge', description: 'Won a static pressure challenge.' },
  { id: 'insulation_ace', name: 'Insulation Ace', icon: '�', category: 'Weekly Challenge', description: 'Won an insulation challenge.' },
  { id: 'motor_master', name: 'Motor Master', icon: '🔄', category: 'Weekly Challenge', description: 'Won a motor/blower challenge.' },
  { id: 'leak_locator', name: 'Leak Locator', icon: '🔎', category: 'Weekly Challenge', description: 'Won a leak detection challenge.' },
  { id: 'defrost_defender', name: 'Defrost Defender', icon: '�', category: 'Weekly Challenge', description: 'Won a defrost cycle challenge.' },
  { id: 'zoning_zen', name: 'Zoning Zen', icon: '🗺️', category: 'Weekly Challenge', description: 'Won a zoning/damper challenge.' },
  { id: 'festive_tech', name: 'Festive Champion', icon: '🎉', category: 'Weekly Challenge', description: 'Won a festive challenge.' },
  { id: 'hydronic_hero', name: 'Hydronic Hero', icon: '🚿', category: 'Weekly Challenge', description: 'Won a hydronic systems challenge.' },
  { id: 'capacity_king', name: 'Capacity King', icon: '📏', category: 'Weekly Challenge', description: 'Won a capacity/sizing challenge.' },
  { id: 'economizer_expert', name: 'Economizer Expert', icon: '�', category: 'Weekly Challenge', description: 'Won an economizer challenge.' },
  { id: 'flue_finder', name: 'Flue Finder', icon: '🏭', category: 'Weekly Challenge', description: 'Won a venting/flue challenge.' },

  // --- MILESTONE BADGES (20) ---
  { id: 'project_novice', name: 'Project Novice', icon: '🔧', category: 'Milestone', description: 'Completed 10 projects.' },
  { id: 'project_apprentice', name: 'Project Apprentice', icon: '🔧', category: 'Milestone', description: 'Completed 25 projects.' },
  { id: 'project_pro', name: 'Project Pro', icon: '🛠️', category: 'Milestone', description: 'Completed 50 projects.' },
  { id: 'project_veteran', name: 'Project Veteran', icon: '🛠️', category: 'Milestone', description: 'Completed 100 projects.' },
  { id: 'project_hero', name: 'Project Hero', icon: '⚡', category: 'Milestone', description: 'Completed 200 projects.' },
  { id: 'project_master', name: 'Project Master', icon: '⚡', category: 'Milestone', description: 'Completed 300 projects.' },
  { id: 'project_legend', name: 'Project Legend', icon: '�️', category: 'Milestone', description: 'Completed 400 projects.' },
  { id: 'project_icon', name: 'Project Icon', icon: '�️', category: 'Milestone', description: 'Completed 500 projects.' },
  { id: 'project_champion', name: 'Project Champion', icon: '�', category: 'Milestone', description: 'Completed 750 projects.' },
  { id: 'project_legend_max', name: 'Project Legend', icon: '�', category: 'Milestone', description: 'Completed 1000 projects.' },
  { id: 'spec_collector_5', name: 'Spec Collector', icon: '�', category: 'Milestone', description: 'Added 5 projects to your spec sheets.' },
  { id: 'spec_curator_10', name: 'Spec Curator', icon: '�', category: 'Milestone', description: 'Added 10 projects to your spec sheets.' },
  { id: 'spec_librarian_20', name: 'Spec Librarian', icon: '�', category: 'Milestone', description: 'Added 20 projects to your spec sheets.' },
  { id: 'spec_archivist_40', name: 'Spec Archivist', icon: '�', category: 'Milestone', description: 'Added 40 projects to your spec sheets.' },
  { id: 'spec_historian_60', name: 'Spec Historian', icon: '�', category: 'Milestone', description: 'Added 60 projects to your spec sheets.' },
  { id: 'spec_scholar_80', name: 'Spec Scholar', icon: '�', category: 'Milestone', description: 'Added 80 projects to your spec sheets.' },
  { id: 'spec_sage_100', name: 'Spec Sage', icon: '�', category: 'Milestone', description: 'Added 100 projects to your spec sheets.' },
  { id: 'first_project', name: 'First Completion', icon: '🧰', category: 'Milestone', description: 'Completed your first project.' },
  { id: 'first_added', name: 'First Addition', icon: '📝', category: 'Milestone', description: 'Added your first project.' },
  { id: 'first_challenge', name: 'First Challenge', icon: '🏆', category: 'Milestone', description: 'Completed your first challenge.' },

  // --- DIFFICULTY BADGES (10) ---
  { id: 'easy_first', name: 'Easy Starter', icon: '🔩', category: 'Difficulty', description: 'Completed your first basic project.' },
  { id: 'intermediate_first', name: 'Intermediate Initiate', icon: '🔩', category: 'Difficulty', description: 'Completed your first intermediate project.' },
  { id: 'hard_first', name: 'Advanced Specialist', icon: '⚡', category: 'Difficulty', description: 'Completed your first advanced project.' },
  { id: 'easy_10', name: 'Easy Veteran', icon: '🔩', category: 'Difficulty', description: 'Completed 10 basic projects.' },
  { id: 'intermediate_10', name: 'Intermediate Veteran', icon: '🔩', category: 'Difficulty', description: 'Completed 10 intermediate projects.' },
  { id: 'hard_10', name: 'Hardcore Veteran', icon: '⚡', category: 'Difficulty', description: 'Completed 10 advanced projects.' },
  { id: 'easy_25', name: 'Easy Master', icon: '🔩', category: 'Difficulty', description: 'Completed 25 basic projects.' },
  { id: 'intermediate_25', name: 'Intermediate Master', icon: '🔩', category: 'Difficulty', description: 'Completed 25 intermediate projects.' },
  { id: 'hard_25', name: 'Hardcore Master', icon: '⚡', category: 'Difficulty', description: 'Completed 25 advanced projects.' },
  { id: 'master_tech', name: 'Master Technician', icon: '🦾', category: 'Difficulty', description: 'Completed 50 advanced projects.' },

  // --- THEME/SPECIALIZATION BADGES (50) ---
  // Airflow, Refrigeration, Electrical, Controls, Ductwork, Hydronics, Diagnostics, Commissioning, Safety, Efficiency
  // Each theme has 5 tiers: 1, 5, 10, 25, 50
  ...(() => {
    const themes = [
      { key: 'airflow', name: 'Airflow Specialist', icon: '🌬️' },
      { key: 'refrigeration', name: 'Refrigeration Expert', icon: '❄️' },
      { key: 'electrical', name: 'Electrical Pro', icon: '⚡' },
      { key: 'controls', name: 'Controls Guru', icon: '�️' },
      { key: 'ductwork', name: 'Ductwork Master', icon: '🏗️' },
      { key: 'hydronics', name: 'Hydronics Hero', icon: '💧' },
      { key: 'diagnostics', name: 'Diagnostics Ace', icon: '🔍' },
      { key: 'commissioning', name: 'Commissioning Pro', icon: '✅' },
      { key: 'safety', name: 'Safety Champion', icon: '🦺' },
      { key: 'efficiency', name: 'Efficiency Expert', icon: '📊' },
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
  { id: 'birthday_tech', name: 'Birthday Builder', icon: '🎂', category: 'Special', description: 'Completed a project on your birthday.' },
  { id: 'all_challenges', name: 'Jack of All Challenges', icon: '🌟', category: 'Special', description: 'Completed every challenge type.' },
  { id: 'hidden_feature', name: 'Hidden Gem', icon: '🕵️‍♂️', category: 'Special', description: 'Discovered a hidden feature.' },
  { id: 'holiday_tech', name: 'Holiday Builder', icon: '🎁', category: 'Special', description: 'Completed a project on a holiday.' },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', category: 'Special', description: 'Completed a project after midnight.' },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦', category: 'Special', description: 'Completed a project before 6am.' },
  { id: 'all_themes', name: 'Domain Master', icon: '🏆', category: 'Special', description: 'Completed at least one project from every specialization.' },
  { id: 'challenge_perfect', name: 'Perfect Challenger', icon: '💯', category: 'Special', description: 'Completed every weekly challenge in a month.' },
  { id: 'tech_of_the_year', name: 'Tech of the Year', icon: '🏅', category: 'Special', description: 'Earned the most badges in a year.' },
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
