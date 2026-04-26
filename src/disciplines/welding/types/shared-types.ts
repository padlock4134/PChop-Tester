// Shared types for the project
export type Material = {
  name: string;
  category: string;
};

export interface ProjectCard {
  equipment?: string[];
  name: string;
  category: string;
};
