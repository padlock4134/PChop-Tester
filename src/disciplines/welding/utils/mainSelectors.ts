// Utility functions for passively identifying main equipment and main material

export function getMainEquipment(equipment: string[] = []): string | null {
  return equipment.length > 0 ? equipment[0] : null;
}

export function getMainMaterial(materials: string[] = []): string | null {
  return materials.length > 0 ? materials[0] : null;
}
