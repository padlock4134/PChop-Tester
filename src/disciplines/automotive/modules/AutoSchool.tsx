import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../../culinary/components/FreddieContext';
import VideoModal from '../components/VideoModal';
import { useRecipeContext } from '../../culinary/components/RecipeContext';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';
import { getMainEquipment, getMainPart } from '../utils/mainSelectors';
import { fetchNutritionData, calculateRecipeNutrition } from '../../culinary/api/nutritionService';
import { KeyNutrients } from '../../culinary/types/nutrition';
import SyllabusCard, { SyllabusCourse } from '../components/SyllabusCard';
import JobTimer from '../components/JobTimer';
import BayPracticeModal from '../components/BayPracticeModal';

const generalLessons = [
  { title: 'Engine Diagnostics 101', desc: 'Learn how to use a scan tool and interpret fault codes like a pro.' },
  { title: 'Brake System Service', desc: 'How to inspect, measure, and replace brake pads and rotors safely.' },
  { title: 'Electrical Systems Fundamentals', desc: 'Master wiring diagrams, multimeters, and circuit testing.' },
  { title: 'Oil & Fluid Service', desc: 'Proper procedures for oil changes, flushes, and fluid top-offs.' },
  { title: 'Tire & Wheel Service', desc: 'How to mount, balance, and perform a four-wheel alignment.' },
  { title: 'Tool & Equipment Care', desc: 'Cleaning, calibrating, and maintaining your shop tools.' }
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
      title: 'Let\'s Work This Repair!',
      desc: 'How to approach the main task for this repair order.'
    }
  ];
}

