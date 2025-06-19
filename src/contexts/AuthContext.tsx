import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  signInWithGoogle,
  signOutUser,
  onAuthStateChange,
  getUserProfile,
  createUserProfile,
} from "../lib/firebase";
import type { UserProfile } from "../lib/firebase";

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: () => Promise<{ user: User; isNewUser: boolean }>;
  logout: () => Promise<void>;
  updateUserProfile: (
    profileData: Omit<UserProfile, "uid" | "createdAt" | "lastLogin">
  ) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to load user profile
  const loadUserProfile = async (user: User) => {
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading user profile:", error);
      setUserProfile(null);
    }
  };

  // Function to refresh user profile
  const refreshUserProfile = async () => {
    if (currentUser) {
      await loadUserProfile(currentUser);
    }
  };

  // Login function
  const login = async () => {
    try {
      const result = await signInWithGoogle();
      // The auth state change will handle setting the user
      return result;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOutUser();
      setUserProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Update user profile function
  const updateUserProfile = async (
    profileData: Omit<UserProfile, "uid" | "createdAt" | "lastLogin">
  ) => {
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    try {
      await createUserProfile(currentUser.uid, profileData);
      await refreshUserProfile();
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  // Auth state effect
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);

      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Session management - ensure only one session
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && currentUser) {
        // Check if user is still authenticated when tab becomes visible
        // This helps detect if user signed out from another tab
        refreshUserProfile();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      // Listen for logout events from other tabs
      if (e.key === "firebase:authUser:logout" && e.newValue === "true") {
        logout();
        localStorage.removeItem("firebase:authUser:logout");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [currentUser]);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    logout,
    updateUserProfile,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
