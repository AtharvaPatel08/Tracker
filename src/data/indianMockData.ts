import { Badge } from "../types";

export const MOCK_SEARCH_RESULTS = [
  {
    id: "mb-whey",
    name: "MuscleBlaze Whey Protein",
    platform: "Amazon India",
    price: "₹ Available online",
    delivery: "Delivers pan-India",
    link: "https://www.amazon.in"
  },
  {
    id: "on-gold",
    name: "Optimum Nutrition Gold Standard",
    platform: "Flipkart",
    price: "₹ Available online",
    delivery: "Delivers pan-India",
    link: "https://www.flipkart.com"
  },
  {
    id: "asitis-whey",
    name: "AS-IT-IS Nutrition Whey",
    platform: "Amazon India",
    price: "₹ Budget option",
    delivery: "Delivers pan-India",
    link: "https://www.amazon.in"
  }
];

export const SHAME_STREAK_MESSAGES = [
  "3 days off. The samosas are winning. Get back up. 🔥",
  "Your past self started this. Your future self is waiting. Show up.",
  "Sharma Ji Ka Beta has logged 6 days straight. Just saying.",
  "Aloo parathas don't count as a workout split. Lift some iron, King!",
  "Are we building a monster or an expert armchair analyst? Let's go!"
];

export const BADGES_LIST: Badge[] = [
  {
    id: "tandoor",
    title: "Tandoor Champion",
    description: "Hit your daily protein target 7 days straight",
    icon: "🍗",
    unlocked: true
  },
  {
    id: "sharma",
    title: "Sharma Ji Ka Beta",
    description: "Logged all meals for 7 days with zero reminders",
    icon: "🤓",
    unlocked: false
  },
  {
    id: "zero_excuse",
    title: "Zero Excuse Mode",
    description: "Completed 15-minute home workout with no equipment 5 days",
    icon: "⚡",
    unlocked: true
  },
  {
    id: "macro_maestro",
    title: "Macro Maestro",
    description: "Hit all macronutrients within 5% variance for 3 days",
    icon: "⚖️",
    unlocked: false
  },
  {
    id: "gym_khana",
    title: "Gym Khana Winner",
    description: "Consistent gym log / exercise completion for 30 days",
    icon: "🏋️",
    unlocked: false
  }
];

export const INDIAN_MEALS_DB = {
  Vegetarian: {
    Breakfast: {
      name: "2 Paneer Parathas + 1 cup Curd + Tea (No Sugar)",
      protein: 20, calories: 420, carbs: 45, fats: 18,
      items: "Paneer (80g), Whole Wheat Flour (60g), Curd (100g)"
    },
    Lunch: {
      name: "150g Sautéed Paneer + 1 cup Dal Tadka + 2 Rotis + Salad",
      protein: 36, calories: 510, carbs: 55, fats: 16,
      items: "Paneer (150g), Yellow Moong Dal (100g cooked), Wheat Roti (2 pcs)"
    },
    Snack: {
      name: "Roasted Chana (50g) + Coconut Water",
      protein: 11, calories: 190, carbs: 28, fats: 4,
      items: "Kala Chana (50g), Fresh Coconut Water (250ml)"
    },
    Dinner: {
      name: "1 cup Rajma Masala + 1 cup Jeera Rice + Mixed Salad",
      protein: 16, calories: 410, carbs: 65, fats: 8,
      items: "Kidney Beans (120g cooked), Basmati Rice (100g cooked)"
    }
  },
  Eggetarian: {
    Breakfast: {
      name: "4 Egg Whites + 2 Whole Eggs Scramble + 2 Toast + Black Coffee",
      protein: 28, calories: 380, carbs: 32, fats: 12,
      items: "Egg Whites (4), Whole Eggs (2), Brown Bread Toast (2 pcs)"
    },
    Lunch: {
      name: "3 Egg Bhurji Roll + 1 cup Yellow Dal + Sliced Cucumber",
      protein: 30, calories: 480, carbs: 40, fats: 14,
      items: "Whole Eggs (3), Whole Wheat Wrap, Yellow Arhar Dal"
    },
    Snack: {
      name: "Boiled Sprouts Salad (1 cup) + Green Tea",
      protein: 12, calories: 160, carbs: 24, fats: 1,
      items: "Mixed Moong & Chana Sprouts (150g), Lemon"
    },
    Dinner: {
      name: "Egg Curry (3 Eggs) + 2 Rotis + Sautéed Cauliflower (Gobhi)",
      protein: 26, calories: 430, carbs: 38, fats: 15,
      items: "Boiled Eggs (3), Wheat Roti (2 pcs), Onion-Tomato Gravy"
    }
  },
  "Non-Vegetarian": {
    Breakfast: {
      name: "4 Egg Whites + 2 Whole Eggs + 2 Rotis + 1 cup Chai (no sugar)",
      protein: 28, calories: 380, carbs: 36, fats: 11,
      items: "Egg Whites (4), Whole Eggs (2), Wheat Roti (2 pcs)"
    },
    Lunch: {
      name: "150g Chicken Breast + 1 cup Dal + 2 Rotis + Salad",
      protein: 45, calories: 520, carbs: 42, fats: 13,
      items: "Chicken Breast (150g cooked), Red Lentil Masoor Dal, Wheat Roti (2 pcs)"
    },
    Snack: {
      name: "Soya Chunks Stir-fry (50g) + Black Coffee",
      protein: 26, calories: 180, carbs: 15, fats: 2,
      items: "Nutrela Soya Chunks (50g dry)"
    },
    Dinner: {
      name: "150g Baked Fish Tikka + 1 cup Jeera Rice + Lemon Salad",
      protein: 38, calories: 460, carbs: 48, fats: 10,
      items: "Rehu or Basa Fish (150g), Basmati Rice (120g cooked)"
    }
  }
};

