import type { MarketRun } from "./firestore";

export interface SpendingAnalytics {
  totalSpent: number;
  totalRuns: number;
  averageSpending: number;
  budgetAccuracy: number;
  budgetSuccessRate: number;
  totalSaved: number;
  spendingTrend: "increasing" | "decreasing" | "stable";
  trendPercentage: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  averagePrice: number;
}

export interface SpendingPrediction {
  nextWeekPrediction: number;
  next4WeeksPrediction: number[];
  recommendedBudget: number;
  confidence: number;
  trendDirection: "up" | "down" | "stable";
  insights: string[];
}

export interface SmartInsight {
  type: "success" | "warning" | "info" | "tip";
  title: string;
  message: string;
  icon: string;
}

export class AnalyticsService {
  // Calculate comprehensive spending analytics
  static calculateSpendingAnalytics(runs: MarketRun[]): SpendingAnalytics {
    const completedRuns = runs.filter((run) => run.status === "completed");

    if (completedRuns.length === 0) {
      return {
        totalSpent: 0,
        totalRuns: 0,
        averageSpending: 0,
        budgetAccuracy: 0,
        budgetSuccessRate: 0,
        totalSaved: 0,
        spendingTrend: "stable",
        trendPercentage: 0,
      };
    }

    const totalSpent = completedRuns.reduce(
      (sum, run) => sum + (run.totalSpent || 0),
      0
    );
    const totalEstimated = completedRuns.reduce(
      (sum, run) => sum + (run.totalEstimated || 0),
      0
    );
    const totalSaved = totalEstimated - totalSpent;
    const averageSpending = totalSpent / completedRuns.length;

    // Budget analysis
    const runsWithBudget = completedRuns.filter((run) => run.budget);
    const budgetSuccessRate =
      runsWithBudget.length > 0
        ? (runsWithBudget.filter((run) => (run.totalSpent || 0) <= run.budget!)
            .length /
            runsWithBudget.length) *
          100
        : 0;

    const budgetAccuracy =
      runsWithBudget.length > 0
        ? (runsWithBudget.reduce((sum, run) => {
            const variance =
              Math.abs((run.totalSpent || 0) - run.budget!) / run.budget!;
            return sum + (1 - variance);
          }, 0) /
            runsWithBudget.length) *
          100
        : 0;

    // Trend analysis (last 4 weeks vs previous 4 weeks)
    const { spendingTrend, trendPercentage } =
      this.calculateSpendingTrend(completedRuns);

    return {
      totalSpent,
      totalRuns: completedRuns.length,
      averageSpending,
      budgetAccuracy: Math.max(0, budgetAccuracy),
      budgetSuccessRate,
      totalSaved,
      spendingTrend,
      trendPercentage,
    };
  }

