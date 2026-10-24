import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { 
  Shield, 
  RotateCw, 
  Flame, 
  Compass, 
  Cpu, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Activity,
  Maximize2,
  Lock,
  Globe,
  BellRing,
  Sparkles
} from "lucide-react";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
// @ts-ignore
import WorkoutSplit from "./components/WorkoutSplit";
// @ts-ignore
import FitnessChat from "./components/FitnessChat";
// @ts-ignore
import BubbleMenu from "./components/BubbleMenu/BubbleMenu";
import BlurText from "./components/BlurText";
import ScrollStack, { ScrollStackItem } from "./components/ScrollStack/ScrollStack";
import CircularGallery from "./components/CircularGallery/CircularGallery";
import { UserProfile } from "./types";
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";

// Custom useTypewriter hook: takes text, speed, startDelay
function useTypewriter(text: string, speed = 38, startDelay = 606) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let delayTimeout: NodeJS.Timeout;
    let typeInterval: NodeJS.Timeout;

    setDisplayed("");
    setDone(false);

    delayTimeout = setTimeout(() => {
      let currentIndex = 0;
      typeInterval = setInterval(() => {
        currentIndex++;
        setDisplayed(text.slice(0, currentIndex));
        
        if (currentIndex >= text.length) {
          setDone(true);
          clearInterval(typeInterval);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(delayTimeout);
      clearInterval(typeInterval);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

interface GlassButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

function GlassButton({ children, className = "", onClick, type = "button", disabled, variant = "secondary", ...props }: GlassButtonProps) {
  const baseStyle = "px-6 py-4 rounded-none font-sans font-normal text-[10px] tracking-[0.3em] uppercase transition-all duration-300 ease-out cursor-pointer flex items-center justify-center gap-2 select-none";
  const primaryStyle = "bg-white text-[#070707] border-none hover:bg-[#D4D4D4]";
  const secondaryStyle = "bg-transparent border border-white/20 text-[#A8A8A8] hover:border-white hover:text-white";
  const selectedStyle = variant === "primary" ? primaryStyle : secondaryStyle;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${selectedStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, subtitle, description }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="p-8 rounded-none border border-white/6 bg-[#0F0F0F] hover:border-white/15 transition-all duration-300 ease-out shadow-2xl flex flex-col items-start gap-5 group"
    >
      <div className="w-12 h-12 rounded-none bg-white/6 border border-white/8 flex items-center justify-center text-[#A8A8A8] group-hover:text-white group-hover:bg-white/10 transition-all duration-300">
        <Icon className="w-5 h-5 stroke-[1.5]" />
      </div>
      <div>
        <span className="text-[9px] font-sans font-light tracking-[0.3em] text-[#A8A8A8] uppercase block mb-1">{subtitle}</span>
        <h3 className="font-scrth-main text-base font-light tracking-[0.3em] text-white mb-3 uppercase">{title}</h3>
        <p className="text-sm text-[#A8A8A8] leading-relaxed font-sans">{description}</p>
      </div>
    </motion.div>
  );
}

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.25,
      delayChildren: 0.4,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.0,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function App() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { scrollY } = useScroll({ container: containerRef });
  const parallaxY = useTransform(scrollY, (val) => val * -0.15);

  const [hovered, setHovered] = useState(false);
  const [screen, setScreen] = useState<"SPLASH" | "HERO" | "LOGIN_SIGNUP" | "ONBOARDING" | "DASHBOARD">("SPLASH");
  const screenRef = React.useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  
  // Auth Form State
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  // Compiled User Profile
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const scrthNavItems = [
    {
      label: 'home',
      href: '#hero-section',
      ariaLabel: 'Home',
      rotation: -8,
      hoverStyles: { bgColor: '#FFFFFF', textColor: '#0a0a0a' },
      onClick: (e: any) => {
        e.preventDefault();
        document.getElementById("hero-section")?.scrollIntoView({ behavior: "smooth" });
      }
    },
    {
      label: 'about',
      href: '#valve-prop',
      ariaLabel: 'About SCRTH',
      rotation: 8,
      hoverStyles: { bgColor: '#FFFFFF', textColor: '#0a0a0a' },
      onClick: (e: any) => {
        e.preventDefault();
        document.getElementById("valve-prop")?.scrollIntoView({ behavior: "smooth" });
      }
    },
    {
      label: 'features',
      href: '#features-section',
      ariaLabel: 'Features',
      rotation: -5,
      hoverStyles: { bgColor: '#FFFFFF', textColor: '#0A0A0A' },
      onClick: (e: any) => {
        e.preventDefault();
        document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" });
      }
    },
    {
      label: 'Ask SCRTH AI',
      href: '#ask-scrth-ai',
      ariaLabel: 'Ask SCRTH AI',
      rotation: -3,
      hoverStyles: { bgColor: '#FFFFFF', textColor: '#0A0A0A' },
      onClick: (e: any) => {
        e.preventDefault();
        if (currentUser) {
          setScreen("DASHBOARD");
          setTimeout(() => {
            document.getElementById("ask-scrth-ai")?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        } else {
          setScreen("LOGIN_SIGNUP");
        }
      }
    },
    {
      label: 'start',
      href: '#onboarding',
      ariaLabel: 'Get Started',
      rotation: 6,
      hoverStyles: { bgColor: '#FFFFFF', textColor: '#0A0A0A' },
      onClick: (e: any) => {
        e.preventDefault();
        setScreen("LOGIN_SIGNUP");
      }
    }
  ];

  const { displayed, done } = useTypewriter("START FROM SCRATCH.", 45, 300);
  
  const video1Ref = React.useRef<HTMLVideoElement | null>(null);
  const video2Ref = React.useRef<HTMLVideoElement | null>(null);
  const prevXRef = React.useRef<number | null>(null);
  const targetTimeRef = React.useRef<number>(0);
  const lastMouseMoveTimeRef = React.useRef<number>(0);
  const isInteractingRef = React.useRef<boolean>(false);
  const lastInputTimeRef = React.useRef<number>(0);
  const dumbbellStageRef = React.useRef<HTMLDivElement | null>(null);
  const activeVideoIdRef = React.useRef<"video1" | "video2">("video1");

  const [startTrim, setStartTrim] = useState(0.12);
  const [endTrim, setEndTrim] = useState(5.82);
  const [fadeDuration, setFadeDuration] = useState(0.08); // snappy 80ms fade
  const [activeChannel, setActiveChannel] = useState("CH_1");

  const startTrimRef = React.useRef(0.12);
  const endTrimRef = React.useRef(5.82);
  const fadeDurationRef = React.useRef(0.08);

  useEffect(() => {
    startTrimRef.current = startTrim;
    endTrimRef.current = endTrim;
    fadeDurationRef.current = fadeDuration;

    // Direct DOM manipulation of transition speed to ensure it updates instantly with the slider!
    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    if (v1 && v2) {
      v1.style.transition = `opacity ${fadeDuration}s ease-in-out`;
      v2.style.transition = `opacity ${fadeDuration}s ease-in-out`;
    }
  }, [startTrim, endTrim, fadeDuration]);

  // Handle Enter key for proceeding to launch / auth screen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (screen === "SPLASH" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        setScreen(currentUser ? "DASHBOARD" : "HERO");
      } else if (screen === "HERO" && e.key === "Enter") {
        setScreen("LOGIN_SIGNUP");
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [screen, currentUser]);

  // Primary video playback & RAF seeking loop
  useEffect(() => {
    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    if (!v1 || !v2) return;

    let isUnmounted = false;

    v1.loop = false;
    v2.loop = false;
    v1.muted = true;
    v2.muted = true;
    v1.playsInline = true;
    v2.playsInline = true;

    // Start playing the first video safely
    v1.play().catch(() => {});
    v2.pause();
    v2.currentTime = 0;

    activeVideoIdRef.current = "video1";
    let transitioning = false;
    let lastSeekTime = 0;
    let lerpedTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (isUnmounted || screenRef.current !== "HERO") return;
      const activeVideo = activeVideoIdRef.current === "video1" ? v1 : v2;
      if (!activeVideo) return;

      const rawDur = activeVideo.duration;
      const dur = !rawDur || isNaN(rawDur) || rawDur <= 0 ? 5.92 : rawDur;

      const now = Date.now();
      const isNewSession = now - lastMouseMoveTimeRef.current > 150;
      lastMouseMoveTimeRef.current = now;
      lastInputTimeRef.current = now;

      if (prevXRef.current === null || isNewSession) {
        prevXRef.current = e.clientX;
        targetTimeRef.current = activeVideo.currentTime;
        return;
      }

      const delta = e.clientX - prevXRef.current;
      prevXRef.current = e.clientX;

      const SENSITIVITY = 0.8;
      const timeOffset = (delta / window.innerWidth) * SENSITIVITY * dur;
      let newTarget = targetTimeRef.current + timeOffset;

      // Wrap around with perfect [startTrim, endTrim] limits during scrubbing
      const currentStartTrim = startTrimRef.current;
      const currentEndTrim = Math.max(currentStartTrim + 1.0, Math.min(endTrimRef.current, dur - 0.01));
      const span = Math.max(1.0, currentEndTrim - currentStartTrim);

      if (newTarget < currentStartTrim) {
        newTarget = currentEndTrim - ((currentStartTrim - newTarget) % span);
      } else if (newTarget > currentEndTrim) {
        newTarget = currentStartTrim + ((newTarget - currentStartTrim) % span);
      }

      targetTimeRef.current = newTarget;
    };

    const handleMouseLeave = () => {
      prevXRef.current = null;
    };

    // Keep track of the requestAnimationFrame loop
    let rafId: number;

    const tick = () => {
      if (isUnmounted) return;

      const activeVideo = activeVideoIdRef.current === "video1" ? v1 : v2;
      const dormantVideo = activeVideoIdRef.current === "video1" ? v2 : v1;
      
      if (!activeVideo || !dormantVideo) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const rawDur = activeVideo.duration || dormantVideo.duration;
      const dur = !rawDur || isNaN(rawDur) || rawDur <= 0 ? 5.92 : rawDur;

      const isInteracting = isInteractingRef.current || (Date.now() - lastInputTimeRef.current < 250);
      const isIdle = screenRef.current !== "HERO" || !isInteracting;

      // Render live rotation degrees and states straight into telemetry HUD elements (highly performant)
      const activeDegEl = document.getElementById("active-deg-val");
      const activeModalityEl = document.getElementById("active-modality-val");
      const activeProgressSlider = document.getElementById("active-progress-slider") as HTMLInputElement;
      const dumbbellBadgeDegEl = document.getElementById("dumbbell-badge-deg");
      const dumbbellPromptTextEl = document.getElementById("dumbbell-touch-prompt-text");

      // Calculate degrees relative to our custom trim window
      const currentStartTrim = startTrimRef.current;
      const currentEndTrim = Math.max(currentStartTrim + 1.0, Math.min(endTrimRef.current, dur - 0.01));
      const span = Math.max(1.0, currentEndTrim - currentStartTrim);

      const relativeTime = Math.max(0, Math.min(activeVideo.currentTime - currentStartTrim, span));
      const degrees = Math.round((relativeTime / span) * 360);

      if (activeDegEl) {
        activeDegEl.innerText = `${degrees}° ROTATION`;
      }
      if (dumbbellBadgeDegEl) {
        dumbbellBadgeDegEl.innerText = `${degrees}° ROTATION`;
      }
      if (activeModalityEl) {
        activeModalityEl.innerText = isIdle ? "SYSTEM: CONTINUOUS LOOP" : "INPUT: REAL-TIME SCRUB";
      }
      if (dumbbellPromptTextEl) {
        dumbbellPromptTextEl.innerText = isIdle ? "DRAG TO ROTATE 360°" : "SCRUBBING ACTIVE // ROTATING";
      }
      if (activeProgressSlider) {
        activeProgressSlider.value = String((relativeTime / span) * 100);
      }

      if (isIdle) {
        // Play naturally if the user is not scrubbing
        if (activeVideo.paused && !activeVideo.seeking) {
          activeVideo.play().catch(() => {});
        }

        // Active baton handoff: trigger slightly before currentEndTrim
        const currentFade = fadeDurationRef.current;
        const PRE_ROLL_GAP = 0.15 + currentFade;

        if (activeVideo.currentTime > currentEndTrim - PRE_ROLL_GAP && !transitioning) {
          transitioning = true;

          // Set dormant video to start trim so it pre-loads and starts playing
          dormantVideo.currentTime = currentStartTrim;
          dormantVideo.play().then(() => {
            if (isUnmounted) return;
            const startCheckTime = Date.now();
            const checkPlayStart = () => {
              if (isUnmounted) return;
              const elapsed = Date.now() - startCheckTime;

              // Once the dormant video has actually advanced or exceeded pre-roll timeout
              if (dormantVideo.currentTime > currentStartTrim + 0.01 || elapsed > 150) {
                // Direct DOM opacity swap to ensure frame-perfect transitions
                if (activeVideoIdRef.current === "video1") {
                  v1.style.opacity = "0";
                  v2.style.opacity = "0.45";
                  activeVideoIdRef.current = "video2";
                  if (!isUnmounted) setActiveChannel("CH_2");
                } else {
                  v2.style.opacity = "0";
                  v1.style.opacity = "0.45";
                  activeVideoIdRef.current = "video1";
                  if (!isUnmounted) setActiveChannel("CH_1");
                }

                // Pause the previous active video after a safe timeout matching the fade duration
                setTimeout(() => {
                  if (isUnmounted) return;
                  activeVideo.pause();
                  transitioning = false;
                }, Math.max(currentFade * 1000 + 40, 80));
              } else {
                requestAnimationFrame(checkPlayStart);
              }
            };
            checkPlayStart();
          }).catch(() => {
            transitioning = false;
          });
        }

        // Failsafe safety reset - if active video somehow overshot currentEndTrim
        if (activeVideo.currentTime > currentEndTrim + 0.05) {
          activeVideo.currentTime = currentStartTrim;
        }

        // Sync targetTime with the real time of video so it is seamless when we restart scrubbing
        targetTimeRef.current = activeVideo.currentTime;
        lerpedTime = activeVideo.currentTime;
        prevXRef.current = null;
      } else {
        // Active scrubbing: pause both so seeking avoids conflict
        if (!v1.paused) v1.pause();
        if (!v2.paused) v2.pause();

        // Smooth lerp seeking
        const wrapDiff = Math.abs(targetTimeRef.current - lerpedTime);
        if (wrapDiff > span / 2) {
          // Jump directly on wrap-around to prevent trailing reverse/forward sweep lags
          lerpedTime = targetTimeRef.current;
        } else {
          const lerpFactor = 0.22;
          lerpedTime = lerpedTime + (targetTimeRef.current - lerpedTime) * lerpFactor;
        }

        // Apply throttle and seek only the active video element
        const now = Date.now();
        const diff = Math.abs(activeVideo.currentTime - lerpedTime);
        if (diff > 0.02 && !activeVideo.seeking && (now - lastSeekTime > 30)) {
          activeVideo.currentTime = lerpedTime;
          lastSeekTime = now;
        }
      }
      
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      isUnmounted = true;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Dedicated touch & pointer interaction handler for the 3D dumbbell stage
  useEffect(() => {
    if (screen !== "HERO") return;
    const stageEl = dumbbellStageRef.current;
    if (!stageEl) return;

    let isTouchActive = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let isHorizontalGesture: boolean | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      lastX = touch.clientX;
      isHorizontalGesture = null;
      isTouchActive = true;
      isInteractingRef.current = true;
      lastInputTimeRef.current = Date.now();

      const activeVideo = activeVideoIdRef.current === "video1" ? video1Ref.current : video2Ref.current;
      if (activeVideo) {
        targetTimeRef.current = activeVideo.currentTime;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouchActive || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaXTotal = touch.clientX - startX;
      const deltaYTotal = touch.clientY - startY;

      // Determine gesture direction: lock to horizontal rotation if x > y
      if (isHorizontalGesture === null) {
        const absX = Math.abs(deltaXTotal);
        const absY = Math.abs(deltaYTotal);
        if (absX > 6 || absY > 6) {
          if (absX >= absY) {
            isHorizontalGesture = true;
          } else {
            // User intended vertical scroll: let standard page scrolling continue naturally
            isHorizontalGesture = false;
            isTouchActive = false;
            isInteractingRef.current = false;
            return;
          }
        } else {
          return;
        }
      }

      if (isHorizontalGesture) {
        // Prevent default page scroll only while actively scrubbing the 3D dumbbell
        if (e.cancelable) {
          e.preventDefault();
        }

        const activeVideo = activeVideoIdRef.current === "video1" ? video1Ref.current : video2Ref.current;
        if (!activeVideo) return;

        const rawDur = activeVideo.duration;
        const dur = !rawDur || isNaN(rawDur) || rawDur <= 0 ? 5.92 : rawDur;

        const deltaX = touch.clientX - lastX;
        lastX = touch.clientX;
        lastInputTimeRef.current = Date.now();

        // Responsive touch sensitivity: 1.15 provides natural 1:1 tactile rotation matching finger movement
        const TOUCH_SENSITIVITY = 1.15;
        const stageWidth = stageEl.clientWidth || window.innerWidth;
        const timeOffset = (deltaX / stageWidth) * TOUCH_SENSITIVITY * dur;
        let newTarget = targetTimeRef.current + timeOffset;

        const currentStartTrim = startTrimRef.current;
        const currentEndTrim = Math.max(currentStartTrim + 1.0, Math.min(endTrimRef.current, dur - 0.01));
        const span = Math.max(1.0, currentEndTrim - currentStartTrim);

        if (newTarget < currentStartTrim) {
          newTarget = currentEndTrim - ((currentStartTrim - newTarget) % span);
        } else if (newTarget > currentEndTrim) {
          newTarget = currentStartTrim + ((newTarget - currentStartTrim) % span);
        }

        targetTimeRef.current = newTarget;
      }
    };

    const onTouchEnd = () => {
      if (isTouchActive) {
        isTouchActive = false;
        isInteractingRef.current = false;
        lastInputTimeRef.current = Date.now();
      }
      isHorizontalGesture = null;
    };

    // Pointer events for desktop click-drag on the dumbbell stage
    let isPointerDragging = false;
    let lastPointerX = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // Touch is handled by touch events
      isPointerDragging = true;
      lastPointerX = e.clientX;
      isInteractingRef.current = true;
      lastInputTimeRef.current = Date.now();

      const activeVideo = activeVideoIdRef.current === "video1" ? video1Ref.current : video2Ref.current;
      if (activeVideo) {
        targetTimeRef.current = activeVideo.currentTime;
      }
      try {
        stageEl.setPointerCapture(e.pointerId);
      } catch (_) {}
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || !isPointerDragging) return;
      const activeVideo = activeVideoIdRef.current === "video1" ? video1Ref.current : video2Ref.current;
      if (!activeVideo) return;

      const rawDur = activeVideo.duration;
      const dur = !rawDur || isNaN(rawDur) || rawDur <= 0 ? 5.92 : rawDur;

      const deltaX = e.clientX - lastPointerX;
      lastPointerX = e.clientX;
      lastInputTimeRef.current = Date.now();

      const SENSITIVITY = 0.9;
      const stageWidth = stageEl.clientWidth || window.innerWidth;
      const timeOffset = (deltaX / stageWidth) * SENSITIVITY * dur;
      let newTarget = targetTimeRef.current + timeOffset;

      const currentStartTrim = startTrimRef.current;
      const currentEndTrim = Math.max(currentStartTrim + 1.0, Math.min(endTrimRef.current, dur - 0.01));
      const span = Math.max(1.0, currentEndTrim - currentStartTrim);

      if (newTarget < currentStartTrim) {
        newTarget = currentEndTrim - ((currentStartTrim - newTarget) % span);
      } else if (newTarget > currentEndTrim) {
        newTarget = currentStartTrim + ((newTarget - currentStartTrim) % span);
      }

      targetTimeRef.current = newTarget;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isPointerDragging) {
        isPointerDragging = false;
        isInteractingRef.current = false;
        lastInputTimeRef.current = Date.now();
        try {
          stageEl.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    stageEl.addEventListener("touchstart", onTouchStart, { passive: true });
    stageEl.addEventListener("touchmove", onTouchMove, { passive: false });
    stageEl.addEventListener("touchend", onTouchEnd);
    stageEl.addEventListener("touchcancel", onTouchEnd);

    stageEl.addEventListener("pointerdown", onPointerDown);
    stageEl.addEventListener("pointermove", onPointerMove);
    stageEl.addEventListener("pointerup", onPointerUp);
    stageEl.addEventListener("pointercancel", onPointerUp);

    return () => {
      stageEl.removeEventListener("touchstart", onTouchStart);
      stageEl.removeEventListener("touchmove", onTouchMove);
      stageEl.removeEventListener("touchend", onTouchEnd);
      stageEl.removeEventListener("touchcancel", onTouchEnd);

      stageEl.removeEventListener("pointerdown", onPointerDown);
      stageEl.removeEventListener("pointermove", onPointerMove);
      stageEl.removeEventListener("pointerup", onPointerUp);
      stageEl.removeEventListener("pointercancel", onPointerUp);
    };
  }, [screen]);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.isOnboarded) {
              const retrievedProfile: UserProfile = {
                name: data.name || "",
                email: data.email || user.email || "",
                age: data.age || 25,
                gender: data.gender || "Male",
                hasActiveCycle: data.hasActiveCycle || false,
                irregularCycle: data.irregularCycle || false,
                pcosCondition: data.pcosCondition || false,
                weight: data.weight || 70,
                height: data.height || 172,
                bmi: data.bmi || 23.6,
                bmiCategory: data.bmiCategory || "Healthy",
                bmiExplanation: data.bmiExplanation || "",
                fitnessStatus: data.fitnessStatus || "Gym",
                currentSplitDesc: data.currentSplitDesc || "",
                exerciseBarrier: data.exerciseBarrier || "",
                primaryGoal: data.primaryGoal || "Cut",
                roastMessage: data.roastMessage || "",
                dietPreference: data.dietPreference || "Vegetarian",
                currentDietDesc: data.currentDietDesc || "",
                dietFeedback: data.dietFeedback || "",
                proteinTargetLevel: data.proteinTargetLevel || "Recommended",
                proteinTargetGrams: data.proteinTargetGrams || 105,
                calorieTarget: data.calorieTarget || 2000,
                takesWhey: data.takesWhey || false,
                wheyBrand: data.wheyBrand || "",
                wheyDosage: data.wheyDosage || "",
                selectedSupplements: data.selectedSupplements || [],
                cycleLength: data.cycleLength || 28,
                periodDuration: data.periodDuration || 5,
                lastPeriodDate: data.lastPeriodDate || "",
                cycleRegularity: data.cycleRegularity || "Regular",
                pmsSymptoms: data.pmsSymptoms || []
              };
              setProfile(retrievedProfile);
              setScreen("DASHBOARD");
            } else {
              setScreen("ONBOARDING");
            }
          } else {
            setScreen("ONBOARDING");
          }
        } catch (error) {
          console.warn("Error loading user profile:", error);
          setScreen("ONBOARDING");
        }
      } else {
        setCurrentUser(null);
        setProfile(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Splash Screen Timeout
  useEffect(() => {
    if (screen === "SPLASH" && !isLoadingAuth) {
      if (done) {
        const timer = setTimeout(() => {
          if (!currentUser) {
            setScreen("HERO");
          }
        }, 800); // Wait 800ms after typewriter finishes, then elegantly transition
        return () => clearTimeout(timer);
      }
    }
  }, [screen, isLoadingAuth, currentUser, done]);

  const handleGuestLogin = () => {
    const guestProfile: UserProfile = {
      name: "Atharva Patel (Guest)",
      email: "atharvapatell05@gmail.com",
      age: 26,
      gender: "Male",
      hasActiveCycle: false,
      irregularCycle: false,
      pcosCondition: false,
      weight: 78,
      height: 180,
      bmi: 24.1,
      bmiCategory: "Healthy",
      bmiExplanation: "Your BMI of 24.1 resides cleanly within the healthy reference parameters.",
      fitnessStatus: "Gym",
      currentSplitDesc: "Push/Pull/Legs high-intensity split",
      exerciseBarrier: "Inconsistent scheduling from work/studies",
      primaryGoal: "Cut",
      roastMessage: "Your high calorie input is barely offset by standard split regimes. Standardized focus is requested.",
      dietPreference: "Vegetarian",
      currentDietDesc: "High carbs vegetarian meal with dairy proteins",
      dietFeedback: "Protein density is sub-optimal. Recommend adding bioavailable whey isolate.",
      proteinTargetLevel: "Recommended",
      proteinTargetGrams: 140,
      calorieTarget: 2100,
      takesWhey: true,
      wheyBrand: "Optimum Nutrition Gold Standard",
      wheyDosage: "1 scoop (30g) post-workout",
      selectedSupplements: ["Creatine", "Omega 3"],
      cycleLength: 28,
      periodDuration: 5,
      lastPeriodDate: "",
      cycleRegularity: "Regular",
      pmsSymptoms: []
    };
    setProfile(guestProfile);
    setScreen("DASHBOARD");
  };

  // Auth Handler (Login & Signup)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    const emailToUse = authEmail.trim();
    const passwordToUse = authPassword;
    const nameToUse = authName.trim();
    
    if (isSignUp) {
      // Sign Up validation
      if (passwordToUse.length < 6) {
        setAuthError("Password must be at least 6 characters.");
        return;
      }
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, emailToUse, passwordToUse);
        const user = userCredential.user;
        
        // Save name and initial details to Firestore
        await setDoc(doc(db, "users", user.uid), {
          name: nameToUse,
          email: emailToUse,
          isOnboarded: false
        }, { merge: true });
        
        setScreen("ONBOARDING");
      } catch (err: any) {
        console.warn("Signup notice:", err);
        const code = err?.code || "";
        const msg = err?.message || "";
        if (code === "auth/email-already-in-use" || msg.includes("email-already-in-use")) {
          setAuthError("Account already exists. Please login instead.");
        } else if (code === "auth/weak-password" || msg.includes("weak-password")) {
          setAuthError("Password is too weak. Must be at least 6 characters.");
        } else if (code === "auth/invalid-email" || msg.includes("invalid-email")) {
          setAuthError("Invalid email address format.");
        } else if (code === "auth/too-many-requests" || msg.includes("too-many-requests")) {
          setAuthError("SYSTEM LOCKED: Too many signup requests. Please wait a few minutes, or click 'GUEST PASS / DEMO BYPASS' to enter instantly.");
        } else {
          setAuthError("Registration failed. Please verify credentials, or enter via GUEST PASS.");
        }
      }
    } else {
      // Login
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, passwordToUse);
        const user = userCredential.user;
        
        // Load user doc from Firestore to see if onboarded
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.isOnboarded) {
            setScreen("DASHBOARD");
          } else {
            setScreen("ONBOARDING");
          }
        } else {
          setScreen("ONBOARDING");
        }
      } catch (err: any) {
        console.warn("Login notice:", err);
        const code = err?.code || "";
        const msg = err?.message || "";
        if (code === "auth/user-not-found" || msg.includes("user-not-found")) {
          setAuthError("No account found with this email. Please sign up.");
        } else if (code === "auth/too-many-requests" || msg.includes("too-many-requests")) {
          setAuthError("SYSTEM LOCKED: Too many requests. Account temporarily locked by Firebase. Please wait a few minutes, or use 'GUEST PASS / DEMO BYPASS' below to access the command center immediately.");
        } else if (
          code === "auth/wrong-password" || 
          code === "auth/invalid-credential" || 
          msg.includes("wrong-password") || 
          msg.includes("invalid-credential")
        ) {
          setAuthError("INCORRECT CREDENTIALS: Under security protocols, please verify credentials or click 'GUEST PASS / DEMO BYPASS' to instantly bypass the authentication barrier.");
        } else if (code === "auth/invalid-email" || msg.includes("invalid-email")) {
          setAuthError("Invalid email format.");
        } else if (code === "auth/user-disabled" || msg.includes("user-disabled")) {
          setAuthError("This user account has been disabled.");
        } else {
          setAuthError("Login failed. Check your password, sign up, or click 'GUEST PASS / DEMO BYPASS' to bypass.");
        }
      }
    }
  };

  const handleUpdateProfile = async (updated: UserProfile) => {
    setProfile(updated);
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const fieldsToSave: any = {
        name: updated.name || "",
        email: updated.email || "",
        age: updated.age || 25,
        gender: updated.gender || "Male",
        weight: updated.weight || 70,
        height: updated.height || 172,
        bmi: updated.bmi || 23.6,
        bmiCategory: updated.bmiCategory || "Healthy",
        primaryGoal: updated.primaryGoal || "Cut",
        dietPreference: updated.dietPreference || "Vegetarian",
        fitnessStatus: updated.fitnessStatus || "Gym",
        proteinTarget: updated.proteinTargetLevel || "Recommended",
        proteinTargetLevel: updated.proteinTargetLevel || "Recommended",
        proteinTargetGrams: updated.proteinTargetGrams || 105,
        calorieTarget: updated.calorieTarget || 2000,
        takesWhey: updated.takesWhey || false,
        supplements: updated.selectedSupplements || [],
        selectedSupplements: updated.selectedSupplements || [],
        hasActiveCycle: updated.hasActiveCycle || false,
        isOnboarded: true
      };
      
      if (updated.gender === "Female" && updated.hasActiveCycle) {
        fieldsToSave.cycleLength = updated.cycleLength || 28;
        fieldsToSave.periodDuration = updated.periodDuration || 5;
        fieldsToSave.lastPeriodDate = updated.lastPeriodDate || "";
        fieldsToSave.cycleRegularity = updated.cycleRegularity || "Regular";
        fieldsToSave.symptoms = updated.pmsSymptoms || [];
        fieldsToSave.pmsSymptoms = updated.pmsSymptoms || [];
      }
      
      try {
        await setDoc(doc(db, "users", userId), fieldsToSave, { merge: true });
      } catch (err) {
        console.warn("Notice updating user profile in firestore:", err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Logout notice:", err);
    }
    setProfile(null);
    setScreen("LOGIN_SIGNUP");
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setEmailSubmitted(true);
      setTimeout(() => {
        setEmail("");
        setEmailSubmitted(false);
      }, 5000);
    }
  };

  const scrollToFeatures = () => {
    document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div 
      ref={containerRef}
      className={`relative min-h-screen w-full max-w-full bg-[#0A0A0A] text-white flex flex-col overflow-x-hidden font-sans select-none ${
        screen === "HERO" || screen === "LOGIN_SIGNUP" || screen === "DASHBOARD"
          ? "justify-start overflow-y-auto" 
          : "justify-center items-center"
      }`}
      id="scrth-viewport-root"
    >
      {screen === "HERO" && (
        <BubbleMenu
          logo={<span className="font-scrth-main font-bold text-base tracking-[0.2em] text-white">SCRTH</span>}
          items={scrthNavItems}
          menuAriaLabel="Toggle SCRTH navigation"
          menuBg="rgba(18, 18, 18, 0.95)"
          menuContentColor="#FFFFFF"
          useFixedPosition={true}
          animationEase="back.out(1.7)"
          animationDuration={0.45}
          staggerDelay={0.1}
        />
      )}
      {/* Fixed Background Video - Always pinned under layout scroll layer */}
      <motion.div 
        id="video-background-container" 
        style={{ y: parallaxY }}
        className="fixed top-[-15vh] left-0 w-full h-[130vh] overflow-hidden z-0 pointer-events-none"
      >
        <video
          ref={video1Ref}
          id="scrth-video-bg-1"
          autoPlay
          muted
          playsInline
          style={{ opacity: 0.35, transition: `opacity ${fadeDuration}s ease-in-out` }}
          className="absolute inset-0 w-full h-full object-cover"
          src="https://res.cloudinary.com/dwqwbh6mk/video/upload/v1782041968/Dumbbell_360_revolution_horizont__202606211708_iwjson.mp4"
        />
        <video
          ref={video2Ref}
          id="scrth-video-bg-2"
          muted
          playsInline
          style={{ opacity: 0, transition: `opacity ${fadeDuration}s ease-in-out` }}
          className="absolute inset-0 w-full h-full object-cover"
          src="https://res.cloudinary.com/dwqwbh6mk/video/upload/v1782041968/Dumbbell_360_revolution_horizont__202606211708_iwjson.mp4"
        />
        {/* Cinematic matte black overlay for extreme text legibility and contrast */}
        <div 
          id="video-overlay" 
          className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/95 via-[#0A0A0A]/60 to-[#0A0A0A]"
        />
        <div 
          id="video-vignette" 
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(10,10,10,0.95)_100%)]"
        />
      </motion.div>
 
      {/* FLOATING HEADER - Shown on HERO screen */}
      {screen === "HERO" && (
        <motion.header 
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-0 left-0 w-full z-40 bg-[#0A0A0A]/85 backdrop-blur-md border-b border-white/10 py-3.5 sm:py-4 md:py-5 px-4 sm:px-6 md:px-12 flex justify-between items-center"
        >
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#161616] border border-white/20 flex items-center justify-center font-scrth-main text-xs sm:text-sm font-bold text-white shadow-lg shadow-white/5">
                S
              </div>
              <div className="flex flex-col">
                <span className="font-scrth-main text-base sm:text-lg font-bold tracking-[0.2em] text-white leading-tight">SCRTH</span>
                <span className="font-sans text-[7px] sm:text-[8px] text-zinc-400 font-light tracking-[0.24em] uppercase leading-none">START FROM SCRATCH.</span>
              </div>
            </div>
            <span className="h-4 w-[1px] bg-white/20 hidden md:inline-block" />
            <span id="active-modality-val" className="text-[9px] font-sans font-light tracking-[0.3em] text-zinc-400 uppercase hidden md:inline-block">
              CALIBRATING KINETICS...
            </span>
          </div>
          <nav className="flex items-center gap-3 sm:gap-6 md:gap-8 mr-12 sm:mr-16">
            <button 
              onClick={scrollToFeatures}
              className="text-[9px] sm:text-[10px] font-sans font-normal tracking-[0.2em] sm:tracking-[0.3em] uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer hidden sm:inline-block"
            >
              SPECIFICATIONS
            </button>
            <GlassButton 
              onClick={() => setScreen("LOGIN_SIGNUP")}
              variant="secondary"
              className="px-3.5 py-2 sm:px-5 sm:py-3 md:px-7 md:py-3.5 text-[8px] sm:text-[9px] md:text-[10px] whitespace-nowrap"
            >
              START SESSION [↵]
            </GlassButton>
          </nav>
        </motion.header>
      )}
 
      {/* VIEW COMPILATION INTERFACES */}
      <div className={`relative z-10 w-full ${
        screen === "HERO" || screen === "LOGIN_SIGNUP"
          ? "pt-16 sm:pt-20 md:pt-24" 
          : "h-full flex flex-col items-center justify-center py-6 sm:py-8"
      }`}>
        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: SPLASH SCREEN */}
          {screen === "SPLASH" && (
            <motion.div
              key="SPLASH_SCREEN"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center justify-center text-center p-4 sm:p-6 cursor-pointer select-none"
              onClick={() => setScreen(currentUser ? "DASHBOARD" : "HERO")}
              title="Click anywhere to continue"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-none bg-[#141414] border border-white/20 flex items-center justify-center font-scrth-main text-3xl sm:text-4xl font-bold text-white shadow-2xl mb-4 sm:mb-6 relative">
                <div className="absolute top-0 right-0 w-2 h-2 bg-white" />
                S
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-scrth-main font-bold tracking-[0.22em] sm:tracking-[0.25em] bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent uppercase select-none">
                SCRTH
              </h1>
              <p className="font-scrth-main text-xs sm:text-sm md:text-base text-zinc-300 mt-3 sm:mt-4 min-h-[30px] select-none uppercase tracking-[0.28em] sm:tracking-[0.32em] px-4 font-medium">
                {displayed}
                {!done && (
                  <span className="inline-block w-[2px] h-[1.1em] bg-white align-middle ml-[2px] animate-blink" />
                )}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setScreen(currentUser ? "DASHBOARD" : "HERO");
                }}
                className="mt-6 text-[10px] sm:text-[11px] tracking-[0.25em] text-zinc-400 hover:text-white uppercase font-sans border-b border-zinc-700 hover:border-white pb-0.5 transition-colors cursor-pointer"
              >
                Skip Intro →
              </button>
            </motion.div>
          )}

          {/* SCREEN: HERO LANDING PAGE */}
          {screen === "HERO" && (
            <motion.div
              key="HERO_SCREEN"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col"
            >
              {/* SECTION 1: HERO SECTION */}
              <motion.section 
                id="hero-section" 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="min-h-[85vh] w-full flex flex-col justify-center items-start px-4 sm:px-6 md:px-12 lg:px-24 max-w-7xl mx-auto pt-12 sm:pt-16 pb-12 relative overflow-hidden"
              >
                {/* Background ambient glow */}
                <div 
                  id="ambient-backlight"
                  className="absolute left-[15%] sm:left-[30%] top-[40%] -translate-y-1/2 w-[300px] sm:w-[450px] h-[220px] sm:h-[300px] bg-white/[0.03] blur-[100px] rounded-full pointer-events-none transition-all duration-1000 max-w-full"
                  style={{
                    transform: hovered ? "translateY(-50%) scale(1.15)" : "translateY(-50%)"
                  }}
                />

                <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12 relative z-10">
                  <motion.div
                    id="scrth-branding-wrapper"
                    className="relative group cursor-pointer w-full md:max-w-[50%] lg:max-w-[48%] flex flex-col items-start"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {/* Category Pre-header */}
                    <motion.div variants={itemVariants} className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="w-2 h-2 bg-white" />
                      <span className="font-sans text-[9px] sm:text-[10px] tracking-[0.28em] text-zinc-400 uppercase font-light">
                        SELF-DEVELOPMENT // KINETIC DISCIPLINE
                      </span>
                    </motion.div>

                    {/* SCRTH distinctive modern geometric wordmark - balanced medium weight (more than thin, less than thick) */}
                    <motion.div variants={itemVariants} className="w-auto flex items-start">
                      <h1 
                        id="scrth-title"
                        className="text-[34px] min-[380px]:text-[44px] sm:text-[58px] md:text-[70px] lg:text-[82px] font-scrth-main font-medium leading-none select-none transition-all duration-700 relative flex items-baseline tracking-[0.02em] sm:tracking-[0.03em]"
                        style={{
                          textShadow: hovered 
                            ? "0 2px 12px rgba(255,255,255,0.25), 0 4px 20px rgba(0,0,0,0.85)"
                            : "0 2px 8px rgba(0,0,0,0.75)",
                          transform: hovered ? "skewX(-1deg) rotateX(4deg)" : "none",
                          perspective: "1000px"
                        }}
                      >
                        <span className="bg-gradient-to-br from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent hover:brightness-110 duration-300">S</span>
                        <span className="bg-gradient-to-br from-zinc-200 via-white to-zinc-300 bg-clip-text text-transparent hover:brightness-110 duration-300">C</span>
                        <span className="bg-gradient-to-br from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent hover:brightness-110 duration-300">R</span>
                        <span className="bg-gradient-to-br from-zinc-200 via-white to-zinc-300 bg-clip-text text-transparent hover:brightness-110 duration-300">T</span>
                        <span className="bg-gradient-to-br from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent hover:brightness-110 duration-300">H</span>
                        <span className="inline-block w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white ml-1.5 sm:ml-2 mb-1 sm:mb-1.5 align-baseline opacity-90" />
                      </h1>
                    </motion.div>

                    {/* Tagline showing below */}
                    <div className="flex flex-col items-start gap-4 sm:gap-5 mt-3 sm:mt-5 w-full">
                      <motion.div 
                        variants={itemVariants}
                        id="scrth-tagline-wrapper"
                        className="w-fit max-w-full pl-3 pr-4 py-2 sm:pl-3.5 sm:pr-5 sm:py-2.5 transition-all duration-500 rounded-none bg-[#141414]/90 backdrop-blur-md border border-white/10 shadow-2xl inline-block overflow-hidden"
                        style={{
                          letterSpacing: "0.14em",
                          transform: hovered ? "translateX(6px)" : "translateX(0px)"
                        }}
                      >
                        <p 
                          id="scrth-tagline"
                          className="font-scrth-main mb-0 text-white tracking-[0.14em] sm:tracking-[0.16em] select-none uppercase break-words font-semibold"
                          style={{
                            fontSize: "clamp(12px, 3.2vw, 18px)",
                            lineHeight: "1.35",
                            minHeight: "26px"
                          }}
                        >
                          {displayed}
                          {!done && (
                            <span 
                              id="typewriter-cursor"
                              className="inline-block w-[2px] h-[1.1em] bg-white align-middle ml-[2px] animate-blink"
                            />
                          )}
                        </p>
                      </motion.div>

                      <motion.div variants={itemVariants} className="w-full">
                        <BlurText
                          text="Understand yourself, break old habits, and build an uncompromising version of yourself through intentional action. A modern personal growth and self-development platform focused on self-awareness, discipline, and continuous improvement."
                          delay={35}
                          animateBy="words"
                          direction="bottom"
                          className="max-w-xl text-xs sm:text-sm leading-[1.8] sm:leading-[1.9] text-zinc-400 font-sans font-light pr-0 sm:pr-6"
                        />
                      </motion.div>

                      <motion.div
                        variants={itemVariants}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2 w-full sm:w-auto"
                      >
                        <GlassButton 
                          onClick={() => setScreen("LOGIN_SIGNUP")}
                          variant="primary"
                          className="shadow-xl shadow-white/5 w-full sm:w-auto"
                        >
                          START SESSION [ENTER ↵]
                        </GlassButton>
                        <button 
                          onClick={() => document.getElementById("valve-prop")?.scrollIntoView({ behavior: "smooth" })}
                          className="px-4 sm:px-6 py-3.5 sm:py-4 rounded-none border border-transparent hover:border-white/20 font-sans font-normal text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-zinc-400 hover:text-white transition-all duration-300 cursor-pointer text-center"
                        >
                          EXPLORE INTERACTIVITY &darr;
                        </button>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Interactive 3D Dumbbell Stage Container */}
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    ref={dumbbellStageRef}
                    id="interactive-dumbbell-stage"
                    role="region"
                    aria-label="Interactive 3D Dumbbell - Drag or move to rotate"
                    className="w-full md:w-[48%] lg:w-[50%] h-[260px] min-[400px]:h-[300px] sm:h-[360px] md:h-[460px] lg:h-[520px] relative border border-white/10 bg-[#121212]/50 backdrop-blur-[2px] transition-all duration-300 flex flex-col justify-between p-3.5 sm:p-5 select-none cursor-grab active:cursor-grabbing group shadow-2xl shadow-black/60 overflow-hidden"
                    style={{ touchAction: "pan-y" }}
                  >
                    {/* Sleek Tactical Corner Brackets */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/60 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/60 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/60 pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/60 pointer-events-none" />

                    {/* Top Telemetry Header in Stage */}
                    <div className="flex items-center justify-between w-full pointer-events-none z-10">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-platinum-pulse" />
                        <span className="font-sans text-[8px] sm:text-[9px] font-light tracking-[0.25em] text-zinc-300 uppercase">
                          3D ROTATIONAL DUMBBELL
                        </span>
                      </div>
                      <span 
                        id="dumbbell-badge-deg"
                        className="font-scrth-main text-[10px] sm:text-xs font-light tracking-[0.2em] text-white bg-[#0A0A0A]/90 border border-white/20 px-2.5 py-0.5"
                      >
                        0° ROTATION
                      </span>
                    </div>

                    {/* Center Subtle Target Reticle */}
                    <div className="flex flex-col items-center justify-center my-auto pointer-events-none z-10">
                      <div className="relative w-14 h-14 flex items-center justify-center opacity-30 group-hover:opacity-75 transition-opacity duration-300">
                        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
                        <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-white to-transparent" />
                        <div className="w-6 h-6 rounded-full border border-white/40" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </div>

                    {/* Bottom Touch & Drag Guide */}
                    <div className="flex items-center justify-between w-full pointer-events-none pt-2 border-t border-white/10 z-10">
                      <span 
                        id="dumbbell-touch-prompt"
                        className="font-sans text-[8px] sm:text-[9px] font-light tracking-[0.2em] sm:tracking-[0.25em] text-zinc-300 uppercase flex items-center gap-2"
                      >
                        <span className="text-white text-xs animate-pulse">⟵</span>
                        <span id="dumbbell-touch-prompt-text">DRAG TO ROTATE 360°</span>
                        <span className="text-white text-xs animate-pulse">⟶</span>
                      </span>
                      <span className="font-sans text-[7px] sm:text-[8px] tracking-[0.2em] text-zinc-500 uppercase hidden min-[400px]:inline">
                        TOUCH & MOUSE ENABLED
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* Interactive instruction indicator */}
                <div className="mt-8 sm:mt-12 text-[8px] sm:text-[9px] font-sans font-light tracking-[0.25em] sm:tracking-[0.3em] uppercase text-zinc-500 animate-pulse flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="hidden md:inline">MOVE MOUSE OR DRAG HORIZONTALLY TO SCRUB ROTATIONAL PHYSICS</span>
                  <span className="md:hidden">DRAG FINGER HORIZONTALLY ACROSS DUMBBELL TO ROTATE</span>
                </div>
              </motion.section>

              {/* SECTION 2: FEATURES GRID SECTION */}
              <motion.section 
                id="features-section" 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full py-16 sm:py-24 px-4 sm:px-6 md:px-12 lg:px-24 max-w-7xl mx-auto flex flex-col justify-center items-start gap-8 sm:gap-12"
              >
                <div className="flex flex-col items-start gap-2.5 sm:gap-3">
                  <span className="text-[9px] sm:text-[10px] font-sans font-light tracking-[0.3em] text-zinc-400 uppercase block">SPECIFICATIONS // GEARS</span>
                  <BlurText
                    text="BEYOND LIMITATION."
                    delay={100}
                    animateBy="letters"
                    direction="top"
                    className="font-scrth-main text-2xl sm:text-4xl lg:text-5xl font-extralight tracking-[0.16em] sm:tracking-[0.2em] text-white uppercase"
                  />
                  <BlurText
                    text="*Engineered loops constructed for elite stabilization.*"
                    delay={40}
                    animateBy="words"
                    direction="bottom"
                    className="font-scrth-tagline text-base sm:text-xl italic text-zinc-300 font-light mt-1 leading-[1.8] sm:leading-[1.9]"
                  />
                </div>

                <div className="w-full lg:w-[65%] h-[560px] sm:h-[680px] md:h-[810px] mt-6 border border-white/10 bg-[#121212]/80 backdrop-blur-md relative overflow-hidden">
                  <ScrollStack 
                    className="w-full h-full"
                    itemDistance={80}
                    itemScale={0.04}
                    itemStackDistance={25}
                    stackPosition="15%"
                    scaleEndPosition="5%"
                    baseScale={0.88}
                    blurAmount={2}
                    rotationAmount={1.5}
                  >
                    <ScrollStackItem>
                      <div className="flex flex-col items-start gap-5 h-full">
                        <div className="w-12 h-12 rounded-none bg-white/6 border border-white/8 flex items-center justify-center text-[#A8A8A8]">
                          <RotateCw className="w-5 h-5 stroke-[1.5]" />
                        </div>
                        <div className="flex flex-col items-start gap-2">
                          <BlurText
                            text="01 // KINETICS // 360° Rotational Core"
                            delay={30}
                            animateBy="words"
                            direction="top"
                            className="font-sans text-sm font-medium text-white uppercase tracking-wider"
                          />
                          <BlurText
                            text="Unrivaled multidirectional stabilization balance. Dynamically registers angular velocity to distribute gravity forces continuously across stabilizers."
                            delay={15}
                            animateBy="words"
                            direction="bottom"
                            className="font-sans text-sm text-[#A8A8A8] leading-relaxed font-light"
                          />
                        </div>
                      </div>
                    </ScrollStackItem>

                    <ScrollStackItem>
                      <div className="flex flex-col items-start gap-5 h-full">
                        <div className="w-12 h-12 rounded-none bg-white/6 border border-white/8 flex items-center justify-center text-[#A8A8A8]">
                          <Shield className="w-5 h-5 stroke-[1.5]" />
                        </div>
                        <div className="flex flex-col items-start gap-2">
                          <BlurText
                            text="02 // ARMOR // Frosted Armor Gear"
                            delay={30}
                            animateBy="words"
                            direction="top"
                            className="font-sans text-sm font-medium text-white uppercase tracking-wider"
                          />
                          <BlurText
                            text="Constructed from premium silver-steel composite frame with absolute impact dispersal technology, maintaining physical form under high workloads."
                            delay={15}
                            animateBy="words"
                            direction="bottom"
                            className="font-sans text-sm text-[#A8A8A8] leading-relaxed font-light"
                          />
                        </div>
                      </div>
                    </ScrollStackItem>

                    <ScrollStackItem>
                      <div className="flex flex-col items-start gap-5 h-full">
                        <div className="w-12 h-12 rounded-none bg-white/6 border border-white/8 flex items-center justify-center text-[#A8A8A8]">
                          <Flame className="w-5 h-5 stroke-[1.5]" />
                        </div>
                        <div className="flex flex-col items-start gap-2">
                          <BlurText
                            text="03 // FORCE // Tactical Attack Grip"
                            delay={30}
                            animateBy="words"
                            direction="top"
                            className="font-sans text-sm font-medium text-white uppercase tracking-wider"
                          />
                          <BlurText
                            text="Dual-polymer micro-etched grip texture designed for immediate torque transfers during extreme horizontal bursts and deceleration drills."
                            delay={15}
                            animateBy="words"
                            direction="bottom"
                            className="font-sans text-sm text-[#A8A8A8] leading-relaxed font-light"
                          />
                        </div>
                      </div>
                    </ScrollStackItem>
                  </ScrollStack>
                </div>
              </motion.section>

              {/* SECTION 3: VALUE PROPOSITION SECTION WITH DYNAMIC INTERACTIVE TELEMETRY */}
              <motion.section 
                id="valve-prop" 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full py-16 sm:py-24 px-4 sm:px-6 md:px-12 lg:px-24 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent relative"
              >
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
                  
                  {/* Left Column: Visual/Telemetry Dashboard */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="p-4 sm:p-6 md:p-8 rounded-none border border-white/10 bg-[#141414]/90 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 sm:p-4 font-sans text-[8px] sm:text-[9px] text-zinc-400 tracking-widest">
                        SERIES_VERSION // 1.0.4
                      </div>
                      
                      <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
                        <span className="font-sans text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] text-white uppercase">LIVE INTEGRATED TELEMETRY</span>
                      </div>

                      {/* Big Live Rotation degrees updated in RAF */}
                      <div className="py-6 sm:py-8 border-y border-white/10 flex flex-col items-center justify-center gap-1.5 sm:gap-2">
                        <span id="active-deg-val" className="font-scrth-main text-3xl min-[400px]:text-4xl sm:text-5xl md:text-6xl font-light tracking-[0.16em] sm:tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400 text-center">
                          0° ROTATION
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-sans font-light tracking-[0.2em] sm:tracking-[0.3em] text-zinc-400 uppercase mt-1 text-center">
                          Synchronized with Mouse & Touch Gestures
                        </span>
                      </div>

                      <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 sm:gap-6 pt-4 sm:pt-6">
                        <div>
                          <span className="text-[8px] sm:text-[9px] font-sans font-light tracking-[0.25em] sm:tracking-[0.3em] text-zinc-400 block uppercase mb-1">STABILIZER WEIGHT</span>
                          <span className="font-sans text-xs sm:text-sm font-light text-white">10.8 KG FLUID</span>
                        </div>
                        <div>
                          <span className="text-[8px] sm:text-[9px] font-sans font-light tracking-[0.25em] sm:tracking-[0.3em] text-zinc-400 block uppercase mb-1">COEF_RESISTANCE</span>
                          <span className="font-sans text-xs sm:text-sm font-light text-white">SENS_0.8_X</span>
                        </div>
                        <div>
                          <span className="text-[8px] sm:text-[9px] font-sans font-light tracking-[0.25em] sm:tracking-[0.3em] text-zinc-400 block uppercase mb-1">AXIS ALIGNMENT</span>
                          <span className="font-sans text-xs sm:text-sm font-light text-white">HORIZONTAL</span>
                        </div>
                      </div>

                      {/* Simulated telemetry tracking slider */}
                      <div className="mt-6 sm:mt-8 flex flex-col gap-2">
                        <div className="flex justify-between font-sans text-[8px] sm:text-[9px] text-zinc-500 tracking-wider">
                          <span>SECTOR_ALPHA</span>
                          <span className="hidden sm:inline">ROTATIONAL REVOLUTION COORDINATE</span>
                          <span className="sm:hidden">COORDINATE</span>
                          <span>SECTOR_OMEGA</span>
                        </div>
                        <input 
                          type="range" 
                          id="active-progress-slider" 
                          min="0" 
                          max="100" 
                          defaultValue="0" 
                          disabled
                          className="w-full accent-white bg-white/10 h-[2px] rounded-none appearance-none cursor-not-allowed"
                        />
                      </div>

                      {/* Advanced Loop Momentum Calibration panel */}
                      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10 flex flex-col gap-3 sm:gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[9px] sm:text-[10px] font-sans font-normal tracking-[0.18em] sm:tracking-[0.2em] text-white flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-platinum-pulse" />
                            VELOCITY MOMENTUM CALIBRATOR
                          </span>
                          <span id="active-channel-indicator" className="text-[8px] sm:text-[9px] font-sans font-light bg-white/10 text-white px-2 py-0.5 rounded-none border border-white/20 uppercase tracking-[0.2em]">
                            {activeChannel === "CH_1" ? "CHANNEL_1_ACTIVE" : "CHANNEL_2_ACTIVE"}
                          </span>
                        </div>

                        <p className="text-[9px] sm:text-[10px] text-zinc-400 font-sans font-light leading-[1.8] sm:leading-[1.9] uppercase tracking-wider">
                          Fine-tune start/end bounds to eliminate mechanical acceleration/deceleration lag. Select optimized presets below for perfect angular continuity.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-2">
                          {/* Start Trim slider */}
                          <div className="flex flex-col gap-1.5 p-3 rounded-none bg-[#0A0A0A] border border-white/10">
                            <div className="flex justify-between font-sans text-[8px] sm:text-[9px] text-zinc-400">
                              <span>START TRIM</span>
                              <span className="text-white font-bold">{startTrim.toFixed(2)}s</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="2.0" 
                              step="0.01" 
                              value={startTrim} 
                              onChange={(e) => setStartTrim(parseFloat(e.target.value))}
                              className="w-full accent-white bg-white/10 h-2 sm:h-1 rounded-none appearance-none cursor-pointer"
                            />
                          </div>

                          {/* End Trim slider */}
                          <div className="flex flex-col gap-1.5 p-3 rounded-none bg-[#0A0A0A] border border-white/10">
                            <div className="flex justify-between font-sans text-[8px] sm:text-[9px] text-zinc-400">
                              <span>END TRIM</span>
                              <span className="text-white font-bold">{endTrim.toFixed(2)}s</span>
                            </div>
                            <input 
                              type="range" 
                              min="4.0" 
                              max="5.92" 
                              step="0.01" 
                              value={endTrim} 
                              onChange={(e) => setEndTrim(parseFloat(e.target.value))}
                              className="w-full accent-white bg-white/10 h-2 sm:h-1 rounded-none appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Handoff Fade Slider */}
                          <div className="flex flex-col gap-1.5 p-3 rounded-none bg-[#0A0A0A] border border-white/10">
                            <div className="flex justify-between font-sans text-[8px] sm:text-[9px] text-zinc-400">
                              <span>HANDOFF FADE</span>
                              <span className="text-white font-bold">{fadeDuration.toFixed(2)}s</span>
                            </div>
                            <input 
                              type="range" 
                              min="0.0" 
                              max="0.8" 
                              step="0.01" 
                              value={fadeDuration} 
                              onChange={(e) => setFadeDuration(parseFloat(e.target.value))}
                              className="w-full accent-white bg-white/10 h-2 sm:h-1 rounded-none appearance-none cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Calibration presets */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[8px] sm:text-[9px] font-sans font-light text-zinc-500 uppercase mr-1">CALIBRATION PRESETS:</span>
                          <button 
                            onClick={() => {
                              setStartTrim(0.12);
                              setEndTrim(5.82);
                              setFadeDuration(0.08);
                            }}
                            className="px-2 py-1.5 sm:py-1 rounded-none bg-[#141414] text-zinc-300 font-sans font-normal text-[8px] sm:text-[9px] border border-white/15 hover:bg-white hover:text-black transition-all uppercase cursor-pointer"
                          >
                            Hyper-Snappy (0.08s)
                          </button>
                          <button 
                            onClick={() => {
                              setStartTrim(0.20);
                              setEndTrim(5.72);
                              setFadeDuration(0.00);
                            }}
                            className="px-2 py-1.5 sm:py-1 rounded-none bg-[#141414] text-zinc-300 font-sans font-normal text-[8px] sm:text-[9px] border border-white/15 hover:bg-white hover:text-black transition-all uppercase cursor-pointer"
                          >
                            Instant Swap (0ms)
                          </button>
                          <button 
                            onClick={() => {
                              setStartTrim(0.02);
                              setEndTrim(5.90);
                              setFadeDuration(0.40);
                            }}
                            className="px-2 py-1.5 sm:py-1 rounded-none bg-[#141414] text-zinc-300 font-sans font-normal text-[8px] sm:text-[9px] border border-white/15 hover:bg-white hover:text-black transition-all uppercase cursor-pointer"
                          >
                            Smooth Blend (0.4s)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Value Narrative Copy */}
                  <div className="lg:col-span-5 flex flex-col items-start gap-4 sm:gap-6">
                    <BlurText
                      text="THE COUPLING ADVANTAGE // INTUITION"
                      delay={50}
                      animateBy="words"
                      direction="top"
                      className="text-[9px] sm:text-[10px] font-sans font-light tracking-[0.25em] sm:tracking-[0.3em] text-zinc-400 uppercase"
                    />
                    <BlurText
                      text="PHYSICALITY WITH SEAMLESS FEEDBACK"
                      delay={40}
                      animateBy="words"
                      direction="top"
                      className="font-scrth-main text-2xl sm:text-3xl md:text-4xl font-extralight tracking-[0.16em] sm:tracking-[0.2em] text-white uppercase leading-tight"
                    />
                    <BlurText
                      text="*Our rotational series introduces absolute control over vector acceleration.*"
                      delay={30}
                      animateBy="words"
                      direction="bottom"
                      className="font-scrth-tagline text-base sm:text-xl italic text-zinc-300 font-light leading-[1.8] sm:leading-[1.9]"
                    />
                    <BlurText
                      text="Move your mouse or drag on mobile to control the virtual dumbbell backdrop above. The active system measures absolute position offsets in microseconds, delivering seamless transitions between forward acceleration and heavy recoil balancing loops."
                      delay={10}
                      animateBy="words"
                      direction="bottom"
                      className="text-xs sm:text-sm leading-[1.8] sm:leading-[1.9] text-zinc-400 font-sans font-light"
                    />
                    <div className="flex flex-col gap-2.5 sm:gap-3 pt-2">
                      <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs text-white">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-platinum-pulse shrink-0" />
                        <span className="font-sans font-light tracking-[0.15em] sm:tracking-[0.2em]">LATENCY ZERO // DIRECT INPUT HARDWARE</span>
                      </div>
                      <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs text-zinc-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                        <span className="font-sans font-light tracking-[0.15em] sm:tracking-[0.2em]">FLUID DAMPENING STABILIZATION</span>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.section>

              {/* SECTION 3.5: KINETIC DESIGN GALLERY */}
              <motion.section 
                id="gallery-section" 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full py-16 sm:py-24 px-4 sm:px-6 md:px-12 lg:px-24 bg-[#0A0A0A] border-y border-white/10 relative overflow-hidden flex flex-col items-center gap-8 sm:gap-12"
              >
                <div className="flex flex-col items-center text-center gap-2.5 sm:gap-3 max-w-xl px-2">
                  <BlurText
                    text="VISUAL LAB // GALLERY"
                    delay={50}
                    animateBy="words"
                    direction="top"
                    className="text-[9px] sm:text-[10px] font-sans font-light tracking-[0.25em] sm:tracking-[0.3em] text-zinc-400 uppercase"
                  />
                  <BlurText
                    text="CORE KINETIC CONFIGURATIONS"
                    delay={80}
                    animateBy="words"
                    direction="top"
                    className="font-scrth-main text-xl sm:text-2xl md:text-3xl font-extralight tracking-[0.16em] sm:tracking-[0.2em] text-white uppercase"
                  />
                  <BlurText
                    text="*Explore anatomical designs of high-intensity rotational core units. Drag horizontally or scroll to rotate the 3D projection ring.*"
                    delay={25}
                    animateBy="words"
                    direction="bottom"
                    className="font-scrth-tagline text-xs sm:text-sm italic text-zinc-300 font-light leading-[1.8] sm:leading-[1.9]"
                  />
                </div>

                <div className="w-full h-[360px] sm:h-[440px] md:h-[500px] relative border border-white/10 bg-[#141414]/60 backdrop-blur-md overflow-hidden">
                  <CircularGallery
                    bend={3}
                    textColor="#FFFFFF"
                    borderRadius={0}
                    scrollEase={0.03}
                    items={[
                      { image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop", text: "KINETIC SHELL" },
                      { image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop", text: "VELOCITY CORE" },
                      { image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=800&auto=format&fit=crop", text: "TORQUE SYSTEM" },
                      { image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop", text: "INERTIAL ROTOR" },
                      { image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop", text: "VECTOR COUPLING" },
                      { image: "https://images.unsplash.com/photo-1605296867304-46d5465a25f1?q=80&w=800&auto=format&fit=crop", text: "FLUID DAMPENER" }
                    ]}
                  />
                </div>
              </motion.section>

              {/* SECTION 4: CALL TO ACTION SECTION */}
              <motion.section 
                id="cta-section" 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full py-20 sm:py-28 md:py-32 px-4 sm:px-6 md:px-12 lg:px-24 max-w-5xl mx-auto text-center"
              >
                <div 
                  className="p-6 sm:p-10 md:p-16 rounded-none border border-white/10 bg-[#141414]/90 backdrop-blur-2xl shadow-3xl relative overflow-hidden flex flex-col items-center gap-6 sm:gap-8 animate-none"
                >
                  {/* Background lighting flare in container */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-80 h-32 sm:h-40 bg-white/[0.03] blur-[80px] sm:blur-[90px] rounded-full pointer-events-none" />

                  <div className="flex flex-col items-center gap-2.5 sm:gap-3 max-w-xl">
                    <BlurText
                      text="ACCESS_KEY // SYSTEM LAUNCH"
                      delay={50}
                      animateBy="words"
                      direction="top"
                      className="text-[9px] sm:text-[10px] font-sans font-light tracking-[0.25em] sm:tracking-[0.3em] text-zinc-400 uppercase"
                    />
                    <BlurText
                      text="CLAIM YOUR POSITION"
                      delay={40}
                      animateBy="words"
                      direction="top"
                      className="font-scrth-main text-2xl sm:text-4xl lg:text-5xl font-extralight tracking-[0.16em] sm:tracking-[0.2em] text-white uppercase"
                    />
                    <BlurText
                      text="*Slots within elite production loops are strictly managed.*"
                      delay={30}
                      animateBy="words"
                      direction="bottom"
                      className="font-scrth-tagline text-base sm:text-lg italic text-zinc-300 font-light mt-1 leading-[1.8] sm:leading-[1.9]"
                    />
                    <BlurText
                      text="Sign up below to receive absolute access keys, launch specifications, and exclusive hardware priority allotments."
                      delay={15}
                      animateBy="words"
                      direction="bottom"
                      className="text-xs text-zinc-400 font-sans font-light mt-1 sm:mt-2"
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    {!emailSubmitted ? (
                      <motion.form 
                        key="cta-form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleSubscribe}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full max-w-lg relative z-10"
                      >
                        <input 
                          type="email" 
                          required
                          placeholder="ENTER REGISTERED EMAIL" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 sm:px-6 py-3.5 sm:py-4 rounded-none border border-white/20 bg-[#0A0A0A] text-white placeholder-zinc-500 focus:outline-none focus:border-white/60 focus:ring-0 font-sans font-light text-xs tracking-wider transition-all duration-300"
                        />
                        <GlassButton type="submit" variant="primary" className="w-full sm:w-auto whitespace-nowrap py-3.5 sm:py-4">
                          SECURE INTAKE
                        </GlassButton>
                      </motion.form>
                    ) : (
                      <motion.div 
                        key="cta-success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-4 px-6 rounded-none border border-white/20 bg-[#181818] backdrop-blur-md flex flex-col items-center gap-2 max-w-md relative z-10"
                      >
                        <span className="font-sans text-xs text-white tracking-widest uppercase font-bold">
                          [ INTAKE VERIFIED ]
                        </span>
                        <span className="text-xs text-zinc-400 font-sans font-light">
                          Secure transmission sent. Monitor inbox for series key notifications.
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-2 z-10 w-full sm:w-auto">
                    <button
                      onClick={() => setScreen("LOGIN_SIGNUP")}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-none bg-white hover:bg-zinc-200 text-black font-sans font-semibold text-[10px] sm:text-[11px] tracking-[0.25em] sm:tracking-[0.3em] uppercase transition-all duration-300 shadow-xl shadow-white/5 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>LAUNCH SCRTH PORTAL NOW</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>

                  <span className="text-[8px] sm:text-[9px] font-sans font-light tracking-[0.25em] sm:tracking-[0.3em] text-zinc-500 uppercase">
                    CONFIDENTIAL // SCRTH MATRIX REGISTERED
                  </span>
                </div>
              </motion.section>

              {/* FOOTER */}
              <footer className="relative z-10 w-full border-t border-white/10 bg-[#0A0A0A]/90 backdrop-blur-md py-8 sm:py-12 px-4 sm:px-6 md:px-12 lg:px-24">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
                  
                  <div className="flex flex-col items-center md:items-start gap-1 sm:gap-1.5 text-center md:text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#161616] border border-white/20 flex items-center justify-center font-scrth-main text-xs font-bold text-white">
                        S
                      </div>
                      <span className="font-scrth-main text-base sm:text-lg font-bold tracking-[0.2em] text-white">SCRTH</span>
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-sans font-light tracking-[0.25em] sm:tracking-[0.3em] text-zinc-400 uppercase">
                      START FROM SCRATCH.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[9px] sm:text-[10px] font-sans font-light tracking-[0.2em] sm:tracking-[0.3em] text-zinc-500 uppercase">
                    <button 
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} 
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      TOP ^
                    </button>
                    <span>&copy; 2026 SCRTH. ALL RIGHTS RESERVED.</span>
                    <span>START FROM SCRATCH.</span>
                  </div>

                </div>
              </footer>

            </motion.div>
          )}

          {/* SCREEN 2: LOGIN / SIGNUP SCREEN */}
          {screen === "LOGIN_SIGNUP" && (
            <div className="min-h-[85vh] w-full flex flex-col justify-center items-center md:items-start px-4 sm:px-6 md:px-12 lg:px-24 max-w-7xl mx-auto pt-16 sm:pt-20 pb-12 relative">
              <motion.div
                key="LOGIN_SIGNUP_SCREEN"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-[320px] sm:max-w-[340px] p-5 sm:p-6 rounded-none bg-[#141414]/95 border border-white/15 shadow-2xl flex flex-col gap-3.5 backdrop-blur-md"
              >
                <div className="text-center">
                  <span className="text-[8px] font-sans font-light tracking-[0.3em] text-zinc-400 uppercase block">START FROM SCRATCH.</span>
                  <h2 className="text-xl font-scrth-main font-bold tracking-[0.2em] text-white mt-1">SCRTH LAUNCH</h2>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-2.5">
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-0.5"
                    >
                      <label className="text-[8px] font-sans font-light tracking-wider text-zinc-400 block uppercase">Name</label>
                      <input 
                        type="text" 
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="Atharva Patel"
                        className="w-full px-3 py-2 rounded-none bg-[#0A0A0A] border border-white/15 text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-white/50 font-sans font-light min-h-[40px]"
                      />
                    </motion.div>
                  )}

                  <div className="space-y-0.5">
                    <label className="text-[8px] font-sans font-light tracking-wider text-zinc-400 block uppercase">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 rounded-none bg-[#0A0A0A] border border-white/15 text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-white/50 font-sans font-light min-h-[40px]"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[8px] font-sans font-light tracking-wider text-zinc-400 block uppercase">Secret Password</label>
                    <input 
                      type="password" 
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-none bg-[#0A0A0A] border border-white/15 text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-white/50 font-sans font-light min-h-[40px]"
                    />
                  </div>

                  {authError && (
                    <div className="p-2 rounded-none bg-red-500/10 border border-red-500/20 text-red-400 font-sans font-light text-[8px] text-center uppercase tracking-wider">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-none bg-white border-none text-black font-sans font-semibold text-[9px] tracking-[0.3em] uppercase hover:bg-zinc-200 transition-all duration-300 flex items-center justify-center gap-1.5 mt-1.5 shadow-lg shadow-white/5 cursor-pointer min-h-[44px]"
                  >
                    <span>{isSignUp ? "INITIALIZE BINDING" : "ESTABLISH SESSION"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Guest / Demo Bypass Option */}
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink mx-2 text-[7px] text-zinc-500 uppercase tracking-widest font-sans font-light">OR</span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    className="w-full py-3 rounded-none bg-transparent border border-white/20 text-zinc-300 hover:text-white hover:border-white/50 font-sans font-normal text-[9px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group min-h-[44px]"
                  >
                    <span>GUEST PASS / DEMO BYPASS</span>
                    <Sparkles className="w-3.5 h-3.5 text-zinc-300 group-hover:text-white" />
                  </button>
                </form>

                <div className="text-center pt-2 border-t border-white/10 font-sans font-light text-[8px] tracking-wider">
                  <button 
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-white hover:underline font-bold uppercase cursor-pointer"
                  >
                    {isSignUp ? "ALREADY BOUND? LOGIN SECURELY" : "NEW SYSTEM ENTRY? REGISTER SIGN UP"}
                  </button>
                </div>

                {/* Back to Hero Option */}
                <div className="text-center font-sans font-light text-[8px] text-zinc-400 tracking-wider">
                  <button 
                    onClick={() => setScreen("HERO")}
                    className="hover:text-white uppercase cursor-pointer py-1 inline-block"
                  >
                    &larr; BACK TO SPECIFICATIONS
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* SCREEN 3: ONBOARDING DISPATCH CHAT */}
          {screen === "ONBOARDING" && (
            <div className="min-h-[85vh] w-full flex flex-col justify-center items-center md:items-start px-3 sm:px-6 md:px-12 lg:px-24 max-w-7xl mx-auto pt-16 sm:pt-20 pb-12 relative">
              <motion.div
                key="ONBOARDING_SCREEN"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-3xl flex flex-col"
              >
                <Onboarding 
                  fadeDuration={fadeDuration} 
                  userId={currentUser?.uid}
                  onComplete={(completedProfile) => {
                    setProfile(completedProfile);
                    setScreen("DASHBOARD");
                  }}
                />
              </motion.div>
            </div>
          )}

          {/* SCREEN 4: HOME COMMAND CENTER DASHBOARD */}
          {screen === "DASHBOARD" && profile && (
            <motion.div
              key="DASHBOARD_SCREEN"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="w-full min-h-screen flex flex-col items-center gap-10 sm:gap-16 py-8 sm:py-12 px-2.5 sm:px-4 max-w-7xl mx-auto"
            >
              <Dashboard 
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onLogout={handleLogout}
              />

              {/* WorkoutSplit Section */}
              <div className="w-full max-w-4xl mx-auto px-1 sm:px-0">
                <h2 className="font-serif text-2xl sm:text-[32px] text-white mb-4 sm:mb-8 text-center sm:text-left" style={{ fontFamily: "serif" }}>
                  Build Your Split
                </h2>
                <WorkoutSplit />
              </div>

              {/* Ask SCRTH AI Section */}
              <section 
                id="ask-scrth-ai" 
                className="w-full max-w-[780px] mx-auto bg-transparent text-white px-4 py-8 sm:px-8 sm:py-14 md:px-14 md:py-20"
              >
                <div className="mb-2">
                  <span className="font-sans text-[9px] font-light tracking-[0.28em] text-zinc-400 uppercase block">
                    START FROM SCRATCH.
                  </span>
                  <h2 
                    className="text-2xl sm:text-3xl md:text-[36px] font-scrth-main font-bold text-white tracking-wide mt-1" 
                  >
                    Ask SCRTH AI
                  </h2>
                </div>
                <p 
                  className="font-sans text-xs sm:text-[14px] leading-relaxed mb-6 sm:mb-10 text-zinc-400" 
                >
                  Science-backed answers. Personalised for you.
                </p>
                <FitnessChat />
              </section>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}

