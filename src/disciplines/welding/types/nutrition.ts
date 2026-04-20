export interface FoodNutrient {
  name: string;
  unit: string;
  value: number;
}

export interface Food {
  id: number;
  name: string;
  nutrients: FoodNutrient[];
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
