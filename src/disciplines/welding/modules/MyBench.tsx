import React, { useState, useEffect } from 'react';
import { saveBench, fetchBench } from './benchSupabase';
import { fetchSpecBook, addProjectToSpecBook } from './specbookSupabase';
import { Material } from '../types/shared-types';
import { XP_REWARDS } from '../services/xpService';
import { useLevelProgressContext } from '../components/NavBar';
import { useTranslation } from 'react-i18next';

import { scanImage } from '../api/vision';
import PartMatcherModal, { ProjectCard } from '../components/PartMatcherModal';
import { useFreddieContext } from '../components/BenchFreddieContext';
import { useSupabase } from '../components/SupabaseProvider';
import { isSessionValid } from '../api/userSession';
import { supabase } from '../api/supabaseClient';
import { STANDARD_DASHBOARD_FRAME_CLASSES } from '../../../constants/dashboardFrameClasses';

const CATEGORIES = [
  "Base Metals",
  "Filler Materials",
  "Shielding Gas",
  "Flux/Consumables",
  "Fasteners/Hardware",
  "Abrasives",
  "Safety Gear",
  "Structural",
  "Pipe/Tube",
  "Other"
];

// Categorize material names to best-fit welding category
function categorizeMaterial(name: string): string {
  const n = name.toLowerCase();
  if (/(mild steel|stainless|aluminum|carbon steel|plate|sheet|flat bar|angle iron|channel|i.?beam|base metal|a36|304|316|4130|chromoly)/.test(n)) return "Base Metals";
  if (/(filler|rod|wire|electrode|er70|er308|e6010|e6013|e7018|tig rod|mig wire|flux.?core)/.test(n)) return "Filler Materials";
  if (/(argon|co2|helium|shielding gas|75.?25|c25|tri.?mix|gas cylinder|regulator)/.test(n)) return "Shielding Gas";
  if (/(flux|borax|anti.?spatter|tip dip|nozzle gel|contact tip|diffuser|liner|consumable)/.test(n)) return "Flux/Consumables";
  if (/(bolt|nut|washer|screw|rivet|clamp|magnet|fixture|jig|tack)/.test(n)) return "Fasteners/Hardware";
  if (/(grind|disc|flap|cut.?off|wire wheel|sand|deburr|abrasive|scotch.?brite)/.test(n)) return "Abrasives";
  if (/(helmet|glove|jacket|apron|safety glass|respirator|ear plug|boot|shield|lens)/.test(n)) return "Safety Gear";
  if (/(tube|tubing|pipe|round|square tube|rectangular|dom|erw|schedule)/.test(n)) return "Pipe/Tube";
  if (/(beam|column|gusset|bracket|brace|frame|weldment|assembly|structure)/.test(n)) return "Structural";
  return "Other";
}

