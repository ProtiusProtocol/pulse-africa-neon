import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/contexts/WalletContext";
import { AugurionMarketV4Client, WinningSide } from "@/contracts/AugurionMarketV4Client";
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
  AlertTriangle,
  Users,
  Mail,
  Phone,
  Globe,
  Calendar,
  Wallet,
  RefreshCw,
  Play,
  Plus,
  XCircle,
  Trash2,
  FileText,
  Loader2
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type EarlyAccessSignup = Tables<'early_access_signups'>;
type Market = Tables<'markets'>;
type FragilitySignal = Tables<'fragility_signals'>;

const ADMIN_PASSWORD = "augurion2024"; // In production, use proper auth

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [signals, setSignals] = useState<FragilitySignal[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [winningSide, setWinningSide] = useState<'YES' | 'NO'>('YES');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [signups, setSignups] = useState<EarlyAccessSignup[]>([]);
  const [signupsLoading, setSignupsLoading] = useState(false);
  
  // New market form state
  const [newMarket, setNewMarket] = useState({
    appId: '',
    title: '',
    category: '',
    region: 'Southern Africa',
    linkedSignals: [] as string[],
    deadline: '',
    resolutionCriteria: '',
    resolutionCriteriaFull: '',
  });
  const [isCreatingMarket, setIsCreatingMarket] = useState(false);
  const [isGeneratingReports, setIsGeneratingReports] = useState(false);
  
  const { toast } = useToast();
  const { walletAddress, isConnected, connect, getSigner } = useWallet();

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchMarkets(), fetchSignals(), fetchSignups()]);
    setIsLoading(false);
  };

  const fetchMarkets = async () => {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      toast({ title: "Error", description: "Failed to fetch markets", variant: "destructive" });
    } else {
      setMarkets(data || []);
    }
  };

  const fetchSignals = async () => {
    const { data, error } = await supabase
      .from('fragility_signals')
      .select('*')
      .order('signal_code', { ascending: true });
    
    if (error) {
      toast({ title: "Error", description: "Failed to fetch signals", variant: "destructive" });
    } else {
      setSignals(data || []);
    }
  };

  const fetchSignups = async () => {
    setSignupsLoading(true);
    const { data, error } = await supabase
      .from('early_access_signups')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: "Error", description: "Failed to fetch signups", variant: "destructive" });
    } else {
      setSignups(data || []);
    }
    setSignupsLoading(false);
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({ title: "Access granted", description: "Welcome to Admin Dashboard" });
    } else {
      toast({ title: "Access denied", description: "Invalid password", variant: "destructive" });
    }
  };

  const handleGenerateWeeklyReports = async () => {
    setIsGeneratingReports(true);
    try {
      const { data, error } = await supabase.functions.invoke('weekly-generate-drafts');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.success) {
        toast({ 
          title: "Reports Generated", 
          description: `Successfully generated drafts for ${data.weekId}. ${data.stats?.markets || 0} markets, ${data.stats?.newsItems || 0} news items processed.`
        });
      } else {
        toast({ 
          title: "Info", 
          description: data?.message || "Reports may already exist for this week",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error generating reports:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to generate weekly reports", 
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingReports(false);
    }
  };

  const getNumericAppId = (appId: string): number | null => {
    const parsed = parseInt(appId, 10);
    return isNaN(parsed) ? null : parsed;
  };

  const handleOpenMarket = async (market: Market) => {
    if (!isConnected || !walletAddress) {
      toast({ title: "Error", description: "Connect your wallet first", variant: "destructive" });
      return;
    }

    const numericAppId = getNumericAppId(market.app_id);
    if (!numericAppId) {
      toast({ title: "Error", description: "Market contract not deployed yet", variant: "destructive" });
      return;
    }

    setActionLoading(market.id);
    try {
      const client = new AugurionMarketV4Client(numericAppId);
      const signer = getSigner();
      const result = await client.openMarket(walletAddress, signer);

      if (result.success) {
        // Update Supabase
        await supabase
          .from('markets')
          .update({ status: 'active' })
          .eq('id', market.id);

        await fetchMarkets();
        toast({ title: "Market opened", description: `${market.title} is now open for betting` });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to open market", variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleFreezeMarket = async (market: Market) => {
    if (!isConnected || !walletAddress) {
      toast({ title: "Error", description: "Connect your wallet first", variant: "destructive" });
      return;
    }

    const numericAppId = getNumericAppId(market.app_id);
    if (!numericAppId) {
      toast({ title: "Error", description: "Market contract not deployed yet", variant: "destructive" });
      return;
    }

    setActionLoading(market.id);
    try {
      const client = new AugurionMarketV4Client(numericAppId);
      const signer = getSigner();
      const result = await client.freezeMarket(walletAddress, signer);

      if (result.success) {
        // Update Supabase
        await supabase
          .from('markets')
          .update({ status: 'frozen' })
          .eq('id', market.id);

        await fetchMarkets();
        toast({ title: "Market frozen", description: `${market.title} has been frozen` });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to freeze market", variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleCancelMarket = async (market: Market) => {
    if (!isConnected || !walletAddress) {
      toast({ title: "Error", description: "Connect your wallet first", variant: "destructive" });
      return;
    }

    const numericAppId = getNumericAppId(market.app_id);
    if (!numericAppId) {
      toast({ title: "Error", description: "Market contract not deployed yet", variant: "destructive" });
      return;
    }

    setActionLoading(market.id);
    try {
      const client = new AugurionMarketV4Client(numericAppId);
      const signer = getSigner();
      const result = await client.cancelMarket(walletAddress, signer);

      if (result.success) {
        // Update Supabase
        await supabase
          .from('markets')
          .update({ status: 'cancelled' })
          .eq('id', market.id);

        await fetchMarkets();
        toast({ title: "Market cancelled", description: `${market.title} has been cancelled` });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to cancel market", variant: "destructive" });
    }
    setActionLoading(null);
  };

  const handleResolve = async () => {
    if (!selectedMarket) {
      toast({ title: "Error", description: "Select a market to resolve", variant: "destructive" });
      return;
    }

    if (!isConnected || !walletAddress) {
      toast({ title: "Error", description: "Connect your wallet first", variant: "destructive" });
      return;
    }

    const market = markets.find(m => m.id === selectedMarket);
    if (!market) return;

    const numericAppId = getNumericAppId(market.app_id);
    if (!numericAppId) {
      toast({ title: "Error", description: "Market contract not deployed yet", variant: "destructive" });
      return;
    }

    setActionLoading(selectedMarket);
    try {
      const client = new AugurionMarketV4Client(numericAppId);
      const signer = getSigner();
      const side = winningSide === 'YES' ? WinningSide.YES : WinningSide.NO;
      const result = await client.resolveMarket(side, walletAddress, signer);

      if (result.success) {
        // Update Supabase
        await supabase
          .from('markets')
          .update({ 
            status: 'resolved',
            outcome_ref: winningSide 
          })
          .eq('id', market.id);

        await fetchMarkets();
        toast({ 
          title: "Market resolved", 
          description: `${market.title} resolved with ${winningSide} as winner` 
        });
        setSelectedMarket("");
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to resolve market", variant: "destructive" });
    }
    setActionLoading(null);
  };

  const triggerIndexer = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-indexer');
      if (error) throw error;
      
      toast({ 
        title: "Indexer triggered", 
        description: data?.message || "Markets synced from blockchain" 
      });
      await fetchMarkets();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to trigger indexer", 
        variant: "destructive" 
      });
    }
    setIsLoading(false);
  };

  const handleDeleteMarket = async (market: Market) => {
    if (!confirm(`Are you sure you want to delete "${market.title}"? This cannot be undone.`)) {
      return;
    }
    
    setActionLoading(market.id);
    try {
      const { error } = await supabase
        .from('markets')
        .delete()
        .eq('id', market.id);
      
      if (error) throw error;
      
      toast({ 
        title: "Market deleted", 
        description: `${market.title} has been removed` 
      });
      await fetchMarkets();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to delete market", 
        variant: "destructive" 
      });
    }
    setActionLoading(null);
  };

  const handleCreateMarket = async () => {
    if (!newMarket.appId.trim() || !newMarket.title.trim() || !newMarket.category.trim()) {
      toast({ title: "Error", description: "App ID, Title and Category are required", variant: "destructive" });
      return;
    }

    setIsCreatingMarket(true);
    try {
      const { error } = await supabase
        .from('markets')
        .insert({
          app_id: newMarket.appId.trim(),
          title: newMarket.title.trim(),
          category: newMarket.category.trim(),
          region: newMarket.region,
          linked_signals: newMarket.linkedSignals.length > 0 ? newMarket.linkedSignals : null,
          deadline: newMarket.deadline ? new Date(newMarket.deadline).toISOString() : null,
          resolution_criteria: newMarket.resolutionCriteria.trim() || null,
          resolution_criteria_full: newMarket.resolutionCriteriaFull.trim() || null,
          status: 'active',
        });

      if (error) throw error;

      toast({ title: "Market registered", description: `${newMarket.title} has been added` });
      
      // Reset form
      setNewMarket({
        appId: '',
        title: '',
        category: '',
        region: 'Southern Africa',
        linkedSignals: [],
        deadline: '',
        resolutionCriteria: '',
        resolutionCriteriaFull: '',
      });
      
      await fetchMarkets();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create market", 
        variant: "destructive" 
      });
    }
    setIsCreatingMarket(false);
  };

  const toggleSignal = (signalCode: string) => {
    setNewMarket(prev => ({
      ...prev,
      linkedSignals: prev.linkedSignals.includes(signalCode)
        ? prev.linkedSignals.filter(s => s !== signalCode)
        : [...prev.linkedSignals, signalCode]
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-primary/20 text-primary border-primary">ACTIVE</Badge>;
      case 'frozen':
        return <Badge className="bg-secondary/20 text-secondary border-secondary">FROZEN</Badge>;
      case 'resolved':
        return <Badge className="bg-accent/20 text-accent border-accent">RESOLVED</Badge>;
      case 'cancelled':
        return <Badge className="bg-destructive/20 text-destructive border-destructive">CANCELLED</Badge>;
      case 'pending':
        return <Badge className="bg-muted text-muted-foreground border-muted">PENDING</Badge>;
      default:
        return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
  };

  const getDirectionIcon = (direction: string | null) => {
    switch (direction) {
      case 'elevated':
        return <TrendingUp className="w-4 h-4 text-destructive" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-primary" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-glow-primary">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage markets and monitor fragility indicators</p>
          </div>
          <div className="flex items-center gap-2">
            {!isConnected ? (
              <Button onClick={connect} variant="outline" className="border-primary text-primary">
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            ) : (
              <Badge variant="outline" className="px-3 py-1 text-xs">
                <Wallet className="w-3 h-3 mr-1" />
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </Badge>
            )}
            <Button
              onClick={handleGenerateWeeklyReports}
              disabled={isGeneratingReports}
              variant="outline"
              className="border-accent text-accent hover:bg-accent/20"
            >
              {isGeneratingReports ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              {isGeneratingReports ? 'Generating...' : 'Generate Reports'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsAuthenticated(false)}
              className="border-border"
            >
              <Unlock className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Wallet Warning */}
        {!isConnected && (
          <Card className="border-secondary bg-secondary/10">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="w-5 h-5 text-secondary" />
              <p className="text-sm">Connect your admin wallet to perform on-chain market operations (freeze, resolve, cancel).</p>
            </CardContent>
          </Card>
        )}

        {/* Weekly Reports Section - Added Dec 22 */}
        <section className="bg-accent/10 border-2 border-accent rounded-lg p-6 shadow-lg shadow-accent/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-semibold text-accent">Weekly Reports</h2>
            </div>
            <Button
              onClick={handleGenerateWeeklyReports}
              disabled={isGeneratingReports}
              variant="outline"
              className="border-accent text-accent hover:bg-accent/20"
            >
              {isGeneratingReports ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Weekly Reports
                </>
              )}
            </Button>
          </div>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Click the button above to generate Trader Pulse and Executive Brief reports for the previous week. 
                Reports will be saved as drafts and can be reviewed on the <a href="/admin-reports" className="text-accent hover:underline">Reports page</a>.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Fragility Signals - Layer 1 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-semibold">Fragility Signals (Layer 1)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {signals.map((signal) => (
              <Card key={signal.id} className="border-border bg-card hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">{signal.signal_code}</Badge>
                    {getDirectionIcon(signal.current_direction)}
                  </div>
                  <h3 className="font-medium text-sm mb-1">{signal.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{signal.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Register New Market */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Register Market from Lora</h2>
          </div>
          <Card className="border-primary/30 bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appId">Algorand App ID *</Label>
                  <Input
                    id="appId"
                    placeholder="e.g. 123456789"
                    value={newMarket.appId}
                    onChange={(e) => setNewMarket(prev => ({ ...prev, appId: e.target.value }))}
                    className="bg-input border-border"
                  />
                  <p className="text-xs text-muted-foreground">Copy this from Lora after creating the market</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={newMarket.category} 
                    onValueChange={(value) => setNewMarket(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Politics">Politics</SelectItem>
                      <SelectItem value="Economy">Economy</SelectItem>
                      <SelectItem value="Energy">Energy</SelectItem>
                      <SelectItem value="Climate">Climate</SelectItem>
                      <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Market Question *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Will load shedding exceed Stage 4 in January 2025?"
                  value={newMarket.title}
                  onChange={(e) => setNewMarket(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-input border-border"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select 
                    value={newMarket.region} 
                    onValueChange={(value) => setNewMarket(prev => ({ ...prev, region: value }))}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Southern Africa">Southern Africa</SelectItem>
                      <SelectItem value="South Africa">South Africa</SelectItem>
                      <SelectItem value="East Africa">East Africa</SelectItem>
                      <SelectItem value="West Africa">West Africa</SelectItem>
                      <SelectItem value="Central Africa">Central Africa</SelectItem>
                      <SelectItem value="North Africa">North Africa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Resolution Deadline</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={newMarket.deadline}
                    onChange={(e) => setNewMarket(prev => ({ ...prev, deadline: e.target.value }))}
                    className="bg-input border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Link to Fragility Signals</Label>
                <div className="flex flex-wrap gap-2">
                  {signals.map((signal) => (
                    <Badge
                      key={signal.signal_code}
                      variant={newMarket.linkedSignals.includes(signal.signal_code) ? "default" : "outline"}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleSignal(signal.signal_code)}
                    >
                      {signal.signal_code}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Click to toggle signal links</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolutionCriteria">Resolution Criteria (short)</Label>
                <Input
                  id="resolutionCriteria"
                  placeholder="e.g. Based on official Eskom announcements"
                  value={newMarket.resolutionCriteria}
                  onChange={(e) => setNewMarket(prev => ({ ...prev, resolutionCriteria: e.target.value }))}
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolutionCriteriaFull">Resolution Criteria (detailed)</Label>
                <textarea
                  id="resolutionCriteriaFull"
                  placeholder="Detailed explanation of how this market will be resolved..."
                  value={newMarket.resolutionCriteriaFull}
                  onChange={(e) => setNewMarket(prev => ({ ...prev, resolutionCriteriaFull: e.target.value }))}
                  className="w-full min-h-[80px] px-3 py-2 text-sm bg-input border border-border rounded-md resize-y"
                />
              </div>

              <Button 
                onClick={handleCreateMarket} 
                disabled={isCreatingMarket}
                variant="neon"
                className="w-full md:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isCreatingMarket ? 'Registering...' : 'Register Market'}
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Market Management - Layer 2 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Market Management (Layer 2)</h2>
            </div>
            <Button variant="outline" size="sm" onClick={triggerIndexer} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync from Chain
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {markets.map((market) => {
              const hasContract = !!getNumericAppId(market.app_id);
              const isActionLoading = actionLoading === market.id;
              
              return (
                <Card key={market.id} className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-2">{market.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          App ID: {market.app_id}
                          {!hasContract && <span className="text-secondary ml-2">(placeholder)</span>}
                        </CardDescription>
                      </div>
                      {getStatusBadge(market.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-muted-foreground">YES</p>
                        <p className="font-semibold text-primary">{(market.yes_total || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-muted-foreground">NO</p>
                        <p className="font-semibold text-accent">{(market.no_total || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-xs text-muted-foreground">Fee</p>
                        <p className="font-semibold">{((market.fee_bps || 100) / 100)}%</p>
                      </div>
                    </div>

                    {/* Linked Signals */}
                    {market.linked_signals && market.linked_signals.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {market.linked_signals.map(code => (
                          <Badge key={code} variant="secondary" className="text-xs">{code}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Outcome if resolved */}
                    {market.outcome_ref && (
                      <div className="flex items-center gap-2 p-2 bg-accent/10 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-accent" />
                        <span className="text-sm">Resolved: <strong>{market.outcome_ref}</strong> wins</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {market.status === 'pending' && (
                        <Button 
                          onClick={() => handleOpenMarket(market)}
                          disabled={isActionLoading || !isConnected || !hasContract}
                          variant="outline"
                          size="sm"
                          className="border-primary text-primary hover:bg-primary/20"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          {isActionLoading ? 'Opening...' : 'Open'}
                        </Button>
                      )}
                      {market.status === 'pending' && (
                        <Button 
                          onClick={() => handleDeleteMarket(market)}
                          disabled={isActionLoading}
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      )}
                      {market.status === 'active' && (
                        <Button 
                          onClick={() => handleFreezeMarket(market)}
                          disabled={isActionLoading || !isConnected || !hasContract}
                          variant="outline"
                          size="sm"
                          className="border-secondary text-secondary hover:bg-secondary/20"
                        >
                          <Lock className="w-3 h-3 mr-1" />
                          {isActionLoading ? 'Freezing...' : 'Freeze'}
                        </Button>
                      )}
                      {(market.status === 'active' || market.status === 'pending') && (
                        <Button 
                          onClick={() => handleCancelMarket(market)}
                          disabled={isActionLoading || !isConnected || !hasContract}
                          variant="outline"
                          size="sm"
                          className="border-destructive text-destructive hover:bg-destructive/20"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          {isActionLoading ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Early Access Signups */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-semibold">Early Access Signups</h2>
              <Badge variant="outline" className="ml-2">{signups.length}</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSignups} disabled={signupsLoading}>
              Refresh
            </Button>
          </div>
          
          {signupsLoading ? (
            <Card className="border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Loading signups...</p>
            </Card>
          ) : signups.length === 0 ? (
            <Card className="border-border bg-card p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No signups yet</p>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">WhatsApp</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Country</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.map((signup) => (
                    <tr key={signup.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{signup.name}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          {signup.email}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {signup.whatsapp}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          {signup.country}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-xs">
                          {signup.predictor_type}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(signup.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                    <SelectValue placeholder="Choose a frozen market" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {markets.filter(m => m.status === 'frozen').map((market) => (
                      <SelectItem key={market.id} value={market.id}>
                        {market.title.slice(0, 50)}...
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
                  disabled={!!actionLoading || !selectedMarket || !isConnected}
                  variant="neon"
                  className="w-full"
                >
                  {actionLoading === selectedMarket ? 'Resolving...' : 'Resolve Market'}
                </Button>
              </div>
            </div>
            {!isConnected && (
              <p className="text-xs text-muted-foreground">Connect your wallet to resolve markets on-chain.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
