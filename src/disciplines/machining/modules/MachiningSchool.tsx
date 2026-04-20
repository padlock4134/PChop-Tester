import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../components/BenchFreddieContext';
import VideoModal from '../components/VideoModal';
import { useRecipeContext } from '../components/PartContext';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';
import { getMainEquipment, getMainIngredient } from '../utils/mainSelectors';
// Nutrition removed - not applicable for welding discipline
import SyllabusCard, { SyllabusCourse } from '../components/SyllabusCard';
import CycleTimer from '../components/CycleTimer';
import SetupPracticeModal from '../components/SetupPracticeModal';

const generalLessons = [
  { title: 'Blueprint & GD&T Reading', desc: 'How to read engineering drawings, tolerances, and geometric dimensioning.' },
  { title: 'Manual Lathe Operation', desc: 'Turning, facing, boring, and threading on a manual lathe.' },
  { title: 'Milling Machine Basics', desc: 'Face milling, slot milling, and workpiece setup on a knee mill.' },
  { title: 'CNC Programming Fundamentals', desc: 'G-code and M-code basics — writing and running your first program.' },
  { title: 'Metrology & Inspection', desc: 'Using calipers, micrometers, and CMMs to verify part dimensions.' },
  { title: 'Cutting Tool & Machine Care', desc: 'Selecting, setting, and maintaining tooling and machine components.' }
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
      title: 'Let\'s Machine This Part!',
      desc: 'How to approach the main task for this machining job.'
    }
  ];
}

