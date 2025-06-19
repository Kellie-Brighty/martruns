import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  ChefHat,
  Mic,
  MicOff,
  ArrowRight,
  ChevronLeft,
  Check,
  Volume2,
  Apple,
  CheckSquare,
  Utensils,
  Carrot,
  Fish,
  VolumeX,
} from "lucide-react";

// Type declaration for the CookingAmbience class
declare global {
  interface Window {
    CookingAmbience: new () => {
      init(): Promise<boolean>;
      start(): void;
      stop(): void;
      toggle(): boolean;
    };
  }
}

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  userProfile: {
    name: string;
    experience: string;
    voiceEnabled: boolean;
  };
  completedTasks: string[];
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, updateUserProfile } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);

  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    currentStep: 0,
    totalSteps: 5,
    userProfile: {
      name: "",
      experience: "",
      voiceEnabled: false,
    },
    completedTasks: [],
  });

  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [showCelebration, _setShowCelebration] = useState(false);
  const [userName, setUserName] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  const [voicePermission, setVoicePermission] = useState<
    "pending" | "granted" | "denied"
  >("pending");
  const [demoItems, setDemoItems] = useState([
    { id: "1", name: "2kg Fresh Tomatoes - $8.50", completed: false },
    { id: "2", name: "Free-range Chicken - $15.00", completed: false },
    { id: "3", name: "Basmati Rice 5kg - $12.99", completed: false },
  ]);

  const stepMessages = [
    [
      "Welcome to MartRuns! 🍳",
      "Built for chefs",
      "Streamline your shopping",
      "Let's get started",
    ],
    [
      `Hello ${userName || "Chef"}! 👨‍🍳`,
      "Track ingredients easily",
      "Professional market runs",
      "Time to organize",
    ],
    [
      "Enable voice commands? 🎤",
      "Hands-free convenience",
      "Say ingredients aloud",
      "Speed up shopping",
    ],
    [
      "Tap to check items 📱",
      "Try the demo",
      "Mark as found",
      "Simple and efficient",
    ],
    ["You're all set! 🎉", "Ready to cook", "Time to shop", "Let's begin"],
  ];

  const experienceOptions = [
    {
      id: "beginner",
      label: "New to Cooking",
      icon: "🌱",
      description: "Just starting my culinary journey",
    },
    {
      id: "home-cook",
      label: "Home Cook",
      icon: "🏠",
      description: "I cook regularly for family/friends",
    },
    {
      id: "professional",
      label: "Professional Chef",
      icon: "👨‍🍳",
      description: "I cook professionally",
    },
    {
      id: "cassie",
      label: "I'm Cassie!",
      icon: "⭐",
      description: "The original MartRuns user",
    },
  ];

  // AI message cycling
  useEffect(() => {
    const messageInterval = setInterval(() => {
      const currentStepMessages = stepMessages[onboardingState.currentStep];
      if (currentStepMessages) {
        setCurrentMessage((prev) => (prev + 1) % currentStepMessages.length);
      }
    }, 3000);

    return () => clearInterval(messageInterval);
  }, [onboardingState.currentStep]);

  // AI speaking animation
  const triggerAiSpeech = useCallback(() => {
    setIsAiSpeaking(true);
    setTimeout(() => setIsAiSpeaking(false), 2000);
  }, []);

  // Simple audio control functions
  const playAudio = useCallback(() => {
    console.log("playAudio called", { audioLoaded, audioEnabled });
    if (audioRef.current && audioLoaded) {
      console.log("Attempting to play audio...");
      audioRef.current.volume = 0.15;
      audioRef.current.currentTime = 0; // Reset to beginning
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Audio started successfully");
          })
          .catch((error) => {
            console.log("Audio play failed:", error);
          });
      }
    } else {
      console.log("Cannot play audio - not loaded or not enabled");
    }
  }, [audioLoaded]);

  const pauseAudio = useCallback(() => {
    console.log("pauseAudio called");
    if (audioRef.current) {
      audioRef.current.pause();
      console.log("Audio paused");
    }
  }, []);

  const toggleAudio = useCallback(() => {
    console.log("toggleAudio called", { audioEnabled });
    if (audioEnabled) {
      pauseAudio();
      setAudioEnabled(false);
    } else {
      setAudioEnabled(true);
      // Give state a moment to update, then play
      setTimeout(() => {
        playAudio();
      }, 100);
    }
  }, [audioEnabled, playAudio, pauseAudio]);

  // Initialize audio when component mounts
  useEffect(() => {
    const initAudio = () => {
      if (audioRef.current && audioLoaded && audioEnabled) {
        playAudio();
      }
    };

    // Try to start audio immediately
    initAudio();

    // Also try after user interaction
    const handleInteraction = () => {
      if (audioEnabled && audioLoaded) {
        playAudio();
      }
    };

    document.addEventListener("click", handleInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleInteraction);
      pauseAudio();
    };
  }, [audioLoaded, audioEnabled, playAudio, pauseAudio]);

  const nextStep = useCallback(() => {
    console.log(
      "nextStep called - currentStep:",
      onboardingState.currentStep,
      "totalSteps:",
      onboardingState.totalSteps
    );

    // Safety check: don't go beyond the last step
    if (onboardingState.currentStep >= onboardingState.totalSteps) {
      console.log("Already at final step, completing onboarding");
      // Complete onboarding if we're already at the last step
      localStorage.setItem("martRuns_onboarded", "true");
      localStorage.setItem(
        "martRuns_userProfile",
        JSON.stringify(onboardingState.userProfile)
      );
      navigate("/dashboard");
      return;
    }

    // Normal progression to next step
    const newStep = onboardingState.currentStep + 1;
    console.log("Moving to step:", newStep);

    setOnboardingState((prev) => ({
      ...prev,
      currentStep: newStep,
    }));
    setCurrentMessage(0);
    triggerAiSpeech();
  }, [
    onboardingState.currentStep,
    onboardingState.totalSteps,
    navigate,
    triggerAiSpeech,
    onboardingState.userProfile,
  ]);

  const handleNameSubmit = useCallback(() => {
    if (userName.trim()) {
      setOnboardingState((prev) => ({
        ...prev,
        userProfile: { ...prev.userProfile, name: userName },
      }));
      nextStep();
    }
  }, [userName, nextStep]);

  const handleExperienceSelect = useCallback(
    (experience: string) => {
      setSelectedExperience(experience);
      setOnboardingState((prev) => ({
        ...prev,
        userProfile: { ...prev.userProfile, experience },
      }));
      setTimeout(nextStep, 1000);
    },
    [nextStep]
  );

  const requestVoicePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setVoicePermission("granted");
      setOnboardingState((prev) => ({
        ...prev,
        userProfile: { ...prev.userProfile, voiceEnabled: true },
      }));
      setTimeout(nextStep, 1500);
    } catch (error) {
      setVoicePermission("denied");
      setTimeout(nextStep, 1500);
    }
  }, [nextStep]);

  const handleDemoItemToggle = useCallback(
    (itemId: string) => {
      console.log("handleDemoItemToggle called for item:", itemId);
      setDemoItems((prev) => {
        const updatedItems = prev.map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );

        // Check if all items are completed and move to final step
        if (updatedItems.every((item) => item.completed)) {
          console.log("All demo items completed, calling nextStep in 300ms");
          setTimeout(() => {
            console.log("Timeout fired, calling nextStep now");
            nextStep();
          }, 300); // Small delay to show the final item being checked
        }

        return updatedItems;
      });
    },
    [nextStep]
  );

  // Add previous step function
  const previousStep = useCallback(() => {
    if (onboardingState.currentStep > 0) {
      setOnboardingState((prev) => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
      setCurrentMessage(0);

      // Reset relevant states when going back
      if (onboardingState.currentStep === 3) {
        setVoicePermission("pending");
      }
      if (
        onboardingState.currentStep === 4 ||
        onboardingState.currentStep === 3
      ) {
        setDemoItems([
          { id: "1", name: "2kg Fresh Tomatoes - $8.50", completed: false },
          { id: "2", name: "Free-range Chicken - $15.00", completed: false },
          { id: "3", name: "Basmati Rice 5kg - $12.99", completed: false },
        ]);
      }
    }
  }, [onboardingState.currentStep]);

  const getStepProgress = () => {
    // Simple progress calculation for 5 steps (0-4)
    return (
      (onboardingState.currentStep / (onboardingState.totalSteps - 1)) * 100
    );
  };

  // Add the Firebase completion function with loading state
  const completeOnboarding = useCallback(async () => {
    if (!currentUser) {
      console.error("No authenticated user found");
      return;
    }

    setIsCompletingOnboarding(true);

    try {
      // Use onboarding name if provided, otherwise fall back to Google display name
      const finalDisplayName =
        onboardingState.userProfile.name.trim() ||
        currentUser.displayName ||
        "Chef";

      // Prepare user profile data for Firebase
      const profileData = {
        email: currentUser.email || "",
        displayName: finalDisplayName,
        photoURL: currentUser.photoURL || undefined,
        name: onboardingState.userProfile.name.trim() || finalDisplayName,
        experience: onboardingState.userProfile.experience,
        voiceEnabled: onboardingState.userProfile.voiceEnabled,
        onboardingCompleted: true,
      };

      // Sync to Firebase
      await updateUserProfile(profileData);

      // Keep localStorage for backward compatibility during transition
      localStorage.setItem("martRuns_onboarded", "true");
      localStorage.setItem(
        "martRuns_userProfile",
        JSON.stringify(onboardingState.userProfile)
      );

      navigate("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // Fallback to localStorage only
      localStorage.setItem("martRuns_onboarded", "true");
      localStorage.setItem(
        "martRuns_userProfile",
        JSON.stringify(onboardingState.userProfile)
      );
      navigate("/dashboard");
    } finally {
      setIsCompletingOnboarding(false);
    }
  }, [currentUser, onboardingState.userProfile, updateUserProfile, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 text-white overflow-hidden relative">
      {/* Custom Audio - Your cooking ambience */}
      <audio
        ref={audioRef}
        preload="auto"
        loop
        onLoadedData={() => {
          console.log("Audio loaded successfully");
          setAudioLoaded(true);
          // Try to start audio when loaded and enabled
          if (audioEnabled) {
            setTimeout(() => {
              playAudio();
            }, 500);
          }
        }}
        onCanPlay={() => {
          // Additional trigger for when audio can start playing
          if (audioEnabled && audioRef.current && audioRef.current.paused) {
            playAudio();
          }
        }}
        onError={(e) => {
          console.log("Audio file failed to load:", e);
          setAudioLoaded(false);
        }}
      >
        {/* Add your custom audio file here */}
        <source src="/sound.mp3" type="audio/mpeg" />
        {/* Fallback message */}
        Your browser does not support the audio element.
      </audio>

      {/* Audio Toggle Button */}
      {audioLoaded && (
        <button
          onClick={toggleAudio}
          className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-300"
          title={audioEnabled ? "Mute ambient sounds" : "Enable ambient sounds"}
        >
          {audioEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>
      )}

      {/* Sophisticated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Modern gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] opacity-30"></div>

        {/* Floating success particles */}
        {showCelebration && (
          <>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  fontSize: "1.5rem",
                }}
              >
                ✨
              </div>
            ))}
          </>
        )}
      </div>

      {/* Elegant Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-800/50">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-orange-500 transition-all duration-1000 ease-out shadow-lg"
          style={{ width: `${getStepProgress()}%` }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 py-16">
        {/* Professional Step Indicator with Back Button */}
        <div className="mb-10 w-full max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            {onboardingState.currentStep > 0 && (
              <button
                onClick={previousStep}
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm font-medium-body tracking-wide group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
              </button>
            )}

            {/* Step Indicator */}
            <div className="flex items-center space-x-3 text-slate-400 font-medium-body mx-auto">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm font-semibold">
                {onboardingState.currentStep + 1}
              </div>
              <span className="text-sm tracking-wide">
                of {onboardingState.totalSteps}
              </span>
            </div>

            {/* Placeholder for symmetry */}
            <div className="w-16"></div>
          </div>
        </div>

        {/* Professional Chef Assistant */}
        <div className="mb-12 relative">
          <div
            className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-orange-500 flex items-center justify-center transition-all duration-500 shadow-2xl ${
              isAiSpeaking ? "scale-110" : ""
            }`}
          >
            <div className="absolute inset-2 rounded-full bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
              <ChefHat className="w-20 h-20 sm:w-24 sm:h-24 text-white" />
            </div>

            {/* Professional activity animation */}
            {isAiSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-emerald-400/50 animate-ping"></div>
                <div
                  className="absolute inset-0 rounded-full border-2 border-orange-400/50 animate-ping"
                  style={{ animationDelay: "0.5s" }}
                ></div>
              </>
            )}
          </div>

          {/* Sophisticated floating ingredients */}
          <div className="absolute -top-8 -right-8 w-12 h-12 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 flex items-center justify-center animate-bounce">
            <Carrot className="w-6 h-6 text-emerald-400" />
          </div>
          <div
            className="absolute -bottom-8 -left-8 w-12 h-12 rounded-full bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 flex items-center justify-center animate-bounce"
            style={{ animationDelay: "0.5s" }}
          >
            <Utensils className="w-6 h-6 text-orange-400" />
          </div>
          <div
            className="absolute -top-6 -left-12 w-10 h-10 rounded-full bg-teal-500/20 backdrop-blur-sm border border-teal-500/30 flex items-center justify-center animate-bounce"
            style={{ animationDelay: "1s" }}
          >
            <Apple className="w-5 h-5 text-teal-400" />
          </div>
          <div
            className="absolute -bottom-6 -right-12 w-10 h-10 rounded-full bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 flex items-center justify-center animate-bounce"
            style={{ animationDelay: "1.5s" }}
          >
            <Fish className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        {/* Professional Message Card */}
        <div className="mb-12 text-center">
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 h-[80px] w-full max-w-md mx-auto border border-slate-700/50 shadow-2xl flex items-center justify-center">
            <p className="text-lg sm:text-xl text-transparent bg-gradient-to-r from-emerald-400 to-orange-400 bg-clip-text font-heading animate-fade-in leading-relaxed text-center px-3">
              {stepMessages[onboardingState.currentStep]?.[currentMessage] ||
                ""}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="w-full max-w-lg mx-auto">
          {/* Step 0: Welcome */}
          {onboardingState.currentStep === 0 && (
            <div className="space-y-8 animate-slide-up">
              <div className="text-center space-y-6">
                <h1 className="text-6xl sm:text-7xl font-display text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-orange-400 bg-clip-text mb-6">
                  MartRuns
                </h1>
                <p className="text-slate-300 font-body text-lg leading-relaxed max-w-md mx-auto">
                  Professional market run management designed for culinary
                  excellence
                </p>
              </div>

              <button
                onClick={nextStep}
                className="btn-primary w-full flex items-center justify-center group text-lg font-semibold-body tracking-wide"
              >
                <span>Begin Your Journey</span>
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Step 1: Name Input */}
          {onboardingState.currentStep === 1 && (
            <div className="space-y-8 animate-slide-up">
              <div className="space-y-6">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="What should we call you?"
                  className="w-full text-center text-xl font-heading bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl px-6 py-4 text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 hover:border-slate-500/50"
                  onKeyPress={(e) => e.key === "Enter" && handleNameSubmit()}
                  autoFocus
                />

                <p className="text-center text-sm text-slate-400 font-body">
                  This will be your display name in the app
                  {!userName.trim() && currentUser?.displayName && (
                    <span className="block mt-1">
                      Or we'll use "{currentUser.displayName}" from your Google
                      account
                    </span>
                  )}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {experienceOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleExperienceSelect(option.id)}
                      className={`p-6 rounded-2xl border transition-all duration-300 touch-manipulation ${
                        selectedExperience === option.id
                          ? "bg-emerald-500/20 border-emerald-500/50 scale-105 shadow-xl"
                          : "bg-slate-800/30 border-slate-600/30 hover:border-emerald-500/30 hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="text-3xl mb-3">{option.icon}</div>
                      <div className="text-sm font-semibold-body text-white mb-2">
                        {option.label}
                      </div>
                      <div className="text-xs text-slate-400 font-body leading-relaxed">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {userName.trim() && (
                <button
                  onClick={handleNameSubmit}
                  className="btn-primary w-full flex items-center justify-center group text-lg font-semibold-body tracking-wide"
                >
                  <span>Continue Setup</span>
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          )}

          {/* Step 2: Voice Permission */}
          {onboardingState.currentStep === 2 && (
            <div className="space-y-8 animate-slide-up">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-orange-500 flex items-center justify-center shadow-2xl">
                  <div className="w-20 h-20 rounded-full bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                    {voicePermission === "pending" ? (
                      <MicOff className="w-10 h-10 text-white" />
                    ) : voicePermission === "granted" ? (
                      <Mic className="w-10 h-10 text-white animate-pulse" />
                    ) : (
                      <MicOff className="w-10 h-10 text-white opacity-50" />
                    )}
                  </div>
                </div>

                {voicePermission === "pending" && (
                  <button
                    onClick={requestVoicePermission}
                    className="btn-primary w-full flex items-center justify-center group text-lg font-semibold-body tracking-wide"
                  >
                    <Volume2 className="w-5 h-5 mr-3" />
                    <span>Enable Voice Commands</span>
                  </button>
                )}

                {voicePermission === "granted" && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 flex items-center justify-center">
                      <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-emerald-400 font-semibold-body text-lg">
                      Voice commands ready! 🎉
                    </p>
                  </div>
                )}

                {voicePermission === "denied" && (
                  <div className="text-center space-y-4">
                    <p className="text-slate-300 font-body text-lg leading-relaxed">
                      No worries! Touch controls work perfectly.
                    </p>
                    <p className="text-slate-400 font-body text-sm">
                      Continuing automatically...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Gesture Demo */}
          {onboardingState.currentStep === 3 && (
            <div className="space-y-8 animate-slide-up">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 flex items-center justify-center">
                    <CheckSquare className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-slate-300 font-body text-lg leading-relaxed">
                    Tap items to check them off as you shop
                  </p>
                </div>

                {demoItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer touch-manipulation shadow-lg ${
                      item.completed
                        ? "bg-emerald-500/20 border-emerald-500/50 opacity-75 shadow-emerald-500/20"
                        : "bg-slate-800/40 border-slate-600/40 hover:border-emerald-500/50 hover:bg-slate-800/60"
                    }`}
                    onClick={() => handleDemoItemToggle(item.id)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          item.completed
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-slate-500 hover:border-emerald-500"
                        }`}
                      >
                        {item.completed && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span
                        className={`font-medium-body text-lg ${
                          item.completed
                            ? "line-through text-slate-400"
                            : "text-white"
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Completion */}
          {onboardingState.currentStep === 4 && (
            <div className="space-y-8 animate-slide-up text-center">
              <div className="space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-orange-500 flex items-center justify-center shadow-2xl">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-heading text-transparent bg-gradient-to-r from-emerald-400 to-orange-400 bg-clip-text">
                  All Set!
                </h2>
                <p className="text-slate-300 font-body text-lg">
                  Ready to start shopping, {userName || "Chef"}!
                </p>
              </div>

              <button
                onClick={completeOnboarding}
                disabled={isCompletingOnboarding}
                className="btn-primary w-full flex items-center justify-center group text-lg font-semibold-body tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompletingOnboarding ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span>Setting up your account...</span>
                  </>
                ) : (
                  <>
                    <span>Start Shopping</span>
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Elegant Skip Button */}
        {onboardingState.currentStep > 0 && onboardingState.currentStep < 4 && (
          <button
            onClick={() => {
              localStorage.setItem("martRuns_onboarded", "true");
              navigate("/dashboard");
            }}
            className="mt-12 text-slate-400 hover:text-white transition-colors text-sm font-medium-body tracking-wide hover:underline underline-offset-4"
          >
            Skip onboarding
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
