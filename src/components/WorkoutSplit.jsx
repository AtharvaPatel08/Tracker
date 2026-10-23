import React, { useState, useEffect, useCallback, memo } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Trash2, Plus, Search, CheckCircle, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import WorkoutSplitVisualizer from "./WorkoutSplitVisualizer";

const ExerciseItem = memo(({
  exercise,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  onUpdate,
  onDelete
}) => {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(index)}
      className="p-4 rounded-[10px] bg-[#0D1B2A]/70 border border-[#B76E79]/15 hover:border-[#B76E79]/30 transition-all duration-300 flex flex-col gap-3 relative group"
    >
      {/* Drag handle & Delete */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="cursor-grab text-[#F2E6E9]/35 group-hover:text-[#B76E79] transition-colors">
            <GripVertical className="w-4 h-4" />
          </div>
          <span className="font-shat-heading text-base font-light text-[#F2E6E9] uppercase tracking-wide">
            {exercise.name}
          </span>
        </div>
        <button
          onClick={() => onDelete(exercise.id)}
          className="text-[#B76E79]/50 hover:text-[#B76E79] transition-all p-1 cursor-pointer bg-transparent border-none"
          title="Delete Exercise"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Sets, Reps, Weight */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#F2E6E9]/55 font-sans">Sets:</span>
          <input
            type="number"
            min="1"
            max="15"
            value={exercise.sets}
            onChange={(e) => onUpdate(exercise.id, "sets", parseInt(e.target.value) || 0)}
            className="w-[60px] py-1 bg-[#1B2A3E]/80 border border-[#B76E79]/30 rounded-lg text-[#F2E6E9] text-center outline-none focus:border-[#B76E79]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#F2E6E9]/55 font-sans">Reps:</span>
          <input
            type="number"
            min="1"
            max="100"
            value={exercise.reps}
            onChange={(e) => onUpdate(exercise.id, "reps", parseInt(e.target.value) || 0)}
            className="w-[60px] py-1 bg-[#1B2A3E]/80 border border-[#B76E79]/30 rounded-lg text-[#F2E6E9] text-center outline-none focus:border-[#B76E79]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#F2E6E9]/55 font-sans">Weight:</span>
          <input
            type="number"
            min="0"
            max="500"
            step="0.5"
            value={exercise.weight}
            onChange={(e) => onUpdate(exercise.id, "weight", parseFloat(e.target.value) || 0)}
            className="w-[60px] py-1 bg-[#1B2A3E]/80 border border-[#B76E79]/30 rounded-lg text-[#F2E6E9] text-center outline-none focus:border-[#B76E79]"
          />
          <span className="text-[#F2E6E9]/45 font-sans">kg</span>
        </div>
      </div>

      {/* Notes input */}
      <div className="w-full">
        <input
          type="text"
          value={exercise.notes || ""}
          onChange={(e) => onUpdate(exercise.id, "notes", e.target.value)}
          placeholder="Add special setup, rest times or progression notes..."
          className="w-full px-3 py-1.5 bg-[#1B2A3E]/40 border border-[#B76E79]/15 rounded-md text-[#F2E6E9]/85 text-xs outline-none focus:border-[#B76E79]/45 placeholder-[#F2E6E9]/25 font-sans"
        />
      </div>
    </div>
  );
});
ExerciseItem.displayName = "ExerciseItem";

