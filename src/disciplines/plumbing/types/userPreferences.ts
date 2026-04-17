export type ExperienceLevel = 'new_to_trade' | 'apprentice' | 'journeyman';

export interface UserPreferences {
  experienceLevel: ExperienceLevel;
  certifications: string[];
  specialization: string[];
  workspaceSetup: string;
  talentTree?: string | null;
  level?: number;
}

export const DEFAULT_EXPERIENCE_LEVEL: ExperienceLevel = 'new_to_trade';
