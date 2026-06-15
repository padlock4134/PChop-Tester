import React, { useState } from 'react';

interface TestRunModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestRunModal: React.FC<TestRunModalProps> = ({ isOpen, onClose }) => {
  const CATEGORIES = [
    "Refrigeration",
    "Airflow",
    "Electrical",
    "Controls",
    "Piping",
    "Safety",
    "Fasteners",
    "Consumables",
    "Test Equipment",
    "Other"
  ];

  const [input, setInput] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [filterText, setFilterText] = useState('');
  const [ingredients, setIngredients] = useState([
    { name: 'R-410A Refrigerant', category: 'Refrigeration' },
    { name: 'Contactor 40A', category: 'Electrical' },
    { name: 'TXV Valve', category: 'Refrigeration' },
    { name: 'Thermostat Wire', category: 'Controls'},
    { name: 'Copper Line Set', category: 'Piping'}
  ]);
  const [scanLoading, setScanLoading] = useState(false);
  const [matcherOpen, setMatcherOpen] = useState(false);
  const [matcherLoading, setMatcherLoading] = useState(false);
  const [showRecipeMatcher, setShowRecipeMatcher] = useState(false);
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(true);
  const [matchedRecipes, setMatchedRecipes] = useState<Array<{
    recipe: any;
    matchScore: number;
    matchingIngredients: string[];
  }>>([]);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const allRecipes = [
    {
      id: '1',
      title: 'Capacitor Replacement',
      image: '/placeholder.jpg',
      ingredients: ['Run Capacitor', 'Contactor 40A', 'Wire Nuts', 'Electrical Tape'],
      instructions: 'Disconnect power. Discharge old capacitor safely. Remove wiring noting terminal positions. Install new capacitor and reconnect wiring. Restore power and test.',
      equipment: ['Multimeter', 'Screwdriver Set', 'Needle-nose Pliers'],
      healthTags: ['Safety', 'Diagnostics']
    },
    {
      id: '2',
      title: 'Refrigerant Charge Check',
      image: '/placeholder.jpg',
      ingredients: ['R-410A Refrigerant', 'Refrigerant Hoses', 'Schrader Valve Caps'],
      instructions: 'Connect manifold gauges to service ports. Run system in cooling mode for 15 min. Measure superheat and subcooling. Compare to manufacturer specs. Adjust charge as needed.',
      equipment: ['Manifold Gauge Set', 'Temperature Clamps', 'Psychrometer'],
      healthTags: ['Precision', 'Safety']
    },
    {
      id: '3',
      title: 'Thermostat Wiring',
      image: '/placeholder.jpg',
      ingredients: ['Thermostat Wire', 'Smart Thermostat', 'Wire Nuts', 'Wall Anchors'],
      instructions: 'Turn off power. Remove old thermostat and label wires. Mount new thermostat base plate. Connect wires per wiring diagram. Attach thermostat and restore power. Configure settings.',
      equipment: ['Screwdriver Set', 'Wire Strippers', 'Level'],
      healthTags: ['Precision', 'Quality']
    },
    {
      id: '4',
      title: 'Condenser Coil Cleaning',
      image: '/placeholder.jpg',
      ingredients: ['Coil Cleaner', 'Garden Hose', 'Fin Comb'],
      instructions: 'Disconnect power. Remove debris from condenser housing. Apply coil cleaner and let sit per instructions. Rinse from inside out with garden hose. Straighten bent fins with fin comb.',
      equipment: ['Screwdriver Set', 'Garden Hose', 'Fin Comb'],
      healthTags: ['Efficiency', 'Quality']
    },
    {
      id: '5',
      title: 'Blower Motor Replacement',
      image: '/placeholder.jpg',
      ingredients: ['Blower Motor', 'Run Capacitor', 'Motor Mount Bolts'],
      instructions: 'Disconnect power. Remove blower assembly. Disconnect motor wiring and capacitor. Remove motor from housing. Install new motor, reconnect wiring and capacitor. Reinstall assembly.',
      equipment: ['Multimeter', 'Socket Set', 'Screwdriver Set'],
      healthTags: ['Safety', 'Diagnostics']
    },
    {
      id: '6',
      title: 'TXV Replacement',
      image: '/placeholder.jpg',
      ingredients: ['TXV Valve', 'R-410A Refrigerant', 'Nitrogen', 'Silver Brazing Alloy'],
      instructions: 'Recover refrigerant. Cut line set at TXV location. Clean and prepare copper ends. Braze new TXV in place with nitrogen flowing. Evacuate system. Weigh in refrigerant charge.',
      equipment: ['Recovery Machine', 'Torch Kit', 'Vacuum Pump', 'Scale'],
      healthTags: ['Safety', 'Precision']
    },
    {
      id: '7',
      title: 'Filter Drier Replacement',
      image: '/placeholder.jpg',
      ingredients: ['Filter Drier', 'Silver Brazing Alloy', 'Nitrogen'],
      instructions: 'Recover refrigerant. Cut out old filter drier. Clean copper ends. Braze new drier in correct flow direction with nitrogen purge. Evacuate and recharge system.',
      equipment: ['Recovery Machine', 'Torch Kit', 'Vacuum Pump'],
      healthTags: ['Safety', 'Quality']
    },
    {
      id: '8',
      title: 'Duct Leakage Test',
      image: '/placeholder.jpg',
      ingredients: ['Mastic Sealant', 'Foil Tape', 'Duct Board'],
      instructions: 'Seal all registers and returns. Connect duct blaster to main trunk. Pressurize duct system to 25 Pa. Record total CFM leakage. Seal leaks with mastic. Retest.',
      equipment: ['Duct Blaster', 'Manometer', 'Smoke Pen'],
      healthTags: ['Efficiency', 'Diagnostics']
    },
    {
      id: '9',
      title: 'Ignitor Replacement',
      image: '/placeholder.jpg',
      ingredients: ['Hot Surface Ignitor', 'Mounting Screws'],
      instructions: 'Turn off power and gas. Remove furnace access panel. Disconnect ignitor wiring. Remove mounting screws and old ignitor. Install new ignitor without touching element. Reconnect and test.',
      equipment: ['Screwdriver Set', 'Multimeter'],
      healthTags: ['Safety', 'Precision']
    },
    {
      id: '10',
      title: 'Compressor Contactor Swap',
      image: '/placeholder.jpg',
      ingredients: ['Contactor 40A', 'Wire Nuts'],
      instructions: 'Disconnect power. Label all wires on old contactor. Remove mounting screws. Install new contactor. Reconnect wires per labels. Restore power and test operation.',
      equipment: ['Multimeter', 'Screwdriver Set', 'Needle-nose Pliers'],
      healthTags: ['Safety', 'Diagnostics']
    }
  ];

