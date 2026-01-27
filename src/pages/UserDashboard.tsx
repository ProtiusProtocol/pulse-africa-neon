import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/integrations/supabase/client";
import { PredictionUniverse } from "@/components/PredictionUniverse";
import { TradeModal } from "@/components/TradeModal";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Gift,
  BarChart2,
  ExternalLink,
  RefreshCw,
  Plus,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";

interface Trade {
  id: string;
  wallet_address: string;
  market_id: string;
  side: string;
  amount: number;
  tx_id: string | null;
  status: string;
  created_at: string;
  market?: {
    title: string;
    category: string;
    status: string;
    yes_total: number | null;
    no_total: number | null;
    deadline: string | null;
  };
}

interface Market {
  id: string;
  title: string;
  category: string;
  app_id: string;
  yes_total: number | null;
  no_total: number | null;
  linked_signals: string[] | null;
  resolution_criteria: string | null;
}

const formatCountdown = (deadline: string): string => {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 30) return `${Math.floor(days / 30)}mo left`;
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
};

export default function UserDashboard() {
  const { walletAddress, isConnected, connect } = useWallet();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [globalTrades, setGlobalTrades] = useState<{ id: string; side: string; amount: number; created_at: string; status: string; wallet_address: string; market_id: string }[]>([]);
  const [allMarkets, setAllMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Trade modal state
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [quickTradeMarketId, setQuickTradeMarketId] = useState<string>("");

  const fetchTrades = async () => {
    if (!walletAddress) {
      setTrades([]);
      setGlobalTrades([]);
      setLoading(false);
      return;
    }

    // Fetch user's trades
    const { data, error } = await supabase
      .from('user_trades')
      .select(`
        *,
        market:markets(title, category, status, yes_total, no_total, deadline)
      `)
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trades:', error);
    } else {
      setTrades(data || []);
      
      // Fetch global trades for markets user has positions in
      if (data && data.length > 0) {
        const marketIds = [...new Set(data.map(t => t.market_id))];
        const { data: globalData } = await supabase
          .from('user_trades')
          .select('id, side, amount, created_at, status, wallet_address, market_id')
          .in('market_id', marketIds)
          .neq('wallet_address', walletAddress);
        
        setGlobalTrades(globalData || []);
      }
    }
    setLoading(false);
    setRefreshing(false);
  };

  const fetchAllMarkets = async () => {
    const { data } = await supabase
      .from('markets')
      .select('id, title, category, app_id, yes_total, no_total, linked_signals, resolution_criteria')
      .eq('status', 'active')
      .order('title', { ascending: true });
    
    setAllMarkets(data || []);
  };

  useEffect(() => {
    fetchTrades();
    fetchAllMarkets();
  }, [walletAddress]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrades();
    fetchAllMarkets();
  };

  // Open trade modal for a specific market
  const openTradeModal = (market: Market) => {
    setSelectedMarket(market);
    setIsTradeModalOpen(true);
  };

  // Open trade modal from trade card (existing position)
  const openTradeFromPosition = (trade: Trade) => {
    // Find full market data
    const market = allMarkets.find(m => m.id === trade.market_id);
    if (market) {
      setSelectedMarket(market);
      setIsTradeModalOpen(true);
    }
  };

  // Handle quick trade selection
  const handleQuickTrade = () => {
    if (!quickTradeMarketId) return;
    const market = allMarkets.find(m => m.id === quickTradeMarketId);
    if (market) {
      openTradeModal(market);
      setQuickTradeMarketId("");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-muted-foreground border-muted-foreground">Pending</Badge>;
      case 'confirmed':
        return <Badge className="bg-primary/20 text-primary border-primary">Confirmed</Badge>;
      case 'won':
        return <Badge className="bg-accent/20 text-accent border-accent">Won</Badge>;
      case 'lost':
        return <Badge variant="destructive">Lost</Badge>;
      case 'claimed':
        return <Badge className="bg-secondary/20 text-secondary border-secondary">Claimed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'won':
        return <Gift className="w-4 h-4 text-accent" />;
      case 'lost':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'claimed':
        return <CheckCircle className="w-4 h-4 text-secondary" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Calculate portfolio stats
  const totalInvested = trades.reduce((sum, t) => sum + t.amount, 0);
  const activeTrades = trades.filter(t => t.status === 'confirmed' || t.status === 'pending');
  const wonTrades = trades.filter(t => t.status === 'won' || t.status === 'claimed');

  if (!isConnected) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-border bg-card">
            <CardContent className="py-16 text-center space-y-6">
              <Wallet className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6">
                  Connect your Pera Wallet to view your trading portfolio and track your predictions.
                </p>
                <Button onClick={connect} variant="hero" size="lg">
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect Wallet
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Don't have any trades yet?{" "}
                <Link to="/markets" className="text-primary hover:underline">
                  Explore markets
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-glow-primary">Your Portfolio</h1>
            <p className="text-muted-foreground">Track your predictions and outcomes</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono truncate max-w-[150px]">
                {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Trade Widget */}
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                <span className="font-semibold text-foreground">Quick Trade</span>
              </div>
              <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                <Select value={quickTradeMarketId} onValueChange={setQuickTradeMarketId}>
                  <SelectTrigger className="flex-1 sm:w-[350px]">
                    <SelectValue placeholder="Select a market to trade..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allMarkets.map((market) => (
                      <SelectItem key={market.id} value={market.id}>
                        <span className="truncate">{market.title.slice(0, 60)}{market.title.length > 60 ? '...' : ''}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleQuickTrade} 
                  disabled={!quickTradeMarketId}
                  variant="hero"
                  size="default"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Trade
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Invested</p>
                  <p className="text-2xl font-bold text-foreground">{totalInvested.toFixed(2)} ALGO</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Clock className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Positions</p>
                  <p className="text-2xl font-bold text-foreground">{activeTrades.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Gift className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trades Won</p>
                  <p className="text-2xl font-bold text-foreground">{wonTrades.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prediction Universe Visualization */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-xl">✦</span>
              Your Prediction Universe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PredictionUniverse 
              userTrades={trades} 
              globalTrades={globalTrades}
              userWallet={walletAddress || undefined}
              className="py-4" 
            />
          </CardContent>
        </Card>

        {/* Trades List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Your Trades</h2>
            </div>
            <Link to="/markets">
              <Button variant="outline" size="sm">
                Browse Markets
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : trades.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No trades yet. Start by exploring the markets and making your first prediction!
                </p>
                <Link to="/markets">
                  <Button variant="hero">
                    Explore Markets
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {trades.map((trade) => (
                <Card key={trade.id} className="border-border bg-card hover:border-primary/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(trade.status)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">
                            {trade.market?.title || 'Unknown Market'}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            <span>{trade.market?.category}</span>
                            <span>•</span>
                            <span>{new Date(trade.created_at).toLocaleDateString()}</span>
                            {trade.market?.deadline && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-primary">
                                  <Clock className="w-3 h-3" />
                                  {formatCountdown(trade.market.deadline)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        <Badge 
                          className={trade.side === 'YES' 
                            ? 'bg-primary/20 text-primary border-primary' 
                            : 'bg-secondary/20 text-secondary border-secondary'
                          }
                        >
                          {trade.side === 'YES' ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {trade.side}
                        </Badge>
                        <span className="font-semibold text-foreground min-w-[60px] text-right">
                          {trade.amount} ALGO
                        </span>
                        {getStatusBadge(trade.status)}
                        
                        {/* Add Position button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTradeFromPosition(trade);
                          }}
                          className="h-7 px-2 text-xs border-primary/50 text-primary hover:bg-primary/10"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                        
                        {trade.tx_id && (
                          <a
                            href={`https://testnet.algoexplorer.io/tx/${trade.tx_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Network Notice */}
        <p className="text-xs text-center text-muted-foreground">
          Viewing trades on Algorand TestNet
        </p>
      </div>
      
      {/* Trade Modal */}
      <TradeModal
        market={selectedMarket}
        isOpen={isTradeModalOpen}
        onClose={() => {
          setIsTradeModalOpen(false);
          setSelectedMarket(null);
        }}
        onTradeComplete={() => {
          fetchTrades();
          fetchAllMarkets();
        }}
      />
    </div>
  );
}