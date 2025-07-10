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
import type {
  VoiceCommand,
  CommandResponse,
} from "../services/CommandProcessor";

interface UseMarketRunsReturn {
  // Data
  marketRuns: MarketRun[];
  currentRun: MarketRun | null;
  userStats: UserStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  createNewRun: (
    title: string,
    budget?: number,
    scheduledDate?: string
  ) => Promise<string>;
  setCurrentRunId: (runId: string | null) => void;
  addItem: (
    item: Omit<MarketItem, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<MarketItem>) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  toggleItemComplete: (itemId: string) => Promise<void>;
  toggleItemCompleteWithNote: (itemId: string, note?: string) => Promise<void>;
  updateRun: (updates: Partial<MarketRun>) => Promise<void>;
  deleteRun: (runId: string) => Promise<void>;
  completeRun: (runId: string) => Promise<void>;
  duplicateRun: (runId: string, title: string) => Promise<string>;
  handleVoiceCommand: (command: VoiceCommand) => Promise<CommandResponse>;

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
    async (
      title: string,
      budget?: number,
      scheduledDate?: string
    ): Promise<string> => {
      if (!currentUser) throw new Error("User not authenticated");

      try {
        const runId = await createMarketRun(
          currentUser.uid,
          title,
          budget,
          scheduledDate
        );
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

  const toggleItemCompleteWithNote = useCallback(
    async (itemId: string, note?: string): Promise<void> => {
      if (!currentRun) throw new Error("No active market run");

      const item = currentRun.items.find((i) => i.id === itemId);
      if (!item) throw new Error("Item not found");

      try {
        const updates: Partial<MarketItem> = {
          completed: !item.completed,
        };

        // Only add note if item is being completed (not unchecked) and note is provided
        if (!item.completed && note && note.trim()) {
          updates.note = note.trim();
        }

        await updateItem(itemId, updates);
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

  // Voice command handler
  const handleVoiceCommand = useCallback(
    async (command: VoiceCommand): Promise<CommandResponse> => {
      try {
        switch (command.intent) {
          case "create_run":
            if (!command.entity) {
              return { success: false, message: "Please specify a run title" };
            }
            const runId = await createNewRun(command.entity, command.amount);
            return {
              success: true,
              message: `Created "${command.entity}"${
                command.amount ? ` with budget $${command.amount}` : ""
              }`,
              data: { runId },
            };

          case "add_item":
            if (!command.entity) {
              return { success: false, message: "Please specify an item name" };
            }
            const newItem: Omit<MarketItem, "id" | "createdAt" | "updatedAt"> =
              {
                name: command.entity,
                category: "other",
                completed: false,
                ...(command.amount && { estimated_price: command.amount }),
              };
            await addItem(newItem);
            return {
              success: true,
              message: `Added ${command.entity} to your list`,
              data: { item: newItem },
            };

          case "complete_item":
            if (!command.entity) {
              return { success: false, message: "Please specify an item name" };
            }
            if (!currentRun) {
              return {
                success: false,
                message: "No active shopping list found",
              };
            }
            const itemToComplete = currentRun.items.find((item) =>
              item.name.toLowerCase().includes(command.entity!.toLowerCase())
            );
            if (!itemToComplete) {
              return {
                success: false,
                message: `"${command.entity}" not found in your list`,
              };
            }
            if (command.note) {
              await toggleItemCompleteWithNote(itemToComplete.id, command.note);
            } else {
              await toggleItemComplete(itemToComplete.id);
            }
            return {
              success: true,
              message: `Marked ${itemToComplete.name} as complete`,
              data: { item: itemToComplete },
            };

          case "remove_item":
            if (!command.entity) {
              return { success: false, message: "Please specify an item name" };
            }
            if (!currentRun) {
              return {
                success: false,
                message: "No active shopping list found",
              };
            }
            const itemToRemove = currentRun.items.find((item) =>
              item.name.toLowerCase().includes(command.entity!.toLowerCase())
            );
            if (!itemToRemove) {
              return {
                success: false,
                message: `"${command.entity}" not found in your list`,
              };
            }
            await removeItem(itemToRemove.id);
            return {
              success: true,
              message: `Removed ${itemToRemove.name} from your list`,
              data: { item: itemToRemove },
            };

          case "add_note":
            if (!command.entity || !command.note) {
              return {
                success: false,
                message: "Please specify both item name and note",
              };
            }
            if (!currentRun) {
              return {
                success: false,
                message: "No active shopping list found",
              };
            }
            const itemForNote = currentRun.items.find((item) =>
              item.name.toLowerCase().includes(command.entity!.toLowerCase())
            );
            if (!itemForNote) {
              return {
                success: false,
                message: `"${command.entity}" not found in your list`,
              };
            }
            await updateItem(itemForNote.id, { note: command.note });
            return {
              success: true,
              message: `Added note to ${itemForNote.name}`,
              data: { item: itemForNote, note: command.note },
            };

          case "set_price":
            if (!command.entity || !command.amount) {
              return {
                success: false,
                message: "Please specify both item name and price",
              };
            }
            if (!currentRun) {
              return {
                success: false,
                message: "No active shopping list found",
              };
            }
            const itemForPrice = currentRun.items.find((item) =>
              item.name.toLowerCase().includes(command.entity!.toLowerCase())
            );
            if (!itemForPrice) {
              return {
                success: false,
                message: `"${command.entity}" not found in your list`,
              };
            }
            await updateItem(itemForPrice.id, {
              estimated_price: command.amount,
            });
            return {
              success: true,
              message: `Set price for ${itemForPrice.name} to $${command.amount}`,
              data: { item: itemForPrice, price: command.amount },
            };

          case "set_budget":
            if (!command.amount) {
              return {
                success: false,
                message: "Please specify a budget amount",
              };
            }
            if (!currentRun) {
              return {
                success: false,
                message: "No active shopping list found",
              };
            }
            await updateRun({ budget: command.amount });
            return {
              success: true,
              message: `Set budget to $${command.amount}`,
              data: { budget: command.amount },
            };

          case "complete_run":
            if (!currentRun) {
              return {
                success: false,
                message: "No active shopping list found",
              };
            }
            await completeRun(currentRun.id);
            return {
              success: true,
              message: `Shopping run completed! Great job!`,
              data: { run: currentRun },
            };

          case "list_items":
            if (!currentRun || currentRun.items.length === 0) {
              return { success: true, message: "Your shopping list is empty" };
            }
            const incompleteItems = currentRun.items.filter(
              (item) => !item.completed
            );
            const completeItems = currentRun.items.filter(
              (item) => item.completed
            );
            let listMessage = `You have ${currentRun.items.length} items. `;
            if (incompleteItems.length > 0) {
              listMessage += `Still need: ${incompleteItems
                .slice(0, 3)
                .map((item) => item.name)
                .join(", ")}`;
              if (incompleteItems.length > 3) {
                listMessage += ` and ${incompleteItems.length - 3} more`;
              }
            }
            if (completeItems.length > 0) {
              listMessage += `. Completed: ${completeItems.length} items`;
            }
            return {
              success: true,
              message: listMessage,
              data: {
                items: currentRun.items,
                incomplete: incompleteItems,
                complete: completeItems,
              },
            };

          case "budget_status":
            if (!currentRun || !currentRun.budget) {
              return {
                success: true,
                message: "No budget set for current shopping list",
              };
            }
            const spent = currentRunStats.totalEstimated;
            const remaining = currentRun.budget - spent;
            let budgetMessage = `Budget: $${
              currentRun.budget
            }. Spent: $${spent.toFixed(2)}. `;
            if (remaining >= 0) {
              budgetMessage += `Remaining: $${remaining.toFixed(2)}`;
            } else {
              budgetMessage += `Over budget by $${Math.abs(remaining).toFixed(
                2
              )}`;
            }
            return {
              success: true,
              message: budgetMessage,
              data: { budget: currentRun.budget, spent, remaining },
            };

          default:
            return { success: false, message: "Unknown voice command" };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to execute voice command";
        return { success: false, message: errorMessage };
      }
    },
    [
      currentUser,
      currentRun,
      currentRunStats,
      createNewRun,
      addItem,
      toggleItemComplete,
      toggleItemCompleteWithNote,
      removeItem,
      updateItem,
      updateRun,
      completeRun,
    ]
  );

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
    toggleItemCompleteWithNote,
    updateRun,
    deleteRun,
    completeRun,
    duplicateRun,
    handleVoiceCommand,

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
