import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { MarketRun, MarketItem, UserStats } from "../lib/firestore";
import {
  subscribeToUserMarketRuns,
  subscribeToMarketRun,
  subscribeToUserStats,
  createMarketRun,
  addItemToRun,
  updateItemInRun,
  removeItemFromRun,
  updateMarketRun,
  deleteMarketRun,
  completeMarketRun,
  duplicateMarketRun,
  
} from "../lib/firestore";

interface UseMarketRunsReturn {
  // Data
  marketRuns: MarketRun[];
  currentRun: MarketRun | null;
  userStats: UserStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  createNewRun: (title: string, budget?: number, scheduledDate?: string) => Promise<string>;
  setCurrentRunId: (runId: string | null) => void;
  addItem: (
    item: Omit<MarketItem, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<MarketItem>) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  toggleItemComplete: (itemId: string) => Promise<void>;
  updateRun: (updates: Partial<MarketRun>) => Promise<void>;
  deleteRun: (runId: string) => Promise<void>;
  completeRun: (runId: string) => Promise<void>;
  duplicateRun: (runId: string, title: string) => Promise<string>;

  // Computed values
  currentRunStats: {
    completedItems: number;
    totalItems: number;
    progress: number;
    totalEstimated: number;
    totalSpent: number;
    savedAmount: number;
    budget?: number;
    budgetRemaining?: number;
    budgetExceeded?: boolean;
    budgetUsagePercentage?: number;
  };
}

