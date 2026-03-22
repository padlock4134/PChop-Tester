import React, { useState, useEffect } from 'react';
import { saveKitchen, fetchKitchen } from '../../culinary/modules/kitchenSupabase';
import { fetchCookbook, addRecipeToCookbook } from '../../culinary/modules/cookbookSupabase';
import { Ingredient } from '../../culinary/types/shared-types';
import { XP_REWARDS } from '../../culinary/services/xpService';
import { useLevelProgressContext } from '../../culinary/components/NavBar';
import { useTranslation } from 'react-i18next';

import { scanImage } from '../../culinary/api/vision';
import ProcessMatcherModal, { RecipeCard } from '../components/ProcessMatcherModal';
import { useFreddieContext } from '../../culinary/components/FreddieContext';
import { useSupabase } from '../../culinary/components/SupabaseProvider';
import { isSessionValid } from '../../culinary/api/userSession';
import { supabase } from '../../culinary/api/supabaseClient';

const CATEGORIES = [
  "Raw Materials",
  "Components",
  "Tools",
  "Safety Equipment",
  "Fasteners",
  "Lubricants",
  "Consumables",
  "Finished Goods",
  "Other"
];

// Categorize material names to best-fit category
function categorizeIngredient(name: string): string {
  const n = name.toLowerCase();
  // Raw Materials
  if (/(steel|aluminum|aluminium|iron|metal|copper|brass|bronze|titanium|zinc)/.test(n)) return "Raw Materials";
  if (/(plastic|polymer|resin|pvc|abs|nylon|polyethylene|polypropylene)/.test(n)) return "Raw Materials";
  if (/(wood|lumber|plywood|mdf|timber|oak|pine|maple)/.test(n)) return "Raw Materials";
  if (/(rubber|silicone|elastomer|latex)/.test(n)) return "Raw Materials";
  if (/(glass|ceramic|composite|carbon fiber|fiberglass)/.test(n)) return "Raw Materials";
  
  // Components
  if (/(bearing|motor|sensor|switch|valve|relay|actuator|solenoid)/.test(n)) return "Components";
  if (/(gear|pulley|belt|chain|sprocket|shaft|axle)/.test(n)) return "Components";
  if (/(circuit|board|pcb|chip|resistor|capacitor|diode|transistor)/.test(n)) return "Components";
  if (/(pump|compressor|filter|regulator|gauge)/.test(n)) return "Components";
  
  // Tools
  if (/(wrench|spanner|socket|ratchet|pliers|clamp)/.test(n)) return "Tools";
  if (/(drill|saw|grinder|sander|lathe|mill)/.test(n)) return "Tools";
  if (/(hammer|mallet|chisel|file|rasp)/.test(n)) return "Tools";
  if (/(screwdriver|allen|hex|torque)/.test(n)) return "Tools";
  if (/(caliper|micrometer|ruler|gauge|level|square)/.test(n)) return "Tools";
  
  // Safety Equipment
  if (/(glove|gloves|safety glove)/.test(n)) return "Safety Equipment";
  if (/(goggle|goggles|glasses|safety glasses|face shield)/.test(n)) return "Safety Equipment";
  if (/(helmet|hard hat|bump cap)/.test(n)) return "Safety Equipment";
  if (/(vest|hi-vis|high visibility|safety vest)/.test(n)) return "Safety Equipment";
  if (/(boot|boots|safety boot|steel toe)/.test(n)) return "Safety Equipment";
  if (/(ear plug|ear muff|hearing protection|respirator|mask)/.test(n)) return "Safety Equipment";
  
  // Fasteners
  if (/(bolt|screw|nut|washer|locknut)/.test(n)) return "Fasteners";
  if (/(rivet|pin|dowel|anchor|stud)/.test(n)) return "Fasteners";
  if (/(clip|clamp|bracket|hinge)/.test(n)) return "Fasteners";
  
  // Lubricants
  if (/(oil|lubricant|lube|grease|wd-?40)/.test(n)) return "Lubricants";
  if (/(coolant|cutting fluid|hydraulic)/.test(n)) return "Lubricants";
  
  // Consumables
  if (/(sandpaper|abrasive|grinding wheel|cutting disc)/.test(n)) return "Consumables";
  if (/(tape|duct tape|masking tape|electrical tape)/.test(n)) return "Consumables";
  if (/(adhesive|glue|epoxy|sealant|caulk)/.test(n)) return "Consumables";
  if (/(solder|flux|wire|cable|rope)/.test(n)) return "Consumables";
  if (/(paint|coating|primer|finish)/.test(n)) return "Consumables";
  if (/(rag|wipe|cloth|towel|cleaner|degreaser)/.test(n)) return "Consumables";
  
  // Finished Goods
  if (/(assembly|assembled|product|part|component|finished)/.test(n)) return "Finished Goods";
  
  return "Other";
}

