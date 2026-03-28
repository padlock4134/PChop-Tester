import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DISCIPLINE_CONFIG, DisciplineKey, getDisciplineFromPath } from './disciplineConfig';

interface DisciplineContextType {
  currentDiscipline: DisciplineKey | null;
  setDiscipline: (discipline: DisciplineKey) => void;
  disciplineConfig: typeof DISCIPLINE_CONFIG[keyof typeof DISCIPLINE_CONFIG] | null;
}

const DisciplineContext = createContext<DisciplineContextType | null>(null);


const buildFallbackDisciplineConfig = (discipline: string) => ({
  key: discipline,
  name: discipline.charAt(0).toUpperCase() + discipline.slice(1),
  routes: {
    kitchen: `/${discipline}/my-workspace`,
    cookbook: `/${discipline}/my-notebook`,
    corner: `/${discipline}/community`,
    school: `/${discipline}/school`,
    dashboard: `/${discipline}/dashboard`,
    profile: `/${discipline}/profile`,
  },
});

export const DisciplineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [currentDiscipline, setCurrentDiscipline] = useState<DisciplineKey | null>(() => {
    // First check current URL path
    const disciplineFromPath = getDisciplineFromPath(location.pathname);
    if (disciplineFromPath) {
      return disciplineFromPath;
    }
    
    // Then fallback to localStorage (only if it exists)
    const stored = localStorage.getItem('lastDiscipline');
    const selected = localStorage.getItem('selectedDiscipline');
    const disciplineToUse = selected || stored;
    
    if (disciplineToUse) {
      return disciplineToUse as DisciplineKey;
    }
    
    // Return null if nothing exists - DO NOT AUTO-SET
    return null;
  });

  useEffect(() => {
    // Extract discipline from URL path
    const disciplineFromPath = getDisciplineFromPath(location.pathname);
    
    if (disciplineFromPath) {
      setCurrentDiscipline(disciplineFromPath);
      localStorage.setItem('lastDiscipline', disciplineFromPath);
    }
  }, [location.pathname]);

  const setDiscipline = (discipline: DisciplineKey) => {
    setCurrentDiscipline(discipline);
    localStorage.setItem('lastDiscipline', discipline);
  };

  const disciplineConfig = currentDiscipline
    ? DISCIPLINE_CONFIG[currentDiscipline as keyof typeof DISCIPLINE_CONFIG] || buildFallbackDisciplineConfig(currentDiscipline)
    : null;

  return (
    <DisciplineContext.Provider value={{ currentDiscipline, setDiscipline, disciplineConfig }}>
      {children}
    </DisciplineContext.Provider>
  );
};

export const useDiscipline = () => {
  const context = useContext(DisciplineContext);
  if (!context) {
    throw new Error('useDiscipline must be used within DisciplineProvider');
  }
  return context;
};