  const DIETARY_TAGS = [
    'Safety',
    'Precision',
    'Efficiency',
    'Quality',
    'Compliance',
    'Diagnostics',
    'Documentation',
    'Maintenance'
  ];

  const findMatchingRecipes = (userIngredients: string[]) => {
    const userIngredientSet = new Set(userIngredients.map(ing => ing.toLowerCase()));
    
    const recipesWithScores = allRecipes.map(recipe => {
      const matchingIngredients = recipe.ingredients.filter(ing => 
        userIngredientSet.has(ing.toLowerCase())
      );
      
      // Calculate match score (percentage of recipe ingredients that match)
      const matchScore = (matchingIngredients.length / recipe.ingredients.length) * 100;
      
      return {
        recipe,
        matchScore,
        matchingIngredients
      };
    });
    
    // Sort by match score (highest first)
    return recipesWithScores.sort((a, b) => b.matchScore - a.matchScore);
  };

  const handleRecipeMatcherOpen = () => {
    // Only show if user has added ingredients
    if (ingredients.length === 0) {
      console.error('Please add some components to your shop inventory first!');
      return;
    }
    
    const userIngredients = ingredients.map(ing => ing.name);
    const matched = findMatchingRecipes(userIngredients);
    setMatchedRecipes(matched);
    setCurrentRecipeIndex(0);
    setShowRecipeMatcher(true);
  };

  const handleLike = () => {
    setIsSaving(false);
    handleSkip();
  };

  const handleSkip = () => {
    setCurrentRecipeIndex(prev => 
      prev < matchedRecipes.length - 1 ? prev + 1 : 0
    );
  };

  const handleCookMe = () => {
    window.location.href = 'https://global-mvp123-porkchop.us.wristband.dev/signup';
  };

  const addIngredient = () => {
    if (input.trim()) {
      setIngredients(prev => [...prev, { name: input.trim(), category }]);
      setInput('');
    }
  };

