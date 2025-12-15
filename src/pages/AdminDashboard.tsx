import { useState } from "react";
import { 
  mockMarkets, 
  mockFragilityIndicators, 
  freezeMarket, 
  resolveMarket,
  type Market,
  type FragilityIndicator 
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
  Lock, 
  Unlock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Shield,
  Activity,
  BarChart3,
  AlertTriangle
} from "lucide-react";

const ADMIN_PASSWORD = "augurion2024"; // In production, use proper auth

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [markets, setMarkets] = useState<Market[]>(mockMarkets);
  const [indicators] = useState<FragilityIndicator[]>(mockFragilityIndicators);
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [winningSide, setWinningSide] = useState<'YES' | 'NO'>('YES');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({ title: "Access granted", description: "Welcome to Admin Dashboard" });
    } else {
      toast({ title: "Access denied", description: "Invalid password", variant: "destructive" });
    }
  };

  const handleFreeze = async (market: Market) => {
    setIsLoading(true);
    const result = await freezeMarket(market.appId, "ADMIN_ADDRESS");
    if (result.success) {
      setMarkets(prev => prev.map(m => 
        m.id === market.id ? { ...m, status: 'FROZEN' as const } : m
      ));
      toast({ title: "Market frozen", description: `${market.name} has been frozen` });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleResolve = async () => {
    if (!selectedMarket) {
      toast({ title: "Error", description: "Select a market to resolve", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    const market = markets.find(m => m.id === selectedMarket);
    if (market) {
      const result = await resolveMarket(market.appId, winningSide, "ADMIN_ADDRESS");
      if (result.success) {
        setMarkets(prev => prev.map(m => 
          m.id === selectedMarket ? { ...m, status: 'RESOLVED' as const, outcome: winningSide } : m
        ));
        toast({ 
          title: "Market resolved", 
          description: `${market.name} resolved with ${winningSide} as winner` 
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

  const getTrendIcon = (trend: FragilityIndicator['trend']) => {
    switch (trend) {
      case 'UP':
        return <TrendingUp className="w-4 h-4 text-primary" />;
      case 'DOWN':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      case 'STABLE':
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getCategoryColor = (category: FragilityIndicator['category']) => {
    switch (category) {
      case 'POLITICAL':
        return 'text-primary';
      case 'ECONOMIC':
        return 'text-accent';
      case 'SOCIAL':
        return 'text-secondary';
      case 'SECURITY':
        return 'text-destructive';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl text-glow-primary">Admin Access</CardTitle>
            <CardDescription>Enter password to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter admin password"
                className="bg-input border-border"
              />
            </div>
            <Button onClick={handleLogin} variant="neon" className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              Access Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-glow-primary">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage markets and monitor fragility indicators</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsAuthenticated(false)}
            className="border-border"
          >
            <Unlock className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Fragility Indicators - Layer 1 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-semibold">Fragility Indicators (Layer 1)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {indicators.map((indicator) => (
              <Card key={indicator.id} className="border-border bg-card hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-medium ${getCategoryColor(indicator.category)}`}>
                      {indicator.category}
                    </span>
                    {getTrendIcon(indicator.trend)}
                  </div>
                  <h3 className="font-medium text-sm mb-1">{indicator.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{indicator.country}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">{indicator.value}</span>
                    <span className={`text-xs ${indicator.trend === 'UP' ? 'text-primary' : indicator.trend === 'DOWN' ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {indicator.trend === 'UP' ? '+' : indicator.trend === 'DOWN' ? '-' : ''}{Math.abs(indicator.value - indicator.previousValue)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Market Management - Layer 2 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Market Management (Layer 2)</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {markets.map((market) => (
              <Card key={market.id} className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{market.name}</CardTitle>
                      <CardDescription className="text-xs">App ID: {market.appId}</CardDescription>
                    </div>
                    {getStatusBadge(market.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">YES Total</p>
                      <p className="font-semibold text-primary">{market.yesTotal.toLocaleString()} ALGO</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">NO Total</p>
                      <p className="font-semibold text-accent">{market.noTotal.toLocaleString()} ALGO</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Total Bets</p>
                      <p className="font-semibold">{market.totalBets}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Fee</p>
                      <p className="font-semibold">{market.feePercent}%</p>
                    </div>
                  </div>

                  {/* Outcome if resolved */}
                  {market.outcome && (
                    <div className="flex items-center gap-2 p-2 bg-accent/10 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-accent" />
                      <span className="text-sm">Resolved: <strong>{market.outcome}</strong> wins</span>
                    </div>
                  )}

                  {/* Actions */}
                  {market.status === 'OPEN' && (
                    <Button 
                      onClick={() => handleFreeze(market)}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full border-secondary text-secondary hover:bg-secondary/20"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Freeze Market
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Resolve Market Section */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Resolve Market</CardTitle>
            <CardDescription>Select a frozen market and declare the winning side</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Select Market</Label>
                <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Choose a market" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {markets.filter(m => m.status === 'FROZEN').map((market) => (
                      <SelectItem key={market.id} value={market.id}>
                        {market.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Winning Side</Label>
                <Select value={winningSide} onValueChange={(v) => setWinningSide(v as 'YES' | 'NO')}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="YES">YES</SelectItem>
                    <SelectItem value="NO">NO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleResolve}
                  disabled={isLoading || !selectedMarket}
                  variant="neon"
                  className="w-full"
                >
                  Resolve Market
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
