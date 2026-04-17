import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../components/DockFreddieContext';
import { fetchRunbook } from './cookbookSupabase';
import RunbookImportModal from '../components/RunbookImportModal';
import LocalWarehousesModal from '../components/LocalWarehousesModal';
import BuildRouteModal from '../components/BuildRouteModal';
import { useRouteContext } from '../components/RouteContext';
import { RouteCard } from '../components/RouteMatcherModal';
import { useSupabase } from '../components/SupabaseProvider';
import GlobalTestDock from '../components/GlobalTestDock';
import { fetchNutritionData, calculateRouteNutrition } from '../api/nutritionService';
import { KeyNutrients } from '../types/nutrition';

const DispatchLounge = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { routes, setRoutes } = useRouteContext();
  const { user } = useSupabase();
  
  // Showcase route state
  const [showcaseRoute, setShowcaseRoute] = useState<any>(null);
  const [routeNutrition, setRouteNutrition] = useState<KeyNutrients | null>(null);
  const [servingSize, setServingSize] = useState(2);
  const [runbookModalOpen, setRunbookModalOpen] = useState(false);
  
  // Dispatcher quotes rotation (52 quotes for weekly rotation)
  const dispatcherQuotes = [
    "Plan the route, then route the plan.",
    "On-time delivery starts with clean handoffs.",
    "Measure every run, improve every run.",
    "Consistency beats chaos in operations.",
    "Great dispatchers prevent problems before they surface.",
    "A clear manifest is half the job done.",
    "Safety and service can move together.",
    "Small process fixes compound into big gains.",
    "Inventory accuracy protects customer trust.",
    "Every delay has a root cause—find it.",
    "Reliable teams build reliable routes.",
    "Optimize for flow, not just speed."
  ];  
  const dispatcherNames = [
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
      quote: dispatcherQuotes[weekNumber],
      dispatcher: dispatcherNames[weekNumber]
    };
  };
  
  const currentQuote = getCurrentWeekQuote();
  const [localMarketsModalOpen, setLocalMarketsModalOpen] = useState(false);
  const [buildMenuModalOpen, setBuildMenuModalOpen] = useState(false);
  const [selectedMenuRoutes, setSelectedMenuRoutes] = useState<RouteCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState<'corner' | 'lab'>('corner');

  useEffect(() => {
    updateContext({ page: 'DispatchersCorner' });
    
    // Load routes from runbook when Dispatcher's Corner loads
    const loadRoutes = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const savedRoutes = await fetchRunbook(user.id);
        setRoutes(savedRoutes || []);
      } catch (err) {
        console.error('Error loading runbook routes:', err);
        // Initialize with empty array if there's an error
        setRoutes([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRoutes();
  }, [updateContext, setRoutes, user?.id]);

  // Open modal for My Runbook import
  const importFromRunbook = () => {
    if (!user) {
      alert(t('dispatchLounge.pleaseSignIn'));
      return;
    }
    setRunbookModalOpen(true);
  };

  // Handler for modal import - select a route to showcase
  const handleRunbookImport = async (selectedRoute: any) => {
    console.log('Importing route:', selectedRoute);
    
    if (!selectedRoute) {
      console.error('No route selected');
      alert(t('dispatchLounge.errorNoRecipe'));
      return;
    }

    try {
      // Set the selected route as the showcase route
      setShowcaseRoute(selectedRoute);
      
      // Calculate nutrition for the route
      if (selectedRoute.items && Array.isArray(selectedRoute.items)) {
        try {
          const nutrition = await calculateRouteNutrition(selectedRoute.items);
          setRouteNutrition(nutrition);
        } catch (error) {
          console.error('Error calculating nutrition:', error);
          setRouteNutrition(null);
        }
      } else {
        setRouteNutrition(null);
      }
      
      alert(t('dispatchLounge.recipeSetToShowcase').replace('{title}', selectedRoute.title));
      
    } catch (error) {
      console.error('Error importing route:', error);
      alert(t('dispatchLounge.failedToImport'));
    } finally {
      setRunbookModalOpen(false);
    }
  };

  return (
    <>
      <BuildRouteModal
        open={buildMenuModalOpen}
        onClose={() => setBuildMenuModalOpen(false)}
        onFindMarkets={(routes: RouteCard[]) => {
          setSelectedMenuRoutes(routes);
          setBuildMenuModalOpen(false);
          setLocalMarketsModalOpen(true);
        }}
      />
      
      <LocalWarehousesModal
        open={localMarketsModalOpen}
        onClose={() => setLocalMarketsModalOpen(false)}
        selectedRoutes={selectedMenuRoutes}
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
            📦 {t('dispatchLounge.title')}
          </button>
          <button
            onClick={() => setActiveMobileTab('lab')}
            className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
              activeMobileTab === 'lab'
                ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🧪 {t('dispatchLounge.globalTestKitchenTab')}
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content - Dispatcher's Corner Tab */}
          <div className={`lg:w-2/3 bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue ${
            activeMobileTab === 'corner' ? 'block' : 'hidden lg:block'
          }`}>
            {/* Dispatcher's Corner header - moved back inside the module */}
            <div className="flex items-center justify-center mb-4">
              <span className="text-5xl mr-2">📦</span>
              <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('dispatchLounge.title')}</h1>
            </div>
            
            {/* Separation line */}
            <hr className="border-t-2 border-maineBlue mb-6" />
            <div className="w-full mx-auto">
              {/* Shopping List - now at the top */}
              <section className="mb-8">
                <div className="bg-sand p-4 rounded-lg border border-black">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      {t('dispatchLounge.showcaseRecipe')}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setBuildMenuModalOpen(true)}
                        className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black"
                      >
                        📋 {t('dispatchLounge.buildMenu')}
                      </button>
                      <button 
                        onClick={importFromRunbook} 
                        className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-gray-300"
                        disabled={isLoading}
                      >
                        {isLoading ? t('dispatchLounge.loading') : t('dispatchLounge.importFromCookbook')}
                      </button>
                    </div>
                  </div>
                  <RunbookImportModal
                    open={runbookModalOpen}
                    onClose={() => setRunbookModalOpen(false)}
                    onImport={handleRunbookImport}
                    existingItems={[]}
                  />
                  {showcaseRoute ? (
                    <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-black overflow-hidden w-full min-h-[350px] mt-4 mx-auto relative">
                      <button
                        onClick={() => setShowcaseRoute(null)}
                        className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"
                        title={t('dispatchLounge.removeShowcaseRecipe')}
                      >
                        <span className="text-red-500 font-bold text-lg">✕</span>
                      </button>
                      {/* Left Page */}
                      <div className="flex-1 p-6 bg-weatheredWhite border-r border-gray-200 flex flex-col">
                        {showcaseRoute.image && (
                          <img
                            src={showcaseRoute.image}
                            alt={showcaseRoute.title}
                            className="rounded-lg w-full h-32 object-cover mb-4"
                            style={{ objectFit: 'cover' }}
                          />
                        )}
                        <h3 className="font-bold text-xl mb-1 text-maineBlue">{showcaseRoute.title}</h3>
                        <div className="font-semibold mb-1 mt-2">{t('dispatchLounge.ingredients')}</div>
                        <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                          {showcaseRoute.items?.length ? (
                            showcaseRoute.items.map((ing: string, i: number) => <li key={i}>{ing}</li>)
                          ) : (
                            <li className="italic text-gray-400">{t('dispatchLounge.noIngredientsListed')}</li>
                          )}
                        </ul>
                        {routeNutrition && (
                          <div className="mt-2">
                            <div className="font-semibold mb-1">{t('dispatchLounge.nutritionTotal').replace('{servings}', servingSize.toString())}:</div>
                            <div className="text-sm">
                              <div>{t('dispatchLounge.carbs')}: {(routeNutrition.carbs * servingSize).toFixed(1)}g</div>
                              <div>{t('dispatchLounge.sugars')}: {(routeNutrition.sugars * servingSize).toFixed(1)}g</div>
                              <div>{t('dispatchLounge.fiber')}: {(routeNutrition.fiber * servingSize).toFixed(1)}g</div>
                              <div>{t('dispatchLounge.protein')}: {(routeNutrition.protein * servingSize).toFixed(1)}g</div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Right Page */}
                      <div className="flex-1 p-6 bg-white flex flex-col">
                        <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('dispatchLounge.instructions')}</h3>
                        <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                          {showcaseRoute.instructions || (
                            <span className="italic text-gray-400">{t('dispatchLounge.noInstructionsProvided')}</span>
                          )}
                        </div>
                        {/* Equipment Section */}
                        {showcaseRoute.equipment && showcaseRoute.equipment.length > 0 && (
                          <>
                            <div className="font-semibold mt-4 mb-1">{t('dispatchLounge.equipmentNeeded')}</div>
                            <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                              {showcaseRoute.equipment.map((eq: string, i: number) => (
                                <li key={i}>{eq}</li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-gray-400 italic text-center">
                      {t('dispatchLounge.noRecipeSelected')}
                    </div>
                  )}
                </div>
              </section>

              {/* Dispatcher Quote of the Week */}
              <p className="text-center text-gray-600 italic mb-6">
                "{currentQuote.quote}" — {currentQuote.dispatcher}
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
          <GlobalTestDock showcaseRoute={showcaseRoute} />
        </div>
        
        {/* Right Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:w-1/3 space-y-6">
          <GlobalTestDock showcaseRoute={showcaseRoute} />
        </div>
      </div>
    </div>
    </>
  );
};

export default DispatchLounge;

