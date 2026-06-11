import { Food, FoodNutrient } from '../types/nutrition';

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

const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const API_KEY = (import.meta as any).env.VITE_USDA_API_KEY;

export async function fetchNutritionData(ingredient: string): Promise<Food | null> {
  try {
    const response = await fetch(`${USDA_API_URL}?api_key=${API_KEY}&query=${encodeURIComponent(ingredient)}`);
    
    const data = await response.json();
    
    if (data.foods && data.foods.length > 0) {
      const food = data.foods[0];
      return {
        id: food.fdcId,
        name: food.description,
        nutrients: food.foodNutrients.map((nutrient: any) => ({
          name: nutrient.nutrientName,
          unit: nutrient.unitName,
          value: nutrient.value
        }))
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching nutrition data:', error);
    return null;
  }
}

// Get key nutrients for diabetes management
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
      case 'carbohydrate, by difference':
        result.carbs = nutrient.value;
        break;
      case 'sugars, total including nlea':
        result.sugars = nutrient.value;
        break;
      case 'fiber, total dietary':
        result.fiber = nutrient.value;
        break;
      case 'protein':
        result.protein = nutrient.value;
        break;
      case 'fatty acids, total saturated':
        result.saturatedFat = nutrient.value;
        break;
      case 'cholesterol':
        result.cholesterol = nutrient.value;
        break;
      case 'sodium, na':
        result.sodium = nutrient.value;
        break;
      case 'phosphorus, p':
        result.phosphorus = nutrient.value;
        break;
      case 'omega-3 fatty acids':
        result.omega3 = nutrient.value;
        break;
      case 'total antioxidant capacity':
        result.antioxidants = nutrient.value;
        break;
      case 'potassium, k':
        result.potassium = nutrient.value;
        break;
    }
  });

  return result;
}

export async function calculateRecipeNutrition(
  ingredients: string[]
): Promise<{ carbs: number; sugars: number; fiber: number; protein: number; saturatedFat: number; sodium: number; omega3: number; antioxidants: number; cholesterol: number; potassium: number; phosphorus: number }> {
  const totalNutrition: { carbs: number; sugars: number; fiber: number; protein: number; saturatedFat: number; sodium: number; omega3: number; antioxidants: number; cholesterol: number; potassium: number; phosphorus: number } = {
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
  
  const nutritionData = await Promise.all(
    ingredients.map(ingredient => fetchNutritionData(ingredient))
  );
  
  nutritionData.forEach((food, index) => {
    if (food) {
      const nutrients = getKeyNutrients(food.nutrients);
      
      // Log if any nutrient is zero
      if (nutrients.carbs === 0) console.warn(`Carbs zero for ${food.name}`);
      if (nutrients.sugars === 0) console.warn(`Sugars zero for ${food.name}`);
      if (nutrients.fiber === 0) console.warn(`Fiber zero for ${food.name}`);
      if (nutrients.protein === 0) console.warn(`Protein zero for ${food.name}`);
      if (nutrients.saturatedFat === 0) console.warn(`Saturated fat zero for ${food.name}`);
      if (nutrients.sodium === 0) console.warn(`Sodium zero for ${food.name}`);
      if (nutrients.omega3 === 0) console.warn(`Omega 3 zero for ${food.name}`);
      if (nutrients.antioxidants === 0) console.warn(`Antioxidants zero for ${food.name}`);
      if (nutrients.cholesterol === 0) console.warn(`Cholesterol zero for ${food.name}`);
      if (nutrients.potassium === 0) console.warn(`Potassium zero for ${food.name}`);
      if (nutrients.phosphorus === 0) console.warn(`Phosphorus zero for ${food.name}`);
      
      Object.keys(nutrients).forEach(key => {
        const k = key as keyof { carbs: number; sugars: number; fiber: number; protein: number; saturatedFat: number; sodium: number; omega3: number; antioxidants: number; cholesterol: number; potassium: number; phosphorus: number };
        totalNutrition[k] += nutrients[k];
      });
    }
  });
  
  return totalNutrition;
}
