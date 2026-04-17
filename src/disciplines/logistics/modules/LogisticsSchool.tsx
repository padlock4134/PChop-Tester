import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../components/DockFreddieContext';
import VideoModal from '../components/VideoModal';
import { useRouteContext } from '../components/RouteContext';
import { getTutorialVideo, TutorialVideoResult } from '../utils/videoSearch';
import { getMainEquipment, getMainItem } from '../utils/mainSelectors';
import { fetchNutritionData, calculateRouteNutrition } from '../api/nutritionService';
import { KeyNutrients } from '../types/nutrition';
import SyllabusCard, { SyllabusCourse } from '../components/SyllabusCard';
import ShipmentTimer from '../components/ShipmentTimer';
import DockPracticeModal from '../components/DockPracticeModal';

const generalLessons = [
  { title: 'DOT Regulations & HOS', desc: 'Hours of Service rules, logbooks, and DOT compliance basics.' },
  { title: 'Freight Classification & NMFC', desc: 'How to classify freight and read the National Motor Freight Classification.' },
  { title: 'Route Planning & Optimization', desc: 'How to plan efficient routes to reduce cost and delivery time.' },
  { title: 'Warehouse Operations Basics', desc: 'Receiving, put-away, picking, packing, and shipping procedures.' },
  { title: 'Supply Chain Fundamentals', desc: 'From procurement to last-mile delivery — the full chain explained.' },
  { title: 'Equipment & Technology Care', desc: 'Maintaining scanners, forklifts, and warehouse management systems.' }
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
      title: 'Let\'s Move This Shipment!',
      desc: 'How to approach the main task for this logistics operation.'
    }
  ];
}

