import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import i18n from 'i18next';

import { useFreddieContext } from '../components/PipeFreddieContext';

import { getPlumberQuoteOfTheDay } from './MyPipeBook';

import { fetchPipeBook } from './pipebookSupabase';

import PipeBookImportModal from '../components/PipeBookImportModal';

import LocalSupplyHouseModal from '../components/LocalSupplyHouseModal';

import BuildLayoutModal from '../components/BuildLayoutModal';

import { useRecipeContext } from '../components/FitContext';

import { RecipeCard } from '../components/FitMatcherModal';

import GlobalTestVan from '../components/GlobalTestVan';

import { useSupabase } from '../components/SupabaseProvider';

import { fetchNutritionData, calculateRecipeNutrition } from '../api/nutritionService';

import { KeyNutrients } from '../types/nutrition';



const PipeLounge = () => {

  const { t } = useTranslation();

  const { updateContext } = useFreddieContext();

  const { fits, setRecipes } = useRecipeContext();

  const { user } = useSupabase();

  

  // Showcase fit state

  const [showcaseRecipe, setShowcaseRecipe] = useState<any>(null);

  const [recipeNutrition, setRecipeNutrition] = useState<KeyNutrients | null>(null);

  const [servingSize, setServingSize] = useState(2);

  const [pipebookModalOpen, setPipeBookModalOpen] = useState(false);

  

  // Localized plumber quote of the day (reuses MyPipeBook's localized quotes)

  const currentQuote = getPlumberQuoteOfTheDay(i18n.language);

  const [localMarketsModalOpen, setLocalMarketsModalOpen] = useState(false);

  const [buildMenuModalOpen, setBuildMenuModalOpen] = useState(false);

  const [selectedMenuRecipes, setSelectedMenuRecipes] = useState<RecipeCard[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [activeMobileTab, setActiveMobileTab] = useState<'corner' | 'lab'>('corner');



  useEffect(() => {

    updateContext({ page: 'ChefsCorner' });

    

    // Load fits from pipebook when Mentor's Corner loads

    const loadRecipes = async () => {

      if (!user?.id) {

        setIsLoading(false);

        return;

      }

      

      try {

        setIsLoading(true);

        const savedRecipes = await fetchPipeBook(user.id);

        setRecipes(savedRecipes || []);

      } catch (err) {

        console.error('Error loading pipebook fits:', err);

        // Initialize with empty array if there's an error

        setRecipes([]);

      } finally {

        setIsLoading(false);

      }

    };

    

    loadRecipes();

  }, [updateContext, setRecipes, user?.id]);



  // Open modal for My PipeBook import

  const importFromPipeBook = () => {

    if (!user) {

      alert(t('pipeLounge.pleaseSignIn'));

      return;

    }

    setPipeBookModalOpen(true);

  };



  // Handler for modal import - select a fit to showcase

  const handlePipeBookImport = async (selectedRecipe: any) => {

    console.log('Importing fit:', selectedRecipe);

    

    if (!selectedRecipe) {

      console.error('No fit selected');

      alert(t('pipeLounge.errorNoRecipe'));

      return;

    }



    try {

      // Set the selected fit as the showcase fit

      setShowcaseRecipe(selectedRecipe);

      

      // Calculate nutrition for the fit

      if (selectedRecipe.materials && Array.isArray(selectedRecipe.materials)) {

        try {

          const nutrition = await calculateRecipeNutrition(selectedRecipe.materials);

          setRecipeNutrition(nutrition);

        } catch (error) {

          console.error('Error calculating nutrition:', error);

          setRecipeNutrition(null);

        }

      } else {

        setRecipeNutrition(null);

      }

      

      alert(t('pipeLounge.recipeSetToShowcase').replace('{title}', selectedRecipe.title));

      

    } catch (error) {

      console.error('Error importing fit:', error);

      alert(t('pipeLounge.failedToImport'));

    } finally {

      setPipeBookModalOpen(false);

    }

  };



  return (

    <>

      <BuildLayoutModal

        open={buildMenuModalOpen}

        onClose={() => setBuildMenuModalOpen(false)}

        onFindMarkets={(fits: RecipeCard[]) => {

          setSelectedMenuRecipes(fits);

          setBuildMenuModalOpen(false);

          setLocalMarketsModalOpen(true);

        }}

      />

      

      <LocalSupplyHouseModal

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

            🔩 {t('pipeLounge.title')}

          </button>

          <button

            onClick={() => setActiveMobileTab('lab')}

            className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${

              activeMobileTab === 'lab'

                ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'

                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'

            }`}

          >

            🧪 {t('pipeLounge.globalTestKitchenTab')}

          </button>

        </div>

        

        <div className="flex flex-col lg:flex-row gap-6 lg:h-full lg:justify-center">

          {/* Main Content - Mentor's Corner Tab */}

          <div className={`lg:w-[66.666%] bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue flex flex-col h-full lg:min-h-[620px] ${

            activeMobileTab === 'corner' ? 'flex' : 'hidden lg:flex'

          }`}>

            {/* Mentor's Corner header - moved back inside the module */}

            <div className="flex items-center justify-center mb-4">

              <span className="text-5xl mr-2">🔩</span>

              <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('pipeLounge.title')}</h1>

            </div>

            

            {/* Separation line */}

            <hr className="border-t-2 border-maineBlue mb-6" />

            <div className="w-full mx-auto">

              {/* Shopping List - now at the top */}

              <section className="mb-8">

                <div className="bg-sand p-4 rounded-lg border border-black">

                  <div className="flex items-center justify-between mb-3">

                    <label className="text-sm font-semibold text-gray-700">

                      {t('pipeLounge.showcaseRecipe')}

                    </label>

                    <div className="flex gap-2">

                      <button

                        onClick={() => setBuildMenuModalOpen(true)}

                        className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black"

                      >

                        📋 {t('pipeLounge.buildMenu')}

                      </button>

                      <button 

                        onClick={importFromPipeBook} 

                        className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-gray-300"

                        disabled={isLoading}

                      >

                        {isLoading ? t('pipeLounge.loading') : t('pipeLounge.importFromCookbook')}

                      </button>

                    </div>

                  </div>

                  <PipeBookImportModal

                    open={pipebookModalOpen}

                    onClose={() => setPipeBookModalOpen(false)}

                    onImport={handlePipeBookImport}

                    existingMaterials={[]}

                  />

                  {showcaseRecipe ? (

                    <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-black overflow-hidden w-full min-h-[350px] mt-4 mx-auto relative">

                      <button

                        onClick={() => setShowcaseRecipe(null)}

                        className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"

                        title={t('pipeLounge.removeShowcaseRecipe')}

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

                        <div className="font-semibold mb-1 mt-2">{t('pipeLounge.ingredients')}</div>

                        <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">

                          {showcaseRecipe.materials?.length ? (

                            showcaseRecipe.materials.map((ing: string, i: number) => <li key={i}>{ing}</li>)

                          ) : (

                            <li className="italic text-gray-400">{t('pipeLounge.noIngredientsListed')}</li>

                          )}

                        </ul>

                        {recipeNutrition && (

                          <div className="mt-2">

                            <div className="font-semibold mb-1">{t('pipeLounge.nutritionTotal').replace('{servings}', servingSize.toString())}:</div>

                            <div className="text-sm">

                              <div>{t('pipeLounge.carbs')}: {(recipeNutrition.carbs * servingSize).toFixed(1)}g</div>

                              <div>{t('pipeLounge.sugars')}: {(recipeNutrition.sugars * servingSize).toFixed(1)}g</div>

                              <div>{t('pipeLounge.fiber')}: {(recipeNutrition.fiber * servingSize).toFixed(1)}g</div>

                              <div>{t('pipeLounge.protein')}: {(recipeNutrition.protein * servingSize).toFixed(1)}g</div>

                            </div>

                          </div>

                        )}

                      </div>

                      {/* Right Page */}

                      <div className="flex-1 p-6 bg-white flex flex-col">

                        <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('pipeLounge.instructions')}</h3>

                        <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">

                          {showcaseRecipe.instructions || (

                            <span className="italic text-gray-400">{t('pipeLounge.noInstructionsProvided')}</span>

                          )}

                        </div>

                        {/* Equipment Section */}

                        {showcaseRecipe.equipment && showcaseRecipe.equipment.length > 0 && (

                          <>

                            <div className="font-semibold mt-4 mb-1">{t('pipeLounge.equipmentNeeded')}</div>

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

                      {t('pipeLounge.noRecipeSelected')}

                    </div>

                  )}

                </div>

              </section>



              {/* Mentor Quote of the Week */}

              <p className="text-center text-gray-600 italic mb-6">

                "{currentQuote.quote}" — {currentQuote.professional}

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

          <GlobalTestVan showcaseRecipe={showcaseRecipe} />

        </div>

        

        {/* Right Sidebar - Desktop Only */}

        <div className="hidden lg:block lg:w-[28.333%] lg:h-full">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue overflow-hidden w-full h-full lg:min-h-[620px] flex flex-col">
            <div className="p-4 flex-1 min-h-0 overflow-y-auto">
              <GlobalTestVan showcaseRecipe={showcaseRecipe} />
            </div>
          </div>
        </div>

      </div>

    </div>

    </>

  );

};



export default PipeLounge;



