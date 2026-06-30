import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { useFreddieContext } from '../components/PipeFreddieContext';
import { useRecipeContext } from '../components/FitContext';
import { useNavigate } from 'react-router-dom';
import { fetchPipeBook, removeRecipeFromPipeBook } from './pipebookSupabase';
import { supabase } from '../api/supabaseClient';
import { XP_REWARDS } from '../services/xpService';
import { useLevelProgressContext } from '../components/NavBar';
import { useSupabase } from '../components/SupabaseProvider';
import { isSessionValid } from '../api/userSession';
import { issueLearnCardCredential } from '../../../services/learncard';

type PlumberQuote = {
  professional: string;
  quote: string;
};

// Use the real i18next instance so language switches are detected reactively.
const i18n = i18next;

// Plumbing professional quotes (localized)
const plumberQuotesByLocale: Record<'en' | 'es', PlumberQuote[]> = {
  en: [
  { professional: 'Mike Diamond', quote: 'The best time to fix a leak is before it starts.' },
  { professional: 'Richard Trethewey', quote: 'Plumbing is not just about pipes, it\'s about people\'s lives.' },
  { professional: 'Roger Wakefield', quote: 'A good plumber knows that the most important tool is the one between your ears.' },
  { professional: 'Ed Del Grande', quote: 'Every job is a self-portrait of the person who did it.' },
  { professional: 'Matt Muenster', quote: 'The difference between a good plumber and a great plumber is attention to detail.' },
  { professional: 'Steve Berry', quote: 'Plumbing is the circulatory system of the home.' },
  { professional: 'Roger Wakefield', quote: 'If you don\'t have time to do it right, when will you have time to do it over?' },
  { professional: 'Mike Diamond', quote: 'In plumbing, you learn something new every day.' },
  { professional: 'Richard Trethewey', quote: 'The customer doesn\'t care how much you know until they know how much you care.' },
  { professional: 'Ed Del Grande', quote: 'Quality is remembered long after the price is forgotten.' },
  { professional: 'Matt Muenster', quote: 'Measure twice, cut once. That\'s the plumber\'s motto.' },
  { professional: 'Steve Berry', quote: 'There\'s no substitute for experience in this trade.' },
  { professional: 'Roger Wakefield', quote: 'The problem isn\'t the problem. The problem is your attitude about the problem.' },
  { professional: 'Mike Diamond', quote: 'Success is the sum of small efforts repeated day in and day out.' },
  { professional: 'Richard Trethewey', quote: 'Excellence is not a skill. It is an attitude.' },
  { professional: 'Ed Del Grande', quote: 'The only way to do great work is to love what you do.' },
  { professional: 'Matt Muenster', quote: 'Plumbing isn\'t a job, it\'s a craft.' }
  ],
  es: [
    { professional: 'Mike Diamond', quote: 'El mejor momento para arreglar una fuga es antes de que comience.' },
    { professional: 'Richard Trethewey', quote: 'La plomería no se trata solo de tuberías, se trata de la vida de las personas.' },
    { professional: 'Roger Wakefield', quote: 'Un buen plomero sabe que la herramienta más importante es la que está entre tus oídos.' },
    { professional: 'Ed Del Grande', quote: 'Cada trabajo es un autorretrato de quien lo hizo.' },
    { professional: 'Matt Muenster', quote: 'La diferencia entre un buen plomero y uno excelente está en la atención al detalle.' },
    { professional: 'Steve Berry', quote: 'La plomería es el sistema circulatorio del hogar.' },
    { professional: 'Roger Wakefield', quote: 'Si no tienes tiempo para hacerlo bien, ¿cuándo tendrás tiempo para hacerlo de nuevo?' },
    { professional: 'Mike Diamond', quote: 'En plomería, aprendes algo nuevo todos los días.' },
    { professional: 'Richard Trethewey', quote: 'Al cliente no le importa cuánto sabes hasta que sabe cuánto te importa.' },
    { professional: 'Ed Del Grande', quote: 'La calidad se recuerda mucho después de que se olvida el precio.' },
    { professional: 'Matt Muenster', quote: 'Mide dos veces, corta una vez. Ese es el lema del plomero.' },
    { professional: 'Steve Berry', quote: 'No hay sustituto para la experiencia en este oficio.' },
    { professional: 'Roger Wakefield', quote: 'El problema no es el problema. El problema es tu actitud frente al problema.' },
    { professional: 'Mike Diamond', quote: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.' },
    { professional: 'Richard Trethewey', quote: 'La excelencia no es una habilidad. Es una actitud.' },
    { professional: 'Ed Del Grande', quote: 'La única forma de hacer un gran trabajo es amar lo que haces.' },
    { professional: 'Matt Muenster', quote: 'La plomería no es un trabajo, es un oficio.' }
  ]
};

export function getPlumberQuoteOfTheDay(language: string = 'en') {
  const locale: 'en' | 'es' = language.toLowerCase().startsWith('es') ? 'es' : 'en';
  const quotes = plumberQuotesByLocale[locale];
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const idx = dayOfYear % quotes.length;
  return quotes[idx];
}

export function getVideoQueriesForRecipe(fit: Fit): string[] {
  return [
    `how to ${fit.name} plumbing tutorial`,
    `${fit.name} installation guide`
  ];
}

export interface Fit {
  id: string;
  name: string;
  description: string;
  photo?: string;
  materials?: string[];
  instructions?: string;
  equipment?: string[];
  specs?: {
    pressure: number;
    flow: number;
    material: string;
    size: string;
    temperature: number;
    warranty?: string;
    rating?: string;
  };
  complianceTags?: string[];
}

const MyPipeBook = () => {
  const translation = useTranslation();
  const t =
    translation?.t ??
    ((key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key);
  const currentLanguage =
    i18n.language ||
    'en';
  const { setSelectedRecipe } = useRecipeContext();
  const navigate = useNavigate();
  const [fits, setLocalRecipes] = useState<Fit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showShareModal, setShowShareModal] = useState(false);
  const [recipeToShare, setRecipeToShare] = useState<Fit | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  const [showViewCollectionModal, setShowViewCollectionModal] = useState(false);
  const [showGradebookModal, setShowGradebookModal] = useState(false);
  const [currentAssignmentPage, setCurrentAssignmentPage] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showVideoConfirmModal, setShowVideoConfirmModal] = useState(false);
  const [selectedVideoOption, setSelectedVideoOption] = useState('');
  const [submittedVideos, setSubmittedVideos] = useState<{[key: number]: string}>({});
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [showVideoLibraryModal, setShowVideoLibraryModal] = useState(false);
  const [savedVideos, setSavedVideos] = useState<Array<{name: string, url: string, created_at: string, userId: string, isPublic: boolean}>>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoFilter, setVideoFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [selectedLibraryVideo, setSelectedLibraryVideo] = useState<{name: string, url: string, created_at: string, userId: string, isPublic: boolean} | null>(null);
  const [showLibraryVideoModal, setShowLibraryVideoModal] = useState(false);
  const [showSkillsWalletModal, setShowSkillsWalletModal] = useState(false);
  const [skillsWalletTarget, setSkillsWalletTarget] = useState<{name: string, url: string, created_at: string, userId: string, isPublic: boolean} | null>(null);
  const [skillsWalletSkillName, setSkillsWalletSkillName] = useState('');
  const [skillsWalletNotes, setSkillsWalletNotes] = useState('');
  const [skillsWalletSuccess, setSkillsWalletSuccess] = useState(false);
  const [skillsWalletDestination, setSkillsWalletDestination] = useState('');
  const [skillsWalletGovState, setSkillsWalletGovState] = useState('');
  const [skillsWalletLearnCardHandle, setSkillsWalletLearnCardHandle] = useState('');
  const [skillsWalletClaimId, setSkillsWalletClaimId] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'pipebook' | 'collections'>('pipebook');
  
  // Assignment data
  const assignments: any[] = [];

  // Student data
  const students: any[] = [];

  // Mock grades for each student and assignment
  const mockGrades: any = {};

  const [selectedCollection, setSelectedCollection] = useState<{id: string, name: string, emoji: string, fits: string[]} | null>(null);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [collections, setCollections] = useState<{id: string, name: string, emoji: string, fits: string[]}[]>([]);

  const { user } = useSupabase();

  useEffect(() => {
    if (!user) return;
    supabase.from('user_collections').select('*').eq('user_id', user.id).eq('discipline', 'plumbing')
      .then(({ data }) => {
        if (data) setCollections(data.map(r => ({ id: r.id, name: r.name, emoji: r.emoji, fits: r.items as string[] })));
      });
  }, [user]);

  // Load fits and set page context on mount
  const { updateContext } = useFreddieContext();
  const { refreshXP } = useLevelProgressContext();
  
  // Categories for filtering
  const categories = [
    { key: 'All', label: t('myPipeBook.all') },
    { key: 'Seafood', label: t('myPipeBook.seafood') },
    { key: 'Meat', label: t('myPipeBook.meat') },
    { key: 'Vegetarian', label: t('myPipeBook.vegetarian') },
    { key: 'Dessert', label: t('myPipeBook.dessert') }
  ];

  // Handle fit selection for collections
  const handleRecipeSelect = (recipeId: string) => {
    setSelectedRecipes(prev => 
      prev.includes(recipeId) 
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  // Handle creating a new collection
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || selectedRecipes.length === 0) return;
    const { data, error } = await supabase.from('user_collections').insert({
      user_id: user?.id, discipline: 'plumbing', name: newCollectionName.trim(), emoji: '📁', items: selectedRecipes
    }).select().single();
    if (!error && data) {
      setCollections(prev => [...prev, { id: data.id, name: data.name, emoji: data.emoji, fits: data.items as string[] }]);
    }
    setNewCollectionName(''); setSelectedRecipes([]); setShowCreateCollectionModal(false);
  };

  // Handle viewing a collection
  const handleViewCollection = (collection: any) => {
    setSelectedCollection(collection);
    setShowViewCollectionModal(true);
  };

  // Handle deleting a collection
  const handleDeleteCollection = async (collectionId: string) => {
    await supabase.from('user_collections').delete().eq('id', collectionId).eq('user_id', user?.id ?? '');
    setCollections(prev => prev.filter(c => c.id !== collectionId));
    setShowViewCollectionModal(false); setSelectedCollection(null);
  };

  // Handle opening gradebook
  const handleOpenGradebook = () => {
    setShowGradebookModal(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Handle closing gradebook
  const handleCloseGradebook = () => {
    setShowGradebookModal(false);
    // Restore body scroll when modal is closed
    document.body.style.overflow = 'unset';
  };

  const handleShare = async (platform: string = 'native') => {
    const shareData = {
      title: recipeToShare ? `${recipeToShare.name} Procedure on Porkchop` : 'My Pipe Book on Porkchop',
      text: recipeToShare 
        ? `Check out this plumbing procedure for ${recipeToShare.name} on Porkchop!` 
        : 'Check out my digital pipe book on Porkchop! I’ve been collecting useful plumbing procedures and would love to share them with you.',
      url: window.location.href + (recipeToShare ? `?fit=${encodeURIComponent(recipeToShare.id)}` : ''),
    };

    try {
      let shared = false;
      
      switch (platform) {
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`, '_blank');
          shared = true;
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`, '_blank');
          shared = true;
          break;
        case 'pinterest':
          window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareData.url)}&description=${encodeURIComponent(shareData.text)}`, '_blank');
          shared = true;
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`, '_blank');
          shared = true;
          break;
        case 'instagram':
          // Instagram doesn't support direct sharing via URL, so we'll copy to clipboard with instructions
          const instagramMessage = `Check out my pipe book! ${shareData.url}\n\nTo share on Instagram:\n1. Open Instagram\n2. Create a new post\n3. Paste this link in your caption`;
          await navigator.clipboard.writeText(instagramMessage);
          console.log(t('myPipeBook.sharingInstructions'));
          shared = true;
          break;
        case 'slack':
          window.open(`https://slack.com/intent/share?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`, '_blank');
          shared = true;
          break;
        case 'native':
          if (navigator.share) {
            await navigator.share(shareData);
            shared = true;
          } else {
            await navigator.clipboard.writeText(shareData.url);
            console.log(t('myPipeBook.linkCopied'));
            shared = true;
          }
          break;
      }

      if (shared) {
        // Award XP for sharing
        const sessionValid = await isSessionValid();
        if (sessionValid && user) {
          const today = new Date().toISOString().split('T')[0];
          const { data: existingLog } = await supabase
            .from('xp_activity_log')
            .select('id')
            .eq('user_id', user.id)
            .eq('activity', 'pipebook_share')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`)
            .maybeSingle();
          
          if (!existingLog) {
            await supabase.rpc('increment_user_xp', {
              user_id: user.id,
              xp_amount: XP_REWARDS.RECIPE_SHARE
            });
            
            await supabase.from('xp_activity_log').insert([
              {
                user_id: user.id,
                xp_awarded: XP_REWARDS.RECIPE_SHARE,
                activity: 'pipebook_share'
              }
            ]);
            
            refreshXP();
          }
        }
      }
    } catch (err: any) {
      console.error('Error sharing:', err);
      if (err.name !== 'AbortError') {
        console.error(t('myPipeBook.failedToShare'));
      }
    } finally {
      setShowShareModal(false);
    }
  };
  useEffect(() => {
    updateContext({ page: 'MyPipeBook' });
    const loadRecipes = async () => {
      try {
        setLoading(true);
        if (!user?.id) {
          setLoading(false);
          setError(null);
          setLocalRecipes([]);
          return;
        }
        setError(null);
        const savedRecipes = await fetchPipeBook(user.id);
        const converted = savedRecipes.map(r => ({
          id: r.id,
          name: r.title,
          description: r.instructions,
          photo: r.image,
          materials: r.materials,
          instructions: r.instructions,
          equipment: r.equipment,
          specs: r.specs,
          complianceTags: r.complianceTags
        }));
        setLocalRecipes(converted);
      } catch (err) {
        console.error('Error loading pipe book:', err);
        setError(t('myPipeBook.failedToLoadPipeBook', { defaultValue: 'Failed to load your pipe book' }));
      } finally {
        setLoading(false);
      }
    };
    loadRecipes();
  }, [updateContext, user?.id]);

  // Filter fits based on search term and category
  const filteredRecipes = fits.filter(fit => {
    const matchesSearch = fit.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeCategory === 'All' || activeCategory === t('myPipeBook.all')) return matchesSearch;
    
    // Simple category detection based on materials
    const materials = fit.materials || [];
    const materialsJoined = materials.join(' ').toLowerCase();
    
    const hasSeafood = materialsJoined.includes('fish') || 
      materialsJoined.includes('salmon') || 
      materialsJoined.includes('tuna') || 
      materialsJoined.includes('cod') || 
      materialsJoined.includes('tilapia') || 
      materialsJoined.includes('shrimp') || 
      materialsJoined.includes('lobster') || 
      materialsJoined.includes('crab') || 
      materialsJoined.includes('oyster') || 
      materialsJoined.includes('clam') || 
      materialsJoined.includes('mussel');
    
    const hasMeat = materialsJoined.includes('beef') || 
      materialsJoined.includes('chicken') || 
      materialsJoined.includes('pork') || 
      materialsJoined.includes('turkey') || 
      materialsJoined.includes('bacon') || 
      materialsJoined.includes('sausage') || 
      materialsJoined.includes('lamb');
    
    const hasVegetable = materialsJoined.includes('vegetable') || 
      materialsJoined.includes('tomato') || 
      materialsJoined.includes('carrot') || 
      materialsJoined.includes('spinach');
    
    const hasDessert = materialsJoined.includes('sugar') || 
      materialsJoined.includes('chocolate') || 
      materialsJoined.includes('vanilla') || 
      materialsJoined.includes('cream') || 
      materialsJoined.includes('cake') || 
      materialsJoined.includes('cookie') || 
      materialsJoined.includes('pie');
    
    switch (activeCategory) {
      case 'Seafood': return hasSeafood && matchesSearch;
      case 'Meat': return hasMeat && matchesSearch;
      case 'Vegetarian': return hasVegetable && !hasMeat && !hasSeafood && matchesSearch;
      case 'Dessert': return hasDessert && matchesSearch;
      default: return matchesSearch;
    }
  });

  if (loading) {
    return (
      <div className="w-full mt-4 bg-weatheredWhite p-6 rounded shadow-lg border-4 border-maineBlue">
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maineBlue mb-4"></div>
          <div className="text-lg font-retro mb-2">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mt-4 bg-weatheredWhite p-6 rounded shadow-lg border-4 border-maineBlue">
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <div className="text-xl text-red-600 mb-4">⚠️</div>
          <div className="text-lg font-retro mb-2">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[90%] mx-auto mt-4 student-dashboard-height-lock">
      {/* Mobile Tab Bar - Only visible on mobile */}
      <div className="lg:hidden mb-4 flex gap-2 border-b-2 border-maineBlue">
        <button
          onClick={() => setActiveMobileTab('pipebook')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'pipebook'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📖 {t('myPipeBook.title')}
        </button>
        <button
          onClick={() => setActiveMobileTab('collections')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'collections'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📚 {t('myPipeBook.collections')}
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 lg:h-full lg:justify-center">
        <div className={`lg:w-[66.666%] bg-weatheredWhite rounded-xl shadow-lg border-4 border-maineBlue flex flex-col h-full lg:min-h-[620px] ${
          activeMobileTab === 'pipebook' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* My Cook Book header */}
          <div className="flex items-center justify-center p-6 pb-4">
            <span className="text-5xl mr-2">📖</span>
            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('myPipeBook.title')}</h1>
          </div>
          
          {/* Sticky Separation line */}
          <div className="sticky top-0 bg-weatheredWhite z-10 px-6">
            <hr className="border-t-2 border-maineBlue" />
          </div>
          
          {/* Scrollable Content */}
          <div className="overflow-y-auto p-6 pt-4">
      {showShareModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
        setShowShareModal(false);
        setRecipeToShare(null);
      }}>
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 border-4 border-black" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold mb-4">
            {recipeToShare ? `${t('myPipeBook.shareRecipeTitle')} "${recipeToShare.name}"` : t('myPipeBook.shareYourCookbook')}
          </h3>
          <div className="flex justify-around mb-4">
            <button 
              onClick={() => handleShare('facebook')}
              className="p-2 rounded-full hover:bg-blue-100"
              title={t('myPipeBook.shareOnFacebook')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1877F2"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/></svg>
            </button>
            <button 
              onClick={() => handleShare('twitter')}
              className="p-2 rounded-full hover:bg-blue-100"
              title={t('myPipeBook.shareOnTwitter')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg>
            </button>
            <button 
              onClick={() => handleShare('pinterest')}
              className="p-2 rounded-full hover:bg-red-100"
              title={t('myPipeBook.shareOnPinterest')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#E60023"><path d="M9.04 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.527 2.527 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
            </button>
            <button 
              onClick={() => handleShare('whatsapp')}
              className="p-2 rounded-full hover:bg-green-100"
              title={t('myPipeBook.shareOnWhatsApp')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#25D366"><path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </button>
            <button 
              onClick={() => handleShare('instagram')}
              className="p-2 rounded-full hover:bg-pink-100"
              title={t('myPipeBook.shareOnInstagram')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#E4405F"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </button>
            <button 
              onClick={() => handleShare('slack')}
              className="p-2 rounded-full hover:bg-purple-100"
              title={t('myPipeBook.shareOnSlack')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#4A154B"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
            </button>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => handleShare('native')}
              className="px-4 py-2 bg-seafoam text-maineBlue rounded hover:bg-maineBlue hover:text-seafoam transition-colors"
            >
              {t('myPipeBook.shareVia')}
            </button>
            <button
              onClick={() => {
                setShowShareModal(false);
                setRecipeToShare(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      )}
      
      {/* Create Collection Modal */}
      {showCreateCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setShowCreateCollectionModal(false);
          setNewCollectionName('');
        }}>
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border-4 border-black" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{t('myPipeBook.createNewCollection')}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('myPipeBook.collectionName')}
              </label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder={t('myPipeBook.enterCollectionName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                autoFocus
              />
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {t('myPipeBook.selectedRecipes')} {selectedRecipes.length}
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateCollectionModal(false);
                  setNewCollectionName('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                {t('myPipeBook.cancel')}
              </button>
              <button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
                className={`px-4 py-2 rounded transition-colors ${
                  newCollectionName.trim()
                    ? 'bg-seafoam text-maineBlue hover:bg-maineBlue hover:text-seafoam'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {t('myPipeBook.createCollection')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* View Collection Modal */}
      {showViewCollectionModal && selectedCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setShowViewCollectionModal(false);
          setSelectedCollection(null);
        }}>
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border-4 border-black" onClick={e => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">{selectedCollection.emoji}</span>
              <h3 className="text-lg font-bold">{selectedCollection.name}</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                {t('myPipeBook.recipesInCollection')} ({selectedCollection.fits.length}):
              </p>
              
              <div className="h-40 overflow-y-scroll border border-gray-300 rounded p-2">
                {selectedCollection.fits.map((recipeId, index) => {
                  const fit = fits.find(r => r.id === recipeId);
                  return (
                    <div key={recipeId} className="py-2 px-2 hover:bg-sand rounded flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-2">🔧</span>
                        <span className="text-sm">{fit ? fit.name : `Procedure ${index + 1}`}</span>
                      </div>
                      {fit && fit.complianceTags && fit.complianceTags.length > 0 && (
                        <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                          🔧
                        </span>
                      )}
                    </div>
                  );
                })}
                {selectedCollection.fits.length === 0 && (
                  <div className="py-4 text-center text-gray-500 text-sm italic">
                    {t('myPipeBook.noRecipesInCollection')}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => handleDeleteCollection(selectedCollection.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                {t('myPipeBook.deleteCollection')}
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowViewCollectionModal(false);
                    setSelectedCollection(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  {t('common.close')}
                </button>
                <button
                  onClick={() => {
                    // Future: Add edit collection functionality
                  }}
                  className="px-4 py-2 bg-seafoam text-maineBlue rounded hover:bg-maineBlue hover:text-seafoam transition-colors"
                >
                  {t('myPipeBook.editCollection')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Search and Filters */}
      <div className="mb-6">
        {/* Top Row: Category and Search - Mobile Stacked, Desktop Side-by-side */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          {/* Category Pick List */}
          <select
            value={activeCategory}
            onChange={(e) => {
              setActiveCategory(e.target.value);
              setCurrentIndex(0); // Reset to first fit on category change
            }}
            className="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-seafoam bg-white text-sm w-full sm:w-auto sm:min-w-[120px]"
          >
            {categories.map(category => (
              <option key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t('myPipeBook.searchRecipes')}
              className="pl-8 pr-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-seafoam w-full text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentIndex(0); // Reset to first fit on search
              }}
            />
            <div className="absolute left-2 top-2.5 text-gray-400">🔍</div>
          </div>
        </div>
        
        {/* Bottom Row: Navigation + Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-1 w-full">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className={`flex-1 px-2 py-2 rounded border border-black text-xs sm:text-sm font-bold transition-colors text-center ${currentIndex === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-lobsterRed text-weatheredWhite hover:bg-seafoam hover:text-maineBlue'}`}
          >
            <span className="hidden sm:inline">{t('myPipeBook.previous')}</span>
            <span className="sm:hidden">{t('myPipeBook.prev')}</span>
          </button>
          <button
            onClick={() => setCurrentIndex(prev => Math.min(filteredRecipes.length - 1, prev + 1))}
            disabled={currentIndex === filteredRecipes.length - 1}
            className={`flex-1 px-2 py-2 rounded border border-black text-xs sm:text-sm font-bold transition-colors text-center ${currentIndex === filteredRecipes.length - 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-seafoam text-maineBlue hover:bg-maineBlue hover:text-seafoam'}`}
          >
            <span className="hidden sm:inline">{t('myPipeBook.next')}</span>
            <span className="sm:hidden">{t('myPipeBook.next')} →</span>
          </button>
          <button
            onClick={async () => {
              if (filteredRecipes.length === 0) return;
              try {
                const recipeId = filteredRecipes[currentIndex].id;
                await removeRecipeFromPipeBook(user?.id!, recipeId);
                setLocalRecipes(fits.filter(r => r.id !== recipeId));
                setCurrentIndex(0);
              } catch (err) {
                console.error('Error deleting fit:', err);
                setError('Failed to delete fit');
              }
            }}
            disabled={filteredRecipes.length === 0}
            className={`flex-1 px-2 py-2 rounded border border-black text-xs sm:text-sm font-bold transition-colors text-center ${filteredRecipes.length === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-lobsterRed text-weatheredWhite hover:bg-red-800'}`}
            title={t('myPipeBook.deleteRecipe')}
          >
            🗑️ {t('myPipeBook.remove')}
          </button>
          <button
            onClick={() => {
              if (filteredRecipes.length === 0) return;
              setRecipeToShare(filteredRecipes[currentIndex]);
              setShowShareModal(true);
            }}
            disabled={filteredRecipes.length === 0}
            className={`flex-1 px-2 py-2 rounded border border-black text-xs sm:text-sm font-bold transition-colors text-center ${filteredRecipes.length === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-maineBlue text-seafoam hover:bg-seafoam hover:text-maineBlue'}`}
          >
            Share
          </button>
        </div>
      </div>
      {/* Fit Count */}
      {filteredRecipes.length > 0 && (
        <div className="text-sm text-gray-500 mb-4">
          {`${t('myPipeBook.recipe')} ${currentIndex + 1} ${t('myPipeBook.of')} ${filteredRecipes.length}`}
        </div>
      )}


      {/* Digital PipeBook - Single Fit */}
      <div className="mt-4">
        {filteredRecipes.length === 0 ? (
          <div className="col-span-2 text-gray-400 italic text-center py-8">
            {fits.length === 0 
              ? t('myPipeBook.noRecipesYet')
              : 'No fits match your search criteria.'}
          </div>
        ) : (
          <div 
            className="relative h-[385px] sm:h-[350px] md:h-[315px] w-full [perspective:1000px] cursor-pointer"
            onClick={() => setFlipped(!flipped)}
          >
            <div 
              className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
            >
              {/* Front */}
              <div className="absolute inset-0 bg-white p-2 sm:p-3 rounded-lg shadow-lg border-4 border-maineBlue flex flex-col items-center [backface-visibility:hidden]">
                {filteredRecipes[currentIndex].photo && (
                  <img 
                    src={filteredRecipes[currentIndex].photo} 
                    alt={filteredRecipes[currentIndex].name} 
                    className="w-full h-20 sm:h-24 object-cover rounded-lg mb-1 border-2 border-gray-200"
                  />
                )}
                <h3 className="text-sm sm:text-base md:text-lg font-bold mb-1 text-center text-maineBlue">{filteredRecipes[currentIndex].name}</h3>
                <div className="flex-1 flex flex-col justify-center w-full px-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 w-full">
                    {/* Materials */}
                    <div className="bg-seafoam/20 p-1.5 rounded-lg text-center border-2 border-seafoam">
                      <h4 className="font-bold mb-0.5 text-xs sm:text-sm text-maineBlue">🥘🔧 {t('myPipeBook.ingredients')}</h4>
                      <ul className="list-disc pl-3 max-h-[50px] sm:max-h-[60px] overflow-y-auto text-left text-[10px] sm:text-xs space-y-0">
                        {filteredRecipes[currentIndex].materials?.slice(0, 6).map((material, i) => (
                          <li key={i} className="line-clamp-1">{material}</li>
                        ))}
                        {(filteredRecipes[currentIndex].materials?.length || 0) > 6 && (
                          <li className="text-gray-600 italic font-semibold">+{(filteredRecipes[currentIndex].materials?.length || 0) - 6} {t('myPipeBook.more')}</li>
                        )}
                      </ul>
                    </div>
                    
                    {/* Equipment */}
                    <div className="bg-amber-50 p-1.5 rounded-lg text-center border-2 border-amber-300">
                      <h4 className="font-bold mb-0.5 text-xs sm:text-sm text-amber-900">🔪🛠️ {t('myPipeBook.equipment')}</h4>
                      <ul className="list-disc pl-3 max-h-[50px] sm:max-h-[60px] overflow-y-auto text-left text-[10px] sm:text-xs space-y-0">
                        {filteredRecipes[currentIndex].equipment?.slice(0, 4).map((item, i) => (
                          <li key={i} className="line-clamp-1">{item}</li>
                        ))}
                        {(filteredRecipes[currentIndex].equipment?.length || 0) > 4 && (
                          <li className="text-gray-600 italic font-semibold">+{(filteredRecipes[currentIndex].equipment?.length || 0) - 4} {t('myPipeBook.more')}</li>
                        )}
                      </ul>
                    </div>
                    
                    {/* Compliance Tags */}
                    <div className="bg-green-50 p-1.5 rounded-lg text-center border-2 border-green-300">
                      <h4 className="font-bold mb-0.5 text-xs sm:text-sm text-green-900">🥗🔧 {t('myPipeBook.healthTags')}</h4>
                      <div className="flex flex-wrap gap-1 justify-center max-h-[50px] sm:max-h-[60px] overflow-y-auto">
                        {filteredRecipes[currentIndex].complianceTags?.slice(0, 4).map((tag: any) => (
                          <span key={tag} className="bg-green-200 text-green-900 px-2 py-1 rounded-full text-xs font-semibold border border-green-400">
                            {tag}
                          </span>
                        )) || (
                          <span className="text-xs text-gray-500">{t('myPipeBook.noHealthTags')}</span>
                        )}
                        {(filteredRecipes[currentIndex].complianceTags?.length || 0) > 4 && (
                          <span className="text-xs text-gray-600 font-semibold">+{(filteredRecipes[currentIndex].complianceTags?.length || 0) - 4}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-1 text-[10px] sm:text-xs text-gray-600 text-center font-semibold bg-gray-100 px-3 py-1 rounded-full border border-gray-300">
                  {t('myPipeBook.tapToFlip')}
                </div>
              </div>
              
              {/* Back */}
              <div className="absolute inset-0 h-full w-full rounded-lg bg-white p-2 sm:p-3 shadow-lg border-4 border-lobsterRed [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col">
                <h3 className="text-sm sm:text-base md:text-lg font-bold mb-1 text-center text-lobsterRed border-b-2 border-lobsterRed pb-1">{filteredRecipes[currentIndex].name}</h3>
                <div className="flex-grow overflow-y-auto px-1">
                  <h4 className="font-bold mb-1 text-xs sm:text-sm text-maineBlue">📋 {t('myPipeBook.instructions')}</h4>
                  <p className="whitespace-pre-wrap text-[10px] sm:text-xs leading-snug">{filteredRecipes[currentIndex].instructions}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Plumber of the Day Quote - simplified text only */}
      <div className="mt-3 text-center text-sm">
        {(() => {
          const quoteOfDay = getPlumberQuoteOfTheDay(currentLanguage);
          return (
            <span className="italic">"{quoteOfDay.quote}" <span className="not-italic text-gray-600">— {quoteOfDay.professional}</span></span>
          );
        })()}
      </div>
        </div>
        </div>
        
        {/* Collections Library - Right Side */}
        <div className={`lg:w-[28.333%] lg:h-full ${
          activeMobileTab === 'collections' ? 'block' : 'hidden lg:block'
        }`}>
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue overflow-hidden w-full h-full lg:min-h-[620px] flex flex-col">
            <div className="p-4 bg-seafoam text-maineBlue font-retro text-center">
              <h3 className="text-xl">📚 {t('myPipeBook.collectionsLibrary')}</h3>
            </div>
            
            <div className="p-4 flex-1 min-h-0 overflow-y-auto">
              {/* Existing Collections Section */}
              <div className="mb-6">
                
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-2 bg-gray-50">
                  {collections.map(collection => (
                    <div 
                      key={collection.id} 
                      onClick={() => handleViewCollection(collection)}
                      className="py-2 px-2 hover:bg-sand rounded cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <span className="mr-2">{collection.emoji}</span>
                        <span className="text-sm">{collection.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-seafoam px-2 py-1 rounded-full">
                        {collection.fits.length}
                      </span>
                    </div>
                  ))}
                  {collections.length === 0 && (
                    <div className="py-4 text-center text-gray-500 text-sm italic">
                      {t('myPipeBook.noCollectionsYet')}
                    </div>
                  )}
                </div>
              </div>

              {/* Create Collection Section */}
              <div className="mb-6">
                <div className="space-y-2">
                  {fits.length > 0 ? (
                    <>
                    
                    <div className="h-40 overflow-y-scroll border border-gray-300 rounded p-2">
                      {fits.map((fit) => (
                        <div key={fit.id} className="flex items-center justify-between p-2 hover:bg-sand rounded">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`fit-${fit.id}`}
                              checked={selectedRecipes.includes(fit.id)}
                              onChange={() => handleRecipeSelect(fit.id)}
                              className="mr-3 w-4 h-4 text-maineBlue bg-gray-100 border-gray-300 rounded focus:ring-maineBlue focus:ring-2"
                            />
                            <label htmlFor={`fit-${fit.id}`} className="text-sm cursor-pointer">
                              {fit.name}
                            </label>
                          </div>
                          <div className="flex gap-1">
                            {fit.complianceTags && fit.complianceTags.length > 0 && (
                              <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                                🔧
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    </>
                  ) : (
                    <div className="text-center py-4 mb-3">
                      <div className="text-4xl mb-2">📝</div>
                      <p className="text-gray-500 text-sm">{t('myPipeBook.addRecipesFirst')}</p>
                    </div>
                  )}

                </div>
              </div>
            </div>
            <div className="sticky bottom-0 z-20 flex-shrink-0 bg-white p-4 pt-2 shadow-[0_-6px_12px_rgba(255,255,255,0.95)]">
              {/* Create Collection Button - Always visible */}
              <button
                type="button"
                onClick={() => setShowCreateCollectionModal(true)}
                className="w-full mt-2 px-4 py-2 rounded border transition-colors bg-seafoam text-maineBlue border-maineBlue hover:bg-maineBlue hover:text-seafoam"
              >
                {t('myPipeBook.createCollectionSelected', { count: selectedRecipes.length }).replace('{count}', selectedRecipes.length.toString())}
              </button>

              {/* View Gradebook Button - Always visible */}
              <button
                type="button"
                onClick={handleOpenGradebook}
                className="w-full mt-2 px-4 py-2 rounded border transition-colors bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 hover:text-emerald-800"
              >
                📊 {t('myPipeBook.viewGradebook')}
              </button>

              {/* My Portfolio Button - Always visible */}
              <button
                type="button"
                onClick={async () => {
                  setShowVideoLibraryModal(true);
                  setLoadingVideos(true);
                  try {
                    // Get list of all user folders (to find all users with videos)
                    const { data: folders, error: foldersError } = await supabase.storage
                      .from('Practice Videos')
                      .list('', {
                        limit: 1000,
                        offset: 0
                      });

                    if (foldersError) throw foldersError;

                    // For each user folder, get their videos
                    const allVideos: Array<{name: string, url: string, created_at: string, userId: string, isPublic: boolean}> = [];

                    for (const folder of folders || []) {
                      if (folder.name) {
                        const { data: userVideos, error: videosError } = await supabase.storage
                          .from('Practice Videos')
                          .list(folder.name, {
                            limit: 100,
                            offset: 0,
                            sortBy: { column: 'created_at', order: 'desc' }
                          });

                        if (!videosError && userVideos) {
                          for (const file of userVideos) {
                            // Get file metadata to check if public
                            const isPublic = file.metadata?.isPublic === 'true';
                            const isMyVideo = folder.name === user?.id;

                            // Show if: public OR it's my video
                            if (isPublic || isMyVideo) {
                              const { data: urlData } = supabase.storage
                                .from('Practice Videos')
                                .getPublicUrl(`${folder.name}/${file.name}`);

                              allVideos.push({
                                name: file.name,
                                url: urlData.publicUrl,
                                created_at: file.created_at || new Date().toISOString(),
                                userId: folder.name,
                                isPublic: isPublic
                              });
                            }
                          }
                        }
                      }
                    }

                    // Sort by date
                    allVideos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    setSavedVideos(allVideos);
                  } catch (error) {
                    console.error('Error loading videos:', error);
                    console.error(t('myPipeBook.failedToLoadVideos', { defaultValue: 'Failed to load videos' }));
                  } finally {
                    setLoadingVideos(false);
                  }
                }}
                className="w-full mt-2 px-4 py-2 rounded border transition-colors bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200 hover:text-purple-800"
              >
                🗂️ My Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gradebook Modal - Book Style */}
      {showGradebookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCloseGradebook}>
          <div className="relative w-full max-w-5xl mx-auto flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {(students.length === 0 || assignments.length === 0) ? (
              <div className="bg-white rounded-lg p-12 text-center shadow-2xl border-4 border-black">
                <div className="text-5xl mb-4">📊</div>
                <p className="text-gray-500 text-lg font-serif mb-4">No gradebook data yet.</p>
                <button onClick={handleCloseGradebook} className="px-6 py-2 bg-amber-800 text-amber-100 hover:bg-amber-900 rounded-full font-bold">Close</button>
              </div>
            ) : (<>
            {/* Book Container */}
            <div className="relative w-full">
              {/* Book - Responsive: Stack on mobile, side-by-side on desktop */}
              <div className="relative w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg shadow-2xl border-4 border-black flex flex-col">
                
                {/* Book Spine Shadow - Hidden on mobile */}
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-4 bg-gradient-to-r from-amber-900 to-amber-700 transform -translate-x-1/2 z-10 rounded-sm shadow-inner"></div>
                
                {/* Pages Container - Flex column on mobile, row on desktop */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                  {/* Left Page - Grading & Feedback */}
                  <div className="w-full lg:w-1/2 h-1/2 lg:h-full bg-white border-b lg:border-b-0 lg:border-r-2 border-gray-300 rounded-t-lg lg:rounded-t-none lg:rounded-l-lg p-3 lg:p-4 overflow-y-auto flex flex-col">
                    
                    {/* Grading Rubric */}
                    <div className="bg-white border-2 lg:border-4 border-green-500 rounded-lg p-2 lg:p-3 mb-2 shadow-sm flex-shrink-0">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                        <h4 className="font-serif font-bold text-emerald-800 text-sm lg:text-xs">📊 {t('myPipeBook.rubric')}</h4>
                      <select 
                        className="bg-white border border-emerald-300 rounded px-2 py-1 text-xs font-serif"
                        value={currentStudentIndex}
                        onChange={(e) => setCurrentStudentIndex(Number(e.target.value))}
                      >
                        {students.map((student, index) => (
                          <option key={student.id} value={index}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                      <div className="grid grid-cols-2 gap-1 lg:gap-1">
                        {/* Technique Score */}
                        <div className="bg-white/60 p-2 lg:p-1 rounded border border-emerald-200">
                          <div className="text-xs font-medium text-emerald-900 mb-1">{t('myPipeBook.technique')} (25)</div>
                          <select className="w-full text-xs border border-emerald-300 rounded px-1 py-1 lg:py-0.5 bg-white min-h-[32px] lg:min-h-0">
                          <option value="">{t('myPipeBook.score')}</option>
                          <option value="25">A (23-25)</option>
                          <option value="22">B (20-22)</option>
                          <option value="19">C (17-19)</option>
                          <option value="16">D (15-16)</option>
                          <option value="10">F (0-14)</option>
                        </select>
                      </div>

                        {/* Safety Score */}
                        <div className="bg-white/60 p-2 lg:p-1 rounded border border-emerald-200">
                          <div className="text-xs font-medium text-emerald-900 mb-1">{t('myPipeBook.safety')} (25)</div>
                          <select className="w-full text-xs border border-emerald-300 rounded px-1 py-1 lg:py-0.5 bg-white min-h-[32px] lg:min-h-0">
                          <option value="">{t('myPipeBook.score')}</option>
                          <option value="25">A (23-25)</option>
                          <option value="22">B (20-22)</option>
                          <option value="19">C (17-19)</option>
                          <option value="16">D (15-16)</option>
                          <option value="10">F (0-14)</option>
                        </select>
                      </div>

                        {/* Consistency Score */}
                        <div className="bg-white/60 p-2 lg:p-1 rounded border border-emerald-200">
                          <div className="text-xs font-medium text-emerald-900 mb-1">{t('myPipeBook.consistency')} (25)</div>
                          <select className="w-full text-xs border border-emerald-300 rounded px-1 py-1 lg:py-0.5 bg-white min-h-[32px] lg:min-h-0">
                          <option value="">{t('myPipeBook.score')}</option>
                          <option value="25">A (23-25)</option>
                          <option value="22">B (20-22)</option>
                          <option value="19">C (17-19)</option>
                          <option value="16">D (15-16)</option>
                          <option value="10">F (0-14)</option>
                        </select>
                      </div>

                        {/* Presentation Score */}
                        <div className="bg-white/60 p-2 lg:p-1 rounded border border-emerald-200">
                          <div className="text-xs font-medium text-emerald-900 mb-1">{t('myPipeBook.presentation')} (25)</div>
                          <select className="w-full text-xs border border-emerald-300 rounded px-1 py-1 lg:py-0.5 bg-white min-h-[32px] lg:min-h-0">
                          <option value="">{t('myPipeBook.score')}</option>
                          <option value="25">A (23-25)</option>
                          <option value="22">B (20-22)</option>
                          <option value="19">C (17-19)</option>
                          <option value="16">D (15-16)</option>
                          <option value="10">F (0-14)</option>
                        </select>
                      </div>
                    </div>

                      {/* Total Score */}
                      <div className="mt-2 pt-2 border-t border-emerald-300 text-center py-2 lg:py-3">
                        <span className="text-base lg:text-xl font-bold text-red-600">
                          <span className="block lg:inline">{t('myPipeBook.total')}: {(mockGrades as any)[students[currentStudentIndex].id]?.[assignments[currentAssignmentPage].id]?.total || '--'} / 100</span>
                          <span className="hidden lg:inline"> | </span>
                          <span className="block lg:inline">{t('myPipeBook.grade')}: {(mockGrades as any)[students[currentStudentIndex].id]?.[assignments[currentAssignmentPage].id]?.grade || '--'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Instructor Feedback */}
                    <div className="bg-white border-2 lg:border-4 border-yellow-500 rounded-lg p-2 lg:p-3 mb-2 shadow-sm flex-shrink-0">
                      <h4 className="font-serif font-bold text-amber-800 mb-1 lg:mb-2 text-sm">💬 {t('myPipeBook.feedback')}</h4>
                      
                      <textarea 
                        placeholder={t('myPipeBook.feedbackPlaceholder')}
                        className="w-full h-16 lg:h-14 text-xs border border-amber-300 rounded p-2 bg-white/80 resize-none focus:border-amber-500 focus:outline-none"
                      />

                      <div className="mt-2 flex space-x-2">
                        <button className="flex-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 lg:px-3 lg:py-2 rounded text-xs hover:bg-emerald-200 transition-all">
                          💾 {t('myPipeBook.save')}
                        </button>
                        <button className="flex-1 bg-blue-100 text-blue-800 border border-blue-300 px-2 py-1 lg:px-3 lg:py-2 rounded text-xs hover:bg-blue-200 transition-all">
                          📧 {t('myPipeBook.send')}
                        </button>
                    </div>
                  </div>

                    {/* Saved Feedback Notepad */}
                    <div className="bg-white border-2 lg:border-4 border-amber-700 rounded-lg p-2 lg:p-3 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                      <h4 className="font-serif font-bold text-yellow-800 mb-2 text-sm border-b border-yellow-300 pb-1">📝 {t('myPipeBook.savedFeedbackNotes')}</h4>
                    
                    <div className="bg-white/80 rounded border border-yellow-200 p-2 flex-1 overflow-y-auto">
                      <div className="space-y-2 text-xs">
                        <div className="border-b border-gray-200 pb-2">
                          <div className="font-medium text-gray-700 mb-1">Oct 28, 2024 - 2:15 PM</div>
                          <div className="text-gray-600">
                            "Great improvement on pipe cutter control and fitting prep. Your cut quality was much more consistent than last week. 
                            Focus on dry-fitting before cementing each joint. Overall excellent progress."
                          </div>
                        </div>
                        
                        <div className="border-b border-gray-200 pb-2">
                          <div className="font-medium text-gray-700 mb-1">Oct 21, 2024 - 1:45 PM</div>
                          <div className="text-gray-600">
                            "Good torch and ventilation awareness throughout the demo. Work on leak checking each connection more consistently 
                            before final startup. Your staging and cleanup were excellent."
                          </div>
                        </div>

                        <div className="border-b border-gray-200 pb-2">
                          <div className="font-medium text-gray-700 mb-1">Oct 14, 2024 - 3:20 PM</div>
                          <div className="text-gray-600">
                            "First rough-in assessment - showing natural talent! Remember to confirm pitch with a level on 
                            every long run for better drainage. Practice the measure-cut-deburr flow we discussed."
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Right Page - Assignment Fit Card */}
                  <div className="w-full lg:w-1/2 h-1/2 lg:h-full bg-white rounded-b-lg lg:rounded-b-none lg:rounded-r-lg p-3 lg:p-4 flex flex-col">
                    {/* Assignment Fit Card (matching PlumbingSchool layout) */}
                    <div className="flex flex-col bg-white w-full h-full overflow-hidden rounded-lg border-4 border-maineBlue">
                      {/* Assignment Image */}
                      <div className="w-full h-20 lg:h-24 bg-gray-100 flex items-center justify-center border-b-2 border-amber-300 flex-shrink-0">
                        <div className="text-center">
                          <div className="text-2xl lg:text-3xl mb-1">{assignments[currentAssignmentPage].emoji}</div>
                          <div className="text-xs font-bold text-amber-800">{assignments[currentAssignmentPage].week} {t('myPipeBook.assignment')}</div>
                        </div>
                      </div>

                      {/* Assignment Details */}
                      <div className="p-2 lg:p-3 bg-white text-center flex-1 overflow-y-auto flex flex-col">
                        {/* Dividing Line */}
                        <hr className="border-t-2 border-amber-300 mb-3" />
                        
                        <h3 className="font-bold text-base lg:text-lg mb-2 text-maineBlue">{assignments[currentAssignmentPage].title}</h3>
                        <div className="text-xs text-gray-600 mb-2 lg:mb-4">
                          <span className="block lg:inline">{t('myPipeBook.due')}: {assignments[currentAssignmentPage].dueDate}</span>
                          <span className="hidden lg:inline"> | </span>
                          <span className="block lg:inline">{assignments[currentAssignmentPage].points} pts | {assignments[currentAssignmentPage].weight}</span>
                        </div>
                        
                        <div className="space-y-1 lg:space-y-2 flex-shrink-0">
                          <div>
                            <div className="font-semibold mb-1 text-sm text-amber-800">{t('myPipeBook.requiredTechniques')}</div>
                            <div className="text-xs text-gray-700 leading-tight">
                              {assignments[currentAssignmentPage].techniques.join(' • ')}
                            </div>
                          </div>

                          <div>
                            <div className="font-semibold mb-1 text-sm text-amber-800">{t('myPipeBook.submission')}</div>
                            <div className="text-xs text-gray-700 leading-tight">
                              {assignments[currentAssignmentPage].submission.join(' • ')}
                            </div>
                          </div>

                          <div>
                            <div className="font-semibold mb-1 text-sm text-amber-800">{t('myPipeBook.objectives')}</div>
                            <div className="text-xs text-gray-700 leading-tight">
                              {assignments[currentAssignmentPage].objectives.join(' • ')}
                            </div>
                          </div>
                        </div>

                        {/* Dividing Line */}
                        <hr className="border-t-2 border-amber-300 my-3" />

                        {/* Student Submission Video */}
                        <div className="text-center mt-2 flex-1 flex flex-col min-h-0">
                          <div className="flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2 mb-2 flex-shrink-0">
                            <h4 className="font-serif font-semibold text-amber-800 text-sm">{students[currentStudentIndex].name} - {t('myPipeBook.submission')}</h4>
                            <select 
                              className={`text-xs border border-amber-300 rounded px-2 py-1 font-serif ${
                                (students[currentStudentIndex].submittedVideos as any)[assignments[currentAssignmentPage].id] ? 'bg-green-50 text-green-800 cursor-not-allowed' : 'bg-white'
                              }`}
                              onChange={(e) => {
                                if (e.target.value && !(students[currentStudentIndex].submittedVideos as any)[assignments[currentAssignmentPage].id]) {
                                  setSelectedVideoOption(e.target.value);
                                  setShowVideoConfirmModal(true);
                                }
                              }}
                              value={(students[currentStudentIndex].submittedVideos as any)[assignments[currentAssignmentPage].id] || ""}
                              disabled={!!(students[currentStudentIndex].submittedVideos as any)[assignments[currentAssignmentPage].id]}
                            >
                              <option value="">{t('myPipeBook.selectVideo')}</option>
                              <option value="pipe-layout-demo">Pipe Layout Demo.mp4</option>
                              <option value="dwv-assembly-demo">DWV Assembly Demo.mp4</option>
                              <option value="water-heater-demo">Protein Cookery.mp4</option>
                              <option value="plating-final">Final Commissioning.mp4</option>
                            </select>
                          </div>
                          <div className="bg-gray-900 rounded-lg overflow-hidden border border-amber-300 relative flex-1 min-h-[150px]">
                            <div className="h-full bg-gray-800 flex items-center justify-center">
                              <div className="text-center text-white p-2">
                                <div className="text-xs">{assignments[currentAssignmentPage].videoTitle}</div>
                                <div className="text-xs text-gray-300 mt-1 hidden lg:block">{t('myPipeBook.submittedVia')}</div>
                              </div>
                            </div>
                            <button 
                              onClick={() => setShowVideoModal(true)}
                              className="absolute inset-0 w-full h-full bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center"
                            >
                              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <div className="text-white text-2xl">▶️</div>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Controls - Touch-friendly sizing */}
                <button 
                  onClick={() => setCurrentAssignmentPage(prev => prev > 0 ? prev - 1 : assignments.length - 1)}
                  className="absolute left-2 lg:left-4 top-1/2 transform -translate-y-1/2 bg-maineBlue text-white hover:bg-blue-700 w-11 h-11 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-lg z-20 transition-colors"
                >
                  ‹
                </button>
                
                <button 
                  onClick={() => setCurrentAssignmentPage(prev => prev < assignments.length - 1 ? prev + 1 : 0)}
                  className="absolute right-2 lg:right-4 top-1/2 transform -translate-y-1/2 bg-maineBlue text-white hover:bg-blue-700 w-11 h-11 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-lg z-20 transition-colors"
                >
                  ›
                </button>

                {/* Page Indicator */}
                <div className="absolute bottom-2 lg:bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-xs lg:text-sm z-20">
                  {currentAssignmentPage + 1} of {assignments.length}
                </div>


                {/* Close Button - Touch-friendly */}
                <button 
                  onClick={handleCloseGradebook}
                  className="absolute top-2 right-2 lg:top-4 lg:right-4 bg-amber-800 text-amber-100 hover:bg-amber-900 w-11 h-11 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-lg z-20 transition-colors"
                >
                  ×
                </button>

                {/* Book Binding Details - Hidden on mobile */}
                <div className="hidden lg:block absolute left-1/2 top-4 transform -translate-x-1/2 w-8 h-8 bg-amber-900 rounded-full shadow-inner z-20"></div>
                <div className="hidden lg:block absolute left-1/2 bottom-4 transform -translate-x-1/2 w-8 h-8 bg-amber-900 rounded-full shadow-inner z-20"></div>
              </div>
            </div>
            </>)}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowVideoModal(false)}>
          <div className="relative max-w-4xl w-[90%] mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg overflow-hidden shadow-2xl border-4 border-black">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 relative">
                <div className="text-center">
                  <h3 className="text-lg font-bold">{students[currentStudentIndex].name} - {assignments[currentAssignmentPage].videoTitle}</h3>
                  <p className="text-sm opacity-90">{assignments[currentAssignmentPage].week}: {assignments[currentAssignmentPage].title}</p>
                </div>
                <button 
                  onClick={() => setShowVideoModal(false)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              {/* Video Player */}
              <div className="p-4 bg-gray-100">
                <div className="bg-black aspect-video flex items-center justify-center border-2 border-gray-400 rounded-lg overflow-hidden shadow-lg">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-4">▶️</div>
                    <div className="text-xl mb-2">{assignments[currentAssignmentPage].videoTitle}</div>
                    <div className="text-sm text-gray-300">{t('myPipeBook.clickToPlay')}</div>
                    <div className="text-xs text-gray-400 mt-2">{t('myPipeBook.submittedVia')}</div>
                  </div>
                </div>
              </div>
              
              {/* Video Controls/Info */}
              <div className="p-4 bg-gray-50">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Assignment Due: {assignments[currentAssignmentPage].dueDate}</span>
                  <span>Worth: {assignments[currentAssignmentPage].points} points ({assignments[currentAssignmentPage].weight})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Confirmation Modal */}
      {showVideoConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl border-4 border-black max-w-md w-[90%] mx-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 text-center">
              <h3 className="text-lg font-bold">Confirm Video Submission</h3>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">📹</div>
              <p className="text-gray-700 mb-2">Are you sure you want to submit:</p>
              <p className="font-bold text-maineBlue mb-4">
                {selectedVideoOption === 'pipe-layout-demo' && 'Pipe Layout Demo.mp4'}
                {selectedVideoOption === 'dwv-assembly-demo' && 'DWV Assembly Demo.mp4'}
                {selectedVideoOption === 'water-heater-demo' && 'Protein Cookery.mp4'}
                {selectedVideoOption === 'plating-final' && 'Final Commissioning.mp4'}
              </p>
              <p className="text-sm text-gray-600 mb-6">
                For: {assignments[currentAssignmentPage].week} - {assignments[currentAssignmentPage].title}
              </p>
              
              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowVideoConfirmModal(false);
                    setSelectedVideoOption('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded border hover:bg-gray-300 transition-colors"
                >
                  No, Cancel
                </button>
                <button
                  onClick={() => {
                    // Set the submitted video for this specific assignment
                    setSubmittedVideos(prev => ({
                      ...prev,
                      [assignments[currentAssignmentPage].id]: selectedVideoOption
                    }));
                    setShowVideoConfirmModal(false);
                    setSelectedVideoOption('');
                    // Could show success message here
                  }}
                  className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors"
                >
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Library Modal */}
      {showVideoLibraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowVideoLibraryModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl border-4 border-black w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-purple-100 border-b-4 border-purple-400 p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-purple-800 font-retro">🗂️ My Portfolio</h2>
                  <p className="text-purple-600 mt-1">Your evidence library — videos, projects & work sessions</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const data = savedVideos.map(v => ({ name: v.name.replace('.webm', ''), recorded: v.created_at, visibility: v.isPublic ? 'Public' : 'Private', url: v.url }));
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = 'my-portfolio.json';
                      link.click();
                      URL.revokeObjectURL(link.href);
                    }}
                    className="bg-purple-600 text-white font-retro font-bold px-4 py-2 rounded-lg text-sm hover:bg-purple-800 transition-colors whitespace-nowrap"
                  >
                    ⬇ Download Portfolio
                  </button>
                  <button
                    onClick={() => {
                      setSkillsWalletTarget(null);
                      setSkillsWalletSkillName('');
                      setSkillsWalletSuccess(false);
                      setSkillsWalletNotes('');
                      setSkillsWalletDestination('');
                      setSkillsWalletGovState('');
                      setShowSkillsWalletModal(true);
                    }}
                    className="bg-maineBlue text-white font-retro font-bold px-4 py-2 rounded-lg text-sm hover:bg-seafoam hover:text-maineBlue transition-colors whitespace-nowrap"
                  >
                    + Skills Wallet
                  </button>
                  <button
                    onClick={() => setShowVideoLibraryModal(false)}
                    className="text-purple-600 hover:text-purple-800 text-3xl font-bold leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {/* Filter Dropdowns */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-purple-700 font-bold text-sm">{t('myPipeBook.category')}:</label>
                  <select
                    value={videoFilter}
                    onChange={(e) => setVideoFilter(e.target.value)}
                    className="border-2 border-purple-300 rounded-lg px-4 py-2 bg-white text-purple-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">{t('myPipeBook.allVideos')}</option>
                    <option value="practice">{t('myPipeBook.practiceSessions')}</option>
                    <option value="assignments">{t('myPipeBook.assignmentSubmissions')}</option>
                    <option value="demos">{t('myPipeBook.demoRecordings')}</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-purple-700 font-bold text-sm">{t('myPipeBook.user')}:</label>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="border-2 border-purple-300 rounded-lg px-4 py-2 bg-white text-purple-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">{t('myPipeBook.allUsers', { defaultValue: 'All Users' })}</option>
                    <option value="me">{t('myPipeBook.myVideosOnly', { defaultValue: 'My Videos Only' })}</option>
                    <option value="public">{t('myPipeBook.publicVideosOnly', { defaultValue: 'Public Videos Only' })}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Video Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingVideos ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎬</div>
                  <p className="text-gray-600">{t('myPipeBook.loadingYourVideos')}</p>
                </div>
              ) : savedVideos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎥</div>
                  <p className="text-gray-600 text-lg">{t('myPipeBook.noVideosSaved')}</p>
                  <p className="text-gray-500 text-sm mt-2">{t('myPipeBook.recordInTestKitchen')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedVideos
                    .filter(video => {
                      // User filter
                      if (userFilter === 'me' && video.userId !== user?.id) return false;
                      if (userFilter === 'public' && !video.isPublic) return false;
                      
                      // Category filter - placeholder for future enhancement
                      if (videoFilter === 'all') return true;
                      // Can be enhanced with actual category metadata
                      return true;
                    })
                    .map((video, index) => (
                    <div 
                      key={index} 
                      onClick={() => {
                        setSelectedLibraryVideo(video);
                        setShowLibraryVideoModal(true);
                      }}
                      className="border-4 border-purple-300 rounded-lg bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer hover:border-purple-500"
                    >
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-4xl">🔧</div>
                          <div className="flex-1">
                            <h3 className="font-bold text-purple-800 text-lg">{video.name.replace('.webm', '')}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-purple-600">
                                {new Date(video.created_at).toLocaleDateString()} at {new Date(video.created_at).toLocaleTimeString()}
                              </p>
                              {video.isPublic ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">🌍 {t('myPipeBook.public')}</span>
                              ) : (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold">🔒 {t('myPipeBook.private')}</span>
                              )}
                            </div>
                            {video.userId !== user?.id && (
                              <p className="text-xs text-purple-500 mt-1">
                                👤 {t('myPipeBook.user')}: {video.userId.substring(0, 8)}...
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-2">
                          <div className="text-purple-600 text-2xl">▶️</div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSkillsWalletTarget(video);
                              setSkillsWalletSkillName(video.name.replace('.webm', ''));
                              setSkillsWalletSuccess(false);
                              setSkillsWalletNotes('');
                              setSkillsWalletDestination('');
                              setSkillsWalletGovState('');
                              setShowSkillsWalletModal(true);
                            }}
                            className="text-xs bg-maineBlue text-white px-2 py-1 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors whitespace-nowrap"
                          >
                            + Skills Wallet
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-purple-50 border-t-4 border-purple-400 p-4 text-center">
              <p className="text-purple-700 text-sm">
                <strong>{savedVideos.length}</strong> artifact{savedVideos.length !== 1 ? 's' : ''} in portfolio
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Library Video Playback Modal */}
      {showLibraryVideoModal && selectedLibraryVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]" onClick={() => setShowLibraryVideoModal(false)}>
          <div className="relative max-w-3xl w-[90%] mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg overflow-hidden shadow-2xl border-4 border-black">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 relative">
                <div className="text-center">
                  <h3 className="text-xl font-bold">{selectedLibraryVideo.name.replace('.webm', '')}</h3>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <p className="text-sm opacity-90">
                      {new Date(selectedLibraryVideo.created_at).toLocaleDateString()} at {new Date(selectedLibraryVideo.created_at).toLocaleTimeString()}
                    </p>
                    {selectedLibraryVideo.isPublic ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">🌍 {t('myPipeBook.public')}</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold">🔒 {t('myPipeBook.private')}</span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setShowLibraryVideoModal(false)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="p-6 bg-gray-100">
                <video
                  src={selectedLibraryVideo.url}
                  controls
                  autoPlay
                  className="w-full rounded-lg border-4 border-black shadow-lg"
                  style={{ maxHeight: '70vh' }}
                >
                  Your browser does not support video playback.
                </video>
              </div>
              <div className="p-4 bg-purple-50 border-t-4 border-black">
                <div className="text-center text-purple-700 text-sm">
                  {selectedLibraryVideo.userId !== user?.id && (
                    <p>👤 {t('myPipeBook.uploadedBy', { defaultValue: 'Uploaded by' })}: {selectedLibraryVideo.userId.substring(0, 8)}...</p>
                  )}
                  <p className="mt-1">🎥 {t('myPipeBook.recordedInWorkspace')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skills Wallet Claim Modal */}
      {showSkillsWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4" onClick={() => { setShowSkillsWalletModal(false); setSkillsWalletSuccess(false); setSkillsWalletClaimId(null); }}>
          <div className="bg-white rounded-xl shadow-2xl border-4 border-maineBlue w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="bg-maineBlue text-white px-5 py-4 rounded-t-lg flex items-center justify-between">
              <span className="font-retro font-bold text-lg">💼 Add to Skills Wallet</span>
              <button onClick={() => { setShowSkillsWalletModal(false); setSkillsWalletSuccess(false); setSkillsWalletClaimId(null); }} className="text-white text-2xl font-bold hover:text-seafoam leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-maineBlue mb-1">Send To <span className="font-normal text-gray-400">(required)</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'credivera', label: 'Credivera', logo: 'https://www.google.com/s2/favicons?domain=credivera.com&sz=64', comingSoon: true },
                    { id: 'iq4', label: 'IQ4', logo: 'https://www.google.com/s2/favicons?domain=iq4.com&sz=64', comingSoon: true },
                    { id: 'velocity', label: 'Velocity', logo: 'https://www.google.com/s2/favicons?domain=velocitycareerlabs.com&sz=64', comingSoon: true },
                    { id: 'territorium', label: 'Territorium', logo: 'https://www.google.com/s2/favicons?domain=territorium.com&sz=64', comingSoon: true },
                    { id: 'learncard', label: 'LearnCard', logo: 'https://www.google.com/s2/favicons?domain=learncard.app&sz=64' },
                    { id: 'government', label: 'Government', logo: null },
                  ].map(dest => (
                    <div key={dest.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => { if (!dest.comingSoon) { setSkillsWalletDestination(dest.id); setSkillsWalletLearnCardHandle(''); setSkillsWalletGovState(''); } }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-bold transition-colors ${dest.comingSoon ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50' : skillsWalletDestination === dest.id ? 'border-maineBlue bg-maineBlue text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-maineBlue hover:text-maineBlue'}`}
                      >
                        {dest.logo ? (
                          <img src={dest.logo} alt={dest.label} className="h-6 w-6 object-contain rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <span className="text-base leading-none">⚖️</span>
                        )}
                        {dest.label}
                      </button>
                      {dest.comingSoon && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded shadow">Coming Soon</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {skillsWalletDestination === 'learncard' && (
                <div>
                  <label className="block text-sm font-bold text-maineBlue mb-1">LearnCard Profile ID <span className="font-normal text-gray-400">(required)</span></label>
                  <input
                    type="text"
                    value={skillsWalletLearnCardHandle}
                    onChange={(e) => setSkillsWalletLearnCardHandle(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-maineBlue text-sm"
                    placeholder="e.g. @your-learncard-id"
                  />
                  <p className="text-xs text-gray-400 mt-1">Find this in your LearnCard app under My Account.</p>
                </div>
              )}
              {skillsWalletDestination === 'government' && (
                <div>
                  <label className="block text-sm font-bold text-maineBlue mb-1">Select State</label>
                  <select
                    value={skillsWalletGovState}
                    onChange={(e) => setSkillsWalletGovState(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-maineBlue text-sm"
                  >
                    <option value="">-- Select a State --</option>
                    <option value="Alabama">Alabama</option>
                    <option value="Arkansas">Arkansas</option>
                    <option value="California">California</option>
                    <option value="Colorado">Colorado</option>
                    <option value="Indiana">Indiana</option>
                    <option value="North Dakota">North Dakota</option>
                    <option value="Wyoming">Wyoming</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-maineBlue mb-1">Skill Name</label>
                <input
                  type="text"
                  value={skillsWalletSkillName}
                  onChange={(e) => setSkillsWalletSkillName(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-maineBlue text-sm"
                  placeholder="e.g. Knife Safety, Station Setup..."
                />
              </div>
              {skillsWalletTarget && (
                <div>
                  <label className="block text-sm font-bold text-maineBlue mb-1">Evidence</label>
                  <p className="text-xs text-gray-600 bg-sand rounded px-3 py-2 border border-gray-200 font-medium">
                    🎥 {skillsWalletTarget.name.replace('.webm', '')}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-maineBlue mb-1">Notes <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea
                  value={skillsWalletNotes}
                  onChange={(e) => setSkillsWalletNotes(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-maineBlue text-sm resize-none"
                  rows={3}
                  placeholder="Describe what this video demonstrates..."
                />
              </div>
              {skillsWalletSuccess ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border-2 border-green-400 rounded-lg px-4 py-3 text-center">
                    <p className="text-green-700 font-bold text-sm">✅ Skill claim saved!</p>
                  </div>
                  {skillsWalletClaimId && (
                    <div className="space-y-2">
                      {'share' in navigator ? (
                        <button
                          onClick={() => (navigator as any).share({
                            title: skillsWalletSkillName,
                            text: `Check out my proof-of-work for: ${skillsWalletSkillName}`,
                            url: `${window.location.origin}/evidence/${skillsWalletClaimId}`,
                          })}
                          className="w-full bg-maineBlue text-white font-retro font-bold py-3 rounded-lg hover:bg-seafoam hover:text-maineBlue transition-colors"
                        >
                          📤 Send to Wallet
                        </button>
                      ) : (
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 space-y-2">
                          <p className="text-xs font-bold text-maineBlue">📋 Copy your evidence link:</p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-white border border-gray-300 rounded px-2 py-1 flex-1 overflow-hidden text-ellipsis whitespace-nowrap block">
                              {`${window.location.origin}/evidence/${skillsWalletClaimId}`}
                            </code>
                            <button
                              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/evidence/${skillsWalletClaimId}`)}
                              className="text-xs bg-maineBlue text-white px-2 py-1 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors whitespace-nowrap"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setShowSkillsWalletModal(false);
                      setSkillsWalletSuccess(false);
                      setSkillsWalletSkillName('');
                      setSkillsWalletNotes('');
                      setSkillsWalletTarget(null);
                      setSkillsWalletDestination('');
                      setSkillsWalletGovState('');
                      setSkillsWalletLearnCardHandle('');
                      setSkillsWalletClaimId(null);
                    }}
                    className="w-full bg-gray-100 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    const { data, error } = await supabase.from('skill_claims').insert({
                      user_id: user?.id,
                      discipline: 'plumbing',
                      skill_name: skillsWalletSkillName.trim(),
                      video_url: skillsWalletTarget?.url || null,
                      video_name: skillsWalletTarget?.name || null,
                      notes: skillsWalletNotes || null,
                      destination: skillsWalletDestination,
                      is_public: true,
                      verified: false,
                    }).select('id').single();
                    if (!error && data) {
                      setSkillsWalletClaimId(data.id);
                      if (skillsWalletDestination === 'learncard' && skillsWalletLearnCardHandle.trim()) {
                        await issueLearnCardCredential({
                          recipientHandle: skillsWalletLearnCardHandle.trim(),
                          skillName: skillsWalletSkillName.trim(),
                          discipline: 'plumbing',
                          evidenceUrl: `${window.location.origin}/evidence/${data.id}`,
                        });
                      }
                    }
                    setSkillsWalletSuccess(true);
                  }}
                  disabled={!skillsWalletSkillName.trim() || !skillsWalletDestination || (skillsWalletDestination === 'government' && !skillsWalletGovState) || (skillsWalletDestination === 'learncard' && !skillsWalletLearnCardHandle.trim())}
                  className="w-full bg-maineBlue text-white font-retro font-bold py-3 rounded-lg hover:bg-seafoam hover:text-maineBlue transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  💼 Add to Skills Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPipeBook;
