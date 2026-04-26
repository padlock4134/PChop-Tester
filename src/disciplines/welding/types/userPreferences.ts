export type ExperienceLevel = 'new_to_welding' | 'hobbyist_welder' | 'shop_confident';

export interface UserPreferences {
  experienceLevel: ExperienceLevel;
  certifications: string[];
  processes: string[];
  shopSetup: string;
  talentTree?: string | null;
  level?: number;
}

export const DEFAULT_EXPERIENCE_LEVEL: ExperienceLevel = 'new_to_welding';
