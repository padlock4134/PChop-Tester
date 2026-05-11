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
import SyllabusCard, { SyllabusCourse } from '../components/SyllabusCard';
import JobTimer from '../components/JobTimer';
import PanelPracticeModal from '../components/PanelPracticeModal';

const generalLessons = [
  { title: 'Electrical Safety & OSHA 10', desc: 'Lock-out/tag-out, PPE, and OSHA electrical safety standards.' },
  { title: 'Reading Wiring Diagrams', desc: 'How to trace circuits and understand schematic symbols.' },
  { title: 'NEC Code Fundamentals', desc: 'Navigating Article 110, 210, 220, and 300 for residential work.' },
  { title: 'Conduit Bending Basics', desc: 'Stub-ups, offsets, saddles, and back-to-back bends.' },
  { title: 'Panel Installation & Wiring', desc: 'Service entrance, main breaker, and branch circuit layout.' },
  { title: 'Tool & Meter Care', desc: 'Maintaining your multimeters, testers, and hand tools.' }
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
      title: 'Let\'s Wire This Circuit!',
      desc: 'How to approach the main task for this electrical job.'
    }
  ];
}

// 52 Fundamental Electrical Techniques (one for each week of the year)
const WEEKLY_TECHNIQUES = [
  // Safety & Fundamentals (Weeks 1-13)
  { title: "Lock-Out / Tag-Out Procedure", desc: "De-energizing and verifying safe working conditions" },
  { title: "Multimeter Basics", desc: "Measuring voltage, current, resistance, and continuity" },
  { title: "Identifying Wire Colors", desc: "Hot, neutral, ground — standard color codes by system" },
  { title: "Wire Stripping Technique", desc: "Stripping without nicking the conductor" },
  { title: "Making Wire Splices", desc: "Proper twist, wire nut, and push-connector technique" },
  { title: "Reading a Wiring Diagram", desc: "Tracing circuit paths through schematic symbols" },
  { title: "Conduit Types & Selection", desc: "EMT, RMC, PVC, and flexible conduit applications" },
  { title: "90° Conduit Bend", desc: "Measuring and bending an accurate 90-degree stub-up" },
  { title: "Offset Conduit Bend", desc: "Calculating and bending a two-bend offset" },
  { title: "Saddle Bend", desc: "Three-bend saddle around an obstruction" },
  { title: "Wire Pulling Techniques", desc: "Fish tape, pull string, and lubrication methods" },
  { title: "Box Fill Calculations", desc: "Counting conductors and selecting the right box size" },
  { title: "NEC Article 110 Basics", desc: "Requirements for electrical installations" },

  // Wiring Methods & Devices (Weeks 14-26)
  { title: "Receptacle Wiring", desc: "Back-wiring vs. terminal screws — code and best practice" },
  { title: "Switch Wiring", desc: "Single-pole, 3-way, and 4-way switch wiring" },
  { title: "GFCI & AFCI Devices", desc: "Where required and how to wire them correctly" },
  { title: "Ceiling Fan Installation", desc: "Fan-rated box, switch leg, and remote wiring" },
  { title: "Dimmer Switch Wiring", desc: "Load type compatibility and neutral requirements" },
  { title: "240V Receptacle Wiring", desc: "Two-pole breaker, wire sizing, and NEMA configurations" },
  { title: "Low-Voltage Wiring Basics", desc: "Cat6, speaker wire, and data cabling fundamentals" },
  { title: "Meter Socket Installation", desc: "Service entrance, meter can, and utility requirements" },
  { title: "Main Panel Layout", desc: "Main breaker, bus bars, neutral, and ground" },
  { title: "Branch Circuit Design", desc: "Load calculations and breaker sizing" },
  { title: "Sub-Panel Installation", desc: "Feeder sizing, grounding, and neutral isolation" },
  { title: "Grounding & Bonding", desc: "Equipment grounding conductors and system bonding" },
  { title: "NEC Article 210 & 220", desc: "Branch circuits and load calculation requirements" },

  // Load Calculations & Code (Weeks 27-39)
  { title: "Residential Load Calculation", desc: "Service size calculation using NEC Article 220" },
  { title: "Commercial Load Calculation", desc: "Demand factors and optional calculation methods" },
  { title: "Wire Sizing & Ampacity", desc: "NEC Table 310 and temperature correction factors" },
  { title: "Voltage Drop Calculation", desc: "Formula and conductor upsizing to limit drop" },
  { title: "Motor Circuit Sizing", desc: "FLA, branch circuit, and overload protection" },
  { title: "NEC Article 300 Wiring Methods", desc: "Conductor bundling, supports, and protection" },
  { title: "NEC Article 430 Motors", desc: "Motor feeder, branch circuit, and controller sizing" },
  { title: "Emergency Lighting Systems", desc: "Battery backup and transfer switch wiring" },
  { title: "Smoke & CO Detector Wiring", desc: "Interconnected circuits and code-required locations" },
  { title: "Outdoor & Wet Location Wiring", desc: "Weatherproof devices and conduit sealing" },
  { title: "Underground Conduit Installation", desc: "Burial depth, conduit fill, and waterproof splices" },
  { title: "Transformer Basics", desc: "Step-up, step-down, and isolation transformer wiring" },
  { title: "Power Factor Basics", desc: "Understanding reactive power and power factor correction" },

  // Inspections, Safety & Professional Skills (Weeks 40-52)
  { title: "Rough-In Inspection Prep", desc: "What inspectors look for before drywall" },
  { title: "Final Inspection Prep", desc: "Device covers, panel labels, and load test readiness" },
  { title: "Arc Flash Awareness", desc: "Incident energy, PPE levels, and labeling requirements" },
  { title: "Testing with a Megohmmeter", desc: "Insulation resistance testing for cables and motors" },
  { title: "Circuit Tracing Techniques", desc: "Using a tone generator and probe to map circuits" },
  { title: "Thermal Imaging Basics", desc: "Using an IR camera to find hot spots" },
  { title: "Service Upgrade Procedures", desc: "Coordinating utility work and permit requirements" },
  { title: "NEC Code Changes", desc: "Understanding updates between NEC editions" },
  { title: "Bid Takeoff Basics", desc: "Counting materials and labor hours from blueprints" },
  { title: "Customer Communication", desc: "Explaining electrical work without confusing the client" },
  { title: "Journeyman Exam Prep", desc: "Study strategies and key NEC articles to master" },
  { title: "Master License Requirements", desc: "Experience, exam, and continuing education requirements" },
  { title: "Career Pathways", desc: "Apprentice to journeyman to master electrician — the roadmap" }
];

