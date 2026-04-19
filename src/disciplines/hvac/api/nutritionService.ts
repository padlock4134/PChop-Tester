import { Food, FoodNutrient } from '../types/nutrition';

// HVAC system spec metrics (field names kept for backward compat with shared infrastructure)
// In HVAC context: carbs→complexity, sugars→precision, fiber→durability,
// protein→capacity, saturatedFat→energyDraw, omega3→efficiency,
// cholesterol→maintenanceFreq, sodium→costFactor, phosphorus→weight
interface KeyNutrients {
  carbs: number;
  sugars: number;
  fiber: number;
  protein: number;
  saturatedFat: number;
  sodium: number;
  omega3: number;
  antioxidants: number;
  cholesterol: number;
  potassium: number;
  phosphorus: number;
}

// Static spec lookup for HVAC components (no external API needed)
export async function fetchNutritionData(component: string): Promise<Food | null> {
  // Return static baseline specs for HVAC components
  return {
    id: Math.floor(Math.random() * 10000),
    name: component,
    nutrients: [
      { name: 'complexity', unit: 'rating', value: 3 },
      { name: 'precision', unit: 'rating', value: 2 },
      { name: 'durability', unit: 'rating', value: 4 },
      { name: 'capacity', unit: 'BTU', value: 5 },
      { name: 'energy_draw', unit: 'amps', value: 1 },
      { name: 'efficiency', unit: 'SEER', value: 4 },
      { name: 'maintenance_freq', unit: 'months', value: 1 },
      { name: 'cost_factor', unit: 'USD', value: 2 },
      { name: 'weight', unit: 'lbs', value: 1 }
    ]
  };
}

// Extract key spec metrics from component data
export function getKeyNutrients(nutrients: FoodNutrient[]): KeyNutrients {
  const result: KeyNutrients = {
    carbs: 0,
    sugars: 0,
    fiber: 0,
    protein: 0,
    saturatedFat: 0,
    omega3: 0,
    cholesterol: 0,
    sodium: 0,
    phosphorus: 0,
    antioxidants: 0,
    potassium: 0
  };

  nutrients.forEach(nutrient => {
    switch (nutrient.name.toLowerCase()) {
      case 'complexity':
        result.carbs = nutrient.value;
        break;
      case 'precision':
        result.sugars = nutrient.value;
        break;
      case 'durability':
        result.fiber = nutrient.value;
        break;
      case 'capacity':
        result.protein = nutrient.value;
        break;
      case 'energy_draw':
        result.saturatedFat = nutrient.value;
        break;
      case 'efficiency':
        result.omega3 = nutrient.value;
        break;
      case 'maintenance_freq':
        result.cholesterol = nutrient.value;
        break;
      case 'cost_factor':
        result.sodium = nutrient.value;
        break;
      case 'weight':
        result.phosphorus = nutrient.value;
        break;
    }
  });

  return result;
}

// Calculate aggregate system specs for a project's component list
export async function calculateRecipeNutrition(
  components: string[]
): Promise<{ carbs: number; sugars: number; fiber: number; protein: number; saturatedFat: number; sodium: number; omega3: number; antioxidants: number; cholesterol: number; potassium: number; phosphorus: number }> {
  const totalSpecs = {
    carbs: 0,
    sugars: 0,
    fiber: 0,
    protein: 0,
    saturatedFat: 0,
    sodium: 0,
    omega3: 0,
    antioxidants: 0,
    cholesterol: 0,
    potassium: 0,
    phosphorus: 0
  };
  
  const specData = await Promise.all(
    components.map(component => fetchNutritionData(component))
  );
  
  specData.forEach((item) => {
    if (item) {
      const specs = getKeyNutrients(item.nutrients);
      Object.keys(specs).forEach(key => {
        const k = key as keyof typeof totalSpecs;
        totalSpecs[k] += specs[k];
      });
    }
  });
  
  return totalSpecs;
}
