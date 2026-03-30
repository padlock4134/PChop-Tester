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
  const [ingredients, setIngredients] = useState([
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
    recipe: any;
    matchScore: number;
    matchingIngredients: string[];
  }>>([]);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const allRecipes = [
    {
      id: '1',
      title: 'Oil Change Service',
      image: '/Preview Images/Oil Change.png',
      ingredients: ['Engine Oil', 'Oil Filter', 'Drain Plug', 'Oil Pan', 'Rags', 'Funnel'],
      instructions: 'Drain old oil and remove filter. Install new filter and drain plug. Add new oil to proper level. Check for leaks.',
      equipment: ['Wrench Set', 'Oil Filter Wrench', 'Oil Pan'],
      healthTags: ['Engine Health', 'Preventive Maintenance']
    },
    {
      id: '2',
      title: 'Brake Pad Replacement',
      image: '/Preview Images/Brake Service.png',
      ingredients: ['Brake Pads', 'Rotors', 'Caliper', 'Brake Fluid', 'C-Clamp', 'Wire Brush'],
      instructions: 'Remove wheel and caliper. Compress caliper piston. Remove old pads and install new ones. Reassemble and bleed brakes if needed.',
      equipment: ['Socket Set', 'Brake Tool', 'Bleeder Kit'],
      healthTags: ['Safety Critical', 'Stopping Power']
    },
    {
      id: '3',
      title: 'Engine Tune-Up',
      image: '/Preview Images/Engine Service.png',
      ingredients: ['Spark Plugs', 'Air Filter', 'Fuel Filter', 'Distributor Cap', 'Rotor', 'Wires'],
      instructions: 'Replace spark plugs and wires. Install new air and fuel filters. Check distributor cap and rotor. Adjust timing if needed.',
      equipment: ['Socket Set', 'Timing Light', 'Gap Tool'],
      healthTags: ['Performance Boost', 'Fuel Efficiency']
    },
    {
      id: '4',
      title: 'Transmission Service',
      image: '/Preview Images/Transmission Service.png',
      ingredients: ['Transmission Fluid', 'Filter Kit', 'Gasket', 'Sealant', 'Drain Pan', 'Torque Wrench'],
      instructions: 'Drain transmission fluid. Remove pan and replace filter. Install new gasket and pan. Refill with correct fluid amount and check for leaks.',
      equipment: ['Socket Set', 'Torque Wrench', 'Fluid Pump'],
      healthTags: ['Smooth Shifting', 'Longevity']
    },
    {
      id: '5',
      title: 'Suspension Service',
      image: '/Preview Images/Suspension Service.png',
      ingredients: ['Shock Absorbers', 'Struts', 'Springs', 'Bushings', 'Bolts', 'Torque Wrench'],
      instructions: 'Remove old shocks and struts. Install new suspension components. Torque all bolts to specifications. Check alignment after installation.',
      equipment: ['Socket Set', 'Spring Compressor', 'Torque Wrench'],
      healthTags: ['Ride Comfort', 'Handling']
    },
    {
      id: '6',
      title: 'Electrical System Service',
      image: '/Preview Images/Electrical Service.png',
      ingredients: ['Battery', 'Alternator', 'Starter', 'Fuses', 'Wiring', 'Multimeter'],
      instructions: 'Test battery and charging system. Replace alternator or starter if needed. Check all fuses and wiring connections. Verify electrical system operation.',
      equipment: ['Multimeter', 'Wiring Tools', 'Battery Tester'],
      healthTags: ['Reliability', 'Power System']
    },
    {
      id: '7',
      title: 'Cooling System Service',
      image: '/Preview Images/Cooling Service.png',
      ingredients: ['Coolant', 'Radiator', 'Water Pump', 'Thermostat', 'Hoses', 'Clamps'],
      instructions: 'Drain old coolant and flush radiator. Replace water pump and thermostat if needed. Refill with proper coolant mixture and check for leaks.',
      equipment: ['Radiator Tester', 'Hose Clamps', 'Funnel'],
      healthTags: ['Engine Protection', 'Temperature Control']
    },
    {
      id: '8',
      title: 'Exhaust System Service',
      image: '/Preview Images/Exhaust Service.png',
      ingredients: ['Muffler', 'Catalytic Converter', 'Pipes', 'Gaskets', 'Hangers', 'Welder'],
      instructions: 'Remove old exhaust components. Install new muffler and catalytic converter. Check for proper fit and no exhaust leaks. Test for proper operation.',
      equipment: ['Welder', 'Socket Set', 'Exhaust Cutter'],
      healthTags: ['Performance', 'Emissions Control']
    },
    {
      id: '9',
      title: 'Tire Rotation Service',
      image: '/Preview Images/Tire Service.png',
      ingredients: ['Tire Iron', 'Jack Stands', 'Lug Nuts', 'Torque Wrench', 'Tire Gauge', 'Air Compressor'],
      instructions: 'Jack up vehicle and remove wheels. Rotate tires according to proper pattern. Torque lug nuts to specifications and set proper tire pressure.',
      equipment: ['Jack', 'Torque Wrench', 'Tire Pressure Gauge'],
      healthTags: ['Safety', 'Even Wear', 'Fuel Efficiency']
    },
    {
      id: '10',
      title: 'Battery Replacement Service',
      image: '/Preview Images/Battery Service.png',
      ingredients: ['Battery', 'Battery Terminals', 'Terminal Cleaner', 'Wrench', 'Memory Saver'],
      instructions: 'Disconnect negative terminal first. Remove old battery and clean terminals. Install new battery and connect terminals. Apply anti-corrosion grease.',
      equipment: ['Wrench Set', 'Battery Tester', 'Wire Brush'],
      healthTags: ['Reliability', 'Starting Power']
    },
    {
      id: '11',
      title: 'Wheel Alignment Service',
      image: '/Preview Images/Alignment Service.png',
      ingredients: ['Alignment Machine', 'Wheel Weights', 'Adjustment Tools', 'Tape Measure', 'Chalk'],
      instructions: 'Place vehicle on alignment machine. Adjust toe, camber, and caster angles to specifications. Verify with test drive and final alignment check.',
      equipment: ['Alignment Machine', 'Wrench Set', 'Tape Measure'],
      healthTags: ['Tire Life', 'Handling', 'Safety']
    },
    {
      id: '12',
      title: 'Detailing Service',
      image: '/Preview Images/Detailing Service.png',
      ingredients: ['Car Wax', 'Microfiber Towels', 'Applicator Pads', 'Interior Cleaner', 'Vacuum', 'Brushes'],
      instructions: 'Wash and dry vehicle thoroughly. Apply car wax in sections using applicator pads. Clean interior surfaces and vacuum carpets. Buff to high shine.',
      equipment: ['Buffer', 'Vacuum Cleaner', 'Detailing Brushes'],
      healthTags: ['Appearance', 'Protection', 'Value']
    },
    {
      id: '13',
      title: 'Paint Protection Service',
      image: '/Preview Images/Paint Service.png',
      ingredients: ['Car Wax', 'Paint Sealant', 'Applicator Pads', 'Microfiber Towels', 'Clay Bar'],
      instructions: 'Wash and clay vehicle surface to remove contaminants. Apply paint sealant for protection. Finish with car wax for high gloss shine.',
      equipment: ['Clay Bar', 'Polisher', 'Microfiber Towels'],
      healthTags: ['Paint Protection', 'Appearance', 'UV Protection']
    },
    {
      id: '14',
      title: 'Engine Diagnostic Service',
      image: '/Preview Images/Diagnostic Service.png',
      ingredients: ['Scan Tool', 'Code Reader', 'Multimeter', 'Test Leads', 'Software'],
      instructions: 'Connect scan tool to OBD-II port. Read and diagnose trouble codes. Use multimeter to test electrical components. Provide detailed repair recommendations.',
      equipment: ['Scan Tool', 'Multimeter', 'Test Leads'],
      healthTags: ['Diagnostics', 'Performance', 'Emissions']
    },
    {
      id: '15',
      title: 'Fuel System Service',
      image: '/Preview Images/Fuel Service.png',
      ingredients: ['Fuel Filter', 'Fuel Pump', 'Fuel Lines', 'Pressure Gauge', 'Hose Clamps'],
      instructions: 'Relieve fuel system pressure. Replace fuel filter and fuel pump if needed. Check for leaks and proper fuel pressure. Test system operation.',
      equipment: ['Fuel Pressure Tester', 'Wrench Set', 'Hose Clamps'],
      healthTags: ['Fuel Efficiency', 'Engine Performance', 'Reliability']
    },
    {
      id: '16',
      title: 'Air Conditioning Service',
      image: '/Preview Images/AC Service.png',
      ingredients: ['Refrigerant', 'AC Compressor', 'Condenser', 'Evaporator', 'O-Rings', 'Recovery Machine'],
      instructions: 'Recover old refrigerant. Replace compressor, condenser, and evaporator as needed. Vacuum system and recharge with proper refrigerant. Test system operation.',
      equipment: ['AC Machine', 'Vacuum Pump', 'Gauge Set'],
      healthTags: ['Comfort', 'Air Quality', 'Efficiency']
    },
    {
      id: '17',
      title: 'Pasta Carbonara',
      image: '/Preview Images/Pasta Carbonara.png',
      ingredients: ['Pasta', 'Bacon', 'Eggs', 'Parmesan Cheese', 'Black Pepper'],
      instructions: 'Cook pasta in pot. Whisk eggs, parmesan cheese, and black pepper in bowl. Add cooked bacon to bowl and mix. Combine with cooked pasta.',
      equipment: ['Pot', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '18',
      title: 'Quinoa Salad Bowl',
      image: '/Preview Images/Quinoa Salad Bowl.png',
      ingredients: ['Quinoa', 'Mixed Greens', 'Cherry Tomatoes', 'Cucumber', 'Red Onion', 'Feta Cheese', 'Lemon Vinaigrette'],
      instructions: 'Combine quinoa, mixed greens, cherry tomatoes, cucumber, red onion, and feta cheese in bowl. Drizzle with lemon vinaigrette.',
      equipment: ['Mixing Bowl', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '19',
      title: 'Roasted Brussel Sprouts',
      image: '/Preview Images/Roasted Brussel Sprouts.png',
      ingredients: ['Brussel Sprouts', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Toss brussel sprouts with olive oil, salt, and pepper. Roast in oven until tender and caramelized.',
      equipment: ['Oven', 'Baking Sheet'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '20',
      title: 'Roasted Sweet Potatoes',
      image: '/Preview Images/Roasted Sweet Potatoes.png',
      ingredients: ['Sweet Potatoes', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Toss sweet potatoes with olive oil, salt, and pepper. Roast in oven until tender and caramelized.',
      equipment: ['Oven', 'Baking Sheet'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '21',
      title: 'Spaghetti Squash with Meat Sauce',
      image: '/Preview Images/Spaghetti Squash with Meat Sauce.png',
      ingredients: ['Spaghetti Squash', 'Ground Beef', 'Tomato Sauce', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Cook spaghetti squash in oven. Cook ground beef and tomato sauce in skillet. Combine with cooked spaghetti squash.',
      equipment: ['Oven', 'Skillet'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '22',
      title: 'Spinach and Feta Stuffed Chicken',
      image: '/Preview Images/Spinach and Feta Stuffed Chicken.png',
      ingredients: ['Chicken Breast', 'Spinach', 'Feta Cheese', 'Garlic', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Stuff chicken breast with spinach, feta cheese, and garlic. Drizzle with olive oil and season with salt and pepper. Bake in oven until cooked through.',
      equipment: ['Oven', 'Baking Sheet'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '23',
      title: 'Vegetable Curry',
      image: '/Preview Images/Vegetable Curry.png',
      ingredients: ['Mixed Vegetables', 'Coconut Milk', 'Curry Powder', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Saute mixed vegetables in pot. Add coconut milk, curry powder, and olive oil. Simmer until vegetables are tender.',
      equipment: ['Pot', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '24',
      title: 'Vegetable Stir Fry',
      image: '/Preview Images/Vegetable Stir Fry.png',
      ingredients: ['Mixed Vegetables', 'Olive Oil', 'Soy Sauce', 'Salt', 'Pepper'],
      instructions: 'Saute mixed vegetables in skillet with olive oil and soy sauce. Season with salt and pepper.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '25',
      title: 'Zucchini Noodles with Tomato Sauce',
      image: '/Preview Images/Zucchini Noodles with Tomato Sauce.png',
      ingredients: ['Zucchini', 'Tomato Sauce', 'Olive Oil', 'Salt', 'Pepper'],
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

  const findMatchingRecipes = (userIngredients: string[]) => {
    const userIngredientSet = new Set(userIngredients.map(ing => ing.toLowerCase()));
    
    const recipesWithScores = allRecipes.map(recipe => {
      const matchingIngredients = recipe.ingredients.filter(ing => 
        userIngredientSet.has(ing.toLowerCase())
      );
      
      // Calculate match score (percentage of recipe ingredients that match)
      const matchScore = (matchingIngredients.length / recipe.ingredients.length) * 100;
      
      return {
        recipe,
        matchScore,
        matchingIngredients
      };
    });
    
    // Sort by match score (highest first)
    return recipesWithScores.sort((a, b) => b.matchScore - a.matchScore);
  };

  const handleRecipeMatcherOpen = () => {
    // Only show if user has added ingredients
    if (ingredients.length === 0) {
      alert('Please add some ingredients to your cupboard first!');
      return;
    }
    
    const userIngredients = ingredients.map(ing => ing.name);
    const matched = findMatchingRecipes(userIngredients);
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

  const addIngredient = () => {
    if (input.trim()) {
      setIngredients(prev => [...prev, { name: input.trim(), category }]);
      setInput('');
    }
  };

  const filteredIngredients = ingredients.filter(ing => 
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
      ingredients: ['Bread', 'Avocado', 'Salt', 'Pepper', 'Red Pepper Flakes', 'Olive Oil'],
      instructions: 'Toast bread. Mash avocado with salt, pepper, and a drizzle of olive oil. Spread on toast and sprinkle with red pepper flakes.',
      equipment: ['Toaster', 'Knife', 'Bowl'],
      healthTags: ['Heart Healthy', 'High Fiber']
    },
    {
      id: '2',
      title: 'Brake Pad Replacement',
      image: '/Preview Images/Brake Service.png',
      ingredients: ['Brake Pads', 'Rotors', 'Caliper', 'Brake Fluid', 'C-Clamp', 'Wire Brush'],
      instructions: 'Remove wheel and caliper. Compress caliper piston. Remove old pads and install new ones. Reassemble and bleed brakes if needed.',
      equipment: ['Socket Set', 'Brake Tool', 'Bleeder Kit'],
      healthTags: ['Safety Critical', 'Stopping Power']
    },
    {
      id: '3',
      title: 'Engine Tune-Up',
      image: '/Preview Images/Engine Service.png',
      ingredients: ['Spark Plugs', 'Air Filter', 'Fuel Filter', 'Distributor Cap', 'Rotor', 'Wires'],
      instructions: 'Replace spark plugs and wires. Install new air and fuel filters. Check distributor cap and rotor. Adjust timing if needed.',
      equipment: ['Socket Set', 'Timing Light', 'Gap Tool'],
      healthTags: ['Performance Boost', 'Fuel Efficiency']
    },
    {
      id: '4',
      title: 'Transmission Service',
      image: '/Preview Images/Transmission Service.png',
      ingredients: ['Transmission Fluid', 'Filter Kit', 'Gasket', 'Sealant', 'Drain Pan', 'Torque Wrench'],
      instructions: 'Drain transmission fluid. Remove pan and replace filter. Install new gasket and pan. Refill with correct fluid amount and check for leaks.',
      equipment: ['Socket Set', 'Torque Wrench', 'Fluid Pump'],
      healthTags: ['Smooth Shifting', 'Longevity']
    },
    {
      id: '5',
      title: 'Suspension Service',
      image: '/Preview Images/Suspension Service.png',
      ingredients: ['Shock Absorbers', 'Struts', 'Springs', 'Bushings', 'Bolts', 'Torque Wrench'],
      instructions: 'Remove old shocks and struts. Install new suspension components. Torque all bolts to specifications. Check alignment after installation.',
      equipment: ['Socket Set', 'Spring Compressor', 'Torque Wrench'],
      healthTags: ['Ride Comfort', 'Handling']
    },
    {
      id: '6',
      title: 'Electrical System Service',
      image: '/Preview Images/Electrical Service.png',
      ingredients: ['Battery', 'Alternator', 'Starter', 'Fuses', 'Wiring', 'Multimeter'],
      instructions: 'Test battery and charging system. Replace alternator or starter if needed. Check all fuses and wiring connections. Verify electrical system operation.',
      equipment: ['Multimeter', 'Wiring Tools', 'Battery Tester'],
      healthTags: ['Reliability', 'Power System']
    },
    {
      id: '7',
      title: 'Cooling System Service',
      image: '/Preview Images/Cooling Service.png',
      ingredients: ['Coolant', 'Radiator', 'Water Pump', 'Thermostat', 'Hoses', 'Clamps'],
      instructions: 'Drain old coolant and flush radiator. Replace water pump and thermostat if needed. Refill with proper coolant mixture and check for leaks.',
      equipment: ['Radiator Tester', 'Hose Clamps', 'Funnel'],
      healthTags: ['Engine Protection', 'Temperature Control']
    },
    {
      id: '8',
      title: 'Exhaust System Service',
      image: '/Preview Images/Exhaust Service.png',
      ingredients: ['Muffler', 'Catalytic Converter', 'Pipes', 'Gaskets', 'Hangers', 'Welder'],
      instructions: 'Remove old exhaust components. Install new muffler and catalytic converter. Check for proper fit and no exhaust leaks. Test for proper operation.',
      equipment: ['Welder', 'Socket Set', 'Exhaust Cutter'],
      healthTags: ['Performance', 'Emissions Control']
    },
    {
      id: '9',
      title: 'Tire Rotation Service',
      image: '/Preview Images/Tire Service.png',
      ingredients: ['Tire Iron', 'Jack Stands', 'Lug Nuts', 'Torque Wrench', 'Tire Gauge', 'Air Compressor'],
      instructions: 'Jack up vehicle and remove wheels. Rotate tires according to proper pattern. Torque lug nuts to specifications and set proper tire pressure.',
      equipment: ['Jack', 'Torque Wrench', 'Tire Pressure Gauge'],
      healthTags: ['Safety', 'Even Wear', 'Fuel Efficiency']
    },
    {
      id: '10',
      title: 'Battery Replacement Service',
      image: '/Preview Images/Battery Service.png',
      ingredients: ['Battery', 'Battery Terminals', 'Terminal Cleaner', 'Wrench', 'Memory Saver'],
      instructions: 'Disconnect negative terminal first. Remove old battery and clean terminals. Install new battery and connect terminals. Apply anti-corrosion grease.',
      equipment: ['Wrench Set', 'Battery Tester', 'Wire Brush'],
      healthTags: ['Reliability', 'Starting Power']
    },
    {
      id: '11',
      title: 'Wheel Alignment Service',
      image: '/Preview Images/Alignment Service.png',
      ingredients: ['Alignment Machine', 'Wheel Weights', 'Adjustment Tools', 'Tape Measure', 'Chalk'],
      instructions: 'Place vehicle on alignment machine. Adjust toe, camber, and caster angles to specifications. Verify with test drive and final alignment check.',
      equipment: ['Alignment Machine', 'Wrench Set', 'Tape Measure'],
      healthTags: ['Tire Life', 'Handling', 'Safety']
    },
    {
      id: '12',
      title: 'Detailing Service',
      image: '/Preview Images/Detailing Service.png',
      ingredients: ['Car Wax', 'Microfiber Towels', 'Applicator Pads', 'Interior Cleaner', 'Vacuum', 'Brushes'],
      instructions: 'Wash and dry vehicle thoroughly. Apply car wax in sections using applicator pads. Clean interior surfaces and vacuum carpets. Buff to high shine.',
      equipment: ['Buffer', 'Vacuum Cleaner', 'Detailing Brushes'],
      healthTags: ['Appearance', 'Protection', 'Value']
    },
    {
      id: '13',
      title: 'Paint Protection Service',
      image: '/Preview Images/Paint Service.png',
      ingredients: ['Car Wax', 'Paint Sealant', 'Applicator Pads', 'Microfiber Towels', 'Clay Bar'],
      instructions: 'Wash and clay vehicle surface to remove contaminants. Apply paint sealant for protection. Finish with car wax for high gloss shine.',
      equipment: ['Clay Bar', 'Polisher', 'Microfiber Towels'],
      healthTags: ['Paint Protection', 'Appearance', 'UV Protection']
    },
    {
      id: '14',
      title: 'Engine Diagnostic Service',
      image: '/Preview Images/Diagnostic Service.png',
      ingredients: ['Scan Tool', 'Code Reader', 'Multimeter', 'Test Leads', 'Software'],
      instructions: 'Connect scan tool to OBD-II port. Read and diagnose trouble codes. Use multimeter to test electrical components. Provide detailed repair recommendations.',
      equipment: ['Scan Tool', 'Multimeter', 'Test Leads'],
      healthTags: ['Diagnostics', 'Performance', 'Emissions']
    },
    {
      id: '15',
      title: 'Fuel System Service',
      image: '/Preview Images/Fuel Service.png',
      ingredients: ['Fuel Filter', 'Fuel Pump', 'Fuel Lines', 'Pressure Gauge', 'Hose Clamps'],
      instructions: 'Relieve fuel system pressure. Replace fuel filter and fuel pump if needed. Check for leaks and proper fuel pressure. Test system operation.',
      equipment: ['Fuel Pressure Tester', 'Wrench Set', 'Hose Clamps'],
      healthTags: ['Fuel Efficiency', 'Engine Performance', 'Reliability']
    },
    {
      id: '16',
      title: 'Air Conditioning Service',
      image: '/Preview Images/AC Service.png',
      ingredients: ['Refrigerant', 'AC Compressor', 'Condenser', 'Evaporator', 'O-Rings', 'Recovery Machine'],
      instructions: 'Recover old refrigerant. Replace compressor, condenser, and evaporator as needed. Vacuum system and recharge with proper refrigerant. Test system operation.',
      equipment: ['AC Machine', 'Vacuum Pump', 'Gauge Set'],
      healthTags: ['Comfort', 'Air Quality', 'Efficiency']
    },
    {
      id: '17',
      title: 'Pasta Carbonara',
      image: '/Preview Images/Pasta Carbonara.png',
      ingredients: ['Pasta', 'Bacon', 'Eggs', 'Parmesan Cheese', 'Black Pepper'],
      instructions: 'Cook pasta in pot. Whisk eggs, parmesan cheese, and black pepper in bowl. Add cooked bacon to bowl and mix. Combine with cooked pasta.',
      equipment: ['Pot', 'Spatula'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '18',
      title: 'Quinoa Salad Bowl',
      image: '/Preview Images/Quinoa Salad Bowl.png',
      ingredients: ['Quinoa', 'Mixed Greens', 'Cherry Tomatoes', 'Cucumber', 'Red Onion', 'Feta Cheese', 'Lemon Vinaigrette'],
      instructions: 'Combine quinoa, mixed greens, cherry tomatoes, cucumber, red onion, and feta cheese in bowl. Drizzle with lemon vinaigrette.',
      equipment: ['Mixing Bowl', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '19',
      title: 'Roasted Brussel Sprouts',
      image: '/Preview Images/Roasted Brussel Sprouts.png',
      ingredients: ['Brussel Sprouts', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Toss brussel sprouts with olive oil, salt, and pepper. Roast in oven until tender and caramelized.',
      equipment: ['Oven', 'Baking Sheet'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '20',
      title: 'Roasted Sweet Potatoes',
      image: '/Preview Images/Roasted Sweet Potatoes.png',
      ingredients: ['Sweet Potatoes', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Toss sweet potatoes with olive oil, salt, and pepper. Roast in oven until tender and caramelized.',
      equipment: ['Oven', 'Baking Sheet'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '21',
      title: 'Spaghetti Squash with Meat Sauce',
      image: '/Preview Images/Spaghetti Squash with Meat Sauce.png',
      ingredients: ['Spaghetti Squash', 'Ground Beef', 'Tomato Sauce', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Cook spaghetti squash in oven. Cook ground beef and tomato sauce in skillet. Combine with cooked spaghetti squash.',
      equipment: ['Oven', 'Skillet'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '22',
      title: 'Spinach and Feta Stuffed Chicken',
      image: '/Preview Images/Spinach and Feta Stuffed Chicken.png',
      ingredients: ['Chicken Breast', 'Spinach', 'Feta Cheese', 'Garlic', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Stuff chicken breast with spinach, feta cheese, and garlic. Drizzle with olive oil and season with salt and pepper. Bake in oven until cooked through.',
      equipment: ['Oven', 'Baking Sheet'],
      healthTags: ['High Protein', 'Low Glycemic']
    },
    {
      id: '23',
      title: 'Vegetable Curry',
      image: '/Preview Images/Vegetable Curry.png',
      ingredients: ['Mixed Vegetables', 'Coconut Milk', 'Curry Powder', 'Olive Oil', 'Salt', 'Pepper'],
      instructions: 'Saute mixed vegetables in pot. Add coconut milk, curry powder, and olive oil. Simmer until vegetables are tender.',
      equipment: ['Pot', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '24',
      title: 'Vegetable Stir Fry',
      image: '/Preview Images/Vegetable Stir Fry.png',
      ingredients: ['Mixed Vegetables', 'Olive Oil', 'Soy Sauce', 'Salt', 'Pepper'],
      instructions: 'Saute mixed vegetables in skillet with olive oil and soy sauce. Season with salt and pepper.',
      equipment: ['Skillet', 'Spatula'],
      healthTags: ['Vegetarian', 'High Fiber', 'Heart Healthy']
    },
    {
      id: '25',
      title: 'Zucchini Noodles with Tomato Sauce',
      image: '/Preview Images/Zucchini Noodles with Tomato Sauce.png',
      ingredients: ['Zucchini', 'Tomato Sauce', 'Olive Oil', 'Salt', 'Pepper'],
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
            <p className="text-sm mb-2">This is our My Kitchen Module (1 of 5).</p>
            <ul className="text-xs space-y-1 list-disc pl-4 text-left inline-block">
              <li><span className="font-semibold">Scan Kitchen</span> - Scans your food, works in app!</li>
              <li>Click the <span className="font-semibold">Recipe Matcher</span> Builds Recipes!</li>
              <li>Add, sort and search your digital cupboard.</li>
            </ul>
            <p className="text-xs mt-2 italic">Feel free to hit <span className="font-semibold">Full Demo</span> to see everything in action.</p>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-maineBlue" />
        </div>
      )}
      <div className="bg-weatheredWhite border-4 border-black rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-600 hover:text-gray-800 focus:outline-none"
          aria-label="Close modal"
        >
          &times;
        </button>
        <div className="flex items-center justify-center mb-2">
          <span className="text-5xl mr-2">🐟</span>
          <h1 className="text-3xl font-retro text-maineBlue mb-0">My Kitchen</h1>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <input
            type="file"
            id="scan-kitchen-file"
            className="hidden"
            accept="image/*"
            onChange={() => {}}
          />
          <button
            className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors w-full sm:w-auto max-w-xs flex items-center justify-center gap-2"
            onClick={() => alert('Functionality available in app. Please try again later.')}
          >
            Scan Kitchen
          </button>
          
          <button
            className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors w-full sm:w-auto max-w-xs"
            onClick={handleRecipeMatcherOpen}
            disabled={matcherLoading}
          >
            {matcherLoading ? 'Loading...' : 'Recipe Matcher'}
          </button>
        </div>

        {/* Digital Cupboard Section */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-retro text-maineBlue flex items-center gap-2">
            <span role="img" aria-label="anchor">⚓</span> Digital Cupboard
          </h3>
          {ingredients.length > 0 && (
            <button
              className="text-xs text-lobsterRed underline hover:text-maineBlue"
              onClick={() => setIngredients([])}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Add Ingredient Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
          {/* Search cupboard input */}
          <input
            type="text"
            className="border px-3 py-2 rounded w-full sm:w-1/3"
            placeholder="Search cupboard..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            style={{ minWidth: 120 }}
          />
          {/* Add ingredient input */}
          <input
            type="text"
            className="border px-3 py-2 rounded w-full sm:w-1/3"
            placeholder="Add an ingredient..."
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
            onClick={addIngredient}
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
          
          {filteredIngredients.length === 0 ? (
            <div className="text-gray-500 italic text-center py-8 relative z-10">
              No matching ingredients in your digital cupboard!
            </div>
          ) : (
            <div className="flex flex-col gap-4 relative z-10">
              {[0,1,2,3,4,5].map(shelfIdx => {
                const shelfItems = filteredIngredients.slice(shelfIdx*3, (shelfIdx+1)*3);
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
                            setIngredients(ingredients.filter(i => i !== ing));
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
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-weatheredWhite rounded-lg shadow-lg p-6 max-w-xl w-full relative">
            <button 
              className="absolute top-2 right-2 text-lobsterRed font-bold text-xl" 
              onClick={() => setShowRecipeMatcher(false)}
            >
              ✕
            </button>
            <h2 className="font-retro text-2xl mb-2 text-center">Recipe Matcher</h2>
            
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
                  <span className="font-bold">Ingredients:</span> {sampleRecipes[currentRecipeIndex].ingredients.join(', ')}
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
                  Cook Me
                </button>
              </div>
              
              <div className="text-xs mt-4 text-center text-gray-500">
                Swipe through AI-powered recipes based on your cupboard!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRunModal;

