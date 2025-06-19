import React, { useState, useEffect } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";

interface VoiceAssistantProps {
  isActive: boolean;
  onToggle: () => void;
  onVoiceCommand?: (command: string) => void;
  position?: "fixed" | "relative";
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  isActive,
  onToggle,
  position = "fixed",
}) => {
  const [isListening, setIsListening] = useState(false);
  const [soundWaves, setSoundWaves] = useState<number[]>([]);

  // Simulate sound wave animation
  useEffect(() => {
    if (isActive) {
      setIsListening(true);
      const interval = setInterval(() => {
        setSoundWaves((prev) => [...prev.slice(-20), Math.random() * 100]);
      }, 100);

      return () => {
        clearInterval(interval);
        setIsListening(false);
        setSoundWaves([]);
      };
    }
  }, [isActive]);

  const containerClass =
    position === "fixed" ? "fixed bottom-6 right-6 z-50" : "relative";

  return (
    <div className={containerClass}>
      {/* Voice Status Card */}
      {isActive && (
        <div className="absolute bottom-20 right-0 glass-card p-4 min-w-[200px] animate-slide-up">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gradient-primary">
              Voice Assistant Active
            </span>
          </div>

          {/* Sound Wave Visualization */}
          <div className="flex items-end space-x-1 h-8 mb-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="w-1 bg-gradient-to-t from-primary-500 to-secondary-500 rounded-full transition-all duration-150"
                style={{
                  height: isListening
                    ? `${20 + (soundWaves[index] || 0) * 0.3}%`
                    : "20%",
                  animationDelay: `${index * 50}ms`,
                }}
              ></div>
            ))}
          </div>

          <div className="text-xs text-dark-400 space-y-1">
            <div>• Say "Add tomatoes" to add items</div>
            <div>• Say "Complete rice" to mark done</div>
            <div>• Say "Start new run" to begin</div>
          </div>
        </div>
      )}

      {/* Main Voice Button */}
      <button
        onClick={onToggle}
        className={`
          relative w-16 h-16 rounded-full transition-all duration-300
          flex items-center justify-center shadow-lg transform-gpu
          ${
            isActive
              ? "bg-gradient-to-r from-secondary-500 to-primary-500 scale-110 animate-pulse-glow"
              : "bg-gradient-to-r from-primary-500 to-secondary-500 hover:scale-110"
          }
          hover:shadow-xl active:scale-95 cursor-pointer
        `}
      >
        {/* Pulse Rings */}
        {isActive && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-secondary-500 animate-ping opacity-75"></div>
            <div
              className="absolute inset-0 rounded-full border-2 border-primary-500 animate-ping opacity-50"
              style={{ animationDelay: "0.5s" }}
            ></div>
          </>
        )}

        {/* Icon */}
        {isActive ? (
          <Mic className="w-6 h-6 text-white animate-pulse" />
        ) : (
          <MicOff className="w-6 h-6 text-white" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-full animate-shimmer"></div>
      </button>

      {/* Voice Feedback */}
      {isActive && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
          <Volume2 className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
};
