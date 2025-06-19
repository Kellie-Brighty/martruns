import React, { useState, useRef, useCallback, useMemo } from "react";

interface GestureCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  enableSwipe?: boolean;
}

export const GestureCard: React.FC<GestureCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = "",
  enableSwipe = true,
}) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Throttled touch move handler for better performance
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enableSwipe || !isDragging) return;

      // Cancel previous animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Use requestAnimationFrame for smooth animations
      animationFrameRef.current = requestAnimationFrame(() => {
        const currentTouch = e.touches[0]?.clientX;
        if (currentTouch !== undefined) {
          setCurrentX(currentTouch - startX);
        }
      });
    },
    [enableSwipe, isDragging, startX]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enableSwipe) return;
      const touch = e.touches[0]?.clientX;
      if (touch !== undefined) {
        setStartX(touch);
        setIsDragging(true);
      }
    },
    [enableSwipe]
  );

  const handleTouchEnd = useCallback(() => {
    if (!enableSwipe || !isDragging) return;

    const swipeThreshold = 100;

    if (currentX > swipeThreshold && onSwipeRight) {
      onSwipeRight();
    } else if (currentX < -swipeThreshold && onSwipeLeft) {
      onSwipeLeft();
    }

    setCurrentX(0);
    setIsDragging(false);
  }, [enableSwipe, isDragging, currentX, onSwipeRight, onSwipeLeft]);

  // Memoize transform and opacity calculations
  const cardStyle = useMemo(
    () => ({
      transform: isDragging ? `translateX(${currentX}px)` : "translateX(0px)",
      opacity: isDragging ? Math.max(0.7, 1 - Math.abs(currentX) / 200) : 1,
      transition: isDragging ? "none" : "all 0.3s ease",
      willChange: isDragging ? "transform, opacity" : "auto",
    }),
    [isDragging, currentX]
  );

  // Cleanup animation frame on unmount
  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative transition-all duration-300 ${className}`}
      style={cardStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}

      {/* Swipe Indicators */}
      {isDragging && (
        <>
          {currentX > 50 && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400 animate-pulse">
              ←
            </div>
          )}
          {currentX < -50 && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-400 animate-pulse">
              →
            </div>
          )}
        </>
      )}
    </div>
  );
};
