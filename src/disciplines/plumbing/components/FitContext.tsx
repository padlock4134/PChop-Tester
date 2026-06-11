import React, { createContext, useContext, useState } from 'react';
import type { RecipeCard } from './FitMatcherModal';

type RecipeContextType = {
  selectedRecipe: RecipeCard | null;
  setSelectedRecipe: (fit: RecipeCard | null) => void;
  fits: RecipeCard[];
  setRecipes: (fits: RecipeCard[]) => void;
};

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeCard | null>(null);
  const [fits, setRecipes] = useState<RecipeCard[]>([]);

  return (
    <RecipeContext.Provider value={{ 
      selectedRecipe, 
      setSelectedRecipe: (fit) => {
        setSelectedRecipe((prev: any) => fit ? ({
          ...fit,
          nutrition: fit.nutrition
        }) : null);
      }, 
      fits, 
      setRecipes 
    }}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipeContext = () => {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error('useRecipeContext must be used within a RecipeProvider');
  return ctx;
};

