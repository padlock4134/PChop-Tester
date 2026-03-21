import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../components/FreddieContext';
import VideoModal from '../components/VideoModal';
import { useRecipeContext } from '../components/RecipeContext';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';
import { getMainEquipment, getMainIngredient } from '../utils/mainSelectors';
import { fetchNutritionData, calculateRecipeNutrition } from '../api/nutritionService';
import { KeyNutrients } from '../types/nutrition';
import SyllabusCard, { SyllabusCourse } from '../components/SyllabusCard';
import CookingTimer from '../components/CookingTimer';
import BenchPracticeModal from '../components/BenchPracticeModal';

const generalLessons = [
  { title: 'Knife Skills 101', desc: 'Learn how to chop, dice, and julienne like a pro.' },
  { title: 'Seafood Handling & Safety', desc: 'How to select, store, and prep fresh seafood safely.' },
  { title: 'Essential Cooking Techniques', desc: 'Master sautéing, steaming, poaching, and more.' },
  { title: 'Sanitation & Cross-Contamination', desc: 'Keep your kitchen safe and clean.' },
  { title: 'Using a Thermometer', desc: 'How to check doneness for seafood, poultry, and meats.' },
  { title: 'Knife & Equipment Care', desc: 'Cleaning, storing, and maintaining your tools.' }
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
      title: 'Let\'s Cook This Meal!',
      desc: 'How to prepare the main ingredient for this dish.'
    }
  ];
}

// 52 Fundamental Cooking Techniques (one for each week of the year)
const WEEKLY_TECHNIQUES = [
  // Knife & Prep Techniques (Weeks 1-13)
  { title: "Proper Knife Grip", desc: "How to hold a knife safely and efficiently for better control" },
  { title: "The Claw Method", desc: "Protecting your fingers while chopping like a pro" },
  { title: "Sharpening Basics", desc: "Using a honing steel to maintain your knife's edge" },
  { title: "Brunoise Dice", desc: "Perfect tiny cubes for aromatics and garnishes" },
  { title: "Chiffonade", desc: "Rolling and slicing herbs without bruising them" },
  { title: "Julienne Cuts", desc: "Matchstick cuts for even cooking and presentation" },
  { title: "Bias Cutting", desc: "Angled cuts for better texture and appearance" },
  { title: "Mise en Place", desc: "Setting up your workspace efficiently before cooking" },
  { title: "Proper Cutting Board Use", desc: "Stability, safety, and sanitation basics" },
  { title: "Garlic Crushing", desc: "Using the flat of your knife to release garlic oils" },
  { title: "Tomato Concassé", desc: "Peeling, seeding, and dicing tomatoes properly" },
  { title: "Tearless Onion Dicing", desc: "Perfect pieces without the tears" },
  { title: "Fresh Herb Storage", desc: "Keeping herbs fresh and flavorful longer" },

  // Heat & Temperature (Weeks 14-26)
  { title: "Pan Temperature Testing", desc: "Water drop test to know when your pan is ready" },
  { title: "Oil Smoke Points", desc: "Choosing the right oil for different cooking temperatures" },
  { title: "Resting Meat", desc: "Why and how long to let meat rest for juiciness" },
  { title: "Carryover Cooking", desc: "Understanding how food continues cooking off heat" },
  { title: "Proper Preheating", desc: "Getting your oven and pans truly ready" },
  { title: "Temperature Zones", desc: "Using different heat areas in your pan" },
  { title: "Gentle Heat Cooking", desc: "Low and slow techniques for tender results" },
  { title: "Searing vs Browning", desc: "Understanding the difference for better results" },
  { title: "Steam Control", desc: "Managing moisture while cooking" },
  { title: "Cold Pan Starts", desc: "When NOT to preheat your pan" },
  { title: "Oven Hot Spots", desc: "Rotating food for even cooking" },
  { title: "Thermometer Placement", desc: "Where to insert for accurate readings" },
  { title: "Proper Cooling", desc: "Safe food cooling techniques" },

  // Flavor Building (Weeks 27-39)
  { title: "Salt Timing", desc: "When to salt for maximum flavor impact" },
  { title: "Acid Balance", desc: "Using lemon and vinegar to brighten dishes" },
  { title: "Blooming Spices", desc: "Toasting spices for deeper flavor" },
  { title: "Deglazing", desc: "Capturing those delicious brown bits from the pan" },
  { title: "Layering Flavors", desc: "Adding ingredients in the right order" },
  { title: "Tasting as You Cook", desc: "Adjusting seasoning throughout the process" },
  { title: "Umami Enhancement", desc: "Using natural ingredients to boost savory flavor" },
  { title: "Fat as Flavor Carrier", desc: "Understanding how fat carries and enhances taste" },
  { title: "Fresh vs Dried Timing", desc: "When to add fresh herbs vs dried spices" },
  { title: "Reduction Techniques", desc: "Concentrating flavors through evaporation" },
  { title: "Finishing Salts", desc: "Adding texture and final flavor bursts" },
  { title: "Aromatics First", desc: "Building a strong flavor foundation" },
  { title: "Sweet and Savory Balance", desc: "Finding the perfect flavor harmony" },

  // Texture & Technique (Weeks 40-52)
  { title: "Emulsification Basics", desc: "Making smooth sauces that won't break" },
  { title: "Proper Whisking", desc: "Incorporating air for light, fluffy results" },
  { title: "Folding Technique", desc: "Preserving delicate textures in batters" },
  { title: "Basic Roux Making", desc: "Foundation technique for thick, smooth sauces" },
  { title: "Pasta Water Magic", desc: "Using starchy water to perfect your sauce" },
  { title: "Strategic Stirring", desc: "When and how to stir for best results" },
  { title: "Tempering", desc: "Gradually combining hot and cold ingredients" },
  { title: "Marinating Time", desc: "How long is enough for flavor penetration" },
  { title: "Proper Draining", desc: "Getting excess moisture out effectively" },
  { title: "Seasoning Layers", desc: "Building flavor throughout the cooking process" },
  { title: "Timing Multiple Dishes", desc: "Getting everything ready at the same time" },
  { title: "Simple Plating", desc: "Basic presentation techniques for better meals" },
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
      title: `Let\'s Cook This Meal!`,
      desc: `Step-by-step cooking tutorial for ${recipe.title}.`,
      type: 'cooking_tutorial'
    }
  ];
}


