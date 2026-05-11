import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../components/PipeFreddieContext';
import { useRecipeContext } from '../components/FitContext';
import VideoModal from '../components/VideoModal';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';
import { getMainEquipment, getMainMaterial } from '../utils/mainSelectors';
import { fetchNutritionData, calculateRecipeNutrition } from '../api/nutritionService';
import { KeyNutrients } from '../types/nutrition';
import SyllabusCard, { SyllabusCourse } from '../components/SyllabusCard';
import JobTimer from '../components/JobTimer';
import FitPracticeModal from '../components/FitPracticeModal';

const generalLessons = [
  { title: 'Pipe Fitting Basics', desc: 'Learn how to measure, cut, and join pipe like a pro.' },
  { title: 'Water Heater Installation', desc: 'How to install, connect, and test a water heater safely.' },
  { title: 'Drain, Waste & Vent Systems', desc: 'Master DWV design, trap installation, and vent stacks.' },
  { title: 'Code Compliance & Permits', desc: 'Navigate the IPC, pull permits, and pass inspections.' },
  { title: 'Soldering Copper Pipe', desc: 'How to sweat copper joints without leaks every time.' },
  { title: 'Troubleshooting Leaks', desc: 'Locating, diagnosing, and repairing plumbing leaks.' }
];

// Generate default tutorials including the weekly technique
function getDefaultTutorials(t: (key: string, options?: any) => string) {
  const weeklyTechnique = getCurrentWeekTechnique();
  
  return [
    {
      title: `${t('plumbingSchool.techniqueOfTheWeek', { defaultValue: 'Technique of the Week:' })} ${weeklyTechnique.title}`,
      desc: weeklyTechnique.desc,
      type: 'weekly_technique',
      techniqueData: weeklyTechnique
    },
    {
      title: t('plumbingSchool.letsCookThisMeal', { defaultValue: "Let's Work This Job!" }),
      desc: t('plumbingSchool.projectApproach', { defaultValue: 'How to approach the main task for this project.' })
    }
  ];
}

