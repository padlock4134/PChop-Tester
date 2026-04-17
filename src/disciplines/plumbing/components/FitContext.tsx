import React, { createContext, useContext, useState, useEffect } from 'react';
import type { RecipeCard } from './FitMatcherModal';

type RecipeContextType = {
  selectedRecipe: RecipeCard | null;
  setSelectedRecipe: (fit: RecipeCard | null) => void;
  recipes: RecipeCard[];
  setRecipes: (recipes: RecipeCard[]) => void;
};

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeCard | null>(null);
  const [recipes, setRecipes] = useState<RecipeCard[]>([]);

  // Log when selectedRecipe changes
  useEffect(() => {
    console.log('RecipeContext - selectedRecipe updated:', selectedRecipe);
  }, [selectedRecipe]);

  return (
    <RecipeContext.Provider value={{ 
      selectedRecipe, 
      setSelectedRecipe: (fit) => {
        console.log('Setting fit in context with nutrition:', fit?.nutrition);
        setSelectedRecipe((prev: any) => fit ? ({
          ...fit,
          nutrition: fit.nutrition
        }) : null);
      }, 
      recipes, 
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

