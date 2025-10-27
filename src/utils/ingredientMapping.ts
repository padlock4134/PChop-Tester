// Ingredient to market type mapping and pricing estimates
// Used for Build Menu feature to show which ingredients to buy at which markets

export interface IngredientPrice {
  ingredient: string;
  estimatedPrice: number;
  unit: string;
  marketType: string;
}

// Map ingredient keywords to market types
export const ingredientToMarketType: Record<string, string> = {
  // Seafood
  'lobster': 'seafood',
  'clam': 'seafood',
  'clams': 'seafood',
  'fish': 'seafood',
  'salmon': 'seafood',
  'tuna': 'seafood',
  'shrimp': 'seafood',
  'crab': 'seafood',
  'scallop': 'seafood',
  'oyster': 'seafood',
  'mussel': 'seafood',
  'cod': 'seafood',
  'haddock': 'seafood',
  
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
  'pepper': 'produce',
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
};

// Basic price estimates (in USD)
export const ingredientPriceEstimates: Record<string, { price: number; unit: string }> = {
  // Seafood (premium pricing)
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
  'pepper': { price: 1.5, unit: 'each' },
  
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
};

/**
 * Determine which market type an ingredient should be purchased from
 */
export function getMarketTypeForIngredient(ingredient: string): string {
  const lowerIngredient = ingredient.toLowerCase();
  
  // Check for exact matches first
  if (ingredientToMarketType[lowerIngredient]) {
    return ingredientToMarketType[lowerIngredient];
  }
  
  // Check for partial matches
  for (const [key, marketType] of Object.entries(ingredientToMarketType)) {
    if (lowerIngredient.includes(key)) {
      return marketType;
    }
  }
  
  // Default to grocery if no match
  return 'grocery';
}

/**
 * Get estimated price for an ingredient
 */
export function getEstimatedPrice(ingredient: string): { price: number; unit: string } | null {
  const lowerIngredient = ingredient.toLowerCase();
  
  // Check for exact matches first
  if (ingredientPriceEstimates[lowerIngredient]) {
    return ingredientPriceEstimates[lowerIngredient];
  }
  
  // Check for partial matches
  for (const [key, priceInfo] of Object.entries(ingredientPriceEstimates)) {
    if (lowerIngredient.includes(key)) {
      return priceInfo;
    }
  }
  
  return null;
}

/**
 * Group ingredients by market type
 */
export function groupIngredientsByMarketType(ingredients: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  for (const ingredient of ingredients) {
    const marketType = getMarketTypeForIngredient(ingredient);
    if (!grouped[marketType]) {
      grouped[marketType] = [];
    }
    grouped[marketType].push(ingredient);
  }
  
  return grouped;
}
