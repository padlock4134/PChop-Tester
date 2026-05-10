import React, { useState, useEffect } from 'react';
import { saveDock, fetchDock } from './kitchenSupabase';
import { fetchRunbook, addRouteToRunbook } from './cookbookSupabase';
import { Item } from '../types/shared-types';
import { XP_REWARDS } from '../services/xpService';
import { useLevelProgressContext } from '../components/NavBar';
import { useTranslation } from 'react-i18next';

import { scanImage } from '../api/vision';
import RouteMatcherModal, { RouteCard } from '../components/RouteMatcherModal';
import { useFreddieContext } from '../components/DockFreddieContext';
import { useSupabase } from '../components/SupabaseProvider';
import { isSessionValid } from '../api/userSession';
import { supabase } from '../api/supabaseClient';

const CATEGORIES = [
  "General Freight",
  "Palletized Goods",
  "Temperature Controlled",
  "Hazmat",
  "Oversized/Heavy",
  "Parcel/Small Package",
  "Raw Materials",
  "Electronics/High Value",
  "Documents/Paperwork",
  "Other"
];

// Categorize item names to best-fit cargo category
function categorizeItem(name: string): string {
  const n = name.toLowerCase();
  if (/(pallet|skid|crate|case lot|bulk goods|carton|drum)/.test(n)) return "Palletized Goods";
  if (/(frozen|refrigerat|cold|reefer|perishable|chilled|dairy|produce|meat|seafood|ice)/.test(n)) return "Temperature Controlled";
  if (/(hazmat|hazardous|flammable|corrosive|explosive|toxic|chemical|fuel|gas|propane|acid)/.test(n)) return "Hazmat";
  if (/(oversize|oversized|heavy haul|wide load|machinery|equipment|crane|bulldozer|generator|transformer)/.test(n)) return "Oversized/Heavy";
  if (/(parcel|package|envelope|small box|letter|fedex|ups|usps|dhl|last.?mile)/.test(n)) return "Parcel/Small Package";
  if (/(lumber|steel|concrete|gravel|sand|aggregate|pipe|rebar|raw|ore|grain|coal|scrap)/.test(n)) return "Raw Materials";
  if (/(electronic|computer|server|phone|laptop|tv|monitor|high.?value|medical device|pharma)/.test(n)) return "Electronics/High Value";
  if (/(document|paper|bol|manifest|invoice|customs|permit|certificate|label)/.test(n)) return "Documents/Paperwork";
  if (/(freight|shipment|cargo|load|delivery|order|container|trailer)/.test(n)) return "General Freight";
  return "Other";
}