  // Calculate spending by category
  static calculateCategorySpending(runs: MarketRun[]): CategorySpending[] {
    const completedRuns = runs.filter((run) => run.status === "completed");
    const categoryData: Record<string, { total: number; count: number }> = {};

    completedRuns.forEach((run) => {
      run.items?.forEach((item) => {
        if (item.completed) {
          const amount = item.actual_price || item.estimated_price || 0;
          const category = item.category || "other";

          if (!categoryData[category]) {
            categoryData[category] = { total: 0, count: 0 };
          }

          categoryData[category].total += amount;
          categoryData[category].count += 1;
        }
      });
    });

    const totalSpent = Object.values(categoryData).reduce(
      (sum, cat) => sum + cat.total,
      0
    );

    return Object.entries(categoryData)
      .map(([category, data]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        amount: data.total,
        percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0,
        averagePrice: data.count > 0 ? data.total / data.count : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // Generate spending predictions
  static generateSpendingPrediction(runs: MarketRun[]): SpendingPrediction {
    const completedRuns = runs.filter((run) => run.status === "completed");

    if (completedRuns.length < 2) {
      return {
        nextWeekPrediction: 0,
        next4WeeksPrediction: [0, 0, 0, 0],
        recommendedBudget: 0,
        confidence: 0,
        trendDirection: "stable",
        insights: [
          "Not enough data for predictions. Complete more market runs to see forecasts.",
        ],
      };
    }

    // Get recent spending data (last 8 weeks)
    const now = new Date();
    const recentRuns = completedRuns
      .filter((run) => {
        const runDate = new Date(
          run.createdAt.toDate ? run.createdAt.toDate() : run.createdAt
        );
        const weeksAgo =
          (now.getTime() - runDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
        return weeksAgo <= 8;
      })
      .sort((a, b) => {
        const dateA = new Date(
          a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt
        );
        const dateB = new Date(
          b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt
        );
        return dateA.getTime() - dateB.getTime();
      });

    const averageSpending =
      recentRuns.reduce((sum, run) => sum + (run.totalSpent || 0), 0) /
      recentRuns.length;

    // Simple linear regression for trend
    const { slope, trend } = this.calculateLinearTrend(recentRuns);

    // Predict next 4 weeks
    const next4WeeksPrediction = Array.from({ length: 4 }, (_, i) => {
      const basePrediction = averageSpending + slope * (i + 1);
      return Math.max(0, basePrediction);
    });

    const nextWeekPrediction = next4WeeksPrediction[0] || 0;

    // Recommended budget (add 20% buffer to prediction)
    const recommendedBudget = nextWeekPrediction * 1.2;

    // Confidence based on data consistency
    const confidence = this.calculatePredictionConfidence(recentRuns);

    // Generate insights
    const insights = this.generatePredictionInsights(completedRuns, {
      averageSpending,
      trend,
      confidence,
    });

    return {
      nextWeekPrediction,
      next4WeeksPrediction,
      recommendedBudget,
      confidence,
      trendDirection: trend,
      insights,
    };
  }

  // Calculate spending trend
  private static calculateSpendingTrend(runs: MarketRun[]): {
    spendingTrend: "increasing" | "decreasing" | "stable";
    trendPercentage: number;
  } {
    if (runs.length < 4) {
      return { spendingTrend: "stable", trendPercentage: 0 };
    }

    // Sort by date
    const sortedRuns = runs.sort((a, b) => {
      const dateA = new Date(
        a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt
      );
      const dateB = new Date(
        b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt
      );
      return dateA.getTime() - dateB.getTime();
    });

    const halfPoint = Math.floor(sortedRuns.length / 2);
    const firstHalf = sortedRuns.slice(0, halfPoint);
    const secondHalf = sortedRuns.slice(halfPoint);

    const firstHalfAvg =
      firstHalf.reduce((sum, run) => sum + (run.totalSpent || 0), 0) /
      firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, run) => sum + (run.totalSpent || 0), 0) /
      secondHalf.length;

    const percentageChange =
      firstHalfAvg > 0
        ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
        : 0;

    if (Math.abs(percentageChange) < 5) {
      return {
        spendingTrend: "stable",
        trendPercentage: Math.abs(percentageChange),
      };
    } else if (percentageChange > 0) {
      return { spendingTrend: "increasing", trendPercentage: percentageChange };
    } else {
      return {
        spendingTrend: "decreasing",
        trendPercentage: Math.abs(percentageChange),
      };
    }
  }

  // Calculate linear trend
  private static calculateLinearTrend(runs: MarketRun[]): {
    slope: number;
    trend: "up" | "down" | "stable";
  } {
    if (runs.length < 2) {
      return { slope: 0, trend: "stable" };
    }

    const n = runs.length;
    const sumX = runs.reduce((sum, _, i) => sum + i, 0);
    const sumY = runs.reduce((sum, run) => sum + (run.totalSpent || 0), 0);
    const sumXY = runs.reduce(
      (sum, run, i) => sum + i * (run.totalSpent || 0),
      0
    );
    const sumX2 = runs.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    const trend = Math.abs(slope) < 1 ? "stable" : slope > 0 ? "up" : "down";

    return { slope, trend };
  }

  // Calculate prediction confidence
  private static calculatePredictionConfidence(runs: MarketRun[]): number {
    if (runs.length < 3) return 30;

    const amounts = runs.map((run) => run.totalSpent || 0);
    const mean =
      amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) /
      amounts.length;
    const standardDeviation = Math.sqrt(variance);

    // Lower standard deviation = higher confidence
    const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 1;
    const confidence = Math.max(
      30,
      Math.min(95, 100 - coefficientOfVariation * 100)
    );

    return Math.round(confidence);
  }

  // Generate prediction insights
  private static generatePredictionInsights(
    runs: MarketRun[],
    analytics: {
      averageSpending: number;
      trend: "up" | "down" | "stable";
      confidence: number;
    }
  ): string[] {
    const insights: string[] = [];
    const completedRuns = runs.filter((run) => run.status === "completed");

    // Trend insights
    if (analytics.trend === "up") {
      insights.push(
        `Your spending has been trending upward. Consider reviewing your shopping habits or increasing your budget.`
      );
    } else if (analytics.trend === "down") {
      insights.push(
        `Great job! Your spending has been decreasing. You're becoming more efficient at market shopping.`
      );
    }

    // Budget insights
    const runsWithBudget = completedRuns.filter((run) => run.budget);
    if (runsWithBudget.length > 0) {
      const budgetSuccessRate =
        (runsWithBudget.filter((run) => (run.totalSpent || 0) <= run.budget!)
          .length /
          runsWithBudget.length) *
        100;

      if (budgetSuccessRate >= 80) {
        insights.push(
          `Excellent budget management! You stay within budget ${Math.round(
            budgetSuccessRate
          )}% of the time.`
        );
      } else if (budgetSuccessRate < 50) {
        insights.push(
          `Consider setting more realistic budgets. You've exceeded budget in ${Math.round(
            100 - budgetSuccessRate
          )}% of runs.`
        );
      }
    }

    // Frequency insights
    if (completedRuns.length >= 5) {
      const now = new Date();
      const firstRun = completedRuns[0];
      const oldestRun = new Date(
        firstRun?.createdAt.toDate
          ? firstRun.createdAt.toDate()
          : firstRun?.createdAt || now
      );
      const daysBetween =
        (now.getTime() - oldestRun.getTime()) / (1000 * 60 * 60 * 24);
      const frequency = completedRuns.length / (daysBetween / 7); // runs per week

      if (frequency > 3) {
        insights.push(
          `You shop frequently (${frequency.toFixed(
            1
          )} times per week). Consider bulk buying to reduce costs.`
        );
      } else if (frequency < 1) {
        insights.push(
          `You shop infrequently. Planning larger trips might help you take advantage of bulk discounts.`
        );
      }
    }

    // Savings insights
    const totalEstimated = completedRuns.reduce(
      (sum, run) => sum + (run.totalEstimated || 0),
      0
    );
    const totalSpent = completedRuns.reduce(
      (sum, run) => sum + (run.totalSpent || 0),
      0
    );
    const totalSaved = totalEstimated - totalSpent;

    if (totalSaved > 0) {
      insights.push(
        `You've saved $${totalSaved.toFixed(
          2
        )} total by smart shopping! Keep up the great work.`
      );
    }

    // Default insight if no specific insights
    if (insights.length === 0) {
      insights.push(
        `Keep tracking your shopping to unlock more personalized insights and predictions.`
      );
    }

    return insights;
  }

  // Generate smart recommendations
  static generateSmartInsights(runs: MarketRun[]): SmartInsight[] {
    const insights: SmartInsight[] = [];
    const analytics = this.calculateSpendingAnalytics(runs);
    const completedRuns = runs.filter((run) => run.status === "completed");

    // Budget performance insight
    if (analytics.budgetSuccessRate >= 80) {
      insights.push({
        type: "success",
        title: "Budget Master",
        message: `You stay within budget ${analytics.budgetSuccessRate.toFixed(
          0
        )}% of the time!`,
        icon: "🎯",
      });
    } else if (
      analytics.budgetSuccessRate < 50 &&
      analytics.budgetSuccessRate > 0
    ) {
      insights.push({
        type: "warning",
        title: "Budget Alert",
        message: `Consider setting more realistic budgets. You exceed budget ${(
          100 - analytics.budgetSuccessRate
        ).toFixed(0)}% of the time.`,
        icon: "⚠️",
      });
    }

    // Spending trend insight
    if (analytics.spendingTrend === "decreasing") {
      insights.push({
        type: "success",
        title: "Smart Shopper",
        message: `Your spending decreased by ${analytics.trendPercentage.toFixed(
          1
        )}%. Great job optimizing!`,
        icon: "📉",
      });
    } else if (
      analytics.spendingTrend === "increasing" &&
      analytics.trendPercentage > 20
    ) {
      insights.push({
        type: "info",
        title: "Spending Increase",
        message: `Your spending increased by ${analytics.trendPercentage.toFixed(
          1
        )}%. Review your recent purchases.`,
        icon: "📈",
      });
    }

    // Savings insight
    if (analytics.totalSaved > 0) {
      insights.push({
        type: "success",
        title: "Money Saved",
        message: `You've saved $${analytics.totalSaved.toFixed(
          2
        )} through smart shopping!`,
        icon: "💰",
      });
    }

    // Experience insight
    if (completedRuns.length >= 10) {
      insights.push({
        type: "tip",
        title: "Shopping Expert",
        message: `With ${completedRuns.length} completed runs, you're becoming a market expert! Consider sharing tips with others.`,
        icon: "🏆",
      });
    }

    return insights;
  }
}