const EXERCISE_DB = {
  CHEST: [
    "Bench Press", "Incline Bench Press", "Decline Bench Press",
    "Dumbbell Flyes", "Cable Crossover", "Push-Up", "Chest Dip",
    "Pec Deck Machine", "Landmine Press"
  ],
  BACK: [
    "Deadlift", "Pull-Up", "Chin-Up", "Bent Over Row",
    "Seated Cable Row", "Lat Pulldown", "Single Arm Dumbbell Row",
    "T-Bar Row", "Face Pull", "Shrugs"
  ],
  SHOULDERS: [
    "Overhead Press", "Arnold Press", "Lateral Raise", "Front Raise",
    "Rear Delt Fly", "Upright Row", "Cable Lateral Raise", "Machine Press"
  ],
  BICEPS: [
    "Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl",
    "Concentration Curl", "Cable Curl", "Incline Dumbbell Curl"
  ],
  TRICEPS: [
    "Skull Crusher", "Tricep Pushdown", "Overhead Tricep Extension",
    "Close Grip Bench Press", "Dips", "Diamond Push-Up", "Kickback"
  ],
  LEGS: [
    "Squat", "Leg Press", "Romanian Deadlift", "Lunges",
    "Leg Extension", "Leg Curl", "Calf Raise", "Bulgarian Split Squat",
    "Hack Squat", "Goblet Squat", "Hip Thrust"
  ],
  CORE: [
    "Plank", "Crunches", "Leg Raise", "Russian Twist",
    "Cable Crunch", "Ab Wheel Rollout", "Hanging Knee Raise"
  ],
  CARDIO: [
    "Treadmill", "Cycling", "Jump Rope", "Stair Climber",
    "Rowing Machine", "HIIT"
  ]
};

const DEFAULT_SPLITS = {
  PPL: [
    { id: "day1", name: "Day 1 — Push", exercises: [] },
    { id: "day2", name: "Day 2 — Pull", exercises: [] },
    { id: "day3", name: "Day 3 — Legs", exercises: [] },
    { id: "day4", name: "Day 4 — Push", exercises: [] },
    { id: "day5", name: "Day 5 — Pull", exercises: [] },
    { id: "day6", name: "Day 6 — Legs", exercises: [] },
    { id: "day7", name: "Day 7 — Rest", exercises: [] }
  ],
  "Upper / Lower": [
    { id: "day1", name: "Day 1 — Upper", exercises: [] },
    { id: "day2", name: "Day 2 — Lower", exercises: [] },
    { id: "day3", name: "Day 3 — Rest", exercises: [] },
    { id: "day4", name: "Day 4 — Upper", exercises: [] },
    { id: "day5", name: "Day 5 — Lower", exercises: [] },
    { id: "day6", name: "Day 6 — Rest", exercises: [] },
    { id: "day7", name: "Day 7 — Rest", exercises: [] }
  ],
  "Bro Split (5 day)": [
    { id: "day1", name: "Day 1 — Chest", exercises: [] },
    { id: "day2", name: "Day 2 — Back", exercises: [] },
    { id: "day3", name: "Day 3 — Shoulders", exercises: [] },
    { id: "day4", name: "Day 4 — Arms", exercises: [] },
    { id: "day5", name: "Day 5 — Legs", exercises: [] },
    { id: "day6", name: "Day 6 — Rest", exercises: [] },
    { id: "day7", name: "Day 7 — Rest", exercises: [] }
  ],
  "Full Body": [
    { id: "day1", name: "Day 1 — Full Body", exercises: [] },
    { id: "day2", name: "Day 2 — Rest", exercises: [] },
    { id: "day3", name: "Day 3 — Full Body", exercises: [] },
    { id: "day4", name: "Day 4 — Rest", exercises: [] },
    { id: "day5", name: "Day 5 — Full Body", exercises: [] },
    { id: "day6", name: "Day 6 — Rest", exercises: [] },
    { id: "day7", name: "Day 7 — Rest", exercises: [] }
  ],
  Custom: [
    { id: "day1", name: "Day 1 — Custom Workout", exercises: [] }
  ]
};

