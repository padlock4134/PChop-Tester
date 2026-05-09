import React, { useState } from 'react';

interface TestRunModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestRunModal: React.FC<TestRunModalProps> = ({ isOpen, onClose }) => {
  const CATEGORIES = [
    "Vegetable",
    "Fruit",
    "Protein",
    "Dairy",
    "Grain",
    "Spice",
    "Canned/Preserved",
    "Condiment/Sauce",
    "Frozen",
    "Other"
  ];

  const [input, setInput] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [filterText, setFilterText] = useState('');
  const [materials, setMaterials] = useState([
    { name: 'Chicken Breast', category: 'Protein' },
    { name: 'Broccoli', category: 'Vegetable' },
    { name: 'Rice', category: 'Grain' },
    { name: 'Garlic', category: 'Spice'},
    { name: 'Cheese', category: 'Dairy'}
  ]);
  const [scanLoading, setScanLoading] = useState(false);
  const [matcherOpen, setMatcherOpen] = useState(false);
  const [matcherLoading, setMatcherLoading] = useState(false);
  const [showRecipeMatcher, setShowRecipeMatcher] = useState(false);
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(true);
  const [matchedRecipes, setMatchedRecipes] = useState<Array<{
    fit: any;
    matchScore: number;
    matchingMaterials: string[];
  }>>([]);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const allRecipes = [
    {
      id: '1',
      title: 'Avocado Toast',
      image: '/Preview Images/Avacado Toast.png',
      materials: ['Bread', 'Avocado', 'Salt', 'Pepper', 'Red Pepper Flakes', 'Olive Oil'],
      instructions: 'Toast bread. Mash avocado with salt, pepper, and a drizzle of olive oil. Spread on toast and sprinkle with red pepper flakes.',
      equipment: ['Toaster', 'Knife', 'Bowl'],
      healthTags: ['Heart Healthy', 'High Fiber']
    },
    {
      id: '2',
      title: 'Baked Salmon',
      image: '/Preview Images/Baked Salmon.png',
      materials: ['Salmon fillet', 'Lemon', 'Dill', 'Olive Oil', 'Garlic', 'Salt', 'Pepper'],
      instructions: 'Preheat oven to 375°F. Place salmon on baking sheet, drizzle with olive oil, and season with salt, pepper, dill, and garlic. Add lemon slices on top. Bake for 12-15 minutes.',
      equipment: ['Baking Sheet', 'Oven'],
      healthTags: ['Heart Healthy', 'High in Omega-3']
    },
    {
      id: '3',
      title: 'Breakfast Burrito',
      image: '/Preview Images/Breakfast Burrito.png',
      materials: ['Tortilla', 'Eggs', 'Cheese', 'Sausage', 'Bell Peppers', 'Onion', 'Salt', 'Pepper', 'Butter'],
      instructions: 'Cook sausage, then sauté onions and bell peppers. Scramble eggs with salt and pepper. Warm tortilla and assemble with eggs, sausage, veggies, and cheese.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '4',
      title: 'Breakfast Tacos',
      image: '/Preview Images/Breakfast Tacos.png',
      materials: ['Corn Tortillas', 'Eggs', 'Black Beans', 'Avocado', 'Salsa', 'Cilantro', 'Lime', 'Salt', 'Pepper'],
      instructions: 'Warm tortillas. Scramble eggs with salt and pepper. Heat black beans. Assemble tacos with eggs, beans, avocado, salsa, and cilantro. Squeeze lime on top.',
      equipment: ['Skillet', 'Mixing Bowl'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '5',
      title: 'Chicken Fajitas',
      image: '/Preview Images/Chicken Fajitas.png',
      materials: ['Chicken Breast', 'Bell Peppers', 'Onion', 'Tortilla', 'Salsa', 'Cilantro', 'Lime', 'Salt', 'Pepper'],
      instructions: 'Sauté chicken, bell peppers, and onions. Warm tortillas. Assemble fajitas with chicken, veggies, salsa, and cilantro. Squeeze lime on top.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '6',
      title: 'Chicken Quesadillas',
      image: '/Preview Images/Chicken Quesadillas.png',
      materials: ['Chicken Breast', 'Tortilla', 'Cheese', 'Salsa', 'Cilantro', 'Lime', 'Salt', 'Pepper'],
      instructions: 'Shred chicken and mix with cheese. Place mixture on tortilla and top with another tortilla. Cook in skillet until cheese is melted and tortillas are crispy.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '7',
      title: 'Chicken and Rice Bowls',
      image: '/Preview Images/Chicken and Rice Bowls.png',
      materials: ['Chicken Breast', 'Rice', 'Vegetable Oil', 'Salt', 'Pepper'],
      instructions: 'Cook chicken and rice in skillet with vegetable oil. Season with salt and pepper.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '8',
      title: 'Chicken and Vegetable Kabobs',
      image: '/Preview Images/Chicken and Vegetable Kabobs.png',
      materials: ['Chicken Breast', 'Bell Peppers', 'Onion', 'Zucchini', 'Cherry Tomatoes', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Alternate chicken and vegetables on skewers. Brush with olive oil and season with salt and pepper. Grill or bake until cooked through.',
      equipment: ['Grill', 'Baking Sheet'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '9',
      title: 'Chickpea and Avocado Salad',
      image: '/Preview Images/Chickpea and Avocado Salad.png',
      materials: ['Chickpeas', 'Avocado', 'Red Onion', 'Cilantro', 'Lime', 'Salt', 'Pepper'],
      instructions: 'Mash avocado and mix with chickpeas, red onion, and cilantro. Squeeze lime on top and season with salt and pepper.',
      equipment: ['Mixing Bowl', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '10',
      title: 'Classic Beef Burger',
      image: '/Preview Images/Classic Beef Burger.png',
      materials: ['Ground Beef', 'Bun', 'Lettuce', 'Tomato', 'Cheese', 'Ketchup', 'Mayonnaise', 'Mustard'],
      instructions: 'Grill or pan-fry burger. Assemble with lettuce, tomato, cheese, ketchup, mayonnaise, and mustard.',
      equipment: ['Grill', 'Skillet'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '11',
      title: 'Garlic Butter Chicken with Rice',
      image: '/Preview Images/Garlic Butter Chicken with Rice.png',
      materials: ['Chicken Breast', 'Rice', 'Butter', 'Garlic', 'Salt', 'Pepper'],
      instructions: 'Cook chicken and rice in skillet with butter and garlic. Season with salt and pepper.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '12',
      title: 'Greek Salad',
      image: '/Preview Images/Greek Salad.png',
      materials: ['Lettuce', 'Tomato', 'Cucumber', 'Red Onion', 'Feta Cheese', 'Olives', 'Greek Vinaigrette'],
      instructions: 'Combine lettuce, tomato, cucumber, red onion, feta cheese, and olives in bowl. Drizzle with Greek vinaigrette.',
      equipment: ['Mixing Bowl', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '13',
      title: 'Grilled Cheese',
      image: '/Preview Images/Grilled Cheese.png',
      materials: ['Bread', 'Cheese', 'Butter'],
      instructions: 'Butter bread and place cheese in between. Grill in skillet until cheese is melted and bread is crispy.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['High Calcium']
    },
    {
      id: '14',
      title: 'Lemon Garlic Chicken with Roasted Broccoli',
      image: '/Preview Images/Lemon Garlic Chicken with Roasted Broccoli.png',
      materials: ['Chicken Breast', 'Broccoli', 'Lemon', 'Garlic', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Cook chicken and broccoli in skillet with lemon, garlic, and olive oil. Season with salt and pepper.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '15',
      title: 'Lemon Herb Roasted Chicken',
      image: '/Preview Images/Lemon Herb Roasted Chicken.png',
      materials: ['Chicken Breast', 'Lemon', 'Herbs', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Rub chicken with lemon, herbs, and olive oil. Season with salt and pepper. Roast in oven until cooked through.',
      equipment: ['Oven', 'Baking Sheet'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '16',
      title: 'Lentil Soup',
      image: '/Preview Images/Lentil Soup.png',
      materials: ['Lentils', 'Vegetable Broth', 'Onion', 'Carrot', 'Celery', 'Tomato', 'Cumin', 'Paprika'],
      instructions: 'Saute onion, carrot, and celery in pot. Add lentils, vegetable broth, tomato, cumin, and paprika. Simmer until lentils are tender.',
      equipment: ['Pot', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '17',
      title: 'Pasta Carbonara',
      image: '/Preview Images/Pasta Carbonara.png',
      materials: ['Pasta', 'Bacon', 'Eggs', 'Parmesan Cheese', 'Black Pepper'],
      instructions: 'Cook pasta in pot. Whisk eggs, parmesan cheese, and black pepper in bowl. Add cooked bacon to bowl and mix. Combine with cooked pasta.',
      equipment: ['Pot', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '18',
      title: 'Quinoa Salad Bowl',
      image: '/Preview Images/Quinoa Salad Bowl.png',
      materials: ['Quinoa', 'Mixed Greens', 'Cherry Tomatoes', 'Cucumber', 'Red Onion', 'Feta Cheese', 'Lemon Vinaigrette'],
      instructions: 'Combine quinoa, mixed greens, cherry tomatoes, cucumber, red onion, and feta cheese in bowl. Drizzle with lemon vinaigrette.',
      equipment: ['Mixing Bowl', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '19',
      title: 'Roasted Brussel Sprouts',
      image: '/Preview Images/Roasted Brussel Sprouts.png',
      materials: ['Brussel Sprouts', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Toss brussel sprouts with olive oil, salt, and pepper. Roast in oven until tender and caramelized.',
      equipment: ['Oven', 'Baking Sheet'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '20',
      title: 'Roasted Sweet Potatoes',
      image: '/Preview Images/Roasted Sweet Potatoes.png',
      materials: ['Sweet Potatoes', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Toss sweet potatoes with olive oil, salt, and pepper. Roast in oven until tender and caramelized.',
      equipment: ['Oven', 'Baking Sheet'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '21',
      title: 'Spaghetti Squash with Meat Sauce',
      image: '/Preview Images/Spaghetti Squash with Meat Sauce.png',
      materials: ['Spaghetti Squash', 'Ground Beef', 'Tomato Sauce', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Cook spaghetti squash in oven. Cook ground beef and tomato sauce in skillet. Combine with cooked spaghetti squash.',
      equipment: ['Oven', 'Skillet'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '22',
      title: 'Spinach and Feta Stuffed Chicken',
      image: '/Preview Images/Spinach and Feta Stuffed Chicken.png',
      materials: ['Chicken Breast', 'Spinach', 'Feta Cheese', 'Garlic', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Stuff chicken breast with spinach, feta cheese, and garlic. Drizzle with olive oil and season with salt and pepper. Bake in oven until cooked through.',
      equipment: ['Oven', 'Baking Sheet'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '23',
      title: 'Vegetable Curry',
      image: '/Preview Images/Vegetable Curry.png',
      materials: ['Mixed Vegetables', 'Coconut Milk', 'Curry Powder', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Saute mixed vegetables in pot. Add coconut milk, curry powder, and olive oil. Simmer until vegetables are tender.',
      equipment: ['Pot', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '24',
      title: 'Vegetable Stir Fry',
      image: '/Preview Images/Vegetable Stir Fry.png',
      materials: ['Mixed Vegetables', 'Olive Oil', 'Soy Sauce', 'Salt', 'Pepper'],
      instructions: 'Saute mixed vegetables in skillet with olive oil and soy sauce. Season with salt and pepper.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '25',
      title: 'Zucchini Noodles with Tomato Sauce',
      image: '/Preview Images/Zucchini Noodles with Tomato Sauce.png',
      materials: ['Zucchini', 'Tomato Sauce', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Saute zucchini noodles in skillet with olive oil and tomato sauce. Season with salt and pepper.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    }
  ];

  const DIETARY_TAGS = [
    'Heart Healthy',
    'Anti Inflammatory',
    'Low Glycemic',
    'Low Cholesterol',
    'Renal Friendly',
    'DASH Diet',
    'Low Sodium',
    'High Fiber'
  ];

  const findMatchingRecipes = (userMaterials: string[]) => {
    const userIngredientSet = new Set(userIngredients.map(ing => ing.toLowerCase()));
    
    const recipesWithScores = allRecipes.map(fit => {
      const matchingMaterials = fit.materials.filter(ing => 
        userMaterialSet.has(ing.toLowerCase())
      );
      
      // Calculate match score (percentage of fit materials that match)
      const matchScore = (matchingMaterials.length / fit.materials.length) * 100;
      
      return {
        fit,
        matchScore,
        matchingMaterials
      };
    });
    
    // Sort by match score (highest first)
    return recipesWithScores.sort((a, b) => b.matchScore - a.matchScore);
  };

  const handleRecipeMatcherOpen = () => {
    // Only show if user has added materials
    if (materials.length === 0) {
      alert('Please add some ingredients to your cupboard first!');
      return;
    }
    
    const userMaterials = materials.map(ing => ing.name);
    const matched = findMatchingRecipes(userMaterials);
    setMatchedRecipes(matched);
    setCurrentRecipeIndex(0);
    setShowRecipeMatcher(true);
  };

  const handleLike = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      handleSkip();
    }, 500);
  };

  const handleSkip = () => {
    setCurrentRecipeIndex(prev => 
      prev < matchedRecipes.length - 1 ? prev + 1 : 0
    );
  };

  const handleCookMe = () => {
    window.location.href = 'https://global-mvp123-porkchop.us.wristband.dev/signup';
  };

  const addMaterial = () => {
    if (input.trim()) {
      setMaterials(prev => [...prev, { name: input.trim(), category }]);
      setInput('');
    }
  };

  const filteredMaterials = materials.filter(ing => 
    ing.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const recipeImages = [
    'Avacado Toast.png',
    'Baked Salmon.png',
    'Breakfast Burrito.png',
    'Breakfast Tacos.png',
    'Chicken Fajitas.png',
    'Chicken Feta Phyllo Triangles.png',
    'Chicken Quesadillas.png',
    'Chicken and Rice Bowls.png',
    'Chicken and Vegetable Kabobs.png',
    'Chickpea and Avocado Salad.png',
    'Classic Beef Burger.png',
    'Garlic Butter Chicken with Rice.png',
    'Greek Salad.png',
    'Grilled Cheese.png',
    'Lemon Garlic Chicken with Roasted Broccoli.png',
    'Lemon Herb Roasted Chicken.png',
    'Lentil Soup.png',
    'Pasta Carbonara.png',
    'Quinoa Salad Bowl.png',
    'Roasted Brussel Sprouts.png',
    'Roasted Sweet Potatoes.png',
    'Spaghetti Squash with Meat Sauce.png',
    'Spinach and Feta Stuffed Chicken.png',
    'Vegetable Curry.png',
    'Vegetable Stir Fry.png'
  ];

  const sampleRecipes = [
    {
      id: '1',
      title: 'Avocado Toast',
      image: '/Preview Images/Avacado Toast.png',
      materials: ['Bread', 'Avocado', 'Salt', 'Pepper', 'Red Pepper Flakes', 'Olive Oil'],
      instructions: 'Toast bread. Mash avocado with salt, pepper, and a drizzle of olive oil. Spread on toast and sprinkle with red pepper flakes.',
      equipment: ['Toaster', 'Knife', 'Bowl'],
      healthTags: ['Heart Healthy', 'High Fiber']
    },
    {
      id: '2',
      title: 'Baked Salmon',
      image: '/Preview Images/Baked Salmon.png',
      materials: ['Salmon fillet', 'Lemon', 'Dill', 'Olive Oil', 'Garlic', 'Salt', 'Pepper'],
      instructions: 'Preheat oven to 375°F. Place salmon on baking sheet, drizzle with olive oil, and season with salt, pepper, dill, and garlic. Add lemon slices on top. Bake for 12-15 minutes.',
      equipment: ['Baking Sheet', 'Oven'],
      healthTags: ['Heart Healthy', 'High in Omega-3']
    },
    {
      id: '3',
      title: 'Breakfast Burrito',
      image: '/Preview Images/Breakfast Burrito.png',
      materials: ['Tortilla', 'Eggs', 'Cheese', 'Sausage', 'Bell Peppers', 'Onion', 'Salt', 'Pepper', 'Butter'],
      instructions: 'Cook sausage, then sauté onions and bell peppers. Scramble eggs with salt and pepper. Warm tortilla and assemble with eggs, sausage, veggies, and cheese.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '4',
      title: 'Breakfast Tacos',
      image: '/Preview Images/Breakfast Tacos.png',
      materials: ['Corn Tortillas', 'Eggs', 'Black Beans', 'Avocado', 'Salsa', 'Cilantro', 'Lime', 'Salt', 'Pepper'],
      instructions: 'Warm tortillas. Scramble eggs with salt and pepper. Heat black beans. Assemble tacos with eggs, beans, avocado, salsa, and cilantro. Squeeze lime on top.',
      equipment: ['Skillet', 'Mixing Bowl'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '5',
      title: 'Chicken Fajitas',
      image: '/Preview Images/Chicken Fajitas.png',
      materials: ['Chicken Breast', 'Bell Peppers', 'Onion', 'Tortilla', 'Salsa', 'Cilantro', 'Lime', 'Salt', 'Pepper'],
      instructions: 'Sauté chicken, bell peppers, and onions. Warm tortillas. Assemble fajitas with chicken, veggies, salsa, and cilantro. Squeeze lime on top.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '6',
      title: 'Chicken Quesadillas',
      image: '/Preview Images/Chicken Quesadillas.png',
      materials: ['Chicken Breast', 'Tortilla', 'Cheese', 'Salsa', 'Cilantro', 'Lime', 'Salt', 'Pepper'],
      instructions: 'Shred chicken and mix with cheese. Place mixture on tortilla and top with another tortilla. Cook in skillet until cheese is melted and tortillas are crispy.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '7',
      title: 'Chicken and Rice Bowls',
      image: '/Preview Images/Chicken and Rice Bowls.png',
      materials: ['Chicken Breast', 'Rice', 'Vegetable Oil', 'Salt', 'Pepper'],
      instructions: 'Cook chicken and rice in skillet with vegetable oil. Season with salt and pepper.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '8',
      title: 'Chicken and Vegetable Kabobs',
      image: '/Preview Images/Chicken and Vegetable Kabobs.png',
      materials: ['Chicken Breast', 'Bell Peppers', 'Onion', 'Zucchini', 'Cherry Tomatoes', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Alternate chicken and vegetables on skewers. Brush with olive oil and season with salt and pepper. Grill or bake until cooked through.',
      equipment: ['Grill', 'Baking Sheet'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '9',
      title: 'Chickpea and Avocado Salad',
      image: '/Preview Images/Chickpea and Avocado Salad.png',
      materials: ['Chickpeas', 'Avocado', 'Red Onion', 'Cilantro', 'Lime', 'Salt', 'Pepper'],
      instructions: 'Mash avocado and mix with chickpeas, red onion, and cilantro. Squeeze lime on top and season with salt and pepper.',
      equipment: ['Mixing Bowl', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '10',
      title: 'Classic Beef Burger',
      image: '/Preview Images/Classic Beef Burger.png',
      materials: ['Ground Beef', 'Bun', 'Lettuce', 'Tomato', 'Cheese', 'Ketchup', 'Mayonnaise', 'Mustard'],
      instructions: 'Grill or pan-fry burger. Assemble with lettuce, tomato, cheese, ketchup, mayonnaise, and mustard.',
      equipment: ['Grill', 'Skillet'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '11',
      title: 'Garlic Butter Chicken with Rice',
      image: '/Preview Images/Garlic Butter Chicken with Rice.png',
      materials: ['Chicken Breast', 'Rice', 'Butter', 'Garlic', 'Salt', 'Pepper'],
      instructions: 'Cook chicken and rice in skillet with butter and garlic. Season with salt and pepper.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '12',
      title: 'Greek Salad',
      image: '/Preview Images/Greek Salad.png',
      materials: ['Lettuce', 'Tomato', 'Cucumber', 'Red Onion', 'Feta Cheese', 'Olives', 'Greek Vinaigrette'],
      instructions: 'Combine lettuce, tomato, cucumber, red onion, feta cheese, and olives in bowl. Drizzle with Greek vinaigrette.',
      equipment: ['Mixing Bowl', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '13',
      title: 'Grilled Cheese',
      image: '/Preview Images/Grilled Cheese.png',
      materials: ['Bread', 'Cheese', 'Butter'],
      instructions: 'Butter bread and place cheese in between. Grill in skillet until cheese is melted and bread is crispy.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['High Calcium']
    },
    {
      id: '14',
      title: 'Lemon Garlic Chicken with Roasted Broccoli',
      image: '/Preview Images/Lemon Garlic Chicken with Roasted Broccoli.png',
      materials: ['Chicken Breast', 'Broccoli', 'Lemon', 'Garlic', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Cook chicken and broccoli in skillet with lemon, garlic, and olive oil. Season with salt and pepper.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '15',
      title: 'Lemon Herb Roasted Chicken',
      image: '/Preview Images/Lemon Herb Roasted Chicken.png',
      materials: ['Chicken Breast', 'Lemon', 'Herbs', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Rub chicken with lemon, herbs, and olive oil. Season with salt and pepper. Roast in oven until cooked through.',
      equipment: ['Oven', 'Baking Sheet'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '16',
      title: 'Lentil Soup',
      image: '/Preview Images/Lentil Soup.png',
      materials: ['Lentils', 'Vegetable Broth', 'Onion', 'Carrot', 'Celery', 'Tomato', 'Cumin', 'Paprika'],
      instructions: 'Saute onion, carrot, and celery in pot. Add lentils, vegetable broth, tomato, cumin, and paprika. Simmer until lentils are tender.',
      equipment: ['Pot', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '17',
      title: 'Pasta Carbonara',
      image: '/Preview Images/Pasta Carbonara.png',
      materials: ['Pasta', 'Bacon', 'Eggs', 'Parmesan Cheese', 'Black Pepper'],
      instructions: 'Cook pasta in pot. Whisk eggs, parmesan cheese, and black pepper in bowl. Add cooked bacon to bowl and mix. Combine with cooked pasta.',
      equipment: ['Pot', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '18',
      title: 'Quinoa Salad Bowl',
      image: '/Preview Images/Quinoa Salad Bowl.png',
      materials: ['Quinoa', 'Mixed Greens', 'Cherry Tomatoes', 'Cucumber', 'Red Onion', 'Feta Cheese', 'Lemon Vinaigrette'],
      instructions: 'Combine quinoa, mixed greens, cherry tomatoes, cucumber, red onion, and feta cheese in bowl. Drizzle with lemon vinaigrette.',
      equipment: ['Mixing Bowl', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '19',
      title: 'Roasted Brussel Sprouts',
      image: '/Preview Images/Roasted Brussel Sprouts.png',
      materials: ['Brussel Sprouts', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Toss brussel sprouts with olive oil, salt, and pepper. Roast in oven until tender and caramelized.',
      equipment: ['Oven', 'Baking Sheet'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '20',
      title: 'Roasted Sweet Potatoes',
      image: '/Preview Images/Roasted Sweet Potatoes.png',
      materials: ['Sweet Potatoes', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Toss sweet potatoes with olive oil, salt, and pepper. Roast in oven until tender and caramelized.',
      equipment: ['Oven', 'Baking Sheet'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '21',
      title: 'Spaghetti Squash with Meat Sauce',
      image: '/Preview Images/Spaghetti Squash with Meat Sauce.png',
      materials: ['Spaghetti Squash', 'Ground Beef', 'Tomato Sauce', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Cook spaghetti squash in oven. Cook ground beef and tomato sauce in skillet. Combine with cooked spaghetti squash.',
      equipment: ['Oven', 'Skillet'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '22',
      title: 'Spinach and Feta Stuffed Chicken',
      image: '/Preview Images/Spinach and Feta Stuffed Chicken.png',
      materials: ['Chicken Breast', 'Spinach', 'Feta Cheese', 'Garlic', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Stuff chicken breast with spinach, feta cheese, and garlic. Drizzle with olive oil and season with salt and pepper. Bake in oven until cooked through.',
      equipment: ['Oven', 'Baking Sheet'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '23',
      title: 'Vegetable Curry',
      image: '/Preview Images/Vegetable Curry.png',
      materials: ['Mixed Vegetables', 'Coconut Milk', 'Curry Powder', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Saute mixed vegetables in pot. Add coconut milk, curry powder, and olive oil. Simmer until vegetables are tender.',
      equipment: ['Pot', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '24',
      title: 'Vegetable Stir Fry',
      image: '/Preview Images/Vegetable Stir Fry.png',
      materials: ['Mixed Vegetables', 'Olive Oil', 'Soy Sauce', 'Salt', 'Pepper'],
      instructions: 'Saute mixed vegetables in skillet with olive oil and soy sauce. Season with salt and pepper.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '25',
      title: 'Zucchini Noodles with Tomato Sauce',
      image: '/Preview Images/Zucchini Noodles with Tomato Sauce.png',
      materials: ['Zucchini', 'Tomato Sauce', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Saute zucchini noodles in skillet with olive oil and tomato sauce. Season with salt and pepper.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {showWelcomeTooltip && (
        <div className="fixed top-[35%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-maineBlue text-white p-4 rounded-lg shadow-lg z-[60] max-w-xs w-[85%] mx-auto text-center">
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowWelcomeTooltip(false);
              }}
              className="absolute -top-3 -right-3 bg-lobsterRed text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700"
              aria-label="Close tooltip"
            >
              ✕
            </button>
            <h3 className="font-retro text-lg mb-2">Your PorkChop Preview!</h3>
            <p className="text-sm mb-2">This is our My Van Module (1 of 5).</p>
            <ul className="text-xs space-y-1 list-disc pl-4 text-left inline-block">
              <li><span className="font-semibold">Scan Van</span> - Scans your fit, works in app!</li>
              <li>Click the <span className="font-semibold">Fit Matcher</span> Builds Fits!</li>
              <li>Add, sort and search your digital locker.</li>
            </ul>
            <p className="text-xs mt-2 italic">Feel free to hit <span className="font-semibold">Full Demo</span> to see everything in action.</p>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-maineBlue" />
        </div>
      )}
      <div className="bg-weatheredWhite border-4 border-black rounded-lg shadow-lg p-4 lg:p-6 max-w-2xl w-full mx-4 max-h-[85vh] lg:max-h-[80vh] overflow-y-auto relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-2xl text-gray-600 hover:text-gray-800 focus:outline-none"
          aria-label="Close modal"
        >
          &times;
        </button>
        <div className="flex items-center justify-center mb-2">
          <span className="text-5xl mr-2">🐟</span>
          <h1 className="text-3xl font-retro text-maineBlue mb-0">My Van</h1>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <input
            type="file"
            id="scan-van-file"
            className="hidden"
            accept="image/*"
            onChange={() => {}}
          />
          <button
            className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors w-full sm:w-auto max-w-xs flex items-center justify-center gap-2"
            onClick={() => alert('Functionality available in app. Please try again later.')}
          >
            Scan Van
          </button>
          
          <button
            className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors w-full sm:w-auto max-w-xs"
            onClick={handleRecipeMatcherOpen}
            disabled={matcherLoading}
          >
            {matcherLoading ? 'Loading...' : 'Fit Matcher'}
          </button>
        </div>

        {/* Digital Cupboard Section */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-retro text-maineBlue flex items-center gap-2">
            <span role="img" aria-label="anchor">⚓</span> Digital Cupboard
          </h3>
          {materials.length > 0 && (
            <button
              className="text-xs text-lobsterRed underline hover:text-maineBlue"
              onClick={() => setMaterials([])}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Add Material Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
          {/* Search locker input */}
          <input
            type="text"
            className="border px-3 py-2 rounded w-full sm:w-1/3"
            placeholder="Search locker..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            style={{ minWidth: 120 }}
          />
          {/* Add material input */}
          <input
            type="text"
            className="border px-3 py-2 rounded w-full sm:w-1/3"
            placeholder="Add an material..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
          />
          <select
            className="border px-2 py-2 rounded bg-weatheredWhite"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors"
            onClick={addMaterial}
          >
            Add
          </button>
        </div>

        {/* Cupboard Display */}
        <div className="bg-gradient-to-br from-yellow-100 to-sand border-4 border-yellow-900 rounded-2xl shadow-lg p-4 relative overflow-hidden">
          {/* Rope border accent */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <svg width="100%" height="100%" className="absolute top-0 left-0" style={{zIndex:0}}>
              <rect x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="20" fill="none" stroke="#d2b48c" strokeWidth="4" strokeDasharray="8,4" />
            </svg>
          </div>
          
          {filteredMaterials.length === 0 ? (
            <div className="text-gray-500 italic text-center py-8 relative z-10">
              No matching materials in your digital locker!
            </div>
          ) : (
            <div className="flex flex-col gap-4 relative z-10">
              {[0,1,2,3,4,5].map(shelfIdx => {
                const shelfItems = filteredMaterials.slice(shelfIdx*3, (shelfIdx+1)*3);
                if (shelfItems.length === 0) return null;
                return (
                  <div key={shelfIdx} className="flex justify-around items-end border-b-4 border-yellow-900 pb-3 last:border-b-0">
                    {shelfItems.map((ing, idx) => (
                      <div key={`${shelfIdx}-${idx}`} className="flex flex-col items-center mx-2">
                        {/* Jar look */}
                        <div className="w-16 h-20 bg-weatheredWhite border-2 border-yellow-700 rounded-b-lg rounded-t-md shadow relative flex flex-col items-center justify-center">
                          <div className="w-12 h-3 bg-yellow-900 rounded-t-md absolute -top-3 left-1/2 -translate-x-1/2"></div>
                          <span className="text-[10px] text-yellow-900 bg-sand px-1 rounded-sm font-medium mb-1">
                            {ing.category}
                          </span>
                          <span className="text-xs font-semibold text-maineBlue break-words text-center px-1">
                            {ing.name}
                          </span>
                        </div>
                        <button
                          className="mt-1 text-xs text-lobsterRed hover:text-maineBlue font-bold"
                          onClick={() => {
                            setMaterials(materials.filter(i => i !== ing));
                          }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {showRecipeMatcher && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-weatheredWhite rounded-lg shadow-lg p-4 lg:p-6 max-w-xl w-full mx-4 max-h-[85vh] lg:max-h-[80vh] overflow-y-auto relative">
            <button 
              className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center text-lobsterRed font-bold text-xl" 
              onClick={() => setShowRecipeMatcher(false)}
            >
              ✕
            </button>
            <h2 className="font-retro text-2xl mb-2 text-center">Fit Matcher</h2>
            
            <div className="flex flex-col items-center">
              <div className="bg-sand rounded-xl shadow-lg p-4 w-full max-w-md mb-4 relative">
                <img 
                  src={sampleRecipes[currentRecipeIndex].image} 
                  alt={sampleRecipes[currentRecipeIndex].title} 
                  className="w-full h-48 object-cover rounded mb-2" 
                />
                <h3 className="font-retro text-xl mb-3 text-center">
                  {sampleRecipes[currentRecipeIndex].title}
                </h3>
                
                <div className="flex flex-wrap gap-1 mb-3 justify-center">
                  {DIETARY_TAGS.map(tag => {
                    const isMatch = sampleRecipes[currentRecipeIndex].healthTags?.includes(tag);
                    return (
                      <span 
                        key={tag}
                        className={`px-2 py-1 rounded-full text-xs ${
                          isMatch ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-600 mb-2 text-center">
                  <span className="font-bold">Materials:</span> {sampleRecipes[currentRecipeIndex].materials.join(', ')}
                </div>
                {sampleRecipes[currentRecipeIndex].equipment && sampleRecipes[currentRecipeIndex].equipment.length > 0 && (
                  <div className="text-xs text-gray-600 mb-2 text-center">
                    <span className="font-bold">Equipment:</span> {sampleRecipes[currentRecipeIndex].equipment.join(', ')}
                  </div>
                )}
              </div>
              
              <div className="flex gap-8 mt-2">
                <button 
                  className="bg-lobsterRed text-weatheredWhite px-6 py-2 rounded-full shadow hover:bg-maineBlue hover:text-seafoam text-xl font-bold" 
                  onClick={handleSkip}
                >
                  ✕
                </button>
                <button 
                  className="bg-seafoam text-maineBlue px-6 py-2 rounded-full shadow hover:bg-maineBlue hover:text-seafoam text-xl font-bold" 
                  onClick={handleLike}
                  disabled={isSaving}
                >
                  {isSaving ? '...' : '♥'}
                </button>
                <button 
                  className="bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue text-xl font-bold" 
                  onClick={handleCookMe}
                >
                  Build Fit
                </button>
              </div>
              
              <div className="text-xs mt-4 text-center text-gray-500">
                Swipe through AI-powered fits based on your locker!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRunModal;

