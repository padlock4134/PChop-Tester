import React, { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import { useFreddieContext } from '../components/BenchFreddieContext';

import VideoModal from '../components/VideoModal';

import { useProjectContext } from '../components/PartContext';

import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';

// mainSelectors not used - welding helpers defined locally

import SyllabusCard, { SyllabusCourse } from '../components/SyllabusCard';

import CycleTimer from '../components/CycleTimer';

import SetupPracticeModal from '../components/SetupPracticeModal';



const generalLessons = [

  { title: 'Welding Safety & PPE', desc: 'Proper use of helmets, gloves, jackets, respirators, and shop ventilation.' },

  { title: 'SMAW (Stick) Fundamentals', desc: 'Electrode selection, arc striking, bead placement, and slag removal.' },

  { title: 'GMAW (MIG) Basics', desc: 'Wire feed setup, shielding gas selection, and flat/horizontal welding.' },

  { title: 'GTAW (TIG) Fundamentals', desc: 'Tungsten selection, torch angle, filler rod feeding, and gas coverage.' },

  { title: 'Blueprint Reading for Welders', desc: 'Weld symbols, joint types, and reading fabrication drawings.' },

  { title: 'Weld Inspection & Testing', desc: 'Visual inspection, bend tests, and understanding AWS D1.1 acceptance criteria.' }

];



// Generate default tutorials including the weekly technique

function getDefaultTutorials() {

  const weeklyTechnique = getCurrentWeekTechnique();

  

  return [

    {

      title: `Technique of the Week: ${weeklyTechnique.title}`,

      desc: weeklyTechnique.desc,

      type: 'weekly_technique',

      techniqueData: weeklyTechnique

    },

    {

      title: 'Let\'s Weld This Joint!',

      desc: 'How to approach the main weld for this project.'

    }

  ];

}



// 52 Fundamental Welding Techniques (one for each week of the year)

const WEEKLY_TECHNIQUES = [

  // Safety & Fundamentals (Weeks 1-13)

  { title: "Welding Safety & PPE", desc: "Helmet auto-darkening, leather gloves, FR jackets, and ventilation" },

  { title: "Arc Welding Principles", desc: "How the electric arc melts base metal and filler to form a weld" },

  { title: "Joint Types & Fit-Up", desc: "Butt, lap, tee, corner, and edge joints — preparation and alignment" },

  { title: "Weld Symbols", desc: "Reading AWS weld symbols on fabrication drawings" },

  { title: "Electrode Classification", desc: "Understanding E6010, E6013, E7018, and their applications" },

  { title: "Shielding Gas Basics", desc: "Argon, CO2, 75/25 mix, and tri-mix — when to use each" },

  { title: "Base Metal ID", desc: "Spark test, magnet test, and identifying mild steel, stainless, and aluminum" },

  { title: "Filler Metal Selection", desc: "Matching filler to base metal — ER70S-6, ER308L, ER4043" },

  { title: "Welding Positions", desc: "Flat (1G/1F), horizontal (2G/2F), vertical (3G/3F), overhead (4G/4F)" },

  { title: "Tack Welding", desc: "Proper tack size, spacing, and sequence to prevent distortion" },

  { title: "Distortion Control", desc: "Pre-setting, back-stepping, and clamping to manage weld shrinkage" },

  { title: "Heat Input Basics", desc: "Amps × volts ÷ travel speed — why it matters for weld quality" },

  { title: "Shop Math for Welders", desc: "Angles, area, volume, and weight calculations for fabrication" },



  // SMAW / Stick Welding (Weeks 14-20)

  { title: "SMAW Machine Setup", desc: "Polarity selection (DCEP/DCEN), amperage range, and lead connections" },

  { title: "Arc Striking & Control", desc: "Scratch start vs. tap start, arc length, and travel angle" },

  { title: "Stringer Beads (Flat)", desc: "Running consistent flat-position beads with E7018" },

  { title: "Weave Patterns", desc: "C-weave, Z-weave, and figure-8 for wider passes" },

  { title: "Vertical Up (3G Stick)", desc: "Shelf technique and keyhole method for vertical welding" },

  { title: "Overhead Stick (4G)", desc: "Short arc, tight weave, and body positioning for overhead" },

  { title: "Open Root with 6010", desc: "Keyhole technique, root penetration, and hot pass" },



  // GMAW / MIG Welding (Weeks 21-28)

  { title: "MIG Machine Setup", desc: "Wire speed, voltage, gas flow rate, and contact tip selection" },

  { title: "MIG Flat & Horizontal", desc: "Push vs. drag technique, travel speed, and bead appearance" },

  { title: "MIG Vertical Up", desc: "Triangle weave and proper heat management climbing vertical" },

  { title: "Short Circuit vs. Spray Transfer", desc: "When to use each transfer mode and parameter ranges" },

  { title: "Flux-Core (FCAW)", desc: "Self-shielded vs. dual-shield, slag removal, and applications" },

  { title: "MIG Aluminum", desc: "Spool gun setup, push technique, and cleaning requirements" },

  { title: "MIG Stainless Steel", desc: "Tri-mix gas, heat control, and avoiding sugaring" },

  { title: "MIG Troubleshooting", desc: "Porosity, bird-nesting, burn-through, and lack of fusion fixes" },



  // GTAW / TIG Welding (Weeks 29-38)

  { title: "TIG Machine Setup", desc: "Tungsten selection, cup size, gas flow, and AC/DC settings" },

  { title: "TIG Flat Beads (Steel)", desc: "Torch angle, filler dipping rhythm, and puddle control" },

  { title: "TIG Fillet Welds", desc: "Equal-leg fillets on tee joints with proper tie-in" },

  { title: "TIG Walking the Cup", desc: "Pipe welding technique for consistent root and fill passes" },

  { title: "TIG Aluminum (AC)", desc: "Cleaning action, balance control, and crater fill" },

  { title: "TIG Stainless Steel", desc: "Back purging, heat control, and maintaining color" },

  { title: "TIG Pipe — 2G Roll", desc: "Root, hot, fill, and cap passes on rolled pipe" },

  { title: "TIG Pipe — 6G Fixed", desc: "Open root technique on 6G fixed-position pipe" },

  { title: "Tungsten Prep & Grinding", desc: "Proper taper, point angle, and avoiding contamination" },

  { title: "TIG Troubleshooting", desc: "Tungsten inclusions, porosity, underfill, and gas coverage issues" },



  // Advanced & Professional (Weeks 39-52)

  { title: "Oxy-Fuel Cutting", desc: "Torch setup, preheat, and cutting mild steel plate and pipe" },

  { title: "Plasma Cutting", desc: "Machine setup, consumables, and cutting various thicknesses" },

  { title: "Weld Inspection (Visual)", desc: "Undercut, porosity, overlap, incomplete fusion — what to look for" },

  { title: "Destructive Testing", desc: "Bend tests, break tests, and macro etch procedures" },

  { title: "Non-Destructive Testing Intro", desc: "PT, MT, UT, RT — overview of NDE methods" },

  { title: "WPS & PQR", desc: "Understanding Welding Procedure Specifications and qualification records" },

  { title: "AWS D1.1 Overview", desc: "Structural steel welding code — scope, prequalified joints, and acceptance" },

  { title: "Pipe Welding Codes", desc: "ASME Section IX, API 1104, and qualification requirements" },

  { title: "Preheating & PWHT", desc: "When and why to preheat, interpass temps, and post-weld heat treatment" },

  { title: "Welding Metallurgy Basics", desc: "HAZ, grain structure, and how heat affects base metal properties" },

  { title: "Fabrication Layout", desc: "Measuring, marking, and fitting structural members for welding" },

  { title: "AWS Certification Prep", desc: "Study strategies for AWS CW, CWI, and performance qualifications" },

  { title: "Welder Career Pathways", desc: "Apprentice to journeyman to CWI — the roadmap" },

  { title: "Specialty Processes", desc: "SAW, ESW, brazing, soldering — niche processes and applications" }

];



// Get the technique for current week (1-52)

function getCurrentWeekTechnique() {

  const now = new Date();

  const start = new Date(now.getFullYear(), 0, 1);

  const weekNumber = Math.ceil((((now.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);

  const techniqueIndex = (weekNumber - 1) % 52; // Cycle through 52 techniques

  return WEEKLY_TECHNIQUES[techniqueIndex];

}



function getTwoTutorials(project: any) {

  if (!project) return [];

  

  const weeklyTechnique = getCurrentWeekTechnique();

  

  return [

    {

      title: `Technique of the Week: ${weeklyTechnique.title}`,

      desc: weeklyTechnique.desc,

      type: 'weekly_technique',

      techniqueData: weeklyTechnique

    },

    {

      title: `Let\'s Weld This Joint!`,

      desc: `Step-by-step welding walkthrough for ${project.title}.`,

      type: 'welding_tutorial'

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



  // Mock syllabus data

  const mockSyllabusData = {

    title: "Welding Technology Curriculum",

    courses: [

      {

        id: "course-1",

        title: "Term 1: Welding Fundamentals",

        lessons: [

          { id: "lesson-1-1", title: "Welding Safety, PPE, and OSHA Basics", completed: true, current: false },

          { id: "lesson-1-2", title: "Arc Welding Principles and Joint Types", completed: true, current: false },

          { id: "lesson-1-3", title: "Blueprint Reading and Weld Symbols", completed: true, current: false },

          { id: "lesson-1-4", title: "Base Metals, Filler Metals, and Shielding Gases", completed: false, current: true },

          { id: "lesson-1-5", title: "Fit-Up, Tack Welding, and Distortion Control", completed: false, current: false },

        ]

      },

      {

        id: "course-2",

        title: "Term 1: SMAW & GMAW Operations",

        lessons: [

          { id: "lesson-2-1", title: "SMAW: Machine Setup, Electrodes, and Flat Position", completed: false, current: false },

          { id: "lesson-2-2", title: "SMAW: Vertical, Overhead, and Open Root Techniques", completed: false, current: false },

          { id: "lesson-2-3", title: "GMAW: Machine Setup, Transfer Modes, and Flat/Horizontal", completed: false, current: false },

          { id: "lesson-2-4", title: "GMAW: Vertical, Aluminum, Stainless, and Troubleshooting", completed: false, current: false },

        ]

      },

      {

        id: "course-3",

        title: "Term 2: GTAW & Cutting Processes",

        lessons: [

          { id: "lesson-3-1", title: "GTAW: Machine Setup, Tungsten Prep, and Steel Beads", completed: false, current: false },

          { id: "lesson-3-2", title: "GTAW: Aluminum, Stainless, and Pipe Welding", completed: false, current: false },

          { id: "lesson-3-3", title: "Oxy-Fuel Cutting and Plasma Cutting", completed: false, current: false },

          { id: "lesson-3-4", title: "FCAW: Self-Shielded and Dual-Shield Applications", completed: false, current: false },

        ]

      },

      {

        id: "course-4",

        title: "Term 2: Inspection, Codes & Professional Practice",

        lessons: [

          { id: "lesson-4-1", title: "Weld Inspection: Visual, Destructive, and NDE Methods", completed: false, current: false },

          { id: "lesson-4-2", title: "WPS, PQR, and Welding Codes (AWS D1.1, ASME IX)", completed: false, current: false },

          { id: "lesson-4-3", title: "Welding Metallurgy, Preheating, and PWHT", completed: false, current: false },

          { id: "lesson-4-4", title: "AWS Certification Prep and Career Pathways", completed: false, current: false },

        ]

      }

    ] as SyllabusCourse[]

  };



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

    <div className="w-full mt-4">

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

      

      <div className="flex flex-col lg:flex-row gap-6">

        <div className={`lg:w-2/3 bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue ${

          activeMobileTab === 'school' ? 'block' : 'hidden lg:block'

        }`}>

          {/* Welding School header */}

          <div className="flex items-center justify-center mb-4">

            <span className="text-5xl mr-2">🔩</span>

            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('machiningSchool.title')}</h1>

          </div>

          

          {/* Separation line */}

          <hr className="border-t-2 border-maineBlue mb-6" />

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

            <ol className="space-y-4">

              {tutorials.map((tut, idx) => (

                <li

                  key={idx}

                  className="bg-sand p-4 rounded shadow-inner border border-black relative cursor-pointer hover:bg-sky-300 hover:text-maineBlue transition-colors"

                  onClick={() => setModalIdx(idx)}

                >

                  <div className="font-bold mb-1">{tut.title}</div>

                  <div className="text-sm text-gray-700">{tut.desc}</div>

                </li>

              ))}

            </ol>

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

            <ol className="space-y-4 mt-8">

              {tutorials.map((tut, idx) => (

                <li

                  key={idx}

                  className="bg-sand p-4 rounded shadow-inner border border-black relative cursor-pointer hover:bg-sky-300 hover:text-maineBlue transition-colors"

                  onClick={() => setModalIdx(idx)}

                >

                  <div className="font-bold mb-1">{tut.title}</div>

                  <div className="text-sm text-gray-700">{tut.desc}</div>

                </li>

              ))}

            </ol>

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

        

        <div className={`lg:w-1/3 ${

          activeMobileTab === 'syllabus' ? 'block' : 'hidden lg:block'

        }`}>

          <SyllabusCard 

            title={mockSyllabusData.title}

            courses={mockSyllabusData.courses}

            onLessonClick={handleLessonClick}

            onButcherBlockClick={() => setBenchPracticeOpen(true)}

          />

        </div>

      </div>



      {/* Bench Practice Modal */}

      <SetupPracticeModal 

        open={benchPracticeOpen}

        onClose={() => setBenchPracticeOpen(false)}

      />

    </div>

  );

};



export default WeldingSchool;





