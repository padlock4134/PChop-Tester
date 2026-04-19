// Utility functions for identifying primary tool and primary component from a project

export function getMainEquipment(equipment: string[] = []): string | null {
  return equipment.length > 0 ? equipment[0] : null;
}

export function getMainIngredient(ingredients: string[] = []): string | null {
  return ingredients.length > 0 ? ingredients[0] : null;
}
