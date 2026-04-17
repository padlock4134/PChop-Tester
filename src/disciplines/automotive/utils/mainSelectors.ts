// Utility functions for passively identifying main equipment and main part

export function getMainEquipment(equipment: string[] = []): string | null {
  return equipment.length > 0 ? equipment[0] : null;
}

export function getMainPart(ingredients: string[] = []): string | null {
  return ingredients.length > 0 ? ingredients[0] : null;
}