const MyDock = () => {
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
    'General Freight': '🚛',
    'Palletized Goods': '📦',
    'Temperature Controlled': '❄️',
    'Hazmat': '☣️',
    'Oversized/Heavy': '�️',
    'Parcel/Small Package': '📬',
    'Raw Materials': '�',
    'Electronics/High Value': '💻',
    'Documents/Paperwork': '📋',
    'Other': '�️',
  };

  const [detectedItems, setDetectedItems] = useState<string[]>([]);

  // Route Matcher modal state
  const [matcherOpen, setMatcherOpen] = useState(false);
  const [matcherLoading, setMatcherLoading] = useState(false);
  const [matcherError, setMatcherError] = useState('');
  const [matcherRoutes, setMatcherRoutes] = useState<RouteCard[]>([]);

  // Runbook state (for MVP, local only)
  const [runbook, setRunbook] = useState<RouteCard[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [dockError, setDockError] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [filterText, setFilterText] = useState('');

  const addItem = () => {
    if (input.trim()) {
      setItems(prev => [...prev, { name: input.trim(), category }]);
      setInput('');
    }
  };

  // Save dock to Supabase whenever items change
  useEffect(() => {
    if (items.length === 0) return;
    saveDock(user?.id!, items).catch(err => setDockError('Failed to save your workspace.'));
  }, [items]);

  // Freddie context: set page on mount
  useEffect(() => {
    updateContext({ page: 'MyDock' });
    // Load both dock and runbook data
    const loadData = async () => {
      try {
        const [dockItems, runbookRoutes] = await Promise.all([
          fetchDock(user?.id!),
          fetchRunbook(user?.id!)
        ]);
        setItems(dockItems);
        setRunbook(runbookRoutes);
      } catch (error) {
        console.error('Error loading data:', error);
        setDockError('Failed to load your workspace.');
      }
    };
    loadData();
  }, [updateContext]);

  // Filtering logic (only by search text)
  const filteredItems = items.filter(ing => {
    return ing.name.toLowerCase().includes(filterText.toLowerCase());
  });

  const handleLikeRoute = async (route: RouteCard) => {
    console.log('Saving route with nutrition data:', route.nutrition);
    
    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .insert([
          { 
            user_id: user?.id, 
            route: {
              ...route,
              nutrition: route.nutrition // Include nutrition data
            }
          }
        ]);
      
      if (error) throw error;
      
      // Award XP for saving a route
      if (user) {
        await import('../services/xpService').then(m => 
          m.awardXP(user.id, XP_REWARDS.ROUTE_SAVE, 'route_save')
        );
        refreshXP();
      }
    } catch (error: any) {
      console.error('Error saving route:', error.message || error);
      console.error('Failed route:', {
        id: route.id,
        title: route.title,
        user: user?.id || 'no user'
      });
    }
  };

  const handleSaveRouteToRunbook = async (route: RouteCard) => {
    try {
      await addRouteToRunbook(user?.id!, route);
      setRunbook(prevRunbook => [...prevRunbook, route]);
    } catch (error) {
      console.error('Error saving route to runbook:', error);
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg shadow-lg border-4 border-maineBlue flex flex-col max-h-[calc(100vh-100px)] desktop-dashboard-frame student-dashboard-frame">
        {/* My Dock header - moved back inside the module */}
        <div className="flex items-center justify-center p-6 pb-4">
          <span className="text-5xl mr-2">🚂</span>
          <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('myDock.title')}</h1>
        </div>
        
        {/* Sticky Separation line */}
        <div className="sticky top-0 bg-white z-10 px-6">
          <hr className="border-t-2 border-maineBlue" />
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 pt-4">
      {/* Dock, Route Matcher, and Upload Photo Action Buttons */}
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
          id="scan-dock-file"
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
                  
                  const newItems = Array.from(new Set(detectedItems))
                    .filter(d => {
                      const normalizedDetected = d.toLowerCase().trim();
                      return !items.some(i => 
                        i.name.toLowerCase().trim() === normalizedDetected ||
                        i.name.toLowerCase().trim().includes(normalizedDetected) ||
                        normalizedDetected.includes(i.name.toLowerCase().trim())
                      );
                    });
                  
                  console.log('New items to add:', newItems);
                  if (newItems.length === 0) {
                    setScanStatus(t('myDock.noNewIngredients', { defaultValue: 'No new items detected.' }));
                    alert(t('myDock.noNewIngredients', { defaultValue: 'No new items detected.' }));
                  } else {
                    // Check user before saving
                    try {
                      const sessionValid = await isSessionValid();
                      console.log('Current user:', user);
                      if (!sessionValid || !user) {
                        setScanStatus(t('myDock.notSignedIn'));
                        alert(t('myDock.notSignedIn'));
                        setScanLoading(false);
                        return;
                      }
                    } catch (userErr) {
                      console.error('Error fetching user:', userErr);
                      setScanStatus(t('myDock.couldNotVerify'));
                      alert(t('myDock.couldNotVerify'));
                      setScanLoading(false);
                      return;
                    }
                    const updatedItems = [
                      ...items,
                      ...newItems.map(name => ({ name, category: categorizeItem(name) }))
                    ];
                    setItems(updatedItems);
                    try {
                      await saveDock(user?.id!, updatedItems);
                      setDockError(null);
                      setScanStatus(t('myDock.ingredientsSaved', { defaultValue: 'Items saved to inventory!' }));
                      alert(t('myDock.ingredientsSaved', { defaultValue: 'Items saved to inventory!' }));
                    } catch (err: any) {
                      setDockError(t('myDock.failedToSave') + ' ' + (err.message || err.toString()));
                      setScanStatus(t('myDock.failedToSave') + ' ' + (err.message || err.toString()));
                      alert(t('myDock.failedToSave') + ' ' + (err.message || err.toString()));
                    }
                  }
                  setDetectedItems([]);
                } catch (err: any) {
                  setScanError(err.message || t('myDock.failedToScan'));
                  alert(t('myDock.failedToScan') + ': ' + (err.message || err.toString()));
                }
                setScanLoading(false);
              };
              reader.readAsDataURL(file);
            } catch (err) {
              setScanError(t('myDock.failedToScan'));
              setScanLoading(false);
            }
          }}
        />
        <button
          className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-black w-full sm:w-auto max-w-xs"
          onClick={() => document.getElementById('scan-dock-file')?.click()}
          disabled={scanLoading}
        >
          {scanLoading ? t('myDock.scanning') : t('myDock.scanDock', { defaultValue: 'Scan Dock' })}
        </button>
        <button
          className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black w-full sm:w-auto max-w-xs"
          onClick={async () => {
             setMatcherOpen(true);
            setMatcherLoading(true);
            setMatcherError('');
            try {
              const inventoryNames = items.map(i => i.name);
              const { fetchRoutesWithImages } = await import('../api/recipeMatcher');
              const routes = await fetchRoutesWithImages({
                userId: user?.id!,
                items: inventoryNames,
                numRoutes: 5,
                // These will be undefined by default, which is fine - the function has defaults
                dockSetup: undefined,
                talentsEnabled: false,
                talentTree: null
              });
              setMatcherRoutes(routes);
            } catch (err: any) {
              setMatcherError('Failed to fetch routes.');
            } finally {
              setMatcherLoading(false);
            }
          }}
        >
          {t('myDock.matchRecipes', { defaultValue: 'Match Routes' })}
        </button>
      </div>

      {/* Scan Results Modal */}
      {scanLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-weatheredWhite p-8 rounded shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maineBlue mb-4"></div>
            <div className="text-lg font-retro mb-2">{t('myDock.scanningPhoto')}</div>
          </div>
        </div>
      )}
      {scanError && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-weatheredWhite p-8 rounded shadow-lg flex flex-col items-center">
            <div className="text-lobsterRed font-bold mb-2">{scanError}</div>
            <button className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold mt-2" onClick={() => setScanError('')}>{t('myDock.close')}</button>
          </div>
        </div>
      )}

      {/* Route Matcher Modal (always mounted for overlay) */}
      <RouteMatcherModal
        open={matcherOpen}
        onClose={() => setMatcherOpen(false)}
        inventoryItems={items.map(i => i.name)}
        onLike={handleLikeRoute}
        saveRouteToRunbook={handleSaveRouteToRunbook}
        routes={matcherRoutes}
        loading={matcherLoading}
        error={matcherError}
      />


      {/* Digital Inventory Section */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-retro text-maineBlue flex items-center gap-2">
          <span role="img" aria-label="package">📦</span> {t('myDock.digitalCupboard', { defaultValue: 'Digital Inventory' })}
        </h3>
        {items.length > 0 && (
          <button
            className="text-xs text-lobsterRed underline hover:text-maineBlue"
            onClick={() => setItems([])}
          >
            {t('myDock.clearAll')}
          </button>
        )}
      </div>
      {/* Add Item Bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
        {/* Search inventory input */}
        <input
          type="text"
          className="border px-3 py-2 rounded w-full sm:w-1/3"
          placeholder={t('myDock.searchCupboard', { defaultValue: 'Search inventory...' })}
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          style={{ minWidth: 120 }}
        />
        {/* Add item input */}
        <input
          type="text"
          className="border px-3 py-2 rounded w-full sm:w-1/3"
          placeholder={t('myDock.addAnIngredient', { defaultValue: 'Add a cargo item...' })}
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
          onClick={addItem}
        >
          {t('myDock.add')}
        </button>
      </div>
      <div className="bg-gradient-to-br from-yellow-100 to-sand border-4 border-yellow-900 rounded-2xl shadow-lg p-4 relative overflow-hidden">
        {/* Rope border accent */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg width="100%" height="100%" className="absolute top-0 left-0" style={{zIndex:0}}>
            <rect x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="20" fill="none" stroke="#d2b48c" strokeWidth="4" strokeDasharray="8,4" />
          </svg>
        </div>
        {filteredItems.length === 0 ? (
          <div className="text-gray-500 italic text-center py-8 relative z-10">{t('myDock.noMatchingIngredients', { defaultValue: 'No matching items. Add cargo to your inventory!' })}</div>
        ) : (
          <div className="flex flex-col gap-4 relative z-10">
            {[0,1,2,3,4,5].map(shelfIdx => {
              const shelfItems = filteredItems.slice(shelfIdx*3, (shelfIdx+1)*3);
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
                          setItems(items.filter((item, i) => !(item.name === ing.name && item.category === ing.category && items.indexOf(item) === items.indexOf(filteredItems[shelfIdx*3+idx]))));
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

export default MyDock;

