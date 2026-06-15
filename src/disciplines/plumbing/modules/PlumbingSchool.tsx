import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../components/PipeFreddieContext';
import { useRecipeContext } from '../components/FitContext';
import VideoModal from '../components/VideoModal';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';
import SyllabusCard from '../components/SyllabusCard';
import JobTimer from '../components/JobTimer';
import FitPracticeModal from '../components/FitPracticeModal';
import { supabase } from '../api/supabaseClient';
import { useCurriculumSyllabus } from '../../../hooks/useCurriculumSyllabus';


function getDefaultTutorials(t: (key: string, options?: any) => string) {
  return [
    {
      title: t('plumbingSchool.safetyBasics', { defaultValue: 'Plumbing Safety Basics' }),
      desc: t('plumbingSchool.safetyBasicsDesc', { defaultValue: 'Learn PPE, water shutoff, pressure awareness, and safe tool habits before starting a job.' }),
      type: 'cooking_tutorial',
      query: 'plumbing safety basics PPE water shutoff pressure tools training'
    },
    {
      title: t('plumbingSchool.pipeFittingBasics', { defaultValue: 'Pipe Fitting Basics' }),
      desc: t('plumbingSchool.pipeFittingBasicsDesc', { defaultValue: 'Practice measuring, cutting, deburring, fitting, and leak-checking pipe work.' }),
      type: 'cooking_tutorial',
      query: 'pipe fitting basics measuring cutting deburring leak check tutorial plumbing'
    }
  ];
}

function getTwoTutorials(fit: any, t: (key: string, options?: any) => string) {
  if (!fit) return [];

  return [
    {
      title: t('plumbingSchool.letsCookThisMeal', { defaultValue: "Let's Work This Job!" }),
      desc: t('plumbingSchool.projectWalkthrough', { defaultValue: `Step-by-step project walkthrough for ${fit.title}.`, title: fit.title }),
      type: 'cooking_tutorial'
    },
    {
      title: t('plumbingSchool.toolsAndSafety', { defaultValue: 'Tools, Materials & Safety' }),
      desc: t('plumbingSchool.toolsAndSafetyDesc', { defaultValue: `Review the tools, materials, and safety checks needed before starting ${fit.title}.`, title: fit.title }),
      type: 'cooking_tutorial',
      query: `${fit.title} plumbing tools materials safety tutorial`
    }
  ];
}


