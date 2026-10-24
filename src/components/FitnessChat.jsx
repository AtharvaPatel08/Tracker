import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";

const CATEGORIES = [
  { id: "WORKOUT", label: "🏋 Workout" },
  { id: "NUTRITION", label: "🥗 Nutrition" },
  { id: "FAT_LOSS", label: "🔥 Fat Loss" },
  { id: "MUSCLE_BUILDING", label: "💪 Muscle Building" },
  { id: "RECOVERY", label: "😴 Recovery" },
  { id: "SUPPLEMENTS", label: "💊 Supplements" },
  { id: "MIND_DISCIPLINE", label: "🧘 Mind & Discipline" },
  { id: "INDIAN_DIET", label: "🍛 Indian Diet" },
];

const QUESTIONS_MAP = {
  WORKOUT: [
    "How many sets per muscle group per week?",
    "What is the best split for muscle gain?",
    "How long should I rest between sets?",
    "Should I train to failure every set?"
  ],
  NUTRITION: [
    "How much protein do I need daily?",
    "What should I eat before a workout?",
    "What should I eat after a workout?",
    "How do I calculate my calorie deficit?"
  ],
  FAT_LOSS: [
    "How do I break a fat loss plateau?",
    "Is cardio necessary for fat loss?",
    "What is the best deficit for fat loss?",
    "Can I lose fat and build muscle together?"
  ],
  MUSCLE_BUILDING: [
    "How much of a calorie surplus should I eat?",
    "How long does it take to see muscle gain?",
    "Should I bulk or cut first as a beginner?",
    "What is progressive overload?"
  ],
  RECOVERY: [
    "How much sleep do I need for muscle growth?",
    "How do I reduce muscle soreness faster?",
    "Should I train when sore?",
    "How important is the rest day?"
  ],
  SUPPLEMENTS: [
    "Is creatine safe for beginners?",
    "Do I need a protein supplement?",
    "What supplements actually work?",
    "When should I take creatine?"
  ],
  MIND_DISCIPLINE: [
    "How do I stay consistent with workouts?",
    "How do I build a fitness habit?",
    "What to do when I feel like quitting?",
    "How do I get motivated to work out?"
  ],
  INDIAN_DIET: [
    "How to get enough protein on a veg diet?",
    "Is dal and rice good for muscle building?",
    "Best Indian foods for fat loss?",
    "How to eat healthy on a tight budget?"
  ]
};

