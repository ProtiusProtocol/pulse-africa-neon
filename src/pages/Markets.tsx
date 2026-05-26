import { MarketCard } from "@/components/MarketCard";
import { MarketMatrixView } from "@/components/MarketMatrixView";
import { TradeModal } from "@/components/TradeModal";
import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight, Activity, RefreshCw, LayoutGrid, TableProperties,
  Clock, CheckCircle, AlertCircle, Hourglass, Search, X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useWallet } from "@/contexts/WalletContext";

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
type MarketTab = "active" | "awaiting" | "resolved" | "pending";
type SortMode = "pool" | "deadline" | "trades";

const Markets = () => {
  const [allMarkets, setAllMarkets] = useState<Market[]>([]);
  const [signals, setSignals] = useState<FragilitySignal[]>([]);
  const [tradeCounts, setTradeCounts] = useState<TradeCounts>({});
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeTab, setActiveTab] = useState<MarketTab>("active");
  const [searchParams, setSearchParams] = useSearchParams();
  const { isConnected } = useWallet();

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [signalFilter, setSignalFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("pool");

  const refetchTimer = useRef<number | null>(null);

  const fetchData = async () => {
    const [marketsRes, signalsRes, tradesRes] = await Promise.all([
      supabase.from("markets").select("*").order("created_at"),
      supabase.from("fragility_signals").select("id, signal_code, name").order("signal_code"),
      supabase.from("user_trades").select("market_id"),
    ]);

    if (marketsRes.data) {
      setAllMarkets(marketsRes.data);
      const mostRecent = marketsRes.data.reduce((latest, market) => {
        const marketDate = new Date(market.updated_at);
        return marketDate > latest ? marketDate : latest;
      }, new Date(0));
      if (mostRecent.getTime() > 0) setLastSynced(mostRecent);
    }
    if (signalsRes.data) setSignals(signalsRes.data);

    if (tradesRes.data) {
      const counts: TradeCounts = {};
      tradesRes.data.forEach((trade) => {
        counts[trade.market_id] = (counts[trade.market_id] || 0) + 1;
      });
      setTradeCounts(counts);
    }
    setLoading(false);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await supabase.functions.invoke("market-indexer");
      await fetchData();
    } catch (err) {
      console.warn("manual sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
    supabase.functions.invoke("market-indexer").catch((err) => {
      console.warn("market-indexer sync failed:", err);
    });

    const channel = supabase
      .channel("markets-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "markets" }, () => {
        // debounce: avoid storms of refetches when indexer writes in bursts
        if (refetchTimer.current) window.clearTimeout(refetchTimer.current);
        refetchTimer.current = window.setTimeout(() => fetchData(), 400);
      })
      .subscribe();

    return () => {
      if (refetchTimer.current) window.clearTimeout(refetchTimer.current);
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-open trade modal when ?market=ID is present in URL
  useEffect(() => {
    const marketId = searchParams.get("market");
    if (!marketId || allMarkets.length === 0) return;
    const m = allMarkets.find((x) => x.id === marketId);
    if (m) {
      setSelectedMarket(m);
      setIsTradeModalOpen(true);
      if (m.status === "resolved") setActiveTab("resolved");
      else if (m.deadline && new Date(m.deadline) < new Date()) setActiveTab("awaiting");
      else if (m.status === "pending") setActiveTab("pending");
      searchParams.delete("market");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, allMarkets, setSearchParams]);

  const isPastDeadline = (m: Market) => !!m.deadline && new Date(m.deadline) < new Date();

  // Bucket markets into the 4 tabs (mutually exclusive)
  // Resolved tab auto-archives entries older than 30 days → they live on /past-markets
  const ARCHIVE_AFTER_DAYS = 30;
  const archiveCutoff = useMemo(
    () => Date.now() - ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000,
    []
  );
  const buckets = useMemo(() => {
    const active: Market[] = [];
    const awaiting: Market[] = [];
    const resolved: Market[] = [];
    const pending: Market[] = [];
    let archivedCount = 0;
    allMarkets.forEach((m) => {
      if (m.status === "resolved") {
        const resolvedAt = new Date(m.updated_at).getTime();
        if (resolvedAt >= archiveCutoff) resolved.push(m);
        else archivedCount++;
      } else if (isPastDeadline(m)) awaiting.push(m);
      else if (m.status === "active") active.push(m);
      else if (m.status === "pending") pending.push(m);
    });
    return { active, awaiting, resolved, pending, archivedCount };
  }, [allMarkets, archiveCutoff]);

  const current = buckets[activeTab];

  // Apply filters + sort
  const filteredMarkets = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = current.filter((m) => {
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
      if (signalFilter !== "all" && !(m.linked_signals || []).includes(signalFilter)) return false;
      if (q && !m.title.toLowerCase().includes(q)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortMode === "pool") {
        return ((b.yes_total || 0) + (b.no_total || 0)) - ((a.yes_total || 0) + (a.no_total || 0));
      }
      if (sortMode === "trades") {
        return (tradeCounts[b.id] || 0) - (tradeCounts[a.id] || 0);
      }
      const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return ad - bd;
    });
    return list;
  }, [current, search, categoryFilter, signalFilter, sortMode, tradeCounts]);

  // Distinct categories across all markets (for filter)
  const categories = useMemo(
    () => Array.from(new Set(allMarkets.map((m) => m.category).filter(Boolean))).sort(),
    [allMarkets]
  );
  // Distinct signal codes that appear on at least one market
  const usedSignalCodes = useMemo(() => {
    const set = new Set<string>();
    allMarkets.forEach((m) => (m.linked_signals || []).forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [allMarkets]);

  const handleTrade = (market: Market) => {
    setSelectedMarket(market);
    setIsTradeModalOpen(true);
  };

  const getOdds = (market: Market) => {
    const yes = market.yes_total || 0;
    const no = market.no_total || 0;
    const total = yes + no;
    if (total === 0) {
      const prior = (market as any).prior_yes_pct;
      if (prior != null && Number.isFinite(Number(prior))) {
        const p = Math.max(1, Math.min(99, Math.round(Number(prior))));
        return { yes: p, no: 100 - p };
      }
      return { yes: 50, no: 50 };
    }
    return { yes: Math.round((yes / total) * 100), no: Math.round((no / total) * 100) };
  };


  const getLinkedSignalNames = (linkedCodes: string[] | null) => {
    if (!linkedCodes) return [];
    return linkedCodes.map((code) => {
      const signal = signals.find((s) => s.signal_code === code);
      return signal ? { code, name: signal.name } : { code, name: code };
    });
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setSignalFilter("all");
  };
  const hasActiveFilters = !!search || categoryFilter !== "all" || signalFilter !== "all";

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-1/2 mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Slim header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold">
              <span className="text-primary text-glow-primary">Tradeable Markets</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Binary, time-bound outcomes linked to fragility signals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/past-markets"
              className="inline-flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg hover:border-primary/50 transition-all text-sm"
            >
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="font-medium">Market Archive</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </a>
            <a
              href="/intelligence"
              className="inline-flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg hover:border-primary/50 transition-all text-sm"
            >
              <Activity className="w-4 h-4 text-primary" />
              <span className="font-medium">Signal Intelligence</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MarketTab)} className="mb-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="active" className="flex items-center gap-2 py-2">
              <Clock className="w-4 h-4" /> Active
              <Badge variant="secondary" className="ml-1">{buckets.active.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="awaiting" className="flex items-center gap-2 py-2">
              <AlertCircle className="w-4 h-4" /> Awaiting
              <Badge variant="outline" className="ml-1">{buckets.awaiting.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex items-center gap-2 py-2">
              <CheckCircle className="w-4 h-4" /> Resolved
              <Badge variant="outline" className="ml-1">{buckets.resolved.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2 py-2">
              <Hourglass className="w-4 h-4" /> Pending
              <Badge variant="outline" className="ml-1">{buckets.pending.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filter / control bar */}
        <div className="mb-6 p-3 bg-card/50 border border-border rounded-lg">
          <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search markets…"
                className="pl-8 h-9"
              />
            </div>

            {/* Category */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-full lg:w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent className="bg-card z-50">
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Signal */}
            <Select value={signalFilter} onValueChange={setSignalFilter}>
              <SelectTrigger className="h-9 w-full lg:w-[200px]"><SelectValue placeholder="Signal" /></SelectTrigger>
              <SelectContent className="bg-card z-50 max-h-72">
                <SelectItem value="all">All signals</SelectItem>
                {usedSignalCodes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
              <SelectTrigger className="h-9 w-full lg:w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card z-50">
                <SelectItem value="pool">Pool size</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="trades">Trade count</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 gap-1" onClick={clearFilters}>
                <X className="w-3 h-3" /> Clear
              </Button>
            )}

            {/* View toggle + refresh */}
            <div className="flex items-center gap-2 lg:ml-auto">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"} size="sm" className="h-7 px-2"
                  onClick={() => setViewMode("grid")}
                ><LayoutGrid className="w-4 h-4" /></Button>
                <Button
                  variant={viewMode === "matrix" ? "default" : "ghost"} size="sm" className="h-7 px-2"
                  onClick={() => setViewMode("matrix")} title="Matrix view"
                ><TableProperties className="w-4 h-4" /></Button>
              </div>
              <Button
                variant="ghost" size="sm" className="h-9 gap-1"
                onClick={handleManualSync} disabled={isSyncing}
                title={lastSynced ? `Synced ${formatDistanceToNow(lastSynced, { addSuffix: true })}` : "Sync"}
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                <span className="hidden md:inline text-xs">
                  {lastSynced ? formatDistanceToNow(lastSynced, { addSuffix: true }) : "Sync"}
                </span>
              </Button>
            </div>
          </div>

          {/* Result count + contextual help */}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>
              Showing <span className="text-foreground font-semibold">{filteredMarkets.length}</span>
              {filteredMarkets.length !== current.length && <> of {current.length}</>} markets
            </span>
            {activeTab === "resolved" && (
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">Winning predictions auto-settled.</span>
                {buckets.archivedCount > 0 && (
                  <a href="/past-markets" className="text-primary hover:underline">
                    {buckets.archivedCount} older resolved → Archive
                  </a>
                )}
              </span>
            )}
            {activeTab === "awaiting" && (
              <span>Deadline passed — awaiting on-chain resolution.</span>
            )}
            {activeTab === "pending" && (
              <span>Not yet open for trading.</span>
            )}
          </div>
        </div>

        {/* Markets display */}
        {filteredMarkets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {hasActiveFilters ? "No markets match your filters." : "Nothing here yet."}
            </p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">Clear filters</Button>
            )}
          </div>
        ) : viewMode === "matrix" ? (
          <MarketMatrixView markets={filteredMarkets} onTrade={handleTrade} getOdds={getOdds} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets.map((market, index) => {
              const odds = getOdds(market);
              const linkedSignals = getLinkedSignalNames(market.linked_signals);
              const pastDeadline = isPastDeadline(market) || market.status === "resolved";
              return (
                <div
                  key={market.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${Math.min(index, 6) * 80}ms` }}
                >
                  <MarketCard
                    id={market.id}
                    appId={market.app_id}
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
                    isPastDeadline={pastDeadline}
                    resolvedOutcome={market.resolved_outcome}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

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
