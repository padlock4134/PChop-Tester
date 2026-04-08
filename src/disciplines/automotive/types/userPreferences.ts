export type ExperienceLevel = 'new_to_automotive' | 'apprentice_technician' | 'certified_technician';

export interface UserPreferences {
  experienceLevel: ExperienceLevel;
  vehicleType: string[];
  certifications: string[];
  garageSetup: string;
  talentTree?: string | null;
  level?: number;
}

export const DEFAULT_EXPERIENCE_LEVEL: ExperienceLevel = 'new_to_automotive';
