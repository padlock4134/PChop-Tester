import React, { useState, useEffect } from 'react';
import { saveVan, fetchVan } from './vanSupabase';
import { fetchPipeBook, addRecipeToPipeBook } from './pipebookSupabase';
import { Material } from '../types/shared-types';
import { XP_REWARDS } from '../services/xpService';
import { useLevelProgressContext } from '../components/NavBar';
import { useTranslation } from 'react-i18next';

import { scanImage } from '../api/vision';
import FitMatcherModal, { RecipeCard } from '../components/FitMatcherModal';
import { useFreddieContext } from '../components/PipeFreddieContext';
import { useSupabase } from '../components/SupabaseProvider';
import { isSessionValid } from '../api/userSession';
import { supabase } from '../api/supabaseClient';
import FitCard from '../components/FitCard';
import { STANDARD_DASHBOARD_FRAME_CLASSES } from '../../../constants/dashboardFrameClasses';

const CATEGORIES = [
  "Pipes",
  "Fittings", 
  "Tools",
  "Valves",
  "Seals",
  "Adhesives",
  "Fasteners",
  "Chemicals",
  "Equipment",
  "Other"
];

// Categorize part names to best-fit category
function categorizeMaterial(name: string): string {
  const n = name.toLowerCase();
  // Enhanced detection for plumbing parts and materials
  if (/(pipe|tube|conduit|pvc|copper|pe|pex|galvanized|steel|brass)/.test(n)) return "Pipes";
  if (/(fitting|coupling|elbow|tee|union|adapter|reducer|nipple|bushing)/.test(n)) return "Fittings";
  if (/(wrench|pliers|pipe wrench|tube cutter|threader|reamer|torch|hammer|screwdriver)/.test(n)) return "Tools";
  if (/(valve|faucet|tap|ball|gate|globe|check|relief|solenoid|thermostatic)/.test(n)) return "Valves";
  if (/(seal|gasket|o-ring|tape|putty|caulk|silicone|epoxy|thread seal)/.test(n)) return "Seals";
  if (/(glue|cement|solvent|adhesive|bond|primer|cleaner)/.test(n)) return "Adhesives";
  if (/(bolt|nut|screw|clip|clamp|hanger|bracket|strap)/.test(n)) return "Fasteners";
  if (/(chemical|cleaner|solvent|acid|flux|compound|treatment)/.test(n)) return "Chemicals";
  if (/(pump|heater|tank|meter|filter|expansion|backflow|pressure)/.test(n)) return "Equipment";
  return "Other";
}

const getCategoryLabel = (cat: string, t: (key: string, options?: any) => string): string => {
  const key = `myVan.category${cat}`;
  return t(key, { defaultValue: cat });
};

