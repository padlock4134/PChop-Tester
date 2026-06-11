import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFreddieContext } from '../../culinary/components/FreddieContext';
import { useRecipeContext } from '../../culinary/components/RecipeContext';
import { useNavigate } from 'react-router-dom';
import { fetchCookbook, removeRecipeFromCookbook } from './cookbookSupabase';
import { supabase } from '../api/supabaseClient';
import { XP_REWARDS } from '../services/xpService';
import { useLevelProgressContext } from '../components/NavBar';
import { useSupabase } from '../../../components/DisciplineSupabaseProvider';
import { isSessionValid } from '../api/userSession';

const electricalQuoteOfTheDay = {
  chef: 'Nikola Tesla',
  quote: 'Precision and persistence turn ideas into power.'
};

export function getChefQuoteOfTheDay() {
  return electricalQuoteOfTheDay;
}

export function getVideoQueriesForRecipe(recipe: Recipe): string[] {
  return [
    `how to ${recipe.name} electrical tutorial`,
    `${recipe.name} wiring guide`
  ];
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  photo?: string;
  ingredients?: string[];
  instructions?: string;
  equipment?: string[];
  nutrition?: {
    carbs: number;
    sugars: number;
    fiber: number;
    protein: number;
    saturatedFat?: number;
  };
  healthTags?: string[];
}

