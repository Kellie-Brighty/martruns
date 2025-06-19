import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Landing, Dashboard, Onboarding } from "./components";
import { useEffect, useState } from "react";

function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboardingStatus = () => {
      const onboarded = localStorage.getItem("cartRuns_onboarded");
      setIsOnboarded(onboarded === "true");
    };

    // Check initially
    checkOnboardingStatus();

    // Listen for storage changes (when localStorage is updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cartRuns_onboarded") {
        checkOnboardingStatus();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check on location changes (navigation)
    checkOnboardingStatus();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [location.pathname]);

  // Show loading while checking onboarding status
  if (isOnboarded === null) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/onboarding"
        element={
          isOnboarded ? <Navigate to="/dashboard" replace /> : <Onboarding />
        }
      />
      <Route
        path="/dashboard"
        element={
          !isOnboarded ? <Navigate to="/onboarding" replace /> : <Dashboard />
        }
      />
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
