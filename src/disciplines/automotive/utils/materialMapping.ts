// Part to store type mapping and pricing estimates
// Used for Build Repair Order feature to show which parts to buy at which stores

export interface IngredientPrice {
  ingredient: string;
  estimatedPrice: number;
  unit: string;
  marketType: string;
}

// Map part keywords to store types
export const ingredientToMarketType: Record<string, string> = {
  // Engine Parts (auto parts store)
  'spark plug': 'auto_parts',
  'spark plugs': 'auto_parts',
  'ignition coil': 'auto_parts',
  'timing belt': 'auto_parts',
  'timing chain': 'auto_parts',
  'serpentine belt': 'auto_parts',
  'drive belt': 'auto_parts',
  'valve cover gasket': 'auto_parts',
  'head gasket': 'auto_parts',
  'intake manifold gasket': 'auto_parts',
  'exhaust manifold gasket': 'auto_parts',
  'piston rings': 'auto_parts',
  'engine mount': 'auto_parts',
  'thermostat': 'auto_parts',
  'water pump': 'auto_parts',
  'fuel pump': 'auto_parts',
  'fuel filter': 'auto_parts',
  'air filter': 'auto_parts',
  'oil filter': 'auto_parts',
  'cabin filter': 'auto_parts',
  'pcv valve': 'auto_parts',
  
  // Brake Parts (auto parts store)
  'brake pads': 'auto_parts',
  'brake pad': 'auto_parts',
  'brake rotor': 'auto_parts',
  'brake rotors': 'auto_parts',
  'brake caliper': 'auto_parts',
  'brake line': 'auto_parts',
  'brake fluid': 'auto_parts',
  'brake drum': 'auto_parts',
  'brake shoes': 'auto_parts',
  'master cylinder': 'auto_parts',
  
  // Electrical (auto parts store)
  'battery': 'auto_parts',
  'alternator': 'auto_parts',
  'starter motor': 'auto_parts',
  'starter': 'auto_parts',
  'fuse': 'auto_parts',
  'fuses': 'auto_parts',
  'relay': 'auto_parts',
  'wiring harness': 'auto_parts',
  'headlight bulb': 'auto_parts',
  'tail light bulb': 'auto_parts',
  'oxygen sensor': 'auto_parts',
  'o2 sensor': 'auto_parts',
  'mass air flow sensor': 'auto_parts',
  'maf sensor': 'auto_parts',
  'crankshaft position sensor': 'auto_parts',
  'camshaft position sensor': 'auto_parts',
  'coolant temperature sensor': 'auto_parts',
  'knock sensor': 'auto_parts',
  'throttle position sensor': 'auto_parts',
  
  // Fluids & Chemicals (auto parts store)
  'motor oil': 'auto_parts',
  'engine oil': 'auto_parts',
  'synthetic oil': 'auto_parts',
  'transmission fluid': 'auto_parts',
  'coolant': 'auto_parts',
  'antifreeze': 'auto_parts',
  'power steering fluid': 'auto_parts',
  'windshield washer fluid': 'auto_parts',
  'refrigerant': 'auto_parts',
  'penetrating oil': 'auto_parts',
  'wd-40': 'auto_parts',
  'brake cleaner': 'auto_parts',
  'carburetor cleaner': 'auto_parts',
  'gasket maker': 'auto_parts',
  'thread locker': 'auto_parts',
  'dielectric grease': 'auto_parts',
  
  // Tires & Wheels (tire shop)
  'tire': 'tire_shop',
  'tires': 'tire_shop',
  'wheel': 'tire_shop',
  'wheels': 'tire_shop',
  'rim': 'tire_shop',
  'rims': 'tire_shop',
  'valve stem': 'tire_shop',
  'tpms sensor': 'tire_shop',
  'wheel bearing': 'tire_shop',
  'hub assembly': 'tire_shop',
  'lug nut': 'tire_shop',
  'lug nuts': 'tire_shop',
  
  // Suspension & Steering (auto parts store)
  'shock absorber': 'auto_parts',
  'strut': 'auto_parts',
  'struts': 'auto_parts',
  'control arm': 'auto_parts',
  'ball joint': 'auto_parts',
  'tie rod end': 'auto_parts',
  'tie rod': 'auto_parts',
  'sway bar link': 'auto_parts',
  'cv axle': 'auto_parts',
  'cv boot': 'auto_parts',
  'u-joint': 'auto_parts',
  'coil spring': 'auto_parts',
  'leaf spring': 'auto_parts',
  
  // Body & Exterior (salvage yard / dealer)
  'bumper': 'salvage',
  'fender': 'salvage',
  'hood': 'salvage',
  'door panel': 'salvage',
  'mirror': 'salvage',
  'side mirror': 'salvage',
  'headlight assembly': 'salvage',
  'tail light assembly': 'salvage',
  'grille': 'salvage',
  'windshield': 'salvage',
  'window regulator': 'salvage',
  'door handle': 'salvage',
  
  // Dealer / OEM Parts
  'ecu': 'dealer',
  'ecm': 'dealer',
  'tcm': 'dealer',
  'key fob': 'dealer',
  'immobilizer': 'dealer',
  'infotainment': 'dealer',
  'airbag': 'dealer',
  'catalytic converter': 'dealer',
  
  // Tools (tool supplier)
  'socket set': 'tools',
  'torque wrench': 'tools',
  'impact wrench': 'tools',
  'jack stands': 'tools',
  'floor jack': 'tools',
  'obd scanner': 'tools',
  'multimeter': 'tools',
  'brake bleeder': 'tools',
  'compression tester': 'tools',
  'timing light': 'tools',
  'bore gauge': 'tools',
  'feeler gauge': 'tools',
  'spring compressor': 'tools',
};

