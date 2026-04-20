import React, { createContext, useContext, useState, useEffect } from 'react';
import type { RecipeCard } from './PartMatcherModal';

type RecipeContextType = {
  selectedRecipe: RecipeCard | null;
  setSelectedRecipe: (recipe: RecipeCard | null) => void;
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
      setSelectedRecipe: (recipe) => {
        console.log('Setting project in context:', recipe?.title);
        setSelectedRecipe(recipe);
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