const MyVan = () => {
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
    Pipes: '🔧',
    Fittings: '🔩',
    Tools: '🛠️',
    Valves: '🚰',
    Seals: '📦',
    Adhesives: '🧪',
    Fasteners: '⚙️',
    Chemicals: '🔧',
    Equipment: '🔌',
    Other: '🔧',
  };

  const [detectedMaterials, setDetectedMaterials] = useState<string[]>([]);

  // Fit Matcher modal state
  const [matcherOpen, setMatcherOpen] = useState(false);
  const [matcherLoading, setMatcherLoading] = useState(false);
  const [matcherError, setMatcherError] = useState('');
  const [matchedFits, setMatchedFits] = useState<RecipeCard[]>([]);

  // MyPipeBook state (for MVP, local only)
  const [_pipebookFits, setPipeBook] = useState<RecipeCard[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [vanError, setVanError] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [filterText, setFilterText] = useState('');

  const addPart = () => {
    if (input.trim()) {
      setMaterials(prev => [...prev, { name: input.trim(), category }]);
      setInput('');
    }
  };

  // Save van to Supabase whenever parts change
  useEffect(() => {
    if (materials.length === 0) return;
    saveVan(user?.id!, materials).catch(err => setVanError('Failed to save your van.'));
  }, [materials]);

  // Freddie context: set page on mount
  useEffect(() => {
    updateContext({ page: 'MyVan' });
    // Load both van and pipebook data
    const loadData = async () => {
      try {
        const [vanParts, pipebookFits] = await Promise.all([
          fetchVan(user?.id!),
          fetchPipeBook(user?.id!)
        ]);
        setMaterials(vanParts);
        setPipeBook(pipebookFits);
      } catch (error) {
        console.error('Error loading data:', error);
        setVanError('Failed to load your van.');
      }
    };
    loadData();
  }, [updateContext]);

  // Filtering logic (only by search text)
  const filteredMaterials = materials.filter(ing => {
    return ing.name.toLowerCase().includes(filterText.toLowerCase());
  });

  const handleLikeRecipe = async (fit: RecipeCard) => {
    console.log('Saving fit with specs data:', fit.specs);
    
    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .insert([
          { 
            user_id: user?.id, 
            fit: {
              ...fit,
              specs: fit.specs // Include specs data
            }
          }
        ]);
      
      if (error) throw error;
      
      // Award XP for saving a fit
      if (user) {
        await import('../services/xpService').then(m => 
          m.awardXP(user.id, XP_REWARDS.FIT_SAVE, 'fit_save')
        );
        refreshXP();
      }
    } catch (error: any) {
      console.error('Error saving fit:', error.message || error);
      console.error('Failed fit:', {
        id: fit.id,
        title: fit.title,
        user: user?.id || 'no user'
      });
    }
  };

  const handleSaveFitToPipeBook = async (fit: RecipeCard) => {
    try {
      await addRecipeToPipeBook(user?.id!, fit);
      setPipeBook(prevPipeBook => [...prevPipeBook, fit]);
    } catch (error) {
      console.error('Error saving fit to pipebook:', error);
    }
  };

  return (
    <div className="mb-8 mx-auto">
      <div className={STANDARD_DASHBOARD_FRAME_CLASSES}>
        {/* My Van header - moved back inside the module */}
        <div className="flex items-center justify-center p-6 pb-4">
          <span className="text-5xl mr-2">🚐</span>
          <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('myVan.title')}</h1>
        </div>
        
        {/* Sticky Separation line */}
        <div className="sticky top-0 bg-white z-10 px-6">
          <hr className="border-t-2 border-maineBlue" />
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 pt-4">
      {/* Van, Procedure Matcher, and Upload Photo Action Buttons */}
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
          id="scan-van-file"
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
                  
                  const newParts = Array.from(new Set(detectedItems))
                    .filter(d => {
                      const normalizedDetected = d.toLowerCase().trim();
                      return !materials.some(i => 
                        i.name.toLowerCase().trim() === normalizedDetected ||
                        i.name.toLowerCase().trim().includes(normalizedDetected) ||
                        normalizedDetected.includes(i.name.toLowerCase().trim())
                      );
                    });
                  
                  console.log('New parts to add:', newParts);
                  if (newParts.length === 0) {
                    setScanStatus(t('myVan.noNewIngredients'));
                    alert(t('myVan.noNewIngredients'));
                  } else {
                    // Check user before saving
                    try {
                      const sessionValid = await isSessionValid();
                      console.log('Current user:', user);
                      if (!sessionValid || !user) {
                        setScanStatus(t('myVan.notSignedIn'));
                        alert(t('myVan.notSignedIn'));
                        setScanLoading(false);
                        return;
                      }
                    } catch (userErr) {
                      console.error('Error fetching user:', userErr);
                      setScanStatus(t('myVan.couldNotVerify'));
                      alert(t('myVan.couldNotVerify'));
                      setScanLoading(false);
                      return;
                    }
                    const updatedMaterials = [
                      ...materials,
                      ...newParts.map((name: string) => ({ name, category: categorizeMaterial(name) }))
                    ];
                    setMaterials(updatedMaterials);
                    try {
                      await saveVan(user?.id!, updatedMaterials);
                      setVanError(null);
                      setScanStatus(t('myVan.ingredientsSaved'));
                      alert(t('myVan.ingredientsSaved'));
                    } catch (err: any) {
                      setVanError(t('myVan.failedToSave') + ' ' + (err.message || err.toString()));
                      setScanStatus(t('myVan.failedToSave') + ' ' + (err.message || err.toString()));
                      alert(t('myVan.failedToSave') + ' ' + (err.message || err.toString()));
                    }
                  }
                  setDetectedMaterials([]);
                } catch (err: any) {
                  setScanError(err.message || t('myVan.failedToScan'));
                  alert(t('myVan.failedToScan') + ': ' + (err.message || err.toString()));
                }
                setScanLoading(false);
              };
              reader.readAsDataURL(file);
            } catch (err) {
              setScanError(t('myVan.failedToScan'));
              setScanLoading(false);
            }
          }}
        />
        <button
          className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-black w-full sm:w-auto max-w-xs"
          onClick={() => document.getElementById('scan-van-file')?.click()}
          disabled={scanLoading}
        >
          {scanLoading ? t('myVan.scanning') : t('myVan.scanKitchen')}
        </button>
        <button
          className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black w-full sm:w-auto max-w-xs"
          onClick={async () => {
             setMatcherOpen(true);
            setMatcherLoading(true);
            setMatcherError('');
            try {
              const vanPartsNames = materials.map(i => i.name);
              const { fetchRecipesWithImages } = await import('../api/fitMatcher');
              const fits = await fetchRecipesWithImages({
                userId: user?.id!,
                materials: vanPartsNames,
                numRecipes: 5,
                // These will be undefined by default, which is fine - the function has defaults
                vanSetup: undefined,
                talentsEnabled: false,
                talentTree: null
              });
              setMatchedFits(fits);
            } catch (err: any) {
              setMatcherError('Failed to fetch procedures.');
            } finally {
              setMatcherLoading(false);
            }
          }}
        >
          {t('myVan.matchRecipes')}
        </button>
      </div>

      {/* Scan Results Modal */}
      {scanLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-weatheredWhite p-8 rounded shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maineBlue mb-4"></div>
            <div className="text-lg font-retro mb-2">{t('myVan.scanningPhoto')}</div>
          </div>
        </div>
      )}
      {scanError && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-weatheredWhite p-8 rounded shadow-lg flex flex-col items-center">
            <div className="text-lobsterRed font-bold mb-2">{scanError}</div>
            <button className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold mt-2" onClick={() => setScanError('')}>{t('myVan.close')}</button>
          </div>
        </div>
      )}

      {/* Fit Matcher Modal (always mounted for overlay) */}
      <FitMatcherModal
        open={matcherOpen}
        onClose={() => setMatcherOpen(false)}
        vanMaterials={materials.map(i => i.name)}
        onLike={handleLikeRecipe}
        saveRecipeToPipeBook={handleSaveFitToPipeBook}
        fits={matchedFits}
        loading={matcherLoading}
        error={matcherError}
      />


      {/* Digital Parts Locker Section */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-retro text-maineBlue flex items-center gap-2">
          <span role="img" aria-label="wrench">🔧</span> {t('myVan.digitalCupboard')}
        </h3>
        {materials.length > 0 && (
          <button
            className="text-xs text-lobsterRed underline hover:text-maineBlue"
            onClick={() => setMaterials([])}
          >
            {t('myVan.clearAll')}
          </button>
        )}
      </div>
      {/* Add Material Bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
        {/* Search locker input */}
        <input
          type="text"
          className="border px-3 py-2 rounded w-full sm:w-1/3"
          placeholder={t('myVan.searchCupboard')}
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          style={{ minWidth: 120 }}
        />
        {/* Add material input */}
        <input
          type="text"
          className="border px-3 py-2 rounded w-full sm:w-1/3"
          placeholder={t('myVan.addAnIngredient')}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <select
          className="border px-2 py-2 rounded bg-weatheredWhite"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{getCategoryLabel(cat, t)}</option>
          ))}
        </select>
        <button
          className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black"
          onClick={addPart}
        >
          {t('myVan.add')}
        </button>
      </div>
      <div className="bg-gradient-to-br from-yellow-100 to-sand border-4 border-yellow-900 rounded-2xl shadow-lg p-4 relative overflow-hidden">
        {/* Rope border accent */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg width="100%" height="100%" className="absolute top-0 left-0" style={{zIndex:0}}>
            <rect x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="20" fill="none" stroke="#d2b48c" strokeWidth="4" strokeDasharray="8,4" />
          </svg>
        </div>
        {filteredMaterials.length === 0 ? (
          <div className="text-gray-500 italic text-center py-8 relative z-10">{t('myVan.noMatchingIngredients')}</div>
        ) : (
          <div className="flex flex-col gap-4 relative z-10">
            {[0,1,2,3,4,5].map(shelfIdx => {
              const shelfItems = filteredMaterials.slice(shelfIdx*3, (shelfIdx+1)*3);
              if (shelfItems.length === 0) return null;
              return (
                <div key={shelfIdx} className="flex justify-around items-end border-b-4 border-yellow-900 pb-3 last:border-b-0">
                  {shelfItems.map((ing, idx) => (
                    <div key={idx} className="flex flex-col items-center mx-2">
                      {/* Jar look */}
                      <div className="w-16 h-20 bg-weatheredWhite border-2 border-yellow-700 rounded-b-lg rounded-t-md shadow relative flex flex-col items-center justify-center">
                        <div className="w-12 h-3 bg-yellow-900 rounded-t-md absolute -top-3 left-1/2 -translate-x-1/2"></div>
                        <span className="text-[10px] text-yellow-900 bg-sand px-1 rounded-sm font-medium mb-1">{getCategoryLabel(ing.category, t)}</span>
                        <span className="text-xs font-semibold text-maineBlue break-words text-center px-1">{ing.name}</span>
                      </div>
                      <button
                        className="mt-1 text-xs text-lobsterRed hover:text-maineBlue font-bold"
                        onClick={() => {
                          // Remove by name and category match to be robust
                          setMaterials(materials.filter((item, i) => !(item.name === ing.name && item.category === ing.category && materials.indexOf(item) === materials.indexOf(filteredMaterials[shelfIdx*3+idx]))));
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
    </div>
  );
};

export default MyVan;


