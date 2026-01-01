import React, { useEffect, useState, createContext, useContext, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bars3Icon, CogIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import { LEVEL_TITLES_AND_ICONS, getXPProgress } from '../utils/leveling';
import { supabase } from '../api/supabaseClient';
import ChallengeOfTheWeek from './ChallengeOfTheWeek';
import { getUserBadges, BADGES } from '../utils/badges';
// @ts-ignore
import logo from '../images/logo.png';
import { useSupabase } from './SupabaseProvider';
import { isSessionValid } from '../api/userSession';
import { useAdminToggle } from '../App';

interface LevelProgress {
  title: string;
  level: number;
  icon: string;
  current: number;
  required: number;
  progressPercent: number;
}

const LevelProgressContext = createContext<{ refreshXP: () => void; progress: LevelProgress }>({ refreshXP: () => {}, progress: {
  title: 'Beginner',
  level: 1,
  icon: '🧽',
  current: 0,
  required: 100,
  progressPercent: 0,
}});
export const useLevelProgressContext = () => useContext(LevelProgressContext);


const useLevelProgress = (): [LevelProgress, () => void] => {
  const [progress, setProgress] = useState<LevelProgress>({
    title: LEVEL_TITLES_AND_ICONS[0].title,
    level: 1,
    icon: LEVEL_TITLES_AND_ICONS[0].icon,
    current: 0,
    required: 100,
    progressPercent: 0,
  });
  const fetchXpRef = useRef<() => Promise<void>>();

  const { user } = useSupabase();

  const fetchXp = async () => {
    const sessionValid = await isSessionValid()
    if (!sessionValid || !user) return;

    const { data } = await supabase
      .from('user_xp')
      .select('xp')
      .eq('user_id', user.id)
      .single();

    if (data?.xp == null) return;

    const { level, current, required } = getXPProgress(data.xp);
    
    // Map level to title index
    // Map level directly to LEVEL_TITLES_AND_ICONS index (level 1 = index 0, level 2 = index 1, ...)
    const titleIndex = Math.max(0, Math.min(level - 1, LEVEL_TITLES_AND_ICONS.length - 1));
    const { title, icon } = LEVEL_TITLES_AND_ICONS[titleIndex];
    const progressPercent = (current / required) * 100;

    setProgress({
      title,
      level,
      icon,
      current,
      required,
      progressPercent,
    });
  };

  useEffect(() => {
    fetchXpRef.current = fetchXp;
    fetchXp();
  }, []);

  const refreshXP = () => {
    if (fetchXpRef.current) fetchXpRef.current();
  };

  return [progress, refreshXP];
};

const LastBadge = () => {
  const [lastBadge, setLastBadge] = useState<{icon: string, name: string, description: string} | null>(null);
  const [loading, setLoading] = useState(true);

  const { user } = useSupabase();
  
  useEffect(() => {
    const fetchLastBadge = async () => {
      try {
        const sessionValid = await isSessionValid()
        if (!sessionValid || !user) {
          setLoading(false);
          return;
        }
        
        // Get all user badges
        const userBadges = await getUserBadges(user.id);
        
        if (userBadges.length > 0) {
          // Sort by awarded_at descending to get the most recent badge
          userBadges.sort((a, b) => 
            new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime()
          );
          
          // Find the badge details from BADGES array
          const badgeId = userBadges[0].badge_id;
          const badgeDetails = BADGES.find(b => b.id === badgeId);
          
          if (badgeDetails) {
            setLastBadge({
              icon: badgeDetails.icon,
              name: badgeDetails.name,
              description: badgeDetails.description
            });
          }
        }
      } catch (error) {
        console.error('Error fetching last badge:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLastBadge();
  }, []);
  
  if (loading) return null;
  
  // Show placeholder if no badge is earned yet
  const { t } = useTranslation();
  
  if (!lastBadge) {
    return (
      <div className="flex items-center ml-2" title={t('badge.completeWeeklyChallenges')}>
        <span className="text-lg opacity-50">🏅</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center ml-2" title={`${lastBadge.name}: ${lastBadge.description}`}>
      <span className="text-lg">{lastBadge.icon}</span>
    </div>
  );
};

const navItems = [
  { path: '/my-kitchen', label: 'My Kitchen' },
  { path: '/culinary-school', label: 'Culinary School' },
  { path: '/my-cookbook', label: 'My Cookbook' },
  { path: '/chefs-corner', label: 'Chefs Corner' },
];

// Language Toggle Button Component
const LanguageToggleButton: React.FC = () => {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';
  
  const toggleLanguage = () => {
    const newLang = isSpanish ? 'en' : 'es';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };
  
  return (
    <button
      onClick={toggleLanguage}
      className={`relative flex items-center justify-center w-10 h-10 rounded-full shadow text-2xl cursor-pointer transition-colors border-2 border-black ${
        isSpanish 
          ? 'bg-orange-200 hover:bg-orange-300' 
          : 'bg-white hover:bg-gray-100'
      }`}
      aria-label={isSpanish ? 'Switch to English' : 'Cambiar a Español'}
      title={isSpanish ? 'Switch to English' : 'Cambiar a Español'}
    >
      <span role="img" aria-label={isSpanish ? 'Spanish' : 'English'}>{isSpanish ? '🇪🇸' : '🇺🇸'}</span>
    </button>
  );
};

// Admin Toggle Button Component
const AdminToggleButton: React.FC = () => {
  const { isAdminMode, toggleAdminMode } = useAdminToggle();
  const { t } = useTranslation();
  
  return (
    <button
      onClick={toggleAdminMode}
      className={`relative flex items-center justify-center w-10 h-10 rounded-full shadow cursor-pointer transition-colors border-2 border-black ${
        isAdminMode 
          ? 'bg-lobsterRed hover:bg-red-700' 
          : 'bg-white hover:bg-gray-100'
      }`}
      aria-label={isAdminMode ? t('nav.switchToStudentView') : t('nav.switchToAdminView')}
      title={isAdminMode ? t('nav.switchToStudentView') : t('nav.switchToAdminView')}
    >
      <CogIcon className={`h-6 w-6 ${isAdminMode ? 'text-white' : 'text-black'}`} />
    </button>
  );
};

const NavBar: React.FC = () => {
  const { progress, refreshXP } = useLevelProgressContext();
  const location = useLocation();
  const { t } = useTranslation();
  
  return (
    <nav className="navbar bg-maineBlue text-weatheredWhite w-full py-1 shadow-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        {/* Flex container for all items */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2 ml-[5%]">
            {/* PorkChop Text as Dashboard Link */}
            <Link to="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
              <span className="text-3xl sm:text-4xl font-bold tracking-wider font-retro">PorkChop</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {/* Weekly Challenge */}
            <ChallengeOfTheWeek />
            
            {/* Profile Avatar */}
            <Link
              to={location.pathname === '/profile' ? '/dashboard' : '/profile'}
              className={`relative flex items-center justify-center w-10 h-10 rounded-full shadow cursor-pointer transition-colors border-2 border-black ${
                location.pathname === '/profile'
                  ? 'bg-seafoam hover:bg-teal-400'
                  : 'bg-white hover:bg-gray-100'
              }`}
              aria-label={location.pathname === '/profile' ? t('nav.dashboard') : t('nav.profile')}
            >
              <UserCircleIcon className="h-7 w-7 text-black" />
            </Link>
            
            {/* Language Toggle */}
            <LanguageToggleButton />
            
            {/* Admin Toggle */}
            <AdminToggleButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavBarWithProvider: React.FC = (props) => {
  const [progress, refreshXP] = useLevelProgress();
  
  return (
    <LevelProgressContext.Provider value={{ progress, refreshXP }}>
      <NavBar {...props} />
    </LevelProgressContext.Provider>
  );
};

export default NavBarWithProvider;
