// Material to supplier type mapping and pricing estimates
// Used for Build Package feature to show which materials to source from which suppliers

export interface IngredientPrice {
  ingredient: string;
  estimatedPrice: number;
  unit: string;
  marketType: string;
}

// Map material keywords to supplier types
export const ingredientToMarketType: Record<string, string> = {
  // Base Metals → Metal Supplier
  'mild steel': 'metal_supplier',
  'carbon steel': 'metal_supplier',
  'stainless steel': 'metal_supplier',
  'aluminum': 'metal_supplier',
  'chromoly': 'metal_supplier',
  'inconel': 'metal_supplier',
  'titanium': 'metal_supplier',
  'copper': 'metal_supplier',
  'brass': 'metal_supplier',
  'cast iron': 'metal_supplier',
  'galvanized': 'metal_supplier',
  'duplex': 'metal_supplier',
  'nickel alloy': 'metal_supplier',
  'low alloy steel': 'metal_supplier',
  'high strength steel': 'metal_supplier',
  'plate': 'metal_supplier',
  'pipe': 'metal_supplier',
  'tubing': 'metal_supplier',
  'angle iron': 'metal_supplier',
  'flat bar': 'metal_supplier',
  'round bar': 'metal_supplier',
  'channel': 'metal_supplier',
  'i-beam': 'metal_supplier',
  'sheet metal': 'metal_supplier',

  // Filler Metals → Welding Supply
  'e6010': 'welding_supply',
  'e6011': 'welding_supply',
  'e6013': 'welding_supply',
  'e7018': 'welding_supply',
  'e7024': 'welding_supply',
  'er70s-6': 'welding_supply',
  'er308l': 'welding_supply',
  'er309l': 'welding_supply',
  'er316l': 'welding_supply',
  'er4043': 'welding_supply',
  'er5356': 'welding_supply',
  'electrode': 'welding_supply',
  'welding rod': 'welding_supply',
  'filler rod': 'welding_supply',
  'welding wire': 'welding_supply',
  'flux core wire': 'welding_supply',
  'tig rod': 'welding_supply',
  'brazing rod': 'welding_supply',

  // Shielding Gas → Gas Supplier
  'argon': 'gas_supplier',
  'co2': 'gas_supplier',
  '75/25': 'gas_supplier',
  'c25': 'gas_supplier',
  'shielding gas': 'gas_supplier',
  'acetylene': 'gas_supplier',
  'oxygen': 'gas_supplier',
  'helium': 'gas_supplier',
  'tri-mix': 'gas_supplier',
  'gas cylinder': 'gas_supplier',

  // Consumables → Welding Supply
  'contact tip': 'welding_supply',
  'nozzle': 'welding_supply',
  'liner': 'welding_supply',
  'diffuser': 'welding_supply',
  'collet': 'welding_supply',
  'collet body': 'welding_supply',
  'tungsten': 'welding_supply',
  'ceramic cup': 'welding_supply',
  'gas lens': 'welding_supply',
  'back cap': 'welding_supply',
  'anti-spatter': 'welding_supply',
  'tip dip': 'welding_supply',
  'soapstone': 'welding_supply',

  // PPE & Safety → Safety Supply
  'welding helmet': 'safety_supply',
  'auto-darkening helmet': 'safety_supply',
  'welding gloves': 'safety_supply',
  'welding jacket': 'safety_supply',
  'leather apron': 'safety_supply',
  'safety glasses': 'safety_supply',
  'respirator': 'safety_supply',
  'ear plugs': 'safety_supply',
  'fire blanket': 'safety_supply',
  'welding cap': 'safety_supply',
  'steel toe boots': 'safety_supply',
  'face shield': 'safety_supply',

  // Tools → Tool Supply
  'angle grinder': 'tool_supply',
  'wire brush': 'tool_supply',
  'chipping hammer': 'tool_supply',
  'welding clamp': 'tool_supply',
  'c-clamp': 'tool_supply',
  'vise grip': 'tool_supply',
  'welding magnet': 'tool_supply',
  'tape measure': 'tool_supply',
  'square': 'tool_supply',
  'level': 'tool_supply',
  'scribe': 'tool_supply',
  'center punch': 'tool_supply',
  'file': 'tool_supply',
  'pliers': 'tool_supply',
  'mig pliers': 'tool_supply',

  // Abrasives → Welding Supply
  'grinding wheel': 'welding_supply',
  'flap disc': 'welding_supply',
  'cut-off wheel': 'welding_supply',
  'sanding disc': 'welding_supply',
  'wire wheel': 'welding_supply',
};

