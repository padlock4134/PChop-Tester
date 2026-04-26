import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Log when selectedProject changes
  useEffect(() => {
    console.log('ProjectContext - selectedProject updated:', selectedProject);
  }, [selectedProject]);

  return (
    <ProjectContext.Provider value={{ 
      selectedProject, 
      setSelectedProject: (project) => {
        console.log('Setting project in context:', project?.title);
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

