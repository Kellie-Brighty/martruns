import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";

// Types
export interface MarketItem {
  id: string;
  name: string;
  estimated_price?: number;
  actual_price?: number;
  completed: boolean;
  category: string;
  note?: string; // Optional note when completing item
  createdAt?: any;
  updatedAt?: any;
}

export interface MarketRun {
  id: string;
  title: string;
  date: string;
  scheduledDate?: string; // ISO string for when the run is scheduled
  items: MarketItem[];
  status: "planning" | "shopping" | "completed";
  userId: string;
  createdAt?: any;
  updatedAt?: any;
  totalEstimated: number;
  totalSpent: number;
  completedItems: number;
  totalItems: number;
  budget?: number;
  budgetRemaining?: number;
  budgetExceeded?: boolean;
  notes?: string; // Auto-generated summary from item notes
}

export interface VendorNote {
  id: string;
  userId: string;
  vendorName: string;
  location: string;
  notes: string;
  rating: number;
  lastVisited: any;
  createdAt: any;
}

export interface UserStats {
  totalRuns: number;
  totalSpent: number;
  totalSaved: number;
  completedItems: number;
  lastUpdated?: any;
}

// Market Runs Functions
export const createMarketRun = async (
  userId: string,
  title: string,
  budget?: number,
  scheduledDate?: string
): Promise<string> => {
  try {
    const now = new Date();
    const isScheduled = scheduledDate && new Date(scheduledDate) > now;

    const runRef = await addDoc(collection(db, "marketRuns"), {
      title,
      date: new Date().toLocaleDateString(),
      ...(scheduledDate && { scheduledDate }),
      items: [],
      status: isScheduled ? ("planning" as const) : ("shopping" as const),
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      totalEstimated: 0,
      totalSpent: 0,
      completedItems: 0,
      totalItems: 0,
      ...(budget && {
        budget,
        budgetRemaining: budget,
        budgetExceeded: false,
      }),
    });

    return runRef.id;
  } catch (error) {
    console.error("Error creating market run:", error);
    throw error;
  }
};

