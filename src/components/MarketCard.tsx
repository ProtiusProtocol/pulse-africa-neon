import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MarketCardProps {
  title: string;
  yes: number;
  no: number;
  yesAmount?: number;
  noAmount?: number;
  volatility: "low" | "medium" | "high";
  endsIn?: string;
  deadline?: string | Date;
  trend: "up" | "down";
  trendValue: number;
  category?: string;
  linkedSignals?: { code: string; name: string }[];
  resolutionCriteria?: string;
  onTrade?: () => void;
}

const formatAmount = (amount: number): string => {
  // Amount is already in ALGO (from database)
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toFixed(2);
};

const formatCountdown = (ms: number): string => {
  if (ms <= 0) return "Resolved";
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  const remainingHours = hours % 24;

  if (months > 0) {
    return `${months}mo ${remainingDays}d ${remainingHours}h`;
  } else if (days > 0) {
    return `${days}d ${remainingHours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export const MarketCard = ({
  title,
  yes,
  no,
  yesAmount,
  noAmount,
  volatility,
  endsIn,
  deadline,
  trend,
  trendValue,
  category,
  linkedSignals,
  resolutionCriteria,
  onTrade,
}: MarketCardProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!deadline) {
      setTimeLeft(endsIn || "");
      return;
    }

    const targetDate = typeof deadline === "string" ? new Date(deadline) : deadline;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      setTimeLeft(formatCountdown(distance));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deadline, endsIn]);

  const volatilityConfig = {
    low: { icon: "🔥", text: "Low", color: "text-muted-foreground" },
    medium: { icon: "⚡", text: "Medium", color: "text-secondary" },
    high: { icon: "💥", text: "High", color: "text-accent" },
  };

  const vol = volatilityConfig[volatility];
  const isUrgent = deadline && new Date(deadline).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  // Calculate potential payout multipliers
  const yesPool = yesAmount || 0;
  const noPool = noAmount || 0;
  const totalPool = yesPool + noPool;
  
  // Payout multiplier: if you bet 1 ALGO on YES and win, you get back (totalPool / yesPool)
  // This assumes winner-takes-all proportional payout
  const yesMultiplier = yesPool > 0 ? totalPool / yesPool : 0;
  const noMultiplier = noPool > 0 ? totalPool / noPool : 0;

  return (
    <Card className="group p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 hover:glow-primary cursor-pointer">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {category && (
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                {category}
              </span>
            )}
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
          </div>
          <span className={`text-xs font-bold ${vol.color} flex items-center gap-1`}>
            {vol.icon} {vol.text}
          </span>
        </div>

        {/* Linked Signals */}
        {linkedSignals && linkedSignals.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {linkedSignals.map((signal) => (
              <span
                key={signal.code}
                className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                title={signal.name}
              >
                {signal.code}
              </span>
            ))}
          </div>
        )}

        {/* Probability Bars */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">YES</span>
              {yesAmount !== undefined && (
                <span className="text-xs text-primary/70 font-mono">
                  Pool: {formatAmount(yesAmount)}
                </span>
              )}
              {yesMultiplier > 0 && (
                <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {yesMultiplier.toFixed(2)}x
                </span>
              )}
            </div>
            <span className="text-2xl font-bold text-primary text-glow-primary">
              {yes}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary glow-primary transition-all duration-500"
              style={{ width: `${yes}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">NO</span>
              {noAmount !== undefined && (
                <span className="text-xs text-secondary/70 font-mono">
                  Pool: {formatAmount(noAmount)}
                </span>
              )}
              {noMultiplier > 0 && (
                <span className="text-xs font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
                  {noMultiplier.toFixed(2)}x
                </span>
              )}
            </div>
            <span className="text-2xl font-bold text-secondary text-glow-secondary">
              {no}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary glow-secondary transition-all duration-500"
              style={{ width: `${no}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className={`flex items-center gap-2 text-xs ${isUrgent ? "text-accent animate-pulse" : "text-muted-foreground"}`}>
            <Clock className={`w-3 h-3 ${isUrgent ? "text-accent" : ""}`} />
            {timeLeft}
          </div>
          <div
            className={`flex items-center gap-1 text-sm font-bold ${
              trend === "up" ? "text-primary" : "text-accent"
            }`}
          >
            {trend === "up" ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {trendValue}%
          </div>
        </div>

        {/* CTA */}
        <Button variant="hero" size="sm" className="w-full" onClick={onTrade}>
          Trade Now
        </Button>
      </div>
    </Card>
  );
};