export default function WorkoutSplit() {
  const [splitType, setSplitType] = useState("PPL");
  const [days, setDays] = useState(DEFAULT_SPLITS["PPL"]);
  const [activeTabId, setActiveTabId] = useState("day1");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Exercise picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState("search"); // 'search' | 'custom'
  const [searchQuery, setSearchQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("ALL");
  const [customExerciseName, setCustomExerciseName] = useState("");

  // Toast Helper
  const showSuccessToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load split on mount
  useEffect(() => {
    const loadSplit = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        try {
          const splitDoc = await getDoc(doc(db, "workoutSplits", user.uid));
          if (splitDoc.exists()) {
            const data = splitDoc.data();
            if (data.splitType) {
              setSplitType(data.splitType);
            }
            if (data.days && Array.isArray(data.days)) {
              setDays(data.days);
              if (data.days.length > 0) {
                setActiveTabId(data.days[0].id);
              }
            }
          } else {
            // Default load PPL
            setDays(DEFAULT_SPLITS["PPL"]);
            setActiveTabId("day1");
          }
        } catch (error) {
          console.warn("Error loading workout split:", error);
        }
      }
      setLoading(false);
    };

    // Firebase Auth might take time to load
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadSplit();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle split type change
  const handleSplitTypeChange = (newType) => {
    setSplitType(newType);
    const newDays = DEFAULT_SPLITS[newType] || DEFAULT_SPLITS["Custom"];
    setDays(JSON.parse(JSON.stringify(newDays))); // deep clone
    if (newDays.length > 0) {
      setActiveTabId(newDays[0].id);
    }
  };

  // Change training day name
  const handleDayNameChange = (dayId, newName) => {
    setDays(prevDays =>
      prevDays.map(day => (day.id === dayId ? { ...day, name: newName } : day))
    );
  };

  // Add custom day (only for Custom split)
  const handleAddCustomDay = () => {
    const nextDayNum = days.length + 1;
    const newDay = {
      id: `day_${Date.now()}`,
      name: `Day ${nextDayNum} — Custom`,
      exercises: []
    };
    setDays([...days, newDay]);
    setActiveTabId(newDay.id);
  };

  // Delete custom day
  const handleDeleteCustomDay = (dayId) => {
    if (days.length <= 1) return;
    const remainingDays = days.filter(day => day.id !== dayId);
    setDays(remainingDays);
    // Adjust active tab if deleted day was active
    if (activeTabId === dayId) {
      setActiveTabId(remainingDays[0].id);
    }
  };

  // Add Exercise to active day
  const handleAddExercise = (exerciseName) => {
    if (!exerciseName.trim()) return;

    const newExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: exerciseName,
      sets: 3,
      reps: 10,
      weight: 0,
      notes: ""
    };

    setDays(prevDays =>
      prevDays.map(day => {
        if (day.id === activeTabId) {
          return {
            ...day,
            exercises: [...day.exercises, newExercise]
          };
        }
        return day;
      })
    );

    // Reset picker states
    setCustomExerciseName("");
    setSearchQuery("");
    setShowPicker(false);
  };

  // Update specific exercise fields
  const handleUpdateExercise = useCallback((exerciseId, field, value) => {
    setDays(prevDays =>
      prevDays.map(day => {
        if (day.id === activeTabId) {
          return {
            ...day,
            exercises: day.exercises.map(ex =>
              ex.id === exerciseId ? { ...ex, [field]: value } : ex
            )
          };
        }
        return day;
      })
    );
  }, [activeTabId]);

  // Delete specific exercise
  const handleDeleteExercise = useCallback((exerciseId) => {
    setDays(prevDays =>
      prevDays.map(day => {
        if (day.id === activeTabId) {
          return {
            ...day,
            exercises: day.exercises.filter(ex => ex.id !== exerciseId)
          };
        }
        return day;
      })
    );
  }, [activeTabId]);

  // HTML5 Drag and Drop Handlers
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = useCallback((index) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((index) => {
    if (draggedIndex === null || draggedIndex === index) return;

    setDays(prevDays =>
      prevDays.map(day => {
        if (day.id === activeTabId) {
          const updatedExercises = [...day.exercises];
          const [draggedItem] = updatedExercises.splice(draggedIndex, 1);
          updatedExercises.splice(index, 0, draggedItem);
          return {
            ...day,
            exercises: updatedExercises
          };
        }
        return day;
      })
    );
    setDraggedIndex(null);
  }, [draggedIndex, activeTabId]);

  // Save full split to Firestore
  const handleSaveSplit = async () => {
    const user = auth.currentUser;
    if (!user) {
      showSuccessToast("Split saved for this session! (Sign in to sync across devices)");
      return;
    }

    try {
      await setDoc(doc(db, "workoutSplits", user.uid), {
        splitType,
        updatedAt: new Date(),
        days: days
      });
      showSuccessToast("Split saved successfully!");
    } catch (error) {
      console.warn("Error saving split:", error);
      showSuccessToast("Failed to save split. Try again.");
    }
  };

  // Active day details
  const activeDay = days.find(day => day.id === activeTabId) || days[0];

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-12 bg-[#1B2A3E] rounded-[14px] border border-[#B76E79]/25 flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#B76E79] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-sans tracking-widest uppercase text-[#F2E6E9]/65">Assembling workout matrix...</p>
      </div>
    );
  }

  // Filter exercises in search
  const filteredCategories = Object.entries(EXERCISE_DB).reduce((acc, [category, list]) => {
    if (muscleFilter !== "ALL" && category !== muscleFilter) return acc;
    const filteredList = list.filter(ex =>
      ex.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filteredList.length > 0) {
      acc[category] = filteredList;
    }
    return acc;
  }, {});

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 bg-[#1B2A3E] rounded-[14px] border border-[#B76E79]/25 relative flex flex-col gap-6 sm:gap-8 shadow-2xl">
      {/* Step 1: Split Type Pills */}
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-sans font-semibold tracking-widest text-[#B76E79] uppercase">
          Step 1 &mdash; Choose Split System
        </span>
        <div className="flex flex-wrap gap-2.5">
          {Object.keys(DEFAULT_SPLITS).map(type => (
            <button
              key={type}
              onClick={() => handleSplitTypeChange(type)}
              className={`px-4 py-2 text-[13px] font-sans font-medium uppercase tracking-wider transition-all duration-300 rounded-[20px] cursor-pointer ${
                splitType === type
                  ? "bg-[#B76E79] text-[#0D1B2A] border-none"
                  : "bg-[#1B2A3E] border border-[#B76E79] text-[#F2E6E9] hover:bg-[#B76E79]/10"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Training Day Names (Tab bar horizontal scroll) */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-sans font-semibold tracking-widest text-[#B76E79] uppercase">
            Step 2 &mdash; Manage Training Days
          </span>
          {splitType === "Custom" && (
            <button
              onClick={handleAddCustomDay}
              className="text-[11px] font-sans text-[#B76E79] uppercase hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Day
            </button>
          )}
        </div>

        {/* Tab row */}
        <div className="flex overflow-x-auto pb-2 border-b border-[#B76E79]/15 scrollbar-thin scrollbar-thumb-[#B76E79]/30">
          <div className="flex gap-6 min-w-max px-1">
            {days.map(day => (
              <button
                key={day.id}
                onClick={() => setActiveTabId(day.id)}
                className={`pb-2.5 text-sm font-medium tracking-wide transition-all duration-300 relative cursor-pointer ${
                  activeTabId === day.id
                    ? "text-[#F2E6E9]"
                    : "text-[#F2E6E9]/35 hover:text-[#F2E6E9]/60"
                }`}
              >
                {day.name || "Unnamed Day"}
                {activeTabId === day.id && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B76E79]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Rename Input */}
        {activeDay && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
            <span className="text-[11px] font-sans uppercase text-[#F2E6E9]/45 whitespace-nowrap">Rename Active Day:</span>
            <input
              type="text"
              value={activeDay.name}
              onChange={(e) => handleDayNameChange(activeDay.id, e.target.value)}
              className="flex-1 bg-transparent border-b border-[#B76E79] focus:border-[#B76E79] text-[#F2E6E9] outline-none py-1 text-sm font-sans tracking-wide"
              placeholder="e.g. Chest & Triceps"
            />
            {splitType === "Custom" && days.length > 1 && (
              <button
                onClick={() => handleDeleteCustomDay(activeDay.id)}
                className="px-3 py-1 bg-red-950/40 border border-red-800/40 text-red-400 hover:bg-red-900/60 rounded text-[11px] uppercase transition-colors font-sans cursor-pointer"
              >
                Delete Day
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Exercise Entry List */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-[#B76E79]/10 pb-2">
          <span className="text-[11px] font-sans font-semibold tracking-widest text-[#B76E79] uppercase">
            Step 3 &mdash; Add & Reorder Exercises
          </span>
          <span className="text-[10px] font-sans text-[#F2E6E9]/45 italic">
            * Drag elements to custom order
          </span>
        </div>

        {/* Exercises rows */}
        <div className="overflow-hidden min-h-[100px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTabId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="flex flex-col gap-3"
            >
              {activeDay && activeDay.exercises && activeDay.exercises.length > 0 ? (
                activeDay.exercises.map((exercise, index) => (
                  <ExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    index={index}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onUpdate={handleUpdateExercise}
                    onDelete={handleDeleteExercise}
                  />
                ))
              ) : (
                <div className="py-8 text-center bg-[#0D1B2A]/30 border border-[#B76E79]/10 rounded-[10px] flex flex-col items-center justify-center gap-1.5">
                  <span className="text-xs font-sans text-[#F2E6E9]/45 uppercase tracking-wider">No exercises logged for this day</span>
                  <span className="text-[10px] font-sans text-[#B76E79]/55 uppercase">Unleash the split builder below</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Add exercise trigger button */}
        <div className="flex justify-center mt-3">
          {!showPicker ? (
            <button
              onClick={() => setShowPicker(true)}
              className="px-6 py-3 border border-dashed border-[#B76E79]/45 hover:border-[#B76E79] text-[#B76E79] hover:text-[#F2E6E9] font-sans text-xs uppercase tracking-widest transition-all duration-300 rounded-[10px] flex items-center gap-2 cursor-pointer bg-transparent"
            >
              <Plus className="w-4 h-4" /> Add Exercise
            </button>
          ) : (
            <div className="w-full p-5 bg-[#0D1B2A] border border-[#B76E79]/30 rounded-[14px] flex flex-col gap-4 animate-fadeIn">
              {/* Picker sub-tabs */}
              <div className="flex gap-3 justify-center border-b border-[#B76E79]/15 pb-3">
                <button
                  onClick={() => setPickerTab("search")}
                  className={`px-4 py-1.5 text-xs uppercase tracking-wider font-sans rounded-full transition-all cursor-pointer ${
                    pickerTab === "search"
                      ? "bg-[#B76E79] text-[#0D1B2A]"
                      : "text-[#F2E6E9]/50 hover:text-[#F2E6E9]"
                  }`}
                >
                  Search Exercise
                </button>
                <button
                  onClick={() => setPickerTab("custom")}
                  className={`px-4 py-1.5 text-xs uppercase tracking-wider font-sans rounded-full transition-all cursor-pointer ${
                    pickerTab === "custom"
                      ? "bg-[#B76E79] text-[#0D1B2A]"
                      : "text-[#F2E6E9]/50 hover:text-[#F2E6E9]"
                  }`}
                >
                  Custom Exercise
                </button>
              </div>

              {pickerTab === "search" ? (
                <div className="flex flex-col gap-4">
                  {/* Category filters */}
                  <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {["ALL", ...Object.keys(EXERCISE_DB)].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setMuscleFilter(cat)}
                        className={`px-2.5 py-1 text-[10px] font-sans uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                          muscleFilter === cat
                            ? "bg-[#B76E79] text-[#0D1B2A]"
                            : "bg-[#1B2A3E] border border-[#B76E79]/20 text-[#F2E6E9]/65 hover:bg-[#B76E79]/10"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#F2E6E9]/35" />
                    <input
                      type="text"
                      placeholder="Type to filter exercises..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-[#1B2A3E] border border-[#B76E79]/20 rounded-md text-sm outline-none text-[#F2E6E9] focus:border-[#B76E79]/50 placeholder-[#F2E6E9]/25 font-sans"
                    />
                  </div>

                  {/* Results list grouped */}
                  <div className="max-h-[200px] overflow-y-auto flex flex-col gap-4 pr-1">
                    {Object.entries(filteredCategories).length > 0 ? (
                      Object.entries(filteredCategories).map(([category, list]) => (
                        <div key={category} className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-sans uppercase text-[#B76E79]/75 tracking-widest font-semibold border-b border-[#B76E79]/10 pb-0.5">
                            {category}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {list.map(ex => (
                              <button
                                key={ex}
                                onClick={() => handleAddExercise(ex)}
                                className="px-2.5 py-1 text-xs font-sans rounded-full bg-[#1B2A3E] border border-[#B76E79]/25 hover:border-[#B76E79] text-[#F2E6E9]/85 hover:text-[#F2E6E9] transition-all cursor-pointer"
                              >
                                {ex}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-center text-xs font-sans text-[#F2E6E9]/35 uppercase py-4">No exercises matched your search query</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  <span className="text-xs uppercase text-[#F2E6E9]/55 font-sans tracking-wide">Enter custom exercise name:</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Incline Machine Chest Press"
                      value={customExerciseName}
                      onChange={(e) => setCustomExerciseName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#1B2A3E] border border-[#B76E79]/20 rounded-md text-sm outline-none text-[#F2E6E9] focus:border-[#B76E79]/50 placeholder-[#F2E6E9]/25 font-sans"
                    />
                    <button
                      onClick={() => handleAddExercise(customExerciseName)}
                      className="px-4 py-2 bg-[#B76E79] text-[#0D1B2A] rounded-md font-sans text-xs uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowPicker(false)}
                className="text-[11px] font-sans text-[#F2E6E9]/45 hover:text-[#F2E6E9] text-center uppercase tracking-widest mt-2 cursor-pointer bg-transparent border-none"
              >
                Cancel / Hide
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Split Summary View */}
      <div className="mt-4 p-5 rounded-[10px] bg-[#0D1B2A]/50 border border-[#B76E79]/15 flex flex-col gap-5">
        <h3 className="text-base text-[#F2E6E9] tracking-wide uppercase font-shat-heading text-[18px]">
          Your Full Split Summary
        </h3>
        <div className="flex flex-col gap-2 border-t border-[#B76E79]/10 pt-2.5">
          {days.map(day => {
            const exerciseCount = day.exercises ? day.exercises.length : 0;
            const totalSets = day.exercises ? day.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0) : 0;
            return (
              <div key={day.id} className="flex justify-between items-center text-[13px] text-[#F2E6E9]/55 font-sans">
                <span className="font-medium text-[#F2E6E9]/75 uppercase tracking-wide">{day.name}</span>
                <span className="text-[#F2E6E9]/45">
                  {exerciseCount} Exercise{exerciseCount !== 1 ? "s" : ""} &bull; {totalSets} Total Set{totalSets !== 1 ? "s" : ""}
                </span>
              </div>
            );
          })}
        </div>

        {/* D3-based Muscle Group Distribution Visualizer */}
        <WorkoutSplitVisualizer days={days} />
      </div>

      {/* Save Button */}
      <div className="flex justify-center border-t border-[#B76E79]/10 pt-6">
        <button
          onClick={handleSaveSplit}
          className="px-8 py-3.5 bg-[#B76E79] text-[#0D1B2A] font-sans text-sm font-semibold uppercase tracking-widest transition-all duration-300 rounded-[10px] shadow-lg shadow-[#B76E79]/10 hover:shadow-[#B76E79]/20 hover:scale-[1.02] cursor-pointer"
        >
          Save Split System
        </button>
      </div>

      {/* Embedded Toast message */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-[#B76E79] text-[#0D1B2A] rounded-full text-xs font-sans font-semibold tracking-wider uppercase shadow-xl flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
