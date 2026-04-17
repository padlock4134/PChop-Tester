// Utility functions for passively identifying main equipment and main item

export function getMainEquipment(equipment: string[] = []): string | null {
  return equipment.length > 0 ? equipment[0] : null;
}

export function getMainItem(items: string[] = []): string | null {
  return items.length > 0 ? items[0] : null;
}
