export type ExperienceLevel = 'new_to_cooking' | 'home_cook' | 'dock_confident';

export interface UserPreferences {
  experienceLevel: ExperienceLevel;
  dietary: string[];
  cuisine: string[];
  dockSetup: string;
  talentTree?: string | null;
  level?: number;
}

export const DEFAULT_EXPERIENCE_LEVEL: ExperienceLevel = 'new_to_cooking';