// Get the technique for current week (1-52)
function getCurrentWeekTechnique() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((now.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
  const techniqueIndex = (weekNumber - 1) % 52; // Cycle through 52 techniques
  return WEEKLY_TECHNIQUES[techniqueIndex];
}

function getTwoTutorials(recipe: any) {
  if (!recipe) return [];
  
  const weeklyTechnique = getCurrentWeekTechnique();
  
  return [
    {
      title: `Technique of the Week: ${weeklyTechnique.title}`,
      desc: weeklyTechnique.desc,
      type: 'weekly_technique',
      techniqueData: weeklyTechnique
    },
    {
      title: `Let\'s Wire This Circuit!`,
      desc: `Step-by-step electrical walkthrough for ${recipe.title}.`,
      type: 'cooking_tutorial'
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

  // Mock syllabus data
  const mockSyllabusData = {
    title: "Electrical Technology Curriculum",
    courses: [
      {
        id: "course-1",
        title: "Term 1: Electrical Fundamentals",
        lessons: [
          { id: "lesson-1-1", title: "Electrical Safety, PPE, and LOTO", completed: true, current: false },
          { id: "lesson-1-2", title: "Basic Electrical Theory and Ohm's Law", completed: true, current: false },
          { id: "lesson-1-3", title: "Tools, Meters, and Test Equipment", completed: true, current: false },
          { id: "lesson-1-4", title: "Wire Types, Sizes, and Color Codes", completed: false, current: true },
          { id: "lesson-1-5", title: "NEC Code Introduction and Layout", completed: false, current: false },
        ]
      },
      {
        id: "course-2",
        title: "Term 1: Wiring Methods & Devices",
        lessons: [
          { id: "lesson-2-1", title: "Conduit Bending and Installation", completed: false, current: false },
          { id: "lesson-2-2", title: "Receptacles, Switches, and Fixtures", completed: false, current: false },
          { id: "lesson-2-3", title: "GFCI, AFCI, and Special Devices", completed: false, current: false },
          { id: "lesson-2-4", title: "Panel and Service Entrance Work", completed: false, current: false },
        ]
      },
      {
        id: "course-3",
        title: "Term 2: Load Calculations & Code",
        lessons: [
          { id: "lesson-3-1", title: "Residential Load Calculations", completed: false, current: false },
          { id: "lesson-3-2", title: "Commercial Wiring and Code", completed: false, current: false },
          { id: "lesson-3-3", title: "Motor Circuits and Controls", completed: false, current: false },
          { id: "lesson-3-4", title: "Low-Voltage and Data Systems", completed: false, current: false },
        ]
      },
      {
        id: "course-4",
        title: "Term 2: Inspections & Professional Practice",
        lessons: [
          { id: "lesson-4-1", title: "Rough-In and Final Inspection Prep", completed: false, current: false },
          { id: "lesson-4-2", title: "Troubleshooting and Circuit Tracing", completed: false, current: false },
          { id: "lesson-4-3", title: "Bid Takeoff and Job Costing", completed: false, current: false },
          { id: "lesson-4-4", title: "Journeyman Exam Prep and Career Pathways", completed: false, current: false },
        ]
      }
    ] as SyllabusCourse[]
  };

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
            title={mockSyllabusData.title}
            courses={mockSyllabusData.courses}
            onLessonClick={handleLessonClick}
            onButcherBlockClick={() => setBenchPracticeOpen(true)}
          />
        </div>
      </div>

      {/* Bench Practice Modal */}
      <PanelPracticeModal 
        open={benchPracticeOpen}
        onClose={() => setBenchPracticeOpen(false)}
      />
    </div>
  );
};

export default ElecSchool;


