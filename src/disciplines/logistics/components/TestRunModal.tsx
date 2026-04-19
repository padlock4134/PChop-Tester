import React, { useState } from 'react';

interface TestRunModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestRunModal: React.FC<TestRunModalProps> = ({ isOpen, onClose }) => {
  const CATEGORIES = [
    "Palletized Freight",
    "Parcels",
    "Hazmat",
    "Temperature-Controlled",
    "Oversized/Heavy",
    "Documents & BOLs",
    "PPE & Safety Gear",
    "Packing Materials",
    "Fuel & Fluid",
    "Other"
  ];

  const [input, setInput] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [filterText, setFilterText] = useState('');
  const [items, setItems] = useState([
    { name: 'Standard Pallets', category: 'Palletized Freight' },
    { name: 'Shrink Wrap', category: 'Packing Materials' },
    { name: 'BOL Forms', category: 'Documents & BOLs' },
    { name: 'Safety Vest', category: 'PPE & Safety Gear' },
    { name: 'Barcode Labels', category: 'Documents & BOLs' }
  ]);
  const [scanLoading, setScanLoading] = useState(false);
  const [matcherOpen, setMatcherOpen] = useState(false);
  const [matcherLoading, setMatcherLoading] = useState(false);
  const [showRouteMatcher, setShowRouteMatcher] = useState(false);
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(true);
  const [matchedRoutes, setMatchedRoutes] = useState<Array<{
    route: any;
    matchScore: number;
    matchingItems: string[];
  }>>([]);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const logisticsRoutes = [
    {
      id: '1',
      title: 'LTL Palletized Shipment',
      image: '/Preview Images/ltl-palletized-shipment.png',
      items: ['Standard Pallets', 'Shrink Wrap', 'Strapping', 'BOL Forms'],
      instructions: 'Verify pallet dimensions and freight class. Wrap and strap each pallet, attach BOL paperwork, and stage for carrier pickup.',
      equipment: ['Pallet Jack', 'Scale', 'Strapping Tool'],
      healthTags: ['DOT Compliance', 'Safety', 'Freight Class']
    },
    {
      id: '2',
      title: 'Cross-Dock Transfer',
      image: '/Preview Images/cross-dock-transfer.png',
      items: ['Inbound Manifest', 'Barcode Labels', 'Dock Door Tags'],
      instructions: 'Scan inbound freight, reconcile against manifest, relabel by outbound lane, and move freight directly to departure staging.',
      equipment: ['RF Scanner', 'Pallet Jack', 'Dock Leveler'],
      healthTags: ['Load Planning', 'Documentation']
    },
    {
      id: '3',
      title: 'Hazmat Drum Handling',
      image: '/Preview Images/hazmat-drum-handling.png',
      items: ['Hazmat Placards', 'Absorbent Pads', 'Drum Seals', 'BOL Forms'],
      instructions: 'Confirm UN markings, apply placards, inspect seals, and complete hazmat documentation before loading into designated trailer zone.',
      equipment: ['Drum Dolly', 'Spill Kit', 'PPE Kit'],
      healthTags: ['Hazmat', 'Safety', 'DOT Compliance']
    },
    {
      id: '4',
      title: 'Reefer Pre-Trip Setup',
      image: '/Preview Images/reefer-pre-trip-setup.png',
      items: ['Temp Logger', 'Reefer Fuel', 'Seal Tags'],
      instructions: 'Pre-cool trailer to required setpoint, verify logger calibration, and secure seal tags before loading temperature-sensitive freight.',
      equipment: ['Reefer Unit', 'Thermometer Probe', 'Forklift'],
      healthTags: ['Temperature Control', 'Documentation']
    },
    {
      id: '5',
      title: 'Parcel Sort and Lane Build',
      image: '/Preview Images/parcel-sort-lane-build.png',
      items: ['Parcels', 'Barcode Labels', 'Sorting Totes'],
      instructions: 'Scan each parcel, assign to route lane, and build outbound totes by delivery zone while flagging exception codes.',
      equipment: ['Scanner', 'Conveyor', 'Rolling Cart'],
      healthTags: ['Load Planning', 'Documentation']
    },
    {
      id: '6',
      title: 'Flatbed Securement Check',
      image: '/Preview Images/flatbed-securement-check.png',
      items: ['Ratchet Straps', 'Corner Protectors', 'Load Bars'],
      instructions: 'Distribute weight across axles, apply tie-downs at required intervals, and record securement inspection in dispatch notes.',
      equipment: ['Forklift', 'Strap Winder', 'Load Gauge'],
      healthTags: ['Safety', 'DOT Compliance', 'Load Planning']
    },
    {
      id: '7',
      title: 'Warehouse Putaway Cycle',
      image: '/Preview Images/warehouse-putaway-cycle.png',
      items: ['Inbound Pallets', 'Rack Labels', 'Bin Map'],
      instructions: 'Receive scans at dock, validate SKU and quantity, then put away inventory to mapped bin locations for replenishment accuracy.',
      equipment: ['Reach Truck', 'RF Scanner', 'Safety Harness'],
      healthTags: ['Documentation', 'Safety']
    },
    {
      id: '8',
      title: 'Outbound Wave Picking',
      image: '/Preview Images/outbound-wave-picking.png',
      items: ['Pick List', 'Shipping Cartons', 'Packing Slip'],
      instructions: 'Release wave by cut-off time, pick by optimized path, verify quantities, and pack with slips for outbound dock handoff.',
      equipment: ['Cart', 'Scanner', 'Label Printer'],
      healthTags: ['Load Planning', 'Documentation']
    },
    {
      id: '9',
      title: 'Fuel and Fluid Audit',
      image: '/Preview Images/fuel-fluid-audit.png',
      items: ['DEF Fluid', 'Fuel Receipts', 'Inspection Log'],
      instructions: 'Validate fuel levels and DEF inventory, reconcile receipts, and log variances for fleet maintenance follow-up.',
      equipment: ['Fleet Tablet', 'Dip Gauge', 'Safety Gloves'],
      healthTags: ['Safety', 'Documentation']
    },
    {
      id: '10',
      title: 'BOL Documentation Packet',
      image: '/Preview Images/bol-documentation-packet.png',
      items: ['BOL Forms', 'POD Sheets', 'Carrier Rate Confirmation'],
      instructions: 'Assemble shipping packet, validate shipper/consignee details, and confirm signatures before trailer release.',
      equipment: ['Printer', 'Clipboards', 'Scanner'],
      healthTags: ['Documentation', 'Freight Class']
    },
    {
      id: '11',
      title: 'Yard Check-In and Dock Assignment',
      image: '/Preview Images/yard-checkin-dock-assignment.png',
      items: ['Driver IDs', 'Gate Passes', 'Dock Schedule'],
      instructions: 'Check driver credentials at gate, assign dock doors by load priority, and update yard board for live visibility.',
      equipment: ['Yard Management Tablet', 'Radio', 'Dock Light System'],
      healthTags: ['Load Planning', 'Safety']
    },
    {
      id: '12',
      title: 'Return Freight Processing',
      image: '/Preview Images/return-freight-processing.png',
      items: ['Return Labels', 'Inspection Checklist', 'Disposition Form'],
      instructions: 'Receive return freight, inspect condition, classify disposition, and route to restock, repair, or recycle areas.',
      equipment: ['Inspection Bench', 'Scanner', 'Pallet Jack'],
      healthTags: ['Documentation', 'Safety']
    }
  ];