const MyFloor = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { refreshXP } = useLevelProgressContext();
  const { user } = useSupabase();
  
  // ...existing state
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanStatus, setScanStatus] = useState<string | null>(null); // persistent feedback
  // Optionally, map category to emoji for pills
  const CATEGORY_ICONS: Record<string, string> = {
    'Raw Materials': '🔩',
    'Components': '⚙️',
    'Tools': '🔧',
    'Safety Equipment': '🦺',
    'Fasteners': '🔗',
    'Lubricants': '🛢️',
    'Consumables': '📦',
    'Finished Goods': '✅',
    'Other': '📋',
  };

  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);

  // Recipe Matcher modal state
  const [matcherOpen, setMatcherOpen] = useState(false);
  const [matcherLoading, setMatcherLoading] = useState(false);
  const [matcherError, setMatcherError] = useState('');
  const [matcherProcesses, setMatcherProcesses] = useState<RecipeCard[]>([]);

  // MyCookBook state (for MVP, local only)
  const [processbook, setProcessbook] = useState<RecipeCard[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [kitchenError, setKitchenError] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [filterText, setFilterText] = useState('');

  const addIngredient = () => {
    if (input.trim()) {
      setIngredients(prev => [...prev, { name: input.trim(), category }]);
      setInput('');
    }
  };

  // Save kitchen to Supabase whenever ingredients change
  useEffect(() => {
    if (ingredients.length === 0) return;
    saveKitchen(user?.id!, ingredients).catch(err => setKitchenError('Failed to save your kitchen.'));
  }, [ingredients]);

  // Freddie context: set page on mount
  useEffect(() => {
    updateContext({ page: 'MyFloor' });
    // Load both kitchen and cookbook data
    const loadData = async () => {
      try {
        const [kitchenIngredients, cookbookRecipes] = await Promise.all([
          fetchKitchen(user?.id!),
          fetchCookbook(user?.id!)
        ]);
        setIngredients(kitchenIngredients);
        setProcessbook(cookbookRecipes);
      } catch (error) {
        console.error('Error loading data:', error);
        setKitchenError('Failed to load your kitchen.');
      }
    };
    loadData();
  }, [updateContext]);

  // Filtering logic (only by search text)
  const filteredIngredients = ingredients.filter(ing => {
    return ing.name.toLowerCase().includes(filterText.toLowerCase());
  });

  const handleLikeRecipe = async (recipe: RecipeCard) => {
    console.log('Saving recipe with nutrition data:', recipe.nutrition);
    
    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .insert([
          { 
            user_id: user?.id, 
            recipe: {
              ...recipe,
              nutrition: recipe.nutrition // Include nutrition data
            }
          }
        ]);
      
      if (error) throw error;
      
      // Award XP for saving a recipe
      if (user) {
        await import('../../culinary/services/xpService').then(m => 
          m.awardXP(user.id, XP_REWARDS.RECIPE_SAVE, 'recipe_save')
        );
        refreshXP();
      }
    } catch (error: any) {
      console.error('Error saving recipe:', error.message || error);
      console.error('Failed recipe:', {
        id: recipe.id,
        title: recipe.title,
        user: user?.id || 'no user'
      });
    }
  };

  const handleSaveRecipeToCookbook = async (recipe: RecipeCard) => {
    try {
      await addRecipeToCookbook(user?.id!, recipe);
      setProcessbook(prevProcessbook => [...prevProcessbook, recipe]);
    } catch (error) {
      console.error('Error saving recipe to cookbook:', error);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg border-4 border-maineBlue flex flex-col max-h-[calc(100vh-100px)]">
        {/* My Kitchen header - moved back inside the module */}
        <div className="flex items-center justify-center p-6 pb-4">
          <span className="text-5xl mr-2">🏭</span>
          <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('myFloor.title')}</h1>
        </div>
        
        {/* Sticky Separation line */}
        <div className="sticky top-0 bg-white z-10 px-6">
          <hr className="border-t-2 border-maineBlue" />
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 pt-4">
      {/* Kitchen, Recipe Matcher, and Upload Photo Action Buttons */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
        {/* Scan status feedback */}
        {scanStatus && (
          <div className="w-full text-center mb-2 text-maineBlue font-bold bg-seafoam bg-opacity-30 rounded p-2">
            {scanStatus}
            <button className="ml-2 text-lobsterRed underline" onClick={() => setScanStatus(null)}>{t('common.clear')}</button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          id="scan-kitchen-file"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setScanError('');
            setScanLoading(true);
            try {
              const reader = new FileReader();
              reader.onload = async (ev) => {
                const base64 = (ev.target?.result as string)?.split(',')[1];
                try {
                  // Use the scanImage API function instead of direct Vision API calls
                  const detectedItems = await scanImage(base64);
                  console.log('Detected items:', detectedItems);
                  
                  const newIngredients = Array.from(new Set(detectedItems))
                    .filter(d => {
                      const normalizedDetected = d.toLowerCase().trim();
                      return !ingredients.some(i => 
                        i.name.toLowerCase().trim() === normalizedDetected ||
                        i.name.toLowerCase().trim().includes(normalizedDetected) ||
                        normalizedDetected.includes(i.name.toLowerCase().trim())
                      );
                    });
                  
                  console.log('New ingredients to add:', newIngredients);
                  if (newIngredients.length === 0) {
                    setScanStatus(t('myFloor.noNewIngredients'));
                    alert(t('myFloor.noNewIngredients'));
                  } else {
                    // Check user before saving
                    try {
                      const sessionValid = await isSessionValid();
                      console.log('Current user:', user);
                      if (!sessionValid || !user) {
                        setScanStatus(t('myFloor.notSignedIn'));
                        alert(t('myFloor.notSignedIn'));
                        setScanLoading(false);
                        return;
                      }
                    } catch (userErr) {
                      console.error('Error fetching user:', userErr);
                      setScanStatus(t('myFloor.couldNotVerify'));
                      alert(t('myFloor.couldNotVerify'));
                      setScanLoading(false);
                      return;
                    }
                    const updatedIngredients = [
                      ...ingredients,
                      ...newIngredients.map(name => ({ name, category: categorizeIngredient(name) }))
                    ];
                    setIngredients(updatedIngredients);
                    try {
                      await saveKitchen(user?.id!, updatedIngredients);
                      setKitchenError(null);
                      setScanStatus(t('myFloor.ingredientsSaved'));
                      alert(t('myFloor.ingredientsSaved'));
                    } catch (err: any) {
                      setKitchenError(t('myFloor.failedToSave') + ' ' + (err.message || err.toString()));
                      setScanStatus(t('myFloor.failedToSave') + ' ' + (err.message || err.toString()));
                      alert(t('myFloor.failedToSave') + ' ' + (err.message || err.toString()));
                    }
                  }
                  setDetectedIngredients([]);
                } catch (err: any) {
                  setScanError(err.message || t('myFloor.failedToScan'));
                  alert(t('myFloor.failedToScan') + ': ' + (err.message || err.toString()));
                }
                setScanLoading(false);
              };
              reader.readAsDataURL(file);
            } catch (err) {
              setScanError(t('myFloor.failedToScan'));
              setScanLoading(false);
            }
          }}
        />
        <button
          className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-black w-full sm:w-auto max-w-xs"
          onClick={() => document.getElementById('scan-kitchen-file')?.click()}
          disabled={scanLoading}
        >
          {scanLoading ? t('myFloor.scanning') : t('myFloor.scanKitchen')}
        </button>
        <button
          className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black w-full sm:w-auto max-w-xs"
          onClick={async () => {
             setMatcherOpen(true);
            setMatcherLoading(true);
            setMatcherError('');
            try {
              const cupboardNames = ingredients.map(i => i.name);
              const { fetchRecipesWithImages } = await import('../api/recipeMatcher');
              const recipes = await fetchRecipesWithImages({
                userId: user?.id!,
                ingredients: cupboardNames,
                numRecipes: 5,
                // These will be undefined by default, which is fine - the function has defaults
                kitchenSetup: undefined,
                talentsEnabled: false,
                talentTree: null
              });
              setMatcherProcesses(recipes);
            } catch (err: any) {
              setMatcherError('Failed to fetch recipes.');
            } finally {
              setMatcherLoading(false);
            }
          }}
        >
          Match SOP
        </button>
      </div>

      {/* Scan Results Modal */}
      {scanLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-weatheredWhite p-8 rounded shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maineBlue mb-4"></div>
            <div className="text-lg font-retro mb-2">{t('myFloor.scanningPhoto')}</div>
          </div>
        </div>
      )}
      {scanError && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-weatheredWhite p-8 rounded shadow-lg flex flex-col items-center">
            <div className="text-lobsterRed font-bold mb-2">{scanError}</div>
            <button className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold mt-2" onClick={() => setScanError('')}>{t('myFloor.close')}</button>
          </div>
        </div>
      )}

      {/* Recipe Matcher Modal (always mounted for overlay) */}
      <ProcessMatcherModal
        open={matcherOpen}
        onClose={() => setMatcherOpen(false)}
        cupboardIngredients={ingredients.map(i => i.name)}
        onLike={handleLikeRecipe}
        saveRecipeToCookbook={handleSaveRecipeToCookbook}
        recipes={matcherProcesses}
        loading={matcherLoading}
        error={matcherError}
      />


      {/* Digital Cupboard Section */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-retro text-maineBlue flex items-center gap-2">
          <span role="img" aria-label="factory">🔧</span> {t('myFloor.digitalCupboard')}
        </h3>
        {ingredients.length > 0 && (
          <button
            className="text-xs text-lobsterRed underline hover:text-maineBlue"
            onClick={() => setIngredients([])}
          >
            {t('myFloor.clearAll')}
          </button>
        )}
      </div>
      {/* Add Ingredient Bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
        {/* Search cupboard input */}
        <input
          type="text"
          className="border px-3 py-2 rounded w-full sm:w-1/3"
          placeholder={t('myFloor.searchCupboard')}
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          style={{ minWidth: 120 }}
        />
        {/* Add ingredient input */}
        <input
          type="text"
          className="border px-3 py-2 rounded w-full sm:w-1/3"
          placeholder={t('myFloor.addAnIngredient')}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <select
          className="border px-2 py-2 rounded bg-weatheredWhite"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black"
          onClick={addIngredient}
        >
          {t('myFloor.add')}
        </button>
      </div>
      <div className="bg-gradient-to-br from-yellow-100 to-sand border-4 border-yellow-900 rounded-2xl shadow-lg p-4 relative overflow-hidden">
        {/* Rope border accent */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg width="100%" height="100%" className="absolute top-0 left-0" style={{zIndex:0}}>
            <rect x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="20" fill="none" stroke="#d2b48c" strokeWidth="4" strokeDasharray="8,4" />
          </svg>
        </div>
        {filteredIngredients.length === 0 ? (
          <div className="text-gray-500 italic text-center py-8 relative z-10">{t('myFloor.noMatchingIngredients')}</div>
        ) : (
          <div className="flex flex-col gap-4 relative z-10">
            {[0,1,2,3,4,5].map(shelfIdx => {
              const shelfItems = filteredIngredients.slice(shelfIdx*3, (shelfIdx+1)*3);
              if (shelfItems.length === 0) return null;
              return (
                <div key={shelfIdx} className="flex justify-around items-end border-b-4 border-yellow-900 pb-3 last:border-b-0">
                  {shelfItems.map((ing, idx) => (
                    <div key={idx} className="flex flex-col items-center mx-2">
                      {/* Jar look */}
                      <div className="w-16 h-20 bg-weatheredWhite border-2 border-yellow-700 rounded-b-lg rounded-t-md shadow relative flex flex-col items-center justify-center">
                        <div className="w-12 h-3 bg-yellow-900 rounded-t-md absolute -top-3 left-1/2 -translate-x-1/2"></div>
                        <span className="text-[10px] text-yellow-900 bg-sand px-1 rounded-sm font-medium mb-1">{ing.category}</span>
                        <span className="text-xs font-semibold text-maineBlue break-words text-center px-1">{ing.name}</span>
                      </div>
                      <button
                        className="mt-1 text-xs text-lobsterRed hover:text-maineBlue font-bold"
                        onClick={async () => {
                          // Remove by name and category match to be robust
                          const updatedIngredients = ingredients.filter((item, i) => !(item.name === ing.name && item.category === ing.category && ingredients.indexOf(item) === ingredients.indexOf(filteredIngredients[shelfIdx*3+idx])));
                          setIngredients(updatedIngredients);
                          // Persist deletion to database
                          try {
                            await saveKitchen(user?.id!, updatedIngredients);
                          } catch (err) {
                            console.error('Failed to save kitchen after deletion:', err);
                            setKitchenError('Failed to save changes.');
                          }
                        }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
        </div>
      </div>
    </>
  );
};

export default MyFloor;
