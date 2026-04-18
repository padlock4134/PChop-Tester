import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecipeContext } from '../../culinary/components/RecipeContext';
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
  const { setSelectedRecipe } = useRecipeContext();
  const navigate = useNavigate();

  const loadingMessages = [
    'Scanning your shop inventory…',
    'Matching HVAC procedures…',
    'Building spec sheet recommendations…'
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
      title: `${t('recipeMatcher.equipmentUsing')} ${recipe.title}`,
      desc: t('recipeMatcher.learnEquipment')
    },
    {
      title: t('recipeMatcher.proteinPrep', { defaultValue: 'Material Prep' }),
      desc: t('recipeMatcher.howToPrepProtein', { defaultValue: 'How to prep primary materials for this project.' })
    },
    {
      title: `${t('recipeMatcher.recipe', { defaultValue: 'Procedure' })} ${recipe.title}`,
      desc: recipe.instructions
    }
  ];
}

  const handleCookMe = () => {
    const fullRecipe = {
      ...recipes[currentIdx],
      tutorials: recipes[currentIdx].tutorials && recipes[currentIdx].tutorials.length === 3
        ? recipes[currentIdx].tutorials
        : generateTutorials(recipes[currentIdx])
    };
    setSelectedRecipe(fullRecipe);
    navigate('/hvac/hvac-school');
  };

  const MATCH_TAGS = [
    { label: 'Airflow', check: (r: RecipeCard) => /airflow|cfm|duct|static pressure/i.test(`${r.title} ${r.instructions} ${(r.ingredients || []).join(' ')} ${(r.equipment || []).join(' ')}`) },
    { label: 'Refrigeration', check: (r: RecipeCard) => /refrigerant|superheat|subcool|compressor|evaporator|condenser/i.test(`${r.title} ${r.instructions} ${(r.ingredients || []).join(' ')}`) },
    { label: 'Controls', check: (r: RecipeCard) => /thermostat|sensor|control|setpoint|automation/i.test(`${r.title} ${r.instructions} ${(r.ingredients || []).join(' ')}`) },
    { label: 'Electrical', check: (r: RecipeCard) => /voltage|amp|breaker|wiring|contactor|capacitor/i.test(`${r.title} ${r.instructions} ${(r.ingredients || []).join(' ')}`) },
    { label: 'Maintenance', check: (r: RecipeCard) => /maintenance|inspection|service|checklist|filter/i.test(`${r.title} ${r.instructions}`) },
    { label: 'Safety', check: (r: RecipeCard) => /safety|lockout|tagout|ppe|hazard/i.test(`${r.title} ${r.instructions}`) }
  ];

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-weatheredWhite rounded-lg shadow-lg border-4 border-black p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-lobsterRed hover:text-red-700 focus:outline-none"
          aria-label="Close modal"
        >
          &times;
        </button>
        <h2 className="font-retro text-2xl mb-2 text-center flex items-center justify-center">
          {loading ? (
            <div className="flex items-center gap-3">
              <img src={chefFreddiePng} alt="HVAC Assistant" className="w-12 h-12 rounded-full border-2 border-black" />
              <span>{loadingMessages[loadingStep]}</span>
            </div>
          ) : 
           (recipes.length > 0 && currentIdx < recipes.length ? recipes[currentIdx].title : t('recipeMatcher.recipeMatcher', { defaultValue: 'Spec Sheet Matcher' }))}
        </h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maineBlue mb-4"></div>
            <div className="text-lg font-retro mb-2">Finding matching HVAC spec sheets…</div>
          </div>
        ) : error ? (
          <div className="text-lobsterRed text-center">{error}</div>
        ) : recipes.length === 0 || currentIdx >= recipes.length ? (
          <div className="text-center text-maineBlue font-bold py-10">No more matches right now.<br/>Try updating your shop inventory or adding more materials.</div>
        ) : (
          (() => {
            console.log('Recipe healthTags:', recipes[currentIdx].healthTags);
            return (
              <div className="flex flex-col items-center">
                <div className="bg-sand rounded-xl shadow-lg border border-black p-4 w-full max-w-md mb-4 relative">
                  <img src={recipes[currentIdx].image} alt={recipes[currentIdx].title} className="w-full h-48 object-cover rounded mb-2" />
                  <div className="flex flex-wrap gap-1 mb-3 justify-center">
                    {(MATCH_TAGS.filter(tag => tag.check(recipes[currentIdx])).map(tag => tag.label).slice(0, 4).length > 0
                      ? MATCH_TAGS.filter(tag => tag.check(recipes[currentIdx])).map(tag => tag.label).slice(0, 4)
                      : ['General HVAC']
                    ).map((tagLabel) => (
                      <span
                        key={tagLabel}
                        className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-300"
                      >
                        {tagLabel}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-600 mb-2 text-center"><span className="font-bold">Materials:</span> {recipes[currentIdx].ingredients.join(', ')}</div>
                  {recipes[currentIdx].equipment && recipes[currentIdx].equipment!.length > 0 && (
                    <div className="text-xs text-gray-600 mb-2 text-center"><span className="font-bold">Tools/Equipment:</span> {recipes[currentIdx].equipment!.join(', ')}</div>
                  )}
                </div>
                <div className="flex gap-8 mt-2">
                  <button className="bg-lobsterRed text-weatheredWhite px-6 py-2 rounded-full shadow hover:bg-maineBlue hover:text-seafoam text-xl font-bold" onClick={handleSkip}>
                    ✕
                  </button>
                  <button 
                    className="bg-seafoam text-maineBlue px-6 py-2 rounded-full shadow hover:bg-maineBlue hover:text-seafoam text-xl font-bold" 
                    onClick={handleLike}
                    disabled={isSaving}
                  >
                    {isSaving ? '...' : '♥'}
                  </button>
                  <button className="bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue text-xl font-bold" onClick={handleCookMe}>
                    Open in HVAC School
                  </button>
                </div>
                <div className="text-xs mt-4 text-center text-gray-500">Review additional spec sheet matches from your inventory.</div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default RecipeMatcherModal;