  const allRoutes = [...logisticsRoutes];

  const DIETARY_TAGS = [
    'Safety',
    'DOT Compliance',
    'Load Planning',
    'Documentation',
    'Freight Class',
    'Temperature Control',
    'Hazmat'
  ];

  const findMatchingRoutes = (userItems: string[]) => {
    const userItemSet = new Set(userItems.map(ing => ing.toLowerCase()));
    
    const routesWithScores = allRoutes.map(route => {
      const matchingItems = route.items.filter(ing => 
        userItemSet.has(ing.toLowerCase())
      );
      
      // Calculate match score (percentage of route items that match)
      const matchScore = (matchingItems.length / route.items.length) * 100;
      
      return {
        route,
        matchScore,
        matchingItems
      };
    });
    
    // Sort by match score (highest first)
    return routesWithScores.sort((a, b) => b.matchScore - a.matchScore);
  };

  const handleRouteMatcherOpen = () => {
    // Only show if user has added items
    if (items.length === 0) {
      alert('Please add some logistics items to your dock inventory first!');
      return;
    }
    
    const userItems = items.map(ing => ing.name);
    const matched = findMatchingRoutes(userItems);
    setMatchedRoutes(matched);
    setCurrentRouteIndex(0);
    setShowRouteMatcher(true);
  };

