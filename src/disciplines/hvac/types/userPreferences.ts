// Experience levels — DB column values kept for backward compat
// HVAC context: new_to_cooking = Student, home_cook = Apprentice, kitchen_confident = Journeyman+
export type ExperienceLevel = 'new_to_cooking' | 'home_cook' | 'kitchen_confident';

export interface UserPreferences {
  experienceLevel: ExperienceLevel;
  dietary: string[];       // HVAC: certifications (EPA 608, NATE, etc.)
  cuisine: string[];       // HVAC: specializations (Residential, Commercial, etc.)
  kitchenSetup: string;    // HVAC: workspace setup (Van Kit, Basic Service, etc.)
  talentTree?: string | null;
  level?: number;
}

export const DEFAULT_EXPERIENCE_LEVEL: ExperienceLevel = 'new_to_cooking';
