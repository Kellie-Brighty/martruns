import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Mic,
  Plus,
  ShoppingCart,
  Settings,
  Check,
  Trash2,
  LogOut,
  Home,
  BarChart3,
  User,
  Calendar,
  DollarSign,
  Target,
  Award,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MarketItem {
  id: string;
  name: string;
  estimated_price?: number;
  actual_price?: number;
  completed: boolean;
  category: string;
}

interface MarketRun {
  id: string;
  title: string;
  date: string;
  items: MarketItem[];
  status: "planning" | "shopping" | "completed";
}

type TabType = "home" | "analytics" | "profile";

// Memoized Item Component for better performance
const ShoppingItem = React.memo(
  ({
    item,
    onToggle,
    onRemove,
    index,
  }: {
    item: MarketItem;
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
    index: number;
  }) => (
    <div
      className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer transform-gpu ${
        item.completed
          ? "bg-slate-800/30 border-emerald-500/30 opacity-60"
          : "bg-slate-800/20 border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800/40"
      }`}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => onToggle(item.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              item.completed
                ? "bg-emerald-500 border-emerald-500"
                : "border-slate-600 group-hover:border-emerald-500"
            }`}
          >
            {item.completed && <Check className="w-4 h-4 text-white" />}
          </div>
          <div>
            <h4
              className={`font-medium transition-all duration-300 font-heading ${
                item.completed ? "line-through text-slate-400" : "text-white"
              }`}
            >
              {item.name}
            </h4>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-slate-400 capitalize font-body">
                {item.category}
              </span>
              {item.estimated_price && (
                <span className="text-emerald-400">
                  ${item.estimated_price}
                </span>
              )}
              {item.actual_price && (
                <span className="text-orange-400">→ ${item.actual_price}</span>
              )}
            </div>
          </div>
        </div>

        <button
          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/20 transition-all duration-300"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  )
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [currentRun, setCurrentRun] = useState<MarketRun | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);

  // Sample data
  useEffect(() => {
    const sampleRun: MarketRun = {
      id: "1",
      title: "Today's Market Run",
      date: new Date().toLocaleDateString(),
      items: [
        {
          id: "1",
          name: "Fresh Tomatoes",
          estimated_price: 8.5,
          completed: false,
          category: "vegetables",
        },
        {
          id: "2",
          name: "Chicken Breast",
          estimated_price: 15.0,
          completed: false,
          category: "meat",
        },
        {
          id: "3",
          name: "Onions",
          estimated_price: 3.5,
          completed: true,
          actual_price: 3.2,
          category: "vegetables",
        },
        {
          id: "4",
          name: "Rice (5kg)",
          estimated_price: 12.99,
          completed: false,
          category: "grains",
        },
      ],
      status: "shopping",
    };
    setCurrentRun(sampleRun);
  }, []);

  // Memoized callbacks to prevent unnecessary re-renders
  const toggleItemComplete = useCallback((itemId: string) => {
    setCurrentRun((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        ),
      };
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCurrentRun((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      };
    });
  }, []);

  const addNewItem = useCallback(() => {
    if (!currentRun || !newItemName.trim()) return;

    const newItem: MarketItem = {
      id: Date.now().toString(),
      name: newItemName,
      completed: false,
      category: "other",
    };

    setCurrentRun((prev) =>
      prev
        ? {
            ...prev,
            items: [...prev.items, newItem],
          }
        : null
    );

    setNewItemName("");
    setShowAddItem(false);
  }, [currentRun, newItemName]);

  const toggleVoice = useCallback(() => {
    setIsVoiceActive((prev) => !prev);
    // Voice functionality will be implemented later
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        addNewItem();
      }
    },
    [addNewItem]
  );

  const handleSignOut = useCallback(() => {
    localStorage.removeItem("martRuns_onboarded");
    localStorage.removeItem("martRuns_userProfile");
    navigate("/");
  }, [navigate]);

  // Memoized calculations
  const progressStats = useMemo(() => {
    if (!currentRun) return { completedItems: 0, totalItems: 0, progress: 0 };

    const completedItems = currentRun.items.filter(
      (item) => item.completed
    ).length;
    const totalItems = currentRun.items.length;
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return { completedItems, totalItems, progress };
  }, [currentRun?.items]);

  // Analytics data
  const analyticsData = useMemo(() => {
    if (!currentRun)
      return { totalSpent: 0, totalEstimated: 0, savedAmount: 0 };

    const totalEstimated = currentRun.items.reduce(
      (sum, item) => sum + (item.estimated_price || 0),
      0
    );
    const totalSpent = currentRun.items.reduce(
      (sum, item) => sum + (item.actual_price || item.estimated_price || 0),
      0
    );
    const savedAmount = totalEstimated - totalSpent;

    return { totalSpent, totalEstimated, savedAmount };
  }, [currentRun?.items]);

  const userProfile = JSON.parse(
    localStorage.getItem("martRuns_userProfile") || "{}"
  );

  // Tab content components
  const HomeContent = () => (
    <>
      {currentRun && (
        <>
          {/* Progress Card */}
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-transparent bg-gradient-to-r from-emerald-400 to-orange-400 bg-clip-text font-heading">
                  {currentRun.title}
                </h2>
                <p className="text-sm text-slate-400 font-body">
                  {currentRun.date}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-400 to-orange-400 bg-clip-text font-heading">
                  {progressStats.completedItems}/{progressStats.totalItems}
                </div>
                <div className="text-sm text-slate-400 font-body">Items</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-orange-500 transition-all duration-500 ease-out"
                style={{ width: `${progressStats.progress}%` }}
              ></div>
            </div>

            <div className="mt-2 text-right">
              <span className="text-sm text-transparent bg-gradient-to-r from-emerald-400 to-orange-400 bg-clip-text font-medium font-heading">
                {Math.round(progressStats.progress)}% Complete
              </span>
            </div>
          </div>

          {/* Shopping List */}
          <div
            className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-heading text-white">
                Shopping List
              </h3>
              <button
                onClick={() => setShowAddItem(!showAddItem)}
                className="w-10 h-10 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 transition-all duration-300"
                title="Add Item"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Add Item Form */}
            {showAddItem && (
              <div className="mb-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 animate-slide-down">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Add new item..."
                    className="flex-1 bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 font-body focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    onClick={addNewItem}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-orange-500 text-white rounded-xl font-semibold font-heading hover:shadow-lg hover:scale-105 transition-all duration-300"
                  >
                    <span className="hidden sm:inline">Add Item</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-3">
              {currentRun.items.map((item, index) => (
                <ShoppingItem
                  key={item.id}
                  item={item}
                  onToggle={toggleItemComplete}
                  onRemove={removeItem}
                  index={index}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );

  const AnalyticsContent = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-400 to-orange-400 bg-clip-text font-heading">
        Analytics
      </h2>

      {/* Spending Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-body">
                Total Estimated
              </p>
              <p className="text-xl font-bold text-white font-heading">
                ${analyticsData.totalEstimated.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-body">Total Spent</p>
              <p className="text-xl font-bold text-white font-heading">
                ${analyticsData.totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-body">Amount Saved</p>
              <p className="text-xl font-bold text-white font-heading">
                ${analyticsData.savedAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shopping History */}
      <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold font-heading text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-medium text-white font-body">
                  Today's Market Run
                </p>
                <p className="text-sm text-slate-400">4 items • In Progress</p>
              </div>
            </div>
            <span className="text-emerald-400 font-semibold">
              ${analyticsData.totalEstimated.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const ProfileContent = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-400 to-orange-400 bg-clip-text font-heading">
        Profile
      </h2>

      {/* User Info */}
      <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-orange-500 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white font-heading">
              {userProfile.name || "Chef"}
            </h3>
            <p className="text-slate-400 font-body capitalize">
              {userProfile.experience || "Home Cook"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-xl bg-slate-800/30">
            <p className="text-2xl font-bold text-emerald-400 font-heading">
              12
            </p>
            <p className="text-sm text-slate-400 font-body">Completed Runs</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-800/30">
            <p className="text-2xl font-bold text-orange-400 font-heading">
              $248
            </p>
            <p className="text-sm text-slate-400 font-body">Total Saved</p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold font-heading text-white mb-4">
          Settings
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30">
            <div className="flex items-center space-x-3">
              <Mic className="w-5 h-5 text-slate-400" />
              <span className="text-white font-body">Voice Commands</span>
            </div>
            <div
              className={`w-12 h-6 rounded-full transition-colors ${
                userProfile.voiceEnabled ? "bg-emerald-500" : "bg-slate-600"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform transform ${
                  userProfile.voiceEnabled ? "translate-x-6" : "translate-x-1"
                } mt-0.5`}
              ></div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-body">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeContent />;
      case "analytics":
        return <AnalyticsContent />;
      case "profile":
        return <ProfileContent />;
      default:
        return <HomeContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 text-white overflow-hidden">
      {/* Sophisticated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] opacity-30"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/90">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-orange-500 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-orange-400 bg-clip-text font-heading">
                MartRuns
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-body hidden sm:block">
                Smart Market Management
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-300"
              title="Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 sm:px-6 pt-20 sm:pt-24 pb-24 space-y-6 max-w-7xl mx-auto">
        {renderContent()}
      </main>

      {/* Bottom Tab Navigation */}
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
              className={`flex-1 flex flex-col items-center py-4 px-2 transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <tab.icon
                className={`w-6 h-6 mb-1 transition-all duration-300 ${
                  activeTab === tab.id ? "scale-110" : ""
                }`}
              />
              <span className="text-xs font-medium font-body">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Floating Voice Button - Only show on Home tab */}
      {activeTab === "home" && (
        <button
          onClick={toggleVoice}
          className={`fixed bottom-20 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-orange-500 shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
            isVoiceActive ? "animate-pulse" : ""
          }`}
        >
          <Mic className="w-6 h-6 text-white" />
          {isVoiceActive && (
            <div className="absolute inset-0 rounded-full border-2 border-orange-500 animate-ping"></div>
          )}
        </button>
      )}

      {/* Voice Status */}
      {isVoiceActive && (
        <div className="fixed bottom-36 right-6 bg-slate-800/90 backdrop-blur-xl rounded-2xl p-3 animate-slide-up z-40 border border-slate-700/50">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
            <span className="text-sm text-slate-300 font-body">
              Listening...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
