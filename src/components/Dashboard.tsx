import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Mic,
  Plus,
  ShoppingCart,
  TrendingUp,
  Users,
  Settings,
  Check,
  Trash2,
  LogOut,
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
          ? "bg-dark-800/30 border-primary-500/30 opacity-60"
          : "bg-dark-800/20 border-dark-700/50 hover:border-primary-500/50 hover:bg-dark-800/40"
      }`}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => onToggle(item.id)}
    >
      {/* Swipe Indicator */}
      <div className="swipe-indicator"></div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              item.completed
                ? "bg-primary-500 border-primary-500"
                : "border-dark-600 group-hover:border-primary-500"
            }`}
          >
            {item.completed && <Check className="w-4 h-4 text-white" />}
          </div>
          <div>
            <h4
              className={`font-medium transition-all duration-300 font-cyber ${
                item.completed ? "line-through text-dark-400" : "text-white"
              }`}
            >
              {item.name}
            </h4>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-dark-400 capitalize font-sleek">
                {item.category}
              </span>
              {item.estimated_price && (
                <span className="text-primary-400">
                  ₦{item.estimated_price}
                </span>
              )}
              {item.actual_price && (
                <span className="text-secondary-400">
                  → ₦{item.actual_price}
                </span>
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
          estimated_price: 500,
          completed: false,
          category: "vegetables",
        },
        {
          id: "2",
          name: "Chicken Breast",
          estimated_price: 1200,
          completed: false,
          category: "meat",
        },
        {
          id: "3",
          name: "Onions",
          estimated_price: 200,
          completed: true,
          actual_price: 180,
          category: "vegetables",
        },
        {
          id: "4",
          name: "Rice (5kg)",
          estimated_price: 1500,
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
    // TODO: Implement Firebase sign out
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

  return (
    <div className="min-h-screen bg-dark-950 text-white overflow-hidden font-futuristic">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-dark-800/50 backdrop-blur-xl bg-dark-950/90">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gradient-rainbow font-cyber">
                CartRuns
              </h1>
              <p className="text-xs sm:text-sm text-dark-400 font-sleek hidden sm:block">
                Cassie's Market Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button className="btn-icon" title="Analytics">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button className="btn-icon hidden sm:flex" title="Team">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button className="btn-icon hidden sm:flex" title="Settings">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="btn-danger"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 sm:px-6 pt-20 sm:pt-24 pb-6 space-y-6 max-w-7xl mx-auto">
        {currentRun && (
          <>
            {/* Progress Card */}
            <div className="glass-card p-6 animate-slide-down">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gradient-primary font-cyber">
                    {currentRun.title}
                  </h2>
                  <p className="text-sm text-dark-400 font-sleek">
                    {currentRun.date}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gradient-secondary font-cyber">
                    {progressStats.completedItems}/{progressStats.totalItems}
                  </div>
                  <div className="text-sm text-dark-400 font-sleek">Items</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-3 bg-dark-800 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500 ease-out transform-gpu"
                  style={{ width: `${progressStats.progress}%` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-full animate-shimmer"></div>
              </div>

              <div className="mt-2 text-right">
                <span className="text-sm text-gradient-primary font-medium font-cyber">
                  {Math.round(progressStats.progress)}% Complete
                </span>
              </div>
            </div>

            {/* Shopping List */}
            <div
              className="glass-card p-6 animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold font-cyber">
                  Shopping List
                </h3>
                <button
                  onClick={() => setShowAddItem(!showAddItem)}
                  className="btn-icon"
                  title="Add Item"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Add Item Form */}
              {showAddItem && (
                <div className="mb-4 p-4 rounded-xl bg-dark-800/30 border border-dark-700/50 animate-slide-down">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Add new item..."
                      className="input-futuristic flex-1 font-sleek"
                      onKeyPress={handleKeyPress}
                    />
                    <button
                      onClick={addNewItem}
                      className="btn-primary font-cyber"
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

            {/* Quick Actions */}
            <div
              className="grid grid-cols-2 gap-4 animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <button className="glass-card-hover p-4 text-center transform-gpu">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-medium text-white font-cyber">Analytics</h4>
                <p className="text-sm text-dark-400 font-sleek">
                  Spending insights
                </p>
              </button>

              <button className="glass-card-hover p-4 text-center transform-gpu">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-r from-secondary-500 to-secondary-600 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-medium text-white font-cyber">
                  Share List
                </h4>
                <p className="text-sm text-dark-400 font-sleek">
                  With assistants
                </p>
              </button>
            </div>
          </>
        )}
      </main>

      {/* Floating Voice Button */}
      <button
        onClick={toggleVoice}
        className={`voice-button fixed bottom-6 right-6 z-50 transform-gpu ${
          isVoiceActive ? "voice-active" : ""
        }`}
      >
        <Mic
          className={`w-5 h-5 sm:w-6 sm:h-6 ${
            isVoiceActive ? "text-white animate-pulse" : "text-white"
          }`}
        />
        {isVoiceActive && (
          <div className="absolute inset-0 rounded-full border-2 border-secondary-500 animate-ping"></div>
        )}
      </button>

      {/* Voice Status */}
      {isVoiceActive && (
        <div className="fixed bottom-24 right-6 glass-card p-3 animate-slide-up z-40">
          <div className="flex items-center space-x-2">
            <div className="loading-dots">
              <div style={{ "--delay": "0ms" } as React.CSSProperties}></div>
              <div style={{ "--delay": "150ms" } as React.CSSProperties}></div>
              <div style={{ "--delay": "300ms" } as React.CSSProperties}></div>
            </div>
            <span className="text-sm text-dark-300 font-sleek">
              Listening...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