const PlumbingSchool = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { selectedRecipe, setSelectedRecipe } = useRecipeContext();
  const [modalIdx, setModalIdx] = useState<null | number>(null);
  const [servingSize, setServingSize] = useState(2);
  const [benchPracticeOpen, setBenchPracticeOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'school' | 'syllabus'>('school');
  const syllabusData = useCurriculumSyllabus(supabase, 'plumbing');

  const handleLessonClick = (lessonId: string) => {
    setBenchPracticeOpen(true);
  };

  useEffect(() => {
    updateContext({ page: 'PlumbingSchool' });
  }, [updateContext]);


  const isRecipeSelected = !!selectedRecipe;
  const tutorials = isRecipeSelected ? getTwoTutorials(selectedRecipe, t) : getDefaultTutorials(t);
  const [videoUrls, setVideoUrls] = useState<(string | null)[]>([null, null]);

  // Helper: extract primary material from components
  function getMainProtein(materials: string[] = []) {
    const proteins = [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'clam', 'crab', 'lobster',
      'tofu', 'turkey', 'duck', 'lamb', 'egg', 'eggs', 'scallop', 'scallops', 'mussels', 'steak',
      'bacon', 'sausage', 'ham', 'vegan', 'tempeh', 'seitan', 'octopus', 'squid', 'anchovy', 'anchovies'
    ];
    return materials.find(ing => proteins.some(p => ing.toLowerCase().includes(p)));
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

  // Helper to call Mentor Freddie backend for a smart search query
  async function getVideoQueryFromFreddie(fit: any, tut: any, idx: any) {
    let query = '';

    if (tut.query) {
      return tut.query;
    }

    // Handle different tutorial types
    if (tut.type === 'weekly_technique') {
      // For technique of the week, search for the specific technique
      query = `how to ${tut.techniqueData.title.toLowerCase()} plumbing technique`;
    } else if (tut.type === 'cooking_tutorial') {
      // For job tutorials, focus on the plumbing project
      const mainMaterial = getMainProtein(fit.materials || []);
      const mainTool = getMainEquipment(fit.equipment || []);
      if (mainMaterial && mainTool) {
        query = `How to install ${mainMaterial} using ${mainTool} plumbing`;
      } else if (mainMaterial) {
        query = `How to work with ${mainMaterial} plumbing`;
      } else {
        query = `how to do ${fit.title} plumbing`;
      }
    } else {
      // Legacy fallback for older tutorial formats
      if (typeof idx === 'number' && idx === 2 && fit && fit.title) {
        return fit.title;
      }

      // Use Pete the Plumber for complex queries
      const prompt = `
        Given the following plumbing project and tutorial step, generate a concise YouTube search query for a relevant plumbing technique video.\n
        - Only use the tools and materials listed.\n
        - Do NOT include unrelated tools or techniques.\n
        - The query should be specific to the step and project.\n
        Project: ${fit.title}\n
        Materials: ${fit.materials?.join(', ')}\n
        Tools: ${fit.equipment?.join(', ') || 'N/A'}\n
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
        query = data.query || tut.title + ' ' + (fit.title || '');
      } catch {
        query = tut.title + ' ' + (fit.title || '');
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
            selectedRecipe || { title: '', materials: [], equipment: [] },
            tut,
            idx
          );

          const result: TutorialVideoResult = await getTutorialVideo(query);
          if (result && result.url) {
            newUrls[idx] = result.url;
          }
        } catch (error) {
          console.error(`[PlumbingSchool] Error fetching video for tutorial ${idx}:`, error);
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
          🪠 {t('plumbingSchool.title')}
        </button>
        <button
          onClick={() => setActiveMobileTab('syllabus')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'syllabus'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📚 {t('plumbingSchool.syllabus')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-full lg:justify-center">
        <div className={`lg:w-[66.666%] bg-weatheredWhite rounded-xl shadow-lg border-4 border-maineBlue flex flex-col h-full lg:min-h-[620px] ${
          activeMobileTab === 'school' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Plumbing School header - moved back inside the module */}
          <div className="flex-shrink-0 flex items-center justify-center p-6 pb-4">
            <span className="text-5xl mr-2">🪠</span>
            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('plumbingSchool.title')}</h1>
          </div>

          {/* Sticky Separation line */}
          <div className="flex-shrink-0 sticky top-0 bg-weatheredWhite z-10 px-6">
            <hr className="border-t-2 border-maineBlue" />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-4 min-h-0">
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
            {/* Fit Card Display at Bottom (matching MyPipeBook fit layout) */}
            <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-black overflow-hidden w-full min-h-[350px] mt-8 mx-auto relative">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"
                title={t('plumbingSchool.closeRecipe')}
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
                {/* No description on fit card, but add if needed: */}
                {/* <div className="text-gray-600 mb-2 text-base">{selectedRecipe.description}</div> */}
                <div className="font-semibold mb-1 mt-2">{t('plumbingSchool.ingredients')}</div>
                <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                  {selectedRecipe.materials?.length ? (
                    selectedRecipe.materials.map((ing: string, i: number) => <li key={i}>{ing}</li>)
                  ) : (
                    <li className="italic text-gray-400">{t('plumbingSchool.noIngredientsListed')}</li>
                  )}
                </ul>
              </div>
              {/* Right Page */}
              <div className="flex-1 p-6 bg-white flex flex-col">
                <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('plumbingSchool.instructions')}</h3>
                <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                  {selectedRecipe.instructions || (
                    <span className="italic text-gray-400">{t('plumbingSchool.noInstructionsProvided')}</span>
                  )}
                </div>
                {/* Equipment Section */}
                {selectedRecipe.equipment && selectedRecipe.equipment.length > 0 && (
                  <>
                    <div className="font-semibold mt-4 mb-1">{t('plumbingSchool.equipmentNeeded')}</div>
                    <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                      {selectedRecipe.equipment.map((eq: string, i: number) => (
                        <li key={i}>{eq}</li>
                      ))}
                    </ul>
                  </>
                )}
                {(!selectedRecipe.equipment || selectedRecipe.equipment.length === 0) && (
                  <div className="italic text-gray-400 mt-2">{t('plumbingSchool.noEquipmentListed')}</div>
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
              <div className="text-gray-700 mb-4">{t('plumbingSchool.getStarted')}</div>
              <div className="flex justify-center space-x-4">
                <Link to="/plumbing/my-van" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('plumbingSchool.goToMyKitchen')}</Link>
                <Link to="/plumbing/my-pipebook" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('plumbingSchool.goToMyCookbook')}</Link>
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
      <FitPracticeModal
        open={benchPracticeOpen}
        onClose={() => setBenchPracticeOpen(false)}
        courses={syllabusData.courses}
      />
    </div>
  );
};

export default PlumbingSchool;
