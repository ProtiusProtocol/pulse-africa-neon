import { MarketCard } from "@/components/MarketCard";
import { FragilitySignalCard } from "@/components/FragilitySignalCard";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Market {
  id: string;
  title: string;
  category: string;
  region: string;
  status: string;
  resolution_criteria: string | null;
  resolution_criteria_full: string | null;
  linked_signals: string[] | null;
  deadline: string | null;
  yes_total: number | null;
  no_total: number | null;
}

interface FragilitySignal {
  id: string;
  signal_code: string;
  name: string;
  description: string;
  core_components: string[];
  why_it_matters: string;
  current_direction: string;
  last_updated: string;
}

const Markets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [signals, setSignals] = useState<FragilitySignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [marketsRes, signalsRes] = await Promise.all([
        supabase.from("markets").select("*").eq("status", "active").order("created_at"),
        supabase.from("fragility_signals").select("*").order("signal_code"),
      ]);

      if (marketsRes.data) setMarkets(marketsRes.data);
      if (signalsRes.data) {
        setSignals(signalsRes.data.map(s => ({
          ...s,
          core_components: Array.isArray(s.core_components) ? s.core_components : JSON.parse(s.core_components as string)
        })));
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Calculate implied odds from totals (placeholder: 50/50 if no bets)
  const getOdds = (market: Market) => {
    const yes = market.yes_total || 0;
    const no = market.no_total || 0;
    const total = yes + no;
    if (total === 0) return { yes: 50, no: 50 };
    return {
      yes: Math.round((yes / total) * 100),
      no: Math.round((no / total) * 100),
    };
  };

  const getLinkedSignalNames = (linkedCodes: string[] | null) => {
    if (!linkedCodes) return [];
    return linkedCodes.map(code => {
      const signal = signals.find(s => s.signal_code === code);
      return signal ? { code, name: signal.name } : { code, name: code };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-6">
            <Skeleton className="h-16 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-6">
          <h1 className="text-4xl lg:text-6xl font-bold">
            <span className="text-primary text-glow-primary">Outcome Intelligence</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Layer-1 signals inform Layer-2 markets. Fragility drives probability.
          </p>
        </div>

        <Tabs defaultValue="markets" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
            <TabsTrigger value="markets" className="text-lg">Layer-2 Markets</TabsTrigger>
            <TabsTrigger value="signals" className="text-lg">Layer-1 Signals</TabsTrigger>
          </TabsList>

          {/* Layer-2: Live Markets */}
          <TabsContent value="markets">
            <div className="mb-8 p-4 bg-card/50 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                <span className="text-primary font-semibold">5 Locked Market Outcomes</span> — Binary, time-bound, objectively resolvable, linked to fragility signals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market, index) => {
                const odds = getOdds(market);
                const linkedSignals = getLinkedSignalNames(market.linked_signals);
                return (
                  <div
                    key={market.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <MarketCard
                      title={market.title}
                      yes={odds.yes}
                      no={odds.no}
                      volatility="medium"
                      deadline={market.deadline || undefined}
                      trend="up"
                      trendValue={0}
                      category={market.category}
                      linkedSignals={linkedSignals}
                      resolutionCriteria={market.resolution_criteria || undefined}
                    />
                  </div>
                );
              })}
            </div>

            {/* Stats Banner */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-card border border-border rounded-lg text-center space-y-2 hover:border-primary/50 transition-all glow-primary">
                <div className="text-4xl font-bold text-primary text-glow-primary">5</div>
                <div className="text-muted-foreground">Locked Markets</div>
              </div>
              <div className="p-6 bg-card border border-border rounded-lg text-center space-y-2 hover:border-secondary/50 transition-all glow-secondary">
                <div className="text-4xl font-bold text-secondary text-glow-secondary">Binary</div>
                <div className="text-muted-foreground">Clear Resolution</div>
              </div>
              <div className="p-6 bg-card border border-border rounded-lg text-center space-y-2 hover:border-accent/50 transition-all glow-accent">
                <div className="text-4xl font-bold text-accent text-glow-accent">On-Chain</div>
                <div className="text-muted-foreground">Settlement</div>
              </div>
            </div>
          </TabsContent>

          {/* Layer-1: Fragility Signals */}
          <TabsContent value="signals">
            <div className="mb-8 p-4 bg-card/50 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                <span className="text-primary font-semibold">5 Canonical Fragility Signals</span> — Owned by Augurion, not bettable, updated weekly. Inputs that inform markets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {signals.map((signal, index) => (
                <div
                  key={signal.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <FragilitySignalCard signal={signal} />
                </div>
              ))}
            </div>

            {/* Signal Legend */}
            <div className="mt-12 p-6 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-bold text-foreground mb-4">Signal Directionality</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">↑ Elevated</Badge>
                  <span className="text-sm text-muted-foreground">Rising risk of disruption</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">→ Stable</Badge>
                  <span className="text-sm text-muted-foreground">No significant change</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">↓ Improving</Badge>
                  <span className="text-sm text-muted-foreground">Improving resilience</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Signal-Market Mapping */}
        <div className="mt-20 p-8 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border border-primary/30 rounded-lg">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">How Signals Drive Markets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {signals.map((signal) => {
              const linkedMarkets = markets.filter(m => m.linked_signals?.includes(signal.signal_code));
              return (
                <div key={signal.id} className="p-4 bg-card/50 border border-border rounded-lg">
                  <div className="text-xs font-mono text-primary mb-1">{signal.signal_code}</div>
                  <div className="text-sm font-semibold text-foreground mb-2">{signal.name}</div>
                  <div className="space-y-1">
                    {linkedMarkets.map(m => (
                      <div key={m.id} className="text-xs text-muted-foreground">
                        → {m.category}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Markets;
