import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Mic,
  MicOff,
  Plus,
  ShoppingCart,
  Settings,
  Check,
  LogOut,
  Home,
  BarChart3,
  User,
  Calendar,
  DollarSign,
  Target,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trophy,
  Star,
  ChefHat,
  Clock,
  Trash2,
  Eye,
  X,
  CalendarClock,
  Edit,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Activity,
  Brain,
  PieChart,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useMarketRuns } from "../hooks/useMarketRuns";
import type { MarketItem } from "../lib/firestore";
import { LoadingSpinner } from "./LoadingSpinner";
import { ToastContainer, useToast } from "./Toast";
import { NoteModal } from "./NoteModal";
import { VoiceInterface } from "./VoiceInterface";
import { AnalyticsService } from "../lib/analytics";
import type { CommandContext } from "../services/CommandProcessor";

// Utility function for user-friendly time formatting
const formatRelativeTime = (date: string | Date | any): string => {
  // Handle null/undefined dates
  if (!date) {
    return "Unknown date";
  }

  const now = new Date();
  let targetDate: Date;

  // Handle Firestore timestamp objects
  if (date && typeof date === "object" && typeof date.toDate === "function") {
    targetDate = date.toDate();
  } else if (date && typeof date === "object" && date.seconds) {
    // Handle Firestore timestamp-like objects
    targetDate = new Date(date.seconds * 1000);
  } else {
    // Handle string or Date objects
    targetDate = new Date(date);
  }

  // Check if the date is valid
  if (isNaN(targetDate.getTime())) {
    return "Invalid date";
  }

  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  // Future dates
  if (diffInMs < 0) {
    const absDiffInMinutes = Math.abs(diffInMinutes);
    const absDiffInHours = Math.abs(diffInHours);
    const absDiffInDays = Math.abs(diffInDays);
    const absDiffInWeeks = Math.abs(diffInWeeks);
    const absDiffInMonths = Math.abs(diffInMonths);

    if (absDiffInMinutes < 60) {
      return absDiffInMinutes <= 1
        ? "in 1 minute"
        : `in ${absDiffInMinutes} minutes`;
    } else if (absDiffInHours < 24) {
      return absDiffInHours === 1 ? "in 1 hour" : `in ${absDiffInHours} hours`;
    } else if (absDiffInDays < 7) {
      return absDiffInDays === 1 ? "tomorrow" : `in ${absDiffInDays} days`;
    } else if (absDiffInWeeks < 4) {
      return absDiffInWeeks === 1 ? "in 1 week" : `in ${absDiffInWeeks} weeks`;
    } else if (absDiffInMonths < 12) {
      return absDiffInMonths === 1
        ? "in 1 month"
        : `in ${absDiffInMonths} months`;
    } else {
      return `in ${Math.abs(diffInYears)} year${
        Math.abs(diffInYears) !== 1 ? "s" : ""
      }`;
    }
  }

  // Past dates
  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? "just now" : `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  } else if (diffInDays < 7) {
    return diffInDays === 1 ? "yesterday" : `${diffInDays} days ago`;
  } else if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
  } else if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
  } else {
    return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
  }
};

type TabType = "home" | "analytics" | "profile";

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

const currencies: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
];

// Enhanced interfaces for complete features
interface DailyInspiration {
  quote: string;
  author: string;
  tip: string;
  seasonalReminder: string;
}

interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: string;
}

// Daily inspiration data
const dailyInspirations: DailyInspiration[] = [
  {
    quote: "Cooking is one of the strongest ceremonies for life.",
    author: "Laura Esquivel",
    tip: "Always taste your ingredients before adding them to ensure quality.",
    seasonalReminder:
      "Winter citrus fruits are at their peak - perfect for bright flavors!",
  },
  {
    quote: "The secret of cooking is to have a love of it.",
    author: "Julia Child",
    tip: "Prep your mise en place before starting any dish - it saves time and stress.",
    seasonalReminder:
      "Fresh herbs are abundant now - consider starting an indoor herb garden!",
  },
  {
    quote:
      "Cooking is like painting or writing a song. Just as there are only so many notes or colors, there are only so many flavors.",
    author: "Wolfgang Puck",
    tip: "Shop early in the morning for the best selection at the market.",
    seasonalReminder:
      "Root vegetables are in season - perfect for hearty winter dishes!",
  },
  {
    quote: "First we eat, then we do everything else.",
    author: "M.F.K. Fisher",
    tip: "Build relationships with your vendors - they'll save the best ingredients for you.",
    seasonalReminder:
      "Spring greens are starting to appear - look for early lettuce and spinach!",
  },
  {
    quote:
      "Cooking is all about people. Food is maybe the only universal thing that really has the power to bring everyone together.",
    author: "Guy Fieri",
    tip: "Don't be afraid to ask vendors about their recommendations and cooking methods.",
    seasonalReminder:
      "Summer stone fruits are divine right now - peaches, plums, and apricots!",
  },
];

// Weekly challenges data
// const _weeklyChallenges: WeeklyChallenge[] = [
//   {
//     id: "vendor_explorer",
//     title: "Market Explorer",
//     description: "Visit 3 new vendors this week",
//     progress: 1,
//     target: 3,
//     reward: "Explorer Badge",
//   },
//   {
//     id: "budget_master",
//     title: "Budget Master",
//     description: "Stay under budget on 5 market runs",
//     progress: 3,
//     target: 5,
//     reward: "Savings Badge",
//   },
//   {
//     id: "early_bird",
//     title: "Early Bird Chef",
//     description: "Complete 4 market runs before 9 AM",
//     progress: 2,
//     target: 4,
//     reward: "Morning Glory Badge",
//   },
// ];

// Get daily inspiration based on date
const getTodaysInspiration = (): DailyInspiration => {
  const today = new Date();
  const dayIndex = today.getDate() % dailyInspirations.length;
  return dailyInspirations[dayIndex]!;
};

// Get chef level based on completed runs
const getChefLevel = (
  totalRuns: number
): { level: string; icon: string; nextTarget: number } => {
  if (totalRuns === 0)
    return { level: "Aspiring Chef", icon: "🌱", nextTarget: 5 };
  if (totalRuns < 5) return { level: "Home Cook", icon: "🏠", nextTarget: 15 };
  if (totalRuns < 15)
    return { level: "Experienced Chef", icon: "👨‍🍳", nextTarget: 30 };
  if (totalRuns < 30)
    return { level: "Master Chef", icon: "⭐", nextTarget: 50 };
  if (totalRuns < 50)
    return { level: "Culinary Artist", icon: "🎨", nextTarget: 100 };
  return { level: "Culinary Legend", icon: "🏆", nextTarget: -1 };
};

const Dashboard: React.FC = () => {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL IN THE SAME ORDER EVERY TIME
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const {
    marketRuns,
    currentRun,
    userStats,
    loading,
    error,
    createNewRun,
    setCurrentRunId,
    addItem,
    toggleItemComplete,
    toggleItemCompleteWithNote,
    removeItem,
    completeRun,
    deleteRun,
    currentRunStats,
    handleVoiceCommand,
  } = useMarketRuns();

  const {
    toasts,
    dismissToast,
    success,
    removed,
    added,
    milestone,
    achievement,
  } = useToast();

  // ALL useState hooks
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [isVoiceActive, _setIsVoiceActive] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("other");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [_showAddItem, setShowAddItem] = useState(false);
  const [isCreatingRun, setIsCreatingRun] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    currencies[0] || { code: "USD", symbol: "$", name: "US Dollar" }
  );
  const [completedCount, setCompletedCount] = useState(0);
  const [isRunExpanded, setIsRunExpanded] = useState(false);
  const [showFloatingFAB, _setShowFloatingFAB] = useState(true);
  // const [budgetWarningShown, setBudgetWarningShown] = useState<string | null>(
  //   null
  // );

  // Budget-related state
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [newRunTitle, setNewRunTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Previous runs viewing state
  const [selectedPreviousRun, setSelectedPreviousRun] = useState<any>(null);
  const [showPreviousRunModal, setShowPreviousRunModal] = useState(false);

  // Delete run state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [runToDelete, setRunToDelete] = useState<string | null>(null);

  // Scheduled runs state
  const [showScheduledRuns, setShowScheduledRuns] = useState(false);
  const [_selectedScheduledRun, setSelectedScheduledRun] = useState<any>(null);

  // Note modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteModalItem, setNoteModalItem] = useState<{
    id: string;
    name: string;
    currentNote?: string;
  } | null>(null);

  // Weekly challenges state
  const [weeklyChallenges, _setWeeklyChallenges] = useState<WeeklyChallenge[]>([
    {
      id: "vendor_explorer",
      title: "Market Explorer",
      description: "Visit 3 new vendors this week",
      progress: 1,
      target: 3,
      reward: "Explorer Badge",
    },
    {
      id: "budget_master",
      title: "Budget Master",
      description: "Stay under budget on 5 market runs",
      progress: 3,
      target: 5,
      reward: "Savings Badge",
    },
    {
      id: "early_bird",
      title: "Early Bird Chef",
      description: "Complete 4 market runs before 9 AM",
      progress: 2,
      target: 4,
      reward: "Morning Glory Badge",
    },
  ]);

  // Voice interface state
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);

  // ALL useCallback hooks
  const handleToggleItem = useCallback(
    async (itemId: string) => {
      try {
        const item = currentRun?.items.find((i) => i.id === itemId);
        if (!item) return;

        // If item is not completed, show note modal
        if (!item.completed) {
          setNoteModalItem({
            id: itemId,
            name: item.name,
            currentNote: item.note || "",
          });
          setShowNoteModal(true);
          return;
        }

        // If item is already completed, just toggle without note
        await toggleItemComplete(itemId);
        success(`${item.name} marked as incomplete`);
      } catch (error) {
        console.error("Failed to toggle item:", error);
      }
    },
    [currentRun, toggleItemComplete, success]
  );

  const handleNoteModalSave = useCallback(
    async (note: string) => {
      if (!noteModalItem) return;

      try {
        await toggleItemCompleteWithNote(noteModalItem.id, note);
        const item = currentRun?.items.find((i) => i.id === noteModalItem.id);
        if (item) {
          if (note.trim()) {
            success(`${item.name} completed with note!`);
          } else {
            success(`${item.name} completed!`);
          }
        }
      } catch (error) {
        console.error("Failed to complete item with note:", error);
      }
    },
    [noteModalItem, toggleItemCompleteWithNote, currentRun, success]
  );

  const handleNoteModalClose = useCallback(() => {
    setShowNoteModal(false);
    setNoteModalItem(null);
  }, []);

  const handleRemoveItem = useCallback(
    async (itemId: string) => {
      try {
        const item = currentRun?.items.find((i) => i.id === itemId);
        await removeItem(itemId);

        if (item) {
          removed(`${item.name} removed`);
        }
      } catch (error) {
        console.error("Failed to remove item:", error);
      }
    },
    [removeItem, currentRun, removed]
  );

  // const handleUpdatePrice = useCallback(
  //   async (itemId: string, price: number) => {
  //     try {
  //       await updateItem(itemId, { actual_price: price });
  //       success("Price updated!", "Smart budgeting, Chef!");
  //     } catch (error) {
  //       console.error("Failed to update price:", error);
  //     }
  //   },
  //   [updateItem, success]
  // );

  const handleAddItem = useCallback(async () => {
    if (!newItemName.trim()) return;

    // Budget validation
    if (currentRun && currentRun.budget && newItemPrice) {
      const estimatedPrice = parseFloat(newItemPrice);
      const newTotal = currentRunStats.totalEstimated + estimatedPrice;

      if (newTotal > currentRun.budget) {
        const overage = newTotal - currentRun.budget;
        milestone(
          "Budget Alert! ⚠️",
          `Adding this item will exceed your budget by ${
            selectedCurrency.symbol
          }${overage.toFixed(2)}`
        );
      }
    }

    try {
      let runToUse = currentRun;
      if (!runToUse) {
        const title = `Market Run - ${new Date().toLocaleDateString()}`;
        await createNewRun(title);
      }

      const newItem: Omit<MarketItem, "id" | "createdAt" | "updatedAt"> = {
        name: newItemName.trim(),
        category: newItemCategory,
        completed: false,
        ...(newItemPrice && { estimated_price: parseFloat(newItemPrice) }),
      };

      await addItem(newItem);
      added(`${newItem.name} added!`);

      setNewItemName("");
      setNewItemPrice("");
      setNewItemCategory("other");
      setShowAddItem(false);
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  }, [
    newItemName,
    newItemCategory,
    newItemPrice,
    addItem,
    currentRun,
    createNewRun,
    added,
    currentRunStats,
    selectedCurrency,
    milestone,
  ]);

  const handleCreateNewRun = useCallback(async () => {
    if (activeTab === "profile") {
      setActiveTab("home");
      return;
    }

    setNewRunTitle(`Market Run - ${new Date().toLocaleDateString()}`);
    setBudgetAmount("");
    setShowBudgetDialog(true);
  }, [activeTab]);

  const handleCreateRunWithBudget = useCallback(async () => {
    setIsCreatingRun(true);
    try {
      const budget = budgetAmount ? parseFloat(budgetAmount) : undefined;

      let scheduledDateTime: string | undefined;
      if (scheduledDate && scheduledTime) {
        scheduledDateTime = new Date(
          `${scheduledDate}T${scheduledTime}`
        ).toISOString();
      }

      await createNewRun(newRunTitle, budget, scheduledDateTime);

      const isScheduled =
        scheduledDateTime && new Date(scheduledDateTime) > new Date();
      achievement(
        isScheduled ? "Market Run Scheduled! 📅" : "New Run Created!",
        budget
          ? `Budget set to ${selectedCurrency.symbol}${budget}${
              isScheduled && scheduledDateTime
                ? ` • Scheduled for ${new Date(
                    scheduledDateTime
                  ).toLocaleString()}`
                : ""
            }`
          : isScheduled && scheduledDateTime
          ? `Scheduled for ${new Date(scheduledDateTime).toLocaleString()}`
          : "Ready to conquer the market!"
      );
      setShowBudgetDialog(false);
      setBudgetAmount("");
      setNewRunTitle("");
      setScheduledDate("");
      setScheduledTime("");
    } catch (error) {
      console.error("Failed to create new run:", error);
    } finally {
      setIsCreatingRun(false);
    }
  }, [
    createNewRun,
    achievement,
    newRunTitle,
    budgetAmount,
    scheduledDate,
    scheduledTime,
    selectedCurrency,
  ]);

  const handleCompleteRun = useCallback(async () => {
    if (!currentRun) return;

    try {
      await completeRun(currentRun.id);
      achievement(
        "Market Run Complete! 🎉",
        `Completed ${currentRunStats.totalItems} items. Great job, Chef!`
      );
      setIsRunExpanded(false);
    } catch (error) {
      console.error("Failed to complete run:", error);
    }
  }, [currentRun, completeRun, achievement, currentRunStats.totalItems]);

  const handleSignOut = useCallback(async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  }, [logout, navigate]);

  const handleCurrencyChange = useCallback(
    (currency: Currency) => {
      setSelectedCurrency(currency);
      localStorage.setItem("martRuns_currency", currency.code);
      setShowCurrencyPicker(false);
      success(`Currency changed to ${currency.name}!`);
    },
    [success]
  );

  const handleViewPreviousRun = useCallback((run: any) => {
    setSelectedPreviousRun(run);
    setShowPreviousRunModal(true);
  }, []);

  const handleDeleteRun = useCallback((runId: string) => {
    setRunToDelete(runId);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteRun = useCallback(async () => {
    if (!runToDelete) return;

    try {
      await deleteRun(runToDelete);

      // If we're deleting the current run, clear it
      if (currentRun?.id === runToDelete) {
        setCurrentRunId(null);
      }

      achievement("Run Deleted", "Market run has been removed successfully.");
      setShowDeleteConfirm(false);
      setRunToDelete(null);
    } catch (error) {
      console.error("Failed to delete run:", error);
    }
  }, [runToDelete, currentRun, deleteRun, setCurrentRunId, achievement]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setRunToDelete(null);
  }, []);

  // Scheduled runs handlers
  // const handleStartScheduledRun = useCallback(
  //   async (runId: string) => {
  //     try {
  //       // Set the run as current and update status from "planning" to "shopping"
  //       setCurrentRunId(runId);
  //       await updateRun({ status: "shopping" });
  //       achievement("Market Run Started! 🚀", "Ready to conquer the market!");
  //       setShowScheduledRuns(false);
  //     } catch (error) {
  //       console.error("Failed to start scheduled run:", error);
  //     }
  //   },
  //   [updateRun, achievement, setCurrentRunId]
  // );

  const handleViewScheduledRun = useCallback((run: any) => {
    setSelectedScheduledRun(run);
  }, []);

  const handleEditScheduledRun = useCallback(
    (runId: string) => {
      // Set the scheduled run as current for editing but keep it in planning status
      setCurrentRunId(runId);
      setShowScheduledRuns(false);
      achievement(
        "Editing Scheduled Run! ✏️",
        "Add items to your scheduled market run"
      );
    },
    [setCurrentRunId, achievement]
  );

  // Voice interface handlers
  const toggleVoiceInterface = useCallback(() => {
    setShowVoiceInterface(!showVoiceInterface);
    if (!showVoiceInterface) {
      success("Voice Assistant Activated!", "Say 'Hey MartRuns' to start");
    }
  }, [showVoiceInterface, success]);

  const handleCloseVoiceInterface = useCallback(() => {
    setShowVoiceInterface(false);
  }, []);

  // Voice command context
  const voiceContext = useMemo(
    (): CommandContext => ({
      currentRun,
      currentPage: activeTab,
      recentCommands: [],
      currency: selectedCurrency.symbol,
    }),
    [currentRun, activeTab, selectedCurrency]
  );

  // ALL useMemo hooks
  const previousRuns = useMemo(() => {
    return (
      marketRuns?.filter((run) => run.status === "completed").slice(0, 5) || []
    );
  }, [marketRuns]);

  const scheduledRuns = useMemo(() => {
    return (
      marketRuns?.filter(
        (run) =>
          run.status === "planning" &&
          run.scheduledDate &&
          new Date(run.scheduledDate) > new Date()
      ) || []
    );
  }, [marketRuns]);

  const HomeContent = useMemo(
    () => (
      <div className="space-y-4 sm:space-y-6">
        {/* Current Run Management - Show ongoing runs and scheduled runs being edited */}
        {currentRun &&
          (currentRun.status === "shopping" ||
            currentRun.status === "planning") && (
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-white truncate">
                    {currentRun.title}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {currentRun.status === "shopping" ? (
                      <span className="px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 whitespace-nowrap">
                        Ongoing
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 max-w-full break-words">
                        <span className="block sm:inline truncate max-w-[200px] sm:max-w-none">
                          {currentRun.scheduledDate &&
                          new Date(currentRun.scheduledDate) > new Date()
                            ? `Scheduled ${formatRelativeTime(
                                currentRun.scheduledDate
                              )}`
                            : "Planning"}
                        </span>
                      </span>
                    )}
                    {currentRun.budget && (
                      <span className="px-2 py-1 text-xs font-medium bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30 whitespace-nowrap">
                        Budget: {selectedCurrency.symbol}
                        {currentRun.budget}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-3 flex-shrink-0">
                  <div className="text-center sm:text-right">
                    <div className="text-xl sm:text-2xl font-bold text-emerald-400">
                      {currentRunStats.completedItems}/
                      {currentRunStats.totalItems}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-400">
                      Items
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDeleteRun(currentRun.id)}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors flex-shrink-0"
                      title="Delete this market run"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                    </button>
                    <button
                      onClick={() => setIsRunExpanded(!isRunExpanded)}
                      className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors flex-shrink-0"
                    >
                      {isRunExpanded ? (
                        <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                      ) : (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${currentRunStats.progress}%` }}
                />
              </div>

              {/* Collapsible Content */}
              {isRunExpanded && (
                <div className="space-y-4">
                  {/* Quick Add Item */}
                  <div className="space-y-3 sm:space-y-0">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Add item..."
                        className="flex-1 bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 text-sm sm:text-base"
                        onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                          placeholder="Price"
                          className="flex-1 sm:w-24 bg-slate-800/50 border border-slate-600/50 rounded-xl px-3 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 text-sm sm:text-base"
                        />
                        <button
                          onClick={handleAddItem}
                          disabled={!newItemName.trim()}
                          className="px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 disabled:opacity-50 flex-shrink-0"
                        >
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                    {currentRun.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between p-3 sm:p-4 rounded-xl border transition-all ${
                          item.completed
                            ? "bg-emerald-500/10 border-emerald-500/30 opacity-75"
                            : "bg-slate-800/30 border-slate-700/50"
                        }`}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <button
                            onClick={() => handleToggleItem(item.id)}
                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              item.completed
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-slate-600 hover:border-emerald-500"
                            }`}
                          >
                            {item.completed && (
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            )}
                          </button>
                          <span
                            className={`font-medium text-sm sm:text-base truncate ${
                              item.completed
                                ? "line-through text-slate-400"
                                : "text-white"
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.note && item.note.trim() && (
                            <div title={`Note: ${item.note}`}>
                              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between sm:justify-end space-x-2 ml-8 sm:ml-0">
                          {item.estimated_price && (
                            <span className="text-emerald-400 text-sm sm:text-base font-medium">
                              {selectedCurrency.symbol}
                              {item.estimated_price}
                            </span>
                          )}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 sm:p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Complete Run Button */}
                  {currentRun.status === "shopping" &&
                    currentRun.items.length > 0 && (
                      <div className="pt-4 border-t border-slate-700/50">
                        <button
                          onClick={handleCompleteRun}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-all"
                        >
                          Complete Market Run
                        </button>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

        {/* Daily Chef Inspiration Section */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-orange-500/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-emerald-500/20">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
              <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              <h2 className="text-lg sm:text-xl font-semibold text-transparent bg-gradient-to-r from-emerald-400 to-orange-400 bg-clip-text">
                Daily Chef Inspiration
              </h2>
            </div>

            {(() => {
              const inspiration = getTodaysInspiration();
              return (
                <div className="space-y-3 sm:space-y-4">
                  <blockquote className="text-base sm:text-lg text-white italic leading-relaxed px-2">
                    "{inspiration.quote}"
                  </blockquote>
                  <p className="text-emerald-400 font-medium text-sm sm:text-base">
                    — {inspiration.author}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                    <div className="bg-slate-800/30 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="w-4 h-4 text-orange-400" />
                        <h4 className="text-sm font-semibold text-orange-400">
                          Today's Tip
                        </h4>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {inspiration.tip}
                      </p>
                    </div>

                    <div className="bg-slate-800/30 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-4 h-4 text-teal-400" />
                        <h4 className="text-sm font-semibold text-teal-400">
                          Seasonal Note
                        </h4>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {inspiration.seasonalReminder}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Previous Runs Section */}
        {previousRuns.length > 0 && (
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-400" />
              Recent Market Runs
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {previousRuns.map((run) => (
                <div
                  key={run.id}
                  className="bg-slate-800/30 rounded-xl p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => handleViewPreviousRun(run)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <h4 className="font-medium text-white text-sm sm:text-base truncate">
                        {run.title}
                      </h4>
                      <span className="px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                        Completed
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs sm:text-sm text-slate-400">
                        {formatRelativeTime(run.createdAt)}
                      </span>
                      <span className="text-xs sm:text-sm text-emerald-400">
                        {run.items?.filter((item: any) => item.completed)
                          .length || 0}
                        /{run.items?.length || 0} items
                      </span>
                      {run.budget && (
                        <span className="text-xs sm:text-sm text-orange-400">
                          {selectedCurrency.symbol}
                          {run.budget}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors flex-shrink-0">
                    <Eye className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Current Run - Show create new run option */}
        {(!currentRun || currentRun.status !== "shopping") && (
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-orange-500 flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Ready for Your Next Market Run?
            </h2>
            <p className="text-slate-400 mb-6">
              Start planning your shopping list and make every market run a
              success.
            </p>
            <button
              onClick={handleCreateNewRun}
              disabled={isCreatingRun}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              {isCreatingRun ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Run...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Start New Market Run</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    ),
    [
      currentRun,
      currentRunStats,
      previousRuns,
      scheduledRuns,
      selectedCurrency,
      newItemName,
      newItemPrice,
      handleAddItem,
      handleToggleItem,
      handleCompleteRun,
      isCreatingRun,
      handleCreateNewRun,
      isRunExpanded,
      handleViewPreviousRun,
    ]
  );

  const AnalyticsContent = useMemo(() => {
    // Calculate analytics data
    const spendingAnalytics =
      AnalyticsService.calculateSpendingAnalytics(marketRuns);
    const categorySpending =
      AnalyticsService.calculateCategorySpending(marketRuns);
    const predictions = AnalyticsService.generateSpendingPrediction(marketRuns);
    const smartInsights = AnalyticsService.generateSmartInsights(marketRuns);

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="px-1">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400">
            Smart Analytics
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Your personalized shopping insights
          </p>
        </div>

        {/* Smart Insights Cards */}
        {smartInsights.length > 0 && (
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-400" />
              Smart Insights
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {smartInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-colors ${
                    insight.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : insight.type === "warning"
                      ? "bg-orange-500/10 border-orange-500/30"
                      : insight.type === "info"
                      ? "bg-blue-500/10 border-blue-500/30"
                      : "bg-purple-500/10 border-purple-500/30"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-xl sm:text-2xl flex-shrink-0">
                      {insight.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`font-semibold text-sm sm:text-base ${
                          insight.type === "success"
                            ? "text-emerald-400"
                            : insight.type === "warning"
                            ? "text-orange-400"
                            : insight.type === "info"
                            ? "text-blue-400"
                            : "text-purple-400"
                        }`}
                      >
                        {insight.title}
                      </h4>
                      <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed">
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spending Overview */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-emerald-400" />
            Spending Overview
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-slate-800/30 rounded-lg sm:rounded-xl">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-400 truncate">
                {selectedCurrency.symbol}
                {spendingAnalytics.totalSpent.toFixed(0)}
              </p>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Total Spent
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-slate-800/30 rounded-lg sm:rounded-xl">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-400 truncate">
                {selectedCurrency.symbol}
                {spendingAnalytics.averageSpending.toFixed(0)}
              </p>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Avg per Run
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-slate-800/30 rounded-lg sm:rounded-xl col-span-2 lg:col-span-1">
              <div className="flex items-center justify-center space-x-1">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-400">
                  {spendingAnalytics.budgetSuccessRate.toFixed(0)}%
                </p>
                {spendingAnalytics.budgetSuccessRate >= 70 ? (
                  <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                ) : spendingAnalytics.budgetSuccessRate <= 30 ? (
                  <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                ) : (
                  <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                )}
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Budget Success
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-slate-800/30 rounded-lg sm:rounded-xl col-span-2 lg:col-span-1">
              <div className="flex items-center justify-center space-x-1">
                <p
                  className={`text-lg sm:text-xl lg:text-2xl font-bold truncate ${
                    spendingAnalytics.totalSaved >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {selectedCurrency.symbol}
                  {Math.abs(spendingAnalytics.totalSaved).toFixed(0)}
                </p>
                {spendingAnalytics.totalSaved >= 0 ? (
                  <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                ) : (
                  <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                )}
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                {spendingAnalytics.totalSaved >= 0 ? "Saved" : "Over Budget"}
              </p>
            </div>
          </div>
        </div>

        {/* Spending Trend */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
            {spendingAnalytics.spendingTrend === "increasing" ? (
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-400" />
            ) : spendingAnalytics.spendingTrend === "decreasing" ? (
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-emerald-400" />
            ) : (
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" />
            )}
            Spending Trend
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-white mb-2">
                {spendingAnalytics.spendingTrend === "increasing"
                  ? "Increasing"
                  : spendingAnalytics.spendingTrend === "decreasing"
                  ? "Decreasing"
                  : "Stable"}
              </p>
              <p className="text-slate-400 text-sm sm:text-base">
                {spendingAnalytics.trendPercentage.toFixed(1)}% change from
                previous period
              </p>
            </div>
            <div
              className={`text-3xl sm:text-4xl self-center sm:self-auto ${
                spendingAnalytics.spendingTrend === "increasing"
                  ? "text-red-400"
                  : spendingAnalytics.spendingTrend === "decreasing"
                  ? "text-emerald-400"
                  : "text-blue-400"
              }`}
            >
              {spendingAnalytics.spendingTrend === "increasing"
                ? "📈"
                : spendingAnalytics.spendingTrend === "decreasing"
                ? "📉"
                : "📊"}
            </div>
          </div>
        </div>

        {/* Spending Predictions */}
        {predictions.confidence > 0 && (
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center mb-2 sm:mb-0">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-400" />
                Smart Predictions
              </h3>
              <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full self-start sm:self-auto">
                {predictions.confidence}% confidence
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Next Week Prediction */}
              <div className="space-y-3 sm:space-y-4">
                <div className="text-center p-3 sm:p-4 bg-slate-800/30 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm text-slate-400 mb-2">
                    Next Week Prediction
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-400 truncate">
                    {selectedCurrency.symbol}
                    {predictions.nextWeekPrediction.toFixed(0)}
                  </p>
                  <div className="flex items-center justify-center space-x-1 mt-2">
                    {predictions.trendDirection === "up" ? (
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                    ) : predictions.trendDirection === "down" ? (
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                    ) : (
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    )}
                    <span className="text-xs text-slate-400">
                      Trending {predictions.trendDirection}
                    </span>
                  </div>
                </div>

                <div className="text-center p-3 sm:p-4 bg-slate-800/30 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm text-slate-400 mb-2">
                    Recommended Budget
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-400 truncate">
                    {selectedCurrency.symbol}
                    {predictions.recommendedBudget.toFixed(0)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    20% buffer included
                  </p>
                </div>
              </div>

              {/* 4-Week Forecast */}
              <div>
                <p className="text-xs sm:text-sm text-slate-400 mb-3">
                  4-Week Forecast
                </p>
                <div className="space-y-2">
                  {predictions.next4WeeksPrediction.map((amount, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 sm:p-3 bg-slate-800/30 rounded-lg"
                    >
                      <span className="text-xs sm:text-sm text-slate-300">
                        Week {index + 1}
                      </span>
                      <span className="font-semibold text-white text-sm sm:text-base">
                        {selectedCurrency.symbol}
                        {amount.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Prediction Insights */}
            {predictions.insights.length > 0 && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg sm:rounded-xl">
                <h4 className="text-xs sm:text-sm font-semibold text-purple-400 mb-2">
                  AI Insights
                </h4>
                <ul className="space-y-1">
                  {predictions.insights.map((insight, index) => (
                    <li
                      key={index}
                      className="text-xs sm:text-sm text-slate-300 flex items-start leading-relaxed"
                    >
                      <span className="text-purple-400 mr-2 flex-shrink-0">
                        •
                      </span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Category Breakdown */}
        {categorySpending.length > 0 && (
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-400" />
              Category Breakdown
            </h3>
            <div className="space-y-3">
              {categorySpending.slice(0, 5).map((category, index) => (
                <div
                  key={category.category}
                  className="flex items-center justify-between p-2 sm:p-0"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        index === 0
                          ? "bg-emerald-500"
                          : index === 1
                          ? "bg-orange-500"
                          : index === 2
                          ? "bg-blue-500"
                          : index === 3
                          ? "bg-purple-500"
                          : "bg-slate-500"
                      }`}
                    />
                    <span className="text-white font-medium text-sm sm:text-base truncate">
                      {category.category}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-semibold text-sm sm:text-base">
                      {selectedCurrency.symbol}
                      {category.amount.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {category.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chef Level Progression */}
        {userStats && (
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-emerald-400" />
              Chef Level Progression
            </h3>
            {(() => {
              const chefLevel = getChefLevel(userStats.totalRuns);
              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl sm:text-2xl">
                        {chefLevel.icon}
                      </span>
                      <div>
                        <p className="font-semibold text-white text-sm sm:text-base">
                          {chefLevel.level}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-400">
                          {userStats.totalRuns} market runs completed
                        </p>
                      </div>
                    </div>
                    {chefLevel.nextTarget > 0 && (
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm text-slate-400">
                          Next Level
                        </p>
                        <p className="font-semibold text-emerald-400 text-sm sm:text-base">
                          {chefLevel.nextTarget - userStats.totalRuns} runs to
                          go
                        </p>
                      </div>
                    )}
                  </div>

                  {chefLevel.nextTarget > 0 && (
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            (userStats.totalRuns / chefLevel.nextTarget) * 100
                          }%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Weekly Challenges */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-400" />
            Weekly Challenges
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {weeklyChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-slate-800/30 rounded-lg sm:rounded-xl p-3 sm:p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                  <h4 className="font-semibold text-white text-sm sm:text-base">
                    {challenge.title}
                  </h4>
                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <span className="text-xs sm:text-sm text-slate-400">
                      {challenge.progress}/{challenge.target}
                    </span>
                    {challenge.progress >= challenge.target && (
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                    )}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mb-3 leading-relaxed">
                  {challenge.description}
                </p>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (challenge.progress / challenge.target) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                  <span className="text-xs text-slate-400">
                    Reward: {challenge.reward}
                  </span>
                  {challenge.progress >= challenge.target && (
                    <span className="text-xs text-yellow-400 font-semibold">
                      Completed! 🏆
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }, [marketRuns, userStats, selectedCurrency, weeklyChallenges]);

  const ProfileContent = useMemo(
    () => (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-emerald-400">Profile</h2>

        {/* User Info */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-orange-500 flex items-center justify-center">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {currentUser?.displayName || "Chef"}
              </h3>
              <p className="text-slate-400">{currentUser?.email}</p>
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">
            Currency Settings
          </h3>
          <button
            onClick={() => setShowCurrencyPicker(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-600/50 text-white"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{selectedCurrency.symbol}</span>
              <div>
                <p className="font-semibold">{selectedCurrency.name}</p>
                <p className="text-sm text-slate-400">
                  {selectedCurrency.code}
                </p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
          <div className="space-y-3">
            <button
              onClick={toggleVoiceInterface}
              className={`w-full flex items-center justify-center space-x-2 p-3 rounded-xl border transition-all ${
                isVoiceActive
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-800/30 border-slate-600/50 text-slate-300"
              }`}
            >
              {isVoiceActive ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
              <span>{isVoiceActive ? "Voice Active" : "Enable Voice"}</span>
            </button>
            <button
              onClick={() => setActiveTab("home")}
              className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
            >
              <Home className="w-5 h-5" />
              <span>Go to Shopping List</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    ),
    [currentUser, selectedCurrency, handleSignOut, isVoiceActive]
  );

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case "home":
        return HomeContent;
      case "analytics":
        return AnalyticsContent;
      case "profile":
        return ProfileContent;
      default:
        return HomeContent;
    }
  }, [activeTab, HomeContent, AnalyticsContent, ProfileContent]);

  // ALL useEffect hooks
  useEffect(() => {
    const savedCurrency = localStorage.getItem("martRuns_currency");
    if (savedCurrency) {
      const currency = currencies.find((c) => c.code === savedCurrency);
      if (currency) {
        setSelectedCurrency(currency);
      }
    }
  }, []);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  useEffect(() => {
    if (currentRun) {
      const completed = currentRunStats.completedItems;
      const total = currentRunStats.totalItems;

      if (completed > completedCount && total > 0) {
        if (completed === Math.floor(total / 2) && total >= 4) {
          milestone(
            "Halfway There!",
            "You're making excellent progress, Chef!"
          );
        }
        if (completed === total && total > 0) {
          achievement(
            "Shopping Complete! 🎉",
            "Outstanding work! All items collected."
          );
        }
        if (
          completed > 0 &&
          completed % 5 === 0 &&
          completed > completedCount
        ) {
          milestone(`${completed} Items Down!`, "You're on fire! Keep it up!");
        }
      }
      setCompletedCount(completed);
    }
  }, [currentRunStats, currentRun, completedCount, milestone, achievement]);

  // Conditional returns AFTER all hooks
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-2xl font-bold text-red-400">Error</h2>
          <p className="text-slate-300 max-w-md">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 text-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-full blur-3xl animate-float"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/90">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-orange-500 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-transparent bg-gradient-to-r from-emerald-400 to-orange-400 bg-clip-text">
                MartRuns
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Smart Market Management
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("profile")}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-800/50 border border-slate-600/30 flex items-center justify-center text-slate-300 hover:text-white touch-manipulation"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 pt-24 pb-24 max-w-7xl mx-auto">
        {renderContent()}
      </main>

      {/* Floating Action Button */}
      {showFloatingFAB && activeTab === "home" && (
        <button
          onClick={handleCreateNewRun}
          className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-emerald-500 to-orange-500 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform duration-200 z-40"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Scheduled Runs Floating Action Button */}
      {showFloatingFAB && activeTab === "home" && (
        <button
          onClick={() => setShowScheduledRuns(true)}
          className={`fixed bottom-20 sm:bottom-24 right-20 sm:right-24 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform duration-200 z-40 ${
            scheduledRuns.length > 0
              ? "bg-gradient-to-r from-blue-500 to-purple-500"
              : "bg-gradient-to-r from-slate-600 to-slate-700"
          }`}
          title={
            scheduledRuns.length > 0
              ? `View ${scheduledRuns.length} scheduled runs`
              : "No scheduled runs"
          }
        >
          <CalendarClock className="w-5 h-5 sm:w-6 sm:h-6" />
          {scheduledRuns.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {scheduledRuns.length}
            </span>
          )}
        </button>
      )}

      {/* Voice Assistant Floating Action Button */}
      {showFloatingFAB && (
        <button
          onClick={toggleVoiceInterface}
          className={`fixed bottom-36 sm:bottom-40 right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-200 z-40 ${
            showVoiceInterface
              ? "bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"
              : "bg-gradient-to-r from-blue-500 to-purple-500"
          }`}
          title="Voice Assistant"
        >
          {showVoiceInterface ? (
            <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
          {!showVoiceInterface && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
          )}
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50">
        <div className="flex items-center justify-center max-w-md mx-auto">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "analytics", icon: BarChart3, label: "Analytics" },
            { id: "profile", icon: User, label: "Profile" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex flex-col items-center py-3 sm:py-4 px-2 transition-all touch-manipulation ${
                activeTab === tab.id ? "text-emerald-400" : "text-slate-400"
              }`}
            >
              <tab.icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
              <span className="text-xs sm:text-sm font-medium">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Budget Dialog */}
      {showBudgetDialog && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowBudgetDialog(false)}
        >
          <div
            className="bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 text-center">
              Create New Market Run
            </h3>

            <div className="space-y-3 sm:space-y-4">
              <input
                type="text"
                value={newRunTitle}
                onChange={(e) => setNewRunTitle(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 text-sm sm:text-base"
                placeholder="Market Run Title"
              />

              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm sm:text-base">
                  {selectedCurrency.symbol}
                </span>
                <input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl pl-8 pr-4 py-3 text-white placeholder-slate-400 text-sm sm:text-base"
                  placeholder="Budget (Optional)"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Scheduling inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 text-sm sm:text-base"
                  min={new Date().toISOString().split("T")[0]}
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 text-sm sm:text-base"
                />
              </div>

              {scheduledDate && scheduledTime && (
                <p className="text-xs sm:text-sm text-slate-400 text-center">
                  Scheduled for{" "}
                  {new Date(
                    `${scheduledDate}T${scheduledTime}`
                  ).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => setShowBudgetDialog(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 text-slate-300 text-sm sm:text-base font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRunWithBudget}
                disabled={!newRunTitle.trim() || isCreatingRun}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-orange-500 text-white disabled:opacity-50 text-sm sm:text-base font-medium"
              >
                {isCreatingRun ? "Creating..." : "Create Run"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Currency Picker */}
      {showCurrencyPicker && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowCurrencyPicker(false)}
        >
          <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              Choose Currency
            </h3>
            <div className="space-y-2">
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencyChange(currency)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors ${
                    selectedCurrency.code === currency.code
                      ? "bg-emerald-500/20 border border-emerald-500/30"
                      : ""
                  }`}
                >
                  <span className="text-2xl">{currency.symbol}</span>
                  <div className="text-left flex-1">
                    <p className="font-medium text-white">{currency.name}</p>
                    <p className="text-sm text-slate-400">{currency.code}</p>
                  </div>
                  {selectedCurrency.code === currency.code && (
                    <Star className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Previous Run Modal */}
      {showPreviousRunModal && selectedPreviousRun && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreviousRunModal(false)}
        >
          <div
            className="bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white">
                {selectedPreviousRun.title}
              </h3>
              <button
                onClick={() => setShowPreviousRunModal(false)}
                className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
              </button>
            </div>

            {/* Run Details */}
            <div className="space-y-4 sm:space-y-6">
              {/* Run Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-slate-800/30 rounded-xl">
                  <p className="text-sm text-slate-400">Date</p>
                  <p className="font-semibold text-white text-sm">
                    {formatRelativeTime(selectedPreviousRun.createdAt)}
                  </p>
                </div>
                <div className="text-center p-3 bg-slate-800/30 rounded-xl">
                  <p className="text-sm text-slate-400">Items</p>
                  <p className="font-semibold text-emerald-400 text-sm">
                    {selectedPreviousRun.items?.filter(
                      (item: any) => item.completed
                    ).length || 0}
                    /{selectedPreviousRun.items?.length || 0}
                  </p>
                </div>
                {selectedPreviousRun.budget && (
                  <div className="text-center p-3 bg-slate-800/30 rounded-xl">
                    <p className="text-sm text-slate-400">Budget</p>
                    <p className="font-semibold text-orange-400 text-sm">
                      {selectedCurrency.symbol}
                      {selectedPreviousRun.budget}
                    </p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Shopping List</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedPreviousRun.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        item.completed
                          ? "bg-emerald-500/10 border-emerald-500/30 opacity-75"
                          : "bg-slate-800/30 border-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            item.completed
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-slate-600"
                          }`}
                        >
                          {item.completed && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span
                            className={`font-medium text-sm truncate ${
                              item.completed
                                ? "line-through text-slate-400"
                                : "text-white"
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.note && item.note.trim() && (
                            <div title={`Note: ${item.note}`}>
                              <MessageSquare className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.estimated_price && (
                          <span className="text-slate-400 text-sm">
                            Est: {selectedCurrency.symbol}
                            {item.estimated_price}
                          </span>
                        )}
                        {item.actual_price && (
                          <span className="text-emerald-400 text-sm font-medium">
                            {selectedCurrency.symbol}
                            {item.actual_price}
                          </span>
                        )}
                      </div>
                    </div>
                  )) || (
                    <p className="text-slate-400 text-center py-4">
                      No items in this run
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedPreviousRun.notes && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Notes</h4>
                  <div className="bg-slate-800/30 rounded-xl p-3">
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {selectedPreviousRun.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Runs Modal */}
      {showScheduledRuns && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowScheduledRuns(false)}
        >
          <div
            className="bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                <CalendarClock className="w-5 h-5 mr-2 text-blue-400" />
                Scheduled Market Runs
              </h3>
              <button
                onClick={() => setShowScheduledRuns(false)}
                className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
              </button>
            </div>

            {scheduledRuns.length === 0 ? (
              <div className="text-center py-8">
                <CalendarClock className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">
                  No Scheduled Runs
                </h4>
                <p className="text-slate-400">
                  You don't have any market runs scheduled for the future.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledRuns.map((run) => (
                  <div
                    key={run.id}
                    className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-white text-sm sm:text-base truncate">
                            {run.title}
                          </h4>
                          <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                            Scheduled
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-400">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {run.scheduledDate &&
                              formatRelativeTime(run.scheduledDate)}
                          </span>
                          <span className="flex items-center">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            {run.items?.length || 0} items
                          </span>
                          {run.budget && (
                            <span className="flex items-center text-orange-400">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {selectedCurrency.symbol}
                              {run.budget}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewScheduledRun(run)}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors flex-shrink-0"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-slate-300" />
                        </button>
                        <button
                          onClick={() => handleEditScheduledRun(run.id)}
                          className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 transition-colors flex-shrink-0"
                          title="Edit this run"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRun(run.id)}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors flex-shrink-0"
                          title="Delete this run"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={cancelDelete}
        >
          <div
            className="bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>

              <h3 className="text-lg sm:text-xl font-semibold text-white">
                Delete Market Run?
              </h3>

              <p className="text-slate-300 text-sm sm:text-base">
                Are you sure you want to delete this market run? This action
                cannot be undone and all items in the list will be permanently
                removed.
              </p>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 text-slate-300 text-sm sm:text-base font-medium hover:bg-slate-600/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteRun}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm sm:text-base font-medium hover:bg-red-500/30 transition-colors"
                >
                  Delete Run
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && noteModalItem && (
        <NoteModal
          isOpen={showNoteModal}
          itemName={noteModalItem.name}
          currentNote={noteModalItem.currentNote}
          onSave={handleNoteModalSave}
          onClose={handleNoteModalClose}
        />
      )}

      {/* Voice Interface */}
      <VoiceInterface
        isOpen={showVoiceInterface}
        onClose={handleCloseVoiceInterface}
        onCommand={handleVoiceCommand}
        context={voiceContext}
      />
    </div>
  );
};

export default Dashboard;
