import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../components/SiteFreddieContext';
import { fetchCookbook } from './cookbookSupabase';
import BlueprintImportModal from '../components/BlueprintImportModal';
import LocalYardsModal from '../components/LocalYardsModal';
import BuildPlanModal from '../components/BuildPlanModal';
import { useRecipeContext } from '../components/TaskContext';
import { RecipeCard } from '../components/TaskMatcherModal';
import { useSupabase } from '../../../components/DisciplineSupabaseProvider';
import GlobalTestSite from '../components/GlobalTestSite';
import { fetchNutritionData, calculateRecipeNutrition } from '../api/nutritionService';
import { KeyNutrients } from '../types/nutrition';

const HardhatHub = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { recipes, setRecipes } = useRecipeContext();
  const { user, isLoading: authLoading } = useSupabase();
  
  // Showcase recipe state
  const [showcaseRecipe, setShowcaseRecipe] = useState<any>(null);
  const [recipeNutrition, setRecipeNutrition] = useState<KeyNutrients | null>(null);
  const [servingSize, setServingSize] = useState(2);
  const [cookbookModalOpen, setCookbookModalOpen] = useState(false);
  
  // Chef quotes rotation (52 quotes for weekly rotation)
  const chefQuotes = [
    // Julia Child (11 quotes)
    "Cooking is not about convenience. It's about love, patience, and bringing people together around the table.",
    "Never apologize for learning your trade.",
    "A party without cake is just a meeting.",
    "The secret of mastering a trade is to love the process.",
    "Learn your trade - try new projects, learn from mistakes, be fearless, and have fun improving.",
    "You'll never know everything about anything, especially something you love.",
    "The only bad training day is the one where you stop learning.",
    "I started late, but consistent practice changed everything.",
    "Cooking is one of the great pleasures of life.",
    "Find something you're passionate about and keep tremendously interested in it.",
    "Life itself is the proper binge.",
    
    // Anthony Bourdain (11 quotes)
    "Your body is not a temple, it's an amusement park. Enjoy the ride.",
    "Travel changes you. As you move through this life and this world you change things slightly.",
    "Skills can be taught. Character you either have or you don't have.",
    "Good food is very often, even most often, simple food.",
    "Context and memory play powerful roles in all the truly great meals in one's life.",
    "I'm not afraid to look like an idiot.",
    "The way you make an omelet reveals your character.",
    "Assume the worst. About everybody. But don't let this poisoned outlook affect your job performance.",
    "Food is everything we are. It's an extension of nationalist feeling, ethnic feeling, your personal history.",
    "I don't have to agree with you to like you or respect you.",
    "Poor work happens without pride; craftsmanship starts with ownership and care.",
    
    // David Chang (10 quotes)
    "Cooking is an expression of the land where you are and the culture of that place.",
    "The greatest dishes are very simple.",
    "I'm grasping with how you do something on a large scale with multiple operations.",
    "Great work is built by collaborating with people you trust and respect.",
    "I constantly think about what it means to be Asian-American.",
    "Rage or fear... It oscillates. Rage I can handle. Fear is the problem.",
    "Contemporary ramen is totally different than what most Americans think ramen should be.",
    "I love the masochistic aspect of eating seething, spicy food and being tortured by it.",
    "We're hoping to succeed; we're okay with failure. We just don't want to land in between.",
    "I think the basic thing every learner can master is solid process and standards.",
    
    // Martha Stewart (10 quotes)
    "Life is too complicated not to be orderly.",
    "I find that when you have a real interest in life and a curious life, that sleep is not the most important thing.",
    "I catnap now and then, but I think while I nap, so it's not a waste of time.",
    "Getting over those times and overcoming those difficulties really makes you appreciate the good times.",
    "I am always asking myself how I can improve the lives of my customers, my colleagues, my shareholders.",
    "The ultimate goal is to be an interesting, useful, wholesome person.",
    "Small repeatable tasks build the discipline needed for big outcomes.",
    "Without an open-minded mind, you can never be a great success.",
    "I love the challenge of starting at zero every day and seeing how much I can accomplish.",
    "Never make a big decision without sleeping on it.",
    
    // Emeril Lagasse (10 quotes)
    "Technical work is more than steps and tools; it's about focus and pride.",
    "My philosophy is: If you can't have fun, there's no sense in doing it.",
    "The cool thing about being famous is traveling. I have always wanted to travel across seas.",
    "I think you've got to keep it simple, keep it fresh. Stay away from all that processed stuff.",
    "Spice is life. It depends upon what you like... have fun with it. Yes, food is serious, but you should have fun with it.",
    "I wouldn't ask any of my employees to do anything I wouldn't do. And I work very hard.",
    "You know, for 300 years it's been kind of the same. There are restaurants in New Orleans that the menu hasn't changed in 125 years.",
    "I think preparing food and feeding people brings nourishment not only to our bodies but to our spirits.",
    "We'll be going to the fish market and a farmer's market this afternoon to get what we need to make 13 fish dishes.",
    "Everyone needs a mentor."
  ];
  
  const chefNames = [
    // Julia Child (11)
    "Julia Child", "Julia Child", "Julia Child", "Julia Child", "Julia Child", "Julia Child", "Julia Child", "Julia Child", "Julia Child", "Julia Child", "Julia Child",
    // Anthony Bourdain (11)
    "Anthony Bourdain", "Anthony Bourdain", "Anthony Bourdain", "Anthony Bourdain", "Anthony Bourdain", "Anthony Bourdain", "Anthony Bourdain", "Anthony Bourdain", "Anthony Bourdain", "Anthony Bourdain", "Anthony Bourdain",
    // David Chang (10)
    "David Chang", "David Chang", "David Chang", "David Chang", "David Chang", "David Chang", "David Chang", "David Chang", "David Chang", "David Chang",
    // Martha Stewart (10)
    "Martha Stewart", "Martha Stewart", "Martha Stewart", "Martha Stewart", "Martha Stewart", "Martha Stewart", "Martha Stewart", "Martha Stewart", "Martha Stewart", "Martha Stewart",
    // Emeril Lagasse (10)
    "Emeril Lagasse", "Emeril Lagasse", "Emeril Lagasse", "Emeril Lagasse", "Emeril Lagasse", "Emeril Lagasse", "Emeril Lagasse", "Emeril Lagasse", "Emeril Lagasse", "Emeril Lagasse"
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
  const [activeMobileTab, setActiveMobileTab] = useState<'corner' | 'lab'>('corner');

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
    if (authLoading) return;
    if (!user) {
      alert(t('hardhatHub.pleaseSignIn'));
      return;
    }
    setCookbookModalOpen(true);
  };

  // Handler for modal import - select a recipe to showcase
  const handleCookBookImport = async (selectedRecipe: any) => {
    console.log('Importing recipe:', selectedRecipe);
    
    if (!selectedRecipe) {
      console.error('No recipe selected');
      alert(t('hardhatHub.errorNoRecipe'));
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
      
      alert(t('hardhatHub.recipeSetToShowcase').replace('{title}', selectedRecipe.title));
      
    } catch (error) {
      console.error('Error importing recipe:', error);
      alert(t('hardhatHub.failedToImport'));
    } finally {
      setCookbookModalOpen(false);
    }
  };

  return (
    <>
      <BuildPlanModal
        open={buildMenuModalOpen}
        onClose={() => setBuildMenuModalOpen(false)}
        onFindMarkets={(recipes: RecipeCard[]) => {
          setSelectedMenuRecipes(recipes);
          setBuildMenuModalOpen(false);
          setLocalMarketsModalOpen(true);
        }}
      />
      
      <LocalYardsModal
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
            ⛑️ {t('hardhatHub.title')}
          </button>
          <button
            onClick={() => setActiveMobileTab('lab')}
            className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
              activeMobileTab === 'lab'
                ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🧪 {t('hardhatHub.globalTestKitchenTab')}
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 lg:h-full lg:justify-center">
          {/* Main Content - Chef's Corner Tab */}
          <div className={`lg:w-[66.666%] bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue flex flex-col h-full lg:min-h-[620px] ${
            activeMobileTab === 'corner' ? 'flex' : 'hidden lg:flex'
          }`}>
            {/* Chef's Corner header - moved back inside the module */}
            <div className="flex items-center justify-center mb-4">
              <span className="text-5xl mr-2">⛑️</span>
              <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('hardhatHub.title')}</h1>
            </div>
            
            {/* Separation line */}
            <hr className="border-t-2 border-maineBlue mb-6" />
            <div className="w-full mx-auto">
              {/* Shopping List - now at the top */}
              <section className="mb-8">
                <div className="bg-sand p-4 rounded-lg border border-black">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      {t('hardhatHub.showcaseRecipe')}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBuildMenuModalOpen(true)}
                        className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black"
                      >
                        📋 {t('hardhatHub.buildMenu')}
                      </button>
                      <button 
                        onClick={importFromCookBook} 
                        className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-gray-300"
                        disabled={isLoading || authLoading}
                      >
                        {isLoading ? t('hardhatHub.loading') : t('hardhatHub.importFromCookbook')}
                      </button>
                    </div>
                  </div>
                  <BlueprintImportModal
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
                        title={t('hardhatHub.removeShowcaseRecipe')}
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
                        <div className="font-semibold mb-1 mt-2">{t('hardhatHub.ingredients')}</div>
                        <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                          {showcaseRecipe.ingredients?.length ? (
                            showcaseRecipe.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)
                          ) : (
                            <li className="italic text-gray-400">{t('hardhatHub.noIngredientsListed')}</li>
                          )}
                        </ul>
                        {recipeNutrition && (
                          <div className="mt-2">
                            <div className="font-semibold mb-1">{t('hardhatHub.nutritionTotal').replace('{servings}', servingSize.toString())}:</div>
                            <div className="text-sm">
                              <div>{t('hardhatHub.carbs')}: {(recipeNutrition.carbs * servingSize).toFixed(1)}g</div>
                              <div>{t('hardhatHub.sugars')}: {(recipeNutrition.sugars * servingSize).toFixed(1)}g</div>
                              <div>{t('hardhatHub.fiber')}: {(recipeNutrition.fiber * servingSize).toFixed(1)}g</div>
                              <div>{t('hardhatHub.protein')}: {(recipeNutrition.protein * servingSize).toFixed(1)}g</div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Right Page */}
                      <div className="flex-1 p-6 bg-white flex flex-col">
                        <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('hardhatHub.instructions')}</h3>
                        <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                          {showcaseRecipe.instructions || (
                            <span className="italic text-gray-400">{t('hardhatHub.noInstructionsProvided')}</span>
                          )}
                        </div>
                        {/* Equipment Section */}
                        {showcaseRecipe.equipment && showcaseRecipe.equipment.length > 0 && (
                          <>
                            <div className="font-semibold mt-4 mb-1">{t('hardhatHub.equipmentNeeded')}</div>
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
                      {t('hardhatHub.noRecipeSelected')}
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
          activeMobileTab === 'lab' ? 'block' : 'hidden'
        }`}>
          <GlobalTestSite showcaseRecipe={showcaseRecipe} />
        </div>
        
        {/* Right Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:w-[28.333%] lg:h-full">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue overflow-hidden w-full h-full lg:min-h-[620px] flex flex-col">
            <GlobalTestSite showcaseRecipe={showcaseRecipe} />
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default HardhatHub;
