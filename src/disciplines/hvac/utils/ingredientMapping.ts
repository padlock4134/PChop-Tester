// Component to supply house type mapping and pricing estimates
// Used for Build System Plan feature to show which components to source from which suppliers

export interface IngredientPrice {
  ingredient: string;
  estimatedPrice: number;
  unit: string;
  marketType: string;
}

// Map component keywords to supply house types
export const ingredientToMarketType: Record<string, string> = {
  // Refrigerant & Chemicals (refrigerant supplier)
  'r-410a': 'refrigerant_supplier',
  'r-22': 'refrigerant_supplier',
  'r-134a': 'refrigerant_supplier',
  'r-404a': 'refrigerant_supplier',
  'r-407c': 'refrigerant_supplier',
  'refrigerant': 'refrigerant_supplier',
  'nitrogen': 'refrigerant_supplier',
  'brazing alloy': 'refrigerant_supplier',
  'solder': 'refrigerant_supplier',
  'flux': 'refrigerant_supplier',
  'leak detector fluid': 'refrigerant_supplier',
  'vacuum pump oil': 'refrigerant_supplier',
  
  // Compressors & Major Components (HVAC distributor)
  'compressor': 'hvac_distributor',
  'condenser': 'hvac_distributor',
  'evaporator': 'hvac_distributor',
  'heat exchanger': 'hvac_distributor',
  'blower motor': 'hvac_distributor',
  'condenser fan motor': 'hvac_distributor',
  'expansion valve': 'hvac_distributor',
  'txv': 'hvac_distributor',
  'metering device': 'hvac_distributor',
  'accumulator': 'hvac_distributor',
  'receiver drier': 'hvac_distributor',
  'reversing valve': 'hvac_distributor',
  'coil': 'hvac_distributor',
  'air handler': 'hvac_distributor',
  'furnace': 'hvac_distributor',
  'heat pump': 'hvac_distributor',
  'condenser unit': 'hvac_distributor',
  'package unit': 'hvac_distributor',
  'mini split': 'hvac_distributor',
  
  // Electrical Components (electrical supply)
  'contactor': 'electrical_supply',
  'capacitor': 'electrical_supply',
  'relay': 'electrical_supply',
  'transformer': 'electrical_supply',
  'fuse': 'electrical_supply',
  'circuit breaker': 'electrical_supply',
  'disconnect': 'electrical_supply',
  'wire': 'electrical_supply',
  'wire nut': 'electrical_supply',
  'conduit': 'electrical_supply',
  'thermostat wire': 'electrical_supply',
  'control board': 'electrical_supply',
  'defrost board': 'electrical_supply',
  'time delay': 'electrical_supply',
  'pressure switch': 'electrical_supply',
  'limit switch': 'electrical_supply',
  
  // Controls & Thermostats (controls supplier)
  'thermostat': 'controls_supplier',
  'programmable thermostat': 'controls_supplier',
  'smart thermostat': 'controls_supplier',
  'zone damper': 'controls_supplier',
  'zone board': 'controls_supplier',
  'humidistat': 'controls_supplier',
  'economizer controller': 'controls_supplier',
  'vfd': 'controls_supplier',
  'bms controller': 'controls_supplier',
  'sensor': 'controls_supplier',
  'temperature sensor': 'controls_supplier',
  'pressure transducer': 'controls_supplier',
  
  // Ductwork & Sheet Metal (sheet metal shop)
  'ductwork': 'sheet_metal_shop',
  'flex duct': 'sheet_metal_shop',
  'rigid duct': 'sheet_metal_shop',
  'register': 'sheet_metal_shop',
  'grille': 'sheet_metal_shop',
  'diffuser': 'sheet_metal_shop',
  'damper': 'sheet_metal_shop',
  'duct board': 'sheet_metal_shop',
  'plenum': 'sheet_metal_shop',
  'transition': 'sheet_metal_shop',
  'elbow': 'sheet_metal_shop',
  'tee': 'sheet_metal_shop',
  'takeoff': 'sheet_metal_shop',
  
  // Piping & Fittings (plumbing/pipe supply)
  'copper pipe': 'pipe_supply',
  'copper tubing': 'pipe_supply',
  'line set': 'pipe_supply',
  'pvc pipe': 'pipe_supply',
  'condensate line': 'pipe_supply',
  'fitting': 'pipe_supply',
  'coupling': 'pipe_supply',
  'valve': 'pipe_supply',
  'service valve': 'pipe_supply',
  'ball valve': 'pipe_supply',
  'check valve': 'pipe_supply',
  'p-trap': 'pipe_supply',
  'insulation': 'pipe_supply',
  'pipe insulation': 'pipe_supply',
  
  // Fasteners & Hardware (hardware store)
  'screws': 'hardware_store',
  'bolts': 'hardware_store',
  'hangers': 'hardware_store',
  'straps': 'hardware_store',
  'anchors': 'hardware_store',
  'zip ties': 'hardware_store',
  'duct tape': 'hardware_store',
  'mastic': 'hardware_store',
  'caulk': 'hardware_store',
  'foam sealant': 'hardware_store',
  'sheet metal screws': 'hardware_store',
  'lag bolts': 'hardware_store',
  'unistrut': 'hardware_store',
  
  // Filters & Maintenance (general supply)
  'filter': 'general_supply',
  'air filter': 'general_supply',
  'belt': 'general_supply',
  'lubricant': 'general_supply',
  'cleaner': 'general_supply',
  'coil cleaner': 'general_supply',
  'drain pan tablet': 'general_supply',
  'uv light': 'general_supply',
  'condensate pump': 'general_supply',
};

