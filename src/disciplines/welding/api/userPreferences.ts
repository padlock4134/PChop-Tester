import { supabase } from './supabaseClient';
import { ExperienceLevel, UserPreferences, DEFAULT_EXPERIENCE_LEVEL } from '../types/userPreferences';
import { isSessionValid } from './userSession';

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) {
    return { 
      experienceLevel: DEFAULT_EXPERIENCE_LEVEL,
      certifications: [],
      processes: [],
      shopSetup: 'Garage Shop'
    };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('welding_experience, certifications, processes, shop_setup, level, selected_talent_tree')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.warn('Failed to fetch user preferences:', error);
    return { 
      experienceLevel: DEFAULT_EXPERIENCE_LEVEL,
      certifications: [],
      processes: [],
      shopSetup: 'Garage Shop'
    };
  }

  return {
    experienceLevel: (data.welding_experience as ExperienceLevel) || DEFAULT_EXPERIENCE_LEVEL,
    certifications: data.certifications || [],
    processes: data.processes || [],
    shopSetup: data.shop_setup || 'Garage Shop',
    talentTree: (data.level >= 10 && data.selected_talent_tree) ? data.selected_talent_tree : null,
    level: data.level || 1
  };
}

export async function updateExperienceLevel(userId: string, level: ExperienceLevel): Promise<void> {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) {
    console.error('No user logged in');
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      welding_experience: level,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update experience level:', error);
    throw error;
  }
}
