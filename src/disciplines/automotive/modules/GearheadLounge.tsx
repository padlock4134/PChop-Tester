import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../../culinary/components/FreddieContext';
import { fetchCookbook } from '../../culinary/modules/cookbookSupabase';
import ManualImportModal from '../components/ManualImportModal';
import PartsDirectory from '../components/PartsDirectory';
import LocalPartsModal from '../components/LocalPartsModal';
import BuildDiagModal from '../components/BuildDiagModal';
import { useRecipeContext } from '../../culinary/components/RecipeContext';
import { RecipeCard } from '../components/RepairMatcherModal';
import { useSupabase } from '../../../components/DisciplineSupabaseProvider';
import TheCarLift from '../components/GlobalTestGarage';
import { fetchNutritionData, calculateRecipeNutrition } from '../../culinary/api/nutritionService';
import { KeyNutrients } from '../../culinary/types/nutrition';

const GearheadLounge = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { recipes, setRecipes } = useRecipeContext();
  const { user } = useSupabase();
  
  // Showcase recipe state
  const [showcaseRecipe, setShowcaseRecipe] = useState<any>(null);
  const [recipeNutrition, setRecipeNutrition] = useState<KeyNutrients | null>(null);
  const [servingSize, setServingSize] = useState(2);
  const [cookbookModalOpen, setCookbookModalOpen] = useState(false);
  
  // Automotive quotes rotation (52 quotes for weekly rotation)
  const automotiveQuotes = [
    // Henry Ford (11 quotes)
    "Whether you think you can, or you think you can't – you're right.",
    "Coming together is a beginning; keeping together is progress; working together is success.",
    "Quality means doing it right when no one is looking.",
    "The only real mistake is the one from which we learn nothing.",
    "Everything can always be done better than it is being done.",
    "A business that makes nothing but money is a poor business.",
    "The object of living is work, experience, happiness.",
    "There is no man living who isn't capable of doing more than he thinks he can do.",
    "One of the greatest discoveries a man makes, one of his great surprises, is to find he can do what he was afraid he couldn't do.",
    "Enthusiasm is the sparkle in your eyes, the swing in your gait, the grip of your hand.",
    "Life is a series of experiences, each one of which makes us bigger.",
    
    // Enzo Ferrari (11 quotes)
    "Aerodynamics are for people who can't build engines.",
    "I build engines, the rest is done by others.",
    "If you can dream it, you can do it.",
    "The client is not always right.",
    "The most important victory is the one which has to be won against despair.",
    "What we have is not enough, we want more.",
    "I don't sell cars, I sell engines. The cars are just the packaging.",
    "You have to have the passion to succeed.",
    "The day I stop racing is the day I die.",
    "I have never been a spectator in my life.",
    "The best Ferrari is the one I haven't built yet.",
    
    // Soichiro Honda (10 quotes)
    "Success represents the 1% of your work which results from the 99% that is called failure.",
    "We only have one future, and it will be made of our dreams.",
    "If Honda does not race, there is no Honda.",
    "The value of life should be measured by the joy we feel.",
    "For me, the future is not in the past.",
    "We have a responsibility to consider the environment.",
    "The most important thing is to have a passion for your work.",
    "Success is not guaranteed. It is earned.",
    "We must look to the future with hope.",
    "The art of engineering is making the impossible possible.",
    
    // Carroll Shelby (10 quotes)
    "I'm an ex-wrecker driver, I'm a chicken farmer, and I'm a used car dealer. That's about it.",
    "There's no substitute for cubic inches.",
    "I'd rather have a car that handles well than one with a lot of horsepower.",
    "The key to success is to never give up.",
    "Speed costs money. How fast do you want to go?",
    "I've always been a racer, and I always will be.",
    "You can't make a race car out of a pig.",
    "The best cars are the ones that make you feel alive.",
    "Racing is life. Anything that happens before or after is just waiting.",
    "I never met a car I didn't want to drive.",
    
    // Ferdinand Porsche (10 quotes)
    "I couldn't find the sports car of my dreams, so I built it myself.",
    "Design is not just what it looks like. Design is how it works.",
    "The perfect racing car crosses the finish line first.",
    "Innovation is not about saying yes to everything. It's about saying no to all but the most crucial features.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "Engineering is the art of organizing and directing men.",
    "The automobile engine will come, and then I will consider my life's work complete.",
    "I have always been fascinated by the challenge of creating something new.",
    "The most beautiful car is the one that performs best.",
    "Excellence is never an accident. It is always the result of high intention."
  ];
  
  const automotiveNames = [
    // Henry Ford (11)
    "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford",
    // Enzo Ferrari (11)
    "Enzo Ferrari", "Enzo Ferrari", "Enzo Ferrari", "Enzo Ferrari", "Enzo Ferrari", "Enzo Ferrari", "Enzo Ferrari", "Enzo Ferrari", "Enzo Ferrari", "Enzo Ferrari", "Enzo Ferrari",
    // Soichiro Honda (10)
    "Soichiro Honda", "Soichiro Honda", "Soichiro Honda", "Soichiro Honda", "Soichiro Honda", "Soichiro Honda", "Soichiro Honda", "Soichiro Honda", "Soichiro Honda", "Soichiro Honda",
    // Carroll Shelby (10)
    "Carroll Shelby", "Carroll Shelby", "Carroll Shelby", "Carroll Shelby", "Carroll Shelby", "Carroll Shelby", "Carroll Shelby", "Carroll Shelby", "Carroll Shelby", "Carroll Shelby",
    // Ferdinand Porsche (10)
    "Ferdinand Porsche", "Ferdinand Porsche", "Ferdinand Porsche", "Ferdinand Porsche", "Ferdinand Porsche", "Ferdinand Porsche", "Ferdinand Porsche", "Ferdinand Porsche", "Ferdinand Porsche", "Ferdinand Porsche"
  ];
  
  // Get current week of year (0-51) to rotate through 52 quotes
  const getCurrentWeekQuote = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.floor(diff / oneWeek) % 52;
    return {
      quote: automotiveQuotes[weekNumber],
      expert: automotiveNames[weekNumber]
    };
  };
  
  const currentQuote = getCurrentWeekQuote();
  const [localPartsModalOpen, setLocalPartsModalOpen] = useState(false);
  const [buildMenuModalOpen, setBuildMenuModalOpen] = useState(false);
  const [selectedServiceOrders, setSelectedServiceOrders] = useState<RecipeCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState<'corner' | 'garage'>('corner');

  useEffect(() => {
    updateContext({ page: 'GearheadLounge' });
    
    // Load recipes from manual when Gearhead Lounge loads
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
        console.error('Error loading manual recipes:', err);
        // Initialize with empty array if there's an error
        setRecipes([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecipes();
  }, [updateContext, setRecipes, user?.id]);

  // Open modal for My Manual import
  const importFromManual = () => {
    if (!user) {
      alert(t('gearheadLounge.pleaseSignIn'));
      return;
    }
    setCookbookModalOpen(true);
  };

  // Handler for modal import - select a recipe to showcase
  const handleManualImport = async (selectedRecipe: any) => {
    console.log('Importing recipe:', selectedRecipe);
    
    if (!selectedRecipe) {
      console.error('No recipe selected');
      alert(t('gearheadLounge.errorNoRecipe'));
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
      
      alert(t('gearheadLounge.recipeSetToShowcase').replace('{title}', selectedRecipe.title));
      
    } catch (error) {
      console.error('Error importing recipe:', error);
      alert(t('gearheadLounge.failedToImport'));
    } finally {
      setCookbookModalOpen(false);
    }
  };

  return (
    <>
      <BuildDiagModal
        open={buildMenuModalOpen}
        onClose={() => setBuildMenuModalOpen(false)}
        onFindMarkets={(recipes: RecipeCard[]) => {
          setSelectedServiceOrders(recipes);
          setBuildMenuModalOpen(false);
          setLocalPartsModalOpen(true);
        }}
      />
      
      <LocalPartsModal
        open={localPartsModalOpen}
        onClose={() => setLocalPartsModalOpen(false)}
        selectedRecipes={selectedServiceOrders}
      />
      
      <div className="max-w-6xl mx-auto mt-8">
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
            🔧 {t('gearheadLounge.title')}
          </button>
          <button
            onClick={() => setActiveMobileTab('garage')}
            className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
              activeMobileTab === 'garage'
                ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🧪 {t('gearheadLounge.globalTestKitchenTab')}
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content - Gearhead Lounge Tab */}
          <div className={`lg:w-2/3 bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue ${
            activeMobileTab === 'corner' ? 'block' : 'hidden lg:block'
          }`}>
            {/* Gearhead Lounge header - moved back inside the module */}
            <div className="flex items-center justify-center mb-4">
              <span className="text-5xl mr-2">🔧</span>
              <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('gearheadLounge.title')}</h1>
            </div>
            
            {/* Separation line */}
            <hr className="border-t-2 border-maineBlue mb-6" />
            <div className="w-full mx-auto">
              {/* Shopping List - now at the top */}
              <section className="mb-8">
                <div className="bg-sand p-4 rounded-lg border border-black">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      {t('gearheadLounge.showcaseRecipe')}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBuildMenuModalOpen(true)}
                        className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black"
                      >
                        📋 {t('gearheadLounge.buildMenu')}
                      </button>
                      <button 
                        onClick={importFromManual} 
                        className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-gray-300"
                        disabled={isLoading}
                      >
                        {isLoading ? t('gearheadLounge.loading') : t('gearheadLounge.importFromCookbook')}
                      </button>
                    </div>
                  </div>
                  <ManualImportModal
                    open={cookbookModalOpen}
                    onClose={() => setCookbookModalOpen(false)}
                    onImport={handleManualImport}
                    existingIngredients={[]}
                  />
                  {showcaseRecipe ? (
                    <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-black overflow-hidden w-full min-h-[350px] mt-4 mx-auto relative">
                      <button
                        onClick={() => setShowcaseRecipe(null)}
                        className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"
                        title={t('gearheadLounge.removeShowcaseRecipe')}
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
                        <div className="font-semibold mb-1 mt-2">{t('gearheadLounge.ingredients')}</div>
                        <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                          {showcaseRecipe.ingredients?.length ? (
                            showcaseRecipe.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)
                          ) : (
                            <li className="italic text-gray-400">{t('gearheadLounge.noIngredientsListed')}</li>
                          )}
                        </ul>
                        {recipeNutrition && (
                          <div className="mt-2">
                            <div className="font-semibold mb-1">{t('gearheadLounge.nutritionTotal').replace('{servings}', servingSize.toString())}:</div>
                            <div className="text-sm">
                              <div>{t('gearheadLounge.carbs')}: {(recipeNutrition.carbs * servingSize).toFixed(1)}g</div>
                              <div>{t('gearheadLounge.sugars')}: {(recipeNutrition.sugars * servingSize).toFixed(1)}g</div>
                              <div>{t('gearheadLounge.fiber')}: {(recipeNutrition.fiber * servingSize).toFixed(1)}g</div>
                              <div>{t('gearheadLounge.protein')}: {(recipeNutrition.protein * servingSize).toFixed(1)}g</div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Right Page */}
                      <div className="flex-1 p-6 bg-white flex flex-col">
                        <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('gearheadLounge.instructions')}</h3>
                        <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                          {showcaseRecipe.instructions || (
                            <span className="italic text-gray-400">{t('gearheadLounge.noInstructionsProvided')}</span>
                          )}
                        </div>
                        {/* Equipment Section */}
                        {showcaseRecipe.equipment && showcaseRecipe.equipment.length > 0 && (
                          <>
                            <div className="font-semibold mt-4 mb-1">{t('gearheadLounge.equipmentNeeded')}</div>
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
                      {t('gearheadLounge.noRecipeSelected')}
                    </div>
                  )}
                </div>
              </section>

              {/* Automotive Quote of the Week */}
              <p className="text-center text-gray-600 italic mb-6">
                "{currentQuote.quote}" — {currentQuote.expert}
              </p>


            </div>
          {/* Desktop Layout - Parts Directory */}
          <div className="hidden lg:block">
            <div className="mb-6 mt-8">
              {/* Parts content can be added here if needed */}
            </div>
          </div>

        </div>

        {/* The Car Lift Tab - Mobile Only */}
        <div className={`lg:hidden ${
          activeMobileTab === 'garage' ? 'block' : 'hidden'
        }`}>
          <TheCarLift showcaseRecipe={showcaseRecipe} />
        </div>
        
        {/* Right Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:w-1/3 space-y-6">
          <TheCarLift showcaseRecipe={showcaseRecipe} />
        </div>
      </div>
    </div>
    </>
  );
};

export default GearheadLounge;


