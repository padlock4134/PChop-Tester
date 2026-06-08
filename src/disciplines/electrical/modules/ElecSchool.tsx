import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../components/SparkFreddieContext';
import VideoModal from '../components/VideoModal';
import { useRecipeContext } from '../components/CircuitContext';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';
import { getMainEquipment, getMainIngredient } from '../utils/mainSelectors';
import { fetchNutritionData, calculateRecipeNutrition } from '../api/nutritionService';
import { KeyNutrients } from '../types/nutrition';
import SyllabusCard from '../components/SyllabusCard';
import JobTimer from '../components/JobTimer';
import PanelPracticeModal from '../components/PanelPracticeModal';
import { supabase } from '../api/supabaseClient';
import { useCurriculumSyllabus } from '../../../hooks/useCurriculumSyllabus';


function getDefaultTutorials() {
  return [
    {
      title: 'Electrical Safety Basics',
      desc: 'Learn lockout/tagout, PPE, voltage awareness, and safe circuit habits before wiring.',
      type: 'cooking_tutorial',
      query: 'electrical safety basics lockout tagout PPE voltage training'
    },
    {
      title: 'Basic Circuit Wiring',
      desc: 'Practice reading a simple diagram and wiring basic switches, loads, and connections.',
      type: 'cooking_tutorial',
      query: 'basic electrical circuit wiring tutorial switches loads connections'
    }
  ];
}

function getTwoTutorials(recipe: any) {
  if (!recipe) return [];
  return [
    {
      title: `Let\'s Wire This Circuit!`,
      desc: `Step-by-step electrical walkthrough for ${recipe.title}.`,
      type: 'cooking_tutorial'
    },
    {
      title: 'Code, Tools & Safety',
      desc: `Review code basics, tools, and safety checks before wiring ${recipe.title}.`,
      type: 'cooking_tutorial',
      query: `${recipe.title} electrical code tools safety tutorial`
    }
  ];
}


