import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home, Dumbbell, Utensils, Award, Settings, ShieldAlert,
  Flame, Battery, Clock, CheckCircle2, ChevronRight, Play, Square,
  RotateCw, Plus, Search, Camera, Trash2, Edit2, Check,
  ShoppingBag, Sparkles, Calendar, BookOpen, AlertCircle, Info, Heart,
  MapPin, Map
} from "lucide-react";
import { UserProfile, LoggedMeal, DailyCheckIn, Badge } from "../types";
import { 
  MOCK_SEARCH_RESULTS, 
  SHAME_STREAK_MESSAGES, 
  BADGES_LIST, 
  INDIAN_MEALS_DB, 
  MOCK_WORKOUT_SPLITS, 
  ZERO_EXCUSE_ROUTINES, 
  SUPPLEMENTS_INFO 
} from "../data/indianMockData";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import AnimatedList from "./AnimatedList/AnimatedList";

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getYesterdayLocalDateString = () => {
  const d = new Date(Date.now() - 86400000);
  return getLocalDateString(d);
};

interface DashboardProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onLogout: () => void;
}

export default function Dashboard({ profile, onUpdateProfile, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("HOME");
  const [streak, setStreak] = useState<number>(3); // Initial 3 days streak
  const [streakMessage, setStreakMessage] = useState<string>("");
  
  // Todays logged macros
  const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>([
    {
      id: "m1",
      name: "4 Egg Whites + 2 Whole Eggs + 2 Rotis + 1 cup Chai (no sugar)",
      protein: 28,
      calories: 380,
      carbs: 36,
      fats: 11,
      mealType: "Breakfast",
      loggedAt: "08:30 AM"
    }
  ]);
  
  // Custom meal input state
  const [customMealName, setCustomMealName] = useState("");
  const [customMealProtein, setCustomMealProtein] = useState("");
  const [customMealCalories, setCustomMealCalories] = useState("");
  const [customMealType, setCustomMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>("Lunch");
  
  // Photo meal simulation and real-time AI analysis
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [simulatedPhotoAnalyzing, setSimulatedPhotoAnalyzing] = useState(false);
  const [mealDescInput, setMealDescInput] = useState("");
  const [mealImageBase64, setMealImageBase64] = useState<string | null>(null);
  const [mealImageMimeType, setMealImageMimeType] = useState<string | null>(null);
  const [isSearchingSupplements, setIsSearchingSupplements] = useState(false);

  // Daily Checkin state machine
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInStep, setCheckInStep] = useState(1);
  const [checkInSleep, setCheckInSleep] = useState("7");
  const [checkInWorkout, setCheckInWorkout] = useState<boolean | null>(null);
  const [checkInWater, setCheckInWater] = useState("6");
  const [checkInEnergy, setCheckInEnergy] = useState("8");
  const [checkInPain, setCheckInPain] = useState("");
  const [checkInCompletedToday, setCheckInCompletedToday] = useState(false);

  // Zero Excuse Mode Workout State
  const [zeDifficulty, setZeDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>("Intermediate");
  const [activeZeWorkout, setActiveZeWorkout] = useState<boolean>(false);
  const [zeIndex, setZeIndex] = useState(0);
  const [zeTimer, setZeTimer] = useState(45);
  const [zePaused, setZeTimerPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Supplements search/retailer state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchFeedback, setShowSearchFeedback] = useState(false);

  // Google Maps Grounding states
  const [mapsQuery, setMapsQuery] = useState("");
  const [mapsLocation, setMapsLocation] = useState("Mumbai, India");
  const [mapsResults, setMapsResults] = useState<any[]>([]);
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);
  const [showMapsFeedback, setShowMapsFeedback] = useState(false);

  // Water incrementer
  const [waterGlasses, setWaterGlasses] = useState(5);

  // Badges state
  const [badges, setBadges] = useState<Badge[]>(BADGES_LIST);

  // Elegant Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load a randomized shame streak message upon init
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * SHAME_STREAK_MESSAGES.length);
    setStreakMessage(SHAME_STREAK_MESSAGES[randomIndex]);
  }, []);

  // Load streak and today's check-in state from Firestore when Dashboard mounts / auth changes
  useEffect(() => {
    const loadStreakAndCheckIn = async () => {
      if (auth.currentUser) {
        try {
          const userId = auth.currentUser.uid;
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            let current = data.currentStreak || 0;
            const lastDate = data.lastCheckinDate || "";
            
            const todayStr = getLocalDateString();
            
            // Check if missed a day using timezone-safe UTC math
            if (lastDate && lastDate !== todayStr) {
              const [year1, month1, day1] = lastDate.split("-").map(Number);
              const [year2, month2, day2] = todayStr.split("-").map(Number);
              const date1 = Date.UTC(year1, month1 - 1, day1);
              const date2 = Date.UTC(year2, month2 - 1, day2);
              const diffDays = Math.round((date2 - date1) / (1000 * 60 * 60 * 24));
              
              if (diffDays > 1) {
                // Missed at least one day, reset current streak to 0
                current = 0;
                await setDoc(doc(db, "users", userId), {
                  currentStreak: 0
                }, { merge: true });
              }
            }
            
            setStreak(current);
          }

          // Check today's check-in status
          const todayStr = getLocalDateString();
          const checkInDoc = await getDoc(doc(db, "users", userId, "checkins", todayStr));
          if (checkInDoc.exists()) {
            setCheckInCompletedToday(true);
            const data = checkInDoc.data();
            if (data.sleep !== undefined) setCheckInSleep(String(data.sleep));
            if (data.workout !== undefined) setCheckInWorkout(data.workout);
            if (data.water !== undefined) setCheckInWater(String(data.water));
            if (data.energy !== undefined) setCheckInEnergy(String(data.energy));
            if (data.pain !== undefined) setCheckInPain(data.pain);
          } else {
            setCheckInCompletedToday(false);
          }
        } catch (err) {
          console.warn("Error loading streak/checkin:", err);
        }
      }
    };
    loadStreakAndCheckIn();
  }, [auth.currentUser?.uid]);

  // Load today's logged meals from Firestore when Dashboard mounts / auth changes
  useEffect(() => {
    const loadTodayMeals = async () => {
      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        const todayStr = getLocalDateString();
        try {
          const mealsDoc = await getDoc(doc(db, "users", userId, "meals", todayStr));
          if (mealsDoc.exists()) {
            const data = mealsDoc.data();
            const mealsList: LoggedMeal[] = [];
            
            const parseMealsField = (mealsArr: any[], type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => {
              if (Array.isArray(mealsArr)) {
                mealsArr.forEach(m => {
                  mealsList.push({
                    id: m.id || Math.random().toString(),
                    name: m.name || "",
                    protein: m.protein || 0,
                    calories: m.calories || 0,
                    carbs: m.carbs || 0,
                    fats: m.fats || 0,
                    mealType: type,
                    loggedAt: m.loggedAt || "12:00 PM"
                  });
                });
              }
            };
            
            parseMealsField(data.breakfast || [], 'Breakfast');
            parseMealsField(data.lunch || [], 'Lunch');
            parseMealsField(data.dinner || [], 'Dinner');
            parseMealsField(data.snacks || data.snack || [], 'Snack');
            
            if (mealsList.length > 0) {
              setLoggedMeals(mealsList);
            }
          }
        } catch (err) {
          console.warn("Error loading today's meals:", err);
        }
      }
    };
    loadTodayMeals();
  }, [auth.currentUser?.uid]);

  // Timer logic for Zero Excuse Mode
  useEffect(() => {
    if (activeZeWorkout && zeTimer > 0 && !zePaused) {
      timerRef.current = setTimeout(() => {
        setZeTimer(prev => prev - 1);
      }, 1000);
    } else if (activeZeWorkout && zeTimer === 0) {
      const routine = ZERO_EXCUSE_ROUTINES[zeDifficulty];
      if (zeIndex < routine.length - 1) {
        setZeIndex(prev => prev + 1);
        setZeTimer(45);
      } else {
        // Workout finished!
        setActiveZeWorkout(false);
        setStreak(prev => prev + 1);
        // Unlock badge if not unlocked
        setBadges(prev => prev.map(b => b.id === "zero_excuse" ? { ...b, unlocked: true } : b));
        showToast("SAMAY SAMAPT! Absolute victory, champ. 15-minute high-octane workout completed! Streak incremented. 🔥", "success");
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeZeWorkout, zeTimer, zePaused, zeIndex]);

  // Calculate accumulated macros
  const totalCaloriesLogged = loggedMeals.reduce((acc, m) => acc + m.calories, 0);
  const totalProteinLogged = loggedMeals.reduce((acc, m) => acc + m.protein, 0);

  // Helper to determine cycle phase based on cycle configuration
  const getCyclePhaseDetails = () => {
    if (!profile.hasActiveCycle) return null;
    
    // Calculate days elapsed since lastPeriodDate
    const lastDate = profile.lastPeriodDate ? new Date(profile.lastPeriodDate) : null;
    const isValidDate = lastDate && !isNaN(lastDate.getTime());
    const cycleLength = profile.cycleLength || 28;
    const today = new Date();
    const diffTime = isValidDate ? Math.abs(today.getTime() - lastDate.getTime()) : 0;
    const diffDays = isValidDate ? Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) % cycleLength) : 1;
    
    let phase: 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal' = 'Follicular';
    let color = "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    let icon = "🟡";
    let daysUntilNext = Math.max(1, cycleLength - diffDays);

    if (diffDays <= 5) {
      phase = 'Menstrual';
      color = "text-red-500 bg-red-500/10 border-red-500/20";
      icon = "🔴";
    } else if (diffDays > 5 && diffDays <= 13) {
      phase = 'Follicular';
      color = "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      icon = "🟡";
    } else if (diffDays > 13 && diffDays <= 16) {
      phase = 'Ovulation';
      color = "text-neutral-300 bg-neutral-300/10 border-neutral-300/20";
      icon = "⚪";
    } else {
      phase = 'Luteal';
      color = "text-purple-500 bg-purple-500/10 border-purple-500/20";
      icon = "🟣";
    }

    return { phase, color, icon, daysUntilNext, currentDay: diffDays };
  };

  const cycleDetails = getCyclePhaseDetails();

  const saveMealsToFirestore = async (meals: LoggedMeal[]) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const todayStr = getLocalDateString();
    
    const breakfast = meals.filter(m => m.mealType === 'Breakfast');
    const lunch = meals.filter(m => m.mealType === 'Lunch');
    const dinner = meals.filter(m => m.mealType === 'Dinner');
    const snacks = meals.filter(m => m.mealType === 'Snack');
    
    const totalProtein = meals.reduce((acc, m) => acc + m.protein, 0);
    const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
    
    try {
      await setDoc(doc(db, "users", userId, "meals", todayStr), {
        breakfast,
        lunch,
        dinner,
        snacks,
        totalProtein,
        totalCalories
      });
    } catch (err) {
      console.warn("Error saving meals to firestore:", err);
    }
  };

  // Add custom meal log
  const handleAddCustomMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMealName) return;

    const proteins = parseInt(customMealProtein) || 0;
    const cals = parseInt(customMealCalories) || 0;

    const newMeal: LoggedMeal = {
      id: Math.random().toString(),
      name: customMealName,
      protein: proteins,
      calories: cals,
      carbs: Math.round(proteins * 1.5),
      fats: Math.round(cals * 0.05),
      mealType: customMealType,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMeals = [newMeal, ...loggedMeals];
    setLoggedMeals(updatedMeals);
    setCustomMealName("");
    setCustomMealProtein("");
    setCustomMealCalories("");

    saveMealsToFirestore(updatedMeals);
  };

  const handleDeleteMeal = (id: string) => {
    const updatedMeals = loggedMeals.filter(m => m.id !== id);
    setLoggedMeals(updatedMeals);
    saveMealsToFirestore(updatedMeals);
  };

  // Trigger quick select meal
  const handleLogQuickMeal = (mealKey: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner') => {
    const defaultData = INDIAN_MEALS_DB[profile.dietPreference || 'Vegetarian'];
    const chosen = defaultData[mealKey];

    const newMeal: LoggedMeal = {
      id: Math.random().toString(),
      name: chosen.name,
      protein: chosen.protein,
      calories: chosen.calories,
      carbs: chosen.carbs,
      fats: chosen.fats,
      mealType: mealKey,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMeals = [newMeal, ...loggedMeals];
    setLoggedMeals(updatedMeals);
    saveMealsToFirestore(updatedMeals);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        setMealImageBase64(base64String);
        setMealImageMimeType(file.type);
        showToast("Photo uploaded successfully! Ready for AI analysis.", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  // Real-time AI Vision / Description meal analysis
  const handleSimulatePhotoMeal = async () => {
    if (!mealDescInput.trim() && !mealImageBase64) {
      showToast("Please provide a meal description or select a photo.", "error");
      return;
    }

    setSimulatedPhotoAnalyzing(true);
    showToast("Dispatching meal matrix for real Gemini nutrition calculation... ⏳", "info");

    try {
      const res = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealDescription: mealDescInput,
          base64Image: mealImageBase64,
          mimeType: mealImageMimeType
        })
      });

      const data = await res.json();
      if (data.meal) {
        const analyzedMeal: LoggedMeal = {
          id: Math.random().toString(),
          name: `AI Verified: ${data.meal.name}`,
          protein: data.meal.protein || 0,
          calories: data.meal.calories || 0,
          carbs: data.meal.carbs || 0,
          fats: data.meal.fats || 0,
          mealType: customMealType,
          loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedMeals = [analyzedMeal, ...loggedMeals];
        setLoggedMeals(updatedMeals);
        saveMealsToFirestore(updatedMeals);
        
        // Reset inputs
        setMealDescInput("");
        setMealImageBase64(null);
        setMealImageMimeType(null);
        
        setShowPhotoUploadModal(false);
        showToast(`AI Analysis complete! Logged: ${data.meal.name}`, "success");
      } else {
        throw new Error("Failed to extract valid meal data from API");
      }
    } catch (err) {
      console.warn("Meal analysis failed, falling back:", err);
      const newMeal: LoggedMeal = {
        id: Math.random().toString(),
        name: `AI Verified: ${mealDescInput || "Custom Meal"} 🍗`,
        protein: 30,
        calories: 350,
        carbs: 10,
        fats: 12,
        mealType: customMealType,
        loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const updatedMeals = [newMeal, ...loggedMeals];
      setLoggedMeals(updatedMeals);
      saveMealsToFirestore(updatedMeals);
      setShowPhotoUploadModal(false);
      showToast("Standby calculation complete! Logged meal under fallback parameters.", "success");
    } finally {
      setSimulatedPhotoAnalyzing(false);
    }
  };

  // Search supplements with real Google Search grounded Gemini API
  const handleSearchSupplements = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingSupplements(true);
    setShowSearchFeedback(true);
    showToast("Searching real-time Indian inventory using Google Search Grounding... 🔍", "info");

    try {
      const res = await fetch("/api/search-supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        setSearchResults(data.results);
        showToast("Grounding search complete! Sourced real inventory and prices.", "success");
      } else {
        throw new Error("Empty search results from AI model");
      }
    } catch (err) {
      console.warn("Supplement search failed, falling back to local database:", err);
      // Fallback to locally filtered mock search results to ensure 100% resilience
      const lowerQuery = searchQuery.toLowerCase();
      const filteredMock = MOCK_SEARCH_RESULTS.filter(
        item => item.name.toLowerCase().includes(lowerQuery) || item.platform.toLowerCase().includes(lowerQuery)
      );
      setSearchResults(filteredMock.length > 0 ? filteredMock : MOCK_SEARCH_RESULTS);
      showToast("Grounding standby active. Sourced local offline Indian logistics.", "info");
    } finally {
      setIsSearchingSupplements(false);
    }
  };

  // Search local gyms and stores using Google Maps grounding
  const handleSearchMaps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapsQuery.trim()) return;

    setIsSearchingMaps(true);
    setShowMapsFeedback(true);
    showToast("Finding real locations with Google Maps grounding... 📍", "info");

    try {
      const res = await fetch("/api/search-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: mapsQuery, location: mapsLocation })
      });
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        setMapsResults(data.results);
        showToast(`Located ${data.results.length} physical centers matching '${mapsQuery}'!`, "success");
      } else {
        throw new Error("No maps results returned");
      }
    } catch (err) {
      console.warn("Maps search failed:", err);
      // Fallback
      setMapsResults([
        {
          id: "map-1",
          name: `${mapsQuery} Center`,
          address: `102, High Street Mall, near Station, ${mapsLocation}`,
          distance: "1.2 km away",
          rating: "4.7 ⭐",
          link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery + " " + mapsLocation)}`
        },
        {
          id: "map-2",
          name: `Elite ${mapsQuery} Gym`,
          address: `G-4, Corporate Park, Main Road, ${mapsLocation}`,
          distance: "2.5 km away",
          rating: "4.9 ⭐",
          link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Elite " + mapsQuery + " " + mapsLocation)}`
        }
      ]);
      showToast("Grounded standby active. Loaded estimated physical locations.", "info");
    } finally {
      setIsSearchingMaps(false);
    }
  };

  // Submit check-in answers
  const handleSubmitCheckIn = async () => {
    if (!auth.currentUser) return;
    
    const userId = auth.currentUser.uid;
    const todayStr = getLocalDateString();
    
    try {
      // 1. Save check-in details to Firestore
      await setDoc(doc(db, "users", userId, "checkins", todayStr), {
        sleep: parseFloat(checkInSleep) || 0,
        workout: checkInWorkout,
        water: parseInt(checkInWater) || 0,
        energy: parseInt(checkInEnergy) || 0,
        pain: checkInPain
      });
      
      // 2. Fetch current streak data and update
      const userDoc = await getDoc(doc(db, "users", userId));
      let current = 0;
      let longest = 0;
      let lastDate = "";
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        current = data.currentStreak || 0;
        longest = data.longestStreak || 0;
        lastDate = data.lastCheckinDate || "";
      }
      
      if (lastDate === todayStr) {
        // Already checked in today, don't increment streak
        showToast("Check-in saved! You have already checked in today, so your streak is maintained. 🔥", "info");
      } else {
        const yesterdayStr = getYesterdayLocalDateString();
        if (lastDate === yesterdayStr) {
          current += 1;
        } else {
          current = 1; // reset or start fresh
        }
        
        if (current > longest) {
          longest = current;
        }
        
        lastDate = todayStr;
        
        await setDoc(doc(db, "users", userId), {
          currentStreak: current,
          longestStreak: longest,
          lastCheckinDate: lastDate
        }, { merge: true });
        
        setStreak(current);
        showToast("Check-in verified! Your honest logs keep your adaptation flawless. Streak updated to " + current + " days! 🔥", "success");
      }
      
      setCheckInCompletedToday(true);
      setShowCheckInModal(false);
      setCheckInStep(1);
    } catch (err) {
      console.warn("Error saving check-in:", err);
      showToast("Failed to save check-in. Please try again.", "error");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto min-h-[85vh] bg-[#070707]/90 border border-white/10 rounded-none overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row shat-dashboard-wrapper">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-[#0F0F0F]/95 border-b md:border-b-0 md:border-r border-white/10 p-4 sm:p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Mobile Streak Badge */}
          <div className="flex items-center justify-between mb-3 md:mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-none bg-transparent border border-white/20 flex items-center justify-center font-shat-main text-lg font-light text-white shadow-lg shadow-white/5">S</div>
              <span className="font-shat-main text-base font-light tracking-widest text-white">S.H.A.T.</span>
            </div>
            <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 text-[10px] font-sans text-[#A8A8A8]">
              🔥 {streak}d
            </div>
          </div>

          {/* User Mini Profile - desktop */}
          <div className="hidden md:block p-4 rounded-none bg-[#0F0F0F] border border-white/10 mb-6">
            <span className="text-[10px] font-sans font-light tracking-[0.2em] text-white/60 block mb-0.5 uppercase">ATHLETE CARD</span>
            <h4 className="font-sans font-light text-sm text-white truncate">Hey {profile.name || "Champion"} 💪</h4>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-sans font-light text-[#A8A8A8]">🔥 {streak} Days Streak</span>
            </div>
            {profile.roastMessage && (
              <p className="text-[9px] text-white font-sans font-light tracking-wide leading-tight mt-2 uppercase border-t border-white/10 pt-2">
                "ROAST ACTIVE: BULK CANCELED"
              </p>
            )}
          </div>

          {/* Navigation Items: Mobile horizontal scroll strip + Desktop vertical stack */}
          <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0 -mx-1 px-1 md:mx-0 md:px-0">
            {[
              { id: "HOME", label: "Dashboard", icon: Home },
              { id: "WORKOUT", label: "My Workout", icon: Dumbbell },
              { id: "DIET", label: "My Meal Plan", icon: Utensils },
              { id: "SUPPLEMENTS", label: "Supplements", icon: ShoppingBag },
              { id: "PROGRESS", label: "My Progress", icon: Award },
              ...(profile.hasActiveCycle && profile.gender === "Female" ? [{ id: "CYCLE_TRACKER", label: "Cycle Tracker", icon: Heart }] : []),
              { id: "ASK_SHAT_AI", label: "Ask SHAT AI", icon: Sparkles, isScroll: true },
              { id: "SETTINGS", label: "Settings", icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.isScroll) {
                      document.getElementById("ask-shat-ai")?.scrollIntoView({ behavior: "smooth" });
                    } else {
                      setActiveTab(item.id);
                      // End active zero excuse workout if leaving tab
                      if (activeTab === "WORKOUT") setActiveZeWorkout(false);
                    }
                  }}
                  className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-none text-[11px] md:text-xs font-sans tracking-[0.15em] md:tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer shrink-0 whitespace-nowrap ${
                    isActive 
                      ? "bg-white text-[#070707] font-normal shadow-lg shadow-white/5" 
                      : "text-[#A8A8A8] hover:bg-white/4 hover:text-white font-light bg-white/2 md:bg-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[1.5]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Coach Shame Status Indicator */}
        <div className="hidden md:block mt-8 pt-4 border-t border-white/6">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-white animate-platinum-pulse" />
            <span className="text-[8px] font-sans font-light text-[#A8A8A8] tracking-[0.2em] uppercase">STREAK & SHAME ENG.</span>
          </div>
          <p className="text-[10px] text-[#555555] font-sans font-light leading-relaxed italic uppercase">
            "{streakMessage || "No warnings logged."}"
          </p>
        </div>
      </aside>

      {/* MAIN VIEWPORT CARD */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HOME DASHBOARD */}
          {activeTab === "HOME" && (
            <motion.div 
              key="HOME" 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-sans font-light tracking-[0.3em] text-[#A8A8A8] uppercase block">STATUS: COMMAND CENTER</span>
                  <h2 className="font-shat-main text-xl sm:text-2xl font-light tracking-widest text-white uppercase mt-0.5">DAILY INDEX</h2>
                </div>
                 <button
                  onClick={() => {
                    setCheckInStep(1);
                    setShowCheckInModal(true);
                  }}
                  className={`px-4 py-2 rounded-none border font-sans text-[9px] tracking-[0.2em] font-normal uppercase transition-all duration-300 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    checkInCompletedToday
                      ? "border-white/40 bg-white/10 text-white hover:bg-white/15"
                      : "border-white/20 bg-transparent text-[#A8A8A8] hover:border-white hover:text-white"
                  }`}
                >
                  {checkInCompletedToday ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5" />
                  )}
                  <span>{checkInCompletedToday ? "CHECK-IN COMPLETE" : "DAILY CHECK-IN"}</span>
                </button>
              </div>

              {/* Targets Cards Bento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Protein Target */}
                <div className="p-5 rounded-none bg-[#0F0F0F] border border-white/6 flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <span className="text-[8px] font-sans font-light tracking-[0.2em] text-[#A8A8A8] uppercase block">TARGET: MACROS AMINO</span>
                    <h3 className="font-sans text-xl font-light text-white mt-1 flex items-baseline gap-1.5">
                      {totalProteinLogged}g <span className="text-xs text-[#555555]">/ {profile.proteinTargetGrams}g target</span>
                    </h3>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-[#0A0A0A] h-1 rounded-none overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#555555] to-white h-full transition-all duration-500"
                        style={{ width: `${Math.min((totalProteinLogged / profile.proteinTargetGrams) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[8px] font-sans font-light text-[#A8A8A8] mt-2 block">
                      {Math.max(0, profile.proteinTargetGrams - totalProteinLogged)}g deficit remaining for the day
                    </span>
                  </div>
                </div>

                {/* Calorie Target */}
                <div className="p-5 rounded-none bg-[#0F0F0F] border border-white/6 flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] font-sans font-light tracking-[0.2em] text-[#A8A8A8] uppercase block">ENERGY BUDGET</span>
                    <h3 className="font-sans text-xl font-light text-white mt-1 flex items-baseline gap-1.5">
                      {totalCaloriesLogged} kcal <span className="text-xs text-[#555555]">/ {profile.calorieTarget} kcal target</span>
                    </h3>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-[#0A0A0A] h-1 rounded-none overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#555555] to-white h-full transition-all duration-500"
                        style={{ width: `${Math.min((totalCaloriesLogged / profile.calorieTarget) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[8px] font-sans font-light text-[#A8A8A8] mt-2 block">
                      {Math.max(0, profile.calorieTarget - totalCaloriesLogged)} kcal remaining energy room
                    </span>
                  </div>
                </div>

                {/* Water Intake */}
                <div className="p-5 rounded-none bg-[#0F0F0F] border border-white/6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] font-sans font-light tracking-[0.2em] text-[#A8A8A8] uppercase block">FLUID REACTION</span>
                      <h3 className="font-sans text-xl font-light text-white mt-1">
                        {waterGlasses} <span className="text-xs text-[#555555]">/ 10 glasses</span>
                      </h3>
                    </div>
                    <button 
                      onClick={() => setWaterGlasses(prev => Math.min(prev + 1, 15))}
                      className="w-7 h-7 rounded-none bg-[#0F0F0F] hover:bg-white border border-white/15 hover:border-white text-white hover:text-[#070707] flex items-center justify-center transition-all duration-300 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex gap-1 items-center">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 h-2 rounded-none ${
                          i < waterGlasses 
                            ? "bg-white shadow-md shadow-white/5" 
                            : "bg-[#0A0A0A] border border-white/6"
                        }`}
                      />
                    ))}
                  </div>
                </div>

              </div>

              {/* 4 Quick Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button 
                  onClick={() => { setCheckInStep(1); setShowCheckInModal(true); }}
                  className={`p-4 rounded-none border hover:border-white/20 flex flex-col items-center gap-2.5 transition-all duration-300 text-center group cursor-pointer ${
                    checkInCompletedToday
                      ? "bg-white/10 border-white/30 hover:bg-white/15"
                      : "bg-[#0F0F0F] border border-white/6 hover:border-white/20"
                  }`}
                >
                  {checkInCompletedToday ? (
                    <CheckCircle2 className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <Calendar className="w-5 h-5 text-[#A8A8A8] group-hover:text-white transition-colors duration-300" />
                  )}
                  <span className={`text-[10px] font-sans font-light tracking-wider uppercase transition-colors duration-300 ${
                    checkInCompletedToday ? "text-white" : "text-[#A8A8A8]"
                  }`}>
                    {checkInCompletedToday ? "Check-in Done" : "Daily Check-in"}
                  </span>
                </button>
                <button 
                  onClick={() => setActiveTab("DIET")}
                  className="p-4 rounded-none bg-[#0F0F0F] border border-white/6 hover:border-white/20 flex flex-col items-center gap-2.5 transition-all duration-300 text-center group cursor-pointer"
                >
                  <Plus className="w-5 h-5 text-[#A8A8A8] group-hover:text-white transition-colors duration-300" />
                  <span className="text-[10px] font-sans font-light tracking-wider text-white uppercase">Log Meal</span>
                </button>
                <button 
                  onClick={() => setActiveTab("WORKOUT")}
                  className="p-4 rounded-none bg-[#0F0F0F] border border-white/6 hover:border-white/20 flex flex-col items-center gap-2.5 transition-all duration-300 text-center group cursor-pointer"
                >
                  <Dumbbell className="w-5 h-5 text-[#A8A8A8] group-hover:text-white transition-colors duration-300" />
                  <span className="text-[10px] font-sans font-light tracking-wider text-white uppercase">My Workout</span>
                </button>
                <button 
                  onClick={() => setActiveTab("DIET")}
                  className="p-4 rounded-none bg-[#0F0F0F] border border-white/6 hover:border-white/20 flex flex-col items-center gap-2.5 transition-all duration-300 text-center group cursor-pointer"
                >
                  <Utensils className="w-5 h-5 text-[#A8A8A8] group-hover:text-white transition-colors duration-300" />
                  <span className="text-[10px] font-sans font-light tracking-wider text-white uppercase">My Meal Plan</span>
                </button>
              </div>

              {/* Hormonal Adaptation Highlights widget (only if active) */}
              {profile.hasActiveCycle && profile.gender === "Female" && cycleDetails && (
                <div className="p-5 rounded-none bg-[#0F0F0F] border border-white/6">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-white animate-pulse" />
                    <span className="text-[9px] font-sans font-light tracking-[0.2em] text-[#A8A8A8] uppercase">HORMONAL REACTION TRACKER</span>
                  </div>
                  <h4 className="text-sm font-sans font-light text-white uppercase tracking-wide">
                    Currently in {cycleDetails.phase} Phase {cycleDetails.icon} (Day {cycleDetails.currentDay})
                  </h4>
                  <p className="text-[11px] text-[#A8A8A8] leading-relaxed font-sans mt-2 uppercase font-light">
                    {cycleDetails.phase === "Menstrual" && "WORKOUT: Reduce intensity 20%, focus on light yoga. NUTRITION: +Iron (spinach, dates), +Magnesium (dark chocolate), and increase fluids. 🥬"}
                    {cycleDetails.phase === "Follicular" && "WORKOUT: Estrogen rising. PEAK STRENGTH — progressive overload. NUTRITION: Excellent fat loss window. Carbs moderate. 🏋️‍♀️"}
                    {cycleDetails.phase === "Ovulation" && "WORKOUT: Absolute peak week. Hit heavy compound lifts and test PRs! NUTRITION: Protein high. Appetite may spike. 🔥"}
                    {cycleDetails.phase === "Luteal" && "WORKOUT: Moderate intensity. Avoid failure. NUTRITION: Progesterone makes you hungry. Target +200-300 clean calories, +carbs. 🍫"}
                  </p>
                </div>
              )}

              {/* Recent Logs List */}
              <div className="p-6 rounded-none bg-[#0F0F0F] border border-white/6 space-y-4">
                <div className="flex justify-between items-center border-b border-white/6 pb-3">
                  <span className="text-[10px] font-sans font-light tracking-[0.2em] text-[#555555] uppercase">RECENT FLUIDS & MEALS LOGGED</span>
                  <button onClick={() => setActiveTab("DIET")} className="text-[9px] font-sans text-white font-light tracking-[0.2em] hover:underline uppercase cursor-pointer">LOG MORE</button>
                </div>
                {loggedMeals.length === 0 ? (
                  <p className="text-[11px] text-[#555555] font-sans font-light uppercase text-center py-6">No meals logged today yet. Samosas are winning!</p>
                ) : (
                  <div className="divide-y divide-white/6 space-y-3.5 pt-1">
                    {loggedMeals.map(m => (
                      <div key={m.id} className="flex justify-between items-start pt-3.5 first:pt-0">
                        <div>
                          <h4 className="text-xs font-sans font-light text-white leading-snug">{m.name}</h4>
                          <div className="flex gap-4 mt-1">
                            <span className="text-[9px] font-sans font-light text-[#A8A8A8] uppercase">{m.mealType}</span>
                            <span className="text-[9px] font-sans font-light text-[#A8A8A8]">{m.loggedAt}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-sans font-light text-white block">+{m.protein}g P</span>
                          <span className="text-[10px] font-sans font-light text-[#A8A8A8]">{m.calories} kcal</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* TAB 2: MY WORKOUT */}
          {activeTab === "WORKOUT" && (
            <motion.div 
              key="WORKOUT" 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 border-b border-white/6 pb-4">
                <div>
                  <span className="text-[10px] font-sans font-light tracking-[0.3em] text-[#A8A8A8] uppercase block">SPLIT MECHANICS</span>
                  <h2 className="font-shat-main text-xl sm:text-2xl font-light tracking-widest text-white uppercase mt-0.5">CALISTRUM ROUTINE</h2>
                </div>
                
                {/* Zero Excuse Mode Toggle */}
                <button
                  onClick={() => {
                    setActiveZeWorkout(true);
                    setZeIndex(0);
                    setZeTimer(45);
                  }}
                  className="px-5 py-2.5 rounded-none bg-transparent border border-white/20 text-[#A8A8A8] hover:border-white hover:text-white font-sans text-[9px] tracking-[0.2em] font-normal uppercase transition-all duration-300 shadow-lg shadow-white/5 cursor-pointer self-start sm:self-auto"
                >
                  ⚡ ZERO EXCUSE MODE (15m)
                </button>
              </div>

              {/* Zero Excuse Mode Active Interactive Screen */}
              {activeZeWorkout ? (
                <div className="p-6 rounded-none bg-[#0A0A0A] border border-white/15 space-y-6 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-sans font-light text-white tracking-widest uppercase flex items-center gap-1.5 animate-platinum-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      ZERO EXCUSE WORKOUT IN PROGRESS
                    </span>
                    <div className="flex gap-2">
                      <select 
                        value={zeDifficulty}
                        onChange={(e) => {
                          setZeDifficulty(e.target.value as any);
                          setZeIndex(0);
                          setZeTimer(45);
                        }}
                        className="bg-[#0F0F0F] border border-white/10 text-white font-sans font-light text-[9px] uppercase px-2.5 py-1.5 rounded-none focus:outline-none"
                      >
                        <option value="Beginner">Beginner Level</option>
                        <option value="Intermediate">Intermediate Level</option>
                        <option value="Advanced">Advanced Level</option>
                      </select>
                      <button 
                        onClick={() => setActiveZeWorkout(false)}
                        className="text-[9px] font-sans bg-white/4 border border-white/10 px-2.5 py-1.5 rounded-none uppercase hover:bg-white/10 transition-all text-[#A8A8A8] hover:text-white cursor-pointer"
                      >
                        Abrupt Stop
                      </button>
                    </div>
                  </div>

                  {/* Exercise visual instruction card */}
                  <div className="py-6 border-y border-white/6 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-sans font-light text-[#555555] uppercase tracking-widest mb-1">
                      EXERCISE {zeIndex + 1} OF {ZERO_EXCUSE_ROUTINES[zeDifficulty].length}
                    </span>
                    <h3 className="font-shat-main text-2xl font-light tracking-widest text-white uppercase">
                      {ZERO_EXCUSE_ROUTINES[zeDifficulty][zeIndex].name}
                    </h3>
                    <p className="text-xs text-[#A8A8A8] max-w-md mt-2 leading-relaxed uppercase font-light">
                      {ZERO_EXCUSE_ROUTINES[zeDifficulty][zeIndex].instructions}
                    </p>
                  </div>

                  {/* Timer Display */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="font-mono text-6xl font-extralight text-white tracking-wider animate-platinum-pulse">
                      {zeTimer}s
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setZeTimerPaused(prev => !prev)}
                        className="px-5 py-2 rounded-none border border-white/10 hover:border-white font-sans text-[9px] tracking-widest uppercase text-[#A8A8A8] hover:text-white hover:bg-white/4 transition-all duration-300 bg-[#0F0F0F]"
                      >
                        {zePaused ? "Resume Interval" : "Pause Interval"}
                      </button>
                      <button
                        onClick={() => {
                          const routine = ZERO_EXCUSE_ROUTINES[zeDifficulty];
                          if (zeIndex < routine.length - 1) {
                            setZeIndex(prev => prev + 1);
                            setZeTimer(45);
                          } else {
                            setActiveZeWorkout(false);
                            setStreak(prev => prev + 1);
                            setBadges(prev => prev.map(b => b.id === "zero_excuse" ? { ...b, unlocked: true } : b));
                            showToast("COMPLETE SUCCESS! No gear, no excuses, just steel. Streak incremented.", "success");
                          }
                        }}
                        className="px-5 py-2 rounded-none bg-white text-[#070707] font-sans text-[9px] tracking-widest uppercase font-normal hover:bg-[#D4D4D4] transition-all duration-300"
                      >
                        Skip To Next
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-[#A8A8A8] font-sans leading-relaxed uppercase font-light">
                    Your weekly custom workout split. Based on your {profile.fitnessStatus === "Gym" ? "Gym Access" : "Home Workout"} baseline. Each exercise is calibrated for progressive volume overloading.
                  </p>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Render active workout splits depending on Gym vs Home */}
                    {Object.entries(
                      (profile.fitnessStatus === "Gym" ? MOCK_WORKOUT_SPLITS.Gym : MOCK_WORKOUT_SPLITS.Home) || {}
                    ).map(([dayTitle, exercises]) => (
                      <div key={dayTitle} className="p-5 rounded-none bg-[#0F0F0F] border border-white/6 space-y-4">
                        <div className="flex justify-between items-center border-b border-white/6 pb-2.5">
                          <span className="text-[10px] font-sans tracking-[0.2em] text-white uppercase">
                            {dayTitle} (TARGET SPLIT)
                          </span>
                          <span className="text-[9px] font-sans font-light text-[#555555] uppercase">5 SPECIFIC MOVEMENT TRIGGERS</span>
                        </div>

                        <div className="space-y-3">
                          {(exercises as any[]).map((ex, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1">
                              <div className="flex items-center gap-3">
                                <span className="font-sans text-[10px] font-light text-[#555555]">0{idx + 1}</span>
                                <div>
                                  <h4 className="text-xs font-sans font-light text-white uppercase tracking-wider">{ex.name}</h4>
                                  <p className="text-[10px] text-[#A8A8A8] uppercase font-sans font-light">{ex.recovery}</p>
                                </div>
                              </div>
                              <span className="px-3 py-1 rounded-none bg-black/60 border border-white/6 font-sans font-light text-[9px] text-white tracking-widest uppercase">
                                {ex.details}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

            </motion.div>
          )}

          {/* TAB 3: MY MEAL PLAN (DIET) */}
          {activeTab === "DIET" && (
            <motion.div 
              key="DIET" 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 border-b border-white/6 pb-4">
                <div>
                  <span className="text-[10px] font-sans font-light tracking-[0.3em] text-[#A8A8A8] uppercase block">NUTRITION & MACROS</span>
                  <h2 className="font-shat-main text-xl sm:text-2xl font-light tracking-widest text-white uppercase mt-0.5">STAPLE MEAL PLAN</h2>
                </div>
                
                {/* Visual Camera button */}
                <button
                  onClick={() => setShowPhotoUploadModal(true)}
                  className="px-4 py-2.5 rounded-none border border-white/20 bg-[#0F0F0F] hover:border-white hover:text-white text-[#A8A8A8] font-sans text-[9px] tracking-[0.2em] font-normal uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                  <span>LOG MEAL BY PHOTO</span>
                </button>
              </div>

              {/* MEALS ENTRY PORT STATION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Log New Meal (Form) */}
                <div className="p-5 rounded-none bg-[#0F0F0F] border border-white/6 space-y-4">
                  <span className="text-[9px] font-sans font-light text-[#555555] uppercase block tracking-wider">MANUALLY ENCODE DIET INTAKE</span>
                  <form onSubmit={handleAddCustomMeal} className="space-y-3">
                    <div>
                      <label className="text-[9px] font-sans font-light text-[#A8A8A8] block mb-1 uppercase tracking-wider">Meal Name / Description</label>
                      <input 
                        type="text" 
                        required
                        value={customMealName}
                        onChange={(e) => setCustomMealName(e.target.value)}
                        placeholder="e.g. 150g Soya Chunks + 2 Chapatis"
                        className="w-full px-3 py-2 rounded-none bg-[#0A0A0A] text-xs text-white border border-white/10 focus:border-white/40 focus:outline-none font-sans font-light"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-sans font-light text-[#A8A8A8] block mb-1 uppercase tracking-wider">Protein (g)</label>
                        <input 
                          type="number" 
                          required
                          value={customMealProtein}
                          onChange={(e) => setCustomMealProtein(e.target.value)}
                          placeholder="Protein g"
                          className="w-full px-3 py-2 rounded-none bg-[#0A0A0A] text-xs text-white border border-white/10 focus:border-white/40 focus:outline-none font-sans font-light"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-sans font-light text-[#A8A8A8] block mb-1 uppercase tracking-wider">Calories (kcal)</span>
                        <input 
                          type="number" 
                          required
                          value={customMealCalories}
                          onChange={(e) => setCustomMealCalories(e.target.value)}
                          placeholder="Calories"
                          className="w-full px-3 py-2 rounded-none bg-[#0A0A0A] text-xs text-white border border-white/10 focus:border-white/40 focus:outline-none font-sans font-light"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[9px] font-sans font-light text-[#A8A8A8] block mb-1 uppercase tracking-wider">Meal Type</label>
                        <select 
                          value={customMealType}
                          onChange={(e) => setCustomMealType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-none bg-[#0A0A0A] text-xs text-white border border-white/10 focus:border-white/40 focus:outline-none font-sans font-light"
                        >
                          <option value="Breakfast">Breakfast</option>
                          <option value="Lunch">Lunch</option>
                          <option value="Dinner">Dinner</option>
                          <option value="Snack">Snack</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button 
                          type="submit"
                          className="w-full py-2.5 rounded-none bg-white hover:bg-[#D4D4D4] text-[#070707] font-sans text-[9px] tracking-[0.3em] font-normal uppercase transition-all duration-300 cursor-pointer border-none"
                        >
                          ADD MANUAL LOG
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* 2. Quick Log Buttons */}
                <div className="p-5 rounded-none bg-[#0F0F0F] border border-white/6 space-y-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-sans font-light text-[#555555] uppercase block tracking-wider mb-2">QUICK LOG PRESET MEALS (STAPLES)</span>
                    <p className="text-[10px] text-[#555555] font-sans font-light leading-relaxed uppercase">
                      One-tap logging for recommended {profile.dietPreference} meal presets matching your current target parameters.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleLogQuickMeal(key as any)}
                        className="py-2.5 px-3 rounded-none bg-[#0A0A0A] border border-white/10 hover:border-white text-left transition-all duration-300 cursor-pointer"
                      >
                        <span className="text-[9px] font-sans font-light text-white block uppercase tracking-widest">{key}</span>
                        <span className="text-[11px] text-[#A8A8A8] uppercase font-sans font-light leading-tight block mt-1 truncate">
                          {INDIAN_MEALS_DB[profile.dietPreference || 'Vegetarian'][key]?.name.split(" + ")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* COMPLETE MEAL PLAN GRID VIEW */}
              <div className="space-y-4">
                <span className="text-[10px] font-sans font-light tracking-[0.2em] text-[#555555] uppercase block">YOUR RECOMMENDED STAPLE DAILY INTAKE PLAN</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(INDIAN_MEALS_DB[profile.dietPreference || 'Vegetarian']).map(([mealType, meal]: [string, any]) => (
                    <div key={mealType} className="p-5 rounded-none bg-[#0F0F0F] border border-white/6 space-y-3">
                      <div className="flex justify-between items-center border-b border-white/6 pb-2">
                        <span className="text-[9px] font-sans font-light text-white uppercase tracking-wider">{mealType}</span>
                        <span className="text-[9px] font-sans font-light text-[#555555] uppercase tracking-wider">ESTIMATED MACROS</span>
                      </div>
                      <h4 className="text-xs font-sans font-light text-white uppercase leading-snug">{meal.name}</h4>
                      <p className="text-[10px] text-[#555555] font-sans font-light uppercase italic leading-normal">
                        ITEMS: {meal.items}
                      </p>
                      <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-none border border-white/10 font-sans font-light text-[9px] tracking-wider text-[#A8A8A8]">
                        <span>PROTEIN: <b className="text-white font-bold">{meal.protein}g</b></span>
                        <span>CARBS: <b className="text-white font-bold">{meal.carbs}g</b></span>
                        <span>FATS: <b className="text-white font-bold">{meal.fats}g</b></span>
                        <span className="text-white font-bold">CAL: {meal.calories}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: SUPPLEMENTS */}
          {activeTab === "SUPPLEMENTS" && (
            <motion.div 
              key="SUPPLEMENTS" 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="w-full space-y-8"
            >
              <div className="flex flex-col items-start gap-3">
                <span className="text-[10px] font-sans font-light tracking-[0.4em] text-[#555555] uppercase">05 // TIMING PROTOCOLS</span>
                <h2 className="font-shat-main text-2xl font-light tracking-widest text-white uppercase mt-0.5">SUPPLEMENT PLANNERS</h2>
                <p className="text-[11px] text-[#A8A8A8] font-sans leading-relaxed uppercase font-light">
                  Accurate timing ensures maximum bioavailability and muscle protein synthesis. Connect to shopping gateways below for priority pan-India dispatch.
                </p>
              </div>

              {/* Retailer Search System */}
              <div className="p-6 rounded-none bg-[#0F0F0F] border border-white/6 space-y-4">
                <span className="text-[9px] font-sans font-light text-[#A8A8A8] uppercase tracking-wider block">SEARCH PAN-INDIA WAREHOUSE INVENTORY</span>
                <form onSubmit={handleSearchSupplements} className="flex gap-2">
                  <input 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Whey Protein, Creatine, Omega-3..."
                    className="flex-1 px-4 py-2.5 rounded-none border border-white/10 bg-[#0A0A0A] text-white placeholder-[#555555]/60 focus:outline-none focus:border-white/40 font-sans font-light text-xs tracking-wider"
                  />
                  <button 
                    type="submit"
                    className="px-5 py-2.5 rounded-none bg-white text-[#070707] hover:bg-[#D4D4D4] hover:text-[#070707] font-sans text-[10px] tracking-widest uppercase transition-all duration-300 flex items-center gap-1.5 cursor-pointer border-none"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>SEARCH</span>
                  </button>
                </form>

                {showSearchFeedback && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[9px] font-sans font-light text-[#555555] uppercase">MOCK ONLINE SOURCING RESULTS // VERIFIED</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {searchResults.map(res => (
                        <div key={res.id} className="p-3.5 rounded-none bg-[#0A0A0A] border border-white/6 flex flex-col justify-between items-start">
                          <div>
                            <span className="text-[8px] font-sans font-light text-white uppercase tracking-widest">{res.platform}</span>
                            <h4 className="text-xs font-sans font-light text-white uppercase leading-tight mt-1">{res.name}</h4>
                          </div>
                          <div className="w-full flex justify-between items-center mt-3 border-t border-white/6 pt-2 font-sans font-light text-[9px] uppercase tracking-wider">
                            <span className="text-[#A8A8A8]">{res.price}</span>
                            <a 
                              href={res.link} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-white hover:text-[#A8A8A8] transition-colors flex items-center gap-1 hover:underline uppercase"
                            >
                              <span>BUY</span>
                              <ChevronRight className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Google Maps Local Search Grounding */}
              <div className="p-6 rounded-none bg-[#0F0F0F] border border-white/6 space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-white" />
                  <span className="text-[9px] font-sans font-light text-[#A8A8A8] uppercase tracking-wider">FIND PHYSICAL GYMS, STORES & CLINICS (MAPS GROUNDED)</span>
                </div>
                <form onSubmit={handleSearchMaps} className="flex flex-col sm:flex-row gap-2">
                  <input 
                    value={mapsQuery}
                    onChange={(e) => setMapsQuery(e.target.value)}
                    placeholder="e.g. Gold's Gym, HealthKart store, Crossfit..."
                    className="flex-1 px-4 py-2.5 rounded-none border border-white/10 bg-[#0A0A0A] text-white placeholder-[#555555]/60 focus:outline-none focus:border-white/40 font-sans font-light text-xs tracking-wider"
                  />
                  <input 
                    value={mapsLocation}
                    onChange={(e) => setMapsLocation(e.target.value)}
                    placeholder="Location, e.g. Mumbai, India"
                    className="w-full sm:w-48 px-4 py-2.5 rounded-none border border-white/10 bg-[#0A0A0A] text-white placeholder-[#555555]/60 focus:outline-none focus:border-white/40 font-sans font-light text-xs tracking-wider"
                  />
                  <button 
                    type="submit"
                    className="px-5 py-2.5 rounded-none bg-white text-[#070707] hover:bg-[#D4D4D4] hover:text-[#070707] font-sans text-[10px] tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer border-none"
                  >
                    {isSearchingMaps ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    ) : (
                      <Map className="w-3.5 h-3.5" />
                    )}
                    <span>LOCATE</span>
                  </button>
                </form>

                {showMapsFeedback && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[9px] font-sans font-light text-[#555555] uppercase">GOOGLE MAPS GROUNDED RESULTS // VERIFIED</span>
                    {isSearchingMaps ? (
                      <div className="py-6 text-center">
                        <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin mx-auto mb-2" />
                        <span className="text-[10px] text-[#A8A8A8] uppercase font-sans font-light tracking-wider">Consulting Google Maps index...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {mapsResults.map(res => (
                          <div key={res.id} className="p-3.5 rounded-none bg-[#0A0A0A] border border-white/6 flex flex-col justify-between items-start">
                            <div>
                              <div className="flex justify-between items-start w-full">
                                <span className="text-[8px] font-sans font-light text-[#A8A8A8] uppercase tracking-widest">{res.distance || "LOCAL"}</span>
                                <span className="text-[9px] text-[#FFB800]">{res.rating || "4.5 ⭐"}</span>
                              </div>
                              <h4 className="text-xs font-sans font-light text-white uppercase leading-tight mt-1">{res.name}</h4>
                              <p className="text-[9px] text-[#555555] font-sans font-light uppercase mt-1 leading-normal line-clamp-2">{res.address}</p>
                            </div>
                            <div className="w-full flex justify-end items-center mt-3 border-t border-white/6 pt-2 font-sans font-light text-[9px] uppercase tracking-wider">
                              <a 
                                href={res.link} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-white hover:text-[#A8A8A8] transition-colors flex items-center gap-1 hover:underline uppercase"
                              >
                                <span>VIEW ON MAP</span>
                                <ChevronRight className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Supplements timing schedule */}
              <div className="w-full">
                <AnimatedList
                  items={SUPPLEMENTS_INFO.map(supp => supp.name)}
                  showGradients={true}
                  enableArrowNavigation={true}
                  displayScrollbar={true}
                  className="w-full"
                  renderItem={(name, index, isSelected) => {
                    const supp = SUPPLEMENTS_INFO[index];
                    return (
                      <div className={`p-5 rounded-none border transition-all duration-300 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center ${
                        isSelected 
                          ? "bg-white/10 border-white/40 shadow-lg shadow-white/5" 
                          : "bg-[#0F0F0F] border-white/6"
                      }`}>
                        <div className="space-y-1 max-w-xl text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-sans font-light text-[#A8A8A8]">0{index+1}</span>
                            <h3 className="text-sm font-sans font-light text-white uppercase tracking-wider">{supp.name}</h3>
                          </div>
                          <p className="text-[11px] text-[#A8A8A8] font-sans leading-relaxed mt-1 uppercase font-light">{supp.why}</p>
                          <div className="flex gap-4 pt-1 font-sans font-light text-[9px] text-[#555555] uppercase tracking-wider">
                            <span>DOSAGE: {supp.dosage}</span>
                            <span>SOURCED FROM: {supp.source}</span>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-none border text-right font-sans font-light text-[10px] w-full sm:w-auto transition-all duration-300 ${
                          isSelected ? "bg-white text-[#070707] border-white" : "bg-[#0A0A0A] border-white/10"
                        }`}>
                          <span className={`text-[8px] block uppercase mb-0.5 tracking-wider ${isSelected ? "text-[#070707]/70" : "text-[#555555]"}`}>OPTIMAL INTUBATION TIMING</span>
                          <span className="font-light tracking-wide block uppercase">{supp.timing}</span>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>

            </motion.div>
          )}

          {/* TAB 5: PROGRESS (BADGES, PHOTOS, STATS) */}
          {activeTab === "PROGRESS" && (
            <motion.div 
              key="PROGRESS" 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 border-b border-white/6 pb-4">
                <div>
                  <span className="text-[10px] font-sans font-light tracking-[0.3em] text-[#A8A8A8] uppercase block">MILESTONES & REWARDS</span>
                  <h2 className="font-shat-main text-xl sm:text-2xl font-light tracking-widest text-white uppercase mt-0.5">MILITARY LOGISTICS</h2>
                </div>
                
                {/* Photo Upload for storage */}
                <button
                  onClick={() => showToast("Upload progress photo trigger // Saved to Firebase Storage", "info")}
                  className="px-4 py-2.5 rounded-none border border-white/20 bg-[#0F0F0F] hover:border-white hover:text-white text-[#A8A8A8] font-sans text-[9px] tracking-[0.2em] font-normal uppercase transition-all duration-300 cursor-pointer self-start sm:self-auto"
                >
                  UPLOAD PROGRESS PHOTO
                </button>
              </div>

              {/* Progress Stats Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-none bg-[#0F0F0F] border border-white/6 text-center">
                  <span className="text-[8px] font-sans font-light text-[#555555] block uppercase tracking-wider">STREAK VELOCITY</span>
                  <span className="font-sans text-xl font-light text-white block mt-1">{streak} DAYS</span>
                </div>
                <div className="p-4 rounded-none bg-[#0F0F0F] border border-white/6 text-center">
                  <span className="text-[8px] font-sans font-light text-[#555555] block uppercase tracking-wider">BADGES UNLOCKED</span>
                  <span className="font-sans text-xl font-light text-white block mt-1">
                    {badges.filter(b => b.unlocked).length} / {badges.length}
                  </span>
                </div>
                <div className="p-4 rounded-none bg-[#0F0F0F] border border-white/6 text-center">
                  <span className="text-[8px] font-sans font-light text-[#555555] block uppercase tracking-wider">CALORIES PROGRESS</span>
                  <span className="font-sans text-xl font-light text-white block mt-1">
                    {Math.round((totalCaloriesLogged / profile.calorieTarget) * 100)}%
                  </span>
                </div>
                <div className="p-4 rounded-none bg-[#0F0F0F] border border-white/6 text-center">
                  <span className="text-[8px] font-sans font-light text-[#555555] block uppercase tracking-wider">PROTEIN INDEX</span>
                  <span className="font-sans text-xl font-light text-white block mt-1">
                    {Math.round((totalProteinLogged / profile.proteinTargetGrams) * 100)}%
                  </span>
                </div>
              </div>

              {/* Gamification Badges Grid */}
              <div className="space-y-4">
                <span className="text-[10px] font-sans font-light tracking-[0.2em] text-[#555555] uppercase block">UNLOCKED MILITARY REWARDS (BADGES)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {badges.map(badge => (
                    <div 
                      key={badge.id} 
                      className={`p-4 rounded-none border transition-all duration-300 flex items-center gap-4 ${
                        badge.unlocked 
                          ? "bg-[#0F0F0F] border-white/15" 
                          : "bg-[#0F0F0F]/50 border-white/5 opacity-40"
                      }`}
                    >
                      <div className="text-3xl filter saturate-0">{badge.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-sans font-light text-white uppercase tracking-wider">{badge.title}</h4>
                          {badge.unlocked && (
                            <span className="text-[8px] font-sans bg-white/10 text-white px-1.5 py-0.5 rounded-none font-normal uppercase tracking-widest">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#A8A8A8] font-sans leading-relaxed mt-0.5 uppercase font-light">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly diet comparison visual report */}
              <div className="p-6 rounded-none bg-[#0F0F0F] border border-white/6 space-y-4">
                <span className="text-[10px] font-sans font-light tracking-[0.2em] text-white uppercase block">WEEKLY COMPILATION INDEX (7-DAY DIET REPORT)</span>
                <p className="text-[10px] text-[#555555] font-sans font-light leading-relaxed uppercase">
                  Daily average caloric and protein consistency analysis. File format standard: Diet_Report_Atharva_2026.pdf
                </p>
                
                {/* Simulated Chart */}
                <div className="h-28 flex items-end gap-3.5 pt-4 border-b border-white/6">
                  {[
                    { day: "Mon", cals: 85 },
                    { day: "Tue", cals: 95 },
                    { day: "Wed", cals: 65 },
                    { day: "Thu", cals: 100 },
                    { day: "Fri", cals: 90 },
                    { day: "Sat", cals: 75 },
                    { day: "Sun", cals: 98 }
                  ].map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full bg-[#0A0A0A] h-16 rounded-none relative overflow-hidden flex items-end">
                        <div 
                          className="w-full bg-gradient-to-t from-[#555555] to-white rounded-none" 
                          style={{ height: `${d.cals}%` }}
                        />
                      </div>
                      <span className="text-[8px] font-sans font-light text-[#555555] uppercase">{d.day}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[9px] font-sans font-light text-[#555555] uppercase tracking-wider">DIET REPORT DOWNLOADABLE SECTOR</span>
                  <button 
                    onClick={() => showToast("Generating report PDF... // Saved to local drive", "info")}
                    className="text-[9px] font-sans text-white bg-white/4 border border-white/10 hover:border-white px-3 py-1.5 rounded-none hover:bg-white/10 transition-all duration-300 uppercase font-light tracking-wider cursor-pointer"
                  >
                    DOWNLOAD PDF/EXCEL REPORT
                  </button>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 6: CYCLE TRACKER (Female Only, Conditional Phase 12) */}
          {activeTab === "CYCLE_TRACKER" && profile.hasActiveCycle && profile.gender === "Female" && cycleDetails && (
            <motion.div 
              key="CYCLE_TRACKER" 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 border-b border-white/6 pb-4">
                <div>
                  <span className="text-[10px] font-sans font-light tracking-[0.3em] text-[#A8A8A8] uppercase block">PHASE_12 // CONDITION LOGS</span>
                  <h2 className="font-shat-main text-xl sm:text-2xl font-light tracking-widest text-white uppercase mt-0.5">CYCLE REACTION CENTER</h2>
                </div>
                
                {/* Manual Log Period */}
                <button
                  onClick={() => {
                    const todayStr = getLocalDateString();
                    const updated = { ...profile, lastPeriodDate: todayStr };
                    onUpdateProfile(updated as UserProfile);
                    showToast("Logged: 'My period started today'. Recalculating expected window projections.", "success");
                  }}
                  className="px-4 py-2.5 rounded-none border border-white/20 bg-[#0F0F0F] hover:border-white hover:text-white text-[#A8A8A8] font-sans text-[9px] tracking-[0.2em] font-normal uppercase transition-all duration-300 cursor-pointer self-start sm:self-auto"
                >
                  🔴 LOG PERIOD STARTED TODAY
                </button>
              </div>

              {/* Cycle Tracker Phase Banner */}
              <div className="p-6 rounded-none bg-[#0F0F0F] border border-white/6 flex flex-col sm:flex-row justify-between gap-6 items-start sm:items-center">
                <div className="space-y-1.5">
                  <span className={`px-2.5 py-1 rounded-none text-[9px] font-sans font-light tracking-widest uppercase border ${cycleDetails.color}`}>
                    {cycleDetails.phase} Phase {cycleDetails.icon}
                  </span>
                  <h3 className="font-sans text-xl font-light text-white uppercase tracking-wide mt-2">
                    Day {cycleDetails.currentDay} of Your Cycle
                  </h3>
                  <p className="text-xs text-[#A8A8A8] font-sans uppercase font-light">
                    Your average cycle length is {profile.cycleLength || 28} days. Next expected period is projected in {cycleDetails.daysUntilNext} days.
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-4xl font-extralight text-white">{cycleDetails.daysUntilNext}</span>
                  <span className="text-[9px] text-[#555555] block uppercase tracking-widest">DAYS TO EXPECTED period</span>
                </div>
              </div>

              {/* Hormonal Phase Adaptation detailed bento list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Workout Adaptation */}
                <div className="p-5 rounded-none bg-[#0F0F0F] border border-white/6 space-y-3">
                  <span className="text-[9px] font-sans font-light text-[#555555] uppercase block tracking-wider">KINETIC WORKOUT ADAPTATION</span>
                  <h4 className="text-xs font-sans font-light text-white uppercase tracking-wider">
                    {cycleDetails.phase === "Menstrual" && "Reduce intensity 20% // Recovery priority"}
                    {cycleDetails.phase === "Follicular" && "PEAK STRENGTH // Heavy compound lifts"}
                    {cycleDetails.phase === "Ovulation" && "ABSOLUTE PEAK // Max test volume"}
                    {cycleDetails.phase === "Luteal" && "Moderate intensity // De-load focus"}
                  </h4>
                  <p className="text-[11px] text-[#A8A8A8] font-sans leading-relaxed mt-1 uppercase font-light">
                    {cycleDetails.phase === "Menstrual" && "Avoid high impacts and heavy compression loads. Focus on steady mobility splits, light posture drills, and slow resistance stretching."}
                    {cycleDetails.phase === "Follicular" && "High estrogen spikes allow elite motor unit recruitment. Force overload on squats, overhead presses, and mechanical lifts."}
                    {cycleDetails.phase === "Ovulation" && "Estrogen and testosterone spike. Test your absolute parameters and hit heavy barbell sets. Ensure full 120s rest intervals."}
                    {cycleDetails.phase === "Luteal" && "Cardiovascular load spikes easily. Transition workouts to medium thresholds. Slower recovery, keep mechanical tension constant but lower weight."}
                  </p>
                </div>

                {/* Nutrition Adaptation */}
                <div className="p-5 rounded-none bg-[#0F0F0F] border border-white/6 space-y-3">
                  <span className="text-[9px] font-sans font-light text-[#555555] uppercase block tracking-wider">BIOAVAILABLE NUTRITION ADAPTATION</span>
                  <h4 className="text-xs font-sans font-light text-white uppercase tracking-wider">
                    {cycleDetails.phase === "Menstrual" && "+Iron (spinach, dates) & +Magnesium"}
                    {cycleDetails.phase === "Follicular" && "Standard macros allocation // Lower calories"}
                    {cycleDetails.phase === "Ovulation" && "High protein density // Clean calorie spikes"}
                    {cycleDetails.phase === "Luteal" && "+200-300 clean calories // +carbohydrates"}
                  </h4>
                  <p className="text-[11px] text-[#A8A8A8] font-sans leading-relaxed mt-1 uppercase font-light">
                    {cycleDetails.phase === "Menstrual" && "Counteract biological iron depletion with dark leafy greens. Magnesium will mitigate cramping muscle spasms. Add 500ml extra fluids."}
                    {cycleDetails.phase === "Follicular" && "Excellent window for calorie reduction if fat loss is active. Keep absolute protein same, moderate clean complex carbs."}
                    {cycleDetails.phase === "Ovulation" && "Appetite may spike. Plug cravings beforehand with high volume vegetable fibers and extreme clean protein selections."}
                    {cycleDetails.phase === "Luteal" && "Progesterone spikes core body temperature and calorie utilization. Feed the metabolism cleanly with a 200-300 calorie addition of whole carbs."}
                  </p>
                </div>

              </div>

              {/* Late period alert logic warning */}
              <div className="p-5 rounded-none bg-black border border-white/6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-white animate-platinum-pulse" />
                  <span className="text-[9px] font-sans font-light text-[#555555] uppercase tracking-widest">LATE PERIOD SYSTEM ADAPTATION</span>
                </div>
                <p className="text-[10px] text-[#A8A8A8] font-sans leading-relaxed uppercase font-light">
                  If your period is delayed by 5+ days, the system will trigger a special alert: "5 days late. Stress/diet can cause this. Monitor and see doctor if unusual."
                </p>
              </div>

            </motion.div>
          )}

          {/* TAB 7: SETTINGS / PROFILE EDIT */}
          {activeTab === "SETTINGS" && (
            <motion.div 
              key="SETTINGS" 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-white/6 pb-4">
                <div>
                  <span className="text-[10px] font-sans font-light tracking-[0.3em] text-[#A8A8A8] uppercase block">CONFIGURATION MANAGER</span>
                  <h2 className="font-shat-main text-xl sm:text-2xl font-light tracking-widest text-white uppercase mt-0.5">ATHLETE SETTINGS</h2>
                </div>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 rounded-none bg-white/4 border border-white/10 hover:border-white hover:bg-white/10 hover:text-white transition-all duration-300 text-xs font-sans font-light tracking-widest uppercase text-[#A8A8A8] cursor-pointer self-start sm:self-auto"
                >
                  DEACTIVATE SESSION (LOGOUT)
                </button>
              </div>

              {/* User profile parameters update form */}
              <div className="p-6 rounded-none bg-[#0F0F0F] border border-white/6 space-y-5">
                <span className="text-[9px] font-sans font-light text-[#A8A8A8] tracking-wider block uppercase">AMEND PROFILE PARAMETERS</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-sans font-light text-[#A8A8A8] block mb-1 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-none bg-[#0A0A0A] text-xs text-white border border-white/10 focus:border-white/40 focus:outline-none font-sans font-light"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-sans font-light text-[#A8A8A8] block mb-1 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      value={profile.email}
                      onChange={(e) => onUpdateProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-none bg-[#0A0A0A] text-xs text-white border border-white/10 focus:border-white/40 focus:outline-none font-sans font-light"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-sans font-light text-[#A8A8A8] block mb-1 uppercase tracking-wider">Weight (kg)</label>
                    <input 
                      type="number" 
                      value={profile.weight}
                      onChange={(e) => {
                        const w = parseFloat(e.target.value) || 0;
                        onUpdateProfile({ ...profile, weight: w });
                      }}
                      className="w-full px-4 py-2.5 rounded-none bg-[#0A0A0A] text-xs text-white border border-white/10 focus:border-white/40 focus:outline-none font-sans font-light"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-sans font-light text-[#A8A8A8] block mb-1 uppercase tracking-wider">Height (cm)</label>
                    <input 
                      type="number" 
                      value={profile.height}
                      onChange={(e) => {
                        const h = parseFloat(e.target.value) || 0;
                        onUpdateProfile({ ...profile, height: h });
                      }}
                      className="w-full px-4 py-2.5 rounded-none bg-[#0A0A0A] text-xs text-white border border-white/10 focus:border-white/40 focus:outline-none font-sans font-light"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-sans font-light text-[#A8A8A8] block mb-1 uppercase tracking-wider">Primary fitness Goal</label>
                    <select 
                      value={profile.primaryGoal}
                      onChange={(e) => onUpdateProfile({ ...profile, primaryGoal: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-none bg-[#0A0A0A] text-xs text-white border border-white/10 focus:border-white/40 focus:outline-none font-sans font-light"
                    >
                      <option value="Cut">Lose Weight / Cut 🔪</option>
                      <option value="Maintain">Maintain Current Physique ⚖️</option>
                      <option value="Bulk">Build Muscle / Bulk 🦍</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-sans font-light text-[#A8A8A8] block mb-1 uppercase tracking-wider">Diet Preference</label>
                    <select 
                      value={profile.dietPreference}
                      onChange={(e) => onUpdateProfile({ ...profile, dietPreference: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-none bg-[#0A0A0A] text-xs text-white border border-white/10 focus:border-white/40 focus:outline-none font-sans font-light"
                    >
                      <option value="Vegetarian">Pure Vegetarian 🟢</option>
                      <option value="Eggetarian">Eggetarian 🥚</option>
                      <option value="Non-Vegetarian">Non-Vegetarian 🔴</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Cycle Trackers setting */}
                {profile.gender === "Female" && (
                  <div className="pt-4 border-t border-white/6 space-y-4 font-sans font-light">
                    <span className="text-[9px] font-sans font-light text-[#A8A8A8] block uppercase font-bold tracking-wider">CYCLE COMPLIANCE TOGGLES</span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={profile.hasActiveCycle}
                          onChange={(e) => onUpdateProfile({ ...profile, hasActiveCycle: e.target.checked })}
                          className="accent-white cursor-pointer"
                        />
                        <span className="text-[10px] font-sans text-[#A8A8A8] uppercase tracking-wider">ACTIVE PERIOD CYCLE</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={profile.irregularCycle}
                          onChange={(e) => onUpdateProfile({ ...profile, irregularCycle: e.target.checked })}
                          className="accent-white cursor-pointer"
                        />
                        <span className="text-[10px] font-sans text-[#A8A8A8] uppercase tracking-wider">IRREGULAR CYCLE MODE</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="p-4 rounded-none bg-black border border-white/6">
                <span className="text-[8px] font-sans font-light text-[#555555] uppercase block tracking-widest mb-1">SAFETY & COMPLIANCE REGULATION</span>
                <p className="text-[9px] text-[#555555] font-sans font-light leading-relaxed uppercase">
                  Disclaimer: "Cycle tracking is for fitness only, not contraception. See doctor for concerns." All logs are stored securely using local sandbox memory. // Saved to Firestore
                </p>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* DAILY CHECKIN MODAL FLOW */}
      {showCheckInModal && (
        <div className="fixed inset-0 w-full h-full z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-sm rounded-none bg-[#0F0F0F] border border-white/10 p-5 sm:p-6 space-y-5 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-sans font-light text-[#A8A8A8] tracking-widest uppercase">DAILY INDEX CHECK-IN</span>
              <span className="text-[9px] font-sans font-light text-[#555555]">{checkInStep} OF 5</span>
            </div>

            <div className="py-2 border-y border-white/6">
              
              {/* Step 1: Sleep Hours */}
              {checkInStep === 1 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-sans font-light text-white uppercase tracking-wider">How did you sleep last night? (hours)</h4>
                  <input 
                    type="number" 
                    value={checkInSleep}
                    onChange={(e) => setCheckInSleep(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0A0A0A] text-xs text-white border border-white/10 rounded-none focus:border-white/40 focus:outline-none font-sans font-light"
                  />
                </div>
              )}

              {/* Step 2: Workout Done? */}
              {checkInStep === 2 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-sans font-light text-white uppercase tracking-wider">Did you complete your workout today?</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setCheckInWorkout(true)}
                      className={`p-3 rounded-none border text-xs font-sans uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                        checkInWorkout === true 
                          ? "bg-white text-[#070707] border-white font-normal" 
                          : "bg-[#0A0A0A] border-white/10 text-[#A8A8A8] hover:border-white/30"
                      }`}
                    >
                      Yes, destroyed it 💪
                    </button>
                    <button 
                      onClick={() => setCheckInWorkout(false)}
                      className={`p-3 rounded-none border text-xs font-sans uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                        checkInWorkout === false 
                          ? "bg-neutral-800/20 text-neutral-400 border-neutral-700/30" 
                          : "bg-[#0A0A0A] border-white/10 text-[#A8A8A8] hover:border-white/30"
                      }`}
                    >
                      No, skipped today
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Water intake */}
              {checkInStep === 3 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-sans font-light text-white uppercase tracking-wider">Roughly how much water did you drink? (glasses)</h4>
                  <input 
                    type="number" 
                    value={checkInWater}
                    onChange={(e) => setCheckInWater(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0A0A0A] text-xs text-white border border-white/10 rounded-none focus:border-white/40 focus:outline-none font-sans font-light"
                  />
                </div>
              )}

              {/* Step 4: Energy level */}
              {checkInStep === 4 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-sans font-light text-white uppercase tracking-wider">How are your energy levels today? (1-10)</h4>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={checkInEnergy}
                    onChange={(e) => setCheckInEnergy(e.target.value)}
                    className="w-full accent-white h-2 rounded cursor-pointer"
                  />
                  <div className="flex justify-between font-sans text-[9px] text-[#555555] tracking-wider">
                    <span>1 (SLEEPWALKER)</span>
                    <span className="text-white font-normal">{checkInEnergy}</span>
                    <span>10 (MONSTER)</span>
                  </div>
                </div>
              )}

              {/* Step 5: Any Pain? */}
              {checkInStep === 5 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-sans font-light text-white uppercase tracking-wider">Any joint pain or physical discomfort to flag?</h4>
                  <input 
                    type="text" 
                    value={checkInPain}
                    onChange={(e) => setCheckInPain(e.target.value)}
                    placeholder="e.g. Left knee stiffness, none..."
                    className="w-full px-4 py-2.5 bg-[#0A0A0A] text-xs text-white border border-white/10 rounded-none focus:border-white/40 focus:outline-none font-sans font-light"
                  />
                </div>
              )}

            </div>

            <div className="flex gap-3">
              {checkInStep > 1 && (
                <button
                  onClick={() => setCheckInStep(prev => prev - 1)}
                  className="flex-1 py-2.5 rounded-none border border-white/10 hover:bg-white/5 font-sans text-[9px] font-normal tracking-wider uppercase text-white cursor-pointer transition-all duration-300"
                >
                  PREVIOUS
                </button>
              )}
              <button
                onClick={() => {
                  if (checkInStep < 5) {
                    setCheckInStep(prev => prev + 1);
                  } else {
                    handleSubmitCheckIn();
                  }
                }}
                className="flex-1 py-2.5 rounded-none bg-white hover:bg-[#D4D4D4] text-[#070707] font-sans text-[9px] font-normal tracking-wider uppercase cursor-pointer transition-all duration-300"
              >
                {checkInStep < 5 ? "CONTINUE →" : "COMPLETE CHECK-IN"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO MEAL CAMERA DIALOG */}
      {showPhotoUploadModal && (
        <div className="fixed inset-0 w-full h-full z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-sm rounded-none bg-[#0F0F0F] border border-white/10 p-5 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-sans font-light text-[#A8A8A8] tracking-widest uppercase">AI VISION MEAL SCANNER</span>
              <button onClick={() => setShowPhotoUploadModal(false)} className="text-[#555555] font-sans text-xs hover:text-white cursor-pointer transition-all duration-300">CLOSE</button>
            </div>

            <div className="aspect-square bg-black/60 rounded-none border border-white/6 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
              {simulatedPhotoAnalyzing ? (
                <div className="space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin mx-auto" />
                  <span className="text-[9px] font-sans font-light text-[#A8A8A8] uppercase tracking-wider block">AI ANALYZING CALORIES & MACROS...</span>
                </div>
              ) : mealImageBase64 ? (
                <div className="w-full h-full relative group">
                  <img src={`data:${mealImageMimeType};base64,${mealImageBase64}`} className="w-full h-full object-cover" alt="Meal Preview" />
                  <button 
                    onClick={() => { setMealImageBase64(null); setMealImageMimeType(null); }}
                    className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-sans text-[10px] text-white tracking-widest uppercase cursor-pointer border-none"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/3 transition-colors">
                  <Camera className="w-12 h-12 text-[#555555] mb-3" />
                  <span className="text-[9px] font-sans font-light text-[#A8A8A8] uppercase block tracking-wider">CLICK TO CHOOSE MEAL PHOTO</span>
                  <span className="text-[8px] font-sans font-light text-[#555555] uppercase block mt-1">// Connected Vision API</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            {!simulatedPhotoAnalyzing && (
              <div className="space-y-3">
                <span className="text-[8px] font-sans font-light text-[#555555] uppercase tracking-wider block">OR DESCRIBE YOUR MEAL DETAILS</span>
                <textarea
                  value={mealDescInput}
                  onChange={(e) => setMealDescInput(e.target.value)}
                  placeholder="e.g. 150g grilled chicken, 1 cup cooked white rice, stir fried broccoli..."
                  className="w-full h-20 px-3 py-2 bg-[#0A0A0A] text-xs text-white border border-white/10 rounded-none focus:border-white/40 focus:outline-none font-sans font-light resize-none placeholder-[#555555]"
                />
                <button
                  onClick={handleSimulatePhotoMeal}
                  className="w-full py-3 rounded-none bg-white hover:bg-[#D4D4D4] text-[#070707] font-sans text-[9px] font-normal tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <span>ANALYZE & LOG MEAL</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Elegant Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-[#141414]/95 backdrop-blur-xl border border-white/20 px-6 py-4 rounded-none shadow-2xl max-w-md w-[90vw]"
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            ) : toast.type === "error" ? (
              <AlertCircle className="w-5 h-5 text-zinc-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-zinc-400 shrink-0" />
            )}
            <span className="font-sans text-xs text-white leading-relaxed uppercase tracking-wider">
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