const MyCodeBook = () => {
  const { t } = useTranslation();
  const { setSelectedRecipe } = useRecipeContext();
  const navigate = useNavigate();
  const [recipes, setLocalRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showShareModal, setShowShareModal] = useState(false);
  const [recipeToShare, setRecipeToShare] = useState<Recipe | null>(null);
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
  const [activeMobileTab, setActiveMobileTab] = useState<'cookbook' | 'collections'>('cookbook');
  
  // Assignment data
  const assignments: any[] = [];

  // Student data
  const students: any[] = [];

  // Mock grades for each student and assignment
  const mockGrades: any = {};

  const [selectedCollection, setSelectedCollection] = useState<{id: string, name: string, emoji: string, recipes: string[]} | null>(null);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [collections, setCollections] = useState([
    { id: '1', name: 'Favorites', emoji: '⭐', recipes: ['1', '2', '3'] },
    { id: '2', name: 'Quick Circuits', emoji: '⚡', recipes: ['1', '2'] },
    { id: '3', name: 'Code Compliant', emoji: '✅', recipes: ['1', '2', '3', '4', '5'] }
  ]);

  const { user, isLoading } = useSupabase();

  // Load recipes and set page context on mount
  const { updateContext } = useFreddieContext();
  const { refreshXP } = useLevelProgressContext();
  
  // Categories for filtering
  const categories = [
    { key: 'All', label: t('myCodeBook.all') },
    { key: 'Seafood', label: t('myCodeBook.seafood') },
    { key: 'Meat', label: t('myCodeBook.meat') },
    { key: 'Vegetarian', label: t('myCodeBook.vegetarian') },
    { key: 'Dessert', label: t('myCodeBook.dessert') }
  ];

  // Handle recipe selection for collections
  const handleRecipeSelect = (recipeId: string) => {
    setSelectedRecipes(prev => 
      prev.includes(recipeId) 
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  // Handle creating a new collection
  const handleCreateCollection = () => {
    if (newCollectionName.trim() && selectedRecipes.length > 0) {
      const newCollection = {
        id: Date.now().toString(),
        name: newCollectionName.trim(),
        emoji: '📁',
        recipes: [...selectedRecipes]
      };
      setCollections(prev => [...prev, newCollection]);
      setNewCollectionName('');
      setSelectedRecipes([]);
      setShowCreateCollectionModal(false);
    }
  };

  // Handle viewing a collection
  const handleViewCollection = (collection: any) => {
    setSelectedCollection(collection);
    setShowViewCollectionModal(true);
  };

  // Handle deleting a collection
  const handleDeleteCollection = (collectionId: string) => {
    if (window.confirm(t('myCodeBook.deleteConfirm'))) {
      setCollections(prev => prev.filter(collection => collection.id !== collectionId));
      setShowViewCollectionModal(false);
      setSelectedCollection(null);
    }
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
      title: recipeToShare ? `${recipeToShare.name} Circuit on Porkchop` : 'My Code Book on Porkchop',
      text: recipeToShare 
        ? `Check out this circuit design for ${recipeToShare.name} on Porkchop!` 
        : 'Check out my digital code book on Porkchop! I\'ve been collecting circuit designs and would love to share them with you.',
      url: window.location.href + (recipeToShare ? `?recipe=${encodeURIComponent(recipeToShare.id)}` : ''),
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
          const instagramMessage = `Check out my cookbook! ${shareData.url}\n\nTo share on Instagram:\n1. Open Instagram\n2. Create a new post\n3. Paste this link in your caption`;
          await navigator.clipboard.writeText(instagramMessage);
          alert(t('myCodeBook.sharingInstructions'));
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
            alert(t('myCodeBook.linkCopied'));
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
            .eq('activity', 'cookbook_share')
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
                activity: 'cookbook_share'
              }
            ]);
            
            refreshXP();
          }
        }
      }
    } catch (err: any) {
      console.error('Error sharing:', err);
      if (err.name !== 'AbortError') {
        alert(t('myCodeBook.failedToShare'));
      }
    } finally {
      setShowShareModal(false);
    }
  };
  useEffect(() => {
    updateContext({ page: 'MyCookBook' });
  }, [updateContext]);

  useEffect(() => {
    const loadRecipes = async () => {
      if (!user?.id) {
        setLocalRecipes([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const savedRecipes = await fetchCookbook(user.id);
        const converted = savedRecipes.map(r => ({
          id: r.id,
          name: r.title,
          description: r.instructions,
          photo: r.image,
          ingredients: r.ingredients,
          instructions: r.instructions,
          equipment: r.equipment,
          nutrition: r.nutrition,
          healthTags: r.healthTags
        }));
        setLocalRecipes(converted);
      } catch (err) {
        console.error('Error loading cookbook:', err);
        setError('Failed to load your cookbook');
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [user?.id]);

  // Filter recipes based on search term and category
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeCategory === 'All' || activeCategory === t('myCodeBook.all')) return matchesSearch;
    
    // Simple category detection based on ingredients
    const ingredients = recipe.ingredients || [];
    const ingredientsJoined = ingredients.join(' ').toLowerCase();
    
    const hasSeafood = ingredientsJoined.includes('fish') || 
      ingredientsJoined.includes('salmon') || 
      ingredientsJoined.includes('tuna') || 
      ingredientsJoined.includes('cod') || 
      ingredientsJoined.includes('tilapia') || 
      ingredientsJoined.includes('shrimp') || 
      ingredientsJoined.includes('lobster') || 
      ingredientsJoined.includes('crab') || 
      ingredientsJoined.includes('oyster') || 
      ingredientsJoined.includes('clam') || 
      ingredientsJoined.includes('mussel');
    
    const hasMeat = ingredientsJoined.includes('beef') || 
      ingredientsJoined.includes('chicken') || 
      ingredientsJoined.includes('pork') || 
      ingredientsJoined.includes('turkey') || 
      ingredientsJoined.includes('bacon') || 
      ingredientsJoined.includes('sausage') || 
      ingredientsJoined.includes('lamb');
    
    const hasVegetable = ingredientsJoined.includes('vegetable') || 
      ingredientsJoined.includes('tomato') || 
      ingredientsJoined.includes('carrot') || 
      ingredientsJoined.includes('spinach');
    
    const hasDessert = ingredientsJoined.includes('sugar') || 
      ingredientsJoined.includes('chocolate') || 
      ingredientsJoined.includes('vanilla') || 
      ingredientsJoined.includes('cream') || 
      ingredientsJoined.includes('cake') || 
      ingredientsJoined.includes('cookie') || 
      ingredientsJoined.includes('pie');
    
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
          <div className="text-lg font-retro mb-2">Loading your cookbook...</div>
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
          onClick={() => setActiveMobileTab('cookbook')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'cookbook'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📖 {t('myCodeBook.title')}
        </button>
        <button
          onClick={() => setActiveMobileTab('collections')}
          className={`flex-1 py-3 px-4 font-bold text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'collections'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📚 {t('myCodeBook.collections')}
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 lg:h-full lg:justify-center">
        <div className={`lg:w-[66.666%] bg-weatheredWhite rounded-xl shadow-lg border-4 border-maineBlue flex flex-col h-full lg:min-h-[620px] ${
          activeMobileTab === 'cookbook' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* My Cook Book header */}
          <div className="flex items-center justify-center p-6 pb-4">
            <span className="text-5xl mr-2">📖</span>
            <h1 className="text-3xl font-retro text-maineBlue mb-0">{t('myCodeBook.title')}</h1>
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
            {recipeToShare ? `${t('myCodeBook.shareRecipeTitle')} "${recipeToShare.name}"` : t('myCodeBook.shareYourCookbook')}
          </h3>
          <div className="flex justify-around mb-4">
            <button 
              onClick={() => handleShare('facebook')}
              className="p-2 rounded-full hover:bg-blue-100"
              title={t('myCodeBook.shareOnFacebook')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1877F2"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/></svg>
            </button>
            <button 
              onClick={() => handleShare('twitter')}
              className="p-2 rounded-full hover:bg-blue-100"
              title={t('myCodeBook.shareOnTwitter')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg>
            </button>
            <button 
              onClick={() => handleShare('pinterest')}
              className="p-2 rounded-full hover:bg-red-100"
              title={t('myCodeBook.shareOnPinterest')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#E60023"><path d="M9.04 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.527 2.527 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
            </button>
            <button 
              onClick={() => handleShare('whatsapp')}
              className="p-2 rounded-full hover:bg-green-100"
              title={t('myCodeBook.shareOnWhatsApp')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#25D366"><path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </button>
            <button 
              onClick={() => handleShare('instagram')}
              className="p-2 rounded-full hover:bg-pink-100"
              title={t('myCodeBook.shareOnInstagram')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#E4405F"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </button>
            <button 
              onClick={() => handleShare('slack')}
              className="p-2 rounded-full hover:bg-purple-100"
              title={t('myCodeBook.shareOnSlack')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#4A154B"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
            </button>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => handleShare('native')}
              className="px-4 py-2 bg-seafoam text-maineBlue rounded hover:bg-maineBlue hover:text-seafoam transition-colors"
            >
              {t('myCodeBook.shareVia')}
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
            <h3 className="text-lg font-bold mb-4">{t('myCodeBook.createNewCollection')}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('myCodeBook.collectionName')}
              </label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder={t('myCodeBook.enterCollectionName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                autoFocus
              />
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {t('myCodeBook.selectedRecipes')} {selectedRecipes.length}
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
                {t('myCodeBook.cancel')}
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
                {t('myCodeBook.createCollection')}
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
                {t('myCodeBook.recipesInCollection')} ({selectedCollection.recipes.length}):
              </p>
              
              <div className="h-40 overflow-y-scroll border border-gray-300 rounded p-2">
                {selectedCollection.recipes.map((recipeId, index) => {
                  const recipe = recipes.find(r => r.id === recipeId);
                  return (
                    <div key={recipeId} className="py-2 px-2 hover:bg-sand rounded flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-2">🍽️</span>
                        <span className="text-sm">{recipe ? recipe.name : `Recipe ${index + 1}`}</span>
                      </div>
                      {recipe && recipe.healthTags && recipe.healthTags.length > 0 && (
                        <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                          🥗
                        </span>
                      )}
                    </div>
                  );
                })}
                {selectedCollection.recipes.length === 0 && (
                  <div className="py-4 text-center text-gray-500 text-sm italic">
                    {t('myCodeBook.noRecipesInCollection')}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => handleDeleteCollection(selectedCollection.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                {t('myCodeBook.deleteCollection')}
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
                  {t('myCodeBook.editCollection')}
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
              setCurrentIndex(0); // Reset to first recipe on category change
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
              placeholder={t('myCodeBook.searchRecipes')}
              className="pl-8 pr-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-seafoam w-full text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentIndex(0); // Reset to first recipe on search
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
            <span className="hidden sm:inline">{t('myCodeBook.previous')}</span>
            <span className="sm:hidden">{t('myCodeBook.prev')}</span>
          </button>
          <button
            onClick={() => setCurrentIndex(prev => Math.min(filteredRecipes.length - 1, prev + 1))}
            disabled={currentIndex === filteredRecipes.length - 1}
            className={`flex-1 px-2 py-2 rounded border border-black text-xs sm:text-sm font-bold transition-colors text-center ${currentIndex === filteredRecipes.length - 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-seafoam text-maineBlue hover:bg-maineBlue hover:text-seafoam'}`}
          >
            <span className="hidden sm:inline">{t('myCodeBook.next')}</span>
            <span className="sm:hidden">{t('myCodeBook.next')} →</span>
          </button>
          <button
            onClick={async () => {
              if (filteredRecipes.length === 0 || !user?.id) return;
              try {
                const recipeId = filteredRecipes[currentIndex].id;
                await removeRecipeFromCookbook(user.id, recipeId);
                setLocalRecipes(recipes.filter(r => r.id !== recipeId));
                setCurrentIndex(0);
              } catch (err) {
                console.error('Error deleting recipe:', err);
                setError('Failed to delete recipe');
              }
            }}
            disabled={filteredRecipes.length === 0}
            className={`flex-1 px-2 py-2 rounded border border-black text-xs sm:text-sm font-bold transition-colors text-center ${filteredRecipes.length === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-lobsterRed text-weatheredWhite hover:bg-red-800'}`}
            title={t('myCodeBook.deleteRecipe')}
          >
            🗑️ {t('myCodeBook.remove')}
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
      {/* Recipe Count */}
      <div className="text-sm text-gray-500 mb-4">
        {filteredRecipes.length === 0 
          ? t('myCodeBook.noRecipes') 
          : `${t('myCodeBook.recipe')} ${currentIndex + 1} ${t('myCodeBook.of')} ${filteredRecipes.length}`}
      </div>


      {/* Digital Cookbook - Single Recipe */}
      <div className="mt-4">
        {filteredRecipes.length === 0 ? (
          <div className="col-span-2 text-gray-400 italic text-center py-8">
            {recipes.length === 0 
              ? t('myCodeBook.noRecipesYet')
              : 'No recipes match your search criteria.'}
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
                    {/* Ingredients */}
                    <div className="bg-seafoam/20 p-1.5 rounded-lg text-center border-2 border-seafoam">
                      <h4 className="font-bold mb-0.5 text-xs sm:text-sm text-maineBlue">🥘 {t('myCodeBook.ingredients')}</h4>
                      <ul className="list-disc pl-3 max-h-[50px] sm:max-h-[60px] overflow-y-auto text-left text-[10px] sm:text-xs space-y-0">
                        {filteredRecipes[currentIndex].ingredients?.slice(0, 6).map((ingredient, i) => (
                          <li key={i} className="line-clamp-1">{ingredient}</li>
                        ))}
                        {(filteredRecipes[currentIndex].ingredients?.length || 0) > 6 && (
                          <li className="text-gray-600 italic font-semibold">+{(filteredRecipes[currentIndex].ingredients?.length || 0) - 6} {t('myCodeBook.more')}</li>
                        )}
                      </ul>
                    </div>
                    
                    {/* Equipment */}
                    <div className="bg-amber-50 p-1.5 rounded-lg text-center border-2 border-amber-300">
                      <h4 className="font-bold mb-0.5 text-xs sm:text-sm text-amber-900">🔪⚡ {t('myCodeBook.equipment')}</h4>
                      <ul className="list-disc pl-3 max-h-[50px] sm:max-h-[60px] overflow-y-auto text-left text-[10px] sm:text-xs space-y-0">
                        {filteredRecipes[currentIndex].equipment?.slice(0, 4).map((item, i) => (
                          <li key={i} className="line-clamp-1">{item}</li>
                        ))}
                        {(filteredRecipes[currentIndex].equipment?.length || 0) > 4 && (
                          <li className="text-gray-600 italic font-semibold">+{(filteredRecipes[currentIndex].equipment?.length || 0) - 4} {t('myCodeBook.more')}</li>
                        )}
                      </ul>
                    </div>
                    
                    {/* Health Tags */}
                    <div className="bg-green-50 p-1.5 rounded-lg text-center border-2 border-green-300">
                      <h4 className="font-bold mb-0.5 text-xs sm:text-sm text-green-900">🥗 {t('myCodeBook.healthTags')}</h4>
                      <div className="flex flex-wrap gap-1 justify-center max-h-[50px] sm:max-h-[60px] overflow-y-auto">
                        {filteredRecipes[currentIndex].healthTags?.slice(0, 4).map(tag => (
                          <span key={tag} className="bg-green-200 text-green-900 px-2 py-1 rounded-full text-xs font-semibold border border-green-400">
                            {tag}
                          </span>
                        )) || (
                          <span className="text-xs text-gray-500">{t('myCodeBook.noHealthTags')}</span>
                        )}
                        {(filteredRecipes[currentIndex].healthTags?.length || 0) > 4 && (
                          <span className="text-xs text-gray-600 font-semibold">+{(filteredRecipes[currentIndex].healthTags?.length || 0) - 4}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-1 text-[10px] sm:text-xs text-gray-600 text-center font-semibold bg-gray-100 px-3 py-1 rounded-full border border-gray-300">
                  {t('myCodeBook.tapToFlip')}
                </div>
              </div>
              
              {/* Back */}
              <div className="absolute inset-0 h-full w-full rounded-lg bg-white p-2 sm:p-3 shadow-lg border-4 border-lobsterRed [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col">
                <h3 className="text-sm sm:text-base md:text-lg font-bold mb-1 text-center text-lobsterRed border-b-2 border-lobsterRed pb-1">{filteredRecipes[currentIndex].name}</h3>
                <div className="flex-grow overflow-y-auto px-1">
                  <h4 className="font-bold mb-1 text-xs sm:text-sm text-maineBlue">📋 {t('myCodeBook.instructions')}</h4>
                  <p className="whitespace-pre-wrap text-[10px] sm:text-xs leading-snug">{filteredRecipes[currentIndex].instructions}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Chef of the Day Quote - simplified text only */}
      <div className="mt-3 text-center text-sm">
        {(() => {
          const quoteOfDay = getChefQuoteOfTheDay();
          return (
            <span className="italic">"{quoteOfDay.quote}" <span className="not-italic text-gray-600">— {quoteOfDay.chef}</span></span>
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
              <h3 className="text-xl">📚 {t('myCodeBook.collectionsLibrary')}</h3>
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
                        {collection.recipes.length}
                      </span>
                    </div>
                  ))}
                  {collections.length === 0 && (
                    <div className="py-4 text-center text-gray-500 text-sm italic">
                      {t('myCodeBook.noCollectionsYet')}
                    </div>
                  )}
                </div>
              </div>

              {/* Create Collection Section */}
              <div className="mb-6">
                {recipes.length > 0 ? (
                  <div className="space-y-2">
                    
                    <div className="h-40 overflow-y-scroll border border-gray-300 rounded p-2">
                      {recipes.map((recipe) => (
                        <div key={recipe.id} className="flex items-center justify-between p-2 hover:bg-sand rounded">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`recipe-${recipe.id}`}
                              checked={selectedRecipes.includes(recipe.id)}
                              onChange={() => handleRecipeSelect(recipe.id)}
                              className="mr-3 w-4 h-4 text-maineBlue bg-gray-100 border-gray-300 rounded focus:ring-maineBlue focus:ring-2"
                            />
                            <label htmlFor={`recipe-${recipe.id}`} className="text-sm cursor-pointer">
                              {recipe.name}
                            </label>
                          </div>
                          <div className="flex gap-1">
                            {recipe.healthTags && recipe.healthTags.length > 0 && (
                              <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                                🥗
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="text-gray-500 text-sm">{t('myCodeBook.addRecipesFirst')}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 z-20 flex-shrink-0 bg-white p-4 pt-2 shadow-[0_-6px_12px_rgba(255,255,255,0.95)]">
              {/* Create Collection Button - Always visible */}
              <button
                type="button"
                onClick={() => setShowCreateCollectionModal(true)}
                className="w-full mt-2 px-4 py-2 rounded border transition-colors bg-seafoam text-maineBlue border-maineBlue hover:bg-maineBlue hover:text-seafoam"
              >
                {t('myCodeBook.createCollectionSelected', { count: selectedRecipes.length }).replace('{count}', selectedRecipes.length.toString())}
              </button>

              {/* View Gradebook Button - Always visible */}
              <button
                type="button"
                onClick={handleOpenGradebook}
                className="w-full mt-2 px-4 py-2 rounded border transition-colors bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 hover:text-emerald-800"
              >
                📊 {t('myCodeBook.viewGradebook')}
              </button>

              {/* View Videos Button - Always visible */}
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
                    alert('Failed to load videos');
                  } finally {
                    setLoadingVideos(false);
                  }
                }}
                className="w-full mt-2 px-4 py-2 rounded border transition-colors bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200 hover:text-purple-800"
              >
                🎥 {t('myCodeBook.viewVideos')}
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
                        <h4 className="font-serif font-bold text-emerald-800 text-sm lg:text-xs">📊 {t('myCodeBook.rubric')}</h4>
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
                          <div className="text-xs font-medium text-emerald-900 mb-1">{t('myCodeBook.technique')} (25)</div>
                          <select className="w-full text-xs border border-emerald-300 rounded px-1 py-1 lg:py-0.5 bg-white min-h-[32px] lg:min-h-0">
                          <option value="">{t('myCodeBook.score')}</option>
                          <option value="25">A (23-25)</option>
                          <option value="22">B (20-22)</option>
                          <option value="19">C (17-19)</option>
                          <option value="16">D (15-16)</option>
                          <option value="10">F (0-14)</option>
                        </select>
                      </div>

                        {/* Safety Score */}
                        <div className="bg-white/60 p-2 lg:p-1 rounded border border-emerald-200">
                          <div className="text-xs font-medium text-emerald-900 mb-1">{t('myCodeBook.safety')} (25)</div>
                          <select className="w-full text-xs border border-emerald-300 rounded px-1 py-1 lg:py-0.5 bg-white min-h-[32px] lg:min-h-0">
                          <option value="">{t('myCodeBook.score')}</option>
                          <option value="25">A (23-25)</option>
                          <option value="22">B (20-22)</option>
                          <option value="19">C (17-19)</option>
                          <option value="16">D (15-16)</option>
                          <option value="10">F (0-14)</option>
                        </select>
                      </div>

                        {/* Consistency Score */}
                        <div className="bg-white/60 p-2 lg:p-1 rounded border border-emerald-200">
                          <div className="text-xs font-medium text-emerald-900 mb-1">{t('myCodeBook.consistency')} (25)</div>
                          <select className="w-full text-xs border border-emerald-300 rounded px-1 py-1 lg:py-0.5 bg-white min-h-[32px] lg:min-h-0">
                          <option value="">{t('myCodeBook.score')}</option>
                          <option value="25">A (23-25)</option>
                          <option value="22">B (20-22)</option>
                          <option value="19">C (17-19)</option>
                          <option value="16">D (15-16)</option>
                          <option value="10">F (0-14)</option>
                        </select>
                      </div>

                        {/* Presentation Score */}
                        <div className="bg-white/60 p-2 lg:p-1 rounded border border-emerald-200">
                          <div className="text-xs font-medium text-emerald-900 mb-1">{t('myCodeBook.presentation')} (25)</div>
                          <select className="w-full text-xs border border-emerald-300 rounded px-1 py-1 lg:py-0.5 bg-white min-h-[32px] lg:min-h-0">
                          <option value="">{t('myCodeBook.score')}</option>
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
                          <span className="block lg:inline">{t('myCodeBook.total')}: {(mockGrades as any)[students[currentStudentIndex].id]?.[assignments[currentAssignmentPage].id]?.total || '--'} / 100</span>
                          <span className="hidden lg:inline"> | </span>
                          <span className="block lg:inline">{t('myCodeBook.grade')}: {(mockGrades as any)[students[currentStudentIndex].id]?.[assignments[currentAssignmentPage].id]?.grade || '--'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Instructor Feedback */}
                    <div className="bg-white border-2 lg:border-4 border-yellow-500 rounded-lg p-2 lg:p-3 mb-2 shadow-sm flex-shrink-0">
                      <h4 className="font-serif font-bold text-amber-800 mb-1 lg:mb-2 text-sm">💬 {t('myCodeBook.feedback')}</h4>
                      
                      <textarea 
                        placeholder={t('myCodeBook.feedbackPlaceholder')}
                        className="w-full h-16 lg:h-14 text-xs border border-amber-300 rounded p-2 bg-white/80 resize-none focus:border-amber-500 focus:outline-none"
                      />

                      <div className="mt-2 flex space-x-2">
                        <button className="flex-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 lg:px-3 lg:py-2 rounded text-xs hover:bg-emerald-200 transition-all">
                          💾 {t('myCodeBook.save')}
                        </button>
                        <button className="flex-1 bg-blue-100 text-blue-800 border border-blue-300 px-2 py-1 lg:px-3 lg:py-2 rounded text-xs hover:bg-blue-200 transition-all">
                          📧 {t('myCodeBook.send')}
                        </button>
                    </div>
                  </div>

                    {/* Saved Feedback Notepad */}
                    <div className="bg-white border-2 lg:border-4 border-amber-700 rounded-lg p-2 lg:p-3 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                      <h4 className="font-serif font-bold text-yellow-800 mb-2 text-sm border-b border-yellow-300 pb-1">📝 {t('myCodeBook.savedFeedbackNotes')}</h4>
                    
                    <div className="bg-white/80 rounded border border-yellow-200 p-2 flex-1 overflow-y-auto">
                      <div className="space-y-2 text-xs">
                        <div className="border-b border-gray-200 pb-2">
                          <div className="font-medium text-gray-700 mb-1">Oct 28, 2024 - 2:15 PM</div>
                          <div className="text-gray-600">
                            "Great improvement on meter lead control and circuit tracing. Your readings were much more consistent than last week. 
                            Focus on documenting your NEC references for each finding. Overall excellent progress."
                          </div>
                        </div>
                        
                        <div className="border-b border-gray-200 pb-2">
                          <div className="font-medium text-gray-700 mb-1">Oct 21, 2024 - 1:45 PM</div>
                          <div className="text-gray-600">
                            "Good PPE and lockout awareness throughout the demo. Work on verifying zero-energy state more consistently 
                            before touching conductors. Your tool layout was excellent."
                          </div>
                        </div>

                        <div className="border-b border-gray-200 pb-2">
                          <div className="font-medium text-gray-700 mb-1">Oct 14, 2024 - 3:20 PM</div>
                          <div className="text-gray-600">
                            "First troubleshooting assessment - showing natural talent! Remember to confirm source voltage at 
                            the panel before branch testing. Practice the isolate-test-verify flow we discussed."
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Right Page - Assignment Recipe Card */}
                  <div className="w-full lg:w-1/2 h-1/2 lg:h-full bg-white rounded-b-lg lg:rounded-b-none lg:rounded-r-lg p-3 lg:p-4 flex flex-col">
                    {/* Assignment Recipe Card (matching CulinarySchool layout) */}
                    <div className="flex flex-col bg-white w-full h-full overflow-hidden rounded-lg border-4 border-maineBlue">
                      {/* Assignment Image */}
                      <div className="w-full h-20 lg:h-24 bg-gray-100 flex items-center justify-center border-b-2 border-amber-300 flex-shrink-0">
                        <div className="text-center">
                          <div className="text-2xl lg:text-3xl mb-1">{assignments[currentAssignmentPage].emoji}</div>
                          <div className="text-xs font-bold text-amber-800">{assignments[currentAssignmentPage].week} {t('myCodeBook.assignment')}</div>
                        </div>
                      </div>

                      {/* Assignment Details */}
                      <div className="p-2 lg:p-3 bg-white text-center flex-1 overflow-y-auto flex flex-col">
                        {/* Dividing Line */}
                        <hr className="border-t-2 border-amber-300 mb-3" />
                        
                        <h3 className="font-bold text-base lg:text-lg mb-2 text-maineBlue">{assignments[currentAssignmentPage].title}</h3>
                        <div className="text-xs text-gray-600 mb-2 lg:mb-4">
                          <span className="block lg:inline">{t('myCodeBook.due')}: {assignments[currentAssignmentPage].dueDate}</span>
                          <span className="hidden lg:inline"> | </span>
                          <span className="block lg:inline">{assignments[currentAssignmentPage].points} pts | {assignments[currentAssignmentPage].weight}</span>
                        </div>
                        
                        <div className="space-y-1 lg:space-y-2 flex-shrink-0">
                          <div>
                            <div className="font-semibold mb-1 text-sm text-amber-800">{t('myCodeBook.requiredTechniques')}</div>
                            <div className="text-xs text-gray-700 leading-tight">
                              {assignments[currentAssignmentPage].techniques.join(' • ')}
                            </div>
                          </div>

                          <div>
                            <div className="font-semibold mb-1 text-sm text-amber-800">{t('myCodeBook.submission')}</div>
                            <div className="text-xs text-gray-700 leading-tight">
                              {assignments[currentAssignmentPage].submission.join(' • ')}
                            </div>
                          </div>

                          <div>
                            <div className="font-semibold mb-1 text-sm text-amber-800">{t('myCodeBook.objectives')}</div>
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
                            <h4 className="font-serif font-semibold text-amber-800 text-sm">{students[currentStudentIndex].name} - {t('myCodeBook.submission')}</h4>
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
                              <option value="">{t('myCodeBook.selectVideo')}</option>
                              <option value="circuit-mapping-demo">Circuit Mapping Demo.mp4</option>
                              <option value="breaker-sizing-demo">Breaker Sizing Demo.mp4</option>
                              <option value="motor-control-demo">Protein Cookery.mp4</option>
                              <option value="plating-final">Final Test Report.mp4</option>
                            </select>
                          </div>
                          <div className="bg-gray-900 rounded-lg overflow-hidden border border-amber-300 relative flex-1 min-h-[150px]">
                            <div className="h-full bg-gray-800 flex items-center justify-center">
                              <div className="text-center text-white p-2">
                                <div className="text-xs">{assignments[currentAssignmentPage].videoTitle}</div>
                                <div className="text-xs text-gray-300 mt-1 hidden lg:block">{t('myCodeBook.submittedVia')}</div>
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
                    <div className="text-sm text-gray-300">{t('myCodeBook.clickToPlay')}</div>
                    <div className="text-xs text-gray-400 mt-2">{t('myCodeBook.submittedVia')}</div>
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
                {selectedVideoOption === 'circuit-mapping-demo' && 'Circuit Mapping Demo.mp4'}
                {selectedVideoOption === 'breaker-sizing-demo' && 'Breaker Sizing Demo.mp4'}
                {selectedVideoOption === 'motor-control-demo' && 'Protein Cookery.mp4'}
                {selectedVideoOption === 'plating-final' && 'Final Test Report.mp4'}
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
                  <h2 className="text-3xl font-bold text-purple-800 font-retro">🎥 {t('myCodeBook.myTestKitchenVideos')}</h2>
                  <p className="text-purple-600 mt-1">{t('myCodeBook.reviewSavedVideos')}</p>
                </div>
                <button
                  onClick={() => setShowVideoLibraryModal(false)}
                  className="text-purple-600 hover:text-purple-800 text-3xl font-bold"
                >
                  ×
                </button>
              </div>
              
              {/* Filter Dropdowns */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-purple-700 font-bold text-sm">{t('myCodeBook.category')}:</label>
                  <select
                    value={videoFilter}
                    onChange={(e) => setVideoFilter(e.target.value)}
                    className="border-2 border-purple-300 rounded-lg px-4 py-2 bg-white text-purple-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">{t('myCodeBook.allVideos')}</option>
                    <option value="practice">{t('myCodeBook.practiceSessions')}</option>
                    <option value="assignments">{t('myCodeBook.assignmentSubmissions')}</option>
                    <option value="demos">{t('myCodeBook.demoRecordings')}</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-purple-700 font-bold text-sm">{t('myCodeBook.user')}:</label>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="border-2 border-purple-300 rounded-lg px-4 py-2 bg-white text-purple-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Users</option>
                    <option value="me">My Videos Only</option>
                    <option value="public">Public Videos Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Video Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingVideos ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎬</div>
                  <p className="text-gray-600">{t('myCodeBook.loadingYourVideos')}</p>
                </div>
              ) : savedVideos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎥</div>
                  <p className="text-gray-600 text-lg">{t('myCodeBook.noVideosSaved')}</p>
                  <p className="text-gray-500 text-sm mt-2">{t('myCodeBook.recordInTestKitchen')}</p>
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
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">🌍 {t('myCodeBook.public')}</span>
                              ) : (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold">🔒 {t('myCodeBook.private')}</span>
                              )}
                            </div>
                            {video.userId !== user?.id && (
                              <p className="text-xs text-purple-500 mt-1">
                                👤 User: {video.userId.substring(0, 8)}...
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-purple-600 text-2xl">▶️</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-purple-50 border-t-4 border-purple-400 p-4 text-center">
              <p className="text-purple-700 text-sm">
                <strong>{savedVideos.length}</strong> video{savedVideos.length !== 1 ? 's' : ''} saved
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
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">🌍 Public</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold">🔒 Private</span>
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
                    <p>👤 Uploaded by: {selectedLibraryVideo.userId.substring(0, 8)}...</p>
                  )}
                  <p className="mt-1">🎥 {t('myCodeBook.recordedInWorkspace')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCodeBook;
