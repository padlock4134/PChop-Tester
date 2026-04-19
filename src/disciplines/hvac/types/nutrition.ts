// System specification data types for HVAC components
// Field names kept for backward compatibility with shared infrastructure

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

// KeyNutrients maps to HVAC system metrics in this discipline:
// carbs → complexity rating, sugars → precision required, fiber → durability,
// protein → capacity/BTU, saturatedFat → energy draw, omega3 → efficiency,
// cholesterol → maintenance freq, sodium → cost factor, phosphorus → weight
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
