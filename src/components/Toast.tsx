import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Trash2,
  Plus,
  Award,
  ChefHat,
  Target,
  Sparkles,
  X,
} from "lucide-react";

export type ToastType =
  | "success"
  | "removed"
  | "added"
  | "milestone"
  | "achievement";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: "from-emerald-500/90 to-teal-500/90",
    borderColor: "border-emerald-400/50",
    quotes: [
      "Excellent work, Chef!",
      "Perfect execution!",
      "You're cooking with precision!",
      "Outstanding progress!",
    ],
  },
  removed: {
    icon: Trash2,
    bgColor: "from-red-500/90 to-pink-500/90",
    borderColor: "border-red-400/50",
    quotes: [
      "Item removed from your list",
      "Cleaned up perfectly",
      "Organization is key!",
      "Streamlined your list",
    ],
  },
  added: {
    icon: Plus,
    bgColor: "from-blue-500/90 to-indigo-500/90",
    borderColor: "border-blue-400/50",
    quotes: [
      "Added to your shopping list",
      "Great addition, Chef!",
      "Building your perfect list",
      "Smart shopping choice!",
    ],
  },
  milestone: {
    icon: Target,
    bgColor: "from-orange-500/90 to-amber-500/90",
    borderColor: "border-orange-400/50",
    quotes: [
      "Halfway there!",
      "Making great progress!",
      "You're on fire, Chef!",
      "Crushing those goals!",
    ],
  },
  achievement: {
    icon: Award,
    bgColor: "from-purple-500/90 to-pink-500/90",
    borderColor: "border-purple-400/50",
    quotes: [
      "Master Chef level unlocked!",
      "Exceptional performance!",
      "You've earned this recognition!",
      "Professional excellence!",
    ],
  },
};

const ToastComponent: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    // Entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration || 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-out ${
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100 scale-100"
          : "translate-x-full opacity-0 scale-95"
      }`}
    >
      <div
        className={`
        relative max-w-sm w-full bg-gradient-to-r ${config.bgColor} 
        backdrop-blur-xl rounded-2xl border ${config.borderColor} 
        shadow-2xl p-4 mb-3 group hover:scale-105 transition-transform duration-200
      `}
      >
        {/* Sparkle effect for achievements */}
        {toast.type === "achievement" && (
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
          </div>
        )}

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <ChefHat className="w-4 h-4 text-white/80" />
              <p className="text-sm font-semibold text-white font-heading">
                {toast.title}
              </p>
            </div>
            <p className="text-sm text-white/90 font-body mt-1">
              {toast.message}
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden">
          <div
            className="h-full bg-white/40 transition-all duration-300 ease-linear"
            style={{
              animation: `shrink ${toast.duration || 4000}ms linear forwards`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Toast Container
interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    const config = toastConfig[type];
    const randomQuote =
      config.quotes[Math.floor(Math.random() * config.quotes.length)];

    const toast: Toast = {
      id: Date.now().toString(),
      type,
      title,
      message: message || randomQuote || "Action completed!",
      duration,
    };

    setToasts((prev) => [...prev.slice(-2), toast]); // Keep max 3 toasts
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    dismissToast,
    // Convenience methods
    success: (title: string, message?: string) =>
      addToast("success", title, message),
    removed: (title: string, message?: string) =>
      addToast("removed", title, message),
    added: (title: string, message?: string) =>
      addToast("added", title, message),
    milestone: (title: string, message?: string) =>
      addToast("milestone", title, message),
    achievement: (title: string, message?: string) =>
      addToast("achievement", title, message),
  };
};

// Add CSS for the shrink animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }
  `;
  document.head.appendChild(style);
}
