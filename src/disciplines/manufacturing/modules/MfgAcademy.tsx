import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../../culinary/components/FreddieContext';
import VideoModal from '../components/VideoModal';
import { useLevelProgressContext } from '../../culinary/components/NavBar';
import { useRecipeContext } from '../../culinary/components/RecipeContext';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';
import { getMainEquipment, getMainIngredient } from '../utils/mainSelectors';
import { fetchNutritionData, calculateRecipeNutrition } from '../../culinary/api/nutritionService';
import { KeyNutrients } from '../../culinary/types/nutrition';
import SyllabusCard, { SyllabusCourse } from '../components/SyllabusCard';
import ProductionTimer from '../components/ProductionTimer';
import LinePracticeModal from '../components/LinePracticeModal';

const generalLessons = [
  { title: 'Workplace Safety 101', desc: 'Learn essential PPE usage and safety protocols.' },
  { title: 'Tool Handling & Safety', desc: 'How to select, store, and maintain manufacturing tools safely.' },
  { title: 'Essential Manufacturing Techniques', desc: 'Master assembly, quality control, and process optimization.' },
  { title: '5S Methodology', desc: 'Keep your workspace organized and efficient.' },
  { title: 'Quality Control Tools', desc: 'How to use calipers, gauges, and measurement equipment.' },
  { title: 'Equipment Maintenance', desc: 'Cleaning, storing, and maintaining your manufacturing equipment.' }
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
      title: 'Let\'s Build This Process!',
      desc: 'How to execute the main technique for this process.'
    }
  ];
}

// 52 Fundamental Manufacturing Techniques (one for each week of the year)
const WEEKLY_TECHNIQUES = [
  // Safety & PPE Techniques (Weeks 1-13)
  { title: "Proper Tool Grip", desc: "How to hold tools safely and efficiently for better control" },
  { title: "Machine Guarding", desc: "Protecting yourself while operating machinery" },
  { title: "PPE Inspection Basics", desc: "Using inspection checklists to maintain safety equipment" },
  { title: "Workstation Organization", desc: "Creating efficient and safe work areas" },
  { title: "Safety Signage", desc: "Understanding and implementing safety warnings" },
  { title: "Tool Selection", desc: "Choosing the right tool for the manufacturing task" },
  { title: "Measuring Techniques", desc: "Precision measurement for quality outcomes" },
  { title: "Workstation Setup", desc: "Setting up your workspace efficiently before production" },
  { title: "Proper Equipment Use", desc: "Stability, safety, and efficiency basics" },
  { title: "Material Handling", desc: "Safe and efficient material movement techniques" },
  { title: "Quality Inspection", desc: "Proper inspection procedures and checkpoints" },
  { title: "Documentation Basics", desc: "Accurate record-keeping for production tracking" },
  { title: "Tool Storage", desc: "Keeping tools organized and in good condition" },

  // Process Control & Quality (Weeks 14-26)
  { title: "Machine Calibration", desc: "Setting up equipment for optimal performance" },
  { title: "Process Temperature Control", desc: "Managing temperature in manufacturing processes" },
  { title: "Quality Sampling", desc: "Why and when to take quality samples" },
  { title: "Process Stabilization", desc: "Understanding how processes stabilize over time" },
  { title: "Equipment Warm-up", desc: "Getting machinery truly ready for production" },
  { title: "Process Zones", desc: "Using different areas in your production line" },
  { title: "Gentle Processing", desc: "Low and slow techniques for delicate materials" },
  { title: "Rapid vs Controlled Processing", desc: "Understanding the difference for better results" },
  { title: "Moisture Control", desc: "Managing humidity in manufacturing processes" },
  { title: "Cold Process Starts", desc: "When NOT to preheat your equipment" },
  { title: "Equipment Hot Spots", desc: "Monitoring for consistent processing" },
  { title: "Sensor Placement", desc: "Where to place sensors for accurate readings" },
  { title: "Proper Cooling", desc: "Safe product cooling techniques" },

  // Process Optimization (Weeks 27-39)
  { title: "Quality Timing", desc: "When to inspect for maximum quality impact" },
  { title: "pH Balance", desc: "Managing chemical properties in manufacturing processes" },
  { title: "Process Enhancement", desc: "Optimizing processes for better efficiency" },
  { title: "Waste Reduction", desc: "Capturing and reducing waste in production" },
  { title: "Process Layering", desc: "Adding processes in the right order" },
  { title: "Testing as You Produce", desc: "Adjusting processes throughout production" },
  { title: "Efficiency Enhancement", desc: "Using natural methods to boost productivity" },
  { title: "Energy as Process Driver", desc: "Understanding how energy drives manufacturing processes" },
  { title: "Automated vs Manual Timing", desc: "When to use automation vs manual processes" },
  { title: "Optimization Techniques", desc: "Improving efficiency through process analysis" },
  { title: "Final Quality Checks", desc: "Adding final quality assurance procedures" },
  { title: "Foundation Processes", desc: "Building a strong process foundation" },
  { title: "Cost and Quality Balance", desc: "Finding the perfect production harmony" },

  // Advanced Manufacturing (Weeks 40-52)
  { title: "Mixing Fundamentals", desc: "Creating consistent blends that won't separate" },
  { title: "Proper Agitation", desc: "Incorporating air for consistent material properties" },
  { title: "Layering Technique", desc: "Preserving material properties in composites" },
  { title: "Basic Process Control", desc: "Foundation technique for stable, consistent processes" },
  { title: "Material Flow Magic", desc: "Using material properties to perfect your process" },
  { title: "Strategic Process Control", desc: "When and how to control processes for best results" },
  { title: "Heat Treatment", desc: "Gradually combining hot and cold materials" },
  { title: "Curing Time", desc: "How long is enough for material penetration" },
  { title: "Proper Drying", desc: "Getting excess moisture out effectively" },
  { title: "Quality Layers", desc: "Building quality throughout the manufacturing process" },
  { title: "Timing Multiple Processes", desc: "Getting everything ready at the same time" },
  { title: "Simple Packaging", desc: "Basic presentation techniques for better products" },
  { title: "Clean as You Go", desc: "Maintaining an efficient, functional workspace" }
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
      title: `Let\'s Build This Process!`,
      desc: `Manufacturing tutorial for ${recipe.title}.`,
      type: 'manufacturing_tutorial'
    }
  ];
}