// 52 Fundamental Logistics Techniques (one for each week of the year)
const WEEKLY_TECHNIQUES = [
  // Freight & Documentation Fundamentals (Weeks 1-13)
  { title: "Bill of Lading Basics", desc: "Reading, completing, and verifying a BOL for shipment" },
  { title: "Freight Classification (NMFC)", desc: "Classifying freight by density, stowability, and value" },
  { title: "Packing List & Commercial Invoice", desc: "Required documents for domestic and international freight" },
  { title: "Proof of Delivery (POD)", desc: "Capturing and managing delivery confirmation" },
  { title: "Carrier Selection Basics", desc: "LTL vs. FTL vs. parcel — choosing the right mode" },
  { title: "Freight Rate Negotiation", desc: "Base rate, accessorial charges, and fuel surcharges" },
  { title: "Dimensional Weight Calculation", desc: "Calculating dim weight and when it applies" },
  { title: "Hazmat Shipping Basics", desc: "Placarding, labeling, and documentation for hazardous materials" },
  { title: "Incoterms Explained", desc: "EXW, FOB, CIF, DDP — risk and responsibility at each point" },
  { title: "Import/Export Customs Basics", desc: "Customs entry, tariff codes, and broker relationships" },
  { title: "Chain of Custody Documentation", desc: "Tracking ownership and responsibility through the supply chain" },
  { title: "Carrier Vetting & Compliance", desc: "FMCSA authority, insurance, and safety rating requirements" },
  { title: "Load Planning Basics", desc: "Weight distribution, cube utilization, and sequence loading" },

  // Warehouse & Inventory Operations (Weeks 14-26)
  { title: "Receiving Procedure", desc: "Unloading, inspection, counting, and discrepancy reporting" },
  { title: "Put-Away Strategy", desc: "Fixed vs. floating locations, slotting, and storage zones" },
  { title: "Pick, Pack & Ship Workflow", desc: "Order fulfillment sequence for accuracy and speed" },
  { title: "Barcode & RFID Scanning", desc: "Using WMS scanners for receiving, picking, and shipping" },
  { title: "Cycle Count Procedures", desc: "ABC cycle counting and inventory reconciliation" },
  { title: "FIFO vs. FEFO", desc: "First In First Out vs. First Expired First Out for inventory" },
  { title: "Pallet Building Technique", desc: "Weight limits, stability, stretch wrap, and labeling" },
  { title: "Forklift Operation Basics", desc: "Pre-operation inspection, load capacity, and safe travel" },
  { title: "Dock Safety & Procedures", desc: "Dock locks, wheel chocks, and trailer restraint systems" },
  { title: "Cross-Docking Operations", desc: "Direct transfer from inbound to outbound without storage" },
  { title: "Returns Management (Reverse Logistics)", desc: "RMA process, inspection, restocking, and disposal" },
  { title: "Cold Chain Basics", desc: "Temperature-controlled shipping, monitoring, and compliance" },
  { title: "WMS Navigation", desc: "Using a Warehouse Management System for daily operations" },

  // Transportation & Route Management (Weeks 27-39)
  { title: "Route Optimization Basics", desc: "Reducing miles and time with optimized delivery sequences" },
  { title: "DOT Hours of Service Rules", desc: "11-hour driving limit, 14-hour window, and 30-minute break" },
  { title: "ELD (Electronic Logging Device) Use", desc: "Logging duty status changes and HOS compliance" },
  { title: "Pre-Trip Vehicle Inspection", desc: "DVIR checklist: brakes, tires, lights, and fluid levels" },
  { title: "Load Securement Standards", desc: "FMCSA cargo securement rules for flatbed and enclosed" },
  { title: "Transportation Modes Comparison", desc: "Truckload, rail, ocean, and air — cost and lead time tradeoffs" },
  { title: "Last-Mile Delivery Strategies", desc: "Urban delivery challenges, BOPIS, and customer communication" },
  { title: "Intermodal Freight Basics", desc: "Container shipping, drayage, and intermodal transfers" },
  { title: "Fuel Management & Efficiency", desc: "Idle time, routing, and fuel card programs" },
  { title: "Driver Communication & Dispatch", desc: "Radio, TMS messaging, and proactive status updates" },
  { title: "Accessorial Charges Explained", desc: "Detention, liftgate, residential, and inside delivery fees" },
  { title: "Freight Claims Process", desc: "Filing, documenting, and resolving damage and shortage claims" },
  { title: "3PL vs. In-House Logistics", desc: "When to outsource and how to manage a 3PL relationship" },

  // Technology, Compliance & Professional Skills (Weeks 40-52)
  { title: "TMS (Transportation Management System)", desc: "Booking, tracking, and reporting with a TMS" },
  { title: "EDI Basics", desc: "Electronic Data Interchange — 850, 856, 810, and 214 transaction sets" },
  { title: "KPI Measurement in Logistics", desc: "On-time delivery, fill rate, order accuracy, and cost per unit" },
  { title: "OSHA Warehouse Safety", desc: "Forklift safety, racking standards, and PPE requirements" },
  { title: "DOT Compliance Audits", desc: "What auditors look for and how to stay compliant" },
  { title: "Carrier Performance Scorecards", desc: "Measuring and communicating carrier performance" },
  { title: "Supply Chain Disruption Planning", desc: "Building resilience with alternate carriers and safety stock" },
  { title: "Sustainable Logistics Practices", desc: "Carbon footprint, load consolidation, and green initiatives" },
  { title: "Customer Service in Logistics", desc: "Proactive communication, issue resolution, and escalation" },
  { title: "Negotiating Carrier Contracts", desc: "Volume commitments, rate caps, and service level agreements" },
  { title: "Logistics Technology Trends", desc: "Automation, robotics, AI routing, and blockchain in supply chain" },
  { title: "Estimating Freight Costs", desc: "Building accurate freight quotes and cost-per-unit analysis" },
  { title: "Career Pathways", desc: "Dispatcher to logistics manager to supply chain director — the roadmap" }
];

