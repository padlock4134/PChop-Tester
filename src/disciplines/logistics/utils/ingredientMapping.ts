// Item to market type mapping and pricing estimates
// Used for Build Menu feature to show which items to buy at which markets

export interface ItemPrice {
  item: string;
  estimatedPrice: number;
  unit: string;
  marketType: string;
}

export const itemToMarketType: Record<string, string> = {
  'pallet': 'warehouse',
  'standard pallet': 'warehouse',
  'oversized pallet': 'warehouse',
  'parcel': 'warehouse',
  'shrink wrap': 'packaging',
  'stretch wrap': 'packaging',
  'strapping': 'packaging',
  'corner boards': 'packaging',
  'barcode labels': 'documents',
  'bol': 'documents',
  'bill of lading': 'documents',
  'pod form': 'documents',
  'manifest': 'documents',
  'forklift': 'equipment',
  'pallet jack': 'equipment',
  'hand truck': 'equipment',
  'dock plate': 'equipment',
  'dock leveler': 'equipment',
  'rf scanner': 'equipment',
  'reefer fuel': 'fleet',
  'diesel': 'fleet',
  'def fluid': 'fleet',
  'hazmat placard': 'safety',
  'safety vest': 'safety',
  'safety gloves': 'safety',
  'spill kit': 'safety',
  'refrigerant': 'cold_storage',
  'temp logger': 'cold_storage',
  'insulated liner': 'cold_storage',
  'seal tag': 'security',
  'cargo lock': 'security'
};

export const itemPriceEstimates: Record<string, { price: number; unit: string }> = {
  'standard pallet': { price: 12, unit: 'each' },
  'oversized pallet': { price: 22, unit: 'each' },
  'parcel': { price: 4.5, unit: 'package' },
  'shrink wrap roll': { price: 25, unit: 'roll' },
  'stretch wrap': { price: 18, unit: 'roll' },
  'strapping': { price: 35, unit: 'coil' },
  'corner boards': { price: 1.25, unit: 'each' },
  'barcode labels': { price: 18, unit: 'pack' },
  'bol forms': { price: 15, unit: 'pack' },
  'pod form': { price: 12, unit: 'pack' },
  'manifest sheet': { price: 0.2, unit: 'each' },
  'forklift rental': { price: 150, unit: 'day' },
  'pallet jack': { price: 380, unit: 'each' },
  'hand truck': { price: 95, unit: 'each' },
  'dock plate': { price: 425, unit: 'each' },
  'dock leveler': { price: 1200, unit: 'each' },
  'rf scanner': { price: 899, unit: 'each' },
  'reefer fuel': { price: 4.25, unit: 'gallon' },
  'diesel': { price: 3.95, unit: 'gallon' },
  'def fluid': { price: 14, unit: '2.5-gal jug' },
  'hazmat placard': { price: 7, unit: 'set' },
  'safety vest': { price: 9, unit: 'each' },
  'safety gloves': { price: 12, unit: 'pair' },
  'spill kit': { price: 68, unit: 'kit' },
  'refrigerant': { price: 180, unit: 'cylinder' },
  'temp logger': { price: 45, unit: 'each' },
  'insulated liner': { price: 6, unit: 'each' },
  'seal tag': { price: 0.35, unit: 'each' },
  'cargo lock': { price: 28, unit: 'each' }
};

/**
 * Determine which market type an item should be purchased from
 */
export function getMarketTypeForItem(item: string): string {
  const lowerItem = item.toLowerCase();

  if (itemToMarketType[lowerItem]) {
    return itemToMarketType[lowerItem];
  }

  for (const [key, marketType] of Object.entries(itemToMarketType)) {
    if (lowerItem.includes(key)) {
      return marketType;
    }
  }

  return 'warehouse';
}

/**
 * Get estimated price for an item
 */
export function getEstimatedPrice(item: string): { price: number; unit: string } | null {
  const lowerItem = item.toLowerCase();

  if (itemPriceEstimates[lowerItem]) {
    return itemPriceEstimates[lowerItem];
  }

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
