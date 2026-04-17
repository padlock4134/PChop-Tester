// Item to market type mapping and pricing estimates
// Used for Build Menu feature to show which items to buy at which markets

export interface ItemPrice {
  item: string;
  estimatedPrice: number;
  unit: string;
  marketType: string;
}

// Map item keywords to market types
export const itemToMarketType: Record<string, string> = {
  // Marine
  'lobster': 'marine',
  'clam': 'marine',
  'clams': 'marine',
  'fish': 'marine',
  'salmon': 'marine',
  'tuna': 'marine',
  'shrimp': 'marine',
  'crab': 'marine',
  'scallop': 'marine',
  'oyster': 'marine',
  'mussel': 'marine',
  'cod': 'marine',
  'haddock': 'marine',
  
  // Meat/Butcher
  'beef': 'butcher',
  'steak': 'butcher',
  'pork': 'butcher',
  'chicken': 'butcher',
  'turkey': 'butcher',
  'lamb': 'butcher',
  'bacon': 'butcher',
  'sausage': 'butcher',
  'ground beef': 'butcher',
  'ribs': 'butcher',
  
  // Produce
  'lettuce': 'produce',
  'tomato': 'produce',
  'potato': 'produce',
  'potatoes': 'produce',
  'onion': 'produce',
  'carrot': 'produce',
  'celery': 'produce',
  'bell pepper': 'produce',
  'cucumber': 'produce',
  'spinach': 'produce',
  'kale': 'produce',
  'broccoli': 'produce',
  'cauliflower': 'produce',
  'mushroom': 'produce',
  'garlic': 'produce',
  'apple': 'produce',
  'banana': 'produce',
  'orange': 'produce',
  'lemon': 'produce',
  'lime': 'produce',
  
  // Dairy
  'milk': 'dairy',
  'cream': 'dairy',
  'butter': 'dairy',
  'cheese': 'dairy',
  'yogurt': 'dairy',
  'sour cream': 'dairy',
  'heavy cream': 'dairy',
  
  // Bakery/Deli
  'bread': 'deli',
  'bun': 'deli',
  'buns': 'deli',
  'roll': 'deli',
  'rolls': 'deli',
  'bagel': 'deli',
  'croissant': 'deli',
  'tortilla': 'deli',
  
  // Grains (typically grocery)
  'rice': 'grocery',
  'pasta': 'grocery',
  'quinoa': 'grocery',
  'couscous': 'grocery',
  'barley': 'grocery',
  'oats': 'grocery',
  'flour': 'grocery',
  'cornmeal': 'grocery',
  'polenta': 'grocery',
  'noodles': 'grocery',
  'spaghetti': 'grocery',
  
  // Eggs (dairy section)
  'egg': 'dairy',
  'eggs': 'dairy',
  
  // Oils & Fats (grocery)
  'oil': 'grocery',
  'olive oil': 'grocery',
  'vegetable oil': 'grocery',
  'canola oil': 'grocery',
  'coconut oil': 'grocery',
  'sesame oil': 'grocery',
  
  // Condiments (grocery)
  'mayo': 'grocery',
  'mayonnaise': 'grocery',
  'mustard': 'grocery',
  'ketchup': 'grocery',
  'soy sauce': 'grocery',
  'vinegar': 'grocery',
  'hot sauce': 'grocery',
  'worcestershire': 'grocery',
  
  // Canned/Jarred (grocery)
  'tomato sauce': 'grocery',
  'tomato paste': 'grocery',
  'beans': 'grocery',
  'chickpeas': 'grocery',
  'black beans': 'grocery',
  'kidney beans': 'grocery',
  'stock': 'grocery',
  'broth': 'grocery',
  'chicken stock': 'grocery',
  'beef stock': 'grocery',
  'vegetable stock': 'grocery',
  
  // Sweeteners (grocery)
  'sugar': 'grocery',
  'brown sugar': 'grocery',
  'honey': 'grocery',
  'maple syrup': 'grocery',
  'molasses': 'grocery',
  
  // Baking (grocery)
  'baking powder': 'grocery',
  'baking soda': 'grocery',
  'vanilla': 'grocery',
  'vanilla extract': 'grocery',
  'yeast': 'grocery',
  'cocoa powder': 'grocery',
  'chocolate': 'grocery',
  
  // Herbs & Spices (grocery)
  'salt': 'grocery',
  'pepper': 'grocery',
  'basil': 'grocery',
  'oregano': 'grocery',
  'thyme': 'grocery',
  'rosemary': 'grocery',
  'parsley': 'grocery',
  'cilantro': 'grocery',
  'cumin': 'grocery',
  'paprika': 'grocery',
  'cinnamon': 'grocery',
  'nutmeg': 'grocery',
  'ginger': 'grocery',
  'chili powder': 'grocery',
  'cayenne': 'grocery',
  'turmeric': 'grocery',
  
  // Nuts & Seeds (grocery)
  'almonds': 'grocery',
  'walnuts': 'grocery',
  'pecans': 'grocery',
  'peanuts': 'grocery',
  'cashews': 'grocery',
  'sesame seeds': 'grocery',
  'sunflower seeds': 'grocery',
  
  // Beans & Legumes (grocery)
  'lentils': 'grocery',
  'split peas': 'grocery',
  
  // Frozen (grocery)
  'peas': 'grocery',
  'corn': 'grocery',
  'berries': 'grocery',
};