// 52 Fundamental Automotive Techniques (one for each week of the year)
const WEEKLY_TECHNIQUES = [
  // Diagnostics & Scan Tool Fundamentals (Weeks 1-13)
  { title: "OBD-II Scan Tool Basics", desc: "Connecting a scanner and reading live data and fault codes" },
  { title: "Reading a Wiring Diagram", desc: "Tracing circuits from power source to ground" },
  { title: "Multimeter Mastery", desc: "Measuring voltage, resistance, and current accurately" },
  { title: "Compression Testing", desc: "Evaluating cylinder health with a compression gauge" },
  { title: "Vacuum Leak Detection", desc: "Using smoke or propane to find intake leaks" },
  { title: "Fuel Pressure Testing", desc: "Testing the fuel system for pressure and volume" },
  { title: "Oscilloscope Basics", desc: "Reading sensor waveforms to find electrical faults" },
  { title: "TSB & Service Data Research", desc: "Finding and applying technical service bulletins" },
  { title: "Battery Load Testing", desc: "Verifying battery capacity under load conditions" },
  { title: "Coolant System Pressure Test", desc: "Finding leaks in the cooling system" },
  { title: "Fuel Injector Testing", desc: "Balance testing and flow-rate verification" },
  { title: "MAP vs. MAF Sensors", desc: "Understanding and testing air measurement sensors" },
  { title: "O2 Sensor Analysis", desc: "Reading oxygen sensor data to diagnose fuel trim issues" },

  // Engine & Drivetrain (Weeks 14-26)
  { title: "Timing Belt Replacement", desc: "Proper timing marks and tensioner procedures" },
  { title: "Valve Clearance Adjustment", desc: "Measuring and setting valve lash" },
  { title: "Head Gasket Diagnosis", desc: "Combustion leak test and coolant analysis" },
  { title: "Oil Consumption Diagnosis", desc: "Finding causes of excessive oil use" },
  { title: "Clutch Replacement", desc: "Flywheel inspection and clutch pack installation" },
  { title: "CV Axle Replacement", desc: "Half-shaft removal, inspection, and installation" },
  { title: "Differential Service", desc: "Fluid change and backlash inspection" },
  { title: "Transmission Fluid Service", desc: "Drain, fill, and filter replacement procedures" },
  { title: "Engine Mount Inspection", desc: "Checking for worn or broken motor mounts" },
  { title: "Serpentine Belt Service", desc: "Belt routing, tension, and pulley inspection" },
  { title: "Water Pump Replacement", desc: "Sealing techniques and impeller inspection" },
  { title: "Thermostat Replacement", desc: "Correct orientation and coolant system bleeding" },
  { title: "Turbocharger Basics", desc: "Inspection, oil feed, and boost system fundamentals" },

  // Brakes, Suspension & Steering (Weeks 27-39)
  { title: "Brake Pad & Rotor Replacement", desc: "Measuring rotor thickness and proper bed-in procedure" },
  { title: "Brake Caliper Service", desc: "Slide pin lubrication and piston retraction" },
  { title: "Brake Fluid Flush", desc: "Bleeding procedures and DOT fluid specifications" },
  { title: "ABS System Diagnosis", desc: "Wheel speed sensor testing and module codes" },
  { title: "Wheel Bearing Replacement", desc: "Hub-style vs. press-in bearing procedures" },
  { title: "Strut & Shock Replacement", desc: "Spring compressor safety and alignment needs" },
  { title: "Ball Joint Inspection", desc: "Wear measurement and replacement procedures" },
  { title: "Tie Rod Replacement", desc: "Inner and outer tie rod procedures and alignment" },
  { title: "Power Steering Service", desc: "Fluid flush and rack inspection basics" },
  { title: "Four-Wheel Alignment", desc: "Caster, camber, and toe adjustment fundamentals" },
  { title: "Tire Rotation Patterns", desc: "Directional vs. non-directional rotation sequences" },
  { title: "TPMS Service", desc: "Sensor programming and relearn procedures" },
  { title: "Brake Drum Service", desc: "Measuring drums and adjusting self-adjusters" },

  // Electrical, HVAC & Professional Skills (Weeks 40-52)
  { title: "Starter & Alternator Testing", desc: "Load testing charging and starting system components" },
  { title: "A/C System Diagnosis", desc: "Refrigerant recovery, leak detection, and recharge" },
  { title: "Cabin Air Filter Service", desc: "Locating and replacing HVAC cabin filters" },
  { title: "Headlight Aim Adjustment", desc: "Proper aiming procedure using a wall pattern" },
  { title: "Fuse & Relay Diagnosis", desc: "Testing fuses and relays with a multimeter" },
  { title: "Key Programming Basics", desc: "Transponder key and key fob programming procedures" },
  { title: "Hybrid Safety Protocols", desc: "High-voltage system shutdown and PPE requirements" },
  { title: "Service Information Systems", desc: "Using AllData, Mitchell, and OEM portals effectively" },
  { title: "Repair Order Writing", desc: "Documenting diagnosis, labor, and parts professionally" },
  { title: "Customer Communication", desc: "Explaining repairs and estimates without jargon" },
  { title: "Estimating Labor Time", desc: "Using flat-rate manuals and flagging hours" },
  { title: "ASE Certification Prep", desc: "Test-taking strategies and study resources for ASE exams" },
  { title: "Career Pathways", desc: "Lube tech to master technician — the ASE roadmap" }
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
      title: `Let\'s Work This Repair!`,
      desc: `Repair walkthrough for ${recipe.title}.`,
      type: 'repair_tutorial'
    }
  ];
}


