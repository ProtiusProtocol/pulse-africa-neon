import { TrendingUp, TrendingDown, Clock, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MarketCardProps {
  title: string;
  yes: number;
  no: number;
  volatility: "low" | "medium" | "high";
  endsIn: string;
  trend: "up" | "down";
  trendValue: number;
}

export const MarketCard = ({
  title,
  yes,
  no,
  volatility,
  endsIn,
  trend,
  trendValue,
}: MarketCardProps) => {
  const volatilityConfig = {
    low: { icon: "🔥", text: "Low", color: "text-muted-foreground" },
    medium: { icon: "⚡", text: "Medium", color: "text-secondary" },
    high: { icon: "💥", text: "High", color: "text-accent" },
  };

  const vol = volatilityConfig[volatility];

  return (
    <Card className="group p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 hover:glow-primary cursor-pointer">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <span className={`text-xs font-bold ${vol.color} flex items-center gap-1`}>
            {vol.icon} {vol.text}
          </span>
        </div>

        {/* Probability Bars */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">YES</span>
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
            <span className="text-sm font-medium text-muted-foreground">NO</span>
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {endsIn}
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
        <Button variant="hero" size="sm" className="w-full">
          Trade Now
        </Button>
      </div>
    </Card>
  );
};