const ElecSchool = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { selectedRecipe } = useRecipeContext();
  console.log('Elec School - Job data:', selectedRecipe?.nutrition);
  console.log('Elec School - Full Job:', selectedRecipe);
  const [modalIdx, setModalIdx] = useState<null | number>(null);
  const [recipeNutrition, setRecipeNutrition] = useState<KeyNutrients | null>(null);
  const [servingSize, setServingSize] = useState(2);
  const [benchPracticeOpen, setBenchPracticeOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'school' | 'syllabus'>('school');
  const syllabusData = useCurriculumSyllabus(supabase, 'electrical');

  const handleLessonClick = (lessonId: string) => {
    console.log(`Navigating to lesson: ${lessonId}`);
  };

  useEffect(() => {
    updateContext({ page: 'ElecSchool' });
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

  // Helper: extract primary material from components
  function getMainProtein(ingredients: string[] = []) {
    const proteins = [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'clam', 'crab', 'lobster',
      'tofu', 'turkey', 'duck', 'lamb', 'egg', 'eggs', 'scallop', 'scallops', 'mussels', 'steak',
      'bacon', 'sausage', 'ham', 'vegan', 'tempeh', 'seitan', 'octopus', 'squid', 'anchovy', 'anchovies'
    ];
    return ingredients.find(ing => proteins.some(p => ing.toLowerCase().includes(p)));
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
    } else if (tut.type === 'cooking_tutorial') {
      // For task tutorials, focus on the project
      const mainProtein = getMainProtein(recipe.ingredients || []);
      const mainEquipment = getMainEquipment(recipe.equipment || []);
      if (mainProtein && mainEquipment) {
        query = `How to cook ${mainProtein} using ${mainEquipment}`;
      } else if (mainProtein) {
        query = `How to cook ${mainProtein}`;
      } else {
        query = `how to complete ${recipe.title}`;
      }
    } else {
      // Legacy fallback for older tutorial formats
      if (typeof idx === 'number' && idx === 2 && recipe && recipe.title) {
        return recipe.title;
      }

      // Use Chef Freddie for complex queries
      const prompt = `
        Given the following project and tutorial step, generate a concise YouTube search query for a relevant trade training video.\n
        - Only use the equipment and ingredients listed.\n
        - Do NOT include unrelated tools or techniques.\n
        - The query should be specific to the step and recipe.\n
        Recipe: ${recipe.title}\n
        Ingredients: ${recipe.ingredients?.join(', ')}\n
        Equipment: ${recipe.equipment?.join(', ') || 'N/A'}\n
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
      console.log('[ElecSchool] Fetching videos with API key rotation');
      console.log('[ElecSchool] Tutorials to fetch:', tutorials);
      console.log('[ElecSchool] Selected job:', selectedRecipe);

      const newUrls: (string | null)[] = [null, null];
      await Promise.all(tutorials.map(async (tut, idx) => {
        try {
          // Use the improved video query generation that handles different tutorial types
          const query = await getVideoQueryFromFreddie(
            selectedRecipe || { title: '', ingredients: [], equipment: [] },
            tut,
            idx
          );

          console.log(`[ElecSchool] Tutorial ${idx} (${tut.type || 'legacy'}) query:`, query);

          const result: TutorialVideoResult = await getTutorialVideo(query);
          console.log(`[ElecSchool] Tutorial ${idx} result:`, result);

          if (result && result.url) {
            newUrls[idx] = result.url;
          }
        } catch (error) {
          console.error(`[ElecSchool] Error fetching video for tutorial ${idx}:`, error);
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
          💡 {t('elecSchool.title')}
        </button>
        <button
          onClick={() => setActiveMobileTab('syllabus')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'syllabus'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📚 {t('elecSchool.syllabus')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-full lg:justify-center">
        <div className={`lg:w-[66.666%] bg-weatheredWhite rounded-xl shadow-lg border-4 border-maineBlue flex flex-col h-full lg:min-h-[620px] ${
          activeMobileTab === 'school' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Culinary School header - moved back inside the module */}
          <div className="flex items-center justify-center p-6 pb-4">
            <span className="text-5xl mr-2">💡</span>
            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('elecSchool.title')}</h1>
          </div>

          {/* Sticky Separation line */}
          <div className="sticky top-0 bg-weatheredWhite z-10 px-6">
            <hr className="border-t-2 border-maineBlue" />
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-6 pt-4">
        <div className="w-full mx-auto">
        <JobTimer servingSize={servingSize} setServingSize={setServingSize} />
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
                title={t('elecSchool.closeRecipe')}
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
                <div className="font-semibold mb-1 mt-2">{t('elecSchool.ingredients')}</div>
                <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                  {selectedRecipe.ingredients?.length ? (
                    selectedRecipe.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)
                  ) : (
                    <li className="italic text-gray-400">{t('elecSchool.noIngredientsListed')}</li>
                  )}
                </ul>
                {recipeNutrition && (
                  <div className="mt-2">
                    <div className="font-semibold mb-1">{t('elecSchool.nutritionTotal').replace('{servings}', servingSize.toString())}:</div>
                    <div className="text-sm">
                      <div>{t('elecSchool.carbs')}: {(recipeNutrition.carbs * servingSize).toFixed(1)}g</div>
                      <div>{t('elecSchool.sugars')}: {(recipeNutrition.sugars * servingSize).toFixed(1)}g</div>
                      <div>{t('elecSchool.fiber')}: {(recipeNutrition.fiber * servingSize).toFixed(1)}g</div>
                      <div>{t('elecSchool.protein')}: {(recipeNutrition.protein * servingSize).toFixed(1)}g</div>
                    </div>
                  </div>
                )}
              </div>
              {/* Right Page */}
              <div className="flex-1 p-6 bg-white flex flex-col">
                <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('elecSchool.instructions')}</h3>
                <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                  {selectedRecipe.instructions || (
                    <span className="italic text-gray-400">{t('elecSchool.noInstructionsProvided')}</span>
                  )}
                </div>
                {/* Equipment Section */}
                {selectedRecipe.equipment && selectedRecipe.equipment.length > 0 && (
                  <>
                    <div className="font-semibold mt-4 mb-1">{t('elecSchool.equipmentNeeded')}</div>
                    <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                      {selectedRecipe.equipment.map((eq: string, i: number) => (
                        <li key={i}>{eq}</li>
                      ))}
                    </ul>
                  </>
                )}
                {(!selectedRecipe.equipment || selectedRecipe.equipment.length === 0) && (
                  <div className="italic text-gray-400 mt-2">{t('elecSchool.noEquipmentListed')}</div>
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
              <div className="text-gray-700 mb-4">{t('elecSchool.getStarted')}</div>
              <div className="flex justify-center space-x-4">
                <Link to="/electrical/my-panel" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('elecSchool.goToMyKitchen')}</Link>
                <Link to="/electrical/my-codebook" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('elecSchool.goToMyCookbook')}</Link>
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
      <PanelPracticeModal
        open={benchPracticeOpen}
        onClose={() => setBenchPracticeOpen(false)}
        courses={syllabusData.courses}
      />
    </div>
  );
};

export default ElecSchool;