export const getUserMarketRuns = async (
  userId: string
): Promise<MarketRun[]> => {
  try {
    const runsQuery = query(
      collection(db, "marketRuns"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const snapshot = await getDocs(runsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as MarketRun[];
  } catch (error) {
    console.error("Error getting user market runs:", error);
    throw error;
  }
};

export const getMarketRun = async (
  runId: string
): Promise<MarketRun | null> => {
  try {
    const runDoc = await getDoc(doc(db, "marketRuns", runId));
    if (runDoc.exists()) {
      return {
        id: runDoc.id,
        ...runDoc.data(),
      } as MarketRun;
    }
    return null;
  } catch (error) {
    console.error("Error getting market run:", error);
    throw error;
  }
};

export const updateMarketRun = async (
  runId: string,
  updates: Partial<MarketRun>
): Promise<void> => {
  try {
    const runRef = doc(db, "marketRuns", runId);
    await updateDoc(runRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating market run:", error);
    throw error;
  }
};

export const deleteMarketRun = async (runId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "marketRuns", runId));
  } catch (error) {
    console.error("Error deleting market run:", error);
    throw error;
  }
};

// Market Items Functions
export const addItemToRun = async (
  runId: string,
  item: Omit<MarketItem, "id" | "createdAt" | "updatedAt">
): Promise<void> => {
  try {
    const runRef = doc(db, "marketRuns", runId);
    const runDoc = await getDoc(runRef);

    if (!runDoc.exists()) {
      throw new Error("Market run not found");
    }

    const runData = runDoc.data() as MarketRun;
    const newItem: MarketItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedItems = [...runData.items, newItem];
    const stats = calculateRunStats(updatedItems, runData.budget);

    await updateDoc(runRef, {
      items: updatedItems,
      ...stats,
      updatedAt: serverTimestamp(),
    });

    // Update user stats
    await updateUserStats(runData.userId);
  } catch (error) {
    console.error("Error adding item to run:", error);
    throw error;
  }
};

export const updateItemInRun = async (
  runId: string,
  itemId: string,
  updates: Partial<MarketItem>
): Promise<void> => {
  try {
    const runRef = doc(db, "marketRuns", runId);
    const runDoc = await getDoc(runRef);

    if (!runDoc.exists()) {
      throw new Error("Market run not found");
    }

    const runData = runDoc.data() as MarketRun;
    const updatedItems = runData.items.map((item) =>
      item.id === itemId ? { ...item, ...updates, updatedAt: new Date() } : item
    );

    const stats = calculateRunStats(updatedItems, runData.budget);

    await updateDoc(runRef, {
      items: updatedItems,
      ...stats,
      updatedAt: serverTimestamp(),
    });

    // Update user stats
    await updateUserStats(runData.userId);
  } catch (error) {
    console.error("Error updating item in run:", error);
    throw error;
  }
};

export const removeItemFromRun = async (
  runId: string,
  itemId: string
): Promise<void> => {
  try {
    const runRef = doc(db, "marketRuns", runId);
    const runDoc = await getDoc(runRef);

    if (!runDoc.exists()) {
      throw new Error("Market run not found");
    }

    const runData = runDoc.data() as MarketRun;
    const updatedItems = runData.items.filter((item) => item.id !== itemId);
    const stats = calculateRunStats(updatedItems, runData.budget);

    await updateDoc(runRef, {
      items: updatedItems,
      ...stats,
      updatedAt: serverTimestamp(),
    });

    // Update user stats
    await updateUserStats(runData.userId);
  } catch (error) {
    console.error("Error removing item from run:", error);
    throw error;
  }
};

// Real-time listeners
export const subscribeToUserMarketRuns = (
  userId: string,
  callback: (runs: MarketRun[]) => void
): (() => void) => {
  const runsQuery = query(
    collection(db, "marketRuns"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(
    runsQuery,
    (snapshot) => {
      const runs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MarketRun[];
      callback(runs);
    },
    (error) => {
      console.error("Error in market runs subscription:", error);
    }
  );
};

export const subscribeToMarketRun = (
  runId: string,
  callback: (run: MarketRun | null) => void
): (() => void) => {
  return onSnapshot(
    doc(db, "marketRuns", runId),
    (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data(),
        } as MarketRun);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Error in market run subscription:", error);
    }
  );
};

// User Statistics Functions
export const getUserStats = async (
  userId: string
): Promise<UserStats | null> => {
  try {
    const statsDoc = await getDoc(doc(db, "userStats", userId));
    if (statsDoc.exists()) {
      return statsDoc.data() as UserStats;
    }
    return null;
  } catch (error) {
    console.error("Error getting user stats:", error);
    return null;
  }
};

export const subscribeToUserStats = (
  userId: string,
  callback: (stats: UserStats | null) => void
): (() => void) => {
  return onSnapshot(
    doc(db, "userStats", userId),
    (doc) => {
      if (doc.exists()) {
        callback(doc.data() as UserStats);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Error in user stats subscription:", error);
    }
  );
};

// Helper Functions
const calculateRunStats = (items: MarketItem[], currentBudget?: number) => {
  const totalEstimated = items.reduce(
    (sum, item) => sum + (item.estimated_price || 0),
    0
  );
  const totalSpent = items.reduce(
    (sum, item) => sum + (item.actual_price || item.estimated_price || 0),
    0
  );
  const completedItems = items.filter((item) => item.completed).length;
  const totalItems = items.length;

  const stats = {
    totalEstimated,
    totalSpent,
    completedItems,
    totalItems,
  };

  // Add budget calculations if budget is set
  if (currentBudget !== undefined) {
    const budgetRemaining = currentBudget - totalEstimated;
    const budgetExceeded = totalEstimated > currentBudget;

    return {
      ...stats,
      budgetRemaining,
      budgetExceeded,
    };
  }

  return stats;
};

const updateUserStats = async (userId: string): Promise<void> => {
  try {
    const runsQuery = query(
      collection(db, "marketRuns"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(runsQuery);
    const runs = snapshot.docs.map((doc) => doc.data() as MarketRun);

    const stats: UserStats = {
      totalRuns: runs.length,
      totalSpent: runs.reduce((sum, run) => sum + (run.totalSpent || 0), 0),
      totalSaved: runs.reduce(
        (sum, run) => sum + ((run.totalEstimated || 0) - (run.totalSpent || 0)),
        0
      ),
      completedItems: runs.reduce(
        (sum, run) => sum + (run.completedItems || 0),
        0
      ),
      lastUpdated: serverTimestamp(),
    };

    await setDoc(doc(db, "userStats", userId), stats, { merge: true });
  } catch (error) {
    console.error("Error updating user stats:", error);
  }
};

// Helper function to generate run summary from item notes
const generateRunSummary = (items: MarketItem[]): string => {
  const itemsWithNotes = items.filter((item) => item.note && item.note.trim());

  if (itemsWithNotes.length === 0) {
    return "Shopping completed successfully! No specific notes were added.";
  }

  let summary = "Shopping Summary:\n\n";

  // Group notes by sentiment/type
  const positiveKeywords = [
    "great",
    "good",
    "excellent",
    "fresh",
    "quality",
    "cheap",
    "deal",
    "perfect",
  ];
  const negativeKeywords = [
    "expensive",
    "poor",
    "bad",
    "old",
    "spoiled",
    "overpriced",
    "unavailable",
    "out of stock",
  ];

  const positiveNotes: string[] = [];
  const negativeNotes: string[] = [];
  const neutralNotes: string[] = [];

  itemsWithNotes.forEach((item) => {
    const note = item.note!.toLowerCase();
    const hasPositive = positiveKeywords.some((keyword) =>
      note.includes(keyword)
    );
    const hasNegative = negativeKeywords.some((keyword) =>
      note.includes(keyword)
    );

    const noteEntry = `• ${item.name}: ${item.note}`;

    if (hasPositive && !hasNegative) {
      positiveNotes.push(noteEntry);
    } else if (hasNegative && !hasPositive) {
      negativeNotes.push(noteEntry);
    } else {
      neutralNotes.push(noteEntry);
    }
  });

  // Build summary sections
  if (positiveNotes.length > 0) {
    summary += "✅ Highlights:\n" + positiveNotes.join("\n") + "\n\n";
  }

  if (negativeNotes.length > 0) {
    summary +=
      "⚠️ Notes for improvement:\n" + negativeNotes.join("\n") + "\n\n";
  }

  if (neutralNotes.length > 0) {
    summary += "📝 General observations:\n" + neutralNotes.join("\n") + "\n\n";
  }

  summary += `Total items with notes: ${itemsWithNotes.length}/${items.length}`;

  return summary.trim();
};

// Batch operations for performance
export const completeMarketRun = async (runId: string): Promise<void> => {
  try {
    // Get the current run to access items and generate summary
    const currentRun = await getMarketRun(runId);
    if (!currentRun) {
      throw new Error("Market run not found");
    }

    // Generate summary from item notes
    const summary = generateRunSummary(currentRun.items);

    const batch = writeBatch(db);
    const runRef = doc(db, "marketRuns", runId);

    batch.update(runRef, {
      status: "completed",
      notes: summary,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    console.error("Error completing market run:", error);
    throw error;
  }
};

export const duplicateMarketRun = async (
  runId: string,
  userId: string,
  title: string
): Promise<string> => {
  try {
    const originalRun = await getMarketRun(runId);
    if (!originalRun) {
      throw new Error("Original market run not found");
    }

    // Reset all items to incomplete
    const resetItems = originalRun.items.map((item) => ({
      ...item,
      completed: false,
      actual_price: undefined,
      id: Date.now().toString() + Math.random(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const newRunRef = await addDoc(collection(db, "marketRuns"), {
      title,
      date: new Date().toLocaleDateString(),
      items: resetItems,
      status: "planning" as const,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...calculateRunStats(resetItems, originalRun.budget),
    });

    return newRunRef.id;
  } catch (error) {
    console.error("Error duplicating market run:", error);
    throw error;
  }
};

// Vendor Notes Services
export const vendorNotesService = {
  // Add vendor note
  add: async (
    user: User,
    noteData: {
      vendorName: string;
      location: string;
      notes: string;
      rating: number;
    }
  ): Promise<string> => {
    const note = {
      userId: user.uid,
      ...noteData,
      lastVisited: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "vendorNotes"), note);
    return docRef.id;
  },

  // Subscribe to user's vendor notes
  subscribe: (
    userId: string,
    callback: (notes: VendorNote[]) => void
  ): (() => void) => {
    const q = query(
      collection(db, "vendorNotes"),
      where("userId", "==", userId),
      orderBy("lastVisited", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as VendorNote[];
      callback(notes);
    });
  },
};

// Analytics helpers
export const analyticsService = {
  // Get spending analytics for user
  getSpendingAnalytics: async () => {
    // Implementation for analytics
    return {
      totalSpent: 0,
      totalSaved: 0,
      averageRunCost: 0,
      completedRuns: 0,
    };
  },

  // Get popular items for user
  getPopularItems: async () => {
    // Implementation for popular items
    return [];
  },
};

// Helper function to check and update run status based on scheduled time
export const updateRunStatusBasedOnSchedule = async (
  run: MarketRun
): Promise<void> => {
  if (!run.scheduledDate || run.status === "completed") return;

  const now = new Date();
  const scheduledTime = new Date(run.scheduledDate);

  // If scheduled time has passed and run is still in planning, move to shopping
  if (scheduledTime <= now && run.status === "planning") {
    await updateMarketRun(run.id, { status: "shopping" });
  }
};

// Helper function to check if a run is scheduled for the future
export const isRunScheduledForFuture = (run: MarketRun): boolean => {
  if (!run.scheduledDate) return false;
  return new Date(run.scheduledDate) > new Date();
};

// Helper function to get run display status
export const getRunDisplayStatus = (run: MarketRun): string => {
  if (run.status === "completed") return "completed";
  if (run.status === "shopping") return "shopping";
  if (run.scheduledDate && isRunScheduledForFuture(run)) return "scheduled";
  return "planning";
};
