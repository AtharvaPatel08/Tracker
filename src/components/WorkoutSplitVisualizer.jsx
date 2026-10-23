import React, { useMemo, useState } from "react";
import * as d3 from "d3";

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

const getMuscleGroup = (exerciseName) => {
  if (!exerciseName) return "OTHER";
  const nameUpper = exerciseName.toUpperCase();
  for (const [category, list] of Object.entries(EXERCISE_DB)) {
    if (list.some(ex => ex.toUpperCase() === nameUpper)) {
      return category;
    }
  }
  // Fallback keyword matching for custom exercises
  if (nameUpper.includes("CHEST") || nameUpper.includes("BENCH") || nameUpper.includes("FLY") || (nameUpper.includes("PRESS") && !nameUpper.includes("LEG") && !nameUpper.includes("SHOULDER") && !nameUpper.includes("OVERHEAD"))) return "CHEST";
  if (nameUpper.includes("BACK") || nameUpper.includes("LAT") || nameUpper.includes("PULL") || nameUpper.includes("ROW") || nameUpper.includes("DEADLIFT")) return "BACK";
  if (nameUpper.includes("SHOULDER") || nameUpper.includes("DELT") || nameUpper.includes("LATERAL") || nameUpper.includes("OVERHEAD") || nameUpper.includes("MILITARY")) return "SHOULDERS";
  if (nameUpper.includes("BICEP") || nameUpper.includes("CURL")) return "BICEPS";
  if (nameUpper.includes("TRICEP") || nameUpper.includes("SKULL") || nameUpper.includes("DIP")) return "TRICEPS";
  if (nameUpper.includes("SQUAT") || nameUpper.includes("LEG") || nameUpper.includes("CALF") || nameUpper.includes("LUNGE") || nameUpper.includes("HAMSTRING") || nameUpper.includes("GLUTE") || nameUpper.includes("THRUST")) return "LEGS";
  if (nameUpper.includes("CORE") || nameUpper.includes("ABS") || nameUpper.includes("CRUNCH") || nameUpper.includes("PLANK") || nameUpper.includes("SITUP") || nameUpper.includes("TWIST")) return "CORE";
  if (nameUpper.includes("RUN") || nameUpper.includes("CARDIO") || nameUpper.includes("TREADMILL") || nameUpper.includes("CYCLING") || nameUpper.includes("HIIT") || nameUpper.includes("ROWE") || nameUpper.includes("BIKE")) return "CARDIO";
  return "OTHER";
};

// Luxurious, coordinated brand colors matching #B76E79 (Rose Gold) and luxurious dark blue
const COLORS = {
  CHEST: "#B76E79",       // Rose Gold Accent
  BACK: "#E6C5C8",        // Light Blush
  SHOULDERS: "#D4A3A9",   // Medium Blush
  BICEPS: "#9E5661",      // Deep Rose
  TRICEPS: "#803D47",      // Dark Crimson Rose
  LEGS: "#5C2A31",        // Deep Burgundy
  CORE: "#F2E6E9",        // Cream Blush Soft text color
  CARDIO: "#D68E98",      // Warm Rose
  OTHER: "#42181E"        // Darkest shadow Rose
};

