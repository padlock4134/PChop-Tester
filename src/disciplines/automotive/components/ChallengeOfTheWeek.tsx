import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useLevelProgressContext } from './NavBar';
import WeeklyChallengeRepairModal from './WeeklyChallengeRepairModal';
import type { RecipeCard } from './RepairMatcherModal';
import { getWeeklyChallengeRecipe } from '../api/anthropicChallenge';
import { getRecipeImage } from '../api/unsplash';
import { supabase } from '../api/supabaseClient';
import { isSessionValid } from '../api/userSession';
import { useSupabase } from './SupabaseProvider';

// Pool of weekly challenges
export const WEEKLY_CHALLENGES = [
  {
    title: 'Oil Change Champion',
    description: 'Complete an oil change service to earn bonus XP and the Oil Master Badge.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['oil','filter','drain plug'].includes(i)),
    reward: { xp: 100, badge: 'Oil Master' },
  },
  {
    title: 'Brake System Pro',
    description: 'Service a brake system for a chance at the Brake Legend badge.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['brake pad','rotor','caliper','brake fluid'].includes(i)),
    reward: { xp: 150, badge: 'Brake Legend' },
  },
  {
    title: 'Tire Technician',
    description: 'Complete three different tire services this week.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['tire','wheel','balance','rotation'].includes(i)),
    reward: { xp: 120, badge: 'Tire Tech' },
  },
  {
    title: 'Battery Boss',
    description: 'Service or replace a battery for bonus XP.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['battery','terminal','charging system'].includes(i)),
    reward: { xp: 90, badge: 'Battery Boss' },
  },
  {
    title: 'Filter Specialist',
    description: 'Replace an air filter, cabin filter, or fuel filter.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['air filter','cabin filter','fuel filter'].includes(i)),
    reward: { xp: 80, badge: 'Filter Pro' },
  },
  {
    title: 'Transmission Tuesday',
    description: 'Service any transmission system.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['transmission fluid','clutch','gear'].includes(i)),
    reward: { xp: 60, badge: 'Trans Titan' },
  },
  {
    title: 'Cooling System Star',
    description: 'Service a cooling system or radiator.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['coolant','radiator','thermostat','water pump'].includes(i)),
    reward: { xp: 75, badge: 'Cooling Star' },
  },
  {
    title: 'Spark Plug Specialist',
    description: 'Replace spark plugs or ignition components.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['spark plug','ignition coil','wire'].includes(i)),
    reward: { xp: 50, badge: 'Spark Pro' },
  },
  {
    title: 'Belt & Hose Hero',
    description: 'Replace a serpentine belt or hose.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['belt','hose','serpentine','timing'].includes(i)),
    reward: { xp: 80, badge: 'Belt Hero' },
  },
  {
    title: 'Suspension Savant',
    description: 'Service any suspension component.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['shock','strut','spring','control arm'].includes(i)),
    reward: { xp: 110, badge: 'Suspension Star' },
  },
  {
    title: 'Alignment Ace',
    description: 'Perform a wheel alignment.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['alignment','camber','toe','caster'].includes(i)),
    reward: { xp: 60, badge: 'Alignment Ace' },
  },
  {
    title: 'Exhaust Expert',
    description: 'Service an exhaust system component.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['muffler','catalytic converter','exhaust pipe','o2 sensor'].includes(i)),
    reward: { xp: 85, badge: 'Exhaust Expert' },
  },
  {
    title: 'Electrical Wizard',
    description: 'Diagnose or repair an electrical issue.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['fuse','relay','wiring','sensor','ecu'].includes(i)),
    reward: { xp: 100, badge: 'Electric Wizard' },
  },
  {
    title: 'Diagnostic Dynamo',
    description: 'Use a scan tool to diagnose a check engine light.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['scan tool','code reader','diagnostic','obd2'].includes(i)),
    reward: { xp: 90, badge: 'Diag Dynamo' },
  },
  {
    title: 'Wiper Wizard',
    description: 'Replace windshield wipers or service washer system.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['wiper blade','washer fluid','wiper motor'].includes(i)),
    reward: { xp: 70, badge: 'Wiper Wizard' },
  },
  {
    title: 'Headlight Hero',
    description: 'Replace headlight bulbs or service lighting system.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['headlight','bulb','led','hid'].includes(i)),
    reward: { xp: 60, badge: 'Light Master' },
  },
  {
    title: 'Fuel System Focus',
    description: 'Service fuel system components.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['fuel pump','fuel injector','fuel line','fuel filter'].includes(i)),
    reward: { xp: 80, badge: 'Fuel Pro' },
  },
  {
    title: 'AC Service Specialist',
    description: 'Service an air conditioning system.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['refrigerant','ac compressor','condenser','evaporator'].includes(i)),
    reward: { xp: 70, badge: 'AC Specialist' },
  },
  {
    title: 'Steering System Star',
    description: 'Service power steering or steering components.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['power steering','rack','pinion','tie rod'].includes(i)),
    reward: { xp: 90, badge: 'Steering Star' },
  },
  {
    title: 'Engine Rebuild Master',
    description: 'Complete major engine work or rebuild.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['piston','cylinder','gasket','crankshaft','camshaft'].includes(i)),
    reward: { xp: 110, badge: 'Engine Master' },
  },
  {
    title: 'Detailing Dynamo',
    description: 'Complete a full vehicle detail or cleaning.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['wax','polish','vacuum','shampoo','detail'].includes(i)),
    reward: { xp: 100, badge: 'Detail Star' },
  },
  {
    title: 'Differential Service',
    description: 'Service a differential or transfer case.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['differential','gear oil','transfer case','axle'].includes(i)),
    reward: { xp: 80, badge: 'Diff Dynamo' },
  },
  {
    title: 'Wheel Bearing Wizard',
    description: 'Replace or service wheel bearings.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['wheel bearing','hub','axle bearing'].includes(i)),
    reward: { xp: 70, badge: 'Bearing Boss' },
  },
  {
    title: 'Performance Upgrade',
    description: 'Install a performance part or upgrade.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['cold air intake','exhaust','turbo','supercharger','tune'].includes(i)),
    reward: { xp: 90, badge: 'Performance Pro' },
  },
  {
    title: 'Timing Belt/Chain',
    description: 'Replace a timing belt or timing chain.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['timing belt','timing chain','tensioner','water pump'].includes(i)),
    reward: { xp: 80, badge: 'Timing Tech' },
  },
  {
    title: 'Sensor Specialist',
    description: 'Replace or diagnose sensor issues.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['o2 sensor','maf sensor','map sensor','tps','crankshaft sensor'].includes(i)),
    reward: { xp: 75, badge: 'Sensor Savant' },
  },
  {
    title: 'Window & Door Service',
    description: 'Repair window regulators or door mechanisms.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['window regulator','door lock','window motor','handle'].includes(i)),
    reward: { xp: 60, badge: 'Window Wizard' },
  },
  {
    title: 'Hybrid/EV Specialist',
    description: 'Service a hybrid or electric vehicle component.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['hybrid battery','ev charger','inverter','electric motor'].includes(i)),
    reward: { xp: 100, badge: 'EV Expert' },
  },
  {
    title: 'Body Work Boss',
    description: 'Complete body repair or paint work.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['body filler','primer','paint','sanding','panel'].includes(i)),
    reward: { xp: 70, badge: 'Body Boss' },
  },
  {
    title: 'Rust Repair',
    description: 'Repair rust or corrosion damage.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['rust converter','body filler','welding','patch panel'].includes(i)),
    reward: { xp: 80, badge: 'Rust Warrior' },
  },
  {
    title: 'Welding Wizard',
    description: 'Complete a welding repair or fabrication.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['welding','mig','tig','stick','fabrication'].includes(i)),
    reward: { xp: 75, badge: 'Weld Wizard' },
  },
  {
    title: 'Turbo/Supercharger Service',
    description: 'Service or install forced induction.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['turbo','supercharger','intercooler','boost'].includes(i)),
    reward: { xp: 80, badge: 'Boost Boss' },
  },
  {
    title: 'Diesel Service',
    description: 'Service a diesel engine component.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['diesel','glow plug','dpf','def','injector'].includes(i)),
    reward: { xp: 90, badge: 'Diesel Pro' },
  },
  {
    title: '4WD/AWD Service',
    description: 'Service all-wheel or four-wheel drive system.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['transfer case','front differential','rear differential','driveshaft'].includes(i)),
    reward: { xp: 80, badge: '4WD Master' },
  },
  {
    title: 'Clutch Replacement',
    description: 'Replace a clutch assembly.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['clutch','pressure plate','flywheel','throw out bearing'].includes(i)),
    reward: { xp: 85, badge: 'Clutch King' },
  },
  {
    title: 'CV Axle Service',
    description: 'Replace CV axles or boots.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['cv axle','cv boot','axle shaft'].includes(i)),
    reward: { xp: 70, badge: 'CV Star' },
  },
  {
    title: 'Radiator Replacement',
    description: 'Replace a radiator or cooling system component.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['radiator','coolant','hose','fan'].includes(i)),
    reward: { xp: 80, badge: 'Radiator Pro' },
  },
  {
    title: 'Starter/Alternator',
    description: 'Replace starter motor or alternator.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['starter','alternator','charging system'].includes(i)),
    reward: { xp: 75, badge: 'Starter Star' },
  },
  {
    title: 'Gasket Replacement',
    description: 'Replace head gasket or valve cover gasket.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['head gasket','valve cover','gasket','sealant'].includes(i)),
    reward: { xp: 90, badge: 'Gasket Guru' },
  },
  {
    title: 'Fluid Flush',
    description: 'Perform a complete fluid flush service.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['flush','coolant','transmission','brake fluid','power steering'].includes(i)),
    reward: { xp: 60, badge: 'Flush Master' },
  },
  {
    title: 'Ignition System',
    description: 'Service ignition system components.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['distributor','coil pack','ignition module','spark'].includes(i)),
    reward: { xp: 70, badge: 'Ignition Expert' },
  },
  {
    title: 'Throttle Body Service',
    description: 'Clean or service throttle body.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['throttle body','idle','cleaner','intake'].includes(i)),
    reward: { xp: 60, badge: 'Throttle Pro' },
  },
  {
    title: 'PCV System',
    description: 'Service PCV valve or crankcase ventilation.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['pcv valve','breather','crankcase','ventilation'].includes(i)),
    reward: { xp: 70, badge: 'PCV Pro' },
  },
  {
    title: 'Cabin Comfort',
    description: 'Service HVAC or interior comfort systems.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['heater core','blower motor','blend door','hvac'].includes(i)),
    reward: { xp: 60, badge: 'Comfort King' },
  },
  {
    title: 'Undercarriage Service',
    description: 'Inspect and service undercarriage components.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['undercoating','rust protection','frame','subframe'].includes(i)),
    reward: { xp: 80, badge: 'Under Boss' },
  },
  {
    title: 'Classic Car Restoration',
    description: 'Work on a vintage or classic vehicle component.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['carburetor','points','distributor','classic','vintage'].includes(i)),
    reward: { xp: 90, badge: 'Classic Pro' },
  },
  {
    title: 'Quick Service',
    description: 'Complete a basic service using minimal parts.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.length <= 5,
    reward: { xp: 80, badge: 'Quick Tech' },
  },
];