// Basic price estimates (in USD)
export const ingredientPriceEstimates: Record<string, { price: number; unit: string }> = {
  // Refrigerant & Chemicals
  'r-410a': { price: 85, unit: '25lb jug' },
  'r-22': { price: 150, unit: '30lb jug' },
  'r-134a': { price: 45, unit: '30lb jug' },
  'refrigerant': { price: 85, unit: 'jug' },
  'nitrogen': { price: 35, unit: 'tank rental' },
  'brazing alloy': { price: 25, unit: 'pack' },
  'solder': { price: 12, unit: 'roll' },
  'flux': { price: 8, unit: 'jar' },
  
  // Major Components
  'compressor': { price: 450, unit: 'each' },
  'condenser fan motor': { price: 120, unit: 'each' },
  'blower motor': { price: 180, unit: 'each' },
  'expansion valve': { price: 65, unit: 'each' },
  'txv': { price: 65, unit: 'each' },
  'evaporator': { price: 350, unit: 'each' },
  'condenser': { price: 800, unit: 'each' },
  'heat exchanger': { price: 500, unit: 'each' },
  'air handler': { price: 1200, unit: 'each' },
  'furnace': { price: 900, unit: 'each' },
  'reversing valve': { price: 180, unit: 'each' },
  
  // Electrical
  'contactor': { price: 25, unit: 'each' },
  'capacitor': { price: 18, unit: 'each' },
  'relay': { price: 15, unit: 'each' },
  'transformer': { price: 30, unit: 'each' },
  'fuse': { price: 5, unit: 'each' },
  'circuit breaker': { price: 20, unit: 'each' },
  'disconnect': { price: 35, unit: 'each' },
  'wire': { price: 45, unit: '250ft roll' },
  'thermostat wire': { price: 30, unit: '250ft roll' },
  'control board': { price: 150, unit: 'each' },
  
  // Controls
  'thermostat': { price: 75, unit: 'each' },
  'smart thermostat': { price: 200, unit: 'each' },
  'zone damper': { price: 90, unit: 'each' },
  'zone board': { price: 175, unit: 'each' },
  'sensor': { price: 20, unit: 'each' },
  
  // Ductwork
  'flex duct': { price: 35, unit: '25ft' },
  'rigid duct': { price: 15, unit: 'per ft' },
  'register': { price: 12, unit: 'each' },
  'grille': { price: 15, unit: 'each' },
  'diffuser': { price: 25, unit: 'each' },
  'plenum': { price: 80, unit: 'each' },
  
  // Piping
  'copper tubing': { price: 4, unit: 'per ft' },
  'line set': { price: 75, unit: '25ft set' },
  'pvc pipe': { price: 8, unit: '10ft' },
  'insulation': { price: 15, unit: '6ft' },
  'pipe insulation': { price: 15, unit: '6ft' },
  
  // Hardware
  'screws': { price: 8, unit: 'box' },
  'hangers': { price: 12, unit: 'pack' },
  'straps': { price: 10, unit: 'pack' },
  'duct tape': { price: 8, unit: 'roll' },
  'mastic': { price: 15, unit: 'bucket' },
  'zip ties': { price: 6, unit: 'pack' },
  
  // Filters & Maintenance
  'filter': { price: 8, unit: 'each' },
  'air filter': { price: 8, unit: 'each' },
  'belt': { price: 12, unit: 'each' },
  'coil cleaner': { price: 15, unit: 'can' },
  'condensate pump': { price: 60, unit: 'each' },
};

/**
 * Determine which supply house type a component should be sourced from
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
  
  // Default to general supply if no match
  return 'general_supply';
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
 * Group components by supply house type
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
