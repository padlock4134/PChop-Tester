import React, { useEffect, useState } from 'react';

// Types for market info
export const DEPARTMENT_TYPES = [
  { key: 'warehouse', label: 'General Warehouse', icon: '📦', placeTypes: ['storage', 'moving_company'], keywords: ['warehouse', 'storage', 'distribution', 'fulfillment', '3pl'] },
  { key: 'freight', label: 'Freight Terminal', icon: '🚛', placeTypes: ['moving_company'], keywords: ['freight', 'terminal', 'ltl', 'ftl', 'carrier', 'trucking'] },
  { key: 'cold_storage', label: 'Cold Storage', icon: '❄️', placeTypes: ['storage'], keywords: ['cold storage', 'reefer', 'temperature', 'refrigerated'] },
  { key: 'equipment', label: 'Equipment Rental', icon: '🧰', placeTypes: ['hardware_store'], keywords: ['equipment', 'material handling', 'forklift', 'rental', 'dock'] },
  { key: 'packaging', label: 'Packaging Supply', icon: '📋', placeTypes: ['hardware_store'], keywords: ['packaging', 'boxes', 'shrink wrap', 'labels', 'pallet'] },
  { key: 'fleet', label: 'Fuel & Fleet', icon: '🏭', placeTypes: ['gas_station', 'car_repair'], keywords: ['fleet', 'fuel', 'diesel', 'maintenance', 'service'] },
  { key: 'safety', label: 'Safety & Compliance', icon: '⚠️', placeTypes: ['hardware_store'], keywords: ['safety', 'compliance', 'ppe', 'hazmat', 'osha'] },
];

// Maximum number of places to show per category
const MAX_PLACES_PER_CATEGORY = 5;

// List of big box retailers and non-cargo places to exclude
const BIG_BOX_RETAILERS = ['walmart', 'costco', 'bj', 'bjs', 'sams club', 'sam\'s club', 'best buy', 'target', 'home depot', 'lowe\'s', 'lowes', 'duluth trading', 'duluth trading company', 'cvs', 'cvs pharmacy', 'maine audubon'];

// List of specific places to exclude (exact matches)
const EXCLUDED_PLACES: string[] = [];

// List of generic shipping storefronts that should not be considered specialized
const GENERIC_GROCERY_CHAINS = ['ups store', 'fedex', 'usps'];

// Specialty keywords that strongly indicate a specialized market
const SPECIALTY_INDICATORS = ['warehouse', 'freight', 'logistics', 'distribution', 'cold storage', '3pl', 'fulfillment'];

// Known specialized markets to prioritize
const SPECIALIZED_MARKETS = {
  'xpo logistics': 'freight',
  'old dominion': 'freight',
  'uline': 'equipment',
  'grainger': 'equipment'
};

// Search queries for specialty categories
const SPECIALTY_SEARCH_QUERIES = {
  freight: ['freight terminal', 'trucking company'],
  equipment: ['warehouse equipment', 'material handling'],
  warehouse: ['warehouse distribution center', 'fulfillment center'],
  cold_storage: ['cold storage warehouse', 'refrigerated logistics'],
  packaging: ['packaging supply warehouse', 'shipping supplies'],
  fleet: ['fleet fuel station', 'commercial fleet service'],
  safety: ['industrial safety supply', 'hazmat compliance supply']
};

interface Place {
  name: string;
  vicinity: string;
  place_id: string;
  types: string[];
  website: string | null;
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  };
  assignedCategory?: string; // Track which category this place is assigned to
  isSpecialized?: boolean; // Whether this is a specialized logistics provider vs. general warehouse
  distance?: number; // Distance from user's location in miles
}