const AutoSchool = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { selectedRecipe } = useRecipeContext();
  console.log('Auto School - Repair data:', selectedRecipe?.nutrition);
  console.log('Auto School - Full Repair Order:', selectedRecipe);
  const [modalIdx, setModalIdx] = useState<null | number>(null);
  const [recipeNutrition, setRecipeNutrition] = useState<KeyNutrients | null>(null);
  const [teamSize, setTeamSize] = useState(2);
  const [benchPracticeOpen, setBenchPracticeOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'school' | 'syllabus'>('school');

  // Mock syllabus data
  const mockSyllabusData = {
    title: "Auto Tech Curriculum",
    courses: [
      {
        id: "course-1",
        title: "Term 1: Automotive Fundamentals",
        lessons: [
          { id: "lesson-1-1", title: "Shop Safety, PPE, and OSHA Basics", completed: true, current: false },
          { id: "lesson-1-2", title: "Hand Tools, Power Tools, and Shop Equipment", completed: true, current: false },
          { id: "lesson-1-3", title: "Vehicle Identification and Service Information", completed: true, current: false },
          { id: "lesson-1-4", title: "Fasteners, Seals, and Gaskets", completed: false, current: true },
          { id: "lesson-1-5", title: "Automotive Electrical Fundamentals", completed: false, current: false },
        ]
      },
      {
        id: "course-2",
        title: "Term 1: Engine & Drivetrain",
        lessons: [
          { id: "lesson-2-1", title: "Engine Operation and Component ID", completed: false, current: false },
          { id: "lesson-2-2", title: "Lubrication and Cooling Systems", completed: false, current: false },
          { id: "lesson-2-3", title: "Fuel and Intake Systems", completed: false, current: false },
          { id: "lesson-2-4", title: "Transmission and Driveline Basics", completed: false, current: false },
        ]
      },
      {
        id: "course-3",
        title: "Term 2: Brakes, Suspension & Steering",
        lessons: [
          { id: "lesson-3-1", title: "Brake System Fundamentals", completed: false, current: false },
          { id: "lesson-3-2", title: "Brake Service and Inspection", completed: false, current: false },
          { id: "lesson-3-3", title: "Suspension and Steering Systems", completed: false, current: false },
          { id: "lesson-3-4", title: "Wheel Alignment and Tire Service", completed: false, current: false },
        ]
      },
      {
        id: "course-4",
        title: "Term 2: Diagnostics & Professional Practice",
        lessons: [
          { id: "lesson-4-1", title: "OBD-II Diagnostics and Scan Tools", completed: false, current: false },
          { id: "lesson-4-2", title: "Electrical Diagnostics and Wiring", completed: false, current: false },
          { id: "lesson-4-3", title: "Repair Order Writing and Customer Service", completed: false, current: false },
          { id: "lesson-4-4", title: "ASE Certification and Career Pathways", completed: false, current: false },
        ]
      }
    ] as SyllabusCourse[]
  };

  const handleLessonClick = (lessonId: string) => {
    console.log(`Navigating to lesson: ${lessonId}`);
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
      console.log('[AutoSchool] Fetching videos with API key rotation');
      console.log('[AutoSchool] Tutorials to fetch:', tutorials);
      console.log('[AutoSchool] Selected repair order:', selectedRecipe);

      const newUrls: (string | null)[] = [null, null];
      await Promise.all(tutorials.map(async (tut, idx) => {
        try {
          // Use the improved video query generation that handles different tutorial types
          const query = await getVideoQueryFromFreddie(
            selectedRecipe || { title: '', ingredients: [], equipment: [] }, 
            tut, 
            idx
          );
          
          console.log(`[AutoSchool] Tutorial ${idx} (${tut.type || 'legacy'}) query:`, query);
          
          const result: TutorialVideoResult = await getTutorialVideo(query);
          console.log(`[AutoSchool] Tutorial ${idx} result:`, result);
          
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
    <div className="max-w-6xl mx-auto mt-8">
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
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`lg:w-2/3 bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue ${
          activeMobileTab === 'school' ? 'block' : 'hidden lg:block'
        }`}>
          {/* Automotive School header - moved back inside the module */}
          <div className="flex items-center justify-center mb-4">
            <span className="text-5xl mr-2">⚙️</span>
            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('autoSchool.title')}</h1>
          </div>
          
          {/* Separation line */}
          <hr className="border-t-2 border-maineBlue mb-6" />
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
        
        <div className={`lg:w-1/3 ${
          activeMobileTab === 'syllabus' ? 'block' : 'hidden lg:block'
        }`}>
          <SyllabusCard 
            title={mockSyllabusData.title}
            courses={mockSyllabusData.courses}
            onLessonClick={handleLessonClick}
            onDiagnosticBayClick={() => setBenchPracticeOpen(true)}
          />
        </div>
      </div>

      {/* Bench Practice Modal */}
      <BayPracticeModal 
        open={benchPracticeOpen}
        onClose={() => setBenchPracticeOpen(false)}
      />
    </div>
  );
};

export default AutoSchool;


