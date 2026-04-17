export interface __PROTECT_CARGONUTRIENT__ {
  name: string;
  unit: string;
  value: number;
}

export interface __PROTECT_CARGO__ {
  id: number;
  name: string;
  nutrients: __PROTECT_CARGONUTRIENT__[];
}

export interface KeyNutrients {
  carbs: number;
  sugars: number;
  fiber: number;
  protein: number;
  saturatedFat?: number;
  omega3?: number;
  cholesterol?: number;
  sodium?: number;
  phosphorus?: number;
}
