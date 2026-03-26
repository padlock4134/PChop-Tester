import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DISCIPLINE_CONFIG, DisciplineKey, getDisciplineFromPath } from './disciplineConfig';

interface DisciplineContextType {
  currentDiscipline: DisciplineKey;
  setDiscipline: (discipline: DisciplineKey) => void;
  disciplineConfig: typeof DISCIPLINE_CONFIG[DisciplineKey];
}

const DisciplineContext = createContext<DisciplineContextType | null>(null);

export const DisciplineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [currentDiscipline, setCurrentDiscipline] = useState<DisciplineKey>(() => {
    // First check current URL path
    const disciplineFromPath = getDisciplineFromPath(location.pathname);
    if (disciplineFromPath) {
      return disciplineFromPath;
    }
    
    // Then fallback to localStorage
    const stored = localStorage.getItem('lastDiscipline') as DisciplineKey;
    return stored && DISCIPLINE_CONFIG[stored] ? stored : 'culinary';
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

  const disciplineConfig = DISCIPLINE_CONFIG[currentDiscipline];

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