export default function WorkoutSplitVisualizer({ days }) {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // Compute stats from splits
  const chartData = useMemo(() => {
    const muscleCounts = {};
    let totalSets = 0;

    days.forEach(day => {
      if (day.exercises && Array.isArray(day.exercises)) {
        day.exercises.forEach(ex => {
          const muscle = getMuscleGroup(ex.name);
          const sets = Math.max(1, parseInt(ex.sets) || 0); // fallback to 1 if 0
          muscleCounts[muscle] = (muscleCounts[muscle] || 0) + sets;
          totalSets += sets;
        });
      }
    });

    const list = Object.entries(muscleCounts).map(([muscle, value]) => ({
      name: muscle,
      value,
      color: COLORS[muscle] || COLORS.OTHER,
      percentage: totalSets > 0 ? Math.round((value / totalSets) * 100) : 0
    })).sort((a, b) => b.value - a.value);

    return { list, totalSets };
  }, [days]);

  // D3 Pie Generator settings
  const width = 180;
  const height = 180;
  const radius = width / 2;
  const innerRadius = radius - 18; // Donut thickness

  const pieSegments = useMemo(() => {
    if (chartData.list.length === 0) return [];
    const pieGenerator = d3.pie().value(d => d.value).sort(null);
    return pieGenerator(chartData.list);
  }, [chartData]);

  const arcGenerator = useMemo(() => {
    return d3.arc().innerRadius(innerRadius).outerRadius(radius).cornerRadius(4).padAngle(0.04);
  }, [innerRadius, radius]);

  const arcHoverGenerator = useMemo(() => {
    return d3.arc().innerRadius(innerRadius - 3).outerRadius(radius + 3).cornerRadius(6).padAngle(0.04);
  }, [innerRadius, radius]);

  if (chartData.totalSets === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-[#B76E79]/15 rounded-[10px] bg-[#0D1B2A]/30 text-center gap-2">
        <div className="w-16 h-16 rounded-full border border-dashed border-[#B76E79]/30 flex items-center justify-center text-[#B76E79]/60 text-lg">
          📊
        </div>
        <div>
          <h4 className="text-xs font-sans font-semibold tracking-widest text-[#B76E79] uppercase">Weekly Distribution Chart</h4>
          <p className="text-[11px] text-[#F2E6E9]/45 mt-1 max-w-xs font-sans leading-relaxed">
            Add exercises to view a beautiful dynamic breakdown of your target muscle groups.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 p-4 sm:p-6 border border-[#B76E79]/20 rounded-[14px] bg-[#0D1B2A]/40 shadow-inner">
      {/* SVG Chart */}
      <div className="relative w-[180px] h-[180px] flex-shrink-0">
        <svg width={width} height={height} className="overflow-visible">
          <g transform={`translate(${radius}, ${radius})`}>
            {pieSegments.map((slice, i) => {
              const isHovered = hoveredSegment === slice.data.name;
              return (
                <path
                  key={i}
                  d={isHovered ? arcHoverGenerator(slice) : arcGenerator(slice)}
                  fill={slice.data.color}
                  className="transition-all duration-300 cursor-pointer filter hover:drop-shadow-[0_0_8px_rgba(183,110,121,0.5)]"
                  onMouseEnter={() => setHoveredSegment(slice.data.name)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              );
            })}
          </g>
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-light text-[#F2E6E9] tracking-tighter font-serif">
            {chartData.totalSets}
          </span>
          <span className="text-[9px] font-sans tracking-widest uppercase text-[#B76E79]">
            Total Sets
          </span>
        </div>
      </div>

      {/* Legend & Details */}
      <div className="flex-1 flex flex-col gap-3.5 w-full">
        <div className="flex justify-between items-center border-b border-[#B76E79]/15 pb-1.5">
          <span className="text-xs font-sans font-bold uppercase tracking-widest text-[#B76E79]">Muscle Group Volume</span>
          <span className="text-[10px] font-sans text-[#F2E6E9]/45 uppercase">Sets Contribution</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
          {chartData.list.map((item) => {
            const isHovered = hoveredSegment === item.name;
            return (
              <div
                key={item.name}
                className={`flex items-center justify-between p-1.5 rounded-lg transition-all duration-300 ${
                  isHovered ? "bg-[#B76E79]/10 scale-[1.02]" : "bg-transparent"
                }`}
                onMouseEnter={() => setHoveredSegment(item.name)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-sans uppercase font-medium text-[#F2E6E9]/80 tracking-wider">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-sans font-semibold text-[#F2E6E9]">
                    {item.value} <span className="text-[10px] font-normal text-[#F2E6E9]/45">sets</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#B76E79]/70 bg-[#B76E79]/5 px-1.5 py-0.5 rounded">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