const CulinarySchool = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { selectedRecipe } = useRecipeContext();
  console.log('Culinary School - Recipe nutrition:', selectedRecipe?.nutrition);
  console.log('Culinary School - Full Recipe:', selectedRecipe);
  const [modalIdx, setModalIdx] = useState<null | number>(null);
  const [recipeNutrition, setRecipeNutrition] = useState<KeyNutrients | null>(null);
  const [servingSize, setServingSize] = useState(2);
  const [benchPracticeOpen, setBenchPracticeOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'school' | 'syllabus'>('school');

  // Mock syllabus data
  const mockSyllabusData = {
    title: "Chef College Curriculum",
    courses: [
      {
        id: "course-1",
        title: "Term 1: Culinary Foundations",
        lessons: [
          { id: "lesson-1-1", title: "Kitchen Safety and Sanitation", completed: true, current: false },
          { id: "lesson-1-2", title: "Food Handling and Storage", completed: true, current: false },
          { id: "lesson-1-3", title: "Introduction to Kitchen Equipment", completed: true, current: false },
          { id: "lesson-1-4", title: "Basic Cooking Terminology", completed: false, current: true },
          { id: "lesson-1-5", title: "Weights, Measures, and Conversions", completed: false, current: false },
        ]
      },
      {
        id: "course-2",
        title: "Term 1: Knife Skills",
        lessons: [
          { id: "lesson-2-1", title: "Knife Safety and Maintenance", completed: false, current: false },
          { id: "lesson-2-2", title: "Basic Knife Cuts", completed: false, current: false },
          { id: "lesson-2-3", title: "Vegetable Fabrication", completed: false, current: false },
          { id: "lesson-2-4", title: "Meat and Fish Fabrication", completed: false, current: false },
        ]
      },
      {
        id: "course-3",
        title: "Term 2: Breakfast & Garde Manger",
        lessons: [
          { id: "lesson-3-1", title: "Egg Cookery", completed: false, current: false },
          { id: "lesson-3-2", title: "Breakfast Preparations", completed: false, current: false },
          { id: "lesson-3-3", title: "Cold Food Preparation", completed: false, current: false },
          { id: "lesson-3-4", title: "Salads and Dressings", completed: false, current: false },
        ]
      },
      {
        id: "course-4",
        title: "Term 2: Baking & Pastry",
        lessons: [
          { id: "lesson-4-1", title: "Basic Dough and Batters", completed: false, current: false },
          { id: "lesson-4-2", title: "Quick Breads and Muffins", completed: false, current: false },
          { id: "lesson-4-3", title: "Yeast Breads", completed: false, current: false },
          { id: "lesson-4-4", title: "Basic Pastry and Desserts", completed: false, current: false },
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
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`lg:w-2/3 bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue ${
          activeMobileTab === 'school' ? 'block' : 'hidden lg:block'
        }`}>
          {/* Culinary School header - moved back inside the module */}
          <div className="flex items-center justify-center mb-4">
            <span className="text-5xl mr-2">💡</span>
            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('elecSchool.title')}</h1>
          </div>
          
          {/* Separation line */}
          <hr className="border-t-2 border-maineBlue mb-6" />
        <div className="w-full mx-auto">
        <CookingTimer servingSize={servingSize} setServingSize={setServingSize} />
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
                  <div className="font-bold mb-1">{t('elecSchool.step')} {idx + 1}: {tut.title}</div>
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
                    selectedRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)
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
                      {selectedRecipe.equipment.map((eq, i) => (
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
            <ol className="space-y-4 list-decimal list-inside mt-8">
              {tutorials.map((tut, idx) => (
                <li
                  key={idx}
                  className="bg-sand p-4 rounded shadow-inner border border-black relative cursor-pointer hover:bg-sky-300 hover:text-maineBlue transition-colors"
                  onClick={() => setModalIdx(idx)}
                >
                  <div className="font-bold mb-1">{t('elecSchool.step')} {idx + 1}: {tut.title}</div>
                  <div className="text-sm text-gray-700">{tut.desc}</div>
                </li>
              ))}
            </ol>
            <div className="mt-8 text-center">
              <div className="text-gray-700 mb-4">{t('elecSchool.getStarted')}</div>
              <div className="flex justify-center space-x-4">
                <Link to="/my-kitchen" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('elecSchool.goToMyKitchen')}</Link>
                <Link to="/my-cookbook" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('elecSchool.goToMyCookbook')}</Link>
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
      <BenchPracticeModal 
        open={benchPracticeOpen}
        onClose={() => setBenchPracticeOpen(false)}
      />
    </div>
  );
};

export default CulinarySchool;
