import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../../culinary/components/FreddieContext';
import { useRecipeContext } from '../../culinary/components/RecipeContext';
import VideoModal from '../components/VideoModal';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';
import { getMainEquipment, getMainIngredient } from '../utils/mainSelectors';
import { fetchNutritionData, calculateRecipeNutrition } from '../../culinary/api/nutritionService';
import { KeyNutrients } from '../../culinary/types/nutrition';
import SyllabusCard, { SyllabusCourse } from '../components/SyllabusCard';
import JobTimer from '../components/JobTimer';
import FieldPracticeModal from '../components/FieldPracticeModal';

const generalLessons = [
  { title: 'Blueprint Reading 101', desc: 'Learn how to read architectural and structural drawings like a pro.' },
  { title: 'Site Safety & OSHA Compliance', desc: 'How to identify hazards and maintain a compliant job site.' },
  { title: 'Framing Fundamentals', desc: 'Master wall framing, headers, and rough opening layouts.' },
  { title: 'Concrete & Masonry Basics', desc: 'Mixing, pouring, finishing, and laying block properly.' },
  { title: 'Measuring & Layout', desc: 'How to use a tape, square, and level for accurate layouts.' },
  { title: 'Tool & Equipment Care', desc: 'Cleaning, inspecting, and maintaining your hand and power tools.' }
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
      title: 'Let\'s Build This Project!',
      desc: 'How to approach the main task for this build project.'
    }
  ];
}