export const MOCK_WORKOUT_SPLITS = {
  Gym: {
    "Push Day": [
      { name: "Bench Press", details: "4 sets × 8-10 reps", recovery: "90s rest" },
      { name: "Incline Dumbbell Press", details: "3 sets × 10-12 reps", recovery: "90s rest" },
      { name: "Shoulder Press", details: "3 sets × 10 reps", recovery: "90s rest" },
      { name: "Lateral Raises", details: "3 sets × 15 reps", recovery: "60s rest" },
      { name: "Tricep Pushdown", details: "3 sets × 12 reps", recovery: "60s rest" }
    ],
    "Pull Day": [
      { name: "Deadlift", details: "3 sets × 5 reps", recovery: "120s rest" },
      { name: "Lat Pulldowns", details: "4 sets × 10-12 reps", recovery: "90s rest" },
      { name: "Seated Cable Rows", details: "3 sets × 12 reps", recovery: "90s rest" },
      { name: "Face Pulls", details: "3 sets × 15 reps", recovery: "60s rest" },
      { name: "Barbell Curls", details: "3 sets × 12 reps", recovery: "60s rest" }
    ],
    "Legs Day": [
      { name: "Barbell Squats", details: "4 sets × 8-10 reps", recovery: "120s rest" },
      { name: "Romanian Deadlift", details: "3 sets × 10-12 reps", recovery: "90s rest" },
      { name: "Leg Press", details: "3 sets × 12 reps", recovery: "90s rest" },
      { name: "Leg Curls", details: "3 sets × 15 reps", recovery: "60s rest" },
      { name: "Calf Raises", details: "4 sets × 20 reps", recovery: "60s rest" }
    ],
    "Core / Cardio": [
      { name: "Hanging Leg Raises", details: "3 sets × 15 reps", recovery: "45s rest" },
      { name: "Plank Hold", details: "3 sets × 60 seconds", recovery: "45s rest" },
      { name: "HIIT Battle Ropes", details: "5 cycles × 30s work / 30s rest", recovery: "60s rest" },
      { name: "Incline Treadmill Walk", details: "20 minutes at 10% incline", recovery: "Continuous" }
    ]
  },
  Home: {
    "Upper Body Day": [
      { name: "Decline Push-ups (Feet elevated)", details: "4 sets × 12-15 reps", recovery: "60s rest" },
      { name: "Towel Resistance Back Rows", details: "4 sets × 15 reps", recovery: "60s rest" },
      { name: "Standard Push-ups", details: "3 sets × Max reps", recovery: "60s rest" },
      { name: "Pike Push-ups (Shoulders focus)", details: "3 sets × 10-12 reps", recovery: "60s rest" },
      { name: "Chair Tricep Dips", details: "3 sets × 15 reps", recovery: "60s rest" }
    ],
    "Lower Body Day": [
      { name: "Bodyweight Squats (Slo-mo)", details: "4 sets × 20 reps", recovery: "60s rest" },
      { name: "Bulgarian Split Squats", details: "3 sets × 12 reps per leg", recovery: "60s rest" },
      { name: "Glute Bridges (Single leg option)", details: "3 sets × 15 reps", recovery: "45s rest" },
      { name: "Walking Lunges", details: "3 sets × 20 steps total", recovery: "60s rest" },
      { name: "Calf Raises on Steps", details: "4 sets × 25 reps", recovery: "45s rest" }
    ],
    "Abs & Core Blast": [
      { name: "Bicycle Crunches", details: "3 sets × 20 reps", recovery: "45s rest" },
      { name: "Russian Twists (Hold water bottle)", details: "3 sets × 30 total twists", recovery: "45s rest" },
      { name: "Lying Leg Raises", details: "3 sets × 12 reps", recovery: "45s rest" },
      { name: "Supermans (Lower back)", details: "3 sets × 15 reps", recovery: "45s rest" },
      { name: "Mountain Climbers", details: "3 sets × 40 seconds", recovery: "45s rest" }
    ],
    "Active Recovery / Yoga": [
      { name: "Surya Namaskar (Sun Salutations)", details: "5-10 rounds slow paced", recovery: "Continuous" },
      { name: "Child's Pose & Cobra Stretch Flow", details: "5 minutes breathing synchrony", recovery: "Continuous" },
      { name: "Deep Squat Hold (Malasana)", details: "3 rounds × 45 seconds hold", recovery: "30s rest" }
    ]
  }
};

