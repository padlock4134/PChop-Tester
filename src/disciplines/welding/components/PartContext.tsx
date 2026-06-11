import React, { createContext, useContext, useState } from 'react';
import type { ProjectCard } from './PartMatcherModal';

type ProjectContextType = {
  selectedProject: ProjectCard | null;
  setSelectedProject: (project: ProjectCard | null) => void;
  projects: ProjectCard[];
  setProjects: (projects: ProjectCard[]) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState<ProjectCard | null>(null);
  const [projects, setProjects] = useState<ProjectCard[]>([]);

  return (
    <ProjectContext.Provider value={{ 
      selectedProject, 
      setSelectedProject: (project) => {
        setSelectedProject(project);
      }, 
      projects, 
      setProjects 
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjectContext must be used within a ProjectProvider');
  return ctx;
};

// Backward-compatible aliases
export const RecipeProvider = ProjectProvider;
export const useRecipeContext = useProjectContext;

