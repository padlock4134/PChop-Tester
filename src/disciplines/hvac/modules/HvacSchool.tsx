import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../components/ShopFreddieContext';
import VideoModal from '../components/VideoModal';
import { useRecipeContext } from '../components/SystemContext';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';
import { getMainEquipment, getMainIngredient } from '../utils/mainSelectors';
import { fetchNutritionData, calculateRecipeNutrition } from '../api/nutritionService';
import { KeyNutrients } from '../types/nutrition';
import SyllabusCard from '../components/SyllabusCard';
import ServiceTimer from '../components/ServiceTimer';
import UnitPracticeModal from '../components/UnitPracticeModal';
import { supabase } from '../api/supabaseClient';
import { useCurriculumSyllabus } from '../../../hooks/useCurriculumSyllabus';


function getDefaultTutorials() {
  return [
    {
      title: 'HVAC Safety Basics',
      desc: 'Learn PPE, electrical safety, refrigerant awareness, and service-call habits.',
      type: 'service_tutorial',
      query: 'HVAC safety basics PPE electrical refrigerant service training'
    },
    {
      title: 'System Inspection Basics',
      desc: 'Practice a beginner-friendly inspection flow for airflow, filters, coils, and thermostat checks.',
      type: 'service_tutorial',
      query: 'HVAC system inspection basics airflow filters coils thermostat tutorial'
    }
  ];
}

function getTwoTutorials(recipe: any) {
  if (!recipe) return [];
  return [
    {
      title: `Let\'s Service This System!`,
      desc: `Step-by-step service walkthrough for ${recipe.title}.`,
      type: 'service_tutorial'
    },
    {
      title: 'Diagnostics & Safety Check',
      desc: `Review diagnostic steps, tools, and safety checks before servicing ${recipe.title}.`,
      type: 'service_tutorial',
      query: `${recipe.title} HVAC diagnostics tools safety tutorial`
    }
  ];
}


