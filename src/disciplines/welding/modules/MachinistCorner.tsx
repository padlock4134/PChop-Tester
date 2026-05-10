import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../components/BenchFreddieContext';
import { fetchSpecBook } from './specbookSupabase';
import SpecBookImportModal from '../components/SpecBookImportModal';
import LocalToolingModal from '../components/LocalToolingModal';
import BuildPartModal from '../components/BuildPartModal';
import { useProjectContext } from '../components/PartContext';
import { ProjectCard } from '../components/PartMatcherModal';
import { useSupabase } from '../components/SupabaseProvider';
import GlobalTestBench from '../components/GlobalTestBench';

const WeldersHub = () => {
  const { t } = useTranslation();
  const { updateContext } = useFreddieContext();
  const { projects, setProjects } = useProjectContext();
  const { user } = useSupabase();
  
  // Showcase project state
  const [showcaseProject, setShowcaseProject] = useState<any>(null);
  const [specbookModalOpen, setSpecbookModalOpen] = useState(false);
  
  // Welding quotes rotation (52 quotes for weekly rotation)
  const weldingQuotes = [
    // Lincoln Electric / General Welding Wisdom (11)
    "A good weld starts with good preparation.",
    "The bead tells the story — learn to read it.",
    "Safety isn't a shortcut you can afford to skip.",
    "Practice doesn't make perfect; perfect practice makes perfect welds.",
    "Measure twice, cut once, weld right the first time.",
    "A clean joint is half the weld.",
    "Consistency in technique builds consistency in results.",
    "Every welder was once a beginner who refused to quit.",
    "The best welders never stop learning new processes.",
    "Respect the arc — it will teach you if you let it.",
    "Fit-up is everything. If the joint isn't right, the weld won't be either.",
    
    // Fabrication & Shop Wisdom (11)
    "In fabrication, precision is the difference between scrap and product.",
    "A grinder and paint make a welder what he ain't — but quality work stands on its own.",
    "The shop floor is where theory meets reality.",
    "Good fabricators think three steps ahead.",
    "Blueprints are the language of the trade — learn to speak it fluently.",
    "Every burn, every spark, every bead is a lesson.",
    "Heat control separates a welder from a torch holder.",
    "Your PPE is your lifeline. Wear it every time.",
    "The difference between a tack and a weld is commitment.",
    "Code work demands discipline; discipline builds careers.",
    "A skilled welder can join any two metals — given the right process.",
    
    // Pipe Welding & Structural (10)
    "Walking the cup is an art form that takes years to master.",
    "Root, fill, cap — each pass matters as much as the last.",
    "Pipe welders see the world from every angle.",
    "Structural integrity depends on the integrity of the welder.",
    "X-ray doesn't lie — put your best work under the lens.",
    "Overhead welding builds character and skill simultaneously.",
    "A 6G certification opens doors that nothing else can.",
    "In pipeline work, every weld is a test of skill and nerve.",
    "The hardest positions produce the best welders.",
    "Purge your pipes and purge your doubts — precision wins.",
    
    // Career & Mindset (10)
    "Welding is one of the few trades where your work outlives you.",
    "Certifications prove competence; craftsmanship proves passion.",
    "The demand for skilled welders never goes away.",
    "A trade skill is something no one can take from you.",
    "Mentorship in the trades is how knowledge survives.",
    "Your first year welding teaches you the basics; your tenth teaches you the nuance.",
    "The torch doesn't care about your bad day — focus or walk away.",
    "Every great structure started with a welder and a plan.",
    "AWS codes exist to protect lives — take them seriously.",
    "The best investment a welder makes is in their own training.",
    
    // Safety & Professionalism (10)
    "No weld is worth your eyesight — always wear your hood.",
    "Fume extraction isn't optional; your lungs don't regenerate.",
    "A professional welder leaves a clean workspace.",
    "Inspect your own work before anyone else does.",
    "The mark of a journeyman is knowing when to slow down.",
    "Quality control starts at the welder's hands.",
    "If you're not willing to grind it out, weld it right the first time.",
    "Patience with preheat saves money on repairs.",
    "A true craftsman takes pride in every inch of weld.",
    "The arc is your teacher, the puddle is your canvas."
  ];
  
  const weldingNames = [
    // Lincoln Electric / General (11)
    "Shop Proverb", "Shop Proverb", "Shop Proverb", "Shop Proverb", "Shop Proverb", "Shop Proverb", "Shop Proverb", "Shop Proverb", "Shop Proverb", "Shop Proverb", "Shop Proverb",
    // Fabrication (11)
    "Fabricator's Creed", "Fabricator's Creed", "Fabricator's Creed", "Fabricator's Creed", "Fabricator's Creed", "Fabricator's Creed", "Fabricator's Creed", "Fabricator's Creed", "Fabricator's Creed", "Fabricator's Creed", "Fabricator's Creed",
    // Pipe & Structural (10)
    "Pipe Welder's Code", "Pipe Welder's Code", "Pipe Welder's Code", "Pipe Welder's Code", "Pipe Welder's Code", "Pipe Welder's Code", "Pipe Welder's Code", "Pipe Welder's Code", "Pipe Welder's Code", "Pipe Welder's Code",
    // Career & Mindset (10)
    "Welder's Wisdom", "Welder's Wisdom", "Welder's Wisdom", "Welder's Wisdom", "Welder's Wisdom", "Welder's Wisdom", "Welder's Wisdom", "Welder's Wisdom", "Welder's Wisdom", "Welder's Wisdom",
    // Safety & Professionalism (10)
    "Safety First", "Safety First", "Safety First", "Safety First", "Safety First", "Safety First", "Safety First", "Safety First", "Safety First", "Safety First"
  ];
  
  // Get current week of year (0-51) to rotate through 52 quotes
  const getCurrentWeekQuote = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.floor(diff / oneWeek) % 52;
    return {
      quote: weldingQuotes[weekNumber],
      name: weldingNames[weekNumber]
    };
  };
  
  const currentQuote = getCurrentWeekQuote();
  const [localMarketsModalOpen, setLocalMarketsModalOpen] = useState(false);
  const [buildMenuModalOpen, setBuildMenuModalOpen] = useState(false);
  const [selectedMenuProjects, setSelectedMenuProjects] = useState<ProjectCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState<'corner' | 'lab'>('corner');

  useEffect(() => {
    updateContext({ page: 'WeldersHub' });
    
    // Load projects from spec book when Machinist's Corner loads
    const loadProjects = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const savedProjects = await fetchSpecBook(user.id);
        setProjects(savedProjects || []);
      } catch (err) {
        console.error('Error loading spec book projects:', err);
        // Initialize with empty array if there's an error
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjects();
  }, [updateContext, setProjects, user?.id]);

  // Open modal for My Spec Book import
  const importFromSpecBook = () => {
    if (!user) {
      alert(t('machinistCorner.pleaseSignIn'));
      return;
    }
    setSpecbookModalOpen(true);
  };

  // Handler for modal import - select a project to showcase
  const handleSpecBookImport = async (selectedProject: any) => {
    console.log('Importing project:', selectedProject);
    
    if (!selectedProject) {
      console.error('No project selected');
      alert(t('machinistCorner.errorNoProject'));
      return;
    }

    try {
      // Set the selected project as the showcase project
      setShowcaseProject(selectedProject);
      
      alert(t('machinistCorner.projectSetToShowcase').replace('{title}', selectedProject.title));
      
    } catch (error) {
      console.error('Error importing project:', error);
      alert(t('machinistCorner.failedToImport'));
    } finally {
      setSpecbookModalOpen(false);
    }
  };

  return (
    <>
      <BuildPartModal
        open={buildMenuModalOpen}
        onClose={() => setBuildMenuModalOpen(false)}
        onFindMarkets={(projects: ProjectCard[]) => {
          setSelectedMenuProjects(projects);
          setBuildMenuModalOpen(false);
          setLocalMarketsModalOpen(true);
        }}
      />
      
      <LocalToolingModal
        open={localMarketsModalOpen}
        onClose={() => setLocalMarketsModalOpen(false)}
        selectedProjects={selectedMenuProjects}
      />
      
      <div className="w-[90%] mx-auto mt-4 student-dashboard-height-lock">
        {/* Mobile Tab Bar - Only visible on mobile */}
        <div className="lg:hidden mb-4 flex gap-2 border-b-2 border-maineBlue">
          <button
            onClick={() => setActiveMobileTab('corner')}
            className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
              activeMobileTab === 'corner'
                ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ⚙️ {t('machinistCorner.title')}
          </button>
          <button
            onClick={() => setActiveMobileTab('lab')}
            className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
              activeMobileTab === 'lab'
                ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🧪 {t('machinistCorner.globalTestKitchenTab', { defaultValue: 'Global Weld Lab' })}
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 lg:h-full">
          {/* Main Content - Chef's Corner Tab */}
          <div className={`lg:w-2/3 lg:h-full bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue ${
            activeMobileTab === 'corner' ? 'block' : 'hidden lg:block'
          }`}>
            {/* Chef's Corner header - moved back inside the module */}
            <div className="flex items-center justify-center mb-4">
              <span className="text-5xl mr-2">⚙️</span>
              <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('machinistCorner.title')}</h1>
            </div>
            
            {/* Separation line */}
            <hr className="border-t-2 border-maineBlue mb-6" />
            <div className="w-full mx-auto">
              {/* Shopping List - now at the top */}
              <section className="mb-8">
                <div className="bg-sand p-4 rounded-lg border border-black">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      {t('machinistCorner.showcaseProject')}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBuildMenuModalOpen(true)}
                        className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black"
                      >
                        📋 {t('machinistCorner.buildMenu')}
                      </button>
                      <button 
                        onClick={importFromSpecBook} 
                        className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-gray-300"
                        disabled={isLoading}
                      >
                        {isLoading ? t('machinistCorner.loading') : t('machinistCorner.importFromSpecbook')}
                      </button>
                    </div>
                  </div>
                  <SpecBookImportModal
                    open={specbookModalOpen}
                    onClose={() => setSpecbookModalOpen(false)}
                    onImport={handleSpecBookImport}
                    existingIngredients={[]}
                  />
                  {showcaseProject ? (
                    <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-black overflow-hidden w-full min-h-[350px] mt-4 mx-auto relative">
                      <button
                        onClick={() => setShowcaseProject(null)}
                        className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-full transition-colors z-10"
                        title={t('machinistCorner.removeShowcaseRecipe')}
                      >
                        <span className="text-red-500 font-bold text-lg">✕</span>
                      </button>
                      {/* Left Page */}
                      <div className="flex-1 p-6 bg-weatheredWhite border-r border-gray-200 flex flex-col">
                        {showcaseProject.image && (
                          <img
                            src={showcaseProject.image}
                            alt={showcaseProject.title}
                            className="rounded-lg w-full h-32 object-cover mb-4"
                            style={{ objectFit: 'cover' }}
                          />
                        )}
                        <h3 className="font-bold text-xl mb-1 text-maineBlue">{showcaseProject.title}</h3>
                        <div className="font-semibold mb-1 mt-2">{t('machinistCorner.ingredients')}</div>
                        <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                          {showcaseProject.ingredients?.length ? (
                            showcaseProject.ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)
                          ) : (
                            <li className="italic text-gray-400">{t('machinistCorner.noIngredientsListed')}</li>
                          )}
                        </ul>
                      </div>
                      {/* Right Page */}
                      <div className="flex-1 p-6 bg-white flex flex-col">
                        <h3 className="font-bold text-xl mb-2 text-maineBlue">{t('machinistCorner.instructions')}</h3>
                        <div className="text-gray-700 whitespace-pre-line text-[15px] leading-7 flex-1">
                          {showcaseProject.instructions || (
                            <span className="italic text-gray-400">{t('machinistCorner.noInstructionsProvided')}</span>
                          )}
                        </div>
                        {/* Equipment Section */}
                        {showcaseProject.equipment && showcaseProject.equipment.length > 0 && (
                          <>
                            <div className="font-semibold mt-4 mb-1">{t('machinistCorner.equipmentNeeded')}</div>
                            <ul className="list-disc list-inside text-[15px] leading-6 text-gray-700 mb-2">
                              {showcaseProject.equipment.map((eq: string, i: number) => (
                                <li key={i}>{eq}</li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-gray-400 italic text-center">
                      {t('machinistCorner.noRecipeSelected')}
                    </div>
                  )}
                </div>
              </section>

              {/* Welding Quote of the Week */}
              <p className="text-center text-gray-600 italic mb-6">
                "{currentQuote.quote}" — {currentQuote.name}
              </p>


            </div>
          {/* Desktop Layout - Markets Directory */}
          <div className="hidden lg:block">
            <div className="mb-6 mt-8">
              {/* Market content can be added here if needed */}
            </div>
          </div>

        </div>

        {/* Global Test Lab Tab - Mobile Only */}
        <div className={`lg:hidden ${
          activeMobileTab === 'lab' ? 'block' : 'hidden'
        }`}>
          <GlobalTestBench showcaseProject={showcaseProject} />
        </div>
        
        {/* Right Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:w-1/3 lg:h-full space-y-6">
          <GlobalTestBench showcaseProject={showcaseProject} />
        </div>
      </div>
    </div>
    </>
  );
};

export default WeldersHub;