// Basic price estimates (in USD)
export const ingredientPriceEstimates: Record<string, { price: number; unit: string }> = {
  // Engine Parts
  'spark plug': { price: 8, unit: 'each' },
  'spark plugs': { price: 32, unit: 'set' },
  'ignition coil': { price: 45, unit: 'each' },
  'timing belt': { price: 35, unit: 'each' },
  'serpentine belt': { price: 25, unit: 'each' },
  'valve cover gasket': { price: 20, unit: 'each' },
  'head gasket': { price: 55, unit: 'each' },
  'thermostat': { price: 15, unit: 'each' },
  'water pump': { price: 65, unit: 'each' },
  'fuel pump': { price: 85, unit: 'each' },
  'engine mount': { price: 50, unit: 'each' },
  
  // Filters
  'air filter': { price: 15, unit: 'each' },
  'oil filter': { price: 8, unit: 'each' },
  'fuel filter': { price: 18, unit: 'each' },
  'cabin filter': { price: 15, unit: 'each' },
  
  // Brake Parts
  'brake pads': { price: 40, unit: 'set' },
  'brake pad': { price: 40, unit: 'set' },
  'brake rotor': { price: 45, unit: 'each' },
  'brake rotors': { price: 90, unit: 'pair' },
  'brake caliper': { price: 80, unit: 'each' },
  'brake fluid': { price: 12, unit: 'bottle' },
  'master cylinder': { price: 120, unit: 'each' },
  
  // Electrical
  'battery': { price: 150, unit: 'each' },
  'alternator': { price: 180, unit: 'each' },
  'starter motor': { price: 160, unit: 'each' },
  'starter': { price: 160, unit: 'each' },
  'fuse': { price: 1, unit: 'each' },
  'oxygen sensor': { price: 50, unit: 'each' },
  'headlight bulb': { price: 15, unit: 'each' },
  
  // Fluids
  'motor oil': { price: 30, unit: '5qt' },
  'engine oil': { price: 30, unit: '5qt' },
  'synthetic oil': { price: 40, unit: '5qt' },
  'transmission fluid': { price: 12, unit: 'quart' },
  'coolant': { price: 15, unit: 'gallon' },
  'antifreeze': { price: 15, unit: 'gallon' },
  'power steering fluid': { price: 8, unit: 'bottle' },
  'brake cleaner': { price: 5, unit: 'can' },
  
  // Tires
  'tire': { price: 120, unit: 'each' },
  'tires': { price: 480, unit: 'set' },
  'wheel bearing': { price: 45, unit: 'each' },
  'hub assembly': { price: 85, unit: 'each' },
  
  // Suspension
  'shock absorber': { price: 60, unit: 'each' },
  'strut': { price: 80, unit: 'each' },
  'control arm': { price: 70, unit: 'each' },
  'ball joint': { price: 35, unit: 'each' },
  'tie rod end': { price: 25, unit: 'each' },
  'cv axle': { price: 75, unit: 'each' },
  
  // Body
  'bumper': { price: 200, unit: 'each' },
  'fender': { price: 150, unit: 'each' },
  'headlight assembly': { price: 120, unit: 'each' },
  'mirror': { price: 60, unit: 'each' },
  'windshield': { price: 250, unit: 'each' },
  
  // Tools
  'socket set': { price: 50, unit: 'set' },
  'torque wrench': { price: 45, unit: 'each' },
  'obd scanner': { price: 35, unit: 'each' },
  'multimeter': { price: 30, unit: 'each' },
  'jack stands': { price: 40, unit: 'pair' },
  'floor jack': { price: 60, unit: 'each' },
};

/**
 * Determine which store type a part should be purchased from
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
  
  // Default to auto_parts if no match
  return 'auto_parts';
}

/**
 * Get estimated price for a part
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
 * Group parts by store type
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
