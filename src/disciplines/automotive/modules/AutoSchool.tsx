import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../components/GarageFreddieContext';
import VideoModal from '../components/VideoModal';
import { useRecipeContext } from '../components/RepairContext';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';
import { getMainEquipment, getMainPart } from '../utils/mainSelectors';
import { fetchNutritionData, calculateRecipeNutrition } from '../api/nutritionService';
import { KeyNutrients } from '../types/nutrition';
import SyllabusCard from '../components/SyllabusCard';
import JobTimer from '../components/JobTimer';
import BayPracticeModal from '../components/BayPracticeModal';
import { supabase } from '../api/supabaseClient';
import { useCurriculumSyllabus } from '../../../hooks/useCurriculumSyllabus';


function getDefaultTutorials() {
  return [
    {
      title: 'Automotive Safety Basics',
      desc: 'Learn shop safety, PPE, lift awareness, and safe diagnostic habits before starting a repair.',
      type: 'repair_tutorial',
      query: 'automotive shop safety basics training PPE lift safety'
    },
    {
      title: 'Basic Vehicle Inspection',
      desc: 'Practice a beginner-friendly inspection flow for brakes, tires, fluids, battery, and belts.',
      type: 'repair_tutorial',
      query: 'basic vehicle inspection checklist training brakes tires fluids battery belts'
    }
  ];
}

function getTwoTutorials(recipe: any) {
  if (!recipe) return [];
  return [
    {
      title: `Let\'s Work This Repair!`,
      desc: `Repair walkthrough for ${recipe.title}.`,
      type: 'repair_tutorial'
    },
    {
      title: 'Tool & Safety Check',
      desc: `Review the tools, PPE, and safety checks needed before starting ${recipe.title}.`,
      type: 'repair_tutorial',
      query: `${recipe.title} automotive repair safety tools tutorial`
    }
  ];
}


