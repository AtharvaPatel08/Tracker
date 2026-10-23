import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Sparkles, MessageCircle, Heart, Flame, ShieldAlert, CheckCircle2 } from "lucide-react";
import { UserProfile } from "../types";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import gsap from "gsap";

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  fadeDuration: number;
  userId?: string;
}

interface Message {
  sender: "coach" | "user";
  text: string;
  options?: string[] | { label: string; value: string }[];
  type?: "input" | "select" | "multiselect" | "text-area" | "date";
  inputType?: string;
  placeholder?: string;
  key?: string;
}

const STEP_LABELS: Record<string, { overline: string; label: string }> = {
  "WELCOME": { overline: "Step 01 · Identity", label: "What is your Full Name, champion?" },
  "EMAIL": { overline: "Step 02 · Credentials", label: "Now, share your Email Address to secure blueprint access:" },
  "AGE": { overline: "Step 03 · Biometrics", label: "How old are you? Be absolutely honest." },
  "GENDER": { overline: "Step 04 · Biological Anatomy", label: "What is your biological Gender?" },
  "CYCLE_ELIGIBILITY_APPROACHING": { overline: "Step 05 · Hormonal Baseline", label: "Do you currently have a menstrual cycle, or is it not started yet?" },
  "CYCLE_ELIGIBILITY_ACTIVE": { overline: "Step 05 · Hormonal Baseline", label: "Do you currently have an active menstrual cycle?" },
  "CYCLE_ELIGIBILITY_MENOPAUSE": { overline: "Step 05 · Hormonal Baseline", label: "Do you still have active menstrual cycles, or have they stopped?" },
  "CYCLE_ELIGIBILITY_UNSURE": { overline: "Step 05 · Hormonal Baseline", label: "Have you had a period in the last 6 months?" },
  "CYCLE_CONDITIONS": { overline: "Step 06 · Hormonal Conditions", label: "Do you have PCOS, endometriosis, or take any hormonal medication?" },
  "PHYSICAL_WEIGHT": { overline: "Step 07 · Body Weight", label: "What is your Weight in kilograms?" },
  "PHYSICAL_HEIGHT": { overline: "Step 08 · Structural Height", label: "And your Height in centimeters?" },
  "FITNESS_STATUS": { overline: "Step 09 · Training Location", label: "Where do you currently exercise?" },
  "FITNESS_GYM_SPLIT": { overline: "Step 10 · Workout Split", label: "Describe your current workout split in your own words" },
  "FITNESS_NONE_BARRIER": { overline: "Step 10 · Key Barrier", label: "Select your biggest obstacle:" },
  "PRIMARY_GOAL": { overline: "Step 11 · Primary Goal", label: "What is your primary fitness goal?" },
  "DIET_PREFERENCE": { overline: "Step 12 · Dietary Preference", label: "What is your Diet Preference?" },
  "DIET_TYPICAL_DAY": { overline: "Step 13 · Daily Intake", label: "What do you typically eat in a day?" },
  "PROTEIN_TARGET": { overline: "Step 14 · Protein Target", label: "Select your Protein Intake Target level" },
  "SUPPLEMENTS_WHEY": { overline: "Step 15 · Whey Protein", label: "Do you currently take whey protein?" },
  "SUPPLEMENTS_WHEY_DETAILS": { overline: "Step 16 · Whey Brand & Dosage", label: "Which brand do you use and what is the dosage?" },
  "SUPPLEMENTS_OTHER": { overline: "Step 17 · Adjuvant Supplements", label: "Select other supplements you are interested in" },
  "CYCLE_LENGTH": { overline: "Step 18 · Cycle Length", label: "How many days is your typical cycle?" },
  "CYCLE_DURATION": { overline: "Step 19 · Period Duration", label: "How many days does your period usually last?" },
  "CYCLE_LAST_DATE": { overline: "Step 20 · Last Period Date", label: "When did your last period start?" },
  "CYCLE_REGULARITY": { overline: "Step 21 · Cycle Regularity", label: "Is your cycle regular or irregular?" },
  "CYCLE_SYMPTOMS": { overline: "Step 22 · Cycle Symptoms", label: "Do you experience any PMS or period symptoms?" }
};

