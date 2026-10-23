export interface UserProfile {
  name: string;
  email: string;
  age: number;
  gender: 'Male' | 'Female' | 'Prefer not to say';
  hasActiveCycle: boolean;
  irregularCycle: boolean;
  pcosCondition: boolean;
  weight: number; // in kg
  height: number; // in cm
  bmi: number;
  bmiCategory: string;
  bmiExplanation: string;
  fitnessStatus: 'Gym' | 'Home' | 'None';
  currentSplitDesc?: string;
  exerciseBarrier?: string;
  primaryGoal: 'Cut' | 'Maintain' | 'Bulk';
  roastMessage?: string;
  dietPreference: 'Vegetarian' | 'Eggetarian' | 'Non-Vegetarian';
  currentDietDesc: string;
  dietFeedback: string;
  proteinTargetLevel: 'Moderate' | 'Recommended' | 'Aggressive';
  proteinTargetGrams: number;
  calorieTarget: number;
  takesWhey: boolean;
  wheyBrand?: string;
  wheyDosage?: string;
  selectedSupplements: string[]; // creatine, fishoil, multivitamins, zinc, magnesium, vitd3, b12, preworkout
  
  // Menstrual cycle details
  cycleLength: number; // default 28
  periodDuration: number; // default 5
  lastPeriodDate: string; // YYYY-MM-DD or DD/MM/YYYY
  cycleRegularity: 'Regular' | 'Somewhat irregular' | 'Very irregular';
  pmsSymptoms: string[];
}

export interface LoggedMeal {
  id: string;
  name: string;
  protein: number;
  calories: number;
  carbs: number;
  fats: number;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  loggedAt: string;
}

export interface DailyCheckIn {
  sleepHours: number;
  workoutDone: boolean;
  waterIntake: number; // in glasses
  energyLevel: number; // 1-10
  painFlags: string;
  loggedDate: string; // YYYY-MM-DD
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}
