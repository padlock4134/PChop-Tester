import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../components/DockFreddieContext';
import VideoModal from '../components/VideoModal';
import { useRouteContext } from '../components/RouteContext';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';
import { getMainEquipment, getMainItem } from '../utils/mainSelectors';
import { fetchNutritionData, calculateRouteNutrition } from '../api/nutritionService';
import { KeyNutrients } from '../types/nutrition';
import SyllabusCard from '../components/SyllabusCard';
import ShipmentTimer from '../components/ShipmentTimer';
import DockPracticeModal from '../components/DockPracticeModal';
import { supabase } from '../api/supabaseClient';
import { useCurriculumSyllabus } from '../../../hooks/useCurriculumSyllabus';


function getDefaultTutorials() {
  return [
    {
      title: 'Warehouse Safety Basics',
      desc: 'Learn dock safety, PPE, pedestrian awareness, and safe material-handling habits.',
      type: 'cooking_tutorial',
      query: 'warehouse safety basics dock PPE material handling training'
    },
    {
      title: 'Load Planning Basics',
      desc: 'Practice organizing routes, staging freight, checking labels, and planning efficient loads.',
      type: 'cooking_tutorial',
      query: 'load planning basics logistics route staging freight labels tutorial'
    }
  ];
}

function getTwoTutorials(route: any) {
  if (!route) return [];
  return [
    {
      title: `Let\'s Move This Shipment!`,
      desc: `Step-by-step logistics walkthrough for ${route.title}.`,
      type: 'cooking_tutorial'
    },
    {
      title: 'Route, Load & Safety Check',
      desc: `Review route planning, load checks, and safety steps for ${route.title}.`,
      type: 'cooking_tutorial',
      query: `${route.title} logistics route load planning safety tutorial`
    }
  ];
}


