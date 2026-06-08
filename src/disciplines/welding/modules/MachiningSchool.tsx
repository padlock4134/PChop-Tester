import React, { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import { useFreddieContext } from '../components/BenchFreddieContext';

import VideoModal from '../components/VideoModal';

import { useProjectContext } from '../components/PartContext';

import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';

// mainSelectors not used - welding helpers defined locally

import SyllabusCard from '../components/SyllabusCard';

import CycleTimer from '../components/CycleTimer';

import SetupPracticeModal from '../components/SetupPracticeModal';
import { supabase } from '../api/supabaseClient';
import { useCurriculumSyllabus } from '../../../hooks/useCurriculumSyllabus';






// Generate default tutorials including the weekly technique

function getDefaultTutorials() {
  return [
    {
      title: 'Welding Safety Basics',
      desc: 'Learn PPE, ventilation, fire watch, arc safety, and safe setup habits before welding.',
      type: 'welding_tutorial',
      query: 'welding safety basics PPE ventilation fire watch arc safety training'
    },
    {
      title: 'Weld Joint Setup Basics',
      desc: 'Practice joint prep, fit-up, tacking, travel angle, and bead control fundamentals.',
      type: 'welding_tutorial',
      query: 'welding joint setup basics fit up tacking travel angle bead control tutorial'
    }
  ];
}



function getTwoTutorials(project: any) {

  if (!project) return [];


  return [
    {

      title: `Let\'s Weld This Joint!`,

      desc: `Step-by-step welding walkthrough for ${project.title}.`,

      type: 'welding_tutorial'

    },
    {

      title: 'Setup, Fit-Up & Safety',

      desc: `Review setup, fit-up, and safety checks before welding ${project.title}.`,

      type: 'welding_tutorial',

      query: `${project.title} welding setup fit up safety tutorial`

    }

  ];

}





const WeldingSchool = () => {

  const { t } = useTranslation();

  const { updateContext } = useFreddieContext();

  const { selectedProject } = useProjectContext();

  console.log('Welding School - Full Job Ticket:', selectedProject);

  const [modalIdx, setModalIdx] = useState<null | number>(null);

  const [servingSize, setServingSize] = useState(2);

  const [benchPracticeOpen, setBenchPracticeOpen] = useState(false);

  const [activeMobileTab, setActiveMobileTab] = useState<'school' | 'syllabus'>('school');
  const syllabusData = useCurriculumSyllabus(supabase, 'welding');



  const handleLessonClick = (lessonId: string) => {

    console.log(`Navigating to lesson: ${lessonId}`);

  };



  useEffect(() => {

    updateContext({ page: 'WeldingSchool' });

  }, [updateContext]);





  const isProjectSelected = !!selectedProject;

  const tutorials = isProjectSelected ? getTwoTutorials(selectedProject) : getDefaultTutorials();

  const [videoUrls, setVideoUrls] = useState<(string | null)[]>([null, null]);



  // Helper: extract primary base metal from materials list

  function getMainMaterial(ingredients: string[] = []) {

    const metals = [

      'mild steel', 'carbon steel', 'stainless steel', 'aluminum', 'chromoly',

      'inconel', 'titanium', 'copper', 'brass', 'cast iron', 'galvanized',

      'duplex', 'nickel alloy', 'low alloy steel', 'high strength steel'

    ];

    return ingredients.find(ing => metals.some(m => ing.toLowerCase().includes(m)));

  }

  // Helper: extract main welding process from equipment array

  function getMainProcess(equipment: string[] = []) {

    const priorities = [

      'TIG', 'GTAW', 'MIG', 'GMAW', 'stick', 'SMAW', 'flux-core', 'FCAW',

      'oxy-fuel', 'plasma', 'SAW', 'spot weld', 'brazing'

    ];

    for (const p of priorities) {

      const found = equipment.find(eq => eq.toLowerCase().includes(p.toLowerCase()));

      if (found) return found;

    }

    return equipment[0] || '';

  }



  // Helper to call Jake the Welder backend for a smart search query

  async function getVideoQueryFromJake(project: any, tut: any, idx: any) {

    let query = '';



    if (tut.query) {

      return tut.query;

    }



    // Handle different tutorial types

    if (tut.type === 'weekly_technique') {

      // For technique of the week, search for the specific technique

      query = `how to ${tut.techniqueData.title.toLowerCase()} trade technique`;

    } else if (tut.type === 'welding_tutorial') {

      // For weld tutorials, focus on the project

      const mainMaterial = getMainMaterial(project.ingredients || []);

      const mainProcess = getMainProcess(project.equipment || []);

      if (mainMaterial && mainProcess) {

        query = `How to weld ${mainMaterial} using ${mainProcess}`;

      } else if (mainMaterial) {

        query = `How to weld ${mainMaterial}`;

      } else {

        query = `how to complete ${project.title} welding`;

      }

    } else {

      // Legacy fallback for older tutorial formats

      if (typeof idx === 'number' && idx === 2 && project && project.title) {

        return project.title;

      }



      // Use Jake the Welder for complex queries

      const prompt = `

        Given the following project and tutorial step, generate a concise YouTube search query for a relevant trade training video.\n

        - Only use the equipment and ingredients listed.\n

        - Do NOT include unrelated tools or techniques.\n

        - The query should be specific to the step and project.\n

        Project: ${project.title}\n

        Materials: ${project.ingredients?.join(', ')}\n

        Equipment: ${project.equipment?.join(', ') || 'N/A'}\n

        Step Title: ${tut.title}\n

        Step Description: ${tut.desc}\n

        Query:

      `;

      try {

        const res = await fetch('/api/chefFreddieQuery', { // endpoint name kept for API compat

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({ prompt })

        });

        const data = await res.json();

        query = data.query || tut.title + ' ' + (project.title || '');

      } catch {

        query = tut.title + ' ' + (project.title || '');

      }

    }



    return query;

  }



  useEffect(() => {

    let cancelled = false;

    async function fetchVideos() {

      // Now using API key rotation system for better quota management

      console.log('[WeldingSchool] Fetching videos with API key rotation');

      console.log('[WeldingSchool] Tutorials to fetch:', tutorials);

      console.log('[WeldingSchool] Selected job ticket:', selectedProject);



      const newUrls: (string | null)[] = [null, null];

      await Promise.all(tutorials.map(async (tut, idx) => {

        try {

          // Use the improved video query generation that handles different tutorial types

          const query = await getVideoQueryFromJake(

            selectedProject || { title: '', ingredients: [], equipment: [] },

            tut,

            idx

          );



          console.log(`[WeldingSchool] Tutorial ${idx} (${tut.type || 'legacy'}) query:`, query);



          const result: TutorialVideoResult = await getTutorialVideo(query);

          console.log(`[WeldingSchool] Tutorial ${idx} result:`, result);



          if (result && result.url) {

            newUrls[idx] = result.url;

          }

        } catch (error) {

          console.error(`[WeldingSchool] Error fetching video for tutorial ${idx}:`, error);

        }

      }));



      if (!cancelled) setVideoUrls(newUrls);

    }



    fetchVideos();

    return () => { cancelled = true; };

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [isProjectSelected, selectedProject?.id]);



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

          🔩 {t('machiningSchool.title')}

        </button>

        <button

          onClick={() => setActiveMobileTab('syllabus')}

          className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${

            activeMobileTab === 'syllabus'

              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'

              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'

          }`}

        >

          📚 {t('machiningSchool.syllabus')}

        </button>

      </div>



      <div className="flex flex-col lg:flex-row gap-6 lg:h-full lg:justify-center">

        <div className={`lg:w-[66.666%] bg-weatheredWhite rounded-xl shadow-lg border-4 border-maineBlue flex flex-col h-full lg:min-h-[620px] ${

          activeMobileTab === 'school' ? 'flex' : 'hidden lg:flex'

        }`}>

          {/* Welding School header */}

          <div className="flex-shrink-0 flex items-center justify-center p-6 pb-4">

            <span className="text-5xl mr-2">🔩</span>

            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('machiningSchool.title')}</h1>

          </div>



          {/* Sticky Separation line */}

          <div className="flex-shrink-0 sticky top-0 bg-weatheredWhite z-10 px-6">

            <hr className="border-t-2 border-maineBlue" />

          </div>



          {/* Scrollable Content */}

          <div className="flex-1 overflow-y-auto p-6 pt-4 min-h-0">

        <div className="w-full mx-auto">

        <CycleTimer servingSize={servingSize} setServingSize={setServingSize} />

        {/* Always render a VideoModal for the currently displayed tutorial list */}

        {tutorials.map((tut, idx) => (

          <VideoModal

            key={idx}

            open={modalIdx === idx}

            onClose={() => setModalIdx(null)}

            title={tut.title}

            videoUrl={videoUrls[idx] || ''}

            tutorialId={`${selectedProject?.id || 'general'}_${idx}`}

            projectId={selectedProject?.id}

          />

        ))}

        {isProjectSelected && selectedProject ? (

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

            {/* Job Ticket Display at Bottom */}

            <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-black overflow-hidden w-full min-h-[350px] mt-8 mx-auto relative">

              <button

                onClick={() => window.location.reload()}

                className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"

                title={t('machiningSchool.closeProject')}

              >

                <span className="text-red-500 font-bold text-lg">✕</span>

              </button>

              {/* Left Page */}

              <div className="flex-1 p-6 bg-weatheredWhite border-r border-gray-200 flex flex-col">

                {selectedProject.image && (

                  <img

                    src={selectedProject.image}

                    alt={selectedProject.title}

                    className="rounded-lg w-full h-32 object-cover mb-4"

                    style={{ objectFit: 'cover' }}

                  />

                )}

                <h3 className="font-bold text-xl mb-1 text-maineBlue">{selectedProject.title}</h3>

                {/* No description on RecipeCard, but add if needed: */}

                {/* <div className="text-gray-600 mb-2 text-base">{selectedRecipe.description}</div> */}

                <div className="font-semibold mb-1 mt-2">{t('machiningSchool.ingredients')}</div>

                <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">

                  {selectedProject.ingredients?.length ? (

                    selectedProject.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)

                  ) : (

                    <li className="italic text-gray-400">{t('machiningSchool.noIngredientsListed')}</li>

                  )}

                </ul>

              </div>

              {/* Right Page */}

              <div className="flex-1 p-6 bg-white flex flex-col">

                <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('machiningSchool.instructions')}</h3>

                <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">

                  {selectedProject.instructions || (

                    <span className="italic text-gray-400">{t('machiningSchool.noInstructionsProvided')}</span>

                  )}

                </div>

                {/* Equipment Section */}

                {selectedProject.equipment && selectedProject.equipment.length > 0 && (

                  <>

                    <div className="font-semibold mt-4 mb-1">{t('machiningSchool.equipmentNeeded')}</div>

                    <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">

                      {selectedProject.equipment.map((eq: string, i: number) => (

                        <li key={i}>{eq}</li>

                      ))}

                    </ul>

                  </>

                )}

                {(!selectedProject.equipment || selectedProject.equipment.length === 0) && (

                  <div className="italic text-gray-400 mt-2">{t('machiningSchool.noEquipmentListed')}</div>

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

              <div className="text-gray-700 mb-4">{t('machiningSchool.getStarted')}</div>

              <div className="flex justify-center space-x-4">

                <Link to="/welding/my-torch" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('machiningSchool.goToMyKitchen')}</Link>

                <Link to="/welding/my-weldbook" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('machiningSchool.goToMyCookbook')}</Link>

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

      <SetupPracticeModal

        open={benchPracticeOpen}

        onClose={() => setBenchPracticeOpen(false)}

        courses={syllabusData.courses}

      />

    </div>

  );

};



export default WeldingSchool;