// Helper to get the current week number (ISO week)
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1)/7);
}

// Get the current weekly challenge based on the current week number
function getCurrentWeeklyChallenge() {
  const now = new Date();
  const week = getWeekNumber(now);
  return WEEKLY_CHALLENGES[week % WEEKLY_CHALLENGES.length];
}

const ChallengeOfTheWeek: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const discipline = location.pathname.split('/').filter(Boolean)[0] || 'automotive';
  const ct = (key: string) => t(`challenge.disciplineCopy.${discipline}.${key}`, { defaultValue: t(`challenge.${key}`) });
  const [open, setOpen] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [modalRecipe, setModalRecipe] = useState<RecipeCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekNumber, setWeekNumber] = useState(getWeekNumber(new Date()));
  const [challenge, setChallenge] = useState(getCurrentWeeklyChallenge());
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const { refreshXP } = useLevelProgressContext();

  const { user } = useSupabase();

  // Fetch claim status for this user/week
  async function fetchClaimStatus() {
    const sessionValid = await isSessionValid();
    if (!sessionValid || !user) return;
    const { data } = await supabase
      .from('weekly_challenge_claims')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_number', weekNumber)
      .maybeSingle();
    setAlreadyClaimed(!!data);
  }

  useEffect(() => {
    fetchClaimStatus();
  }, [weekNumber]);

  useEffect(() => {
    const fetchRecipeAndImage = async () => {
      try {
        const challenge = getCurrentWeeklyChallenge();
        const prompt = `${challenge.title}: ${challenge.description}`;
        const recipeData = await getWeeklyChallengeRecipe(prompt);
        const image = await getRecipeImage(recipeData.title || challenge.title, recipeData.title || challenge.title, 'procedure');
        const recipe: RecipeCard = {
          id: `weekly-${challenge.title.replace(/\s+/g, '-').toLowerCase()}`,
          title: recipeData.title || challenge.title,
          image,
          ingredients: recipeData.ingredients || [],
          instructions: recipeData.instructions || '',
          equipment: recipeData.equipment || [],
        };
        setModalRecipe(recipe);
      } catch (e: any) {
        setError(e.message || 'Failed to generate challenge');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipeAndImage();
  }, [weekNumber]);

  function handleCookMe() {
    setRecipeModalOpen(true);
    setOpen(false);
  }

  return (
    <>
      {!alreadyClaimed ? (
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 hover:bg-yellow-200 shadow text-2xl cursor-pointer transition-colors border-2 border-black"
          title={ct('challengeOfTheWeek') + ": " + challenge.title}
          aria-label={ct('challengeOfTheWeek') + ": " + challenge.title}
          onClick={() => setOpen(true)}
        >
          <span role="img" aria-label="Trophy">🏆</span>
        </button>
      ) : (
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 cursor-not-allowed text-2xl border-2 border-black"
          title={ct('completed')}
          aria-label={ct('completed')}
          disabled
          style={{ outline: 'none', border: 'none' }}
        >
          <span role="img" aria-label="Trophy">🏆</span>
        </button>
      )}
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg border-4 border-black p-6 max-w-sm w-full relative z-50 flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-3xl mb-2">🏆</span>
            <span className="font-bold text-xl text-yellow-800 mb-1">{challenge.title}</span>
            <span className="text-gray-800 mb-2 text-center">{challenge.description}</span>
            <span className="text-sm text-gray-500">{ct('viewDetails')}: <b>{challenge.reward.xp} XP</b> and <b>{challenge.reward.badge}</b> badge</span>
            <button
              className="mt-4 px-4 py-2 rounded bg-maineBlue hover:bg-seafoam text-seafoam hover:text-maineBlue font-bold shadow border border-black w-full"
              onClick={handleCookMe}
              disabled={loading}
            >
              {loading ? t('common.loading') : t('myKitchen.cookMe', { defaultValue: 'Generate Challenge' })}
            </button>
            {error && <div className="text-red-600 mt-2">{error}</div>}
            <button
              className="mt-2 px-4 py-1 rounded bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-semibold shadow border border-black w-full"
              onClick={() => setOpen(false)}
            >{t('modals.close')}</button>
          </div>
        </div>
      )}
      <WeeklyChallengeRepairModal
        open={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        recipe={modalRecipe}
        loading={loading}
        error={error}
        challengeId={modalRecipe?.id || ''}
        weekNumber={getWeekNumber(new Date())}
        xp={challenge.reward.xp}
        badge={challenge.reward.badge}
      />
    </>
  );
};

export default ChallengeOfTheWeek;

