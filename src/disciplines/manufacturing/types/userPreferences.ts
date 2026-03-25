export type ExperienceLevel = 'new_to_manufacturing' | 'experienced_technician' | 'manufacturing_expert';

export interface UserPreferences {
  experienceLevel: ExperienceLevel;
  dietary: string[];
  cuisine: string[];
  workshopSetup: string;
  talentTree?: string | null;
  level?: number;
}

export const DEFAULT_EXPERIENCE_LEVEL: ExperienceLevel = 'new_to_manufacturing';
