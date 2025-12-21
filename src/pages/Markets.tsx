import { MarketCard } from "@/components/MarketCard";
import { TradeModal } from "@/components/TradeModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Activity } from "lucide-react";

interface Market {
  id: string;
  title: string;
  category: string;
  region: string;
  status: string;
  app_id: string;
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
}

const Markets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [signals, setSignals] = useState<FragilitySignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  const fetchData = async () => {
    const [marketsRes, signalsRes] = await Promise.all([
      supabase.from("markets").select("*").eq("status", "active").order("created_at"),
      supabase.from("fragility_signals").select("id, signal_code, name").order("signal_code"),
    ]);

    if (marketsRes.data) setMarkets(marketsRes.data);
    if (signalsRes.data) setSignals(signalsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates for markets table
    const channel = supabase
      .channel('markets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'markets'
        },
        () => {
          // Refetch when any market changes
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTrade = (market: Market) => {
    setSelectedMarket(market);
    setIsTradeModalOpen(true);
  };

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
            <span className="text-primary text-glow-primary">Tradeable Markets</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Binary, time-bound outcomes linked to fragility signals. Place your predictions.
          </p>
          <a 
            href="/intelligence" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-all"
          >
            <Activity className="w-4 h-4 text-primary" />
            <span className="font-medium">View Signal Intelligence</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>

        {/* Info Banner */}
        <div className="mb-8 p-4 bg-card/50 border border-border rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            <span className="text-primary font-semibold">{markets.length} Active Markets</span> — 
            Each market is linked to underlying fragility signals that inform probability drift
          </p>
        </div>

        {/* Markets Grid */}
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
                  onTrade={() => handleTrade(market)}
                />
              </div>
            );
          })}
        </div>

        {/* Stats Banner */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-card border border-border rounded-lg text-center space-y-2 hover:border-primary/50 transition-all glow-primary">
            <div className="text-4xl font-bold text-primary text-glow-primary">{markets.length}</div>
            <div className="text-muted-foreground">Active Markets</div>
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
      </div>

      {/* Trade Modal */}
      <TradeModal
        market={selectedMarket}
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        onTradeComplete={fetchData}
      />
    </div>
  );
};

export default Markets;