// Basic price estimates (in USD)
export const itemPriceEstimates: Record<string, { price: number; unit: string }> = {
  // Marine (premium pricing)
  'lobster': { price: 18, unit: 'lb' },
  'clam': { price: 9, unit: 'lb' },
  'clams': { price: 9, unit: 'lb' },
  'salmon': { price: 12, unit: 'lb' },
  'shrimp': { price: 14, unit: 'lb' },
  'crab': { price: 15, unit: 'lb' },
  'scallop': { price: 20, unit: 'lb' },
  
  // Meat/Butcher
  'beef': { price: 8, unit: 'lb' },
  'steak': { price: 12, unit: 'lb' },
  'chicken': { price: 4, unit: 'lb' },
  'pork': { price: 5, unit: 'lb' },
  'bacon': { price: 7, unit: 'lb' },
  'ground beef': { price: 6, unit: 'lb' },
  
  // Produce (cheaper)
  'lettuce': { price: 2.5, unit: 'head' },
  'tomato': { price: 3, unit: 'lb' },
  'potato': { price: 0.75, unit: 'lb' },
  'potatoes': { price: 0.75, unit: 'lb' },
  'onion': { price: 1.5, unit: 'lb' },
  'carrot': { price: 1.5, unit: 'lb' },
  'celery': { price: 2, unit: 'bunch' },
  'bell pepper': { price: 1.5, unit: 'each' },
  
  // Dairy
  'milk': { price: 4, unit: 'gallon' },
  'cream': { price: 5, unit: 'pint' },
  'butter': { price: 5, unit: 'lb' },
  'cheese': { price: 8, unit: 'lb' },
  
  // Bakery
  'bread': { price: 3, unit: 'loaf' },
  'bun': { price: 0.5, unit: 'each' },
  'buns': { price: 4, unit: 'pack' },
  'roll': { price: 0.5, unit: 'each' },
  
  // Grains
  'rice': { price: 2, unit: 'lb' },
  'pasta': { price: 1.5, unit: 'lb' },
  'quinoa': { price: 5, unit: 'lb' },
  'couscous': { price: 3, unit: 'lb' },
  'barley': { price: 2, unit: 'lb' },
  'oats': { price: 3, unit: 'lb' },
  'flour': { price: 0.5, unit: 'lb' },
  'cornmeal': { price: 2, unit: 'lb' },
  'noodles': { price: 2, unit: 'lb' },
  'spaghetti': { price: 1.5, unit: 'lb' },
  
  // Eggs
  'egg': { price: 0.25, unit: 'each' },
  'eggs': { price: 3, unit: 'dozen' },
  
  // Oils
  'olive oil': { price: 8, unit: 'bottle' },
  'vegetable oil': { price: 4, unit: 'bottle' },
  'oil': { price: 5, unit: 'bottle' },
  
  // Condiments
  'mayo': { price: 4, unit: 'jar' },
  'mustard': { price: 3, unit: 'jar' },
  'ketchup': { price: 3, unit: 'bottle' },
  'soy sauce': { price: 4, unit: 'bottle' },
  'vinegar': { price: 3, unit: 'bottle' },
  
  // Canned/Jarred
  'tomato sauce': { price: 2, unit: 'can' },
  'tomato paste': { price: 1.5, unit: 'can' },
  'beans': { price: 1.5, unit: 'can' },
  'chickpeas': { price: 1.5, unit: 'can' },
  'stock': { price: 3, unit: 'carton' },
  'broth': { price: 3, unit: 'carton' },
  
  // Sweeteners
  'sugar': { price: 3, unit: 'lb' },
  'honey': { price: 8, unit: 'jar' },
  'maple syrup': { price: 12, unit: 'bottle' },
  
  // Baking
  'baking powder': { price: 3, unit: 'container' },
  'baking soda': { price: 1, unit: 'box' },
  'vanilla extract': { price: 6, unit: 'bottle' },
  'yeast': { price: 5, unit: 'jar' },
  'chocolate': { price: 4, unit: 'bar' },
  
  // Herbs & Spices (dried)
  'salt': { price: 1, unit: 'container' },
  'pepper': { price: 4, unit: 'container' },
  'basil': { price: 3, unit: 'jar' },
  'oregano': { price: 3, unit: 'jar' },
  'cumin': { price: 4, unit: 'jar' },
  'paprika': { price: 3, unit: 'jar' },
  'cinnamon': { price: 4, unit: 'jar' },
  
  // Nuts
  'almonds': { price: 10, unit: 'lb' },
  'walnuts': { price: 12, unit: 'lb' },
  'pecans': { price: 14, unit: 'lb' },
  
  // Legumes
  'lentils': { price: 2, unit: 'lb' },
};

/**
 * Determine which market type an item should be purchased from
 */
export function getMarketTypeForItem(item: string): string {
  const lowerItem = item.toLowerCase();
  
  // Check for exact matches first
  if (itemToMarketType[lowerItem]) {
    return itemToMarketType[lowerItem];
  }
  
  // Check for partial matches
  for (const [key, marketType] of Object.entries(itemToMarketType)) {
    if (lowerItem.includes(key)) {
      return marketType;
    }
  }
  
  // Default to grocery if no match
  return 'grocery';
}

/**
 * Get estimated price for an item
 */
export function getEstimatedPrice(item: string): { price: number; unit: string } | null {
  const lowerItem = item.toLowerCase();
  
  // Check for exact matches first
  if (itemPriceEstimates[lowerItem]) {
    return itemPriceEstimates[lowerItem];
  }
  
  // Check for partial matches
  for (const [key, priceInfo] of Object.entries(itemPriceEstimates)) {
    if (lowerItem.includes(key)) {
      return priceInfo;
    }
  }
  
  return null;
}

/**
 * Group items by market type
 */
export function groupItemsByMarketType(items: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  for (const item of items) {
    const marketType = getMarketTypeForItem(item);
    if (!grouped[marketType]) {
      grouped[marketType] = [];
    }
    grouped[marketType].push(item);
  }
  
  return grouped;
}
