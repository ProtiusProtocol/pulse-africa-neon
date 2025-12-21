import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/integrations/supabase/client";
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
  RefreshCw
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
  };
}

export default function UserDashboard() {
  const { walletAddress, isConnected, connect } = useWallet();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrades = async () => {
    if (!walletAddress) {
      setTrades([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_trades')
      .select(`
        *,
        market:markets(title, category, status, yes_total, no_total)
      `)
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trades:', error);
    } else {
      setTrades(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTrades();
  }, [walletAddress]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrades();
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
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{trade.market?.category}</span>
                            <span>•</span>
                            <span>{new Date(trade.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
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
                        <span className="font-semibold text-foreground min-w-[80px] text-right">
                          {trade.amount} ALGO
                        </span>
                        {getStatusBadge(trade.status)}
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
    </div>
  );
}