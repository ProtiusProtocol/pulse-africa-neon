import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, ExternalLink, AlertTriangle, Mail, CheckCircle, XCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Market = Tables<"markets">;

interface UpcomingResolutionsProps {
  markets: Market[];
}

interface MarketWithUrgency extends Market {
  hoursLeft: number;
  urgency: "urgent" | "approaching" | "soon";
}

interface PastDeadlineMarket extends Market {
  daysOverdue: number;
}

export function UpcomingResolutions({ markets }: UpcomingResolutionsProps) {
  const now = useMemo(() => new Date(), []);

  // Markets approaching deadline (next 7 days)
  const upcomingMarkets = useMemo(() => {
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return markets
      .filter((m) => {
        if (m.status !== "active" || !m.deadline) return false;
        const deadline = new Date(m.deadline);
        return deadline > now && deadline <= sevenDaysFromNow;
      })
      .map((m): MarketWithUrgency => {
        const deadline = new Date(m.deadline!);
        const hoursLeft = Math.max(
          0,
          Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))
        );
        const urgency: "urgent" | "approaching" | "soon" =
          hoursLeft <= 24 ? "urgent" : hoursLeft <= 72 ? "approaching" : "soon";
        return { ...m, hoursLeft, urgency };
      })
      .sort((a, b) => a.hoursLeft - b.hoursLeft);
  }, [markets, now]);

  // Markets past deadline (awaiting resolution or resolved)
  const pastDeadlineMarkets = useMemo(() => {
    return markets
      .filter((m) => {
        if (!m.deadline) return false;
        const deadline = new Date(m.deadline);
        return deadline <= now;
      })
      .map((m): PastDeadlineMarket => {
        const deadline = new Date(m.deadline!);
        const daysOverdue = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
        return { ...m, daysOverdue };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [markets, now]);

  const formatTimeLeft = (hours: number) => {
    if (hours < 24) {
      return `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const getUrgencyStyles = (urgency: "urgent" | "approaching" | "soon") => {
    switch (urgency) {
      case "urgent":
        return {
          badge: "bg-destructive text-destructive-foreground",
          border: "border-destructive/50",
          icon: "text-destructive",
        };
      case "approaching":
        return {
          badge: "bg-warning text-warning-foreground",
          border: "border-warning/50",
          icon: "text-warning",
        };
      case "soon":
        return {
          badge: "bg-muted text-muted-foreground",
          border: "border-border",
          icon: "text-muted-foreground",
        };
    }
  };

  const urgentCount = upcomingMarkets.filter((m) => m.urgency === "urgent").length;
  const approachingCount = upcomingMarkets.filter((m) => m.urgency === "approaching").length;
  const soonCount = upcomingMarkets.filter((m) => m.urgency === "soon").length;

  const awaitingCount = pastDeadlineMarkets.filter((m) => !m.resolved_outcome).length;
  const resolvedCount = pastDeadlineMarkets.filter((m) => m.resolved_outcome).length;

  // If no markets in either category, return null
  if (upcomingMarkets.length === 0 && pastDeadlineMarkets.length === 0) {
    return null;
  }

  return (
    <Card className="border-warning/30 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Market Resolutions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={pastDeadlineMarkets.length > 0 ? "past" : "upcoming"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming
              {upcomingMarkets.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {upcomingMarkets.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Past Deadline
              {awaitingCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {awaitingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming" className="space-y-3">
            {upcomingMarkets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No markets expiring in the next 7 days.
              </p>
            ) : (
              <>
                <div className="flex gap-2 flex-wrap mb-3">
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
                  {soonCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {soonCount} soon
                    </Badge>
                  )}
                </div>
                {upcomingMarkets.map((market) => {
                  const styles = getUrgencyStyles(market.urgency);
                  const yesTotal = market.yes_total || 0;
                  const noTotal = market.no_total || 0;
                  const total = yesTotal + noTotal;
                  const yesPercent = total > 0 ? Math.round((yesTotal / total) * 100) : 50;
                  const triggersEmail = market.urgency !== "soon";

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
                          {triggersEmail && (
                            <span title="Email alert enabled">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                            </span>
                          )}
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
                  <Mail className="inline h-3 w-3 mr-1" /> = email alerts enabled (≤3 days). Resolve markets in Lora before deadline.
                </p>
              </>
            )}
          </TabsContent>

          {/* Past Deadline Tab */}
          <TabsContent value="past" className="space-y-3">
            {pastDeadlineMarkets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No markets past their deadline.
              </p>
            ) : (
              <>
                <div className="flex gap-2 flex-wrap mb-3">
                  {awaitingCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {awaitingCount} awaiting resolution
                    </Badge>
                  )}
                  {resolvedCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {resolvedCount} resolved
                    </Badge>
                  )}
                </div>
                {pastDeadlineMarkets.map((market) => {
                  const isResolved = !!market.resolved_outcome;
                  const yesTotal = market.yes_total || 0;
                  const noTotal = market.no_total || 0;
                  const total = yesTotal + noTotal;
                  const yesPercent = total > 0 ? Math.round((yesTotal / total) * 100) : 50;

                  return (
                    <div
                      key={market.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border ${
                        isResolved ? "border-primary/50" : "border-destructive/50"
                      } bg-background/50`}
                    >
                      <div className={isResolved ? "text-primary" : "text-destructive"}>
                        {isResolved ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isResolved ? (
                            <Badge className="bg-primary text-primary-foreground text-xs">
                              Resolved: {market.resolved_outcome}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              {market.daysOverdue === 0
                                ? "Overdue today"
                                : `${market.daysOverdue}d overdue`}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{market.category}</span>
                        </div>
                        <p className="text-sm font-medium truncate">{market.title}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {market.outcome_ref} • Final Odds:{" "}
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
                  Markets awaiting resolution should be resolved in Lora. After resolving on-chain, update the database status.
                </p>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