// 52 Fundamental Machining Techniques (one for each week of the year)
const WEEKLY_TECHNIQUES = [
  // Blueprint, Metrology & Safety (Weeks 1-13)
  { title: "Blueprint Reading Basics", desc: "Orthographic views, title blocks, and revision levels" },
  { title: "GD&T Symbols", desc: "Flatness, circularity, perpendicularity, and true position" },
  { title: "Reading Tolerances", desc: "Plus/minus tolerances, fit classes, and tolerance stacks" },
  { title: "Caliper Use", desc: "Inside, outside, depth, and step measurements with a vernier caliper" },
  { title: "Micrometer Use", desc: "Outside mic technique, thimble reading, and anvil care" },
  { title: "Dial Indicator Setup", desc: "Mounting, zeroing, and sweeping a part on a surface plate" },
  { title: "Surface Plate & V-Block Use", desc: "Checking roundness and parallelism on a granite surface plate" },
  { title: "Thread Gauge Use", desc: "Thread pitch gauge, go/no-go gauge, and thread measurement" },
  { title: "Gage Block Fundamentals", desc: "Building stacks and using blocks for precision setup" },
  { title: "Machine Safety Basics", desc: "Lockout/tagout, guarding, and proper work attire" },
  { title: "Speeds & Feeds Overview", desc: "Surface footage, RPM, and feed rate relationships" },
  { title: "Cutting Tool Materials", desc: "HSS vs. carbide vs. ceramic — applications and comparisons" },
  { title: "Coolant Selection", desc: "Flood coolant, mist, and dry cutting — when to use each" },

  // Manual Lathe Operations (Weeks 14-26)
  { title: "Lathe Component ID", desc: "Headstock, saddle, cross slide, tailstock, and compound" },
  { title: "Workholding on the Lathe", desc: "3-jaw, 4-jaw, collet, and between-centers setups" },
  { title: "Facing Operation", desc: "Squaring the end of stock to a flat, perpendicular surface" },
  { title: "Straight Turning", desc: "Reducing diameter to size with controlled depth of cut" },
  { title: "Taper Turning", desc: "Compound angle method and tailstock offset method" },
  { title: "Boring on the Lathe", desc: "Using a boring bar to enlarge an existing hole" },
  { title: "Drilling on the Lathe", desc: "Center drilling, drill selection, and tailstock feed" },
  { title: "Threading on the Lathe", desc: "External thread cutting — chasing threads and compound angle" },
  { title: "Knurling", desc: "Diamond and straight knurl setup and feed rates" },
  { title: "Parting Off", desc: "Using a parting tool to cut stock to length" },
  { title: "Grooving", desc: "Internal and external groove cutting for O-rings and snap rings" },
  { title: "Lathe Maintenance", desc: "Way lubrication, chuck jaw maintenance, and alignment checks" },
  { title: "Material Turning Properties", desc: "Chip control and insert selection for steel, aluminum, and titanium" },

  // CNC & Milling Operations (Weeks 27-39)
  { title: "Mill Component ID", desc: "Column, knee, table, spindle, and quill functions" },
  { title: "Workholding on the Mill", desc: "Vise setup, parallels, edge finding, and clamping" },
  { title: "Face Milling", desc: "Squaring a block and achieving a consistent surface finish" },
  { title: "Slot and Pocket Milling", desc: "End mill selection, depth per pass, and corner compensation" },
  { title: "Drilling on the Mill", desc: "Center drilling, spot drilling, and peck drilling cycles" },
  { title: "Boring Head Use", desc: "Setting a boring head for tight tolerance hole making" },
  { title: "CNC Machine Startup", desc: "Controller startup, home position, and tool offset loading" },
  { title: "G-Code Basics (G00, G01, G02, G03)", desc: "Rapid travel, linear feed, and circular interpolation" },
  { title: "M-Code Functions", desc: "Spindle, coolant, tool change, and program stop codes" },
  { title: "Work Coordinate Systems", desc: "G54-G59 fixture offsets and probing for work zero" },
  { title: "Tool Length Offsets", desc: "Setting H offsets and checking tool lengths" },
  { title: "Canned Drilling Cycles", desc: "G81, G83 peck drill, G84 tapping, and G85 boring" },
  { title: "CNC Program Verification", desc: "Dry run, single block, and air-cutting a new program" },

  // Advanced Techniques & Professional Skills (Weeks 40-52)
  { title: "Grinding Basics", desc: "Surface grinding wheel selection, dressing, and depth of cut" },
  { title: "EDM Fundamentals", desc: "Wire and sinker EDM — how electrical discharge removes material" },
  { title: "5-Axis Machining Concepts", desc: "Trunnion vs. swivel head — applications and programming basics" },
  { title: "Fixturing & Jig Design", desc: "Designing repeatable, accurate workholding for production" },
  { title: "Statistical Process Control (SPC)", desc: "Cpk, control charts, and monitoring process capability" },
  { title: "First Article Inspection", desc: "Completing a PPAP/FAIR report for a new part" },
  { title: "Material Properties", desc: "Hardness, machinability ratings, and heat treatment effects" },
  { title: "Toolpath Simulation (CAM)", desc: "Verifying a CAM toolpath before posting code" },
  { title: "Scrap Reduction Strategies", desc: "Root cause analysis and corrective actions for out-of-tolerance parts" },
  { title: "Job Setup Documentation", desc: "Writing a setup sheet for the next shift operator" },
  { title: "Lean Manufacturing Basics", desc: "5S, waste identification, and value stream mapping" },
  { title: "NIMS Certification Prep", desc: "Study strategies for NIMS machining credentials" },
  { title: "Career Pathways", desc: "Apprentice to journeyman to master machinist — the roadmap" }
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
      title: `Let\'s Machine This Part!`,
      desc: `Step-by-step machining walkthrough for ${recipe.title}.`,
      type: 'cooking_tutorial'
    }
  ];
}


