import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../components/ShopFreddieContext';
import { fetchCookbook } from './cookbookSupabase';
import SpecSheetImportModal from '../components/SpecSheetImportModal';
import LocalDistributorsModal from '../components/LocalDistributorsModal';
import BuildSystemModal from '../components/BuildSystemModal';
import { useRecipeContext } from '../components/SystemContext';
import { RecipeCard } from '../components/SystemMatcherModal';
import { useSupabase } from '../components/SupabaseProvider';
import GlobalTestShop from '../components/GlobalTestShop';
import { fetchNutritionData, calculateRecipeNutrition } from '../api/nutritionService';
import { KeyNutrients } from '../types/nutrition';

const TechTalk = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { recipes, setRecipes } = useRecipeContext();
  const { user } = useSupabase();
  
  // Showcase recipe state
  const [showcaseRecipe, setShowcaseRecipe] = useState<any>(null);
  const [recipeNutrition, setRecipeNutrition] = useState<KeyNutrients | null>(null);
  const [servingSize, setServingSize] = useState(2);
  const [cookbookModalOpen, setCookbookModalOpen] = useState(false);
  
  // Trade wisdom quotes rotation (52 quotes for weekly rotation)
  const chefQuotes = [
    // Willis Carrier & HVAC Pioneers (11 quotes)
    "I fish only for edible fish, and hunt only for edible game — even in the laboratory.",
    "The impossible is often the untried.",
    "Comfort cooling is not a luxury — it's a productivity multiplier.",
    "Every system tells a story. Learn to read the gauges and they'll tell you everything.",
    "The best diagnostic tool is the one between your ears.",
    "Master the fundamentals. Superheat and subcooling never lie.",
    "A well-maintained system is a safe system. Never skip the checklist.",
    "Airflow is king. Without proper airflow, nothing else matters.",
    "The trades built this country, and they'll carry it into the future.",
    "Precision in measurement leads to confidence in diagnosis.",
    "Good refrigeration practice is good environmental practice.",
    
    // Trade Wisdom (11 quotes)
    "The best technicians never stop being students.",
    "Your reputation is built one service call at a time.",
    "Safety isn't a priority — it's a prerequisite.",
    "A clean install is a professional install. Details matter.",
    "Measure twice, braze once.",
    "The customer doesn't care how much you know until they know how much you care.",
    "Troubleshooting is just organized curiosity.",
    "Every callback is a lesson. Every lesson makes you better.",
    "The difference between a tech and a great tech is five minutes of thinking before turning a wrench.",
    "Don't chase symptoms. Find the root cause.",
    "Your tools are an investment in your future. Treat them that way.",
    
    // Leadership & Growth (10 quotes)
    "The skilled trades shortage is an opportunity for those willing to learn.",
    "A journeyman license is a beginning, not a destination.",
    "Teach what you know. The trade grows when knowledge is shared.",
    "Every building you work on becomes part of your legacy.",
    "Comfort is invisible when it works. That's the mark of excellence.",
    "The best systems are designed, not assembled.",
    "Code compliance is the floor, not the ceiling.",
    "Energy efficiency isn't just green — it's good business.",
    "A great technician sees what others overlook.",
    "The fundamentals don't change. Master them first.",
    
    // Mentorship & Craft (10 quotes)
    "An apprentice who asks questions will outpace one who stays silent.",
    "Your first year in the field teaches more than any textbook.",
    "The trades offer something rare: visible, tangible results from your own hands.",
    "Indoor air quality affects every person in every building. That's the weight of what we do.",
    "A vacuum pump doesn't lie. Neither should your work.",
    "Preventive maintenance is cheaper than emergency service — every single time.",
    "The best HVAC techs are part detective, part engineer, part diplomat.",
    "Commission every system like your family will live with it.",
    "Respect the refrigerant. Respect the voltage. Respect the craft.",
    "Everyone needs a mentor. Be one when you can, find one when you need to."
  ];
  
  const chefNames = [
    // Willis Carrier & HVAC Pioneers (11)
    "Willis Carrier", "Willis Carrier", "Willis Carrier", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom",
    // Trade Wisdom (11)
    "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom",
    // Leadership & Growth (10)
    "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom",
    // Mentorship & Craft (10)
    "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom", "Trade Wisdom"
  ];
  
  // Get current week of year (0-51) to rotate through 52 quotes
  const getCurrentWeekQuote = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.floor(diff / oneWeek) % 52;
    return {
      quote: chefQuotes[weekNumber],
      chef: chefNames[weekNumber]
    };
  };
  
  const currentQuote = getCurrentWeekQuote();
  const [localMarketsModalOpen, setLocalMarketsModalOpen] = useState(false);
  const [buildMenuModalOpen, setBuildMenuModalOpen] = useState(false);
  const [selectedMenuRecipes, setSelectedMenuRecipes] = useState<RecipeCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState<'corner' | 'kitchen'>('corner');

  useEffect(() => {
    updateContext({ page: 'ChefsCorner' });
    
    // Load recipes from cookbook when Chef's Corner loads
    const loadRecipes = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const savedRecipes = await fetchCookbook(user.id);
        setRecipes(savedRecipes || []);
      } catch (err) {
        console.error('Error loading cookbook recipes:', err);
        // Initialize with empty array if there's an error
        setRecipes([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecipes();
  }, [updateContext, setRecipes, user?.id]);

  // Open modal for My CookBook import
  const importFromCookBook = () => {
    if (!user) {
      alert(t('techTalk.pleaseSignIn'));
      return;
    }
    setCookbookModalOpen(true);
  };

  // Handler for modal import - select a recipe to showcase
  const handleCookBookImport = async (selectedRecipe: any) => {
    console.log('Importing recipe:', selectedRecipe);
    
    if (!selectedRecipe) {
      console.error('No recipe selected');
      alert(t('techTalk.errorNoRecipe'));
      return;
    }

    try {
      // Set the selected recipe as the showcase recipe
      setShowcaseRecipe(selectedRecipe);
      
      // Calculate nutrition for the recipe
      if (selectedRecipe.ingredients && Array.isArray(selectedRecipe.ingredients)) {
        try {
          const nutrition = await calculateRecipeNutrition(selectedRecipe.ingredients);
          setRecipeNutrition(nutrition);
        } catch (error) {
          console.error('Error calculating nutrition:', error);
          setRecipeNutrition(null);
        }
      } else {
        setRecipeNutrition(null);
      }
      
      alert(t('techTalk.recipeSetToShowcase').replace('{title}', selectedRecipe.title));
      
    } catch (error) {
      console.error('Error importing recipe:', error);
      alert(t('techTalk.failedToImport'));
    } finally {
      setCookbookModalOpen(false);
    }
  };

  return (
    <>
      <BuildSystemModal
        open={buildMenuModalOpen}
        onClose={() => setBuildMenuModalOpen(false)}
        onFindMarkets={(recipes: RecipeCard[]) => {
          setSelectedMenuRecipes(recipes);
          setBuildMenuModalOpen(false);
          setLocalMarketsModalOpen(true);
        }}
      />
      
      <LocalDistributorsModal
        open={localMarketsModalOpen}
        onClose={() => setLocalMarketsModalOpen(false)}
        selectedRecipes={selectedMenuRecipes}
      />
      
      <div className="w-[90%] mx-auto mt-4 student-dashboard-height-lock">
        {/* Mobile Tab Bar - Only visible on mobile */}
        <div className="lg:hidden mb-4 flex gap-2 border-b-2 border-maineBlue">
          <button
            onClick={() => setActiveMobileTab('corner')}
            className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
              activeMobileTab === 'corner'
                ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🌡️ {t('techTalk.title')}
          </button>
          <button
            onClick={() => setActiveMobileTab('kitchen')}
            className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
              activeMobileTab === 'kitchen'
                ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🧪 {t('techTalk.globalTestKitchenTab')}
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 lg:h-full lg:justify-center">
          {/* Main Content - Chef's Corner Tab */}
          <div className={`lg:w-[66.666%] bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue flex flex-col h-full lg:min-h-[620px] ${
            activeMobileTab === 'corner' ? 'flex' : 'hidden lg:flex'
          }`}>
            {/* Chef's Corner header - moved back inside the module */}
            <div className="flex items-center justify-center mb-4">
              <span className="text-5xl mr-2">🌡️</span>
              <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('techTalk.title')}</h1>
            </div>
            
            {/* Separation line */}
            <hr className="border-t-2 border-maineBlue mb-6" />
            <div className="w-full mx-auto">
              {/* Shopping List - now at the top */}
              <section className="mb-8">
                <div className="bg-sand p-4 rounded-lg border border-black">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      {t('techTalk.showcaseRecipe')}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBuildMenuModalOpen(true)}
                        className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black"
                      >
                        📋 {t('techTalk.buildMenu')}
                      </button>
                      <button 
                        onClick={importFromCookBook} 
                        className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-gray-300"
                        disabled={isLoading}
                      >
                        {isLoading ? t('techTalk.loading') : t('techTalk.importFromCookbook')}
                      </button>
                    </div>
                  </div>
                  <SpecSheetImportModal
                    open={cookbookModalOpen}
                    onClose={() => setCookbookModalOpen(false)}
                    onImport={handleCookBookImport}
                    existingIngredients={[]}
                  />
                  {showcaseRecipe ? (
                    <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-black overflow-hidden w-full min-h-[350px] mt-4 mx-auto relative">
                      <button
                        onClick={() => setShowcaseRecipe(null)}
                        className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"
                        title={t('techTalk.removeShowcaseRecipe')}
                      >
                        <span className="text-red-500 font-bold text-lg">✕</span>
                      </button>
                      {/* Left Page */}
                      <div className="flex-1 p-6 bg-weatheredWhite border-r border-gray-200 flex flex-col">
                        {showcaseRecipe.image && (
                          <img
                            src={showcaseRecipe.image}
                            alt={showcaseRecipe.title}
                            className="rounded-lg w-full h-32 object-cover mb-4"
                            style={{ objectFit: 'cover' }}
                          />
                        )}
                        <h3 className="font-bold text-xl mb-1 text-maineBlue">{showcaseRecipe.title}</h3>
                        <div className="font-semibold mb-1 mt-2">{t('techTalk.ingredients')}</div>
                        <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                          {showcaseRecipe.ingredients?.length ? (
                            showcaseRecipe.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)
                          ) : (
                            <li className="italic text-gray-400">{t('techTalk.noIngredientsListed')}</li>
                          )}
                        </ul>
                        {recipeNutrition && (
                          <div className="mt-2">
                            <div className="font-semibold mb-1">{t('techTalk.nutritionTotal').replace('{servings}', servingSize.toString())}:</div>
                            <div className="text-sm">
                              <div>{t('techTalk.carbs')}: {(recipeNutrition.carbs * servingSize).toFixed(1)}g</div>
                              <div>{t('techTalk.sugars')}: {(recipeNutrition.sugars * servingSize).toFixed(1)}g</div>
                              <div>{t('techTalk.fiber')}: {(recipeNutrition.fiber * servingSize).toFixed(1)}g</div>
                              <div>{t('techTalk.protein')}: {(recipeNutrition.protein * servingSize).toFixed(1)}g</div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Right Page */}
                      <div className="flex-1 p-6 bg-white flex flex-col">
                        <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('techTalk.instructions')}</h3>
                        <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                          {showcaseRecipe.instructions || (
                            <span className="italic text-gray-400">{t('techTalk.noInstructionsProvided')}</span>
                          )}
                        </div>
                        {/* Equipment Section */}
                        {showcaseRecipe.equipment && showcaseRecipe.equipment.length > 0 && (
                          <>
                            <div className="font-semibold mt-4 mb-1">{t('techTalk.equipmentNeeded')}</div>
                            <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                              {showcaseRecipe.equipment.map((eq: string, i: number) => (
                                <li key={i}>{eq}</li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-gray-400 italic text-center">
                      {t('techTalk.noRecipeSelected')}
                    </div>
                  )}
                </div>
              </section>

              {/* Chef Quote of the Week */}
              <p className="text-center text-gray-600 italic mb-6">
                "{currentQuote.quote}" — {currentQuote.chef}
              </p>


            </div>
          {/* Desktop Layout - Markets Directory */}
          <div className="hidden lg:block">
            <div className="mb-6 mt-8">
              {/* Market content can be added here if needed */}
            </div>
          </div>

        </div>

        {/* Global Test Lab Tab - Mobile Only */}
        <div className={`lg:hidden ${
          activeMobileTab === 'kitchen' ? 'block' : 'hidden'
        }`}>
          <GlobalTestShop showcaseRecipe={showcaseRecipe} />
        </div>
        
        {/* Right Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:w-[28.333%] lg:h-full lg:min-h-0 overflow-y-auto space-y-6 pr-1">
          <GlobalTestShop showcaseRecipe={showcaseRecipe} />
        </div>
      </div>
    </div>
    </>
  );
};

export default TechTalk;