// 52 Fundamental Construction Techniques (one for each week of the year)
const WEEKLY_TECHNIQUES = [
  // Blueprint & Layout (Weeks 1-13)
  { title: "Reading Architectural Plans", desc: "Interpreting floor plans, elevations, and sections" },
  { title: "Reading Structural Drawings", desc: "Understanding framing plans, beam schedules, and load paths" },
  { title: "Site Layout with Batter Boards", desc: "Establishing accurate building corners and elevations" },
  { title: "Using a Builder's Level", desc: "Setting elevation benchmarks across a job site" },
  { title: "Squaring a Foundation", desc: "The 3-4-5 method and diagonal checks" },
  { title: "Reading a Tape Measure", desc: "Fractions, decimals, and the 16-inch module" },
  { title: "Chalk Line Technique", desc: "Snapping accurate layout lines on floors and walls" },
  { title: "Using a Speed Square", desc: "Marking rafter cuts and checking square" },
  { title: "Plumb Bob Use", desc: "Transferring points vertically with accuracy" },
  { title: "Laser Level Setup", desc: "Leveling and aligning with rotary and line lasers" },
  { title: "Material Estimation Basics", desc: "Calculating board feet, square feet, and waste factors" },
  { title: "Reading a Spec Sheet", desc: "Extracting material and performance requirements" },
  { title: "Working from a Schedule", desc: "Using door, window, and finish schedules on blueprints" },

  // Framing & Structure (Weeks 14-26)
  { title: "Wall Plate Layout", desc: "Marking stud locations on top and bottom plates" },
  { title: "Stud Wall Assembly", desc: "Building and standing a standard wood-framed wall" },
  { title: "Rough Opening Framing", desc: "Headers, king studs, and trimmer sizing" },
  { title: "Corner Framing Techniques", desc: "California corners vs. three-stud corners for insulation" },
  { title: "Floor Joist Installation", desc: "Crown side up, hangers, and blocking requirements" },
  { title: "Subfloor Installation", desc: "Gluing, nailing, and staggering subfloor panels" },
  { title: "Roof Rafter Layout", desc: "Common rafter math, ridge board, and bird's mouth cuts" },
  { title: "Engineered Lumber Basics", desc: "LVL, PSL, and I-joist installation requirements" },
  { title: "Metal Connector Hardware", desc: "Joist hangers, hurricane ties, and post caps" },
  { title: "Sheathing Installation", desc: "Wall and roof sheathing nailing patterns and gaps" },
  { title: "Bearing Wall Identification", desc: "Determining load paths before removal" },
  { title: "Temporary Bracing", desc: "Safe bracing of walls before permanent sheathing" },
  { title: "Post and Beam Connections", desc: "Notching, bolting, and hardware for heavy timber" },

  // Masonry, Concrete & Finishing (Weeks 27-39)
  { title: "Concrete Mix Ratios", desc: "Water-to-cement ratio and slump testing basics" },
  { title: "Form Building", desc: "Setting forms for footings, walls, and slabs" },
  { title: "Rebar Placement", desc: "Cover requirements, spacing, and tying rebar" },
  { title: "Concrete Finishing", desc: "Screeding, floating, troweling, and curing" },
  { title: "Block Laying Technique", desc: "Mortar consistency, joint tooling, and course layout" },
  { title: "Brick Patterns & Bonds", desc: "Running bond, common bond, and stack bond" },
  { title: "Waterproofing Foundations", desc: "Dampproofing vs. waterproofing and drainage systems" },
  { title: "Drywall Hanging", desc: "Panel orientation, screw spacing, and butt joints" },
  { title: "Drywall Taping & Mudding", desc: "Tape embedding, three-coat finishing, and feathering" },
  { title: "Exterior Trim Installation", desc: "Flashing, caulking, and proper nailing schedules" },
  { title: "Door Hanging", desc: "Shimming, squaring, and securing a prehung door" },
  { title: "Window Installation", desc: "Flashing, sealing, and shimming for weather resistance" },
  { title: "Flooring Layout", desc: "Squaring the room, expansion gaps, and stagger patterns" },

  // Safety, Code & Professional Skills (Weeks 40-52)
  { title: "Fall Protection Basics", desc: "Guardrail, personal fall arrest, and safety net requirements" },
  { title: "Scaffold Erection Safety", desc: "Base plate, bracing, and access requirements" },
  { title: "Power Tool Safety", desc: "Guards, blade changes, and two-hand operation rules" },
  { title: "Reading the IBC", desc: "Navigating the International Building Code" },
  { title: "Fire Blocking Requirements", desc: "Where and how to install fireblocking per code" },
  { title: "Energy Code Basics", desc: "Insulation values, air barriers, and thermal bridging" },
  { title: "ADA Accessibility Basics", desc: "Door widths, ramp slopes, and reach ranges" },
  { title: "Excavation Safety", desc: "Trench protection systems and soil classification" },
  { title: "Crane & Rigging Signals", desc: "Standard hand signals and rigging inspection" },
  { title: "Daily Job Logs", desc: "Documenting weather, crew, and progress on site" },
  { title: "Change Order Process", desc: "Documenting scope changes to protect payment" },
  { title: "Subcontractor Coordination", desc: "Sequencing trades and avoiding delays" },
  { title: "Career Pathways", desc: "Apprentice to journeyman to general contractor — the roadmap" }
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
      title: `Let\'s Build This Project!`,
      desc: `Step-by-step project walkthrough for ${recipe.title}.`,
      type: 'cooking_tutorial'
    }
  ];
}