// 52 Fundamental Plumbing Techniques (one for each week of the year)
const WEEKLY_TECHNIQUES = [
  // Pipe & Fitting Fundamentals (Weeks 1-13)
  { title: "Measuring & Cutting Pipe", desc: "Accurate measurements and clean cuts for leak-free joints" },
  { title: "PVC Cement & Primer", desc: "Proper bonding technique for plastic pipe assemblies" },
  { title: "Copper Soldering Basics", desc: "Sweating copper joints without leaks every time" },
  { title: "Threading Steel Pipe", desc: "Using a die to create precise male threads" },
  { title: "Press Fittings", desc: "No-solder press-connect installation technique" },
  { title: "Push-Fit Connectors", desc: "SharkBite-style fittings for quick, reliable repairs" },
  { title: "Flare Fittings", desc: "Creating a flared connection for gas and refrigerant lines" },
  { title: "Compression Fittings", desc: "Proper ferrule and nut assembly for leak-free connections" },
  { title: "Pipe Sizing Selection", desc: "Choosing correct diameter for required flow rates" },
  { title: "Working with PEX", desc: "Expansion rings and crimp rings explained" },
  { title: "Cast Iron Pipe Handling", desc: "Cutting and joining no-hub cast iron pipe" },
  { title: "Reading Pipe Specs", desc: "Understanding schedule, pressure ratings, and material codes" },
  { title: "Pipe Support Spacing", desc: "Correct hanger intervals per code requirements" },

  // Water Systems (Weeks 14-26)
  { title: "Water Pressure Testing", desc: "Using a gauge to verify and troubleshoot system pressure" },
  { title: "Shut-Off Valve Installation", desc: "Ball valves vs. gate valves — when to use each" },
  { title: "Water Heater Connection", desc: "Supply and return lines, T&P valve, and safe venting" },
  { title: "Backflow Preventer Install", desc: "Types, orientation, and code-required locations" },
  { title: "Expansion Tank Sizing", desc: "Sizing and pre-charging a thermal expansion tank" },
  { title: "Pressure Reducing Valve", desc: "Setting and adjusting a PRV for optimal pressure" },
  { title: "Hot and Cold Water Routing", desc: "Code-compliant separation, insulation, and color coding" },
  { title: "Fixture Rough-In Dimensions", desc: "Standard heights and distances from finished wall" },
  { title: "Water Hammer Arrestors", desc: "Installing arrestors to eliminate water hammer noise" },
  { title: "Anti-Scald Devices", desc: "Thermostatic mixing valves for residential safety" },
  { title: "Water Softener Bypass", desc: "Installing and servicing bypass valves correctly" },
  { title: "Supply Line Materials", desc: "Comparing brass, braided, and copper supply lines" },
  { title: "Meter Connections", desc: "Working safely around the water meter" },

  // Drain, Waste & Vent (Weeks 27-39)
  { title: "Drain Slope Calculation", desc: "The 1/4\" per foot rule and code-approved deviations" },
  { title: "P-Trap Installation", desc: "Correct sizing, depth, and positioning for every fixture" },
  { title: "Vent Stack Basics", desc: "How venting prevents siphoning and odor infiltration" },
  { title: "Air Admittance Valves", desc: "When and where AAVs are code-permitted" },
  { title: "Wet Venting Explained", desc: "Combining drain and vent functions in one pipe" },
  { title: "Stack Venting", desc: "Running vents safely through the roof structure" },
  { title: "Cleanout Installation", desc: "Placement, access, and sizing requirements per code" },
  { title: "Floor Drain Installation", desc: "Trap primer systems and proper slope to drain" },
  { title: "Shower Pan Connections", desc: "Mortar bed vs. prefab pans — waterproofing and drainage" },
  { title: "Toilet Rough-In", desc: "Flange height, wax ring selection, and closet bolt placement" },
  { title: "Sink Drain Assembly", desc: "Pop-up assemblies, basket strainers, and P-trap alignment" },
  { title: "Drain Camera Inspection", desc: "Using a scope camera to locate blockages and root intrusion" },
  { title: "Grease Trap Basics", desc: "Sizing, installation, and maintenance for commercial vans" },

  // Code, Safety & Professional Skills (Weeks 40-52)
  { title: "Reading the IPC", desc: "How to navigate the International Plumbing Code efficiently" },
  { title: "Permit Process", desc: "When permits are required, how to pull them, and inspection prep" },
  { title: "Pressure Test Procedures", desc: "Air test vs. water test — when each is required" },
  { title: "Gas Line Basics", desc: "CSST and black iron piping for gas distribution" },
  { title: "Solvent Welding Safety", desc: "Ventilation, PPE, and safe handling of cement and primer" },
  { title: "Trenching Safety", desc: "Shoring requirements and call-before-you-dig compliance" },
  { title: "Lead & Asbestos Awareness", desc: "Identification and safe work practices in older buildings" },
  { title: "Water Quality Testing", desc: "Interpreting a basic water test report for customers" },
  { title: "Backflow Testing Procedures", desc: "Annual test requirements, reporting, and certification" },
  { title: "Winterizing a System", desc: "Draining and protecting pipes from freeze damage" },
  { title: "Service Call Professionalism", desc: "Customer communication, job documentation, and callbacks" },
  { title: "Estimating Materials", desc: "Calculating accurate quantities for a rough-in bid" },
  { title: "Career Pathways", desc: "Apprentice to journeyman to master plumber — the roadmap" }
];

