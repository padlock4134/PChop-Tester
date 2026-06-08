import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecipeContext } from './ProcessContext';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import chefFreddiePng from '../images/logo.png';

export type RecipeCard = {
  id: string;
  title: string;
  image: string;
  ingredients: string[];
  instructions: string;
  equipment?: string[];
  tutorials?: Array<{
    title: string;
    desc: string;
    videoUrl?: string;
  }>;
  products?: Array<{
    name: string;
    desc: string;
    price: string;
    image: string;
  }>;
  healthTags?: string[];
  nutrition?: {
    carbs: number;
    sugars: number;
    fiber: number;
    protein: number;
    saturatedFat?: number;
    sodium?: number;
    omega3?: number;
    antioxidants?: number;
    cholesterol?: number;
    potassium?: number;
    phosphorus?: number;
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
  cupboardIngredients: string[];
  onLike: (recipe: RecipeCard) => void;
  saveRecipeToCookbook: (recipe: RecipeCard) => void;
  recipes: RecipeCard[];
  loading: boolean;
  error: string;
};

const RecipeMatcherModal: React.FC<Props> = ({ open, onClose, cupboardIngredients, onLike, saveRecipeToCookbook, recipes, loading, error }) => {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const navigate = useNavigate();

  const loadingMessages = [
    'Analyzing your floor inventory...',
    'Matching materials to processes...',
    'Finding optimal SOPs...'
  ];

  // Timer effect for loading steps
  useEffect(() => {
    if (loading) {
      setLoadingStep(0);
      const timer = setInterval(() => {
        setLoadingStep(prev => {
          if (prev < loadingMessages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2000); // Change message every 2 seconds

      return () => clearInterval(timer);
    }
  }, [loading, loadingMessages.length]);

  if (!open) return null;

  const handleLike = async () => {
    try {
      setIsSaving(true);
      // Save recipe to cookbook
      await saveRecipeToCookbook(recipes[currentIdx]);
      await onLike(recipes[currentIdx]);
      setCurrentIdx(idx => idx + 1);
    } catch (error) {
      console.error('Error saving recipe:', error);
    } finally {
      setIsSaving(false);
    }
  };
  const handleSkip = () => setCurrentIdx(idx => idx + 1);
  function generateTutorials(recipe: RecipeCard) {
  return [
    {
      title: `Equipment for ${recipe.title}`,
      desc: 'Learn about the tools and equipment needed for this process'
    },
    {
      title: 'Material Preparation',
      desc: 'How to properly prepare and handle materials for this process'
    },
    {
      title: `Process: ${recipe.title}`,
      desc: recipe.instructions
    }
  ];
}

  const DIETARY_TAGS = [
    { key: 'Heart Healthy', label: 'Quality Certified' },
    { key: 'Anti Inflammatory', label: 'ISO Compliant' },
    { key: 'Low Glycemic', label: 'Lean Process' },
    { key: 'Low Cholesterol', label: 'Safety Verified' },
    { key: 'Renal Friendly', label: 'Low Waste' },
    { key: 'DASH Diet', label: 'High Efficiency' },
    { key: 'Low Sodium', label: '5S Compliant' },
    { key: 'High Fiber', label: 'Six Sigma' }
  ];

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-weatheredWhite rounded-lg shadow-lg border-4 border-black p-4 lg:p-6 max-w-2xl w-full mx-4 max-h-[85vh] lg:max-h-[80vh] overflow-y-auto relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-2xl text-lobsterRed hover:text-red-700 focus:outline-none"
          aria-label="Close modal"
        >
          &times;
        </button>
        <h2 className="font-retro text-xl lg:text-2xl mb-2 text-center flex items-center justify-center">
          {loading ? (
            <div className="flex items-center gap-3">
              <img src={chefFreddiePng} alt="Chef Freddie" className="w-12 h-12 rounded-full border-2 border-black" />
              <span>{loadingMessages[loadingStep]}</span>
            </div>
          ) : 
           (recipes.length > 0 && currentIdx < recipes.length ? recipes[currentIdx].title : 'Process Matcher')}
        </h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maineBlue mb-4"></div>
            <div className="text-lg font-retro mb-2">Finding matching processes...</div>
          </div>
        ) : error ? (
          <div className="text-lobsterRed text-center">{error}</div>
        ) : recipes.length === 0 || currentIdx >= recipes.length ? (
          <div className="text-center text-maineBlue font-bold py-10">No more process suggestions<br/>Try updating your floor inventory</div>
        ) : (
          (() => {
            console.log('Recipe healthTags:', recipes[currentIdx].healthTags);
            return (
              <div className="flex flex-col items-center">
                <div className="bg-sand rounded-xl shadow-lg border border-black p-4 w-full max-w-md mb-4 relative">
                  <img src={recipes[currentIdx].image} alt={recipes[currentIdx].title} className="w-full h-48 object-cover rounded mb-2" />
                  <div className="flex flex-wrap gap-1 mb-3 justify-center">
                    {DIETARY_TAGS.map(tag => {
                      const isMatch = recipes[currentIdx].healthTags?.includes(tag.key);
                      return (
                        <span 
                          key={tag.key}
                          className={`px-2 py-1 rounded-full text-xs ${
                            isMatch ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {tag.label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-600 mb-2 text-center"><span className="font-bold">Materials:</span> {recipes[currentIdx].ingredients.join(', ')}</div>
                  {recipes[currentIdx].equipment && recipes[currentIdx].equipment!.length > 0 && (
                    <div className="text-xs text-gray-600 mb-2 text-center"><span className="font-bold">{t('recipeCard.equipment', { defaultValue: 'Tools/Equipment' })}:</span> {recipes[currentIdx].equipment!.join(', ')}</div>
                  )}
                </div>
                <div className="flex gap-8 mt-2">
                  <button className="bg-lobsterRed text-weatheredWhite px-6 py-2 rounded-full shadow hover:bg-maineBlue hover:text-seafoam text-xl font-bold" onClick={handleSkip}>
                    Discard
                  </button>
                  <button 
                    className="bg-seafoam text-maineBlue px-6 py-2 rounded-full shadow hover:bg-maineBlue hover:text-seafoam text-xl font-bold" 
                    onClick={handleLike}
                    disabled={isSaving}
                  >
                    {isSaving ? '...' : 'Save'}
                  </button>
                </div>
                <div className="text-xs mt-4 text-center text-gray-500">{t('recipeMatcher.swipeThrough', { defaultValue: 'Swipe through project options' })}</div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default RecipeMatcherModal;
