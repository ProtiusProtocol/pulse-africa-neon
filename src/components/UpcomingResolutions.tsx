import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, AlertTriangle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Market = Tables<"markets">;

interface UpcomingResolutionsProps {
  markets: Market[];
}

interface MarketWithUrgency extends Market {
  hoursLeft: number;
  urgency: "urgent" | "approaching" | "safe";
}

export function UpcomingResolutions({ markets }: UpcomingResolutionsProps) {
  const upcomingMarkets = useMemo(() => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return markets
      .filter((m) => {
        if (m.status !== "active" || !m.deadline) return false;
        const deadline = new Date(m.deadline);
        return deadline > now && deadline <= threeDaysFromNow;
      })
      .map((m): MarketWithUrgency => {
        const deadline = new Date(m.deadline!);
        const hoursLeft = Math.max(
          0,
          Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))
        );
        const urgency: "urgent" | "approaching" | "safe" =
          hoursLeft <= 24 ? "urgent" : hoursLeft <= 72 ? "approaching" : "safe";
        return { ...m, hoursLeft, urgency };
      })
      .sort((a, b) => a.hoursLeft - b.hoursLeft);
  }, [markets]);

  const formatTimeLeft = (hours: number) => {
    if (hours < 24) {
      return `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const getUrgencyStyles = (urgency: "urgent" | "approaching" | "safe") => {
    switch (urgency) {
      case "urgent":
        return {
          badge: "bg-destructive text-destructive-foreground",
          border: "border-destructive/50",
          icon: "text-destructive",
        };
      case "approaching":
        return {
          badge: "bg-amber-500 text-white",
          border: "border-amber-500/50",
          icon: "text-amber-500",
        };
      default:
        return {
          badge: "bg-muted text-muted-foreground",
          border: "border-border",
          icon: "text-muted-foreground",
        };
    }
  };

  if (upcomingMarkets.length === 0) {
    return null;
  }

  const urgentCount = upcomingMarkets.filter((m) => m.urgency === "urgent").length;
  const approachingCount = upcomingMarkets.filter((m) => m.urgency === "approaching").length;

  return (
    <Card className="border-warning/30 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Upcoming Resolutions
          <div className="ml-auto flex gap-2">
            {urgentCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {urgentCount} urgent
              </Badge>
            )}
            {approachingCount > 0 && (
              <Badge className="bg-warning text-warning-foreground text-xs">
                {approachingCount} approaching
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingMarkets.map((market) => {
          const styles = getUrgencyStyles(market.urgency);
          const yesTotal = market.yes_total || 0;
          const noTotal = market.no_total || 0;
          const total = yesTotal + noTotal;
          const yesPercent = total > 0 ? Math.round((yesTotal / total) * 100) : 50;

          return (
            <div
              key={market.id}
              className={`flex items-center gap-4 p-3 rounded-lg border ${styles.border} bg-background/50`}
            >
              <div className={`${styles.icon}`}>
                <Clock className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`${styles.badge} text-xs`}>
                    {formatTimeLeft(market.hoursLeft)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{market.category}</span>
                </div>
                <p className="text-sm font-medium truncate">{market.title}</p>
                <p className="text-xs text-muted-foreground">
                  ID: {market.outcome_ref} • Odds:{" "}
                  <span className="text-primary">{yesPercent}%</span> /{" "}
                  <span className="text-destructive">{100 - yesPercent}%</span>
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() =>
                  window.open(
                    `https://lora.algokit.io/testnet/application/${market.app_id}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Lora
              </Button>
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          Resolve markets in Lora before deadline, then update status in database.
        </p>
      </CardContent>
    </Card>
  );
}