export const useMarketRuns = (): UseMarketRunsReturn => {
  const { currentUser } = useAuth();
  const [marketRuns, setMarketRuns] = useState<MarketRun[]>([]);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<MarketRun | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-select first run if none selected
  useEffect(() => {
    if (!currentRunId && marketRuns.length > 0) {
      const activeRun =
        marketRuns.find((run) => run.status !== "completed") || marketRuns[0];
      if (activeRun) {
        setCurrentRunId(activeRun.id);
      }
    }
  }, [marketRuns, currentRunId]);

  // Subscribe to user's market runs
  useEffect(() => {
    if (!currentUser) {
      setMarketRuns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToUserMarketRuns(currentUser.uid, (runs) => {
      setMarketRuns(runs);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Subscribe to current run
  useEffect(() => {
    if (!currentRunId) {
      setCurrentRun(null);
      return;
    }

    const unsubscribe = subscribeToMarketRun(currentRunId, (run) => {
      setCurrentRun(run);
    });

    return unsubscribe;
  }, [currentRunId]);

  // Subscribe to user stats
  useEffect(() => {
    if (!currentUser) {
      setUserStats(null);
      return;
    }

    const unsubscribe = subscribeToUserStats(currentUser.uid, (stats) => {
      setUserStats(stats);
    });

    return unsubscribe;
  }, [currentUser]);

  // Actions
  const createNewRun = useCallback(
    async (title: string, budget?: number, scheduledDate?: string): Promise<string> => {
      if (!currentUser) throw new Error("User not authenticated");

      try {
        const runId = await createMarketRun(currentUser.uid, title, budget, scheduledDate);
        setCurrentRunId(runId);
        return runId;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create market run";
        setError(errorMessage);
        throw err;
      }
    },
    [currentUser]
  );

  const setCurrentRunIdSafe = useCallback((runId: string | null) => {
    setCurrentRunId(runId);
  }, []);

  const addItem = useCallback(
    async (
      item: Omit<MarketItem, "id" | "createdAt" | "updatedAt">
    ): Promise<void> => {
      try {
        // If no current run exists, create one first
        let runIdToUse = currentRunId;
        if (!runIdToUse && currentUser) {
          const title = `Market Run - ${new Date().toLocaleDateString()}`;
          runIdToUse = await createMarketRun(currentUser.uid, title);
          setCurrentRunId(runIdToUse);
        }

        if (!runIdToUse) throw new Error("No active market run");

        await addItemToRun(runIdToUse, item);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add item";
        setError(errorMessage);
        throw err;
      }
    },
    [currentRunId, currentUser]
  );

  const updateItem = useCallback(
    async (itemId: string, updates: Partial<MarketItem>): Promise<void> => {
      if (!currentRunId) throw new Error("No active market run");

      try {
        await updateItemInRun(currentRunId, itemId, updates);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update item";
        setError(errorMessage);
        throw err;
      }
    },
    [currentRunId]
  );

  const removeItem = useCallback(
    async (itemId: string): Promise<void> => {
      if (!currentRunId) throw new Error("No active market run");

      try {
        await removeItemFromRun(currentRunId, itemId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to remove item";
        setError(errorMessage);
        throw err;
      }
    },
    [currentRunId]
  );

  const toggleItemComplete = useCallback(
    async (itemId: string): Promise<void> => {
      if (!currentRun) throw new Error("No active market run");

      const item = currentRun.items.find((i) => i.id === itemId);
      if (!item) throw new Error("Item not found");

      try {
        await updateItem(itemId, { completed: !item.completed });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to toggle item";
        setError(errorMessage);
        throw err;
      }
    },
    [currentRun, updateItem]
  );

  const updateRun = useCallback(
    async (updates: Partial<MarketRun>): Promise<void> => {
      if (!currentRunId) throw new Error("No active market run");

      try {
        await updateMarketRun(currentRunId, updates);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update market run";
        setError(errorMessage);
        throw err;
      }
    },
    [currentRunId]
  );

  const deleteRun = useCallback(
    async (runId: string): Promise<void> => {
      try {
        await deleteMarketRun(runId);
        if (currentRunId === runId) {
          setCurrentRunId(null);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete market run";
        setError(errorMessage);
        throw err;
      }
    },
    [currentRunId]
  );

  const completeRun = useCallback(async (runId: string): Promise<void> => {
    try {
      await completeMarketRun(runId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to complete market run";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const duplicateRun = useCallback(
    async (runId: string, title: string): Promise<string> => {
      if (!currentUser) throw new Error("User not authenticated");

      try {
        const newRunId = await duplicateMarketRun(
          runId,
          currentUser.uid,
          title
        );
        setCurrentRunId(newRunId);
        return newRunId;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to duplicate market run";
        setError(errorMessage);
        throw err;
      }
    },
    [currentUser]
  );

  // Computed values
  const currentRunStats = useMemo(() => {
    if (!currentRun) {
      return {
        completedItems: 0,
        totalItems: 0,
        progress: 0,
        totalEstimated: 0,
        totalSpent: 0,
        savedAmount: 0,
      };
    }

    const completedItems = currentRun.items.filter(
      (item) => item.completed
    ).length;
    const totalItems = currentRun.items.length;
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    const totalEstimated = currentRun.items.reduce(
      (sum, item) => sum + (item.estimated_price || 0),
      0
    );

    const totalSpent = currentRun.items.reduce(
      (sum, item) => sum + (item.actual_price || item.estimated_price || 0),
      0
    );

    const savedAmount = totalEstimated - totalSpent;

    const baseStats = {
      completedItems,
      totalItems,
      progress,
      totalEstimated,
      totalSpent,
      savedAmount,
    };

    // Add budget calculations if budget is set
    if (currentRun.budget !== undefined) {
      const budgetRemaining = currentRun.budget - totalEstimated;
      const budgetExceeded = totalEstimated > currentRun.budget;
      const budgetUsagePercentage =
        currentRun.budget > 0 ? (totalEstimated / currentRun.budget) * 100 : 0;

      return {
        ...baseStats,
        budget: currentRun.budget,
        budgetRemaining,
        budgetExceeded,
        budgetUsagePercentage,
      };
    }

    return baseStats;
  }, [currentRun]);

  return {
    // Data
    marketRuns,
    currentRun,
    userStats,
    loading,
    error,

    // Actions
    createNewRun,
    setCurrentRunId: setCurrentRunIdSafe,
    addItem,
    updateItem,
    removeItem,
    toggleItemComplete,
    updateRun,
    deleteRun,
    completeRun,
    duplicateRun,

    // Computed values
    currentRunStats,
  };
};

// Hook for current active market run
export const useCurrentRun = () => {
  const { marketRuns } = useMarketRuns();

  // Get the most recent active run (planning or shopping status)
  const currentRun =
    marketRuns.find(
      (run) => run.status === "planning" || run.status === "shopping"
    ) ||
    marketRuns[0] ||
    null;

  return currentRun;
};
