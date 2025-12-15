import { useState } from "react";
import { 
  mockMarkets, 
  mockBets,
  placeBet, 
  claimPayout,
  connectWallet,
  type Market,
  type Bet 
} from "@/lib/algorand";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Gift,
  BarChart2,
  Zap
} from "lucide-react";

export default function UserDashboard() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [markets] = useState<Market[]>(mockMarkets);
  const [bets, setBets] = useState<Bet[]>(mockBets);
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [selectedSide, setSelectedSide] = useState<'YES' | 'NO'>('YES');
  const [betAmount, setBetAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConnectWallet = async () => {
    setIsLoading(true);
    const address = await connectWallet();
    if (address) {
      setWalletAddress(address);
      toast({ title: "Wallet connected", description: "Ready to place bets" });
    } else {
      toast({ title: "Error", description: "Failed to connect wallet", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handlePlaceBet = async () => {
    if (!walletAddress) {
      toast({ title: "Error", description: "Connect your wallet first", variant: "destructive" });
      return;
    }
    if (!selectedMarket || !betAmount) {
      toast({ title: "Error", description: "Select a market and enter amount", variant: "destructive" });
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const market = markets.find(m => m.id === selectedMarket);
    if (market) {
      const result = await placeBet(market.appId, selectedSide, amount, walletAddress);
      if (result.success) {
        const newBet: Bet = {
          id: result.txId || Date.now().toString(),
          marketId: market.id,
          marketName: market.name,
          side: selectedSide,
          amount,
          status: 'PENDING',
          timestamp: new Date(),
        };
        setBets(prev => [newBet, ...prev]);
        setBetAmount("");
        toast({ 
          title: "Bet placed!", 
          description: `${amount} ALGO on ${selectedSide} for ${market.name}` 
        });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    }
    setIsLoading(false);
  };

  const handleClaimPayout = async (bet: Bet) => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    const market = markets.find(m => m.id === bet.marketId);
    if (market) {
      const result = await claimPayout(market.appId, bet.id, walletAddress);
      if (result.success) {
        setBets(prev => prev.map(b => 
          b.id === bet.id ? { ...b, status: 'CLAIMED' as const } : b
        ));
        toast({ 
          title: "Payout claimed!", 
          description: `${result.amount} ALGO received` 
        });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    }
    setIsLoading(false);
  };

  const getStatusBadge = (status: Market['status']) => {
    switch (status) {
      case 'OPEN':
        return <Badge className="bg-primary/20 text-primary border-primary">OPEN</Badge>;
      case 'FROZEN':
        return <Badge className="bg-secondary/20 text-secondary border-secondary">FROZEN</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-accent/20 text-accent border-accent">RESOLVED</Badge>;
    }
  };

  const getBetStatusIcon = (status: Bet['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'WON':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'LOST':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'CLAIMED':
        return <Gift className="w-4 h-4 text-accent" />;
    }
  };

  const openMarkets = markets.filter(m => m.status === 'OPEN');

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-glow-primary">Dashboard</h1>
            <p className="text-muted-foreground">Place bets and track your predictions</p>
          </div>
          {walletAddress ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono truncate max-w-[150px]">{walletAddress}</span>
            </div>
          ) : (
            <Button onClick={handleConnectWallet} disabled={isLoading} variant="neon">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>

        {/* Available Markets */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Available Markets</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.map((market) => (
              <Card 
                key={market.id} 
                className={`border-border bg-card hover:border-primary/50 transition-all cursor-pointer ${
                  selectedMarket === market.id ? 'border-primary glow-primary' : ''
                }`}
                onClick={() => market.status === 'OPEN' && setSelectedMarket(market.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-sm">{market.name}</h3>
                    {getStatusBadge(market.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{market.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-primary/10 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-primary" />
                        <span className="text-xs text-muted-foreground">YES</span>
                      </div>
                      <p className="text-lg font-bold text-primary">{market.yesOdds}%</p>
                    </div>
                    <div className="bg-accent/10 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingDown className="w-3 h-3 text-accent" />
                        <span className="text-xs text-muted-foreground">NO</span>
                      </div>
                      <p className="text-lg font-bold text-accent">{market.noOdds}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Place Bet Form */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <CardTitle>Place Bet</CardTitle>
            </div>
            <CardDescription>Select a market and make your prediction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Market</Label>
                <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {openMarkets.map((market) => (
                      <SelectItem key={market.id} value={market.id}>
                        {market.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prediction</Label>
                <Select value={selectedSide} onValueChange={(v) => setSelectedSide(v as 'YES' | 'NO')}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="YES">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" /> YES
                      </span>
                    </SelectItem>
                    <SelectItem value="NO">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-accent" /> NO
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (ALGO)</Label>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.1"
                  className="bg-input border-border"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handlePlaceBet}
                  disabled={isLoading || !walletAddress || !selectedMarket || !betAmount}
                  variant="neon"
                  className="w-full"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Place Bet
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Bets History */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-semibold">My Bets</h2>
          </div>
          {bets.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No bets placed yet. Connect your wallet and start predicting!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {bets.map((bet) => (
                <Card key={bet.id} className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {getBetStatusIcon(bet.status)}
                        <div>
                          <h4 className="font-medium">{bet.marketName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {bet.timestamp.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge 
                          className={bet.side === 'YES' 
                            ? 'bg-primary/20 text-primary border-primary' 
                            : 'bg-accent/20 text-accent border-accent'
                          }
                        >
                          {bet.side}
                        </Badge>
                        <span className="font-semibold">{bet.amount} ALGO</span>
                        {bet.status === 'WON' && (
                          <Button 
                            size="sm" 
                            variant="neon"
                            onClick={() => handleClaimPayout(bet)}
                            disabled={isLoading}
                          >
                            <Gift className="w-4 h-4 mr-1" />
                            Claim
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
