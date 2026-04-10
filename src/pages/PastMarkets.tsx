import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, CheckCircle2, AlertCircle, Trophy, TrendingUp, Globe, Zap, Dribbble } from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  Energy: <Zap className="h-4 w-4" />,
  Climate: <Globe className="h-4 w-4" />,
  Sport: <Dribbble className="h-4 w-4" />,
  Political: <Trophy className="h-4 w-4" />,
  Currency: <TrendingUp className="h-4 w-4" />,
};

const PastMarkets = () => {
  const { data: markets, isLoading } = useQuery({
    queryKey: ["past-markets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .or(`resolved_outcome.not.is.null,deadline.lt.${new Date().toISOString()}`)
        .order("deadline", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const resolvedMarkets = markets?.filter((m) => m.resolved_outcome) || [];
  const expiredMarkets = markets?.filter((m) => !m.resolved_outcome) || [];

  const getStatusBadge = (market: any) => {
    if (market.resolved_outcome) {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Resolved: {market.resolved_outcome}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Awaiting Resolution
      </Badge>
    );
  };

  const MarketArchiveCard = ({ market }: { market: any }) => {
    const yesPct = (() => {
      const yes = Number(market.yes_total) || 0;
      const no = Number(market.no_total) || 0;
      if (yes + no === 0) return 50;
      return Math.round((yes / (yes + no)) * 100);
    })();

    return (
      <Card className="p-6 hover:shadow-md transition-shadow border-border/50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              {categoryIcons[market.category] || <Globe className="h-3 w-3" />}
              {market.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {market.region}
            </Badge>
          </div>
          {getStatusBadge(market)}
        </div>

        <h3 className="font-semibold text-base mb-3 leading-snug">{market.title}</h3>

        {/* Probability bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-primary font-medium">Yes {yesPct}%</span>
            <span className="text-destructive font-medium">No {100 - yesPct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden flex">
            <div className="bg-primary/70 transition-all" style={{ width: `${yesPct}%` }} />
            <div className="bg-destructive/70 transition-all" style={{ width: `${100 - yesPct}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {market.deadline && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Deadline: {format(new Date(market.deadline), "MMM d, yyyy")}
            </span>
          )}
          {market.resolution_criteria && (
            <span className="truncate max-w-[200px]" title={market.resolution_criteria}>
              {market.resolution_criteria}
            </span>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            Market <span className="text-primary">Archive</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse our history of prediction markets across energy, politics, sport, and climate
            — showcasing the types of questions Augurion turns into tradeable outcomes.
          </p>
        </div>
      </section>

      <main className="container mx-auto py-8 px-4 max-w-5xl">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                <div className="h-5 bg-muted rounded w-3/4 mb-3" />
                <div className="h-2 bg-muted rounded w-full mb-3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="flex items-center justify-center gap-6 mb-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{resolvedMarkets.length}</strong> Resolved
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{expiredMarkets.length}</strong> Expired
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-accent" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{(markets?.length || 0)}</strong> Total Past
                </span>
              </div>
            </div>

            {/* Resolved Section */}
            {resolvedMarkets.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Resolved Markets
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {resolvedMarkets.map((market) => (
                    <MarketArchiveCard key={market.id} market={market} />
                  ))}
                </div>
              </div>
            )}

            {/* Expired Section */}
            {expiredMarkets.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Expired Markets
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  These markets have passed their deadline and are awaiting resolution or kept as historical reference.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {expiredMarkets.map((market) => (
                    <MarketArchiveCard key={market.id} market={market} />
                  ))}
                </div>
              </div>
            )}

            {(markets?.length || 0) === 0 && (
              <Card className="p-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Past Markets Yet</h3>
                <p className="text-muted-foreground">
                  Past and resolved markets will appear here as they expire.
                </p>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default PastMarkets;