  const handleLike = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      handleSkip();
    }, 500);
  };

  const handleSkip = () => {
    setCurrentRouteIndex(prev => 
      prev < matchedRoutes.length - 1 ? prev + 1 : 0
    );
  };

  const handleCookMe = () => {
    window.location.href = 'https://global-mvp123-porkchop.us.wristband.dev/signup';
  };

  const addItem = () => {
    if (input.trim()) {
      setItems(prev => [...prev, { name: input.trim(), category }]);
      setInput('');
    }
  };

  const filteredItems = items.filter(ing => 
    ing.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const routeImages = [
    'ltl-palletized-shipment.png',
    'cross-dock-transfer.png',
    'hazmat-drum-handling.png',
    'reefer-pre-trip-setup.png',
    'parcel-sort-lane-build.png',
    'flatbed-securement-check.png',
    'warehouse-putaway-cycle.png',
    'outbound-wave-picking.png',
    'fuel-fluid-audit.png',
    'bol-documentation-packet.png',
    'yard-checkin-dock-assignment.png',
    'return-freight-processing.png'
  ];

  const sampleRoutes = [...logisticsRoutes];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {showWelcomeTooltip && (
        <div className="fixed top-[35%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-maineBlue text-white p-4 rounded-lg shadow-lg z-[60] max-w-xs w-[85%] mx-auto text-center">
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowWelcomeTooltip(false);
              }}
              className="absolute -top-3 -right-3 bg-lobsterRed text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700"
              aria-label="Close tooltip"
            >
              ✕
            </button>
            <h3 className="font-retro text-lg mb-2">Your PorkChop Preview!</h3>
            <p className="text-sm mb-2">This is our My Dock Module (1 of 5).</p>
            <ul className="text-xs space-y-1 list-disc pl-4 text-left inline-block">
              <li><span className="font-semibold">Scan Dock</span> - Scans your cargo, works in app!</li>
              <li>Click the <span className="font-semibold">Route Matcher</span> Builds Routes!</li>
              <li>Add, sort and search your digital inventory.</li>
            </ul>
            <p className="text-xs mt-2 italic">Feel free to hit <span className="font-semibold">Full Demo</span> to see everything in action.</p>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-maineBlue" />
        </div>
      )}
      <div className="bg-weatheredWhite border-4 border-black rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-600 hover:text-gray-800 focus:outline-none"
          aria-label="Close modal"
        >
          &times;
        </button>
        <div className="flex items-center justify-center mb-2">
          <span className="text-5xl mr-2">🐟</span>
          <h1 className="text-3xl font-retro text-maineBlue mb-0">My Dock</h1>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <input
            type="file"
            id="scan-dock-file"
            className="hidden"
            accept="image/*"
            onChange={() => {}}
          />
          <button
            className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors w-full sm:w-auto max-w-xs flex items-center justify-center gap-2"
            onClick={() => alert('Functionality available in app. Please try again later.')}
          >
            Scan Dock
          </button>
          
          <button
            className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors w-full sm:w-auto max-w-xs"
            onClick={handleRouteMatcherOpen}
            disabled={matcherLoading}
          >
            {matcherLoading ? 'Loading...' : 'Route Matcher'}
          </button>
        </div>

        {/* Digital Inventory Section */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-retro text-maineBlue flex items-center gap-2">
            <span role="img" aria-label="anchor">⚓</span> Digital Inventory
          </h3>
          {items.length > 0 && (
            <button
              className="text-xs text-lobsterRed underline hover:text-maineBlue"
              onClick={() => setItems([])}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Add Item Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
          {/* Search inventory input */}
          <input
            type="text"
            className="border px-3 py-2 rounded w-full sm:w-1/3"
            placeholder="Search inventory..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            style={{ minWidth: 120 }}
          />
          {/* Add item input */}
          <input
            type="text"
            className="border px-3 py-2 rounded w-full sm:w-1/3"
            placeholder="Add an item..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
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
            className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors"
            onClick={addItem}
          >
            Add
          </button>
        </div>

        {/* Inventory Display */}
        <div className="bg-gradient-to-br from-yellow-100 to-sand border-4 border-yellow-900 rounded-2xl shadow-lg p-4 relative overflow-hidden">
          {/* Rope border accent */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <svg width="100%" height="100%" className="absolute top-0 left-0" style={{zIndex:0}}>
              <rect x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="20" fill="none" stroke="#d2b48c" strokeWidth="4" strokeDasharray="8,4" />
            </svg>
          </div>
          
          {filteredItems.length === 0 ? (
            <div className="text-gray-500 italic text-center py-8 relative z-10">
              No matching items in your digital inventory!
            </div>
          ) : (
            <div className="flex flex-col gap-4 relative z-10">
              {[0,1,2,3,4,5].map(shelfIdx => {
                const shelfItems = filteredItems.slice(shelfIdx*3, (shelfIdx+1)*3);
                if (shelfItems.length === 0) return null;
                return (
                  <div key={shelfIdx} className="flex justify-around items-end border-b-4 border-yellow-900 pb-3 last:border-b-0">
                    {shelfItems.map((ing, idx) => (
                      <div key={`${shelfIdx}-${idx}`} className="flex flex-col items-center mx-2">
                        {/* Jar look */}
                        <div className="w-16 h-20 bg-weatheredWhite border-2 border-yellow-700 rounded-b-lg rounded-t-md shadow relative flex flex-col items-center justify-center">
                          <div className="w-12 h-3 bg-yellow-900 rounded-t-md absolute -top-3 left-1/2 -translate-x-1/2"></div>
                          <span className="text-[10px] text-yellow-900 bg-sand px-1 rounded-sm font-medium mb-1">
                            {ing.category}
                          </span>
                          <span className="text-xs font-semibold text-maineBlue break-words text-center px-1">
                            {ing.name}
                          </span>
                        </div>
                        <button
                          className="mt-1 text-xs text-lobsterRed hover:text-maineBlue font-bold"
                          onClick={() => {
                            setItems(items.filter(i => i !== ing));
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
      {showRouteMatcher && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-weatheredWhite rounded-lg shadow-lg p-6 max-w-xl w-full relative">
            <button 
              className="absolute top-2 right-2 text-lobsterRed font-bold text-xl" 
              onClick={() => setShowRouteMatcher(false)}
            >
              ✕
            </button>
            <h2 className="font-retro text-2xl mb-2 text-center">Route Matcher</h2>
            
            <div className="flex flex-col items-center">
              <div className="bg-sand rounded-xl shadow-lg p-4 w-full max-w-md mb-4 relative">
                <img 
                  src={sampleRoutes[currentRouteIndex].image} 
                  alt={sampleRoutes[currentRouteIndex].title} 
                  className="w-full h-48 object-cover rounded mb-2" 
                />
                <h3 className="font-retro text-xl mb-3 text-center">
                  {sampleRoutes[currentRouteIndex].title}
                </h3>
                
                <div className="flex flex-wrap gap-1 mb-3 justify-center">
                  {DIETARY_TAGS.map(tag => {
                    const isMatch = sampleRoutes[currentRouteIndex].healthTags?.includes(tag);
                    return (
                      <span 
                        key={tag}
                        className={`px-2 py-1 rounded-full text-xs ${
                          isMatch ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-600 mb-2 text-center">
                  <span className="font-bold">Items:</span> {sampleRoutes[currentRouteIndex].items.join(', ')}
                </div>
                {sampleRoutes[currentRouteIndex].equipment && sampleRoutes[currentRouteIndex].equipment.length > 0 && (
                  <div className="text-xs text-gray-600 mb-2 text-center">
                    <span className="font-bold">Equipment:</span> {sampleRoutes[currentRouteIndex].equipment.join(', ')}
                  </div>
                )}
              </div>
              
              <div className="flex gap-8 mt-2">
                <button 
                  className="bg-lobsterRed text-weatheredWhite px-6 py-2 rounded-full shadow hover:bg-maineBlue hover:text-seafoam text-xl font-bold" 
                  onClick={handleSkip}
                >
                  ✕
                </button>
                <button 
                  className="bg-seafoam text-maineBlue px-6 py-2 rounded-full shadow hover:bg-maineBlue hover:text-seafoam text-xl font-bold" 
                  onClick={handleLike}
                  disabled={isSaving}
                >
                  {isSaving ? '...' : '♥'}
                </button>
                <button 
                  className="bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue text-xl font-bold" 
                  onClick={handleCookMe}
                >
                  Run It
                </button>
              </div>
              
              <div className="text-xs mt-4 text-center text-gray-500">
                Swipe through AI-powered routes based on your inventory!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRunModal;