const MyTorch = () => {
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
    'Base Metals': '🔩',
    'Filler Materials': '🪡',
    'Shielding Gas': '💨',
    'Flux/Consumables': '🔥',
    'Fasteners/Hardware': '🔧',
    'Abrasives': '💎',
    'Safety Gear': '�',
    'Structural': '🏗️',
    'Pipe/Tube': '🔲',
    'Other': '⚙️',
  };

  const [detectedMaterials, setDetectedMaterials] = useState<string[]>([]);

  // Project Matcher modal state
  const [matcherOpen, setMatcherOpen] = useState(false);
  const [matcherLoading, setMatcherLoading] = useState(false);
  const [matcherError, setMatcherError] = useState('');
  const [matcherProjects, setMatcherProjects] = useState<ProjectCard[]>([]);

  // MySpecBook state (for MVP, local only)
  const [specbook, setSpecbook] = useState<ProjectCard[]>([]);
  const [ingredients, setIngredients] = useState<Material[]>([]);
  const [benchError, setBenchError] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [filterText, setFilterText] = useState('');

  const addMaterial = () => {
    if (input.trim()) {
      setIngredients(prev => [...prev, { name: input.trim(), category }]);
      setInput('');
    }
  };

  // Save bench to Supabase whenever ingredients change
  useEffect(() => {
    if (ingredients.length === 0) return;
    saveBench(user?.id!, ingredients).catch(err => setBenchError('Failed to save your workspace.'));
  }, [ingredients]);

  // Jake context: set page on mount
  useEffect(() => {
    updateContext({ page: 'MyTorch' });
    // Load both bench and spec book data
    const loadData = async () => {
      try {
        const [benchMaterials, specbookProjects] = await Promise.all([
          fetchBench(user?.id!),
          fetchSpecBook(user?.id!)
        ]);
        setIngredients(benchMaterials);
        setSpecbook(specbookProjects);
      } catch (error) {
        console.error('Error loading data:', error);
        setBenchError('Failed to load your workspace.');
      }
    };
    loadData();
  }, [updateContext]);

  // Filtering logic (only by search text)
  const filteredIngredients = ingredients.filter(ing => {
    return ing.name.toLowerCase().includes(filterText.toLowerCase());
  });

  const handleLikeProject = async (project: ProjectCard) => {
    
    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .insert([
          { 
            user_id: user?.id, 
            recipe: {
              ...project
            }
          }
        ]);
      
      if (error) throw error;
      
      // Award XP for saving a project
      if (user) {
        await import('../services/xpService').then(m => 
          m.awardXP(user.id, XP_REWARDS.PROJECT_SAVE, 'project_save')
        );
        refreshXP();
      }
    } catch (error: any) {
      console.error('Error saving project:', error.message || error);
      console.error('Failed project:', {
        id: project.id,
        title: project.title,
        user: user?.id || 'no user'
      });
    }
  };

  const handleSaveProjectToSpecBook = async (project: ProjectCard) => {
    try {
      await addProjectToSpecBook(user?.id!, project);
      setSpecbook(prev => [...prev, project]);
    } catch (error) {
      console.error('Error saving project to spec book:', error);
    }
  };

  return (
    <div className="w-[90%] mx-auto mt-4">
      <div className="mb-8 mx-auto">
        <div className={STANDARD_DASHBOARD_FRAME_CLASSES}>
        {/* My Bench header */}
        <div className="flex items-center justify-center p-6 pb-4">
          <span className="text-5xl mr-2">🔥</span>
          <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('myBench.title')}</h1>
        </div>
        
        {/* Sticky Separation line */}
        <div className="sticky top-0 bg-white z-10 px-6">
          <hr className="border-t-2 border-maineBlue" />
        </div>
        
        {/* Scrollable Content */}
        <div className="p-6 pt-4">
      {/* Bench, Project Matcher, and Upload Photo Action Buttons */}
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
          id="scan-bench-file"
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
                  
                  const newMaterials = Array.from(new Set(detectedItems))
                    .filter(d => {
                      const normalizedDetected = d.toLowerCase().trim();
                      return !ingredients.some(i => 
                        i.name.toLowerCase().trim() === normalizedDetected ||
                        i.name.toLowerCase().trim().includes(normalizedDetected) ||
                        normalizedDetected.includes(i.name.toLowerCase().trim())
                      );
                    });
                  
                  if (newMaterials.length === 0) {
                    setScanStatus(t('myBench.noNewIngredients'));
                    alert(t('myBench.noNewIngredients'));
                  } else {
                    // Check user before saving
                    try {
                      const sessionValid = await isSessionValid();
                      if (!sessionValid || !user) {
                        setScanStatus(t('myBench.notSignedIn'));
                        alert(t('myBench.notSignedIn'));
                        setScanLoading(false);
                        return;
                      }
                    } catch (userErr) {
                      console.error('Error fetching user:', userErr);
                      setScanStatus(t('myBench.couldNotVerify'));
                      alert(t('myBench.couldNotVerify'));
                      setScanLoading(false);
                      return;
                    }
                    const updatedMaterials = [
                      ...ingredients,
                      ...newMaterials.map(name => ({ name, category: categorizeMaterial(name) }))
                    ];
                    setIngredients(updatedMaterials);
                    try {
                      await saveBench(user?.id!, updatedMaterials);
                      setBenchError(null);
                      setScanStatus(t('myBench.ingredientsSaved'));
                      alert(t('myBench.ingredientsSaved'));
                    } catch (err: any) {
                      setBenchError(t('myBench.failedToSave') + ' ' + (err.message || err.toString()));
                      setScanStatus(t('myBench.failedToSave') + ' ' + (err.message || err.toString()));
                      alert(t('myBench.failedToSave') + ' ' + (err.message || err.toString()));
                    }
                  }
                  setDetectedMaterials([]);
                } catch (err: any) {
                  setScanError(err.message || t('myBench.failedToScan'));
                  alert(t('myBench.failedToScan') + ': ' + (err.message || err.toString()));
                }
                setScanLoading(false);
              };
              reader.readAsDataURL(file);
            } catch (err) {
              setScanError(t('myBench.failedToScan'));
              setScanLoading(false);
            }
          }}
        />
        <button
          className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-black w-full sm:w-auto max-w-xs"
          onClick={() => document.getElementById('scan-bench-file')?.click()}
          disabled={scanLoading}
        >
          {scanLoading ? t('myBench.scanning') : t('myBench.scanKitchen')}
        </button>
        <button
          className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black w-full sm:w-auto max-w-xs"
          onClick={async () => {
             setMatcherOpen(true);
            setMatcherLoading(true);
            setMatcherError('');
            try {
              const materialNames = ingredients.map(i => i.name);
              const { fetchProjectsWithImages } = await import('../api/projectMatcher');
              const projects = await fetchProjectsWithImages({
                userId: user?.id!,
                materials: materialNames,
                numProjects: 5,
                // These will be undefined by default, which is fine - the function has defaults
                shopSetup: undefined,
                talentsEnabled: false,
                talentTree: null
              });
              setMatcherProjects(projects);
            } catch (err: any) {
              setMatcherError('Failed to fetch projects.');
            } finally {
              setMatcherLoading(false);
            }
          }}
        >
          {t('myBench.matchRecipes')}
        </button>
      </div>

      {/* Scan Results Modal */}
      {scanLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-weatheredWhite p-8 rounded shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maineBlue mb-4"></div>
            <div className="text-lg font-retro mb-2">{t('myBench.scanningPhoto')}</div>
          </div>
        </div>
      )}
      {scanError && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-weatheredWhite p-8 rounded shadow-lg flex flex-col items-center">
            <div className="text-lobsterRed font-bold mb-2">{scanError}</div>
            <button className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold mt-2" onClick={() => setScanError('')}>{t('myBench.close')}</button>
          </div>
        </div>
      )}

      {/* Project Matcher Modal (always mounted for overlay) */}
      <PartMatcherModal
        open={matcherOpen}
        onClose={() => setMatcherOpen(false)}
        benchMaterials={ingredients.map(i => i.name)}
        onLike={handleLikeProject}
        saveProjectToSpecBook={handleSaveProjectToSpecBook}
        projects={matcherProjects}
        loading={matcherLoading}
        error={matcherError}
      />


      {/* Material Rack Section */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-retro text-maineBlue flex items-center gap-2">
          <span role="img" aria-label="gear">⚙️</span> {t('myBench.digitalCupboard')}
        </h3>
        {ingredients.length > 0 && (
          <button
            className="text-xs text-lobsterRed underline hover:text-maineBlue"
            onClick={() => setIngredients([])}
          >
            {t('myBench.clearAll')}
          </button>
        )}
      </div>
      {/* Add Material Bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
        {/* Search materials input */}
        <input
          type="text"
          className="border px-3 py-2 rounded w-full sm:w-1/3"
          placeholder={t('myBench.searchCupboard')}
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          style={{ minWidth: 120 }}
        />
        {/* Add material input */}
        <input
          type="text"
          className="border px-3 py-2 rounded w-full sm:w-1/3"
          placeholder={t('myBench.addAnIngredient')}
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
          onClick={addMaterial}
        >
          {t('myBench.add')}
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
          <div className="text-gray-500 italic text-center py-8 relative z-10">{t('myBench.noMatchingIngredients')}</div>
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
                        onClick={() => {
                          // Remove by name and category match to be robust
                          setIngredients(ingredients.filter((item, i) => !(item.name === ing.name && item.category === ing.category && ingredients.indexOf(item) === ingredients.indexOf(filteredIngredients[shelfIdx*3+idx]))));
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
    </div>
  );
};

export default MyTorch;


