import React, { useState } from 'react';

interface TestRunModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestRunModal: React.FC<TestRunModalProps> = ({ isOpen, onClose }) => {
  const CATEGORIES = [
    "Filler Metal",
    "Base Metal",
    "Shielding Gas",
    "Electrode",
    "Flux",
    "Consumable",
    "Abrasive",
    "Safety/PPE",
    "Tooling",
    "Other"
  ];

  const [input, setInput] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [filterText, setFilterText] = useState('');
  const [ingredients, setIngredients] = useState([
    { name: 'ER70S-6 Wire', category: 'Filler Metal' },
    { name: 'A36 Mild Steel', category: 'Base Metal' },
    { name: '75/25 Ar/CO2', category: 'Shielding Gas' },
    { name: '7018 Rod', category: 'Electrode'},
    { name: 'Grinding Disc', category: 'Abrasive'}
  ]);
  const [scanLoading, setScanLoading] = useState(false);
  const [matcherOpen, setMatcherOpen] = useState(false);
  const [matcherLoading, setMatcherLoading] = useState(false);
  const [showProjectMatcher, setShowProjectMatcher] = useState(false);
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(true);
  const [matchedProjects, setMatchedProjects] = useState<Array<{
    recipe: any;
    matchScore: number;
    matchingIngredients: string[];
  }>>([]);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const allProjects = [
    {
      id: '1',
      title: 'Flat Butt Joint (SMAW)',
      image: '',
      ingredients: ['A36 Mild Steel', '7018 Rod', 'Grinding Disc', 'Wire Brush'],
      instructions: 'Bevel edges to 30°. Tack weld at both ends. Run root pass with 7018 at 1/8" gap. Fill and cap with weave pattern. Grind and inspect.',
      equipment: ['SMAW Welder', 'Angle Grinder', 'C-Clamps', 'Welding Table'],
      healthTags: ['Safety', 'Joint Prep', 'Weld Quality']
    },
    {
      id: '2',
      title: 'T-Joint Fillet Weld (MIG)',
      image: '',
      ingredients: ['A36 Mild Steel', 'ER70S-6 Wire', '75/25 Ar/CO2', 'Anti-Spatter Spray'],
      instructions: 'Position plates at 90°. Tack both ends. Set wire feed speed and voltage. Run fillet welds on both sides. Check leg size with fillet gauge.',
      equipment: ['MIG Welder', 'Welding Table', 'Fillet Gauge', 'C-Clamps'],
      healthTags: ['Safety', 'Weld Quality', 'Heat Control']
    },
    {
      id: '3',
      title: 'Lap Joint (GMAW)',
      image: '',
      ingredients: ['A36 Mild Steel', 'ER70S-6 Wire', '75/25 Ar/CO2', 'Grinding Disc'],
      instructions: 'Overlap plates by 1". Tack weld. Run continuous fillet weld along edge. Maintain consistent travel speed and gun angle.',
      equipment: ['MIG Welder', 'Angle Grinder', 'Welding Table'],
      healthTags: ['Weld Quality', 'Heat Control']
    },
    {
      id: '4',
      title: 'Pipe Root Pass (SMAW 6010)',
      image: '',
      ingredients: ['Schedule 40 Pipe', '6010 Rod', 'Wire Brush', 'Grinding Disc'],
      instructions: 'Bevel pipe ends. Set up root gap with landing. Tack in 4 spots. Run root pass with 6010 using whip-and-pause technique. Clean between passes.',
      equipment: ['SMAW Welder', 'Pipe Stands', 'Angle Grinder', 'Levels'],
      healthTags: ['Safety', 'Joint Prep', 'AWS Compliance']
    },
    {
      id: '5',
      title: 'Aluminum TIG Weld (GTAW)',
      image: '',
      ingredients: ['6061 Aluminum', '4043 Filler Rod', '100% Argon', 'Acetone', 'Stainless Brush'],
      instructions: 'Clean aluminum with acetone. Use stainless brush to remove oxide. Set AC balance and frequency. Add filler rod with dab technique. Maintain tight arc length.',
      equipment: ['TIG Welder', 'Welding Table', 'Gas Lens', 'Tungsten Sharpener'],
      healthTags: ['Weld Quality', 'Heat Control', 'Inspection']
    },
    {
      id: '6',
      title: 'Stainless Steel TIG (GTAW)',
      image: '',
      ingredients: ['304 Stainless Steel', '308L Filler Rod', '100% Argon', 'Acetone'],
      instructions: 'Clean joint thoroughly. Set DC electrode negative. Use gas lens for better coverage. Walk the cup technique for consistent bead. Purge back side if needed.',
      equipment: ['TIG Welder', 'Back Purge Kit', 'Gas Lens', 'Welding Table'],
      healthTags: ['Weld Quality', 'Heat Control', 'AWS Compliance']
    },
    {
      id: '7',
      title: 'Multi-Pass V-Groove (SMAW)',
      image: '',
      ingredients: ['A36 Mild Steel', '7018 Rod', '6010 Rod', 'Grinding Disc'],
      instructions: 'Bevel to 37.5°. Root pass with 6010. Hot pass with 7018. Fill passes with weave. Cap with consistent weave pattern. Clean between all passes.',
      equipment: ['SMAW Welder', 'Angle Grinder', 'C-Clamps', 'Chipping Hammer'],
      healthTags: ['Safety', 'Joint Prep', 'Weld Quality', 'Inspection']
    },
    {
      id: '8',
      title: 'Flux Core Overhead Position (FCAW)',
      image: '',
      ingredients: ['A36 Mild Steel', 'E71T-1 Wire', '75/25 Ar/CO2', 'Wire Brush'],
      instructions: 'Position plate overhead. Set voltage and wire feed for overhead. Use stringer beads. Control puddle with short arc length. Clean slag between passes.',
      equipment: ['MIG/FCAW Welder', 'Welding Table', 'Positioning Fixture'],
      healthTags: ['Safety', 'Weld Quality', 'Heat Control']
    }
  ];

