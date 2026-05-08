import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, ExternalLink, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { InfoHint } from "@/components/admin/InfoHint";
import type { Tables } from "@/integrations/supabase/types";

type Market = Tables<"markets">;

interface UpcomingResolutionsProps {
  markets: Market[];
}

type BucketKey = "week" | "month" | "next_month" | "three_months" | "rest_year" | "past";

const BUCKET_META: Record<BucketKey, { label: string; short: string }> = {
  week: { label: "This week", short: "≤7d" },
  month: { label: "This month", short: "≤30d" },
  next_month: { label: "Next month", short: "31–60d" },
  three_months: { label: "Next 3 months", short: "61–90d" },
  rest_year: { label: "Rest of year", short: ">90d" },
  past: { label: "Past deadline", short: "overdue" },
};

const BUCKET_ORDER: BucketKey[] = ["week", "month", "next_month", "three_months", "rest_year", "past"];

function bucketOf(deadline: Date, now: Date): BucketKey {
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return "past";
  const days = ms / (1000 * 60 * 60 * 24);
  if (days <= 7) return "week";
  if (days <= 30) return "month";
  if (days <= 60) return "next_month";
  if (days <= 90) return "three_months";
  return "rest_year";
}

export function UpcomingResolutions({ markets }: UpcomingResolutionsProps) {
  const now = useMemo(() => new Date(), []);

  const { buckets, noDeadlineCount } = useMemo(() => {
    const grouped: Record<BucketKey, (Market & { hoursLeft: number; daysOverdue: number })[]> = {
      week: [], month: [], next_month: [], three_months: [], rest_year: [], past: [],
    };
    let noDeadline = 0;
    for (const m of markets) {
      if (!m.deadline) { noDeadline++; continue; }
      const deadline = new Date(m.deadline);
      const key = bucketOf(deadline, now);
      // exclude already-resolved/cancelled markets from non-past buckets
      if (key !== "past" && (m.status === "resolved" || m.status === "cancelled")) continue;
      const hoursLeft = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
      const daysOverdue = key === "past" ? Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      grouped[key].push({ ...m, hoursLeft, daysOverdue });
    }
    grouped.past.sort((a, b) => b.daysOverdue - a.daysOverdue);
    BUCKET_ORDER.filter(k => k !== "past").forEach(k => {
      grouped[k].sort((a, b) => a.hoursLeft - b.hoursLeft);
    });
    return { buckets: grouped, noDeadlineCount: noDeadline };
  }, [markets, now]);

  const totalScheduled = BUCKET_ORDER.reduce((s, k) => s + buckets[k].length, 0);

  if (totalScheduled === 0 && noDeadlineCount === 0) return null;

  const formatTimeLeft = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const defaultTab: BucketKey = buckets.past.length > 0 ? "past" : (BUCKET_ORDER.find(k => buckets[k].length > 0) || "week");

  return (
    <Card className="border-warning/30 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Market Resolutions
          <InfoHint text={"Every market with a deadline is bucketed by how soon it expires.\n\n• This week: ≤7 days\n• This month: 8–30 days\n• Next month: 31–60 days\n• Next 3 months: 61–90 days\n• Rest of year: >90 days\n• Past deadline: overdue or already resolved\n\nMarkets without a deadline are not shown here — find them in 'All Markets'."} />
        </CardTitle>
        {noDeadlineCount > 0 && (
          <p className="text-xs text-muted-foreground pt-1">
            {noDeadlineCount} market{noDeadlineCount === 1 ? "" : "s"} have no deadline set and are not bucketed below.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-4 h-auto">
            {BUCKET_ORDER.map(k => (
              <TabsTrigger key={k} value={k} className="flex flex-col gap-0.5 py-2 text-[11px]">
                <span>{BUCKET_META[k].label}</span>
                <Badge variant={k === "past" && buckets[k].some(m => !m.resolved_outcome) ? "destructive" : "secondary"} className="text-[10px] h-4 px-1.5">
                  {buckets[k].length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {BUCKET_ORDER.map(k => (
            <TabsContent key={k} value={k} className="space-y-3">
              {buckets[k].length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No markets in this bucket.
                </p>
              ) : (
                buckets[k].map((market) => {
                  const isPast = k === "past";
                  const isResolved = isPast && !!market.resolved_outcome;
                  const yesTotal = market.yes_total || 0;
                  const noTotal = market.no_total || 0;
                  const total = yesTotal + noTotal;
                  const yesPercent = total > 0 ? Math.round((yesTotal / total) * 100) : 50;
                  const borderClass = isPast
                    ? (isResolved ? "border-primary/50" : "border-destructive/50")
                    : (k === "week" ? "border-warning/50" : "border-border");

                  return (
                    <div key={market.id} className={`flex items-center gap-4 p-3 rounded-lg border ${borderClass} bg-background/50`}>
                      <div className={isPast ? (isResolved ? "text-primary" : "text-destructive") : "text-muted-foreground"}>
                        {isPast ? (isResolved ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />) : <Clock className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {isPast ? (
                            isResolved ? (
                              <Badge className="bg-primary text-primary-foreground text-xs">Resolved: {market.resolved_outcome}</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                {market.daysOverdue === 0 ? "Overdue today" : `${market.daysOverdue}d overdue`}
                              </Badge>
                            )
                          ) : (
                            <Badge variant="secondary" className="text-xs">{formatTimeLeft(market.hoursLeft)}</Badge>
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
                        onClick={() => window.open(`https://lora.algokit.io/testnet/application/${market.app_id}`, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Lora
                      </Button>
                    </div>
                  );
                })
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
