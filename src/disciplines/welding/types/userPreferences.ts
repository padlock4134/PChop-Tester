export type ExperienceLevel = 'new_to_cooking' | 'home_cook' | 'kitchen_confident';

export interface UserPreferences {
  experienceLevel: ExperienceLevel;
  dietary: string[];
  cuisine: string[];
  kitchenSetup: string;
  talentTree?: string | null;
  level?: number;
}

export const DEFAULT_EXPERIENCE_LEVEL: ExperienceLevel = 'new_to_cooking';