const WarehouseDirectory: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<typeof DEPARTMENT_TYPES[0] | null>(null);
  const [coordinates, setCoordinates] = useState<{lat: number; lng: number} | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your location. Please enable location services.');
      }
    );
  }, []);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fetch places when coordinates are available
  useEffect(() => {
    if (!coordinates) return;

    const fetchPlaces = async () => {
      setLoading(true);
      setError(null);
      try {
        const radius = 24140; // 15 miles in meters
        let allPlaces: Place[] = [];
        
        // Initial fetch for warehouses, storage, and hardware/equipment providers
        const initialResponse = await fetch(
          `/.netlify/functions/get-places?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=${radius}&type=moving_company,storage,hardware_store`
        );
        
        const initialData = await initialResponse.json();
        console.log('Initial Places API response:', initialData);
        
        if (!initialResponse.ok) {
          throw new Error(initialData.error || `API returned ${initialResponse.status}`);
        }
        
        if (initialData.status === 'OK' && initialData.results) {
          // Filter out food-related place types and big box retailers
          const filteredPlaces = initialData.results.filter(
            (place: Place) => 
              !place.types.some(type => type === 'restaurant' || type === 'meal_takeaway' || type === 'supermarket' || type === 'bakery') &&
              !BIG_BOX_RETAILERS.some(storeName => place.name.toLowerCase().includes(storeName))
          );
          
          allPlaces = [...filteredPlaces];
        }
        
        // Additional searches for specialty categories
        const specialtyCategories = ['freight', 'equipment', 'warehouse', 'cold_storage', 'packaging', 'fleet', 'safety'];
        for (const category of specialtyCategories) {
          const queries = SPECIALTY_SEARCH_QUERIES[category as keyof typeof SPECIALTY_SEARCH_QUERIES];
          
          for (const query of queries) {
            try {
              console.log(`Searching for ${category} with query: ${query}`);
              const specialtyResponse = await fetch(
                `/.netlify/functions/text-search-places?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=${radius}&query=${encodeURIComponent(query)}`
              );
              
              const specialtyData = await specialtyResponse.json();
              console.log(`${category} search response for "${query}":`, specialtyData);
              
              if (specialtyData.status === 'OK' && specialtyData.results) {
                // Filter out food-related place types and big box retailers
                const filteredSpecialtyPlaces = specialtyData.results.filter(
                  (place: Place) => 
                    !place.types.some(type => type === 'restaurant' || type === 'meal_takeaway' || type === 'supermarket' || type === 'bakery') &&
                    !BIG_BOX_RETAILERS.some(storeName => place.name.toLowerCase().includes(storeName))
                );
                
                // Add to our collection, avoiding duplicates
                for (const place of filteredSpecialtyPlaces) {
                  if (!allPlaces.some(p => p.place_id === place.place_id)) {
                    allPlaces.push(place);
                  }
                }
              }
            } catch (err) {
              console.error(`Error fetching ${category} places with query "${query}":`, err);
              // Continue with other queries even if one fails
            }
          }
        }
        
        // Assign each place to its most appropriate category
        const categorizedPlaces = assignPlacesToCategories(allPlaces);
        setPlaces(categorizedPlaces);
      } catch (err) {
        console.error('Places fetch error:', err);
        setError('Failed to fetch nearby places.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [coordinates]);

  const openModal = (dept: typeof DEPARTMENT_TYPES[0]) => {
    setSelectedDept(dept);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  // Assign places to their most appropriate category based on name and types
  const assignPlacesToCategories = (places: Place[]): Place[] => {
    const result = [...places];
    
    result.forEach(place => {
      const nameLower = place.name.toLowerCase();
      
      // Debug: Log if we find common logistics specialty providers
      if (nameLower.includes('freight') || nameLower.includes('terminal')) {
        console.log('Found Freight Terminal during categorization:', place);
      }
      if (nameLower.includes('warehouse') || nameLower.includes('distribution')) {
        console.log('Found Warehouse provider during categorization:', place);
      }
      if (nameLower.includes('cold') || nameLower.includes('reefer')) {
        console.log('Found Cold Storage provider during categorization:', place);
      }
      
      // Check if it's a big box retailer (already filtered, but double-check)
      const isBigBox = BIG_BOX_RETAILERS.some(retailer => nameLower.includes(retailer));
      if (isBigBox) {
        // Skip big box retailers entirely
        return;
      }
      
      // Check if it's in our specific exclusion list (exact match)
      if (EXCLUDED_PLACES.includes(place.name)) {
        // Skip specifically excluded places
        return;
      }
      
      // Priority categorization for freight and warehouse providers
      if (nameLower.includes('freight') || nameLower.includes('terminal') || nameLower.includes('carrier') || nameLower.includes('trucking')) {
        place.assignedCategory = 'freight';
        place.isSpecialized = true;
        return;
      }
      
      if (nameLower.includes('warehouse') || nameLower.includes('storage') || nameLower.includes('fulfillment')) {
        place.assignedCategory = 'warehouse';
        place.isSpecialized = true;
        return;
      }
      
      // Special handling for cold storage providers
      if (nameLower.includes('cold') || nameLower.includes('reefer') || nameLower.includes('temperature')) {
        place.assignedCategory = 'cold_storage';
        place.isSpecialized = true;
        return;
      }
      
      // Special handling for fleet/fuel providers
      if (nameLower.includes('fleet') || nameLower.includes('fuel') || nameLower.includes('diesel')) {
        place.assignedCategory = 'fleet';
        place.isSpecialized = true;
        return;
      }
      
      // Check if it's a generic shipping storefront chain
      const isGenericChain = GENERIC_GROCERY_CHAINS.some(chain => nameLower.includes(chain));
      if (isGenericChain) {
        // Generic chains always go to general warehouse and are not specialized
        place.assignedCategory = 'warehouse';
        place.isSpecialized = false;
        return;
      }
      
      // First check for known specialized markets we want to explicitly categorize
      for (const [marketName, category] of Object.entries(SPECIALIZED_MARKETS)) {
        if (nameLower.includes(marketName)) {
          place.assignedCategory = category;
          place.isSpecialized = true;
          return; // Skip further processing for this place
        }
      }
      
      // Special handling for packaging/safety providers
      if (nameLower.includes('packaging') || nameLower.includes('box') || nameLower.includes('label')) {
        place.assignedCategory = 'packaging';
        place.isSpecialized = true;
        return;
      }

      if (nameLower.includes('safety') || nameLower.includes('hazmat') || nameLower.includes('compliance')) {
        place.assignedCategory = 'safety';
        place.isSpecialized = true;
        return;
      }
      
      // Check for specialty keywords in each department
      for (const dept of DEPARTMENT_TYPES) {
        // Skip general warehouse category for specialty keyword matching
        if (dept.key === 'warehouse') continue;
        
        // Check if any specialty keywords are in the name
        if (dept.keywords.some(keyword => nameLower.includes(keyword))) {
          place.assignedCategory = dept.key;
          // Check if it contains any specialty indicators
          place.isSpecialized = SPECIALTY_INDICATORS.some(indicator => nameLower.includes(indicator)) || 
                               // These types are always specialized
                               dept.key === 'freight' || 
                               dept.key === 'cold_storage' || 
                               dept.key === 'fleet' ||
                               dept.key === 'safety' ||
                               dept.key === 'equipment';
          return; // Found a match, no need to check further
        }
      }
      
      // If no specialty was found, check Google's place types
      for (const dept of DEPARTMENT_TYPES) {
        if (place.types.some(type => dept.placeTypes.includes(type))) {
          place.assignedCategory = dept.key;
          // Non-warehouse categories from Google place types are specialized
          place.isSpecialized = dept.key !== 'warehouse';
          return; // Found a match, no need to check further
        }
      }
      
      // Default to warehouse if no category was assigned
      if (!place.assignedCategory) {
        place.assignedCategory = 'warehouse';
        place.isSpecialized = false;
      }
    });
    
    return result;
  };

  const getPlacesForDepartment = (dept: typeof DEPARTMENT_TYPES[0]) => {
    // Get places specifically assigned to this category
    let assignedPlaces = places.filter(place => place.assignedCategory === dept.key);
    
    // Apply 15-mile distance filter if geometry data is available
    if (coordinates) {
      assignedPlaces = assignedPlaces.filter(place => {
        // If no geometry data, keep the place to avoid empty results
        if (!place.geometry || !place.geometry.location) return true;
        
        try {
          const distance = calculateDistance(
            coordinates.lat,
            coordinates.lng,
            place.geometry.location.lat,
            place.geometry.location.lng
          );
          return distance <= 15;
        } catch (err) {
          console.log('Distance calculation error for', place.name, err);
          return true; // Keep the place on error to avoid empty results
        }
      });
    }
    
    // Calculate distance for each place for sorting purposes
    if (coordinates) {
      assignedPlaces.forEach(place => {
        if (place.geometry && place.geometry.location) {
          try {
            place.distance = calculateDistance(
              coordinates.lat,
              coordinates.lng,
              place.geometry.location.lat,
              place.geometry.location.lng
            );
          } catch (err) {
            place.distance = 999; // Default high distance value for places with calculation errors
          }
        } else {
          place.distance = 999; // Default high distance value for places without geometry
        }
      });
    }
    
    // Sort by specialized first, then by distance (closest first)
    assignedPlaces.sort((a, b) => {
      // First priority: specialized markets always come first
      if (a.isSpecialized && !b.isSpecialized) return -1;
      if (!a.isSpecialized && b.isSpecialized) return 1;
      
      // Second priority: within each group (specialized or non-specialized), sort by distance
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      
      // Fallback to alphabetical if distances aren't available
      return a.name.localeCompare(b.name);
    });
    
    // Remove duplicates by name (case insensitive)
    const uniquePlaces: Place[] = [];
    const seenNames = new Set<string>();
    
    for (const place of assignedPlaces) {
      const nameLower = place.name.toLowerCase();
      if (!seenNames.has(nameLower)) {
        uniquePlaces.push(place);
        seenNames.add(nameLower);
      }
    }
    
    // If we have assigned places, return up to MAX_PLACES_PER_CATEGORY
    if (uniquePlaces.length > 0) {
      return uniquePlaces.slice(0, MAX_PLACES_PER_CATEGORY);
    }
    
    // Fallback: If no places were specifically assigned to this category,
    // use place type-based filtering, excluding generic shipping storefront chains
    const fallbackPlaces = places.filter(place => 
      place.types.some(type => dept.placeTypes.includes(type)) &&
      !GENERIC_GROCERY_CHAINS.some(chain => place.name.toLowerCase().includes(chain))
    );
    
    // Also deduplicate fallback places
    const uniqueFallbackPlaces: Place[] = [];
    const seenFallbackNames = new Set<string>();
    
    for (const place of fallbackPlaces) {
      const nameLower = place.name.toLowerCase();
      if (!seenFallbackNames.has(nameLower)) {
        uniqueFallbackPlaces.push(place);
        seenFallbackNames.add(nameLower);
      }
    }
    
    return uniqueFallbackPlaces.slice(0, MAX_PLACES_PER_CATEGORY);
  };

  return (
    <div className="my-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-lg mx-auto">
        {DEPARTMENT_TYPES.slice(0, 6).map(dep => (
          <button
            key={dep.key}
            className="flex flex-col items-center bg-sand rounded-lg shadow-md border border-black p-6 hover:bg-sky-300 hover:text-maineBlue transition cursor-pointer focus:outline-none"
            onClick={() => openModal(dep)}
          >
            <span className="text-4xl mb-2">{dep.icon}</span>
            <span className="font-retro text-lg">{dep.label}</span>
          </button>
        ))}
        {/* Equipment button as full width */}
        {DEPARTMENT_TYPES.slice(6, 7).map(dep => (
          <button
            key={dep.key}
            className="col-span-2 sm:col-span-3 flex flex-col items-center bg-sand rounded-lg shadow-md border border-black p-6 hover:bg-sky-300 hover:text-maineBlue transition cursor-pointer focus:outline-none"
            onClick={() => openModal(dep)}
          >
            <span className="text-4xl mb-2">{dep.icon}</span>
            <span className="font-retro text-lg">{dep.label}</span>
          </button>
        ))}
      </div>
      {modalOpen && selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-8 max-w-2xl w-full relative flex flex-col items-center max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={closeModal}
              aria-label="Close"
            >
              &times;
            </button>
            <span className="text-5xl mb-4">{selectedDept.icon}</span>
            <h3 className="text-xl font-bold mb-2 text-maineBlue">{selectedDept.label} Options</h3>
            {loading ? (
              <p className="text-gray-600">Finding places near you...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <>
                <div className="w-full mt-4 space-y-3">
                  {getPlacesForDepartment(selectedDept).map(place => (
                    <div 
                      key={place.place_id} 
                      className={`rounded-lg p-4 border border-black ${place.isSpecialized ? 'bg-sand' : 'bg-gray-50'}`}
                    >
                      <h4 className="font-bold text-maineBlue">{place.name}</h4>
                      <p className="text-gray-600 text-sm">{place.vicinity}</p>
                      {place.website && (
                        <a 
                          href={place.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-maineBlue hover:underline mt-1 inline-block"
                        >
                          Visit Website <span className="text-xs">↗</span>
                        </a>
                      )}
                    </div>
                  ))}
                  {getPlacesForDepartment(selectedDept).length === 0 && (
                    <p className="text-gray-500 text-center italic">
                      No {selectedDept.label.toLowerCase()} locations found nearby.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseDirectory;
