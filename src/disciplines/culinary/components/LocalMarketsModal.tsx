import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { groupIngredientsByMarketType, getEstimatedPrice } from '../utils/ingredientMapping';

// TypeScript declarations for Google Maps API (will be available at runtime)
declare global {
  interface Window {
    google: any;
  }
}

const google = (window as any).google;

interface Market {
  name: string;
  address: string;
  distance: number;
  type: string;
  rating?: number;
  isOpen?: boolean;
}

interface LocalMarketsModalProps {
  open: boolean;
  onClose: () => void;
  selectedRecipes?: any[]; // Optional: recipes from Build Menu feature
}

interface MarketCardProps {
  market: Market;
  ingredientsForMarket?: string[]; // Optional: ingredients to buy at this market
}

interface CategoryCardProps {
  category: string;
  title: string;
  icon: string;
  description: string;
  markets: Market[];
  loading: boolean;
  ingredientsForCategory?: string[]; // Optional: ingredients to buy at this market type
}

const MarketCard: React.FC<MarketCardProps> = ({ market, ingredientsForMarket }) => {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'grocery': return '🛒';
      case 'butcher': return '🥩';
      case 'produce': return '🥦';
      case 'dairy': return '🥛';
      case 'deli': return '🥪';
      case 'farms': return '🚜';
      case 'seafood': return '🐟';
      default: return '🏪';
    }
  };

  return (
    <div 
      className="relative h-48 w-full [perspective:1000px] cursor-pointer"
      onClick={() => setFlipped(!flipped)}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        {/* Front of card */}
        <div className="absolute inset-0 bg-sand p-4 rounded-lg shadow-md border border-black flex flex-col justify-between [backface-visibility:hidden]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{getTypeIcon(market.type)}</span>
              {market.isOpen !== undefined && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  market.isOpen 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {market.isOpen ? t('markets.open') : t('markets.closed')}
                </span>
              )}
            </div>
            <h4 className="font-bold text-maineBlue text-lg mb-1 line-clamp-2">{market.name}</h4>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{market.address}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{market.distance} {t('markets.miles')}</span>
            {market.rating && (
              <span className="text-sm flex items-center gap-1">
                ⭐ {market.rating}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 text-center mt-2">Click to flip</div>
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 bg-white p-4 rounded-lg shadow-md border border-black [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-maineBlue text-lg mb-3">{market.name}</h4>
            
            {/* Show ingredients if in menu mode */}
            {ingredientsForMarket && ingredientsForMarket.length > 0 && (
              <div className="mb-3 pb-3 border-b border-gray-200">
                <div className="text-xs font-semibold text-gray-600 mb-1">Buy here:</div>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {ingredientsForMarket.map((ing, idx) => {
                    const priceInfo = getEstimatedPrice(ing);
                    return (
                      <div key={idx} className="text-xs text-gray-700 flex justify-between items-center">
                        <span>• {ing}</span>
                        {priceInfo && (
                          <span className="text-gray-500 ml-2">~${priceInfo.price}/{priceInfo.unit}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-gray-500">📍</span>
                <span className="text-gray-700">{market.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">📏</span>
                <span className="text-gray-700">{market.distance} {t('markets.distance')}</span>
              </div>
              {market.rating && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">⭐</span>
                  <span className="text-gray-700">{market.rating} {t('markets.rating')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-gray-500">🏷️</span>
                <span className="text-gray-700 capitalize">{market.type}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              // Open directions in Google Maps
              const query = encodeURIComponent(market.address);
              window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
            }}
            className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors w-full"
          >
            {t('markets.getDirections')}
          </button>
        </div>
      </div>
    </div>
  );
};

const LoadingCard: React.FC = () => {
  return (
    <div className="relative h-48 w-full">
      <div className="absolute inset-0 bg-sand p-4 rounded-lg shadow-md border border-black flex flex-col justify-between animate-pulse">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
            <div className="w-12 h-4 bg-gray-300 rounded-full"></div>
          </div>
          <div className="w-3/4 h-5 bg-gray-300 rounded mb-1"></div>
          <div className="w-full h-4 bg-gray-300 rounded mb-1"></div>
          <div className="w-2/3 h-4 bg-gray-300 rounded"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="w-16 h-4 bg-gray-300 rounded"></div>
          <div className="w-12 h-4 bg-gray-300 rounded"></div>
        </div>
        <div className="text-xs text-gray-400 text-center mt-2">Searching...</div>
      </div>
    </div>
  );
};

const EmptyCard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="relative h-48 w-full">
      <div className="absolute inset-0 bg-gray-100 p-4 rounded-lg shadow-md border border-gray-300 flex flex-col justify-center items-center">
        <div className="text-4xl mb-2 text-gray-400">🏪</div>
        <div className="text-sm text-gray-500 text-center">
          {t('markets.noMarketsFound')}
        </div>
        <div className="text-xs text-gray-400 text-center mt-1">
          Try expanding your search area
        </div>
      </div>
    </div>
  );
};

const CategoryCard: React.FC<CategoryCardProps> = ({ category, title, icon, description, markets, loading, ingredientsForCategory }) => {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);

  // Get category-specific colors
  const getCategoryColors = (category: string) => {
    switch (category) {
      case 'grocery':
        return { bg: 'bg-blue-50', border: 'border-blue-500' };
      case 'butcher':
        return { bg: 'bg-red-50', border: 'border-red-500' };
      case 'seafood':
        return { bg: 'bg-cyan-50', border: 'border-cyan-500' };
      case 'produce':
        return { bg: 'bg-green-50', border: 'border-green-500' };
      case 'farms':
        return { bg: 'bg-yellow-50', border: 'border-yellow-500' };
      case 'specialty':
        return { bg: 'bg-purple-50', border: 'border-purple-500' };
      default:
        return { bg: 'bg-sand', border: 'border-black' };
    }
  };

  const colors = getCategoryColors(category);

  return (
    <div 
      className="relative h-48 w-full [perspective:1000px] cursor-pointer"
      onClick={() => setFlipped(!flipped)}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        {/* Front of card */}
        <div className={`absolute inset-0 ${colors.bg} p-4 rounded-lg shadow-md border-4 ${colors.border} flex flex-col items-center justify-center [backface-visibility:hidden]`}>
          <h4 className="font-bold text-maineBlue text-lg mb-4 text-center">{title}</h4>
          <span className="text-8xl">{icon}</span>
          {loading && (
            <div className="w-3 h-3 border-2 border-maineBlue border-t-transparent rounded-full animate-spin mt-1"></div>
          )}
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 bg-white p-3 rounded-lg shadow-md border border-black [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col justify-center">
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-maineBlue mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">{t('markets.searching')}</p>
            </div>
          ) : markets.length === 0 ? (
            <div className="text-center">
              <p className="text-sm text-gray-500">No {title.toLowerCase()} found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Show ingredients if in menu mode */}
              {ingredientsForCategory && ingredientsForCategory.length > 0 && (
                <div className="mb-2 pb-2 border-b border-gray-200">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Buy here:</div>
                  <div className="space-y-0.5 max-h-16 overflow-y-auto">
                    {ingredientsForCategory.map((ing, idx) => {
                      const priceInfo = getEstimatedPrice(ing);
                      return (
                        <div key={idx} className="text-xs text-gray-700 flex justify-between items-center">
                          <span>• {ing}</span>
                          {priceInfo && (
                            <span className="text-gray-500 ml-2">~${priceInfo.price}/{priceInfo.unit}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {markets.slice(0, 3).map((market, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="font-medium text-gray-800 truncate flex-1">{market.name}</div>
                  <a 
                    href={`https://www.google.com/search?q=${encodeURIComponent(market.name + ' ' + market.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 mx-2 text-lg"
                    onClick={(e) => e.stopPropagation()}
                    title="Visit website"
                  >
                    🌐
                  </a>
                  <div className="text-gray-500">{market.distance} {t('markets.miles')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LocalMarketsModal: React.FC<LocalMarketsModalProps> = ({ open, onClose, selectedRecipes }) => {
  const { t } = useTranslation();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract and group ingredients from selected recipes
  const ingredientsByMarketType = React.useMemo(() => {
    if (!selectedRecipes || selectedRecipes.length === 0) return {};
    
    const allIngredients: string[] = [];
    selectedRecipes.forEach(recipe => {
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        allIngredients.push(...recipe.ingredients);
      }
    });
    
    // Deduplicate ingredients (case-insensitive)
    const uniqueIngredients = Array.from(
      new Set(allIngredients.map(ing => ing.toLowerCase()))
    ).map(ing => {
      // Find the original casing from allIngredients
      return allIngredients.find(original => original.toLowerCase() === ing) || ing;
    });
    
    return groupIngredientsByMarketType(uniqueIngredients);
  }, [selectedRecipes]);

  const marketCategories = [
    { key: 'all', label: 'All Markets', icon: '🏪' },
    { key: 'grocery', label: 'Regional Grocery', icon: '🛒' },
    { key: 'butcher', label: 'Butcher', icon: '🥩' },
    { key: 'produce', label: 'Produce', icon: '🥦' },
    { key: 'dairy', label: 'Dairy', icon: '🥛' },
    { key: 'deli', label: 'Deli', icon: '🥪' },
    { key: 'farms', label: 'Farms', icon: '🚜' }
  ];

  // Get user location when modal opens
  useEffect(() => {
    if (open) {
      // Reset state when modal opens
      setMarkets([]);
      setUserLocation(null);
      // Small delay to let modal render first
      setTimeout(() => {
        getUserLocation();
      }, 100);
    }
  }, [open]);

  const getUserLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          searchNearbyMarkets(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoading(false);
          // Default to Maine coordinates if location access denied
          const maineLat = 44.3106;
          const maineLng = -69.7795;
          setUserLocation({ lat: maineLat, lng: maineLng });
          searchNearbyMarkets(maineLat, maineLng);
        }
      );
    } else {
      setLoading(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  const searchNearbyMarkets = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      
      // Check if Google Maps API is available (production) or use mock data (development)
      if (google && google.maps && google.maps.places) {
        // Use Google Places API to search for real markets within 15 miles
        const service = new google.maps.places.PlacesService(document.createElement('div'));
        const location = new google.maps.LatLng(lat, lng);
        
        const searchQueries = [
          { query: 'grocery store', type: 'grocery' },
          { query: 'supermarket', type: 'grocery' },
          { query: 'butcher shop', type: 'butcher' },
          { query: 'meat market', type: 'butcher' },
          { query: 'produce market', type: 'produce' },
          { query: 'farmers market', type: 'produce' },
          { query: 'dairy farm', type: 'dairy' },
          { query: 'deli', type: 'deli' },
          { query: 'farm stand', type: 'farms' },
          { query: 'seafood market', type: 'seafood' }
        ];
        
        const allMarkets: Market[] = [];
        
        for (const searchQuery of searchQueries) {
          await new Promise<void>((resolve) => {
            service.textSearch({
              query: searchQuery.query,
              location: location,
              radius: 24140, // 15 miles in meters
            }, (results: any, status: any) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                results.forEach((place: any) => {
                  // Filter out big box retailers
                  const name = place.name?.toLowerCase() || '';
                  if (name.includes('walmart') || name.includes('costco') || name.includes('target')) {
                    return;
                  }
                  
                  if (place.geometry?.location && place.name) {
                    const distance = google.maps.geometry.spherical.computeDistanceBetween(
                      location,
                      place.geometry.location
                    ) * 0.000621371; // Convert meters to miles
                    
                    if (distance <= 15) {
                      allMarkets.push({
                        name: place.name,
                        address: place.formatted_address || 'Address not available',
                        distance: Math.round(distance * 10) / 10,
                        type: searchQuery.type,
                        rating: place.rating,
                        isOpen: place.opening_hours?.open_now
                      });
                    }
                  }
                });
              }
              resolve();
            });
          });
        }
        
        // Remove duplicates and sort by distance
        const uniqueMarkets = allMarkets.filter((market, index, self) => 
          index === self.findIndex(m => m.name === market.name && m.address === market.address)
        ).sort((a, b) => a.distance - b.distance);
        
        setMarkets(uniqueMarkets);
      } else {
        setMarkets([]);
      }
    } catch (error) {
      console.error('Error searching markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMarkets = selectedCategory === 'all' 
    ? markets 
    : markets.filter(market => market.type === selectedCategory);

  if (!open) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white p-4 lg:p-6 rounded-lg shadow-xl border-4 border-black max-w-4xl w-full mx-4 max-h-[85vh] lg:max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div></div>
          <h3 className="text-lg lg:text-xl font-bold text-maineBlue text-center">Find Local Markets</h3>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CategoryCard 
            category="grocery" 
            title="Grocery" 
            icon="🛒" 
            description="Regional grocery stores and supermarkets"
            markets={markets.filter(m => m.type === 'grocery')}
            loading={loading}
            ingredientsForCategory={ingredientsByMarketType['grocery']}
          />
          <CategoryCard 
            category="butcher" 
            title="Butcher" 
            icon="🥩" 
            description="Local butcher shops and meat markets"
            markets={markets.filter(m => m.type === 'butcher')}
            loading={loading}
            ingredientsForCategory={ingredientsByMarketType['butcher']}
          />
          <CategoryCard 
            category="seafood" 
            title="Seafood" 
            icon="🐟" 
            description="Fresh seafood markets and fishmongers"
            markets={markets.filter(m => m.type === 'seafood')}
            loading={loading}
            ingredientsForCategory={ingredientsByMarketType['seafood']}
          />
          <CategoryCard 
            category="produce" 
            title="Produce" 
            icon="🥦" 
            description="Fresh produce markets and farm stands"
            markets={markets.filter(m => m.type === 'produce')}
            loading={loading}
            ingredientsForCategory={ingredientsByMarketType['produce']}
          />
          <CategoryCard 
            category="farms" 
            title="Farms" 
            icon="🚜" 
            description="Local farms and farmers markets"
            markets={markets.filter(m => m.type === 'farms')}
            loading={loading}
            ingredientsForCategory={ingredientsByMarketType['farms']}
          />
          <CategoryCard 
            category="specialty" 
            title="Specialty" 
            icon="🏦" 
            description="Delis, bakeries, and specialty food stores"
            markets={markets.filter(m => ['deli', 'dairy', 'bakery'].includes(m.type))}
            loading={loading}
            ingredientsForCategory={ingredientsByMarketType['deli'] || ingredientsByMarketType['dairy']}
          />
        </div>

      </div>
    </div>
  );
};

export default LocalMarketsModal;