// Basic price estimates (in USD)
export const ingredientPriceEstimates: Record<string, { price: number; unit: string }> = {
  // Base Metals
  'mild steel': { price: 2, unit: 'lb' },
  'carbon steel': { price: 2.50, unit: 'lb' },
  'stainless steel': { price: 5, unit: 'lb' },
  'aluminum': { price: 4, unit: 'lb' },
  'chromoly': { price: 8, unit: 'lb' },
  'inconel': { price: 25, unit: 'lb' },
  'titanium': { price: 30, unit: 'lb' },
  'copper': { price: 6, unit: 'lb' },
  'plate': { price: 45, unit: 'sheet' },
  'pipe': { price: 12, unit: 'ft' },
  'tubing': { price: 8, unit: 'ft' },
  'angle iron': { price: 6, unit: 'ft' },
  'flat bar': { price: 4, unit: 'ft' },
  'round bar': { price: 5, unit: 'ft' },
  'channel': { price: 10, unit: 'ft' },
  'i-beam': { price: 15, unit: 'ft' },
  'sheet metal': { price: 35, unit: 'sheet' },

  // Filler Metals
  'e6010': { price: 18, unit: '10lb box' },
  'e6011': { price: 16, unit: '10lb box' },
  'e6013': { price: 14, unit: '10lb box' },
  'e7018': { price: 22, unit: '10lb box' },
  'er70s-6': { price: 30, unit: '11lb spool' },
  'er308l': { price: 45, unit: '10lb spool' },
  'er4043': { price: 35, unit: '5lb spool' },
  'er5356': { price: 38, unit: '5lb spool' },
  'electrode': { price: 18, unit: 'box' },
  'welding rod': { price: 20, unit: 'box' },
  'welding wire': { price: 30, unit: 'spool' },
  'flux core wire': { price: 35, unit: 'spool' },
  'tig rod': { price: 25, unit: 'tube' },

  // Shielding Gas
  'argon': { price: 45, unit: 'tank refill' },
  'co2': { price: 25, unit: 'tank refill' },
  '75/25': { price: 50, unit: 'tank refill' },
  'c25': { price: 50, unit: 'tank refill' },
  'shielding gas': { price: 45, unit: 'tank refill' },
  'acetylene': { price: 35, unit: 'tank refill' },
  'oxygen': { price: 20, unit: 'tank refill' },

  // Consumables
  'contact tip': { price: 3, unit: 'pack' },
  'nozzle': { price: 8, unit: 'each' },
  'liner': { price: 12, unit: 'each' },
  'tungsten': { price: 15, unit: 'pack' },
  'ceramic cup': { price: 10, unit: 'pack' },
  'gas lens': { price: 18, unit: 'each' },
  'anti-spatter': { price: 8, unit: 'can' },
  'soapstone': { price: 5, unit: 'box' },

  // PPE & Safety
  'welding helmet': { price: 85, unit: 'each' },
  'auto-darkening helmet': { price: 150, unit: 'each' },
  'welding gloves': { price: 25, unit: 'pair' },
  'welding jacket': { price: 60, unit: 'each' },
  'leather apron': { price: 35, unit: 'each' },
  'safety glasses': { price: 8, unit: 'pair' },
  'respirator': { price: 30, unit: 'each' },
  'ear plugs': { price: 5, unit: 'pack' },
  'welding cap': { price: 12, unit: 'each' },

  // Tools
  'angle grinder': { price: 45, unit: 'each' },
  'wire brush': { price: 6, unit: 'each' },
  'chipping hammer': { price: 12, unit: 'each' },
  'welding clamp': { price: 15, unit: 'each' },
  'c-clamp': { price: 10, unit: 'each' },
  'vise grip': { price: 18, unit: 'each' },
  'welding magnet': { price: 12, unit: 'each' },
  'tape measure': { price: 8, unit: 'each' },
  'square': { price: 15, unit: 'each' },
  'scribe': { price: 5, unit: 'each' },
  'mig pliers': { price: 12, unit: 'each' },

  // Abrasives
  'grinding wheel': { price: 8, unit: 'each' },
  'flap disc': { price: 6, unit: 'each' },
  'cut-off wheel': { price: 4, unit: 'each' },
  'sanding disc': { price: 3, unit: 'each' },
  'wire wheel': { price: 10, unit: 'each' },
};

/**
 * Determine which supplier type a material should be sourced from
 */
export function getMarketTypeForIngredient(ingredient: string): string {
  const lowerItem = ingredient.toLowerCase();

  // Check for exact matches first
  if (ingredientToMarketType[lowerItem]) {
    return ingredientToMarketType[lowerItem];
  }

  // Check for partial matches
  for (const [key, supplierType] of Object.entries(ingredientToMarketType)) {
    if (lowerItem.includes(key)) {
      return supplierType;
    }
  }

  // Default to welding supply if no match
  return 'welding_supply';
}

/**
 * Get estimated price for a material or consumable
 */
export function getEstimatedPrice(ingredient: string): { price: number; unit: string } | null {
  const lowerItem = ingredient.toLowerCase();

  // Check for exact matches first
  if (ingredientPriceEstimates[lowerItem]) {
    return ingredientPriceEstimates[lowerItem];
  }

  // Check for partial matches
  for (const [key, priceInfo] of Object.entries(ingredientPriceEstimates)) {
    if (lowerItem.includes(key)) {
      return priceInfo;
    }
  }

  return null;
}

/**
 * Group materials by supplier type
 */
export function groupIngredientsByMarketType(ingredients: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const item of ingredients) {
    const supplierType = getMarketTypeForIngredient(item);
    if (!grouped[supplierType]) {
      grouped[supplierType] = [];
    }
    grouped[supplierType].push(item);
  }

  return grouped;
}