// Get the technique for current week (1-52)
function getCurrentWeekTechnique() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((now.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
  const techniqueIndex = (weekNumber - 1) % 52; // Cycle through 52 techniques
  return WEEKLY_TECHNIQUES[techniqueIndex];
}

function getTwoTutorials(route: any) {
  if (!route) return [];
  
  const weeklyTechnique = getCurrentWeekTechnique();
  
  return [
    {
      title: `Technique of the Week: ${weeklyTechnique.title}`,
      desc: weeklyTechnique.desc,
      type: 'weekly_technique',
      techniqueData: weeklyTechnique
    },
    {
      title: `Let\'s Move This Shipment!`,
      desc: `Step-by-step logistics walkthrough for ${route.title}.`,
      type: 'cooking_tutorial'
    }
  ];
}


const LogisticsSchool = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { selectedRoute } = useRouteContext();
  console.log('Logistics School - Shipment data:', selectedRoute?.nutrition);
  console.log('Logistics School - Full Operation:', selectedRoute);
  const [modalIdx, setModalIdx] = useState<null | number>(null);
  const [routeNutrition, setRouteNutrition] = useState<KeyNutrients | null>(null);
  const [servingSize, setServingSize] = useState(2);
  const [benchPracticeOpen, setBenchPracticeOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'school' | 'syllabus'>('school');

  // Mock syllabus data
  const mockSyllabusData = {
    title: "Logistics & Supply Chain Curriculum",
    courses: [
      {
        id: "course-1",
        title: "Term 1: Logistics Fundamentals",
        lessons: [
          { id: "lesson-1-1", title: "Workplace Safety and OSHA Basics", completed: true, current: false },
          { id: "lesson-1-2", title: "Supply Chain Overview and Key Players", completed: true, current: false },
          { id: "lesson-1-3", title: "Freight Documentation and BOLs", completed: true, current: false },
          { id: "lesson-1-4", title: "Freight Classification and Rates", completed: false, current: true },
          { id: "lesson-1-5", title: "DOT Regulations and Compliance", completed: false, current: false },
        ]
      },
      {
        id: "course-2",
        title: "Term 1: Warehouse Operations",
        lessons: [
          { id: "lesson-2-1", title: "Receiving, Put-Away, and Inventory Control", completed: false, current: false },
          { id: "lesson-2-2", title: "Pick, Pack, and Ship Procedures", completed: false, current: false },
          { id: "lesson-2-3", title: "Forklift Operation and Dock Safety", completed: false, current: false },
          { id: "lesson-2-4", title: "WMS and Scanning Technology", completed: false, current: false },
        ]
      },
      {
        id: "course-3",
        title: "Term 2: Transportation & Route Management",
        lessons: [
          { id: "lesson-3-1", title: "Carrier Selection and Mode Comparison", completed: false, current: false },
          { id: "lesson-3-2", title: "Route Optimization and Dispatch", completed: false, current: false },
          { id: "lesson-3-3", title: "HOS Rules and ELD Compliance", completed: false, current: false },
          { id: "lesson-3-4", title: "Load Planning and Cargo Securement", completed: false, current: false },
        ]
      },
      {
        id: "course-4",
        title: "Term 2: Technology & Professional Practice",
        lessons: [
          { id: "lesson-4-1", title: "TMS and EDI Fundamentals", completed: false, current: false },
          { id: "lesson-4-2", title: "KPIs, Scorecards, and Performance Metrics", completed: false, current: false },
          { id: "lesson-4-3", title: "Customer Service and Freight Claims", completed: false, current: false },
          { id: "lesson-4-4", title: "Career Pathways in Logistics", completed: false, current: false },
        ]
      }
    ] as SyllabusCourse[]
  };

  const handleLessonClick = (lessonId: string) => {
    console.log(`Navigating to lesson: ${lessonId}`);
  };

  useEffect(() => {
    updateContext({ page: 'LogisticsSchool' });
  }, [updateContext]);

  useEffect(() => {
    if (selectedRoute && !selectedRoute.nutrition) {
      // Calculate nutrition if missing
      calculateRouteNutrition(selectedRoute.items)
        .then(nutrition => {
          setRouteNutrition(nutrition);
        })
        .catch(error => {
          console.error('Error calculating nutrition:', error);
        });
    } else {
      setRouteNutrition(selectedRoute?.nutrition || null);
    }
  }, [selectedRoute]);

  const isRouteSelected = !!selectedRoute;
  const tutorials = isRouteSelected ? getTwoTutorials(selectedRoute) : getDefaultTutorials();
  const [videoUrls, setVideoUrls] = useState<(string | null)[]>([null, null]);

  // Helper: extract primary material from components
  function getMainProtein(items: string[] = []) {
    const proteins = [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'clam', 'crab', 'lobster',
      'tofu', 'turkey', 'duck', 'lamb', 'egg', 'eggs', 'scallop', 'scallops', 'mussels', 'steak',
      'bacon', 'sausage', 'ham', 'vegan', 'tempeh', 'seitan', 'octopus', 'squid', 'anchovy', 'anchovies'
    ];
    return items.find(ing => proteins.some(p => ing.toLowerCase().includes(p)));
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

  // Helper to call Dispatcher Freddie backend for a smart search query
  async function getVideoQueryFromFreddie(route: any, tut: any, idx: any) {
    let query = '';
    
    // Handle different tutorial types
    if (tut.type === 'weekly_technique') {
      // For technique of the week, search for the specific technique
      query = `how to ${tut.techniqueData.title.toLowerCase()} trade technique`;
    } else if (tut.type === 'cooking_tutorial') {
      // For task tutorials, focus on the project
      const mainProtein = getMainProtein(route.items || []);
      const mainEquipment = getMainEquipment(route.equipment || []);
      if (mainProtein && mainEquipment) {
        query = `How to cook ${mainProtein} using ${mainEquipment}`;
      } else if (mainProtein) {
        query = `How to cook ${mainProtein}`;
      } else {
        query = `how to complete ${route.title}`;
      }
    } else {
      // Legacy fallback for older tutorial formats
      if (typeof idx === 'number' && idx === 2 && route && route.title) {
        return route.title;
      }
      
      // Use Dispatcher Freddie for complex queries
      const prompt = `
        Given the following project and tutorial step, generate a concise YouTube search query for a relevant trade training video.\n
        - Only use the equipment and items listed.\n
        - Do NOT include unrelated tools or techniques.\n
        - The query should be specific to the step and route.\n
        Route: ${route.title}\n
        Items: ${route.items?.join(', ')}\n
        Equipment: ${route.equipment?.join(', ') || 'N/A'}\n
        Step Title: ${tut.title}\n
        Step Description: ${tut.desc}\n
        Query:
      `;
      try {
        const res = await fetch('/api/dispatcherFreddieQuery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        query = data.query || tut.title + ' ' + (route.title || '');
      } catch {
        query = tut.title + ' ' + (route.title || '');
      }
    }
    
    return query;
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchVideos() {
      // Now using API key rotation system for better quota management
      console.log('[LogisticsSchool] Fetching videos with API key rotation');
      console.log('[LogisticsSchool] Tutorials to fetch:', tutorials);
      console.log('[LogisticsSchool] Selected operation:', selectedRoute);

      const newUrls: (string | null)[] = [null, null];
      await Promise.all(tutorials.map(async (tut, idx) => {
        try {
          // Use the improved video query generation that handles different tutorial types
          const query = await getVideoQueryFromFreddie(
            selectedRoute || { title: '', items: [], equipment: [] }, 
            tut, 
            idx
          );
          
          console.log(`[LogisticsSchool] Tutorial ${idx} (${tut.type || 'legacy'}) query:`, query);
          
          const result: TutorialVideoResult = await getTutorialVideo(query);
          console.log(`[LogisticsSchool] Tutorial ${idx} result:`, result);
          
          if (result && result.url) {
            newUrls[idx] = result.url;
          }
        } catch (error) {
          console.error(`[LogisticsSchool] Error fetching video for tutorial ${idx}:`, error);
        }
      }));
      
      if (!cancelled) setVideoUrls(newUrls);
    }
    
    fetchVideos();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRouteSelected, selectedRoute?.id]);

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
          🚢 {t('logisticsSchool.title')}
        </button>
        <button
          onClick={() => setActiveMobileTab('syllabus')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'syllabus'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📚 {t('logisticsSchool.syllabus')}
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`lg:w-2/3 bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue ${
          activeMobileTab === 'school' ? 'block' : 'hidden lg:block'
        }`}>
          {/* Logistics School header - moved back inside the module */}
          <div className="flex items-center justify-center mb-4">
            <span className="text-5xl mr-2">🚢</span>
            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('logisticsSchool.title')}</h1>
          </div>
          
          {/* Separation line */}
          <hr className="border-t-2 border-maineBlue mb-6" />
        <div className="w-full mx-auto">
        <ShipmentTimer servingSize={servingSize} setServingSize={setServingSize} />
        {/* Always render a VideoModal for the currently displayed tutorial list */}
        {tutorials.map((tut, idx) => (
          <VideoModal
            key={idx}
            open={modalIdx === idx}
            onClose={() => setModalIdx(null)}
            title={tut.title}
            videoUrl={videoUrls[idx] || ''}
            tutorialId={`${selectedRoute?.id || 'general'}_${idx}`}
            routeId={selectedRoute?.id}
          />
        ))}
        {isRouteSelected && selectedRoute ? (
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
            {/* Route Card Display at Bottom (matching MyRunbook RouteCard layout) */}
            <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-black overflow-hidden w-full min-h-[350px] mt-8 mx-auto relative">
              <button
                onClick={() => window.location.reload()}
                className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"
                title={t('logisticsSchool.closeRecipe')}
              >
                <span className="text-red-500 font-bold text-lg">✕</span>
              </button>
              {/* Left Page */}
              <div className="flex-1 p-6 bg-weatheredWhite border-r border-gray-200 flex flex-col">
                {selectedRoute.image && (
                  <img
                    src={selectedRoute.image}
                    alt={selectedRoute.title}
                    className="rounded-lg w-full h-32 object-cover mb-4"
                    style={{ objectFit: 'cover' }}
                  />
                )}
                <h3 className="font-bold text-xl mb-1 text-maineBlue">{selectedRoute.title}</h3>
                {/* No description on RouteCard, but add if needed: */}
                {/* <div className="text-gray-600 mb-2 text-base">{selectedRoute.description}</div> */}
                <div className="font-semibold mb-1 mt-2">{t('logisticsSchool.ingredients')}</div>
                <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                  {selectedRoute.items?.length ? (
                    selectedRoute.items.map((ing: string, i: number) => <li key={i}>{ing}</li>)
                  ) : (
                    <li className="italic text-gray-400">{t('logisticsSchool.noIngredientsListed')}</li>
                  )}
                </ul>
                {routeNutrition && (
                  <div className="mt-2">
                    <div className="font-semibold mb-1">{t('logisticsSchool.nutritionTotal').replace('{servings}', servingSize.toString())}:</div>
                    <div className="text-sm">
                      <div>{t('logisticsSchool.carbs')}: {(routeNutrition.carbs * servingSize).toFixed(1)}g</div>
                      <div>{t('logisticsSchool.sugars')}: {(routeNutrition.sugars * servingSize).toFixed(1)}g</div>
                      <div>{t('logisticsSchool.fiber')}: {(routeNutrition.fiber * servingSize).toFixed(1)}g</div>
                      <div>{t('logisticsSchool.protein')}: {(routeNutrition.protein * servingSize).toFixed(1)}g</div>
                    </div>
                  </div>
                )}
              </div>
              {/* Right Page */}
              <div className="flex-1 p-6 bg-white flex flex-col">
                <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('logisticsSchool.instructions')}</h3>
                <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                  {selectedRoute.instructions || (
                    <span className="italic text-gray-400">{t('logisticsSchool.noInstructionsProvided')}</span>
                  )}
                </div>
                {/* Equipment Section */}
                {selectedRoute.equipment && selectedRoute.equipment.length > 0 && (
                  <>
                    <div className="font-semibold mt-4 mb-1">{t('logisticsSchool.equipmentNeeded')}</div>
                    <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                      {selectedRoute.equipment.map((eq: string, i: number) => (
                        <li key={i}>{eq}</li>
                      ))}
                    </ul>
                  </>
                )}
                {(!selectedRoute.equipment || selectedRoute.equipment.length === 0) && (
                  <div className="italic text-gray-400 mt-2">{t('logisticsSchool.noEquipmentListed')}</div>
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
              <div className="text-gray-700 mb-4">{t('logisticsSchool.getStarted')}</div>
              <div className="flex justify-center space-x-4">
                <Link to="/logistics/my-dock" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('logisticsSchool.goToMyKitchen')}</Link>
                <Link to="/logistics/my-runbook" className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors">{t('logisticsSchool.goToMyCookbook')}</Link>
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
      <DockPracticeModal 
        open={benchPracticeOpen}
        onClose={() => setBenchPracticeOpen(false)}
      />
    </div>
  );
};

export default LogisticsSchool;


