// Utility helpers for identifying primary equipment/material inputs.

export function getMainEquipment(equipment: string[] = []): string | null {
  return equipment.length > 0 ? equipment[0] : null;
}

export function getPrimaryMaterial(materials: string[] = []): string | null {
  return materials.length > 0 ? materials[0] : null;
}

// Backward-compatible aliases.
export function getMainIngredient(materials: string[] = []): string | null {
  return getPrimaryMaterial(materials);
}

export function getMainMaterial(materials: string[] = []): string | null {
  return getPrimaryMaterial(materials);
}