const LogisticsSchool = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { selectedRoute } = useRouteContext();
  console.log('Logistics School - Shipment data:', selectedRoute?.nutrition);
  console.log('Logistics School - Full Operation:', selectedRoute);
  const [modalIdx, setModalIdx] = useState<null | number>(null);
  const [routeNutrition, setRouteNutrition] = useState<KeyNutrients | null>(null);
  const [servingSize, setServingSize] = useState(2);
  const [benchPracticeOpen, setBenchPracticeOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'school' | 'syllabus'>('school');
  const syllabusData = useCurriculumSyllabus(supabase, 'logistics');

  const handleLessonClick = (lessonId: string) => {
    console.log(`Navigating to lesson: ${lessonId}`);
  };

  useEffect(() => {
    updateContext({ page: 'LogisticsSchool' });
  }, [updateContext]);

  useEffect(() => {
    if (selectedRoute && !selectedRoute.nutrition) {
      // Calculate nutrition if missing
      calculateRouteNutrition(selectedRoute.items)
        .then(nutrition => {
          setRouteNutrition(nutrition);
        })
        .catch(error => {
          console.error('Error calculating nutrition:', error);
        });
    } else {
      setRouteNutrition(selectedRoute?.nutrition || null);
    }
  }, [selectedRoute]);

  const isRouteSelected = !!selectedRoute;
  const tutorials = isRouteSelected ? getTwoTutorials(selectedRoute) : getDefaultTutorials();
  const [videoUrls, setVideoUrls] = useState<(string | null)[]>([null, null]);

  // Helper: extract primary material from components
  function getMainProtein(items: string[] = []) {
    const proteins = [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'clam', 'crab', 'lobster',
      'tofu', 'turkey', 'duck', 'lamb', 'egg', 'eggs', 'scallop', 'scallops', 'mussels', 'steak',
      'bacon', 'sausage', 'ham', 'vegan', 'tempeh', 'seitan', 'octopus', 'squid', 'anchovy', 'anchovies'
    ];
    return items.find(ing => proteins.some(p => ing.toLowerCase().includes(p)));
  }
  // Helper: extract main equipment from equipment array
  function getMainEquipment(equipment: string[] = []) {
    const priorities = [
      'pan', 'pot', 'oven', 'grill', 'skillet', 'wok', 'baking sheet', 'slow cooker', 'pressure cooker', 'air fryer', 'broiler', 'deep fryer', 'steamer', 'microwave', 'toaster oven'
    ];
    for (const p of priorities) {
      const found = equipment.find(eq => eq.toLowerCase().includes(p));
      if (found) return found;
    }
    return equipment[0] || '';
  }

  // Helper to call Dispatcher Freddie backend for a smart search query
  async function getVideoQueryFromFreddie(route: any, tut: any, idx: any) {
    let query = '';

    if (tut.query) {
      return tut.query;
    }

    // Handle different tutorial types
    if (tut.type === 'weekly_technique') {
      // For technique of the week, search for the specific technique
      query = `how to ${tut.techniqueData.title.toLowerCase()} trade technique`;
    } else if (tut.type === 'cooking_tutorial') {
      // For task tutorials, focus on the project
      const mainProtein = getMainProtein(route.items || []);
      const mainEquipment = getMainEquipment(route.equipment || []);
      if (mainProtein && mainEquipment) {
        query = `How to cook ${mainProtein} using ${mainEquipment}`;
      } else if (mainProtein) {
        query = `How to cook ${mainProtein}`;
      } else {
        query = `how to complete ${route.title}`;
      }
    } else {
      // Legacy fallback for older tutorial formats
      if (typeof idx === 'number' && idx === 2 && route && route.title) {
        return route.title;
      }

      // Use Dispatcher Freddie for complex queries
      const prompt = `
        Given the following project and tutorial step, generate a concise YouTube search query for a relevant trade training video.\n
        - Only use the equipment and items listed.\n
        - Do NOT include unrelated tools or techniques.\n
        - The query should be specific to the step and route.\n
        Route: ${route.title}\n
        Items: ${route.items?.join(', ')}\n
        Equipment: ${route.equipment?.join(', ') || 'N/A'}\n
        Step Title: ${tut.title}\n
        Step Description: ${tut.desc}\n
        Query:
      `;
      try {
        const res = await fetch('/api/dispatcherFreddieQuery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        query = data.query || tut.title + ' ' + (route.title || '');
      } catch {
        query = tut.title + ' ' + (route.title || '');
      }
    }

    return query;
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchVideos() {
      // Now using API key rotation system for better quota management
      console.log('[LogisticsSchool] Fetching videos with API key rotation');
      console.log('[LogisticsSchool] Tutorials to fetch:', tutorials);
      console.log('[LogisticsSchool] Selected operation:', selectedRoute);

      const newUrls: (string | null)[] = [null, null];
      await Promise.all(tutorials.map(async (tut, idx) => {
        try {
          // Use the improved video query generation that handles different tutorial types
          const query = await getVideoQueryFromFreddie(
            selectedRoute || { title: '', items: [], equipment: [] },
            tut,
            idx
          );

          console.log(`[LogisticsSchool] Tutorial ${idx} (${tut.type || 'legacy'}) query:`, query);

          const result: TutorialVideoResult = await getTutorialVideo(query);
          console.log(`[LogisticsSchool] Tutorial ${idx} result:`, result);

          if (result && result.url) {
            newUrls[idx] = result.url;
          }
        } catch (error) {
          console.error(`[LogisticsSchool] Error fetching video for tutorial ${idx}:`, error);
        }
      }));

      if (!cancelled) setVideoUrls(newUrls);
    }

    fetchVideos();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRouteSelected, selectedRoute?.id]);

  return (
    <div className="w-[90%] mx-auto mt-4 student-dashboard-height-lock">
      {/* Mobile Tab Bar - Only visible on mobile */}
      <div className="lg:hidden mb-4 flex gap-2 border-b-2 border-maineBlue">
        <button
          onClick={() => setActiveMobileTab('school')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'school'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🚢 {t('logisticsSchool.title')}
        </button>
        <button
          onClick={() => setActiveMobileTab('syllabus')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'syllabus'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📚 {t('logisticsSchool.syllabus')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-full lg:justify-center">
        <div className={`lg:w-[66.666%] bg-weatheredWhite rounded-xl shadow-lg border-4 border-maineBlue flex flex-col h-full lg:min-h-[620px] ${
          activeMobileTab === 'school' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Logistics School header - moved back inside the module */}
          <div className="flex items-center justify-center p-6 pb-4">
            <span className="text-5xl mr-2">🚢</span>
            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('logisticsSchool.title')}</h1>
          </div>

          {/* Sticky Separation line */}
          <div className="sticky top-0 bg-weatheredWhite z-10 px-6">
            <hr className="border-t-2 border-maineBlue" />
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-6 pt-4">
        <div className="w-full mx-auto">
        <ShipmentTimer servingSize={servingSize} setServingSize={setServingSize} />
        {/* Always render a VideoModal for the currently displayed tutorial list */}
        {tutorials.map((tut, idx) => (
          <VideoModal
            key={idx}
            open={modalIdx === idx}
            onClose={() => setModalIdx(null)}
            title={tut.title}
            videoUrl={videoUrls[idx] || ''}
            tutorialId={`${selectedRoute?.id || 'general'}_${idx}`}
            routeId={selectedRoute?.id}
          />
        ))}
        {isRouteSelected && selectedRoute ? (
          <div className="mb-6 mt-8">
            {/* Tutorials Section */}
            <div className="space-y-4">
              {tutorials.map((tut, idx) => (
                <div
                  key={idx}
                  className="bg-sand p-4 rounded shadow-inner border border-black relative cursor-pointer hover:bg-sky-300 hover:text-maineBlue transition-colors"
                  onClick={() => setModalIdx(idx)}
                >
                  <div className="font-bold mb-1">{tut.title}</div>
                  <div className="text-sm text-gray-700">{tut.desc}</div>
                </div>
              ))}
            </div>
            {/* Route Card Display at Bottom (matching MyRunbook RouteCard layout) */}
            <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-black overflow-hidden w-full min-h-[350px] mt-8 mx-auto relative">
              <button
                onClick={() => window.location.reload()}
                className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"
                title={t('logisticsSchool.closeRecipe')}
              >
                <span className="text-red-500 font-bold text-lg">✕</span>
              </button>
              {/* Left Page */}
              <div className="flex-1 p-6 bg-weatheredWhite border-r border-gray-200 flex flex-col">
                {selectedRoute.image && (
                  <img
                    src={selectedRoute.image}
                    alt={selectedRoute.title}
                    className="rounded-lg w-full h-32 object-cover mb-4"
                    style={{ objectFit: 'cover' }}
                  />
                )}
                <h3 className="font-bold text-xl mb-1 text-maineBlue">{selectedRoute.title}</h3>
                {/* No description on RouteCard, but add if needed: */}
                {/* <div className="text-gray-600 mb-2 text-base">{selectedRoute.description}</div> */}
                <div className="font-semibold mb-1 mt-2">{t('logisticsSchool.ingredients')}</div>
                <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                  {selectedRoute.items?.length ? (
                    selectedRoute.items.map((ing: string, i: number) => <li key={i}>{ing}</li>)
                  ) : (
                    <li className="italic text-gray-400">{t('logisticsSchool.noIngredientsListed')}</li>
                  )}
                </ul>
                {routeNutrition && (
                  <div className="mt-2">
                    <div className="font-semibold mb-1">{t('logisticsSchool.nutritionTotal').replace('{servings}', servingSize.toString())}:</div>
                    <div className="text-sm">
                      <div>{t('logisticsSchool.carbs')}: {(routeNutrition.carbs * servingSize).toFixed(1)}g</div>
                      <div>{t('logisticsSchool.sugars')}: {(routeNutrition.sugars * servingSize).toFixed(1)}g</div>
                      <div>{t('logisticsSchool.fiber')}: {(routeNutrition.fiber * servingSize).toFixed(1)}g</div>
                      <div>{t('logisticsSchool.protein')}: {(routeNutrition.protein * servingSize).toFixed(1)}g</div>
                    </div>
                  </div>
                )}
              </div>
              {/* Right Page */}
              <div className="flex-1 p-6 bg-white flex flex-col">
                <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('logisticsSchool.instructions')}</h3>
                <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                  {selectedRoute.instructions || (
                    <span className="italic text-gray-400">{t('logisticsSchool.noInstructionsProvided')}</span>
                  )}
                </div>
                {/* Equipment Section */}
                {selectedRoute.equipment && selectedRoute.equipment.length > 0 && (
                  <>
                    <div className="font-semibold mt-4 mb-1">{t('logisticsSchool.equipmentNeeded')}</div>
                    <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                      {selectedRoute.equipment.map((eq: string, i: number) => (
                        <li key={i}>{eq}</li>
                      ))}
                    </ul>
                  </>
                )}
                {(!selectedRoute.equipment || selectedRoute.equipment.length === 0) && (
                  <div className="italic text-gray-400 mt-2">{t('logisticsSchool.noEquipmentListed')}</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 mt-8">
              {tutorials.map((tut, idx) => (
                <div
                  key={idx}
                  className="bg-sand p-4 rounded shadow-inner border border-black relative cursor-pointer hover:bg-sky-300 hover:text-maineBlue transition-colors"
                  onClick={() => setModalIdx(idx)}
                >
                  <div className="font-bold mb-1">{tut.title}</div>
                  <div className="text-sm text-gray-700">{tut.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <div className="text-gray-700 mb-4">{t('logisticsSchool.getStarted')}</div>
              <div className="flex justify-center space-x-4">
                <Link to="/logistics/my-dock" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('logisticsSchool.goToMyKitchen')}</Link>
                <Link to="/logistics/my-runbook" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('logisticsSchool.goToMyCookbook')}</Link>
              </div>
            </div>
          </>
        )}
      </div>
          </div>
        </div>

        <div className={`lg:w-[28.333%] lg:h-full ${
          activeMobileTab === 'syllabus' ? 'block' : 'hidden lg:block'
        }`}>
          <SyllabusCard
            title={syllabusData.title}
            courses={syllabusData.courses}
            onLessonClick={handleLessonClick}
            onButcherBlockClick={() => setBenchPracticeOpen(true)}
          />
        </div>
      </div>

      {/* Bench Practice Modal */}
      <DockPracticeModal
        open={benchPracticeOpen}
        onClose={() => setBenchPracticeOpen(false)}
        courses={syllabusData.courses}
      />
    </div>
  );
};

export default LogisticsSchool;