export const ZERO_EXCUSE_ROUTINES = {
  Beginner: [
    { name: "Air Squats", duration: "45s", instructions: "Slow and controlled, chest up, knees tracking toes" },
    { name: "Wall Push-ups or Knee Push-ups", duration: "45s", instructions: "Keep core tight, body in straight line" },
    { name: "Plank Hold", duration: "30s", instructions: "Squeeze glutes and abs, don't sag hips" },
    { name: "Jumping Jacks", duration: "45s", instructions: "Light on your feet, stay dynamic" },
    { name: "Bird-Dog Pose", duration: "45s", instructions: "Alternate arms & legs to build deep spine stability" }
  ],
  Intermediate: [
    { name: "Jumping Squats", duration: "45s", instructions: "Explode upwards, land soft on balls of feet" },
    { name: "Standard Floor Push-ups", duration: "45s", instructions: "Elbows tucked 45 degrees, chest to floor" },
    { name: "Reverse Lunges", duration: "45s", instructions: "Step back, alternate legs, steady posture" },
    { name: "Mountain Climbers", duration: "45s", instructions: "High knees, pump legs, brace shoulders" },
    { name: "Bicycle Crunches", duration: "45s", instructions: "Rotate shoulder to opposite knee, stretch leg" }
  ],
  Advanced: [
    { name: "Burpees (With Push-up)", duration: "45s", instructions: "Drop, push-up, jump high, clap overhead" },
    { name: "Diamond Push-ups", duration: "45s", instructions: "Hands close to isolate triceps & inner chest" },
    { name: "Pistol Squats (Alternate or assisted)", duration: "45s", instructions: "Single leg squats, core extreme stabilization" },
    { name: "High Knees Sprint", duration: "45s", instructions: "Max velocity knees above hip height" },
    { name: "Commandos (Military Plank)", duration: "45s", instructions: "Alternate forearms to high plank hands" }
  ]
};

export const SUPPLEMENTS_INFO = [
  {
    name: "Whey Protein",
    dosage: "1 Scoop (approx. 24g-30g protein)",
    timing: "Post-Workout (within 45 mins) or Morning",
    why: "Rapidly absorbed protein source to trigger muscle protein synthesis and optimize skeletal recovery.",
    source: "MB / ON / AS-IT-IS"
  },
  {
    name: "Creatine Monohydrate",
    dosage: "3g to 5g daily",
    timing: "Post-Workout with a carb source or Morning",
    why: "Saturates cellular creatine phosphate stores. Boosts absolute ATP energy production during high-intensity lifting bursts.",
    source: "Amazon India"
  },
  {
    name: "Vitamin D3",
    dosage: "1000 - 2000 IU daily (or 60,000 IU weekly if deficient)",
    timing: "With Breakfast (Fat-Soluble)",
    why: "Crucial for bone density synthesis, testosterone production, immune security, and general metabolic vigor.",
    source: "Local Pharmacy / Zepto"
  },
  {
    name: "Omega-3 Fish Oil",
    dosage: "1 - 2 Capsules (1000mg total)",
    timing: "With Lunch or Dinner",
    why: "Powerful cardiovascular security, anti-inflammatory support, and high-performance joint lubrication.",
    source: "Amazon India / BigBasket"
  },
  {
    name: "Magnesium (Glycinate)",
    dosage: "200mg - 400mg",
    timing: "30 - 60 minutes Before Bed",
    why: "Deep central nervous system relaxation, alleviates muscular cramping, and triggers REM sleep cycles.",
    source: "Local Pharmacy / Zepto"
  },
  {
    name: "Vitamin B12",
    dosage: "1500 mcg (especially if Vegetarian)",
    timing: "Morning with water",
    why: "Essential for cellular red blood cell production, brain nerve health, and daily energy management.",
    source: "Local Pharmacy"
  }
];
