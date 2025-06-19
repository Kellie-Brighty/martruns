import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "dots" | "ring" | "pulse" | "wave";
  color?: "primary" | "secondary" | "rainbow";
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  variant = "ring",
  color = "primary",
  text,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorClasses = {
    primary: "border-primary-500",
    secondary: "border-secondary-500",
    rainbow: "border-gradient-rainbow",
  };

  const dotColorClasses = {
    primary: "bg-primary-500",
    secondary: "bg-secondary-500",
    rainbow: "bg-gradient-to-r from-primary-500 to-secondary-500",
  };

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${dotColorClasses[color]} animate-bounce`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );

  const renderRing = () => (
    <div
      className={`${sizeClasses[size]} border-2 border-t-transparent ${colorClasses[color]} rounded-full animate-spin`}
    />
  );

  const renderPulse = () => (
    <div className="relative">
      <div
        className={`${sizeClasses[size]} ${dotColorClasses[color]} rounded-full animate-ping absolute`}
      />
      <div
        className={`${sizeClasses[size]} ${dotColorClasses[color]} rounded-full animate-pulse`}
      />
    </div>
  );

  const renderWave = () => (
    <div className="flex items-end space-x-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1 ${dotColorClasses[color]} rounded-full animate-bounce`}
          style={{
            height: `${12 + i * 2}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: "0.6s",
          }}
        />
      ))}
    </div>
  );

  const renderSpinner = () => {
    switch (variant) {
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      case "wave":
        return renderWave();
      default:
        return renderRing();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      {renderSpinner()}
      {text && <p className="text-sm text-dark-400 animate-pulse">{text}</p>}
    </div>
  );
};