  const filteredIngredients = ingredients.filter(ing => 
    ing.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const recipeImages: string[] = [];

  // sampleRecipes reuses allRecipes for the preview card display
  const sampleRecipes = allRecipes;

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
            <p className="text-sm mb-2">This is our My Shop Module (1 of 5).</p>
            <ul className="text-xs space-y-1 list-disc pl-4 text-left inline-block">
              <li><span className="font-semibold">Scan Shop</span> - Scans your parts inventory!</li>
              <li>Click the <span className="font-semibold">System Matcher</span> to build service projects!</li>
              <li>Add, sort and search your digital inventory.</li>
            </ul>
            <p className="text-xs mt-2 italic">Feel free to hit <span className="font-semibold">Full Demo</span> to see everything in action.</p>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-maineBlue" />
        </div>
      )}
      <div className="bg-weatheredWhite border-4 border-black rounded-lg shadow-lg p-4 lg:p-6 max-w-2xl w-full mx-4 max-h-[85vh] lg:max-h-[80vh] overflow-y-auto relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-2xl text-gray-600 hover:text-gray-800 focus:outline-none"
          aria-label="Close modal"
        >
          &times;
        </button>
        <div className="flex items-center justify-center mb-2">
          <span className="text-5xl mr-2">🧰</span>
          <h1 className="text-3xl font-retro text-maineBlue mb-0">My Shop</h1>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <input
            type="file"
            id="scan-kitchen-file"
            className="hidden"
            accept="image/*"
            onChange={() => {}}
          />
          <button
            className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors w-full sm:w-auto max-w-xs flex items-center justify-center gap-2"
            onClick={() => console.log('Functionality available in app. Please try again later.')}
          >
            Scan Shop
          </button>
          
          <button
            className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors w-full sm:w-auto max-w-xs"
            onClick={handleRecipeMatcherOpen}
            disabled={matcherLoading}
          >
            {matcherLoading ? 'Loading...' : 'System Matcher'}
          </button>
        </div>

        {/* Digital Cupboard Section */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-retro text-maineBlue flex items-center gap-2">
            <span role="img" aria-label="toolbox">🧰</span> Shop Inventory
          </h3>
          {ingredients.length > 0 && (
            <button
              className="text-xs text-lobsterRed underline hover:text-maineBlue"
              onClick={() => setIngredients([])}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Add Ingredient Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
          {/* Search cupboard input */}
          <input
            type="text"
            className="border px-3 py-2 rounded w-full sm:w-1/3"
            placeholder="Search inventory..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            style={{ minWidth: 120 }}
          />
          {/* Add ingredient input */}
          <input
            type="text"
            className="border px-3 py-2 rounded w-full sm:w-1/3"
            placeholder="Add a component..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
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
            onClick={addIngredient}
          >
            Add
          </button>
        </div>

        {/* Cupboard Display */}
        <div className="bg-gradient-to-br from-yellow-100 to-sand border-4 border-yellow-900 rounded-2xl shadow-lg p-4 relative overflow-hidden">
          {/* Rope border accent */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <svg width="100%" height="100%" className="absolute top-0 left-0" style={{zIndex:0}}>
              <rect x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="20" fill="none" stroke="#d2b48c" strokeWidth="4" strokeDasharray="8,4" />
            </svg>
          </div>
          
          {filteredIngredients.length === 0 ? (
            <div className="text-gray-500 italic text-center py-8 relative z-10">
              No matching components in your shop inventory!
            </div>
          ) : (
            <div className="flex flex-col gap-4 relative z-10">
              {[0,1,2,3,4,5].map(shelfIdx => {
                const shelfItems = filteredIngredients.slice(shelfIdx*3, (shelfIdx+1)*3);
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
                            setIngredients(ingredients.filter(i => i !== ing));
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
      {showRecipeMatcher && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-weatheredWhite rounded-lg shadow-lg p-4 lg:p-6 max-w-xl w-full mx-4 max-h-[85vh] lg:max-h-[80vh] overflow-y-auto relative">
            <button 
              className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center text-lobsterRed font-bold text-xl" 
              onClick={() => setShowRecipeMatcher(false)}
            >
              ✕
            </button>
            <h2 className="font-retro text-2xl mb-2 text-center">System Matcher</h2>
            
            <div className="flex flex-col items-center">
              <div className="bg-sand rounded-xl shadow-lg p-4 w-full max-w-md mb-4 relative">
                <img 
                  src={sampleRecipes[currentRecipeIndex].image} 
                  alt={sampleRecipes[currentRecipeIndex].title} 
                  className="w-full h-48 object-cover rounded mb-2" 
                />
                <h3 className="font-retro text-xl mb-3 text-center">
                  {sampleRecipes[currentRecipeIndex].title}
                </h3>
                
                <div className="flex flex-wrap gap-1 mb-3 justify-center">
                  {DIETARY_TAGS.map(tag => {
                    const isMatch = sampleRecipes[currentRecipeIndex].healthTags?.includes(tag);
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
                  <span className="font-bold">Components:</span> {sampleRecipes[currentRecipeIndex].ingredients.join(', ')}
                </div>
                {sampleRecipes[currentRecipeIndex].equipment && sampleRecipes[currentRecipeIndex].equipment.length > 0 && (
                  <div className="text-xs text-gray-600 mb-2 text-center">
                    <span className="font-bold">Equipment:</span> {sampleRecipes[currentRecipeIndex].equipment.join(', ')}
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
                  Start Job
                </button>
              </div>
              
              <div className="text-xs mt-4 text-center text-gray-500">
                Swipe through AI-matched service projects based on your inventory!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRunModal;