export default function FitnessChat() {
  const [activeCategory, setActiveCategory] = useState("WORKOUT");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [loadedDate, setLoadedDate] = useState("");
  const [thinkingMode, setThinkingMode] = useState(false);
  const [limit] = useState(10);
  const [isLimitFetched, setIsLimitFetched] = useState(false);
  const threadEndRef = useRef(null);

  // Get local timezone-safe date string YYYY-MM-DD
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fetch / Setup Usage limit on auth load or mount
  useEffect(() => {
    const fetchUsage = async () => {
      const todayStr = getLocalDateString();
      const user = auth.currentUser;
      if (!user) {
        setLoadedDate(todayStr);
        setIsLimitFetched(true);
        return;
      }

      setLoadedDate(todayStr);
      try {
        const usageDocRef = doc(db, "chatUsage", user.uid);
        const usageSnap = await getDoc(usageDocRef);

        if (usageSnap.exists()) {
          const data = usageSnap.data();
          if (data.date === todayStr) {
            setQuestionsUsed(data.questionsUsed || 0);
          } else {
            // Reset daily count for a new calendar day
            await setDoc(usageDocRef, {
              date: todayStr,
              questionsUsed: 0,
              limit: 10
            }, { merge: true });
            setQuestionsUsed(0);
          }
        } else {
          // Document doesn't exist yet, initialize it
          await setDoc(usageDocRef, {
            date: todayStr,
            questionsUsed: 0,
            limit: 10
          });
          setQuestionsUsed(0);
        }
      } catch (err) {
        console.warn("Error loading chat limit usage:", err);
      } finally {
        setIsLimitFetched(true);
      }
    };

    if (auth.currentUser) {
      fetchUsage();
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUsage();
      }
    });

    return () => unsubscribe();
  }, []);

  // Periodically and on-focus check for date transition to reset stale questionsUsed counter without requiring refresh
  useEffect(() => {
    const handleFocusAndCheck = async () => {
      const user = auth.currentUser;
      if (!user || !loadedDate) return;
      
      const todayStr = getLocalDateString();
      if (loadedDate !== todayStr) {
        setLoadedDate(todayStr);
        setQuestionsUsed(0);
        try {
          await setDoc(doc(db, "chatUsage", user.uid), {
            date: todayStr,
            questionsUsed: 0,
            limit: 10
          }, { merge: true });
        } catch (err) {
          console.warn("Error resetting usage on focus transition:", err);
        }
      }
    };

    window.addEventListener("focus", handleFocusAndCheck);
    const interval = setInterval(handleFocusAndCheck, 15000); // Check every 15 seconds

    return () => {
      window.removeEventListener("focus", handleFocusAndCheck);
      clearInterval(interval);
    };
  }, [loadedDate]);

  // Smooth auto-scroll behavior for the message thread
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle Suggested Chip Taps
  const handleChipTap = (question) => {
    setInput(question);
  };

  // Handle submit query
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const user = auth.currentUser;
    const todayStr = getLocalDateString();
    let currentQuestionsUsed = questionsUsed;

    // Direct check for date transition right before query submission
    if (loadedDate && loadedDate !== todayStr) {
      currentQuestionsUsed = 0;
      setQuestionsUsed(0);
      setLoadedDate(todayStr);
      if (user) {
        try {
          await setDoc(doc(db, "chatUsage", user.uid), {
            date: todayStr,
            questionsUsed: 0,
            limit: 10
          }, { merge: true });
        } catch (err) {
          console.warn("Error resetting usage on submission transition:", err);
        }
      }
    }

    if (!input.trim() || loading) return;
    if (currentQuestionsUsed >= limit) {
      setErrorMsg("Daily question limit reached. Refreshes at midnight.");
      return;
    }

    const currentQuery = input.trim();
    setInput("");
    setErrorMsg("");

    // Add user message to local state
    const userMsg = { role: "user", text: currentQuery };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Keep last 6 messages in history for conversation state
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const res = await fetch("/api/fitness-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentQuery,
          history: chatHistory,
          thinkingMode: thinkingMode
        })
      });

      if (!res.ok) {
        throw new Error("Failed to contact Gemini endpoint.");
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const aiText = data.response;

      // Update count in Firestore only after a successful call
      const newCount = currentQuestionsUsed + 1;
      if (user) {
        try {
          await setDoc(doc(db, "chatUsage", user.uid), {
            date: todayStr,
            questionsUsed: newCount
          }, { merge: true });
        } catch (saveErr) {
          console.warn("Notice updating chat usage:", saveErr);
        }
      }

      setQuestionsUsed(newCount);

      // Append AI reply to thread
      setMessages(prev => [...prev, { role: "model", text: aiText }]);
    } catch (err) {
      console.warn("SCRTH AI Chat failure:", err);
      setErrorMsg("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Progress Bar Configuration
  const progressPercent = Math.min((questionsUsed / limit) * 100, 100);
  
  let fillBgColor = "bg-white"; // Crisp white accent
  if (questionsUsed >= 10) {
    fillBgColor = "bg-red-500/80"; // Red for limit reached
  } else if (questionsUsed >= 8) {
    fillBgColor = "bg-amber-400"; // Warning
  }

  return (
    <div 
      className="w-full bg-[#121212] rounded-[14px] p-4 sm:p-6 flex flex-col gap-6 shadow-2xl relative"
      style={{
        border: "1px solid rgba(255,255,255,0.1)",
        maxWidth: "780px",
        margin: "0 auto"
      }}
    >
      {/* Header with Title and Daily Limits */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h3 
            className="font-light text-[22px] text-white uppercase tracking-wider leading-tight" 
            style={{ fontFamily: "Space Grotesk, Outfit, sans-serif" }}
          >
            SCRTH Coach Core
          </h3>
          <span className="text-[11px] font-sans font-light tracking-[0.25em] text-zinc-400 block mt-0.5 uppercase">
            START FROM SCRATCH.
          </span>
        </div>

        {isLimitFetched && (
          <div className="w-full sm:w-auto flex flex-col items-end gap-1.5 min-w-[150px]">
            <div className="text-[11px] font-sans text-zinc-400 tracking-wide uppercase">
              {questionsUsed} / {limit} questions used today
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-[2px] bg-white/10 rounded-[1px] overflow-hidden">
              <div 
                className={`h-full ${fillBgColor} transition-all duration-500`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {questionsUsed >= limit && (
              <span className="text-[12px] text-zinc-400 italic font-sans mt-0.5">
                Daily limit reached. Come back tomorrow.
              </span>
            )}
          </div>
        )}
      </div>

      {/* QUICK OPTION BUTTONS (Category Navigation) */}
      <div className="flex flex-wrap gap-1 justify-center border-b border-white/10 pb-4">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="transition-all duration-300 select-none cursor-pointer"
              style={{
                background: isActive ? "#FFFFFF" : "#181818",
                border: isActive ? "1px solid #FFFFFF" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "8px 16px",
                fontSize: "12px",
                fontFamily: "sans-serif",
                color: isActive ? "#0A0A0A" : "#A1A1AA",
                fontWeight: isActive ? "600" : "400",
                margin: "3px"
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* SUGGESTED QUESTIONS PER CATEGORY */}
      <div className="min-h-[50px] flex flex-col justify-center items-center py-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="flex flex-wrap gap-2 justify-center"
          >
            {QUESTIONS_MAP[activeCategory]?.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleChipTap(q)}
                className="transition-all duration-300 select-none cursor-pointer"
                style={{
                  background: "#161616",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "20px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontFamily: "sans-serif",
                  color: "#A1A1AA"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#FFFFFF";
                  e.currentTarget.style.color = "#FFFFFF";
                  e.currentTarget.style.background = "#222222";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "#A1A1AA";
                  e.currentTarget.style.background = "#161616";
                }}
              >
                {q}
              </button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* MESSAGE THREAD AREA */}
      <div 
        className="overflow-y-auto pr-2 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10"
        style={{
          maxHeight: "440px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-16">
            <div className="w-12 h-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white text-lg select-none">
              ✨
            </div>
            <div className="max-w-md">
              <p className="text-sm text-zinc-400 font-sans tracking-wide uppercase leading-relaxed">
                Select a quick topic above or ask custom questions.
              </p>
              <p className="text-[10px] text-zinc-400 tracking-[0.2em] font-sans font-medium uppercase mt-2">
                SCRTH AI: Grounded in Scientific Truth &amp; Continuous Improvement
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    background: isUser ? "#242424" : "#161616",
                    border: isUser ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: isUser ? "12px 12px 2px 12px" : "2px 12px 12px 12px",
                    padding: "12px 16px",
                    color: isUser ? "#FFFFFF" : "#E4E4E7",
                    fontSize: "14px",
                    maxWidth: isUser ? "85%" : "88%",
                    wordBreak: "break-word"
                  }}
                >
                  <p className="font-sans leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              );
            })}

            {/* Thinking / Loading indicator */}
            {loading && (
              <div 
                style={{
                  alignSelf: "flex-start",
                  color: "#FFFFFF",
                  fontSize: "20px"
                }}
                className="flex items-center gap-1 px-4 py-2"
              >
                <span className="animate-bounce" style={{ animationDelay: "0s" }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: "0.15s" }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: "0.3s" }}>•</span>
              </div>
            )}

            <div ref={threadEndRef} />
          </div>
        )}
      </div>

      {/* INPUT FORM ROW */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Thinking Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1 mb-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setThinkingMode(!thinkingMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] transition-all duration-300 border text-[11px] cursor-pointer"
              style={{
                background: thinkingMode ? "#27272A" : "#181818",
                borderColor: thinkingMode ? "#FFFFFF" : "rgba(255,255,255,0.12)",
                color: thinkingMode ? "#FFFFFF" : "#71717A"
              }}
            >
              <span>🧠</span>
              <span className="font-sans font-medium tracking-[0.05em] uppercase">
                Deep Reason {thinkingMode ? "ON" : "OFF"}
              </span>
            </button>
            <span className="text-[11px] text-zinc-400 font-sans">
              Uses high-thinking Gemini 3.8 Flash for reasoning complex nutrition/exercise science queries.
            </span>
          </div>
        </div>

        <div className="flex gap-2.5 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={questionsUsed >= limit || loading}
            placeholder="Ask anything about fitness..."
            className="flex-1 transition-all duration-300"
            style={{
              background: "#161616",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "10px",
              padding: "12px 16px",
              color: "#FFFFFF",
              fontSize: "14px",
              outline: "none"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#FFFFFF";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            }}
          />
          <button
            type="submit"
            disabled={questionsUsed >= limit || loading || !input.trim()}
            className="transition-all duration-300 font-sans tracking-wide font-medium"
            style={{
              background: (questionsUsed >= limit || loading || !input.trim()) ? "#27272A" : "#FFFFFF",
              color: (questionsUsed >= limit || loading || !input.trim()) ? "#71717A" : "#0A0A0A",
              borderRadius: "10px",
              padding: "12px 20px",
              fontSize: "13px",
              cursor: (questionsUsed >= limit || loading || !input.trim()) ? "not-allowed" : "pointer"
            }}
          >
            Ask &rarr;
          </button>
        </div>

        {errorMsg && (
          <div className="text-xs text-[rgba(255,100,100,0.65)] font-sans mt-0.5 ml-1">
            {errorMsg}
          </div>
        )}
      </form>
    </div>
  );
}
