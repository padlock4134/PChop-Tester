import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useLevelProgressContext } from './NavBar';
import WeeklyChallengeFitModal from './WeeklyChallengeFitModal';
import type { RecipeCard } from './FitMatcherModal';
import { getWeeklyChallengeRecipe } from '../api/anthropicChallenge';
import { getRecipeImage } from '../api/unsplash';
import { supabase } from '../api/supabaseClient';
import { isSessionValid } from '../api/userSession';
import { useSupabase } from './SupabaseProvider';

// Pool of weekly challenges
const WEEKLY_CHALLENGES = [
  {
    id: 'leakLocator',
    defaultTitle: 'Leak Locator',
    defaultDescription: 'Complete a leak detection/repair task.',
    defaultBadge: 'Leak Locator',
    criteria: (fit: { materials: string[] }) => fit.materials.some(i => ['leak','seal','pressure'].includes(i.toLowerCase())),
  },
  {
    id: 'pipefitPro',
    defaultTitle: 'Pipefit Pro',
    defaultDescription: 'Submit a pipe fitting/connection task.',
    defaultBadge: 'Pipefit Pro',
    criteria: (fit: { materials: string[] }) => fit.materials.some(i => ['pipe','fitting','joint'].includes(i.toLowerCase())),
  },
  {
    id: 'drainDoctor',
    defaultTitle: 'Drain Doctor',
    defaultDescription: 'Complete drainage or flow troubleshooting.',
    defaultBadge: 'Drain Doctor',
    criteria: (fit: { materials: string[] }) => fit.materials.some(i => ['drain','clog','flow'].includes(i.toLowerCase())),
  },
  {
    id: 'fixtureFinish',
    defaultTitle: 'Fixture Finish',
    defaultDescription: 'Log a fixture install/trim-out task.',
    defaultBadge: 'Fixture Finish',
    criteria: (fit: { materials: string[] }) => fit.materials.some(i => ['fixture','trim','install'].includes(i.toLowerCase())),
  },
  {
    id: 'codeCheck',
    defaultTitle: 'Code Check',
    defaultDescription: 'Submit plumbing code compliance work.',
    defaultBadge: 'Code Checked',
    criteria: (fit: { materials: string[] }) => fit.materials.some(i => ['code','inspection','permit'].includes(i.toLowerCase())),
  },
  {
    id: 'pressureTest',
    defaultTitle: 'Pressure Test',
    defaultDescription: 'Complete pressure testing/validation.',
    defaultBadge: 'Pressure Pro',
    criteria: (fit: { materials: string[] }) => fit.materials.some(i => ['pressure','test','gauge'].includes(i.toLowerCase())),
  },
  {
    id: 'solderStation',
    defaultTitle: 'Solder Station',
    defaultDescription: 'Log solder/press connection work.',
    defaultBadge: 'Connection Specialist',
    criteria: (fit: { materials: string[] }) => fit.materials.some(i => ['solder','press','braze'].includes(i.toLowerCase())),
  },
  {
    id: 'ventVerify',
    defaultTitle: 'Vent Verify',
    defaultDescription: 'Complete venting system verification.',
    defaultBadge: 'Vent Verifier',
    criteria: (fit: { materials: string[] }) => fit.materials.some(i => ['vent','trap','dwv'].includes(i.toLowerCase())),
  },
  {
    id: 'serviceSaver',
    defaultTitle: 'Service Saver',
    defaultDescription: 'Submit maintenance/service workflow task.',
    defaultBadge: 'Service Saver',
    criteria: (fit: { materials: string[] }) => fit.materials.some(i => ['service','maintenance','repair'].includes(i.toLowerCase())),
  },
  {
    id: 'systemReliability',
    defaultTitle: 'System Reliability',
    defaultDescription: 'Complete reliability improvement work.',
    defaultBadge: 'System Guardian',
    criteria: (fit: { materials: string[] }) => fit.materials.some(i => ['reliability','system','performance'].includes(i.toLowerCase())),
  }
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
function getCurrentWeeklyChallenge(weekNumber: number, t: (key: string, options?: any) => string) {
  const challenge = WEEKLY_CHALLENGES[weekNumber % WEEKLY_CHALLENGES.length];
  return {
    ...challenge,
    title: t(`challenge.plumbing.${challenge.id}.title`, { defaultValue: challenge.defaultTitle }),
    description: t(`challenge.plumbing.${challenge.id}.description`, { defaultValue: challenge.defaultDescription }),
    reward: {
      xp: 100,
      badge: t(`challenge.plumbing.${challenge.id}.badge`, { defaultValue: challenge.defaultBadge })
    }
  };
}

const ChallengeOfTheWeek: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const discipline = location.pathname.split('/').filter(Boolean)[0] || 'plumbing';
  const ct = (key: string, options?: any) => t(`challenge.disciplineCopy.${discipline}.${key}`, { defaultValue: t(`challenge.${key}`, options), ...options });
  const [open, setOpen] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [modalRecipe, setModalRecipe] = useState<RecipeCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekNumber, setWeekNumber] = useState(getWeekNumber(new Date()));
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const { refreshXP } = useLevelProgressContext();
  const challenge = getCurrentWeeklyChallenge(weekNumber, t);

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
        const prompt = `${challenge.title}: ${challenge.description}`;
        const recipeData = await getWeeklyChallengeRecipe(prompt);
        const image = await getRecipeImage(recipeData.title || challenge.title, recipeData.title || challenge.title, 'fit');
        const fit: RecipeCard = {
          id: `weekly-${challenge.title.replace(/\s+/g, '-').toLowerCase()}`,
          title: recipeData.title || challenge.title,
          image,
          materials: recipeData.materials || [],
          instructions: recipeData.instructions || '',
          equipment: recipeData.equipment || [],
        };
        setModalRecipe(fit);
      } catch (e: any) {
        setError(e.message || 'Failed to generate challenge');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipeAndImage();
  }, [weekNumber, i18n.language]);

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
          title={String(ct('completed'))}
          aria-label={String(ct('completed'))}
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
            <span className="text-sm text-gray-500">
              {String(ct('viewDetails'))}: <b>{t('challenge.rewardDetails', { xp: challenge.reward.xp, badge: challenge.reward.badge, defaultValue: `${challenge.reward.xp} XP and ${challenge.reward.badge} badge` })}</b>
            </span>
            <button
              className="mt-4 px-4 py-2 rounded bg-maineBlue hover:bg-seafoam text-seafoam hover:text-maineBlue font-bold shadow border border-black w-full"
              onClick={handleCookMe}
              disabled={loading}
            >
              {loading ? String(t('common.loading')) : String(ct('startChallenge', { defaultValue: String(t('challenge.startChallenge')) }))}
            </button>
            {error && <div className="text-red-600 mt-2">{error}</div>}
            <button
              className="mt-2 px-4 py-1 rounded bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-semibold shadow border border-black w-full"
              onClick={() => setOpen(false)}
            >{t('modals.close')}</button>
          </div>
        </div>
      )}
      <WeeklyChallengeFitModal
        open={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        fit={modalRecipe}
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