const MachiningSchool = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { selectedRecipe } = useRecipeContext();
  console.log('Machining School - Full Job Ticket:', selectedRecipe);
  const [modalIdx, setModalIdx] = useState<null | number>(null);
  const [servingSize, setServingSize] = useState(2);
  const [benchPracticeOpen, setBenchPracticeOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'school' | 'syllabus'>('school');

  // Mock syllabus data
  const mockSyllabusData = {
    title: "Precision Machining Technology Curriculum",
    courses: [
      {
        id: "course-1",
        title: "Term 1: Machining Fundamentals",
        lessons: [
          { id: "lesson-1-1", title: "Machine Shop Safety and OSHA Basics", completed: true, current: false },
          { id: "lesson-1-2", title: "Measuring Tools and Metrology", completed: true, current: false },
          { id: "lesson-1-3", title: "Blueprint Reading and GD&T", completed: true, current: false },
          { id: "lesson-1-4", title: "Cutting Tools, Materials, and Speeds & Feeds", completed: false, current: true },
          { id: "lesson-1-5", title: "Workholding and Setup Procedures", completed: false, current: false },
        ]
      },
      {
        id: "course-2",
        title: "Term 1: Manual Lathe & Mill Operations",
        lessons: [
          { id: "lesson-2-1", title: "Lathe Operations: Facing, Turning, and Boring", completed: false, current: false },
          { id: "lesson-2-2", title: "Lathe Operations: Threading and Taper Turning", completed: false, current: false },
          { id: "lesson-2-3", title: "Milling Operations: Face Milling and Slots", completed: false, current: false },
          { id: "lesson-2-4", title: "Milling Operations: Drilling and Boring", completed: false, current: false },
        ]
      },
      {
        id: "course-3",
        title: "Term 2: CNC Programming & Operations",
        lessons: [
          { id: "lesson-3-1", title: "CNC Machine Startup and G-Code Basics", completed: false, current: false },
          { id: "lesson-3-2", title: "Work Coordinate Systems and Tool Offsets", completed: false, current: false },
          { id: "lesson-3-3", title: "Canned Cycles and Program Verification", completed: false, current: false },
          { id: "lesson-3-4", title: "CAM Software and Toolpath Simulation", completed: false, current: false },
        ]
      },
      {
        id: "course-4",
        title: "Term 2: Quality, Inspection & Professional Practice",
        lessons: [
          { id: "lesson-4-1", title: "SPC, Cpk, and First Article Inspection", completed: false, current: false },
          { id: "lesson-4-2", title: "Grinding, EDM, and Advanced Processes", completed: false, current: false },
          { id: "lesson-4-3", title: "Lean Manufacturing and 5S", completed: false, current: false },
          { id: "lesson-4-4", title: "NIMS Certification and Career Pathways", completed: false, current: false },
        ]
      }
    ] as SyllabusCourse[]
  };

  const handleLessonClick = (lessonId: string) => {
    console.log(`Navigating to lesson: ${lessonId}`);
  };

  useEffect(() => {
    updateContext({ page: 'MachiningSchool' });
  }, [updateContext]);


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
      console.log('[MachiningSchool] Fetching videos with API key rotation');
      console.log('[MachiningSchool] Tutorials to fetch:', tutorials);
      console.log('[MachiningSchool] Selected job ticket:', selectedRecipe);

      const newUrls: (string | null)[] = [null, null];
      await Promise.all(tutorials.map(async (tut, idx) => {
        try {
          // Use the improved video query generation that handles different tutorial types
          const query = await getVideoQueryFromFreddie(
            selectedRecipe || { title: '', ingredients: [], equipment: [] }, 
            tut, 
            idx
          );
          
          console.log(`[MachiningSchool] Tutorial ${idx} (${tut.type || 'legacy'}) query:`, query);
          
          const result: TutorialVideoResult = await getTutorialVideo(query);
          console.log(`[MachiningSchool] Tutorial ${idx} result:`, result);
          
          if (result && result.url) {
            newUrls[idx] = result.url;
          }
        } catch (error) {
          console.error(`[MachiningSchool] Error fetching video for tutorial ${idx}:`, error);
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
          {/* Culinary School header - moved back inside the module */}
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
                title={t('machiningSchool.closeRecipe')}
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
                <div className="font-semibold mb-1 mt-2">{t('machiningSchool.ingredients')}</div>
                <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                  {selectedRecipe.ingredients?.length ? (
                    selectedRecipe.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)
                  ) : (
                    <li className="italic text-gray-400">{t('machiningSchool.noIngredientsListed')}</li>
                  )}
                </ul>
              </div>
              {/* Right Page */}
              <div className="flex-1 p-6 bg-white flex flex-col">
                <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('machiningSchool.instructions')}</h3>
                <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                  {selectedRecipe.instructions || (
                    <span className="italic text-gray-400">{t('machiningSchool.noInstructionsProvided')}</span>
                  )}
                </div>
                {/* Equipment Section */}
                {selectedRecipe.equipment && selectedRecipe.equipment.length > 0 && (
                  <>
                    <div className="font-semibold mt-4 mb-1">{t('machiningSchool.equipmentNeeded')}</div>
                    <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                      {selectedRecipe.equipment.map((eq: string, i: number) => (
                        <li key={i}>{eq}</li>
                      ))}
                    </ul>
                  </>
                )}
                {(!selectedRecipe.equipment || selectedRecipe.equipment.length === 0) && (
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
                <Link to="/welding/my-specbook" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('machiningSchool.goToMyCookbook')}</Link>
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

export default MachiningSchool;