function splitTextIntoLines(text: string, maxChars = 35): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  
  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxChars) {
      currentLine = currentLine ? currentLine + " " + word : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export default function Onboarding({ onComplete, fadeDuration, userId }: OnboardingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("WELCOME");
  const [userInput, setUserInput] = useState<string>("");
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Profile data being compiled
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: "",
    email: "",
    age: 25,
    gender: "Male",
    hasActiveCycle: false,
    irregularCycle: false,
    pcosCondition: false,
    weight: 70,
    height: 172,
    bmi: 23.6,
    bmiCategory: "Healthy",
    bmiExplanation: "",
    fitnessStatus: "Gym",
    primaryGoal: "Cut",
    dietPreference: "Vegetarian",
    currentDietDesc: "",
    dietFeedback: "",
    proteinTargetLevel: "Recommended",
    proteinTargetGrams: 105,
    calorieTarget: 2000,
    takesWhey: false,
    selectedSupplements: [],
    cycleLength: 28,
    periodDuration: 5,
    lastPeriodDate: new Date().toISOString().split("T")[0],
    cycleRegularity: "Regular",
    pmsSymptoms: []
  });

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save profile immediately on each state modification (question-by-question)
  useEffect(() => {
    if (userId && (profile.name || profile.email)) {
      const fieldsToSave: any = {
        name: profile.name || "",
        email: profile.email || "",
        age: profile.age || 25,
        gender: profile.gender || "Male",
        weight: profile.weight || 70,
        height: profile.height || 172,
        bmi: profile.bmi || 23.6,
        bmiCategory: profile.bmiCategory || "Healthy",
        primaryGoal: profile.primaryGoal || "Cut",
        dietPreference: profile.dietPreference || "Vegetarian",
        fitnessStatus: profile.fitnessStatus || "Gym",
        proteinTarget: profile.proteinTargetLevel || "Recommended",
        proteinTargetLevel: profile.proteinTargetLevel || "Recommended",
        proteinTargetGrams: profile.proteinTargetGrams || 105,
        calorieTarget: profile.calorieTarget || 2000,
        takesWhey: profile.takesWhey || false,
        supplements: profile.selectedSupplements || [],
        selectedSupplements: profile.selectedSupplements || [],
        hasActiveCycle: profile.hasActiveCycle || false,
        isOnboarded: false
      };
      
      if (profile.gender === "Female" && profile.hasActiveCycle) {
        fieldsToSave.cycleLength = profile.cycleLength || 28;
        fieldsToSave.periodDuration = profile.periodDuration || 5;
        fieldsToSave.lastPeriodDate = profile.lastPeriodDate || "";
        fieldsToSave.cycleRegularity = profile.cycleRegularity || "Regular";
        fieldsToSave.symptoms = profile.pmsSymptoms || [];
        fieldsToSave.pmsSymptoms = profile.pmsSymptoms || [];
      }
      
      setDoc(doc(db, "users", userId), fieldsToSave, { merge: true }).catch(err => {
        console.warn("Error updating onboarding step to firestore:", err);
      });
    }
  }, [profile, userId]);

  // Initial greeting
  useEffect(() => {
    addCoachMessage("Aadab! Namaste! I am your SHAT Coach. Science, Honesty, Adaptation, and Transformation are our pillars. I don't sugarcoat, I don't do corporate fluff. I build monsters. 💪");
    setTimeout(() => {
      askQuestion("WELCOME");
    }, 1200);
  }, []);

  const addCoachMessage = (text: string, options?: Message["options"], type?: Message["type"], placeholder?: string) => {
    setMessages(prev => [...prev, { sender: "coach", text, options, type, placeholder }]);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { sender: "user", text }]);
  };

  const askQuestion = (step: string) => {
    setCurrentStep(step);
    switch (step) {
      case "WELCOME":
        addCoachMessage("Let's secure your credentials first. What is your Full Name, champion?", undefined, "input", "e.g. Atharva Patel");
        break;
      case "EMAIL":
        addCoachMessage(`Welcome aboard! Now, share your Email Address to secure your blueprint access:`, undefined, "input", "e.g. name@domain.com");
        break;
      case "AGE":
        addCoachMessage(`Excellent. Next, how old are you? Be absolutely honest. No lies here.`, undefined, "input", "Enter your age");
        break;
      case "GENDER":
        addCoachMessage(`What is your Gender? We adapt custom athletic parameters based on biological metrics.`, [
          { label: "Male ♂️", value: "Male" },
          { label: "Female ♀️", value: "Female" },
          { label: "Prefer not to say", value: "Prefer not to say" }
        ], "select");
        break;
      
      // Female Menstrual Cycle eligibility logic (PRD / FLOW)
      case "CYCLE_ELIGIBILITY_APPROACHING": // Age 10-13
        addCoachMessage(`You might be approaching your first period. Do you currently have a menstrual cycle, or is it not started yet?`, [
          { label: "Yes, it has started", value: "Yes" },
          { label: "No, not yet", value: "No" },
          { label: "Not sure / Irregular", value: "Unsure" }
        ], "select");
        break;
      case "CYCLE_ELIGIBILITY_ACTIVE": // Age 13-50
        addCoachMessage(`Great! Let's set up cycle tracking so we can optimize your workouts and nutrition based on your hormonal phases. Do you currently have an active menstrual cycle?`, [
          { label: "Yes, active and regular", value: "Yes" },
          { label: "No, absent/stopped", value: "No" },
          { label: "Not sure / Irregular cycle", value: "Unsure" }
        ], "select");
        break;
      case "CYCLE_ELIGIBILITY_MENOPAUSE": // Age > 50
        addCoachMessage(`You may be in or approaching menopause. Do you still have active menstrual cycles, or have they stopped?`, [
          { label: "Yes, still having them", value: "Yes" },
          { label: "No, they have fully stopped", value: "No" },
          { label: "Not sure / Irregular", value: "Unsure" }
        ], "select");
        break;
      case "CYCLE_ELIGIBILITY_UNSURE": // "Not sure / Irregular"
        addCoachMessage(`No problem! Have you had a period in the last 6 months?`, [
          { label: "Yes", value: "Yes" },
          { label: "No", value: "No" }
        ], "select");
        break;
      case "CYCLE_CONDITIONS": // PCOS check
        addCoachMessage(`Do you have PCOS, endometriosis, or take any hormonal medication? This helps me customize nutrition tips (like adding magnesium for cramp mitigation) or turn off automatic predictions.`, [
          { label: "Yes, I have PCOS/Hormonal conditions", value: "Yes" },
          { label: "No, none of these", value: "No" }
        ], "select");
        break;

      case "PHYSICAL_WEIGHT":
        addCoachMessage(`Got it. Let's record your current physical data. What is your Weight in kilograms?`, undefined, "input", "Weight in kg (e.g. 74)");
        break;
      case "PHYSICAL_HEIGHT":
        addCoachMessage(`And your Height in centimeters?`, undefined, "input", "Height in cm (e.g. 175)");
        break;

      case "FITNESS_STATUS":
        addCoachMessage(`Let's assess your current Fitness Status. Where do you currently exercise?`, [
          { label: "Gym Goer 🏋️", value: "Gym" },
          { label: "Home Workouts 🏠", value: "Home" },
          { label: "Do not exercise at all 🛌", value: "None" }
        ], "select");
        break;
      case "FITNESS_GYM_SPLIT":
        addCoachMessage(`Describe your current workout split in your own words (e.g. 'Push Pull Legs', 'Chest/Triceps bro split', 'Crossfit'):`, undefined, "text-area", "Describe your current split...");
        break;
      case "FITNESS_NONE_BARRIER":
        addCoachMessage(`Let's diagnose WHY you aren't exercising yet. Select your biggest obstacle:`, [
          { label: "No time / hectic Indian job schedule 💼", value: "No time" },
          { label: "Cost of gym memberships 💸", value: "Expensive" },
          { label: "Feel too out of shape to start 🫣", value: "Out of shape" },
          { label: "Had a bad experience with exercise before ❌", value: "Bad experience" },
          { label: "Simply don't know where or how to begin ❓", value: "Don't know" }
        ], "select");
        break;

      case "PRIMARY_GOAL":
        addCoachMessage(`What is your primary fitness goal?`, [
          { label: "Lose Weight / Cut 🔪", value: "Cut" },
          { label: "Maintain Current Physique ⚖️", value: "Maintain" },
          { label: "Build Muscle / Bulk 🦍", value: "Bulk" }
        ], "select");
        break;

      case "DIET_PREFERENCE":
        addCoachMessage(`What is your Diet Preference? Sourcing real Indian staples depends heavily on this:`, [
          { label: "Pure Vegetarian 🟢", value: "Vegetarian" },
          { label: "Eggetarian 🥚", value: "Eggetarian" },
          { label: "Non-Vegetarian 🔴", value: "Non-Vegetarian" }
        ], "select");
        break;
      case "DIET_TYPICAL_DAY":
        addCoachMessage(`What do you typically eat in a day? Describe briefly (e.g. 'Poha/Chai breakfast, Dal Chawal lunch, Roti Sabzi dinner'):`, undefined, "text-area", "Enter typical meals...");
        break;

      case "PROTEIN_TARGET":
        addCoachMessage(`Select your Protein Intake Target level. Higher protein is crucial for muscle mass and metabolic rate:`, [
          { label: "1.0x Bodyweight - Moderate (General Fitness)", value: "Moderate" },
          { label: "1.5x Bodyweight - Recommended (Muscle Building)", value: "Recommended" },
          { label: "2.0x Bodyweight - Aggressive (Advanced Athletes)", value: "Aggressive" }
        ], "select");
        break;

      case "SUPPLEMENTS_WHEY":
        addCoachMessage(`Do you currently take whey protein?`, [
          { label: "Yes, I take whey protein", value: "Yes" },
          { label: "No, I do not", value: "No" }
        ], "select");
        break;
      case "SUPPLEMENTS_WHEY_DETAILS":
        addCoachMessage(`Which brand do you use and what is the dosage? (e.g. 'MuscleBlaze, 1 scoop daily'):`, undefined, "input", "Brand and dosage...");
        break;
      case "SUPPLEMENTS_OTHER":
        addCoachMessage(`Select other supplements you are interested in or currently taking (Select multiple and click Submit):`, [
          { label: "Creatine (Strength & Power)", value: "creatine" },
          { label: "Omega-3 Fish Oil (Joints & Heart)", value: "fishoil" },
          { label: "Vitamin D3 (Bone & Immunity)", value: "vitd3" },
          { label: "Vitamin B12 (Energy & Nerve)", value: "b12" },
          { label: "Magnesium (Sleep & CNS recovery)", value: "magnesium" },
          { label: "Pre-Workout (Energy boost)", value: "preworkout" },
          { label: "Multivitamins (General micro gap fill)", value: "multivitamins" }
        ], "multiselect");
        break;

      // Phase 12 Streamlined Cycle Setup
      case "CYCLE_LENGTH":
        addCoachMessage(`Let's map your Menstrual Cycle setup questions. How many days is your typical cycle? (Average is 28 days. Range 21-35 days is normal)`, undefined, "input", "e.g. 28");
        break;
      case "CYCLE_DURATION":
        addCoachMessage(`How many days does your period usually last? (Normal range is 3-7 days)`, undefined, "input", "e.g. 5");
        break;
      case "CYCLE_LAST_DATE":
        addCoachMessage(`When did your last period start? We use this to calculate your next expected period.`, undefined, "date");
        break;
      case "CYCLE_REGULARITY":
        addCoachMessage(`Is your cycle regular or irregular?`, [
          { label: "Regular (same length every month)", value: "Regular" },
          { label: "Somewhat irregular (varies by 2-3 days)", value: "Somewhat irregular" },
          { label: "Very irregular (varies by a week or more)", value: "Very irregular" }
        ], "select");
        break;
      case "CYCLE_SYMPTOMS":
        addCoachMessage(`Do you experience any PMS or period symptoms? (Select multiple and click Submit)`, [
          { label: "Cramps 😣", value: "Cramps" },
          { label: "Bloating 🎈", value: "Bloating" },
          { label: "Mood changes 🎭", value: "Mood changes" },
          { label: "Energy dips 🪫", value: "Energy dips" },
          { label: "None / Prefer not to say 🤍", value: "None" }
        ], "multiselect");
        break;

      case "COMPLETE_REVIEW":
        handleOnboardingCompletion();
        break;
    }
  };

  const handleInputSubmit = (valueText: string, valueVal?: any) => {
    if (!valueText.trim() && valueVal === undefined) return;
    
    addUserMessage(valueText);
    const cleanedText = valueText.trim();
    setUserInput("");

    // Temporary copy of profile to update state
    const updatedProfile = { ...profile };

    switch (currentStep) {
      case "WELCOME":
        updatedProfile.name = cleanedText;
        setProfile(updatedProfile);
        setTimeout(() => askQuestion("EMAIL"), 800);
        break;

      case "EMAIL":
        updatedProfile.email = cleanedText;
        setProfile(updatedProfile);
        setTimeout(() => askQuestion("AGE"), 800);
        break;

      case "AGE":
        const ageNum = parseInt(cleanedText) || 25;
        updatedProfile.age = ageNum;
        setProfile(updatedProfile);
        setTimeout(() => askQuestion("GENDER"), 800);
        break;

      case "GENDER":
        const genderVal = valueVal as UserProfile["gender"];
        updatedProfile.gender = genderVal;
        setProfile(updatedProfile);

        // Check cycle eligibility based on Gender + Age
        setTimeout(() => {
          if (genderVal === "Female") {
            const age = updatedProfile.age || 25;
            if (age < 10) {
              addCoachMessage(`You're quite young! We'll focus on building healthy habits now. Cycle tracking can come later when you're ready.`);
              updatedProfile.hasActiveCycle = false;
              setProfile(updatedProfile);
              setTimeout(() => askQuestion("PHYSICAL_WEIGHT"), 1500);
            } else if (age >= 10 && age <= 13) {
              askQuestion("CYCLE_ELIGIBILITY_APPROACHING");
            } else if (age > 13 && age <= 50) {
              askQuestion("CYCLE_ELIGIBILITY_ACTIVE");
            } else {
              askQuestion("CYCLE_ELIGIBILITY_MENOPAUSE");
            }
          } else {
            // Male or Prefer not to say → skip cycle tracking
            updatedProfile.hasActiveCycle = false;
            setProfile(updatedProfile);
            askQuestion("PHYSICAL_WEIGHT");
          }
        }, 800);
        break;

      case "CYCLE_ELIGIBILITY_APPROACHING":
      case "CYCLE_ELIGIBILITY_ACTIVE":
      case "CYCLE_ELIGIBILITY_MENOPAUSE":
        if (valueVal === "Yes") {
          updatedProfile.hasActiveCycle = true;
          setProfile(updatedProfile);
          setTimeout(() => askQuestion("CYCLE_CONDITIONS"), 800);
        } else if (valueVal === "No") {
          updatedProfile.hasActiveCycle = false;
          setProfile(updatedProfile);
          addCoachMessage("Got it. We will proceed with our standard high-performance protocols.");
          setTimeout(() => askQuestion("PHYSICAL_WEIGHT"), 1200);
        } else {
          // Unsure
          setTimeout(() => askQuestion("CYCLE_ELIGIBILITY_UNSURE"), 800);
        }
        break;

      case "CYCLE_ELIGIBILITY_UNSURE":
        if (valueVal === "Yes") {
          updatedProfile.hasActiveCycle = true;
          setProfile(updatedProfile);
          setTimeout(() => askQuestion("CYCLE_CONDITIONS"), 800);
        } else {
          updatedProfile.hasActiveCycle = false;
          setProfile(updatedProfile);
          addCoachMessage("Got it. Standard athletic protocol activated.");
          setTimeout(() => askQuestion("PHYSICAL_WEIGHT"), 1200);
        }
        break;

      case "CYCLE_CONDITIONS":
        updatedProfile.pcosCondition = valueVal === "Yes";
        setProfile(updatedProfile);
        if (valueVal === "Yes") {
          addCoachMessage("Important: Since you flagged PCOS/conditions, I will disable auto-predictions and rely purely on your manual logs. Focus will shift heavily to nutrient-density and symptom tracking. Suggest: 'Consult your gynecologist about workout/nutrition timing.' 🤍");
        } else {
          addCoachMessage("Roger that. Dynamic phase calculations remain active.");
        }
        setTimeout(() => askQuestion("PHYSICAL_WEIGHT"), 2000);
        break;

      case "PHYSICAL_WEIGHT":
        const weightNum = parseFloat(cleanedText) || 70;
        updatedProfile.weight = weightNum;
        setProfile(updatedProfile);
        setTimeout(() => askQuestion("PHYSICAL_HEIGHT"), 800);
        break;

      case "PHYSICAL_HEIGHT":
        const heightNum = parseFloat(cleanedText) || 172;
        updatedProfile.height = heightNum;

        // Perform BMI Calculation
        const mHeight = heightNum / 100;
        const calculatedBmi = Number((updatedProfile.weight! / (mHeight * mHeight)).toFixed(1));
        updatedProfile.bmi = calculatedBmi;

        let category = "Healthy";
        let explanation = "";
        if (calculatedBmi < 18.5) {
          category = "Underweight";
          explanation = "Your BMI represents underweight. We need to focus on a structured surplus to pack on muscle density.";
        } else if (calculatedBmi >= 18.5 && calculatedBmi < 25) {
          category = "Healthy";
          explanation = "Excellent! You are in the healthy BMI bracket. Perfect baseline for building premium aesthetics.";
        } else if (calculatedBmi >= 25 && calculatedBmi < 30) {
          category = "Overweight";
          explanation = "Classified as Overweight. We must focus on body recomposition — lowering fat ratio while maintaining solid strength.";
        } else {
          category = "Obese";
          explanation = "Classified as Obese. Let's make no excuses — we need to strictly manage energy intake to rebuild a strong health foundation.";
        }

        updatedProfile.bmiCategory = category;
        updatedProfile.bmiExplanation = explanation;
        setProfile(updatedProfile);

        addCoachMessage(`BMI Analysis completed: ${calculatedBmi} (${category.toUpperCase()}). ${explanation}`);
        setTimeout(() => askQuestion("FITNESS_STATUS"), 2500);
        break;

      case "FITNESS_STATUS":
        updatedProfile.fitnessStatus = valueVal as UserProfile["fitnessStatus"];
        setProfile(updatedProfile);
        setTimeout(() => {
          if (valueVal === "Gym") {
            askQuestion("FITNESS_GYM_SPLIT");
          } else if (valueVal === "None") {
            askQuestion("FITNESS_NONE_BARRIER");
          } else {
            // Home workouts
            addCoachMessage(`Got it! Home workouts are perfect for absolute consistency. Sourced from elite Indian plans: we'll prepare a structured 4-day bodyweight plan with progressive tension splits.`);
            setTimeout(() => askQuestion("PRIMARY_GOAL"), 2500);
          }
        }, 800);
        break;

      case "FITNESS_GYM_SPLIT":
        updatedProfile.currentSplitDesc = cleanedText;
        setProfile(updatedProfile);
        addCoachMessage("Analyzing your training split under athletic biomechanics models... 🔍");
        fetch("/api/critique-split", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ splitDesc: cleanedText, fitnessStatus: updatedProfile.fitnessStatus })
        })
          .then(res => res.json())
          .then(data => {
            addCoachMessage(data.critique || "Biomechanics verified. Overload splits calibrated.");
            setTimeout(() => askQuestion("PRIMARY_GOAL"), 2500);
          })
          .catch(err => {
            console.warn(err);
            addCoachMessage("Biomechanics verified. Remember: progressive overload is your mandate, not an option!");
            setTimeout(() => askQuestion("PRIMARY_GOAL"), 2000);
          });
        break;

      case "FITNESS_NONE_BARRIER":
        updatedProfile.exerciseBarrier = valueVal;
        setProfile(updatedProfile);
        let barrierSolution = "";
        if (valueVal === "No time") {
          barrierSolution = "Hectic schedule? We'll activate Zero Excuse Mode. A bulletproof 15-minute bedroom workout. Zero gear, maximum impact.";
        } else if (valueVal === "Expensive") {
          barrierSolution = "Who needs an expensive gym? Bodyweight leverage is completely free. We will configure high-performance home workouts.";
        } else {
          barrierSolution = "Let's strip away the fear. We start small — 10 minutes a day. Consistency is the only metric that matters, champion.";
        }
        addCoachMessage(`Personalized Solution: ${barrierSolution}`);
        setTimeout(() => askQuestion("PRIMARY_GOAL"), 2500);
        break;

      case "PRIMARY_GOAL":
        const selectedGoal = valueVal as UserProfile["primaryGoal"];
        updatedProfile.primaryGoal = selectedGoal;
        setProfile(updatedProfile);
        addCoachMessage("Calculating biological roast and target trajectory... ⚖️");
        fetch("/api/generate-roast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: updatedProfile.name,
            age: updatedProfile.age,
            weight: updatedProfile.weight,
            height: updatedProfile.height,
            bmi: updatedProfile.bmi,
            bmiCategory: updatedProfile.bmiCategory,
            currentGoal: selectedGoal
          })
        })
          .then(res => res.json())
          .then(data => {
            const roastMsg = data.roast || `Trajectory locked. Setting primary goal to ${selectedGoal.toUpperCase()}.`;
            updatedProfile.roastMessage = roastMsg;
            setProfile(updatedProfile);
            addCoachMessage(roastMsg);
            setTimeout(() => askQuestion("DIET_PREFERENCE"), 3000);
          })
          .catch(err => {
            console.warn(err);
            addCoachMessage(`Target set to ${selectedGoal.toUpperCase()}. Precision metrics are locked.`);
            setTimeout(() => askQuestion("DIET_PREFERENCE"), 2000);
          });
        break;

      case "DIET_PREFERENCE":
        updatedProfile.dietPreference = valueVal as UserProfile["dietPreference"];
        setProfile(updatedProfile);
        setTimeout(() => askQuestion("DIET_TYPICAL_DAY"), 800);
        break;

      case "DIET_TYPICAL_DAY":
        updatedProfile.currentDietDesc = cleanedText;
        setProfile(updatedProfile);
        addCoachMessage("Evaluating your dietary density and macro distribution... 🔍");
        fetch("/api/analyze-diet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dietDesc: cleanedText, dietPreference: updatedProfile.dietPreference })
        })
          .then(res => res.json())
          .then(data => {
            const feedbackMsg = data.feedback || "Nutritional profile logged. Setting macronutrient thresholds.";
            updatedProfile.dietFeedback = feedbackMsg;
            setProfile(updatedProfile);
            addCoachMessage(`Honest Nutritional Assessment: ${feedbackMsg}`);
            setTimeout(() => askQuestion("PROTEIN_TARGET"), 3000);
          })
          .catch(err => {
            console.warn(err);
            addCoachMessage("Nutritional profile logged. Soya chunks, paneer, and eggs will be your baseline pillars.");
            setTimeout(() => askQuestion("PROTEIN_TARGET"), 2000);
          });
        break;

      case "PROTEIN_TARGET":
        const targetLvl = valueVal as UserProfile["proteinTargetLevel"];
        updatedProfile.proteinTargetLevel = targetLvl;
        
        let multiplier = 1.0;
        if (targetLvl === "Recommended") multiplier = 1.5;
        if (targetLvl === "Aggressive") multiplier = 2.0;

        const proteinGrams = Math.round((updatedProfile.weight || 70) * multiplier);
        updatedProfile.proteinTargetGrams = proteinGrams;
        
        // Calculate recommended calorie budget based on goal
        let bmr = Math.round(10 * updatedProfile.weight! + 6.25 * updatedProfile.height! - 5 * updatedProfile.age! + 5);
        if (updatedProfile.gender === "Female") {
          bmr = Math.round(10 * updatedProfile.weight! + 6.25 * updatedProfile.height! - 5 * updatedProfile.age! - 161);
        }

        let calorieTarget = Math.round(bmr * 1.35); // lightly active baseline
        if (updatedProfile.primaryGoal === "Cut") {
          calorieTarget -= 400; // Deficit
        } else if (updatedProfile.primaryGoal === "Bulk") {
          calorieTarget += 300; // Surplus
        }

        updatedProfile.calorieTarget = calorieTarget;
        setProfile(updatedProfile);

        addCoachMessage(`Target locked: ${proteinGrams}g Protein/day. Your tailored energy budget is ${calorieTarget} kcal/day. Let's make every single calorie count.`);
        setTimeout(() => askQuestion("SUPPLEMENTS_WHEY"), 2000);
        break;

      case "SUPPLEMENTS_WHEY":
        if (valueVal === "Yes") {
          updatedProfile.takesWhey = true;
          setProfile(updatedProfile);
          setTimeout(() => askQuestion("SUPPLEMENTS_WHEY_DETAILS"), 800);
        } else {
          updatedProfile.takesWhey = false;
          setProfile(updatedProfile);
          setTimeout(() => askQuestion("SUPPLEMENTS_OTHER"), 800);
        }
        break;

      case "SUPPLEMENTS_WHEY_DETAILS":
        updatedProfile.wheyBrand = cleanedText;
        setProfile(updatedProfile);
        addCoachMessage("Excellent choice. We'll adapt your timing accordingly.");
        setTimeout(() => askQuestion("SUPPLEMENTS_OTHER"), 1000);
        break;

      case "SUPPLEMENTS_OTHER":
        updatedProfile.selectedSupplements = valueVal as string[];
        setProfile(updatedProfile);

        setTimeout(() => {
          if (updatedProfile.hasActiveCycle && updatedProfile.gender === "Female") {
            // Proceed to streamlined phase 12 cycle tracker setup
            askQuestion("CYCLE_LENGTH");
          } else {
            askQuestion("COMPLETE_REVIEW");
          }
        }, 1000);
        break;

      // Cycle Tracker Setup Questions
      case "CYCLE_LENGTH":
        const lengthDays = parseInt(cleanedText) || 28;
        updatedProfile.cycleLength = lengthDays;
        setProfile(updatedProfile);
        setTimeout(() => askQuestion("CYCLE_DURATION"), 800);
        break;

      case "CYCLE_DURATION":
        const durationDays = parseInt(cleanedText) || 5;
        updatedProfile.periodDuration = durationDays;
        setProfile(updatedProfile);
        setTimeout(() => askQuestion("CYCLE_LAST_DATE"), 800);
        break;

      case "CYCLE_LAST_DATE":
        updatedProfile.lastPeriodDate = cleanedText;
        setProfile(updatedProfile);
        setTimeout(() => askQuestion("CYCLE_REGULARITY"), 800);
        break;

      case "CYCLE_REGULARITY":
        updatedProfile.cycleRegularity = valueVal;
        setProfile(updatedProfile);
        setTimeout(() => askQuestion("CYCLE_SYMPTOMS"), 800);
        break;

      case "CYCLE_SYMPTOMS":
        updatedProfile.pmsSymptoms = valueVal as string[];
        setProfile(updatedProfile);
        setTimeout(() => askQuestion("COMPLETE_REVIEW"), 800);
        break;
    }
  };

  const handleMultiSelectSubmit = () => {
    handleInputSubmit(
      selectedMulti.length > 0 ? `Selected: ${selectedMulti.join(", ")}` : "None",
      selectedMulti
    );
    setSelectedMulti([]);
  };

  const toggleMultiSelect = (val: string) => {
    setSelectedMulti(prev => 
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    );
  };

  const handleOnboardingCompletion = () => {
    addCoachMessage("Transmitting profile parameters to SHAT cloud core... ⚡");
    
    if (userId) {
      setDoc(doc(db, "users", userId), { isOnboarded: true }, { merge: true }).catch(err => {
        console.warn("Error setting onboarding completed in firestore:", err);
      });
    }
    
    setTimeout(() => {
      if (profile.hasActiveCycle && profile.gender === "Female") {
        addCoachMessage(`Alright! I've got your cycle mapped. First period alert coming in ${profile.cycleLength || 28} days. Workouts and nutrition will auto-adapt to menstrual, follicular, ovulation, and luteal phases.`);
      } else {
        addCoachMessage(`Absolute profile mapped. S.H.A.T. system calibration complete. Let's destroy some weights.`);
      }

      setTimeout(() => {
        onComplete({ ...profile, isOnboarded: true } as UserProfile);
      }, 2500);
    }, 1500);
  };

  const currentOptions = messages[messages.length - 1]?.options;
  const currentType = messages[messages.length - 1]?.type;
  const currentPlaceholder = messages[messages.length - 1]?.placeholder;

  // Map conversation messages into cinematic bare text blocks
  const getBlocks = () => {
    const blocks: { overline: string; question: string; lines: string[]; isCompleted: boolean }[] = [];
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      if (msg.sender === "coach") {
        const nextMsg = messages[i + 1];
        if (nextMsg && nextMsg.sender === "user") {
          // Find matching step details to get the exact overline
          const matchingStep = Object.keys(STEP_LABELS).find(
            key => STEP_LABELS[key].label === msg.text || msg.text.includes(STEP_LABELS[key].label)
          );
          const stepInfo = matchingStep ? STEP_LABELS[matchingStep] : null;
          
          blocks.push({
            overline: stepInfo?.overline || "SHAT Coach · Completed Step",
            question: msg.text,
            lines: splitTextIntoLines(nextMsg.text, 35),
            isCompleted: true
          });
          i++; // Skip the next message since we consumed it as the user response
        } else {
          const isLast = (i === messages.length - 1);
          const matchingStep = Object.keys(STEP_LABELS).find(
            key => STEP_LABELS[key].label === msg.text || msg.text.includes(STEP_LABELS[key].label)
          );
          const stepInfo = matchingStep ? STEP_LABELS[matchingStep] : null;
          
          blocks.push({
            overline: stepInfo?.overline || "SHAT Coach · Introduction",
            question: stepInfo ? "Required Input" : "Coach Guidance",
            lines: splitTextIntoLines(msg.text, 35),
            isCompleted: !isLast
          });
        }
      }
    }
    return blocks;
  };

  // Trigger sequential GSAP stagger animations on block updates
  useEffect(() => {
    const targets = document.querySelectorAll(".active-animate-target");
    if (targets.length > 0) {
      gsap.killTweensOf(targets);
      gsap.fromTo(targets, 
        { y: 20, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.6, 
          stagger: 0.08, 
          ease: "power2.out" 
        }
      );
    }
  }, [currentStep, messages.length]);

  const renderFormControls = () => {
    switch (currentType) {
      case "multiselect":
        return (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto py-1">
              {(currentOptions as any[]).map((opt) => {
                const isSel = selectedMulti.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleMultiSelect(opt.value)}
                    className={`px-4 py-2.5 rounded-none text-xs font-sans tracking-widest uppercase transition-all duration-300 border cursor-pointer ${
                      isSel 
                        ? "bg-[#B76E79] border-[#B76E79] text-[#0D1B2A] font-normal" 
                        : "bg-transparent border-[#B76E79]/20 text-[#E8D5B7]/80 hover:border-[#B76E79]/50 hover:text-[#F2E6E9]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleMultiSelectSubmit}
              className="w-full sm:w-auto self-start px-6 py-3 rounded-none bg-transparent border border-[#B76E79]/45 text-[#E8D5B7] hover:bg-[#B76E79] hover:text-[#0D1B2A] font-sans font-normal text-[11px] tracking-[0.25em] uppercase transition-all duration-300 cursor-pointer"
            >
              SUBMIT SELECTIONS &rarr;
            </button>
          </div>
        );
        
      case "select":
        return (
          <div className="flex flex-col gap-2.5 w-full max-w-md">
            {(currentOptions as any[]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleInputSubmit(opt.label, opt.value)}
                className="w-full text-left px-5 py-4 rounded-none bg-transparent border border-[#B76E79]/15 hover:border-[#B76E79]/50 text-xs font-sans font-light text-[#E8D5B7]/90 tracking-wider transition-all duration-300 hover:bg-[#B76E79]/5 flex items-center justify-between group cursor-pointer"
              >
                <span>{opt.label}</span>
                <ArrowRight className="w-4 h-4 text-[#B76E79]/60 group-hover:text-[#F2E6E9] group-hover:translate-x-1 transition-all duration-300" />
              </button>
            ))}
          </div>
        );
        
      case "text-area":
        return (
          <div className="flex flex-col gap-4 w-full max-w-lg">
            <textarea
              rows={2}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={currentPlaceholder || "Type your honest reply..."}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleInputSubmit(userInput);
                }
              }}
              className="w-full border-b border-[#B76E79]/30 bg-transparent text-[#F2E6E9] focus:border-[#B76E79] focus:outline-none py-3 font-serif text-[18px] sm:text-[22px] md:text-[24px] tracking-wide placeholder-[#F2E6E9]/15 resize-none leading-relaxed"
            />
            <button
              onClick={() => handleInputSubmit(userInput)}
              className="w-full sm:w-auto self-start px-6 py-3 rounded-none bg-transparent border border-[#B76E79]/45 text-[#E8D5B7] font-sans font-normal text-[11px] tracking-[0.25em] uppercase hover:bg-[#B76E79] hover:text-[#0D1B2A] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>TRANSMIT DEEP ANALYSIS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        );
        
      default: // input or date
        return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 w-full max-w-md">
            <input
              type={currentType === "date" ? "date" : "text"}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={currentPlaceholder || "Type your reply..."}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleInputSubmit(userInput);
                }
              }}
              className="flex-1 border-b border-[#B76E79]/30 bg-transparent text-[#F2E6E9] focus:border-[#B76E79] focus:outline-none py-3 font-serif text-[18px] sm:text-[22px] md:text-[24px] tracking-wide placeholder-[#F2E6E9]/15"
            />
            <button
              onClick={() => handleInputSubmit(userInput)}
              className="px-6 py-4 rounded-none bg-transparent border border-[#B76E79]/45 text-[#E8D5B7] hover:bg-[#B76E79] hover:text-[#0D1B2A] transition-all duration-300 flex items-center justify-center cursor-pointer font-sans text-xs tracking-widest uppercase"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
    }
  };

  const blocks = getBlocks();

  return (
    <div className="w-full max-w-3xl mx-auto py-8 sm:py-16 md:py-[80px] px-4 sm:px-8 md:px-[60px] flex flex-col justify-start relative z-10">
      
      {/* Cinematic bare text thread */}
      <div className="w-full flex flex-col items-start gap-12">
        {blocks.map((block, bIdx) => {
          const isLastBlock = bIdx === blocks.length - 1;
          
          return (
            <div key={bIdx} className="w-full flex flex-col items-start">
              {/* OVERLINE LABEL */}
              <div className={`text-[10px] tracking-[0.22em] uppercase font-sans font-medium text-[#B76E79] mb-1.5 ${isLastBlock ? "active-animate-target" : ""}`}>
                {block.overline}
              </div>
              
              {/* QUESTION LINE */}
              <div className={`text-[13px] tracking-[0.06em] font-sans text-[#F2E6E9]/40 mb-[20px] ${isLastBlock ? "active-animate-target" : ""}`}>
                {block.question}
              </div>
              
              {/* ANSWER LINES */}
              <div className="flex flex-col items-start gap-2">
                {block.lines.map((line, lIdx) => {
                  const isFirstTwo = lIdx < 2;
                  const isAbsoluteLastLine = isLastBlock && (lIdx === block.lines.length - 1);
                  
                  return (
                    <span 
                      key={lIdx} 
                      className={`font-serif text-[20px] min-[400px]:text-[22px] sm:text-[26px] md:text-[28px] font-normal leading-[1.35] text-left inline-flex items-center flex-wrap ${
                        isLastBlock ? "active-animate-target" : ""
                      } ${
                        isFirstTwo ? "text-[#F2E6E9]" : "text-[#E8D5B7]/45"
                      }`}
                    >
                      {line}
                      {isAbsoluteLastLine && !block.isCompleted && (
                        <span className="inline-block w-[2px] h-[26px] bg-[#B76E79] ml-1.5 animate-blink" />
                      )}
                    </span>
                  );
                })}
              </div>

              {/* If it's the active block and not completed, render the active controls right below it */}
              {isLastBlock && !block.isCompleted && (
                <div className="w-full mt-8 active-animate-target">
                  {renderFormControls()}
                </div>
              )}

              {/* THIN HORIZONTAL RULE */}
              {!isLastBlock && (
                <div className="w-10 h-[1px] bg-[#B76E79]/50 my-6" />
              )}
            </div>
          );
        })}
      </div>
      
      <div ref={chatEndRef} />
    </div>
  );
}
