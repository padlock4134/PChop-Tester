import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FloorFreddieWidget from './FloorFreddieWidget';
import { useFreddieContext } from '../../culinary/components/FreddieContext';
import { fetchCookbook } from '../../culinary/modules/cookbookSupabase';
import PlaybookImportModal from '../components/PlaybookImportModal';
import LocalSuppliersModal from '../components/LocalSuppliersModal';
import BuildProcessModal from '../components/BuildProcessModal';
import { useRecipeContext } from '../../culinary/components/RecipeContext';
import { RecipeCard } from '../components/ProcessMatcherModal';
import ProductionLine from '../components/GlobalTestFloor';
import { useSupabase } from '../../culinary/components/SupabaseProvider';
import { fetchNutritionData, calculateRecipeNutrition } from '../../culinary/api/nutritionService';
import { KeyNutrients } from '../../culinary/types/nutrition';

const ShopTalk = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { recipes, setRecipes } = useRecipeContext();
  const { user } = useSupabase();
  
  // Showcase recipe state
  const [showcaseRecipe, setShowcaseRecipe] = useState<any>(null);
  const [recipeNutrition, setRecipeNutrition] = useState<KeyNutrients | null>(null);
  const [servingSize, setServingSize] = useState(2);
  const [cookbookModalOpen, setCookbookModalOpen] = useState(false);
  
  // Manufacturing pioneers quotes rotation (52 quotes for weekly rotation)
  const pioneerQuotes = [
    // Henry Ford (11 quotes)
    "Quality means doing it right when no one is looking.",
    "Coming together is a beginning, staying together is progress, and working together is success.",
    "Failure is simply the opportunity to begin again, this time more intelligently.",
    "Anyone who stops learning is old, whether at twenty or eighty.",
    "Don't find fault, find a remedy.",
    "The only real mistake is the one from which we learn nothing.",
    "If everyone is moving forward together, then success takes care of itself.",
    "Before everything else, getting ready is the secret of success.",
    "Obstacles are those frightful things you see when you take your eyes off your goal.",
    "You can't build a reputation on what you are going to do.",
    "Thinking is the hardest work there is, which is probably the reason so few engage in it.",
    
    // Taiichi Ohno (11 quotes)
    "All we are doing is looking at the time line from the moment the customer gives us an order to the point when we collect the cash.",
    "The more inventory a company has, the less likely they will have what they need.",
    "Costs do not exist to be calculated. Costs exist to be reduced.",
    "Where there is no standard, there can be no improvement.",
    "Having no problems is the biggest problem of all.",
    "The key to the Toyota Way is not to be afraid of admitting mistakes.",
    "Something is wrong if workers do not look around each day, find things that are tedious or boring, and then rewrite the procedures.",
    "Progress cannot be generated when we are satisfied with existing situations.",
    "The slower but consistent tortoise causes less waste and is more desirable than the speedy hare that races ahead.",
    "People who can't understand numbers are useless.",
    "Make your workplace into showcase that can be understood by everyone at a glance.",
    
    // W. Edwards Deming (10 quotes)
    "Quality is everyone's responsibility.",
    "It is not enough to do your best; you must know what to do, and then do your best.",
    "Without data, you're just another person with an opinion.",
    "In God we trust, all others must bring data.",
    "Learning is not compulsory... neither is survival.",
    "A bad system will beat a good person every time.",
    "If you can't describe what you are doing as a process, you don't know what you're doing.",
    "The aim of leadership should be to improve the performance of man and machine.",
    "Innovation comes from the producer - not from the customer.",
    "Profit in business comes from repeat customers.",
    
    // Elon Musk (10 quotes)
    "The path to the CEO's office should not be through the CFO's office, and it should not be through the marketing department. It needs to be through engineering and design.",
    "I think it's very important to have a feedback loop, where you're constantly thinking about what you've done and how you could be doing it better.",
    "Failure is an option here. If things are not failing, you are not innovating enough.",
    "When something is important enough, you do it even if the odds are not in your favor.",
    "I could either watch it happen or be a part of it.",
    "Persistence is very important. You should not give up unless you are forced to give up.",
    "If you get up in the morning and think the future is going to be better, it is a bright day.",
    "Really pay attention to negative feedback and solicit it, particularly from friends.",
    "The first step is to establish that something is possible; then probability will occur.",
    "Work like hell. I mean you just have to put in 80 to 100 hour weeks every week.",
    
    // Thomas Edison (10 quotes)
    "There's a way to do it better - find it.",
    "I have not failed. I've just found 10,000 ways that won't work.",
    "Genius is one percent inspiration and ninety-nine percent perspiration.",
    "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.",
    "Opportunity is missed by most people because it is dressed in overalls and looks like work.",
    "The value of an idea lies in the using of it.",
    "To invent, you need a good imagination and a pile of junk.",
    "I never did a day's work in my life. It was all fun.",
    "Hell, there are no rules here - we're trying to accomplish something.",
    "Many of life's failures are people who did not realize how close they were to success when they gave up."
  ];
  
  const pioneerNames = [
    // Henry Ford (11)
    "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford", "Henry Ford",
    // Taiichi Ohno (11)
    "Taiichi Ohno", "Taiichi Ohno", "Taiichi Ohno", "Taiichi Ohno", "Taiichi Ohno", "Taiichi Ohno", "Taiichi Ohno", "Taiichi Ohno", "Taiichi Ohno", "Taiichi Ohno", "Taiichi Ohno",
    // W. Edwards Deming (10)
    "W. Edwards Deming", "W. Edwards Deming", "W. Edwards Deming", "W. Edwards Deming", "W. Edwards Deming", "W. Edwards Deming", "W. Edwards Deming", "W. Edwards Deming", "W. Edwards Deming", "W. Edwards Deming",
    // Elon Musk (10)
    "Elon Musk", "Elon Musk", "Elon Musk", "Elon Musk", "Elon Musk", "Elon Musk", "Elon Musk", "Elon Musk", "Elon Musk", "Elon Musk",
    // Thomas Edison (10)
    "Thomas Edison", "Thomas Edison", "Thomas Edison", "Thomas Edison", "Thomas Edison", "Thomas Edison", "Thomas Edison", "Thomas Edison", "Thomas Edison", "Thomas Edison"
  ];
  
  // Get current week of year (0-51) to rotate through 52 quotes
  const getCurrentWeekQuote = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.floor(diff / oneWeek) % 52;
    return {
      quote: pioneerQuotes[weekNumber],
      pioneer: pioneerNames[weekNumber]
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
      alert(t('shopTalk.pleaseSignIn'));
      return;
    }
    setCookbookModalOpen(true);
  };

  // Handler for modal import - select a recipe to showcase
  const handleCookBookImport = async (selectedRecipe: any) => {
    console.log('Importing recipe:', selectedRecipe);
    
    if (!selectedRecipe) {
      console.error('No recipe selected');
      alert(t('shopTalk.errorNoRecipe'));
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
      
      alert(t('shopTalk.recipeSetToShowcase').replace('{title}', selectedRecipe.title));
      
    } catch (error) {
      console.error('Error importing recipe:', error);
      alert(t('shopTalk.failedToImport'));
    } finally {
      setCookbookModalOpen(false);
    }
  };

  return (
    <>
      <BuildProcessModal
        open={buildMenuModalOpen}
        onClose={() => setBuildMenuModalOpen(false)}
        onFindMarkets={(recipes: RecipeCard[]) => {
          setSelectedMenuRecipes(recipes);
          setBuildMenuModalOpen(false);
          setLocalMarketsModalOpen(true);
        }}
      />
      
      <LocalSuppliersModal
        open={localMarketsModalOpen}
        onClose={() => setLocalMarketsModalOpen(false)}
        selectedRecipes={selectedMenuRecipes}
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
            🔧 {t('shopTalk.title')}
          </button>
          <button
            onClick={() => setActiveMobileTab('kitchen')}
            className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
              activeMobileTab === 'kitchen'
                ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🧪 {t('shopTalk.globalTestFloorTab')}
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content - Chef's Corner Tab */}
          <div className={`lg:w-2/3 bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue ${
            activeMobileTab === 'corner' ? 'block' : 'hidden lg:block'
          }`}>
            {/* Chef's Corner header - moved back inside the module */}
            <div className="flex items-center justify-center mb-4">
              <span className="text-5xl mr-2">🔧</span>
              <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('shopTalk.title')}</h1>
            </div>
            
            {/* Separation line */}
            <hr className="border-t-2 border-maineBlue mb-6" />
            <div className="w-full mx-auto">
              {/* Shopping List - now at the top */}
              <section className="mb-8">
                <div className="bg-sand p-4 rounded-lg border border-black">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Showcase Process:
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBuildMenuModalOpen(true)}
                        className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black"
                      >
                        📋 Build Production Plan
                      </button>
                      <button 
                        onClick={importFromCookBook} 
                        className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-gray-300"
                        disabled={isLoading}
                      >
                        {isLoading ? t('shopTalk.loading') : 'Import from Playbook'}
                      </button>
                    </div>
                  </div>
                  <PlaybookImportModal
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
                        title={t('shopTalk.removeShowcaseRecipe')}
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
                        <div className="font-semibold mb-1 mt-2">{t('shopTalk.ingredients')}</div>
                        <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                          {showcaseRecipe.ingredients?.length ? (
                            showcaseRecipe.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)
                          ) : (
                            <li className="italic text-gray-400">{t('shopTalk.noIngredientsListed')}</li>
                          )}
                        </ul>
                        {recipeNutrition && (
                          <div className="mt-2">
                            <div className="font-semibold mb-1">{t('shopTalk.nutritionTotal').replace('{servings}', servingSize.toString())}:</div>
                            <div className="text-sm">
                              <div>{t('shopTalk.carbs')}: {(recipeNutrition.carbs * servingSize).toFixed(1)}g</div>
                              <div>{t('shopTalk.sugars')}: {(recipeNutrition.sugars * servingSize).toFixed(1)}g</div>
                              <div>{t('shopTalk.fiber')}: {(recipeNutrition.fiber * servingSize).toFixed(1)}g</div>
                              <div>{t('shopTalk.protein')}: {(recipeNutrition.protein * servingSize).toFixed(1)}g</div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Right Page */}
                      <div className="flex-1 p-6 bg-white flex flex-col">
                        <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('shopTalk.instructions')}</h3>
                        <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                          {showcaseRecipe.instructions || (
                            <span className="italic text-gray-400">{t('shopTalk.noInstructionsProvided')}</span>
                          )}
                        </div>
                        {/* Equipment Section */}
                        {showcaseRecipe.equipment && showcaseRecipe.equipment.length > 0 && (
                          <>
                            <div className="font-semibold mt-4 mb-1">{t('shopTalk.equipmentNeeded')}</div>
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
                      No process selected. Import a process to showcase!
                    </div>
                  )}
                </div>
              </section>

              {/* Industry Leader Quote of the Week */}
              <p className="text-center text-gray-600 italic mb-6">
                "{currentQuote.quote}" — {currentQuote.pioneer}
              </p>


            </div>
          {/* Desktop Layout - Markets Directory */}
          <div className="hidden lg:block">
            <div className="mb-6 mt-8">
              {/* Market content can be added here if needed */}
            </div>
          </div>

        </div>

        {/* Production Line Tab - Mobile Only */}
        <div className={`lg:hidden ${
          activeMobileTab === 'kitchen' ? 'block' : 'hidden'
        }`}>
          <ProductionLine showcaseRecipe={showcaseRecipe} />
        </div>
        
        {/* Right Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:w-1/3 space-y-6">
          <ProductionLine showcaseRecipe={showcaseRecipe} />
          <FloorFreddieWidget />
        </div>
      </div>
    </div>
    </>
  );
};

export default ShopTalk;
