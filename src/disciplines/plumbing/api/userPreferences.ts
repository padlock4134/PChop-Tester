import { supabase } from './supabaseClient';
import { ExperienceLevel, UserPreferences, DEFAULT_EXPERIENCE_LEVEL } from '../types/userPreferences';
import { isSessionValid } from './userSession';

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) {
    return { 
      experienceLevel: DEFAULT_EXPERIENCE_LEVEL,
      certifications: [],
      specialization: [],
      workspaceSetup: 'Student Toolkit'
    };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('cooking_experience, dietary, cuisine, kitchen_setup, level, selected_talent_tree')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.warn('Failed to fetch user preferences:', error);
    return { 
      experienceLevel: DEFAULT_EXPERIENCE_LEVEL,
      certifications: [],
      specialization: [],
      workspaceSetup: 'Student Toolkit'
    };
  }

  return {
    experienceLevel: (data.cooking_experience as ExperienceLevel) || DEFAULT_EXPERIENCE_LEVEL,
    certifications: data.dietary || [],
    specialization: data.cuisine || [],
    workspaceSetup: data.van_setup || 'Student Toolkit',
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
      cooking_experience: level,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update experience level:', error);
    throw error;
  }
}