// Get the technique for current week (1-52)
function getCurrentWeekTechnique() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((now.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
  const techniqueIndex = (weekNumber - 1) % 52; // Cycle through 52 techniques
  return WEEKLY_TECHNIQUES[techniqueIndex];
}

function getTwoTutorials(fit: any, t: (key: string, options?: any) => string) {
  if (!fit) return [];
  
  const weeklyTechnique = getCurrentWeekTechnique();
  
  return [
    {
      title: `${t('plumbingSchool.techniqueOfTheWeek', { defaultValue: 'Technique of the Week:' })} ${weeklyTechnique.title}`,
      desc: weeklyTechnique.desc,
      type: 'weekly_technique',
      techniqueData: weeklyTechnique
    },
    {
      title: t('plumbingSchool.letsCookThisMeal', { defaultValue: "Let's Work This Job!" }),
      desc: t('plumbingSchool.projectWalkthrough', { defaultValue: `Step-by-step project walkthrough for ${fit.title}.`, title: fit.title }),
      type: 'cooking_tutorial'
    }
  ];
}


const PlumbingSchool = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { selectedRecipe } = useRecipeContext();
  console.log('Plumbing School - Project data:', selectedRecipe?.nutrition);
  console.log('Plumbing School - Full Project:', selectedRecipe);
  const [modalIdx, setModalIdx] = useState<null | number>(null);
  const [fitNutrition, setFitNutrition] = useState<KeyNutrients | null>(null);
  const [servingSize, setServingSize] = useState(2);
  const [benchPracticeOpen, setBenchPracticeOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'school' | 'syllabus'>('school');

  // Mock syllabus data
  const mockSyllabusData = {
    title: t('plumbingSchool.curriculumTitle', { defaultValue: 'Plumbing Technology Curriculum' }),
    courses: [
      {
        id: "course-1",
        title: t('plumbingSchool.term1Fundamentals', { defaultValue: 'Term 1: Plumbing Fundamentals' }),
        lessons: [
          { id: "lesson-1-1", title: t('plumbingSchool.lessonSafetyPpe', { defaultValue: 'Safety, PPE, and Job Site Procedures' }), completed: true, current: false },
          { id: "lesson-1-2", title: t('plumbingSchool.lessonToolsMaterials', { defaultValue: 'Tools, Materials, and Pipe Types' }), completed: true, current: false },
          { id: "lesson-1-3", title: t('plumbingSchool.lessonIntroCode', { defaultValue: 'Introduction to the Plumbing Code' }), completed: true, current: false },
          { id: "lesson-1-4", title: t('plumbingSchool.lessonPipeFitting', { defaultValue: 'Basic Pipe Fitting and Joining' }), completed: false, current: true },
          { id: "lesson-1-5", title: t('plumbingSchool.lessonMeasurements', { defaultValue: 'Measurements, Math, and Conversions' }), completed: false, current: false },
        ]
      },
      {
        id: "course-2",
        title: t('plumbingSchool.term1WaterSupply', { defaultValue: 'Term 1: Water Supply Systems' }),
        lessons: [
          { id: "lesson-2-1", title: t('plumbingSchool.lessonHotColdWater', { defaultValue: 'Hot and Cold Water Distribution' }), completed: false, current: false },
          { id: "lesson-2-2", title: t('plumbingSchool.lessonShutOffValves', { defaultValue: 'Shut-Off Valves and Pressure Control' }), completed: false, current: false },
          { id: "lesson-2-3", title: t('plumbingSchool.lessonWaterHeater', { defaultValue: 'Water Heater Installation' }), completed: false, current: false },
          { id: "lesson-2-4", title: t('plumbingSchool.lessonBackflow', { defaultValue: 'Backflow Prevention and Testing' }), completed: false, current: false },
        ]
      },
      {
        id: "course-3",
        title: t('plumbingSchool.term2Dwv', { defaultValue: 'Term 2: Drain, Waste & Vent' }),
        lessons: [
          { id: "lesson-3-1", title: t('plumbingSchool.lessonDwvDesign', { defaultValue: 'DWV System Design' }), completed: false, current: false },
          { id: "lesson-3-2", title: t('plumbingSchool.lessonTrapVent', { defaultValue: 'Trap and Vent Installation' }), completed: false, current: false },
          { id: "lesson-3-3", title: t('plumbingSchool.lessonCodeDrainage', { defaultValue: 'Code-Compliant Drainage' }), completed: false, current: false },
          { id: "lesson-3-4", title: t('plumbingSchool.lessonCleanoutCamera', { defaultValue: 'Cleanouts and Drain Camera Basics' }), completed: false, current: false },
        ]
      },
      {
        id: "course-4",
        title: t('plumbingSchool.term2ProfessionalPractice', { defaultValue: 'Term 2: Professional Practice' }),
        lessons: [
          { id: "lesson-4-1", title: t('plumbingSchool.lessonEstimating', { defaultValue: 'Estimating and Bidding Jobs' }), completed: false, current: false },
          { id: "lesson-4-2", title: t('plumbingSchool.lessonPermits', { defaultValue: 'Permits, Inspections, and Licensing' }), completed: false, current: false },
          { id: "lesson-4-3", title: t('plumbingSchool.lessonCustomerService', { defaultValue: 'Customer Service and Job Documentation' }), completed: false, current: false },
          { id: "lesson-4-4", title: t('plumbingSchool.lessonCareerPathways', { defaultValue: 'Career Pathways in Plumbing' }), completed: false, current: false },
        ]
      }
    ] as SyllabusCourse[]
  };

  const handleLessonClick = (lessonId: string) => {
    console.log(`Navigating to lesson: ${lessonId}`);
  };

  useEffect(() => {
    updateContext({ page: 'PlumbingSchool' });
  }, [updateContext]);

  useEffect(() => {
    if (selectedRecipe && !selectedRecipe.nutrition) {
      // Calculate nutrition if missing
      calculateRecipeNutrition(selectedRecipe.materials)
        .then(nutrition => {
          setFitNutrition(nutrition);
        })
        .catch(error => {
          console.error('Error calculating nutrition:', error);
        });
    } else {
      setFitNutrition(selectedRecipe?.nutrition || null);
    }
  }, [selectedRecipe]);

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
      console.log('[PlumbingSchool] Fetching videos with API key rotation');
      console.log('[PlumbingSchool] Tutorials to fetch:', tutorials);
      console.log('[PlumbingSchool] Selected project:', selectedRecipe);

      const newUrls: (string | null)[] = [null, null];
      await Promise.all(tutorials.map(async (tut, idx) => {
        try {
          // Use the improved video query generation that handles different tutorial types
          const query = await getVideoQueryFromFreddie(
            selectedRecipe || { title: '', materials: [], equipment: [] }, 
            tut, 
            idx
          );
          
          console.log(`[PlumbingSchool] Tutorial ${idx} (${tut.type || 'legacy'}) query:`, query);
          
          const result: TutorialVideoResult = await getTutorialVideo(query);
          console.log(`[PlumbingSchool] Tutorial ${idx} result:`, result);
          
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
          <div className="flex items-center justify-center p-6 pb-4">
            <span className="text-5xl mr-2">🪠</span>
            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('plumbingSchool.title')}</h1>
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
            {/* Fit Card Display at Bottom (matching MyPipeBook fit layout) */}
            <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-black overflow-hidden w-full min-h-[350px] mt-8 mx-auto relative">
              <button
                onClick={() => window.location.reload()}
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
                {fitNutrition && (
                  <div className="mt-2">
                    <div className="font-semibold mb-1">{t('plumbingSchool.nutritionTotal').replace('{servings}', servingSize.toString())}:</div>
                    <div className="text-sm">
                      <div>{t('plumbingSchool.carbs')}: {(fitNutrition.carbs * servingSize).toFixed(1)}g</div>
                      <div>{t('plumbingSchool.sugars')}: {(fitNutrition.sugars * servingSize).toFixed(1)}g</div>
                      <div>{t('plumbingSchool.fiber')}: {(fitNutrition.fiber * servingSize).toFixed(1)}g</div>
                      <div>{t('plumbingSchool.protein')}: {(fitNutrition.protein * servingSize).toFixed(1)}g</div>
                    </div>
                  </div>
                )}
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
            title={mockSyllabusData.title}
            courses={mockSyllabusData.courses}
            onLessonClick={handleLessonClick}
            onButcherBlockClick={() => setBenchPracticeOpen(true)}
          />
        </div>
      </div>

      {/* Bench Practice Modal */}
      <FitPracticeModal 
        open={benchPracticeOpen}
        onClose={() => setBenchPracticeOpen(false)}
      />
    </div>
  );
};

export default PlumbingSchool;
