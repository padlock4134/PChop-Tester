import { WeldingMaterial, MaterialProperty, KeyMaterialSpecs } from '../types/nutrition';

// Built-in welding material database (offline-first, no external API)
const MATERIAL_DATABASE: Record<string, WeldingMaterial> = {
  'mild steel': {
    id: 1, name: 'Mild Steel (A36)',
    properties: [
      { name: 'Tensile Strength', unit: 'ksi', value: 58 },
      { name: 'Yield Strength', unit: 'ksi', value: 36 },
      { name: 'Elongation', unit: '%', value: 20 },
      { name: 'Hardness', unit: 'HB', value: 119 },
      { name: 'Weldability', unit: 'rating', value: 9 },
      { name: 'Carbon Content', unit: '%', value: 0.26 },
      { name: 'Melting Point', unit: '°F', value: 2750 },
    ]
  },
  'stainless steel': {
    id: 2, name: 'Stainless Steel (304)',
    properties: [
      { name: 'Tensile Strength', unit: 'ksi', value: 73 },
      { name: 'Yield Strength', unit: 'ksi', value: 31 },
      { name: 'Elongation', unit: '%', value: 40 },
      { name: 'Hardness', unit: 'HB', value: 201 },
      { name: 'Weldability', unit: 'rating', value: 7 },
      { name: 'Carbon Content', unit: '%', value: 0.08 },
      { name: 'Melting Point', unit: '°F', value: 2600 },
    ]
  },
  'aluminum': {
    id: 3, name: 'Aluminum (6061-T6)',
    properties: [
      { name: 'Tensile Strength', unit: 'ksi', value: 45 },
      { name: 'Yield Strength', unit: 'ksi', value: 40 },
      { name: 'Elongation', unit: '%', value: 12 },
      { name: 'Hardness', unit: 'HB', value: 95 },
      { name: 'Weldability', unit: 'rating', value: 6 },
      { name: 'Thermal Conductivity', unit: 'W/mK', value: 167 },
      { name: 'Melting Point', unit: '°F', value: 1200 },
    ]
  },
  'chromoly': {
    id: 4, name: 'Chromoly (4130)',
    properties: [
      { name: 'Tensile Strength', unit: 'ksi', value: 97 },
      { name: 'Yield Strength', unit: 'ksi', value: 63 },
      { name: 'Elongation', unit: '%', value: 22 },
      { name: 'Hardness', unit: 'HB', value: 217 },
      { name: 'Weldability', unit: 'rating', value: 5 },
      { name: 'Carbon Content', unit: '%', value: 0.30 },
      { name: 'Melting Point', unit: '°F', value: 2750 },
    ]
  },
  'carbon steel': {
    id: 5, name: 'Carbon Steel (1018)',
    properties: [
      { name: 'Tensile Strength', unit: 'ksi', value: 64 },
      { name: 'Yield Strength', unit: 'ksi', value: 54 },
      { name: 'Elongation', unit: '%', value: 15 },
      { name: 'Hardness', unit: 'HB', value: 126 },
      { name: 'Weldability', unit: 'rating', value: 8 },
      { name: 'Carbon Content', unit: '%', value: 0.18 },
      { name: 'Melting Point', unit: '°F', value: 2760 },
    ]
  },
};

// Look up material data from local database
export async function fetchMaterialData(material: string): Promise<WeldingMaterial | null> {
  console.log(`Looking up material specs for: ${material}`);

  const key = material.toLowerCase().trim();
  // Try exact match first, then partial match
  const match = MATERIAL_DATABASE[key]
    || Object.values(MATERIAL_DATABASE).find(m => m.name.toLowerCase().includes(key))
    || Object.entries(MATERIAL_DATABASE).find(([k]) => key.includes(k))?.[1]
    || null;

  return match;
}

// Extract key specs from a material's property list
export function getKeySpecs(properties: MaterialProperty[]): KeyMaterialSpecs {
  const result: KeyMaterialSpecs = {
    tensileStrength: 0,
    yieldStrength: 0,
    elongation: 0,
    hardness: 0,
    weldability: 0,
    impactToughness: 0,
    thermalConductivity: 0,
    meltingPoint: 0,
    carbonContent: 0,
  };

  properties.forEach(prop => {
    switch (prop.name.toLowerCase()) {
      case 'tensile strength': result.tensileStrength = prop.value; break;
      case 'yield strength': result.yieldStrength = prop.value; break;
      case 'elongation': result.elongation = prop.value; break;
      case 'hardness': result.hardness = prop.value; break;
      case 'weldability': result.weldability = prop.value; break;
      case 'impact toughness': result.impactToughness = prop.value; break;
      case 'thermal conductivity': result.thermalConductivity = prop.value; break;
      case 'melting point': result.meltingPoint = prop.value; break;
      case 'carbon content': result.carbonContent = prop.value; break;
    }
  });

  return result;
}

// Aggregate specs across multiple materials in a project
export async function calculateProjectMaterialSpecs(
  materials: string[]
): Promise<KeyMaterialSpecs> {
  const totalSpecs: KeyMaterialSpecs = {
    tensileStrength: 0,
    yieldStrength: 0,
    elongation: 0,
    hardness: 0,
    weldability: 0,
    impactToughness: 0,
    thermalConductivity: 0,
    meltingPoint: 0,
    carbonContent: 0,
  };

  const materialData = await Promise.all(
    materials.map(mat => fetchMaterialData(mat))
  );

  let count = 0;
  materialData.forEach((mat) => {
    if (mat) {
      count++;
      const specs = getKeySpecs(mat.properties);
      (Object.keys(specs) as (keyof KeyMaterialSpecs)[]).forEach(key => {
        totalSpecs[key] = (totalSpecs[key] || 0) + (specs[key] || 0);
      });
    }
  });

  // Average the specs when multiple materials are present
  if (count > 1) {
    (Object.keys(totalSpecs) as (keyof KeyMaterialSpecs)[]).forEach(key => {
      totalSpecs[key] = Math.round(((totalSpecs[key] || 0) / count) * 100) / 100;
    });
  }

  return totalSpecs;
}
