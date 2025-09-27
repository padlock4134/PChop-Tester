import React, { useState } from 'react';
import ChefFreddieWidget from './ChefFreddieWidget';
import { useEffect } from 'react';
import { useFreddieContext } from '../components/FreddieContext';
import { fetchKitchen } from './kitchenSupabase';
import CookBookImportModal from '../components/CookBookImportModal';
import MarketDirectory from '../components/MarketDirectory';
import { useRecipeContext } from '../components/RecipeContext';
import { fetchCookbook } from './cookbookSupabase';
import { useSupabase } from '../components/SupabaseProvider';
import GlobalTestKitchen from '../components/GlobalTestKitchen';

const ChefsCorner = () => {
  const { updateContext } = useFreddieContext();
  const { recipes, setRecipes } = useRecipeContext();
  const { user } = useSupabase();
  
  // Shopping list state
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [cookbookModalOpen, setCookbookModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'market' | 'kitchen'>('market');

  useEffect(() => {
    updateContext({ page: 'ChefsCorner' });
    
    // Load recipes from cookbook when Chef's Corner loads
    const loadRecipes = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const savedRecipes = await fetchCookbook(user.id);
        setRecipes(savedRecipes || []);
      } catch (err) {
        console.error('Error loading cookbook recipes:', err);
        // Initialize with empty array if there's an error
        setRecipes([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecipes();
  }, [updateContext, setRecipes, user?.id]);

  // Open modal for My CookBook import
  const importFromCookBook = () => {
    if (!user) {
      alert('Please sign in to access your cookbook');
      return;
    }
    setCookbookModalOpen(true);
  };

  // Handler for modal import - add all ingredients, only deduplicating within the shopping list
  const handleCookBookImport = async (ingredientNames: string[]) => {
    console.log('Importing ingredients:', ingredientNames);
    
    if (!ingredientNames || !Array.isArray(ingredientNames)) {
      console.error('Invalid ingredients data received:', ingredientNames);
      alert('Error: Invalid ingredients data');
      return;
    }

    try {
      // Process all ingredients first
      const allIngredients = ingredientNames
        .filter((item): item is string => item != null) // Remove null/undefined
        .map(item => String(item).trim()) // Ensure string and trim
        .filter(item => item.length > 0); // Remove empty strings
      
      console.log('Processed ingredients to add:', allIngredients);
      
      if (allIngredients.length === 0) {
        console.log('No valid ingredients to add');
        return;
      }
      
      // Add to shopping list, removing duplicates (case-insensitive)
      setShoppingList(currentList => {
        // Create a Set of normalized current list items for quick lookup
        const currentNormalized = new Set(
          currentList.map(item => item.trim().toLowerCase())
        );
        
        // Only add items that aren't already in the shopping list
        const newItems = allIngredients.filter(
          item => !currentNormalized.has(item.trim().toLowerCase())
        );
        
        if (newItems.length === 0) {
          console.log('No new ingredients to add - all already in shopping list');
          return currentList;
        }
        
        const updatedList = [...currentList, ...newItems];
        console.log('Added new items to shopping list:', newItems);
        console.log('Updated shopping list:', updatedList);
        return updatedList;
      });
      
      alert(`Added ${allIngredients.length} ingredients to your shopping list`);
      
    } catch (error) {
      console.error('Error importing ingredients:', error);
      alert('Failed to import ingredients. Please try again.');
    } finally {
      setCookbookModalOpen(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="lg:w-2/3 bg-weatheredWhite p-6 rounded shadow-lg border-4 border-maineBlue">{/* Remove the max-w-2xl constraint and use the same layout as Culinary School */}
          <header className="chefs-corner-header mb-6 flex flex-col items-center">
            <div className="flex items-center justify-center mb-1">
              <span className="text-5xl mr-2">🦐</span>
              <h1 className="text-3xl font-retro text-maineBlue mb-0">Chefs Corner</h1>
            </div>
            <p className="text-lg text-gray-700 mb-4 text-center">Eat like a Mainer by shopping the freshest local markets.</p>
          </header>
          {/* Shopping List - now at the top */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-maineBlue mb-3 text-center"></h2>
            <div className="bg-sand rounded shadow border border-black p-4 flex flex-col items-center max-w-lg mx-auto">
              <p className="mb-2 text-gray-700 text-center">Import your saved recipes, build your list and shop everything you need.</p>
              <button 
                onClick={importFromCookBook} 
                className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors w-full border border-black"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Import from My CookBook'}
              </button>
              <CookBookImportModal
                open={cookbookModalOpen}
                onClose={() => setCookbookModalOpen(false)}
                onImport={handleCookBookImport}
                existingIngredients={shoppingList}
              />
              <ul className="mt-4 w-full">
                {shoppingList.length === 0 ? (
                  <li className="text-gray-400 italic text-center">No items yet. Import to get started!</li>
                ) : (
                  shoppingList.map(item => (
                    <li key={item} className="flex items-center justify-between py-1 border-b border-seafoam last:border-b-0">
                      <span>{item}</span>
                      <button
                        className="text-lobsterRed font-bold ml-2 hover:underline"
                        onClick={() => setShoppingList(shoppingList.filter(i => i !== item))}
                      >
                        Remove
                      </button>
                    </li>
                  ))
                )}
              </ul>

            </div>
          </section>


          {/* Mobile Tab System */}
          <div className="lg:hidden">
            <div className="flex border-b border-gray-300 mb-6">
              <button
                onClick={() => setActiveTab('market')}
                className={`flex-1 py-3 px-4 text-center font-bold transition-colors border-b-2 ${
                  activeTab === 'market'
                    ? 'border-maineBlue text-maineBlue bg-sand'
                    : 'border-transparent text-gray-600 hover:text-maineBlue'
                }`}
              >
                🛒 Market Directory
              </button>
              <button
                onClick={() => setActiveTab('kitchen')}
                className={`flex-1 py-3 px-4 text-center font-bold transition-colors border-b-2 ${
                  activeTab === 'kitchen'
                    ? 'border-maineBlue text-maineBlue bg-sand'
                    : 'border-transparent text-gray-600 hover:text-maineBlue'
                }`}
              >
                🍳 Test Kitchen
              </button>
            </div>
            
            {activeTab === 'market' && <MarketDirectory />}
            {activeTab === 'kitchen' && <GlobalTestKitchen />}
          </div>

          {/* Desktop Layout - Markets Directory */}
          <div className="hidden lg:block">
            <MarketDirectory />
          </div>

        </div>

        {/* Right Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:w-1/3 space-y-6">
          <GlobalTestKitchen />
          <ChefFreddieWidget />
        </div>
      </div>
    </div>
  );
};

export default ChefsCorner;