const AutoSchool = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { selectedRecipe } = useRecipeContext();
  const [modalIdx, setModalIdx] = useState<null | number>(null);
  const [recipeNutrition, setRecipeNutrition] = useState<KeyNutrients | null>(null);
  const [teamSize, setTeamSize] = useState(2);
  const [benchPracticeOpen, setBenchPracticeOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'school' | 'syllabus'>('school');
  const syllabusData = useCurriculumSyllabus(supabase, 'automotive');

  const handleLessonClick = (lessonId: string) => {
  };

  useEffect(() => {
    updateContext({ page: 'AutoSchool' });
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

  // Helper: extract primary part from components list
  function getMainPart(ingredients: string[] = []) {
    const keyParts = [
      'brake', 'rotor', 'caliper', 'spark plug', 'battery', 'alternator', 'starter',
      'filter', 'belt', 'hose', 'pump', 'sensor', 'bearing', 'gasket', 'clutch',
      'shock', 'strut', 'axle', 'radiator', 'thermostat', 'muffler', 'tire', 'wheel'
    ];
    return ingredients.find(ing => keyParts.some(p => ing.toLowerCase().includes(p)));
  }
  // Helper: extract main tool from equipment array
  function getMainEquipment(equipment: string[] = []) {
    const priorities = [
      'socket set', 'torque wrench', 'scan tool', 'multimeter', 'jack', 'wrench set',
      'impact wrench', 'brake tool', 'compression tester', 'timing light', 'spring compressor'
    ];
    for (const p of priorities) {
      const found = equipment.find(eq => eq.toLowerCase().includes(p));
      if (found) return found;
    }
    return equipment[0] || '';
  }

  // Helper to call Gus the Mechanic backend for a smart search query
  async function getVideoQueryFromFreddie(recipe: any, tut: any, idx: any) {
    let query = '';

    if (tut.query) {
      return tut.query;
    }

    // Handle different tutorial types
    if (tut.type === 'weekly_technique') {
      // For technique of the week, search for the specific technique
      query = `how to ${tut.techniqueData.title.toLowerCase()} trade technique`;
    } else if (tut.type === 'repair_tutorial') {
      // For task tutorials, focus on the project
      const mainPart = getMainPart(recipe.ingredients || []);
      const mainEquipment = getMainEquipment(recipe.equipment || []);
      if (mainPart && mainEquipment) {
        query = `How to replace ${mainPart} using ${mainEquipment}`;
      } else if (mainPart) {
        query = `How to replace ${mainPart}`;
      } else {
        query = `how to complete ${recipe.title}`;
      }
    } else {
      // Legacy fallback for older tutorial formats
      if (typeof idx === 'number' && idx === 2 && recipe && recipe.title) {
        return recipe.title;
      }

      // Use Gus the Mechanic for complex queries
      const prompt = `
        Given the following repair and tutorial, generate a concise YouTube search query for a relevant automotive video.\n
        - Only use the equipment and parts listed.\n
        - Do NOT include unrelated tools or techniques.\n
        - The query should be specific to the tutorial and repair.\n
        Repair: ${recipe.title}\n
        Parts: ${recipe.ingredients?.join(', ')}\n
        Equipment: ${recipe.equipment?.join(', ') || 'N/A'}\n
        Tutorial Title: ${tut.title}\n
        Tutorial Description: ${tut.desc}\n
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

      const newUrls: (string | null)[] = [null, null];
      await Promise.all(tutorials.map(async (tut, idx) => {
        try {
          // Use the improved video query generation that handles different tutorial types
          const query = await getVideoQueryFromFreddie(
            selectedRecipe || { title: '', ingredients: [], equipment: [] },
            tut,
            idx
          );

          const result: TutorialVideoResult = await getTutorialVideo(query);
          if (result && result.url) {
            newUrls[idx] = result.url;
          }
        } catch (error) {
          console.error(`[AutoSchool] Error fetching video for tutorial ${idx}:`, error);
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
          ⚙️ {t('autoSchool.title')}
        </button>
        <button
          onClick={() => setActiveMobileTab('syllabus')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'syllabus'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📚 {t('autoSchool.syllabus')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-full lg:justify-center">
        <div className={`lg:w-[66.666%] bg-weatheredWhite rounded-xl shadow-lg border-4 border-maineBlue flex flex-col h-full lg:min-h-[620px] ${
          activeMobileTab === 'school' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Automotive School header - moved back inside the module */}
          <div className="flex-shrink-0 flex items-center justify-center p-6 pb-4">
            <span className="text-5xl mr-2">⚙️</span>
            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('autoSchool.title')}</h1>
          </div>

          {/* Sticky Separation line */}
          <div className="flex-shrink-0 sticky top-0 bg-weatheredWhite z-10 px-6">
            <hr className="border-t-2 border-maineBlue" />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-4 min-h-0">
        <div className="w-full mx-auto">
        <JobTimer teamSize={teamSize} setTeamSize={setTeamSize} />
        {/* Always render a VideoModal for the currently displayed tutorial list */}
        {tutorials.map((tut, idx) => (
          <VideoModal
            key={idx}
            open={modalIdx === idx}
            onClose={() => setModalIdx(null)}
            title={tut.title}
            videoUrl={videoUrls[idx] || ''}
            tutorialId={`${selectedRecipe?.id || 'general'}_${idx}`}
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
            {/* Repair Card Display at Bottom (matching MyManual RepairCard layout) */}
            <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-black overflow-hidden w-full min-h-[350px] mt-8 mx-auto relative">
              <button
                onClick={() => window.location.reload()}
                className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"
                title={t('autoSchool.closeRecipe')}
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
                <div className="font-semibold mb-1 mt-2">{t('autoSchool.ingredients')}</div>
                <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                  {selectedRecipe.ingredients?.length ? (
                    selectedRecipe.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)
                  ) : (
                    <li className="italic text-gray-400">{t('autoSchool.noIngredientsListed')}</li>
                  )}
                </ul>
                {recipeNutrition && (
                  <div className="mt-2">
                    <div className="font-semibold mb-1">{t('autoSchool.nutritionTotal').replace('{servings}', teamSize.toString())}:</div>
                    <div className="text-sm">
                      <div>{t('autoSchool.carbs')}: {(recipeNutrition.carbs * teamSize).toFixed(1)}g</div>
                      <div>{t('autoSchool.sugars')}: {(recipeNutrition.sugars * teamSize).toFixed(1)}g</div>
                      <div>{t('autoSchool.fiber')}: {(recipeNutrition.fiber * teamSize).toFixed(1)}g</div>
                      <div>{t('autoSchool.protein')}: {(recipeNutrition.protein * teamSize).toFixed(1)}g</div>
                    </div>
                  </div>
                )}
              </div>
              {/* Right Page */}
              <div className="flex-1 p-6 bg-white flex flex-col">
                <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('autoSchool.instructions')}</h3>
                <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                  {selectedRecipe.instructions || (
                    <span className="italic text-gray-400">{t('autoSchool.noInstructionsProvided')}</span>
                  )}
                </div>
                {/* Equipment Section */}
                {selectedRecipe.equipment && selectedRecipe.equipment.length > 0 && (
                  <>
                    <div className="font-semibold mt-4 mb-1">{t('autoSchool.equipmentNeeded')}</div>
                    <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                      {selectedRecipe.equipment.map((eq: string, i: number) => (
                        <li key={i}>{eq}</li>
                      ))}
                    </ul>
                  </>
                )}
                {(!selectedRecipe.equipment || selectedRecipe.equipment.length === 0) && (
                  <div className="italic text-gray-400 mt-2">{t('autoSchool.noEquipmentListed')}</div>
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
              <div className="text-gray-700 mb-4">{t('autoSchool.getStarted')}</div>
              <div className="flex justify-center space-x-4">
                <Link to="/automotive/my-garage" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('autoSchool.goToMyKitchen')}</Link>
                <Link to="/automotive/my-manual" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('autoSchool.goToMyCookbook')}</Link>
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
            onDiagnosticBayClick={() => setBenchPracticeOpen(true)}
          />
        </div>
      </div>

      {/* Bench Practice Modal */}
      <BayPracticeModal
        open={benchPracticeOpen}
        onClose={() => setBenchPracticeOpen(false)}
        courses={syllabusData.courses}
      />
    </div>
  );
};

export default AutoSchool;


