import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteContext } from './RouteContext';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import dispatcherFreddiePng from '../images/logo.png';

export type RouteCard = {
  id: string;
  title: string;
  image: string;
  items: string[];
  instructions: string;
  equipment?: string[];
  tutorials?: Array<{
    title: string;
    desc: string;
    videoUrl?: string;
  }>;
  products?: Array<{
    name: string;
    desc: string;
    price: string;
    image: string;
  }>;
  healthTags?: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  inventoryItems: string[];
  onLike: (route: RouteCard) => void;
  saveRouteToRunbook: (route: RouteCard) => void;
  routes: RouteCard[];
  loading: boolean;
  error: string;
};

const RouteMatcherModal: React.FC<Props> = ({ open, onClose, inventoryItems, onLike, saveRouteToRunbook, routes, loading, error }) => {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const { setSelectedRoute } = useRouteContext();
  const navigate = useNavigate();

  const loadingMessages = [
    'Dispatcher Freddie checking your inventory...',
    'Building your shipping procedures...',
    'Almost ready...'
  ];

  // Timer effect for loading steps
  useEffect(() => {
    if (loading) {
      setLoadingStep(0);
      const timer = setInterval(() => {
        setLoadingStep(prev => {
          if (prev < loadingMessages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2000); // Change message every 2 seconds

      return () => clearInterval(timer);
    }
  }, [loading, loadingMessages.length]);

  if (!open) return null;

  const handleLike = async () => {
    try {
      setIsSaving(true);
      // Save route to runbook
      await saveRouteToRunbook(routes[currentIdx]);
      await onLike(routes[currentIdx]);
      setCurrentIdx(idx => idx + 1);
    } catch (error) {
      console.error('Error saving route:', error);
    } finally {
      setIsSaving(false);
    }
  };
  const handleSkip = () => setCurrentIdx(idx => idx + 1);
  function generateTutorials(route: RouteCard) {
  return [
    {
      title: `Equipment needed for ${route.title}`,
      desc: 'Learn how to use the main equipment needed for this procedure.'
    },
    {
      title: 'Material Prep',
      desc: 'How to prep primary materials for this procedure.'
    },
    {
      title: `Procedure: ${route.title}`,
      desc: route.instructions
    }
  ];
}

  const handleCookMe = () => {
    const fullRoute = {
      ...routes[currentIdx],
      tutorials: routes[currentIdx].tutorials && routes[currentIdx].tutorials.length === 3
        ? routes[currentIdx].tutorials
        : generateTutorials(routes[currentIdx])
    };
    setSelectedRoute(fullRoute);
    navigate('/logistics-school');
  };

  const SKILL_TAGS = [
    { key: 'Safety', label: t('recipeMatcher.safety', { defaultValue: 'Safety' }) },
    { key: 'DOT Compliance', label: t('recipeMatcher.dotCompliance', { defaultValue: 'DOT Compliance' }) },
    { key: 'Load Planning', label: t('recipeMatcher.loadPlanning', { defaultValue: 'Load Planning' }) },
    { key: 'Documentation', label: t('recipeMatcher.documentation', { defaultValue: 'Documentation' }) },
    { key: 'Freight Class', label: t('recipeMatcher.freightClass', { defaultValue: 'Freight Class' }) },
    { key: 'Temperature Control', label: t('recipeMatcher.temperatureControl', { defaultValue: 'Temperature Control' }) },
    { key: 'Hazmat', label: t('recipeMatcher.hazmat', { defaultValue: 'Hazmat' }) }
  ];

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-weatheredWhite rounded-lg shadow-lg border-4 border-black p-4 lg:p-6 max-w-2xl w-full mx-4 max-h-[85vh] lg:max-h-[80vh] overflow-y-auto relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-2xl text-lobsterRed hover:text-red-700 focus:outline-none"
          aria-label="Close modal"
        >
          &times;
        </button>
        <h2 className="font-retro text-xl lg:text-2xl mb-2 text-center flex items-center justify-center">
          {loading ? (
            <div className="flex items-center gap-3">
              <img src={dispatcherFreddiePng} alt="Dispatcher Freddie" className="w-12 h-12 rounded-full border-2 border-black" />
              <span>{loadingMessages[loadingStep]}</span>
            </div>
          ) : 
           (routes.length > 0 && currentIdx < routes.length ? routes[currentIdx].title : 'Route Matcher')}
        </h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maineBlue mb-4"></div>
            <div className="text-lg font-retro mb-2">{'Finding matching routes...'}</div>
          </div>
        ) : error ? (
          <div className="text-lobsterRed text-center">{error}</div>
        ) : routes.length === 0 || currentIdx >= routes.length ? (
          <div className="text-center text-maineBlue font-bold py-10">{'No more suggestions.'}<br/>{'Try updating your dock inventory!'}</div>
        ) : (
          (() => {
            console.log('Route healthTags:', routes[currentIdx].healthTags);
            return (
              <div className="flex flex-col items-center">
                <div className="bg-sand rounded-xl shadow-lg border border-black p-4 w-full max-w-md mb-4 relative">
                  <img src={routes[currentIdx].image} alt={routes[currentIdx].title} className="w-full h-48 object-cover rounded mb-2" />
                  <div className="flex flex-wrap gap-1 mb-3 justify-center">
                    {SKILL_TAGS.map(tag => {
                      const isMatch = routes[currentIdx].healthTags?.includes(tag.key);
                      return (
                        <span 
                          key={tag.key}
                          className={`px-2 py-1 rounded-full text-xs ${
                            isMatch ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {tag.label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-600 mb-2 text-center"><span className="font-bold">{t('recipeCard.ingredients', { defaultValue: 'Materials' })}:</span> {routes[currentIdx].items.join(', ')}</div>
                  {routes[currentIdx].equipment && routes[currentIdx].equipment!.length > 0 && (
                    <div className="text-xs text-gray-600 mb-2 text-center"><span className="font-bold">{t('recipeCard.equipment', { defaultValue: 'Tools/Equipment' })}:</span> {routes[currentIdx].equipment!.join(', ')}</div>
                  )}
                </div>
                <div className="flex gap-8 mt-2">
                  <button className="bg-lobsterRed text-weatheredWhite px-6 py-2 rounded-full shadow hover:bg-maineBlue hover:text-seafoam text-xl font-bold" onClick={handleSkip}>
                    ✕
                  </button>
                  <button 
                    className="bg-seafoam text-maineBlue px-6 py-2 rounded-full shadow hover:bg-maineBlue hover:text-seafoam text-xl font-bold" 
                    onClick={handleLike}
                    disabled={isSaving}
                  >
                    {isSaving ? '...' : '♥'}
                  </button>
                  <button className="bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue text-xl font-bold" onClick={handleCookMe}>
                    {'Run It'}
                  </button>
                </div>
                <div className="text-xs mt-4 text-center text-gray-500">{'Swipe through route options'}</div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default RouteMatcherModal;

