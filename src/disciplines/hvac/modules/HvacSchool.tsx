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
import SyllabusCard, { SyllabusCourse } from '../components/SyllabusCard';
import ServiceTimer from '../components/ServiceTimer';
import UnitPracticeModal from '../components/UnitPracticeModal';

const generalLessons = [
  { title: 'EPA 608 Certification Prep', desc: 'Refrigerant handling, recovery, recycling, and reclaiming for EPA 608.' },
  { title: 'Refrigeration Cycle Basics', desc: 'How compression, condensation, expansion, and evaporation work.' },
  { title: 'Duct Design & Airflow', desc: 'Manual D basics, static pressure, and proper airflow balancing.' },
  { title: 'Heat Load Calculations', desc: 'Manual J residential load calculations for proper equipment sizing.' },
  { title: 'Electrical Troubleshooting', desc: 'Reading wiring diagrams and diagnosing HVAC electrical faults.' },
  { title: 'Tool & Equipment Care', desc: 'Maintaining manifold gauges, vacuum pumps, and test equipment.' }
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
      title: 'Let\'s Service This System!',
      desc: 'How to approach the main task for this HVAC service call.'
    }
  ];
}

// 52 Fundamental HVAC Techniques (one for each week of the year)
const WEEKLY_TECHNIQUES = [
  // Refrigeration & Safety Fundamentals (Weeks 1-13)
  { title: "Refrigerant Safety Handling", desc: "PPE, recovery cylinders, and safe refrigerant procedures" },
  { title: "Refrigeration Cycle Walkthrough", desc: "Tracing the cycle from evaporator to compressor to condenser" },
  { title: "Manifold Gauge Set Usage", desc: "Connecting, reading, and interpreting high and low side pressures" },
  { title: "Superheat Measurement", desc: "Calculating and adjusting superheat at the evaporator" },
  { title: "Subcooling Measurement", desc: "Calculating and adjusting subcooling at the condenser" },
  { title: "Refrigerant Identification", desc: "R-22, R-410A, R-32, R-454B — properties and applications" },
  { title: "Refrigerant Recovery Procedure", desc: "Push-pull recovery and connecting a recovery machine" },
  { title: "System Evacuation", desc: "Deep vacuum procedure and micron gauge readings" },
  { title: "Refrigerant Charging Methods", desc: "Charging by weight, superheat, and subcooling" },
  { title: "Leak Detection Techniques", desc: "Electronic leak detectors, UV dye, and bubble solution" },
  { title: "EPA 608 Core Concepts", desc: "Laws, regulations, and certification requirements" },
  { title: "EPA 608 Type I (Small Appliance)", desc: "Recovery techniques for appliances under 5 lbs" },
  { title: "EPA 608 Type II (High-Pressure)", desc: "Recovery and handling for R-410A systems" },

  // Equipment & Systems (Weeks 14-26)
  { title: "Split System Components", desc: "Identifying and understanding every component" },
  { title: "Heat Pump Operation", desc: "Cooling and heating mode — reversing valve function" },
  { title: "Mini-Split Installation", desc: "Line set routing, flaring, and commissioning" },
  { title: "Gas Furnace Components", desc: "Heat exchanger, inducer, ignitor, and pressure switches" },
  { title: "Gas Furnace Sequence of Operation", desc: "Step-by-step from thermostat call to burner ignition" },
  { title: "Furnace Heat Exchanger Inspection", desc: "Crack detection and CO safety testing" },
  { title: "Combustion Analysis", desc: "Using a combustion analyzer for efficiency and safety" },
  { title: "Package Unit vs. Split System", desc: "Comparing configurations and installation requirements" },
  { title: "Geothermal Basics", desc: "Ground loops, water source heat pumps, and efficiency" },
  { title: "Commercial Rooftop Unit Basics", desc: "RTU components and preventive maintenance" },
  { title: "Chiller System Basics", desc: "Centrifugal vs. scroll chillers and building cooling" },
  { title: "Boiler System Basics", desc: "Hydronic heating, expansion tanks, and zone valves" },
  { title: "VRF/VRV System Basics", desc: "Variable refrigerant flow — components and zoning" },

  // Ductwork, Airflow & Controls (Weeks 27-39)
  { title: "Duct System Design Basics", desc: "Manual D, trunk-and-branch vs. radial systems" },
  { title: "Static Pressure Measurement", desc: "Using a manometer to diagnose duct system issues" },
  { title: "Airflow Balancing", desc: "Adjusting dampers and registers for balanced delivery" },
  { title: "Sheet Metal Fabrication", desc: "Cutting, bending, and connecting rectangular duct" },
  { title: "Flex Duct Installation", desc: "Proper stretch, support, and sealing of flexible duct" },
  { title: "Duct Sealing & Insulation", desc: "Mastic, foil tape, and insulation wrap procedures" },
  { title: "Thermostat Wiring", desc: "Reading wiring diagrams and connecting standard thermostats" },
  { title: "Smart Thermostat Setup", desc: "Configuring Nest, Ecobee, and communicating stats" },
  { title: "Zone Control Systems", desc: "Zone boards, bypass dampers, and pressure balancing" },
  { title: "BAS/DDC Controls Basics", desc: "Direct digital controls and building automation fundamentals" },
  { title: "IAQ Sensors & Ventilation", desc: "CO2 monitoring, ERV, and fresh air ventilation requirements" },
  { title: "Air Handler Components", desc: "Blower motor, coil, filter rack, and drain pan" },
  { title: "Condenser Coil Cleaning", desc: "Chemical coil cleaning and fin straightening" },

  // Diagnostics, Code & Professional Skills (Weeks 40-52)
  { title: "No-Cool Diagnostic Procedure", desc: "Systematic approach to diagnosing a cooling failure" },
  { title: "No-Heat Diagnostic Procedure", desc: "Systematic approach to diagnosing a heating failure" },
  { title: "Electrical Motor Testing", desc: "Testing capacitors, contactors, and motor windings" },
  { title: "Compressor Diagnostics", desc: "Amp draw, compression ratio, and failure modes" },
  { title: "Metering Device Selection", desc: "TXV vs. fixed orifice — selection and adjustment" },
  { title: "Preventive Maintenance Checklist", desc: "Complete seasonal PM procedure for residential systems" },
  { title: "Refrigerant Regulations Update", desc: "AIM Act, A2L refrigerants, and phase-down timeline" },
  { title: "NATE Certification Prep", desc: "Study strategies and key topic areas for NATE exams" },
  { title: "Service Call Professionalism", desc: "Customer communication, documentation, and callbacks" },
  { title: "Warranty and Flat-Rate Pricing", desc: "Using flat-rate books and explaining costs to customers" },
  { title: "Business Development Basics", desc: "Service agreements, referrals, and reputation management" },
  { title: "Safety Data Sheets", desc: "Reading SDS for refrigerants and chemicals" },
  { title: "Career Pathways", desc: "Apprentice to journeyman to master HVAC technician — the roadmap" }
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
      title: `Let\'s Service This System!`,
      desc: `Step-by-step service walkthrough for ${recipe.title}.`,
      type: 'service_tutorial'
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

  // Mock syllabus data
  const mockSyllabusData = {
    title: "HVAC/R Technology Curriculum",
    courses: [
      {
        id: "course-1",
        title: "Term 1: HVAC Fundamentals",
        lessons: [
          { id: "lesson-1-1", title: "Safety, PPE, and Refrigerant Handling", completed: true, current: false },
          { id: "lesson-1-2", title: "Basic Refrigeration Cycle and Theory", completed: true, current: false },
          { id: "lesson-1-3", title: "Tools, Meters, and Test Equipment", completed: true, current: false },
          { id: "lesson-1-4", title: "Manifold Gauges and System Pressures", completed: false, current: true },
          { id: "lesson-1-5", title: "EPA 608 Certification Prep", completed: false, current: false },
        ]
      },
      {
        id: "course-2",
        title: "Term 1: Equipment & Systems",
        lessons: [
          { id: "lesson-2-1", title: "Split Systems and Heat Pumps", completed: false, current: false },
          { id: "lesson-2-2", title: "Gas Furnaces and Combustion", completed: false, current: false },
          { id: "lesson-2-3", title: "Mini-Splits and Variable Refrigerant Flow", completed: false, current: false },
          { id: "lesson-2-4", title: "Commercial and Rooftop Units", completed: false, current: false },
        ]
      },
      {
        id: "course-3",
        title: "Term 2: Ductwork, Airflow & Controls",
        lessons: [
          { id: "lesson-3-1", title: "Duct Design and Static Pressure", completed: false, current: false },
          { id: "lesson-3-2", title: "Airflow Balancing and Duct Sealing", completed: false, current: false },
          { id: "lesson-3-3", title: "Thermostat Wiring and Controls", completed: false, current: false },
          { id: "lesson-3-4", title: "Zone Control and IAQ Systems", completed: false, current: false },
        ]
      },
      {
        id: "course-4",
        title: "Term 2: Diagnostics & Professional Practice",
        lessons: [
          { id: "lesson-4-1", title: "No-Cool and No-Heat Diagnostics", completed: false, current: false },
          { id: "lesson-4-2", title: "Electrical Component Testing", completed: false, current: false },
          { id: "lesson-4-3", title: "Preventive Maintenance and Service Agreements", completed: false, current: false },
          { id: "lesson-4-4", title: "NATE Certification and Career Pathways", completed: false, current: false },
        ]
      }
    ] as SyllabusCourse[]
  };

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
          
          {/* Separation line */}
          <hr className="border-t-2 border-maineBlue mb-6" />
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
      <UnitPracticeModal 
        open={benchPracticeOpen}
        onClose={() => setBenchPracticeOpen(false)}
      />
    </div>
  );
};

export default HvacSchool;


