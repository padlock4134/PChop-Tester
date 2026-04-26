export interface MaterialProperty {
  name: string;
  unit: string;
  value: number;
}

export interface WeldingMaterial {
  id: number;
  name: string;
  properties: MaterialProperty[];
}

export interface KeyMaterialSpecs {
  tensileStrength: number;
  yieldStrength: number;
  elongation: number;
  hardness: number;
  weldability?: number;
  impactToughness?: number;
  thermalConductivity?: number;
  meltingPoint?: number;
  carbonContent?: number;
}