  const SKILL_TAGS = [
    'Safety',
    'AWS Compliance',
    'Weld Quality',
    'Joint Prep',
    'Heat Control',
    'Inspection',
    'Pipe Welding',
    'Certification Ready'
  ];

  const findMatchingProjects = (userMaterials: string[]) => {
    const userMaterialSet = new Set(userMaterials.map(m => m.toLowerCase()));
    
    const projectsWithScores = allProjects.map(project => {
      const matchingIngredients = project.ingredients.filter(m => 
        userMaterialSet.has(m.toLowerCase())
      );
      
      // Calculate match score (percentage of project materials that match)
      const matchScore = (matchingIngredients.length / project.ingredients.length) * 100;
      
      return {
        recipe: project,
        matchScore,
        matchingIngredients
      };
    });
    
    // Sort by match score (highest first)
    return projectsWithScores.sort((a, b) => b.matchScore - a.matchScore);
  };

  const handleProjectMatcherOpen = () => {
    // Only show if user has added materials
    if (ingredients.length === 0) {
      alert('Please add some materials to your bench inventory first!');
      return;
    }
    
    const userMaterials = ingredients.map(ing => ing.name);
    const matched = findMatchingProjects(userMaterials);
    setMatchedProjects(matched);
    setCurrentProjectIndex(0);
    setShowProjectMatcher(true);
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
    setCurrentProjectIndex((prev: number) => 
      prev < matchedProjects.length - 1 ? prev + 1 : 0
    );
  };

  const handleRunIt = () => {
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

  // sampleProjects reuses allProjects for the matcher preview
  const sampleProjects = allProjects;

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
            <p className="text-sm mb-2">This is our My Torch Module (1 of 5).</p>
            <ul className="text-xs space-y-1 list-disc pl-4 text-left inline-block">
              <li><span className="font-semibold">Scan Bench</span> - Scans your materials, works in app!</li>
              <li>Click the <span className="font-semibold">Project Matcher</span> to find projects!</li>
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
          <span className="text-5xl mr-2">�</span>
          <h1 className="text-3xl font-retro text-maineBlue mb-0">My Torch</h1>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <input
            type="file"
            id="scan-bench-file"
            className="hidden"
            accept="image/*"
            onChange={() => {}}
          />
          <button
            className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors w-full sm:w-auto max-w-xs flex items-center justify-center gap-2"
            onClick={() => alert('Functionality available in app. Please try again later.')}
          >
            Scan Bench
          </button>
          
          <button
            className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors w-full sm:w-auto max-w-xs"
            onClick={handleProjectMatcherOpen}
            disabled={matcherLoading}
          >
            {matcherLoading ? 'Loading...' : 'Project Matcher'}
          </button>
        </div>

        {/* Digital Cupboard Section */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-retro text-maineBlue flex items-center gap-2">
            <span role="img" aria-label="wrench">🔧</span> Material Inventory
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
            placeholder="Add a material..."
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
              No matching materials in your inventory!
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
      {showProjectMatcher && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-weatheredWhite rounded-lg shadow-lg p-4 lg:p-6 max-w-xl w-full mx-4 max-h-[85vh] lg:max-h-[80vh] overflow-y-auto relative">
            <button 
              className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center text-lobsterRed font-bold text-xl" 
              onClick={() => setShowProjectMatcher(false)}
            >
              ✕
            </button>
            <h2 className="font-retro text-2xl mb-2 text-center">Project Matcher</h2>
            
            <div className="flex flex-col items-center">
              <div className="bg-sand rounded-xl shadow-lg p-4 w-full max-w-md mb-4 relative">
                {sampleProjects[currentProjectIndex].image && (
                  <img 
                    src={sampleProjects[currentProjectIndex].image} 
                    alt={sampleProjects[currentProjectIndex].title} 
                    className="w-full h-48 object-cover rounded mb-2" 
                  />
                )}
                <h3 className="font-retro text-xl mb-3 text-center">
                  {sampleProjects[currentProjectIndex].title}
                </h3>
                
                <div className="flex flex-wrap gap-1 mb-3 justify-center">
                  {SKILL_TAGS.map((tag: string) => {
                    const isMatch = sampleProjects[currentProjectIndex].healthTags?.includes(tag);
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
                  <span className="font-bold">Materials:</span> {sampleProjects[currentProjectIndex].ingredients.join(', ')}
                </div>
                {sampleProjects[currentProjectIndex].equipment && sampleProjects[currentProjectIndex].equipment.length > 0 && (
                  <div className="text-xs text-gray-600 mb-2 text-center">
                    <span className="font-bold">Equipment:</span> {sampleProjects[currentProjectIndex].equipment.join(', ')}
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
                  onClick={handleRunIt}
                >
                  Run It
                </button>
              </div>
              
              <div className="text-xs mt-4 text-center text-gray-500">
                Swipe through AI-powered projects based on your inventory!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRunModal;

