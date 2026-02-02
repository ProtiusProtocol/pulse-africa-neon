import { MarketCard } from "@/components/MarketCard";
import { MarketMatrixView } from "@/components/MarketMatrixView";
import { TradeModal } from "@/components/TradeModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Activity, RefreshCw, LayoutGrid, TableProperties, Clock, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
  updated_at: string;
  resolved_outcome: string | null;
}

interface FragilitySignal {
  id: string;
  signal_code: string;
  name: string;
}

type TradeCounts = Record<string, number>;
type ViewMode = "grid" | "matrix";
type MarketTab = "active" | "past-deadline";

const Markets = () => {
  const [allMarkets, setAllMarkets] = useState<Market[]>([]);
  const [signals, setSignals] = useState<FragilitySignal[]>([]);
  const [tradeCounts, setTradeCounts] = useState<TradeCounts>({});
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeTab, setActiveTab] = useState<MarketTab>("active");

  const fetchData = async () => {
    const [marketsRes, signalsRes, tradesRes] = await Promise.all([
      supabase.from("markets").select("*").order("created_at"),
      supabase.from("fragility_signals").select("id, signal_code, name").order("signal_code"),
      supabase.from("user_trades").select("market_id"),
    ]);

    if (marketsRes.data) {
      setAllMarkets(marketsRes.data);
      // Find the most recent updated_at timestamp
      const mostRecent = marketsRes.data.reduce((latest, market) => {
        const marketDate = new Date(market.updated_at);
        return marketDate > latest ? marketDate : latest;
      }, new Date(0));
      if (mostRecent.getTime() > 0) {
        setLastSynced(mostRecent);
      }
    }
    if (signalsRes.data) setSignals(signalsRes.data);
    
    // Count trades per market
    if (tradesRes.data) {
      const counts: TradeCounts = {};
      tradesRes.data.forEach(trade => {
        counts[trade.market_id] = (counts[trade.market_id] || 0) + 1;
      });
      setTradeCounts(counts);
    }
    
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

  // Helper to check if market is past deadline
  const isMarketPastDeadline = (market: Market): boolean => {
    if (!market.deadline) return false;
    return new Date(market.deadline) < new Date();
  };

  // Filter markets by tab
  const activeMarkets = allMarkets.filter(m => 
    m.status === 'active' && !isMarketPastDeadline(m)
  );
  const pastDeadlineMarkets = allMarkets.filter(m => 
    m.status === 'resolved' || isMarketPastDeadline(m)
  );

  const markets = activeTab === 'active' ? activeMarkets : pastDeadlineMarkets;

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

        {/* Tabs for Active vs Past Deadline */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MarketTab)} className="mb-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Active
              <Badge variant="secondary" className="ml-1">{activeMarkets.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="past-deadline" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Past Deadline
              <Badge variant="outline" className="ml-1">{pastDeadlineMarkets.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Info Banner with View Toggle */}
        <div className="mb-8 p-4 bg-card/50 border border-border rounded-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              {activeTab === 'active' ? (
                <>
                  <span className="text-primary font-semibold">{activeMarkets.length} Active Markets</span> — 
                  Each market is linked to underlying fragility signals that inform probability drift
                </>
              ) : (
                <>
                  <span className="text-amber-500 font-semibold">{pastDeadlineMarkets.length} Past Deadline</span> — 
                  Markets awaiting resolution or already resolved
                </>
              )}
            </p>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "matrix" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode("matrix")}
                  title="Matrix view: categories as columns, ranked by activity"
                >
                  <TableProperties className="w-4 h-4" />
                </Button>
              </div>
              {lastSynced && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw className="w-3 h-3" />
                  <span>Synced {formatDistanceToNow(lastSynced, { addSuffix: true })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Markets Display */}
        {markets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {activeTab === 'active' 
                ? 'No active markets at the moment.' 
                : 'No markets have passed their deadline yet.'}
            </p>
          </div>
        ) : viewMode === "matrix" ? (
          <MarketMatrixView 
            markets={markets} 
            onTrade={handleTrade} 
            getOdds={getOdds}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market, index) => {
              const odds = getOdds(market);
              const linkedSignals = getLinkedSignalNames(market.linked_signals);
              const isPastDeadline = isMarketPastDeadline(market);
              return (
                <div
                  key={market.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <MarketCard
                    id={market.id}
                    title={market.title}
                    yes={odds.yes}
                    no={odds.no}
                    yesAmount={market.yes_total || 0}
                    noAmount={market.no_total || 0}
                    tradeCount={tradeCounts[market.id] || 0}
                    volatility="medium"
                    deadline={market.deadline || undefined}
                    trend="up"
                    trendValue={0}
                    category={market.category}
                    linkedSignals={linkedSignals}
                    resolutionCriteria={market.resolution_criteria || undefined}
                    onTrade={() => handleTrade(market)}
                    isPastDeadline={isPastDeadline}
                    resolvedOutcome={market.resolved_outcome}
                  />
                </div>
              );
            })}
          </div>
        )}

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
