import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecipeContext } from './RepairContext';
import { useNavigate } from 'react-router-dom';

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
  partsBinItems: string[];
  onLike: (recipe: RecipeCard) => void;
  saveRepairToManual: (recipe: RecipeCard) => void;
  recipes: RecipeCard[];
  loading: boolean;
  error: string;
};

const RecipeMatcherModal: React.FC<Props> = ({ open, onClose, partsBinItems, onLike, saveRepairToManual, recipes, loading, error }) => {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const navigate = useNavigate();

  const loadingMessages = [
    t('garageMatcher.loadingMessage1'),
    t('garageMatcher.loadingMessage2'),
    t('garageMatcher.loadingMessage3')
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
      // Save repair to manual
      await saveRepairToManual(recipes[currentIdx]);
      await onLike(recipes[currentIdx]);
      setCurrentIdx(idx => idx + 1);
    } catch (error) {
      console.error('Error saving repair guide:', error);
    } finally {
      setIsSaving(false);
    }
  };
  const handleSkip = () => setCurrentIdx(idx => idx + 1);
  function generateTutorials(recipe: RecipeCard) {
  return [
    {
      title: `${t('garageMatcher.equipmentUsing')} ${recipe.title}`,
      desc: t('garageMatcher.learnEquipment')
    },
    {
      title: t('garageMatcher.partsPrep'),
      desc: t('garageMatcher.howToPrepParts')
    },
    {
      title: `${t('garageMatcher.procedure')} ${recipe.title}`,
      desc: recipe.instructions
    }
  ];
}

  const REPAIR_TAGS = [
    { key: 'Heart Healthy', label: t('garageMatcher.safetyCertified') },
    { key: 'Anti Inflammatory', label: t('garageMatcher.warrantyApproved') },
    { key: 'Low Glycemic', label: t('garageMatcher.fuelEfficient') },
    { key: 'Low Cholesterol', label: t('garageMatcher.emissionCompliant') },
    { key: 'Renal Friendly', label: t('garageMatcher.lowMaintenance') },
    { key: 'DASH Diet', label: t('garageMatcher.performanceTuned') },
    { key: 'Low Sodium', label: t('garageMatcher.environmentallyFriendly') },
    { key: 'High Fiber', label: t('garageMatcher.heavyDuty') }
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
              <span className="text-3xl" role="img" aria-label="Garage Puddy">🚗</span>
              <span>{loadingMessages[loadingStep]}</span>
            </div>
          ) : 
           (recipes.length > 0 && currentIdx < recipes.length ? recipes[currentIdx].title : t('garageMatcher.garageMatcher'))}
        </h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maineBlue mb-4"></div>
            <div className="text-lg font-retro mb-2">{t('garageMatcher.findingGuides')}</div>
          </div>
        ) : error ? (
          <div className="text-lobsterRed text-center">{error}</div>
        ) : recipes.length === 0 || currentIdx >= recipes.length ? (
          <div className="text-center text-maineBlue font-bold py-10">{t('garageMatcher.noMoreSuggestions')}<br/>{t('garageMatcher.tryUpdatingGarage')}</div>
        ) : (
          (() => {
            return (
              <div className="flex flex-col items-center">
                <div className="bg-sand rounded-xl shadow-lg border border-black p-4 w-full max-w-md mb-4 relative">
                  <img src={recipes[currentIdx].image} alt={recipes[currentIdx].title} className="w-full h-48 object-cover rounded mb-2" />
                  <div className="flex flex-wrap gap-1 mb-3 justify-center">
                    {REPAIR_TAGS.map(tag => {
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
                  <div className="text-xs text-gray-600 mb-2 text-center"><span className="font-bold">{t('garageMatcher.parts')}:</span> {recipes[currentIdx].ingredients.join(', ')}</div>
                  {recipes[currentIdx].equipment && recipes[currentIdx].equipment!.length > 0 && (
                    <div className="text-xs text-gray-600 mb-2 text-center"><span className="font-bold">{t('garageMatcher.tools')}:</span> {recipes[currentIdx].equipment!.join(', ')}</div>
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
                <div className="text-xs mt-4 text-center text-gray-500">{t('garageMatcher.swipeThrough')}</div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default RecipeMatcherModal;