const HvacSchool = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { selectedRecipe } = useRecipeContext();
  console.log('HVAC School - Service data:', selectedRecipe?.nutrition);
  console.log('HVAC School - Full Service Call:', selectedRecipe);
  const [modalIdx, setModalIdx] = useState<null | number>(null);
  const [recipeNutrition, setRecipeNutrition] = useState<KeyNutrients | null>(null);
  const [servingSize, setServingSize] = useState(2);
  const [benchPracticeOpen, setBenchPracticeOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'school' | 'syllabus'>('school');
  const syllabusData = useCurriculumSyllabus(supabase, 'hvac');

  const handleLessonClick = (lessonId: string) => {
    console.log(`Navigating to lesson: ${lessonId}`);
  };

  useEffect(() => {
    updateContext({ page: 'HvacSchool' });
  }, [updateContext]);


  useEffect(() => {
    if (selectedRecipe && !selectedRecipe.nutrition) {
      // Calculate nutrition if missing
      calculateRecipeNutrition(selectedRecipe.ingredients)
        .then(nutrition => {
          setRecipeNutrition(nutrition);
        })
        .catch(error => {
          console.error('Error calculating nutrition:', error);
        });
    } else {
      setRecipeNutrition(selectedRecipe?.nutrition || null);
    }
  }, [selectedRecipe]);

  const isRecipeSelected = !!selectedRecipe;
  const tutorials = isRecipeSelected ? getTwoTutorials(selectedRecipe) : getDefaultTutorials();
  const [videoUrls, setVideoUrls] = useState<(string | null)[]>([null, null]);

  // Helper: extract primary component from materials list
  function getMainProtein(ingredients: string[] = []) {
    const primaryComponents = [
      'compressor', 'condenser', 'evaporator', 'blower motor', 'contactor', 'capacitor',
      'thermostat', 'control board', 'heat exchanger', 'expansion valve', 'txv', 'reversing valve',
      'refrigerant', 'line set', 'filter', 'ductwork', 'damper', 'zone board', 'transformer',
      'relay', 'sensor', 'pressure switch', 'limit switch', 'ignitor', 'gas valve'
    ];
    return ingredients.find(ing => primaryComponents.some(p => ing.toLowerCase().includes(p)));
  }
  // Helper: extract main tool from equipment array
  function getMainEquipment(equipment: string[] = []) {
    const priorities = [
      'manifold gauge', 'multimeter', 'vacuum pump', 'recovery machine', 'torch', 'manometer',
      'combustion analyzer', 'leak detector', 'anemometer', 'megohmmeter', 'thermometer',
      'temperature clamps', 'psychrometer', 'micron gauge', 'scale'
    ];
    for (const p of priorities) {
      const found = equipment.find(eq => eq.toLowerCase().includes(p));
      if (found) return found;
    }
    return equipment[0] || '';
  }

  // Helper to call Chef Freddie backend for a smart search query
  async function getVideoQueryFromFreddie(recipe: any, tut: any, idx: any) {
    let query = '';

    if (tut.query) {
      return tut.query;
    }

    // Handle different tutorial types
    if (tut.type === 'weekly_technique') {
      // For technique of the week, search for the specific technique
      query = `how to ${tut.techniqueData.title.toLowerCase()} trade technique`;
    } else if (tut.type === 'service_tutorial') {
      // For service tutorials, focus on the project
      const mainComponent = getMainProtein(recipe.ingredients || []);
      const mainTool = getMainEquipment(recipe.equipment || []);
      if (mainComponent && mainTool) {
        query = `HVAC how to service ${mainComponent} using ${mainTool}`;
      } else if (mainComponent) {
        query = `HVAC ${mainComponent} service tutorial`;
      } else {
        query = `HVAC how to ${recipe.title}`;
      }
    } else {
      // Legacy fallback for older tutorial formats
      if (typeof idx === 'number' && idx === 2 && recipe && recipe.title) {
        return recipe.title;
      }

      // Use Cool Cal for complex queries
      const prompt = `
        Given the following HVAC project and tutorial step, generate a concise YouTube search query for a relevant HVAC training video.\n
        - Only use the tools and components listed.\n
        - Do NOT include unrelated tools or techniques.\n
        - The query should be specific to the step and project.\n
        Project: ${recipe.title}\n
        Components: ${recipe.ingredients?.join(', ')}\n
        Tools: ${recipe.equipment?.join(', ') || 'N/A'}\n
        Step Title: ${tut.title}\n
        Step Description: ${tut.desc}\n
        Query:
      `;
      try {
        const res = await fetch('/api/chefFreddieQuery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        query = data.query || tut.title + ' ' + (recipe.title || '');
      } catch {
        query = tut.title + ' ' + (recipe.title || '');
      }
    }

    return query;
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchVideos() {
      // Now using API key rotation system for better quota management
      console.log('[HvacSchool] Fetching videos with API key rotation');
      console.log('[HvacSchool] Tutorials to fetch:', tutorials);
      console.log('[HvacSchool] Selected service call:', selectedRecipe);

      const newUrls: (string | null)[] = [null, null];
      await Promise.all(tutorials.map(async (tut, idx) => {
        try {
          // Use the improved video query generation that handles different tutorial types
          const query = await getVideoQueryFromFreddie(
            selectedRecipe || { title: '', ingredients: [], equipment: [] },
            tut,
            idx
          );

          console.log(`[HvacSchool] Tutorial ${idx} (${tut.type || 'legacy'}) query:`, query);

          const result: TutorialVideoResult = await getTutorialVideo(query);
          console.log(`[HvacSchool] Tutorial ${idx} result:`, result);

          if (result && result.url) {
            newUrls[idx] = result.url;
          }
        } catch (error) {
          console.error(`[HvacSchool] Error fetching video for tutorial ${idx}:`, error);
        }
      }));

      if (!cancelled) setVideoUrls(newUrls);
    }

    fetchVideos();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecipeSelected, selectedRecipe?.id]);

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
          ❄️ {t('hvacSchool.title')}
        </button>
        <button
          onClick={() => setActiveMobileTab('syllabus')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'syllabus'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📚 {t('hvacSchool.syllabus')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-full lg:justify-center">
        <div className={`lg:w-[66.666%] bg-weatheredWhite rounded-xl shadow-lg border-4 border-maineBlue flex flex-col h-full lg:min-h-[620px] ${
          activeMobileTab === 'school' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Culinary School header - moved back inside the module */}
          <div className="flex items-center justify-center p-6 pb-4">
            <span className="text-5xl mr-2">❄️</span>
            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('hvacSchool.title')}</h1>
          </div>

          {/* Sticky Separation line */}
          <div className="sticky top-0 bg-weatheredWhite z-10 px-6">
            <hr className="border-t-2 border-maineBlue" />
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-6 pt-4">
        <div className="w-full mx-auto">
        <ServiceTimer servingSize={servingSize} setServingSize={setServingSize} />
        {/* Always render a VideoModal for the currently displayed tutorial list */}
        {tutorials.map((tut, idx) => (
          <VideoModal
            key={idx}
            open={modalIdx === idx}
            onClose={() => setModalIdx(null)}
            title={tut.title}
            videoUrl={videoUrls[idx] || ''}
            tutorialId={`${selectedRecipe?.id || 'general'}_${idx}`}
            recipeId={selectedRecipe?.id}
          />
        ))}
        {isRecipeSelected && selectedRecipe ? (
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
            {/* Recipe Card Display at Bottom (matching MyCookBook RecipeCard layout) */}
            <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-black overflow-hidden w-full min-h-[350px] mt-8 mx-auto relative">
              <button
                onClick={() => window.location.reload()}
                className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"
                title={t('hvacSchool.closeRecipe')}
              >
                <span className="text-red-500 font-bold text-lg">✕</span>
              </button>
              {/* Left Page */}
              <div className="flex-1 p-6 bg-weatheredWhite border-r border-gray-200 flex flex-col">
                {selectedRecipe.image && (
                  <img
                    src={selectedRecipe.image}
                    alt={selectedRecipe.title}
                    className="rounded-lg w-full h-32 object-cover mb-4"
                    style={{ objectFit: 'cover' }}
                  />
                )}
                <h3 className="font-bold text-xl mb-1 text-maineBlue">{selectedRecipe.title}</h3>
                {/* No description on RecipeCard, but add if needed: */}
                {/* <div className="text-gray-600 mb-2 text-base">{selectedRecipe.description}</div> */}
                <div className="font-semibold mb-1 mt-2">{t('hvacSchool.ingredients')}</div>
                <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                  {selectedRecipe.ingredients?.length ? (
                    selectedRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)
                  ) : (
                    <li className="italic text-gray-400">{t('hvacSchool.noIngredientsListed')}</li>
                  )}
                </ul>
                {recipeNutrition && (
                  <div className="mt-2">
                    <div className="font-semibold mb-1">{t('hvacSchool.nutritionTotal').replace('{servings}', servingSize.toString())}:</div>
                    <div className="text-sm">
                      <div>{t('hvacSchool.carbs')}: {(recipeNutrition.carbs * servingSize).toFixed(1)}g</div>
                      <div>{t('hvacSchool.sugars')}: {(recipeNutrition.sugars * servingSize).toFixed(1)}g</div>
                      <div>{t('hvacSchool.fiber')}: {(recipeNutrition.fiber * servingSize).toFixed(1)}g</div>
                      <div>{t('hvacSchool.protein')}: {(recipeNutrition.protein * servingSize).toFixed(1)}g</div>
                    </div>
                  </div>
                )}
              </div>
              {/* Right Page */}
              <div className="flex-1 p-6 bg-white flex flex-col">
                <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('hvacSchool.instructions')}</h3>
                <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                  {selectedRecipe.instructions || (
                    <span className="italic text-gray-400">{t('hvacSchool.noInstructionsProvided')}</span>
                  )}
                </div>
                {/* Equipment Section */}
                {selectedRecipe.equipment && selectedRecipe.equipment.length > 0 && (
                  <>
                    <div className="font-semibold mt-4 mb-1">{t('hvacSchool.equipmentNeeded')}</div>
                    <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                      {selectedRecipe.equipment.map((eq, i) => (
                        <li key={i}>{eq}</li>
                      ))}
                    </ul>
                  </>
                )}
                {(!selectedRecipe.equipment || selectedRecipe.equipment.length === 0) && (
                  <div className="italic text-gray-400 mt-2">{t('hvacSchool.noEquipmentListed')}</div>
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
              <div className="text-gray-700 mb-4">{t('hvacSchool.getStarted')}</div>
              <div className="flex justify-center space-x-4">
                <Link to="/hvac/my-shop" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('hvacSchool.goToMyKitchen')}</Link>
                <Link to="/hvac/my-specsheets" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('hvacSchool.goToMyCookbook')}</Link>
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
      <UnitPracticeModal
        open={benchPracticeOpen}
        onClose={() => setBenchPracticeOpen(false)}
        courses={syllabusData.courses}
      />
    </div>
  );
};

export default HvacSchool;