const MfgAcademy = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { selectedRecipe } = useRecipeContext();
  console.log('Culinary School - Recipe nutrition:', selectedRecipe?.nutrition);
  console.log('Culinary School - Full Recipe:', selectedRecipe);
  const [modalIdx, setModalIdx] = useState<null | number>(null);
  const [recipeNutrition, setRecipeNutrition] = useState<KeyNutrients | null>(null);
  const [orderSize, setOrderSize] = useState(100);
  const [benchPracticeOpen, setBenchPracticeOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'school' | 'syllabus'>('school');

  // Mock syllabus data
  const mockSyllabusData = {
    title: "Manufacturing Curriculum",
    courses: [
      {
        id: "course-1",
        title: "Term 1: Manufacturing Foundations",
        lessons: [
          { id: "lesson-1-1", title: "Workplace Safety and Procedures", completed: true, current: false },
          { id: "lesson-1-2", title: "Material Handling and Storage", completed: true, current: false },
          { id: "lesson-1-3", title: "Introduction to Manufacturing Equipment", completed: true, current: false },
          { id: "lesson-1-4", title: "Basic Manufacturing Terminology", completed: false, current: true },
          { id: "lesson-1-5", title: "Measurements, Tolerances, and Conversions", completed: false, current: false },
        ]
      },
      {
        id: "course-2",
        title: "Term 1: Tool Skills",
        lessons: [
          { id: "lesson-2-1", title: "Tool Safety and Maintenance", completed: false, current: false },
          { id: "lesson-2-2", title: "Basic Tool Operations", completed: false, current: false },
          { id: "lesson-2-3", title: "Material Preparation", completed: false, current: false },
          { id: "lesson-2-4", title: "Component Fabrication", completed: false, current: false },
        ]
      },
      {
        id: "course-3",
        title: "Term 2: Assembly & Quality Control",
        lessons: [
          { id: "lesson-3-1", title: "Assembly Techniques", completed: false, current: false },
          { id: "lesson-3-2", title: "Production Line Setup", completed: false, current: false },
          { id: "lesson-3-3", title: "Quality Control Procedures", completed: false, current: false },
          { id: "lesson-3-4", title: "Inspection and Testing", completed: false, current: false },
        ]
      },
      {
        id: "course-4",
        title: "Term 2: Advanced Manufacturing",
        lessons: [
          { id: "lesson-4-1", title: "Process Automation", completed: false, current: false },
          { id: "lesson-4-2", title: "Lean Manufacturing", completed: false, current: false },
          { id: "lesson-4-3", title: "Six Sigma Methods", completed: false, current: false },
          { id: "lesson-4-4", title: "Advanced Quality Systems", completed: false, current: false },
        ]
      }
    ] as SyllabusCourse[]
  };

  const handleLessonClick = (lessonId: string) => {
    console.log(`Navigating to lesson: ${lessonId}`);
  };

  useEffect(() => {
    updateContext({ page: 'CulinarySchool' });
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
      
      // Use Floor Freddie for complex queries
      const prompt = `
        Given the following process and tutorial, generate a concise YouTube search query for a relevant manufacturing video.\n
        - Only use the equipment and materials listed.\n
        - Do NOT include unrelated tools or techniques.\n
        - The query should be specific to the tutorial and process.\n
        Process: ${recipe.title}\n
        Materials: ${recipe.ingredients?.join(', ')}\n
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
      console.log('[CulinarySchool] Fetching videos with API key rotation');
      console.log('[CulinarySchool] Tutorials to fetch:', tutorials);
      console.log('[CulinarySchool] Selected recipe:', selectedRecipe);

      const newUrls: (string | null)[] = [null, null];
      await Promise.all(tutorials.map(async (tut, idx) => {
        try {
          // Use the improved video query generation that handles different tutorial types
          const query = await getVideoQueryFromFreddie(
            selectedRecipe || { title: '', ingredients: [], equipment: [] }, 
            tut, 
            idx
          );
          
          console.log(`[CulinarySchool] Tutorial ${idx} (${tut.type || 'legacy'}) query:`, query);
          
          const result: TutorialVideoResult = await getTutorialVideo(query);
          console.log(`[CulinarySchool] Tutorial ${idx} result:`, result);
          
          if (result && result.url) {
            newUrls[idx] = result.url;
          }
        } catch (error) {
          console.error(`[CulinarySchool] Error fetching video for tutorial ${idx}:`, error);
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
          {t('mfgAcademy.title')}
        </button>
        <button
          onClick={() => setActiveMobileTab('syllabus')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'syllabus'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📚 {t('mfgAcademy.syllabus')}
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`lg:w-2/3 bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue ${
          activeMobileTab === 'school' ? 'block' : 'hidden lg:block'
        }`}>
          {/* Culinary School header - moved back inside the module */}
          <div className="flex items-center justify-center mb-4">
            <span className="text-5xl mr-2">🏭</span>
            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('mfgAcademy.title')}</h1>
          </div>
          
          {/* Separation line */}
          <hr className="border-t-2 border-maineBlue mb-6" />
        <div className="w-full mx-auto">
        <ProductionTimer orderSize={orderSize} setOrderSize={setOrderSize} />
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
            {/* Recipe Card Display at Bottom (matching MyCookBook RecipeCard layout) */}
            <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-black overflow-hidden w-full min-h-[350px] mt-8 mx-auto relative">
              <button
                onClick={() => window.location.reload()}
                className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"
                title={t('mfgAcademy.closeRecipe')}
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
                <div className="font-semibold mb-1 mt-2">{t('mfgAcademy.ingredients')}</div>
                <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                  {selectedRecipe.ingredients?.length ? (
                    selectedRecipe.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)
                  ) : (
                    <li className="italic text-gray-400">{t('mfgAcademy.noIngredientsListed')}</li>
                  )}
                </ul>
                {recipeNutrition && (
                  <div className="mt-2">
                    <div className="font-semibold mb-1">{t('mfgAcademy.nutritionTotal').replace('{servings}', orderSize.toString())}:</div>
                    <div className="text-sm">
                      <div>{t('mfgAcademy.carbs')}: {(recipeNutrition.carbs * orderSize / 100).toFixed(1)}g</div>
                      <div>{t('mfgAcademy.sugars')}: {(recipeNutrition.sugars * orderSize / 100).toFixed(1)}g</div>
                      <div>{t('mfgAcademy.fiber')}: {(recipeNutrition.fiber * orderSize / 100).toFixed(1)}g</div>
                      <div>{t('mfgAcademy.protein')}: {(recipeNutrition.protein * orderSize / 100).toFixed(1)}g</div>
                    </div>
                  </div>
                )}
              </div>
              {/* Right Page */}
              <div className="flex-1 p-6 bg-white flex flex-col">
                <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('mfgAcademy.instructions')}</h3>
                <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                  {selectedRecipe.instructions || (
                    <span className="italic text-gray-400">{t('mfgAcademy.noInstructionsProvided')}</span>
                  )}
                </div>
                {/* Equipment Section */}
                {selectedRecipe.equipment && selectedRecipe.equipment.length > 0 && (
                  <>
                    <div className="font-semibold mt-4 mb-1">{t('mfgAcademy.equipmentNeeded')}</div>
                    <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                      {selectedRecipe.equipment.map((eq: string, i: number) => (
                        <li key={i}>{eq}</li>
                      ))}
                    </ul>
                  </>
                )}
                {(!selectedRecipe.equipment || selectedRecipe.equipment.length === 0) && (
                  <div className="italic text-gray-400 mt-2">{t('mfgAcademy.noEquipmentListed')}</div>
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
              <div className="text-gray-700 mb-4">{t('mfgAcademy.getStarted')}</div>
              <div className="flex justify-center space-x-4">
                <Link to="/manufacturing/my-floor" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">Go to My Floor</Link>
                <Link to="/manufacturing/my-playbook" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">Go to My Playbook</Link>
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
      <LinePracticeModal 
        open={benchPracticeOpen}
        onClose={() => setBenchPracticeOpen(false)}
      />
    </div>
  );
};

export default MfgAcademy;