const BuildSchool = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { selectedRecipe } = useRecipeContext();
  console.log('Build School - Project data:', selectedRecipe?.nutrition);
  console.log('Build School - Full Project:', selectedRecipe);
  const [modalIdx, setModalIdx] = useState<null | number>(null);
  const [recipeNutrition, setRecipeNutrition] = useState<KeyNutrients | null>(null);
  const [servingSize, setServingSize] = useState(2);
  const [benchPracticeOpen, setBenchPracticeOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'school' | 'syllabus'>('school');

  // Mock syllabus data
  const mockSyllabusData = {
    title: "Construction Technology Curriculum",
    courses: [
      {
        id: "course-1",
        title: "Term 1: Construction Fundamentals",
        lessons: [
          { id: "lesson-1-1", title: "Site Safety, PPE, and OSHA Requirements", completed: true, current: false },
          { id: "lesson-1-2", title: "Hand Tools, Power Tools, and Equipment", completed: true, current: false },
          { id: "lesson-1-3", title: "Blueprint Reading and Site Plans", completed: true, current: false },
          { id: "lesson-1-4", title: "Measurements, Layout, and Math", completed: false, current: true },
          { id: "lesson-1-5", title: "Material Identification and Estimation", completed: false, current: false },
        ]
      },
      {
        id: "course-2",
        title: "Term 1: Framing & Structure",
        lessons: [
          { id: "lesson-2-1", title: "Foundation Types and Footings", completed: false, current: false },
          { id: "lesson-2-2", title: "Floor and Wall Framing", completed: false, current: false },
          { id: "lesson-2-3", title: "Roof Framing and Sheathing", completed: false, current: false },
          { id: "lesson-2-4", title: "Engineered Lumber and Metal Connectors", completed: false, current: false },
        ]
      },
      {
        id: "course-3",
        title: "Term 2: Masonry, Concrete & Finishing",
        lessons: [
          { id: "lesson-3-1", title: "Concrete Forming and Placement", completed: false, current: false },
          { id: "lesson-3-2", title: "Masonry and Block Work", completed: false, current: false },
          { id: "lesson-3-3", title: "Drywall Hanging and Finishing", completed: false, current: false },
          { id: "lesson-3-4", title: "Doors, Windows, and Trim", completed: false, current: false },
        ]
      },
      {
        id: "course-4",
        title: "Term 2: Code, Safety & Professional Practice",
        lessons: [
          { id: "lesson-4-1", title: "Building Codes and Permits", completed: false, current: false },
          { id: "lesson-4-2", title: "Fall Protection and Scaffold Safety", completed: false, current: false },
          { id: "lesson-4-3", title: "Project Documentation and Change Orders", completed: false, current: false },
          { id: "lesson-4-4", title: "Career Pathways in Construction", completed: false, current: false },
        ]
      }
    ] as SyllabusCourse[]
  };

  const handleLessonClick = (lessonId: string) => {
    console.log(`Navigating to lesson: ${lessonId}`);
  };

  useEffect(() => {
    updateContext({ page: 'BuildSchool' });
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

  // Helper: extract main protein from ingredients
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
      query = `how to ${tut.techniqueData.title.toLowerCase()} cooking technique`;
    } else if (tut.type === 'cooking_tutorial') {
      // For cooking tutorials, focus on the recipe
      const mainProtein = getMainProtein(recipe.ingredients || []);
      const mainEquipment = getMainEquipment(recipe.equipment || []);
      if (mainProtein && mainEquipment) {
        query = `How to cook ${mainProtein} using ${mainEquipment}`;
      } else if (mainProtein) {
        query = `How to cook ${mainProtein}`;
      } else {
        query = `how to make ${recipe.title}`;
      }
    } else {
      // Legacy fallback for older tutorial formats
      if (typeof idx === 'number' && idx === 2 && recipe && recipe.title) {
        return recipe.title;
      }
      
      // Use Chef Freddie for complex queries
      const prompt = `
        Given the following recipe and tutorial step, generate a concise YouTube search query for a relevant cooking video.\n
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
      console.log('[BuildSchool] Fetching videos with API key rotation');
      console.log('[BuildSchool] Tutorials to fetch:', tutorials);
      console.log('[BuildSchool] Selected project:', selectedRecipe);

      const newUrls: (string | null)[] = [null, null];
      await Promise.all(tutorials.map(async (tut, idx) => {
        try {
          // Use the improved video query generation that handles different tutorial types
          const query = await getVideoQueryFromFreddie(
            selectedRecipe || { title: '', ingredients: [], equipment: [] }, 
            tut, 
            idx
          );
          
          console.log(`[BuildSchool] Tutorial ${idx} (${tut.type || 'legacy'}) query:`, query);
          
          const result: TutorialVideoResult = await getTutorialVideo(query);
          console.log(`[BuildSchool] Tutorial ${idx} result:`, result);
          
          if (result && result.url) {
            newUrls[idx] = result.url;
          }
        } catch (error) {
          console.error(`[BuildSchool] Error fetching video for tutorial ${idx}:`, error);
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
          🛠️ {t('buildSchool.title')}
        </button>
        <button
          onClick={() => setActiveMobileTab('syllabus')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'syllabus'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📚 {t('buildSchool.syllabus')}
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`lg:w-2/3 bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue ${
          activeMobileTab === 'school' ? 'block' : 'hidden lg:block'
        }`}>
          {/* Culinary School header - moved back inside the module */}
          <div className="flex items-center justify-center mb-4">
            <span className="text-5xl mr-2">🛠️</span>
            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('buildSchool.title')}</h1>
          </div>
          
          {/* Separation line */}
          <hr className="border-t-2 border-maineBlue mb-6" />
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
            <ol className="space-y-4 list-decimal list-inside">
              {tutorials.map((tut, idx) => (
                <li
                  key={idx}
                  className="bg-sand p-4 rounded shadow-inner border border-black relative cursor-pointer hover:bg-sky-300 hover:text-maineBlue transition-colors"
                  onClick={() => setModalIdx(idx)}
                >
                  <div className="font-bold mb-1">{t('buildSchool.step')} {idx + 1}: {tut.title}</div>
                  <div className="text-sm text-gray-700">{tut.desc}</div>
                </li>
              ))}
            </ol>
            {/* Recipe Card Display at Bottom (matching MyCookBook RecipeCard layout) */}
            <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-black overflow-hidden w-full min-h-[350px] mt-8 mx-auto relative">
              <button
                onClick={() => window.location.reload()}
                className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"
                title={t('buildSchool.closeRecipe')}
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
                <div className="font-semibold mb-1 mt-2">{t('buildSchool.ingredients')}</div>
                <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                  {selectedRecipe.ingredients?.length ? (
                    selectedRecipe.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)
                  ) : (
                    <li className="italic text-gray-400">{t('buildSchool.noIngredientsListed')}</li>
                  )}
                </ul>
                {recipeNutrition && (
                  <div className="mt-2">
                    <div className="font-semibold mb-1">{t('buildSchool.nutritionTotal').replace('{servings}', servingSize.toString())}:</div>
                    <div className="text-sm">
                      <div>{t('buildSchool.carbs')}: {(recipeNutrition.carbs * servingSize).toFixed(1)}g</div>
                      <div>{t('buildSchool.sugars')}: {(recipeNutrition.sugars * servingSize).toFixed(1)}g</div>
                      <div>{t('buildSchool.fiber')}: {(recipeNutrition.fiber * servingSize).toFixed(1)}g</div>
                      <div>{t('buildSchool.protein')}: {(recipeNutrition.protein * servingSize).toFixed(1)}g</div>
                    </div>
                  </div>
                )}
              </div>
              {/* Right Page */}
              <div className="flex-1 p-6 bg-white flex flex-col">
                <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('buildSchool.instructions')}</h3>
                <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                  {selectedRecipe.instructions || (
                    <span className="italic text-gray-400">{t('buildSchool.noInstructionsProvided')}</span>
                  )}
                </div>
                {/* Equipment Section */}
                {selectedRecipe.equipment && selectedRecipe.equipment.length > 0 && (
                  <>
                    <div className="font-semibold mt-4 mb-1">{t('buildSchool.equipmentNeeded')}</div>
                    <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                      {selectedRecipe.equipment.map((eq: string, i: number) => (
                        <li key={i}>{eq}</li>
                      ))}
                    </ul>
                  </>
                )}
                {(!selectedRecipe.equipment || selectedRecipe.equipment.length === 0) && (
                  <div className="italic text-gray-400 mt-2">{t('buildSchool.noEquipmentListed')}</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <ol className="space-y-4 list-decimal list-inside mt-8">
              {tutorials.map((tut, idx) => (
                <li
                  key={idx}
                  className="bg-sand p-4 rounded shadow-inner border border-black relative cursor-pointer hover:bg-sky-300 hover:text-maineBlue transition-colors"
                  onClick={() => setModalIdx(idx)}
                >
                  <div className="font-bold mb-1">{t('buildSchool.step')} {idx + 1}: {tut.title}</div>
                  <div className="text-sm text-gray-700">{tut.desc}</div>
                </li>
              ))}
            </ol>
            <div className="mt-8 text-center">
              <div className="text-gray-700 mb-4">{t('buildSchool.getStarted')}</div>
              <div className="flex justify-center space-x-4">
                <Link to="/my-kitchen" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('buildSchool.goToMyKitchen')}</Link>
                <Link to="/my-cookbook" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('buildSchool.goToMyCookbook')}</Link>
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
      <FieldPracticeModal 
        open={benchPracticeOpen}
        onClose={() => setBenchPracticeOpen(false)}
      />
    </div>
  );
};

export default BuildSchool;


