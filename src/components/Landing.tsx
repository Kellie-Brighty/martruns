import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";
import {
  ShoppingCart,
  Sparkles,
  Brain,
  Mic,
  TrendingUp,
  Users,
  ArrowRight,
  ChefHat,
  Apple,
  Coffee,
  Pizza,
  Utensils,
  Star,
  Zap,
  Heart,
  Play,
  
} from "lucide-react";

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { login, currentUser, userProfile, loading: authLoading } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);
  // const [currentFeature, setCurrentFeature] = useState(0);

  const aiMessages = [
    "Hi! I'm Cassie's AI Kitchen Assistant 🧠",
    "I help organize your market runs efficiently ✨",
    "Voice commands, smart suggestions, and more! 🎯",
    "Ready to revolutionize your shopping? 🚀",
  ];

  const features = [
    {
      icon: <Mic className="w-8 h-8" />,
      title: "Voice Commands",
      description: "Just speak what you need - I'll add it to your list",
      color: "from-primary-500 to-primary-600",
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Smart Suggestions",
      description: "AI-powered recommendations based on your patterns",
      color: "from-secondary-500 to-secondary-600",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Price Tracking",
      description: "Monitor spending and get the best deals",
      color: "from-primary-600 to-secondary-500",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Team Sharing",
      description: "Share lists with kitchen staff and assistants",
      color: "from-secondary-600 to-primary-500",
    },
  ];

  useEffect(() => {
    setIsLoaded(true);

    // AI message cycling
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % aiMessages.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, []);

  useEffect(() => {
    if (currentUser && userProfile) {
      if (userProfile.onboardingCompleted) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    }
  }, [currentUser, userProfile, navigate]);

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;

    setIsSigningIn(true);
    try {
      const { isNewUser } = await login();

      if (isNewUser) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsSigningIn(false);
    }
  };

  const startAiDemo = () => {
    setAiSpeaking(true);
    setTimeout(() => setAiSpeaking(false), 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white overflow-hidden font-futuristic relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-400/5 rounded-full blur-2xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Cyber grid */}
        <div className="absolute inset-0 bg-cyber-grid opacity-20"></div>

        {/* Floating food icons */}
        {[Apple, Coffee, Pizza, ChefHat, Utensils].map((Icon, index) => (
          <div
            key={index}
            className="absolute text-primary-500/20 animate-float"
            style={{
              left: `${20 + index * 15}%`,
              top: `${30 + (index % 2) * 40}%`,
              animationDelay: `${index * 0.5}s`,
              fontSize: "2rem",
            }}
          >
            <Icon className="w-8 h-8" />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-xl border-b border-dark-800/50 bg-dark-950/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center rotate-12 hover:rotate-0 transition-transform duration-500">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gradient-rainbow font-cyber">
                MartRuns
              </h1>
              <p className="text-xs text-dark-400 font-sleek hidden sm:block">
                Smart Market Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Debug Button - Remove in production */}
            <button
              onClick={() => {
                localStorage.removeItem("cartRuns_onboarded");
                localStorage.removeItem("cartRuns_userProfile");
                alert(
                  'Onboarding reset! Click "Get Started" to test onboarding again.'
                );
                // Force page reload to update App.tsx state
                window.location.reload();
              }}
              className="btn-icon text-xs flex"
              title="Reset Onboarding (Dev Only)"
            >
              🔄
            </button>

            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="btn-primary flex items-center justify-center space-x-1 sm:space-x-2 group text-sm sm:text-base"
            >
              {isSigningIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Sign in with Google</span>
                  <span className="sm:hidden">Sign In</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
          {/* Left Column - Hero Content */}
          <div
            className={`space-y-8 transform transition-all duration-1000 ${
              isLoaded
                ? "translate-x-0 opacity-100"
                : "-translate-x-10 opacity-0"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-primary-400 font-sleek">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>AI-Powered Kitchen Assistant</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="text-gradient-rainbow font-cyber">Smart</span>
                <br />
                <span className="text-white font-cyber">Market</span>
                <br />
                <span className="text-gradient-primary font-cyber">
                  Experience
                </span>
              </h1>

              <p className="text-xl text-dark-300 font-sleek leading-relaxed max-w-lg">
                Transform your market runs with{" "}
                <span className="text-primary-400 font-semibold">
                  voice commands
                </span>
                ,
                <span className="text-secondary-400 font-semibold">
                  {" "}
                  AI suggestions
                </span>
                , and
                <span className="text-primary-400 font-semibold">
                  {" "}
                  smart organization
                </span>
                . Built specifically for Cassie's kitchen operations.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 group flex items-center justify-center"
              >
                {isSigningIn ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Starting Your Journey...</span>
                  </>
                ) : (
                  <>
                    <span>Start Your Journey</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button
                onClick={startAiDemo}
                className="btn-ghost text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 group flex items-center justify-center"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient-primary font-cyber">
                  100%
                </div>
                <div className="text-sm text-dark-400 font-sleek">
                  Voice Accurate
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient-secondary font-cyber">
                  50%
                </div>
                <div className="text-sm text-dark-400 font-sleek">
                  Time Saved
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient-rainbow font-cyber">
                  ∞
                </div>
                <div className="text-sm text-dark-400 font-sleek">
                  Possibilities
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - AI Assistant Demo */}
          <div
            className={`transform transition-all duration-1000 delay-300 ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="relative">
              {/* AI Assistant Container */}
              <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
                {/* AI Assistant Avatar */}
                <div className="flex items-center justify-center mb-6">
                  <div
                    className={`relative w-32 h-32 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center transition-all duration-500 ${
                      aiSpeaking ? "scale-110 animate-pulse-glow" : ""
                    }`}
                  >
                    <Brain className="w-16 h-16 text-white" />

                    {/* Pulse rings when speaking */}
                    {aiSpeaking && (
                      <>
                        <div className="absolute inset-0 rounded-full border-2 border-primary-500 animate-ping"></div>
                        <div
                          className="absolute inset-0 rounded-full border-2 border-secondary-500 animate-ping"
                          style={{ animationDelay: "0.5s" }}
                        ></div>
                      </>
                    )}
                  </div>
                </div>

                {/* AI Message */}
                <div className="text-center space-y-4">
                  <div className="bg-dark-800/50 rounded-2xl p-4 min-h-[60px] flex items-center justify-center">
                    <p className="text-lg text-gradient-primary font-sleek animate-fade-in">
                      {aiMessages[currentMessage]}
                    </p>
                  </div>

                  <button
                    onClick={startAiDemo}
                    className="voice-button mx-auto"
                  >
                    <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </button>

                  <p className="text-sm text-dark-400 font-sleek">
                    Click to interact with AI
                  </p>
                </div>

                {/* Floating elements */}
                <div className="absolute top-4 right-4 text-primary-400 animate-bounce">
                  <Star className="w-6 h-6" />
                </div>
                <div
                  className="absolute bottom-4 left-4 text-secondary-400 animate-bounce"
                  style={{ animationDelay: "0.5s" }}
                >
                  <Zap className="w-6 h-6" />
                </div>
              </div>

              {/* Food Images Floating Around */}
              <div className="absolute -top-8 -left-8 w-16 h-16 rounded-full overflow-hidden animate-float">
                <img
                  src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=100&h=100&fit=crop&crop=center"
                  alt="Fresh vegetables"
                  className="w-full h-full object-cover"
                />
              </div>

              <div
                className="absolute -top-4 -right-12 w-20 h-20 rounded-full overflow-hidden animate-float"
                style={{ animationDelay: "1s" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop&crop=center"
                  alt="Fresh fruits"
                  className="w-full h-full object-cover"
                />
              </div>

              <div
                className="absolute -bottom-6 -right-8 w-14 h-14 rounded-full overflow-hidden animate-float"
                style={{ animationDelay: "2s" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=100&h=100&fit=crop&crop=center"
                  alt="Fresh bread"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gradient-rainbow font-cyber mb-4">
              Revolutionary Features
            </h2>
            <p className="text-xl text-dark-300 font-sleek max-w-2xl mx-auto">
              Experience the future of kitchen management with our AI-powered
              assistant
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`glass-card-hover p-6 text-center cursor-pointer transform transition-all duration-500 ${
                  hoveredFeature === index ? "scale-105" : ""
                }`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${
                    feature.color
                  } flex items-center justify-center transform ${
                    hoveredFeature === index ? "rotate-12 scale-110" : ""
                  } transition-all duration-300`}
                >
                  {feature.icon}
                </div>

                <h3 className="text-lg font-semibold text-white font-cyber mb-2">
                  {feature.title}
                </h3>

                <p className="text-dark-300 font-sleek">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="glass-card p-12 rounded-3xl bg-gradient-to-r from-primary-500/10 to-secondary-500/10">
            <div className="flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 text-secondary-400 mr-3" />
              <h2 className="text-3xl font-bold text-gradient-rainbow font-cyber">
                Ready to Transform Your Kitchen?
              </h2>
            </div>

            <p className="text-xl text-dark-300 font-sleek mb-8 max-w-2xl mx-auto">
              Join Cassie in revolutionizing market runs with AI-powered
              assistance. Your smart kitchen journey starts here.
            </p>

            <button
              onClick={handleGoogleSignIn}
              className="btn-primary text-lg sm:text-xl px-8 sm:px-12 py-3 sm:py-4 group flex items-center justify-center"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-dark-800/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="text-gradient-rainbow font-cyber font-semibold">
                MartRuns
              </span>
            </div>

            <div className="text-center">
              <p className="text-dark-400 font-sleek">
                Built with{" "}
                <Heart className="w-4 h-4 inline text-secondary-400" /> for
                <span className="text-primary-400 font-semibold">
                  {" "}
                  Cassie
                </span>{" "}
                by
                <span className="text-secondary-400 font-semibold"> Kelly</span>
              </p>
              <p className="text-xs text-dark-500 mt-1">
                © 2024 MartRuns. Revolutionizing kitchen management.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
