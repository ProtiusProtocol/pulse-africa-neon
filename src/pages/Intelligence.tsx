import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, Target, Clock, ChevronRight, Zap, Globe, Link2, ArrowRight, RefreshCw, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { EmailSubscribeForm } from "@/components/EmailSubscribeForm";
import { AttentionAnalytics } from "@/components/AttentionAnalytics";

// Types
interface CoreComponent {
  name: string;
  description: string;
}
interface FragilitySignal {
  id: string;
  signal_code: string;
  name: string;
  description: string;
  core_components: (string | CoreComponent)[];
  why_it_matters: string;
  current_direction: string;
  last_updated: string;
  region: string;
  source: string;
  weekly_update_md: string | null;
}
interface Market {
  id: string;
  title: string;
  category: string;
  region: string;
  status: string;
  app_id: string;
  resolution_criteria: string | null;
  linked_signals: string[] | null;
  deadline: string | null;
  yes_total: number | null;
  no_total: number | null;
}
const Intelligence = () => {
  const [signals, setSignals] = useState<FragilitySignal[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedDirection, setSelectedDirection] = useState<string>('ALL');
  const fetchData = async () => {
    const [signalsRes, marketsRes] = await Promise.all([supabase.from("fragility_signals").select("*").order("signal_code"), supabase.from("markets").select("*").eq("status", "active").order("created_at")]);
    if (signalsRes.data) {
      setSignals(signalsRes.data.map(s => ({
        ...s,
        core_components: Array.isArray(s.core_components) ? s.core_components : JSON.parse(s.core_components as string),
        region: s.region || 'Southern Africa',
        source: s.source || 'admin',
        weekly_update_md: s.weekly_update_md || null
      })));
    }
    if (marketsRes.data) setMarkets(marketsRes.data);
    setLoading(false);
  };
  useEffect(() => {
    fetchData();
  }, []);
  const getTrendIcon = (direction: string) => {
    if (direction === 'elevated') return <TrendingUp className="w-4 h-4 text-destructive" />;
    if (direction === 'improving') return <TrendingDown className="w-4 h-4 text-primary" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };
  const getDirectionBadge = (direction: string) => {
    const config: Record<string, {
      color: string;
      label: string;
      icon: React.ReactNode;
    }> = {
      elevated: {
        color: 'bg-destructive/20 text-destructive border-destructive/30',
        label: 'Elevated',
        icon: <TrendingUp className="w-3 h-3" />
      },
      stable: {
        color: 'bg-muted text-muted-foreground border-border',
        label: 'Stable',
        icon: <Minus className="w-3 h-3" />
      },
      improving: {
        color: 'bg-primary/20 text-primary border-primary/30',
        label: 'Improving',
        icon: <TrendingDown className="w-3 h-3" />
      }
    };
    const {
      color,
      label,
      icon
    } = config[direction] || config.stable;
    return <Badge variant="outline" className={`${color} border flex items-center gap-1`}>
        {icon}
        {label}
      </Badge>;
  };
  const getLinkedMarkets = (signalCode: string) => {
    return markets.filter(m => m.linked_signals?.includes(signalCode));
  };
  const getOdds = (market: Market) => {
    const yes = market.yes_total || 0;
    const no = market.no_total || 0;
    const total = yes + no;
    if (total === 0) return {
      yes: 50,
      no: 50
    };
    return {
      yes: Math.round(yes / total * 100),
      no: Math.round(no / total * 100)
    };
  };

  // Get unique regions
  const regions = ['ALL', ...new Set(signals.map(s => s.region))];

  // Filter signals
  const filteredSignals = signals.filter(s => {
    const regionMatch = selectedRegion === 'ALL' || s.region === selectedRegion;
    const directionMatch = selectedDirection === 'ALL' || s.current_direction === selectedDirection;
    return regionMatch && directionMatch;
  });

  // Stats
  const elevatedCount = signals.filter(s => s.current_direction === 'elevated').length;
  const linkedMarketsCount = markets.filter(m => m.linked_signals && m.linked_signals.length > 0).length;
  if (loading) {
    return <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-8 space-y-4">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              <Activity className="w-3 h-3 mr-1" />
              Unified Signal Intelligence
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-primary text-glow-primary">Fragility Signals</span>
              <br />
              <span className="text-foreground">Driving Market Outcomes</span>
            </h1>
            <p className="text-muted-foreground">Track real-world fragilities across Africa. The signals that change and move result in markets that change and move. </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{signals.length}</div>
                <div className="text-xs text-muted-foreground">Active Signals</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-destructive">{elevatedCount}</div>
                <div className="text-xs text-muted-foreground">Elevated</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent">{linkedMarketsCount}</div>
                <div className="text-xs text-muted-foreground">Linked Markets</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{regions.length - 1}</div>
                <div className="text-xs text-muted-foreground">Regions</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links to Reports */}
          <div className="flex justify-center gap-4 mt-8">
            <a href="/pulse" className="group flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-lg hover:border-primary/50 hover:glow-primary transition-all duration-300">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-medium">Trader Pulse</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
            <a href="/brief" className="group flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-lg hover:border-accent/50 transition-all duration-300">
              <Target className="w-4 h-4 text-accent" />
              <span className="font-medium">Executive Brief</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="signals" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 bg-card border border-border">
              <TabsTrigger value="signals">Signals & Markets</TabsTrigger>
              <TabsTrigger value="drift">Drift Map</TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1">
                <Flame className="w-3 h-3" />
                Heat Map
              </TabsTrigger>
            </TabsList>

            {/* Signals Tab - Unified View */}
            <TabsContent value="signals" className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground mr-2">Region:</span>
                  {regions.map(region => <Badge key={region} variant={selectedRegion === region ? "default" : "outline"} className={`cursor-pointer ${selectedRegion === region ? 'bg-primary' : 'hover:bg-muted'}`} onClick={() => setSelectedRegion(region)}>
                      {region === 'ALL' ? 'All Regions' : region}
                    </Badge>)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground mr-2">Status:</span>
                  {['ALL', 'elevated', 'stable', 'improving'].map(dir => <Badge key={dir} variant={selectedDirection === dir ? "default" : "outline"} className={`cursor-pointer ${selectedDirection === dir ? 'bg-primary' : 'hover:bg-muted'}`} onClick={() => setSelectedDirection(dir)}>
                      {dir === 'ALL' ? 'All' : dir.charAt(0).toUpperCase() + dir.slice(1)}
                    </Badge>)}
                </div>
              </div>

              {/* Unified Signal Cards with Linked Markets */}
              <div className="space-y-6">
                {filteredSignals.map(signal => {
                const linkedMarkets = getLinkedMarkets(signal.signal_code);
                return <Card key={signal.id} className={`bg-card border-border hover:border-primary/30 transition-all ${signal.current_direction === 'elevated' ? 'border-l-4 border-l-destructive' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary">
                                {signal.signal_code}
                              </Badge>
                              {getDirectionBadge(signal.current_direction)}
                              <Badge variant="outline" className="border-border">
                                <Globe className="w-3 h-3 mr-1" />
                                {signal.region}
                              </Badge>
                              {signal.source === 'automated' && <Badge variant="outline" className="border-accent/30 text-accent">
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  Auto
                                </Badge>}
                            </div>
                            <CardTitle className="text-xl">{signal.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            {signal.current_direction === 'elevated' && <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />}
                            {getTrendIcon(signal.current_direction)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{signal.description}</p>
                        
                        {/* Core Components */}
                        <div className="flex flex-wrap gap-2">
                          {signal.core_components.slice(0, 5).map((component, i) => {
                        const displayName = typeof component === 'string' ? component : component.name;
                        return <span key={i} className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                                {displayName}
                              </span>;
                      })}
                        </div>

                        {/* Weekly Update */}
                        {signal.weekly_update_md && <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Weekly Update</span>
                            </div>
                            <p className="text-sm text-foreground">{signal.weekly_update_md}</p>
                          </div>}

                        {/* Linked Markets Section */}
                        {linkedMarkets.length > 0 && <div className="pt-4 border-t border-border">
                            <div className="flex items-center gap-2 mb-3">
                              <Link2 className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">
                                Linked Markets ({linkedMarkets.length})
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {linkedMarkets.map(market => {
                          const odds = getOdds(market);
                          return <div key={market.id} className="p-3 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <div className="text-xs text-muted-foreground mb-1">{market.category}</div>
                                        <div className="text-sm font-medium text-foreground line-clamp-2">
                                          {market.title}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-lg font-bold text-primary">{odds.yes}%</div>
                                        <div className="text-xs text-muted-foreground">YES</div>
                                      </div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                      <Progress value={odds.yes} className="h-1.5 flex-1" />
                                      <a href="/markets" className="text-xs text-primary hover:underline flex items-center gap-1">
                                        Trade <ArrowRight className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>;
                        })}
                            </div>
                          </div>}

                        {/* No linked markets message */}
                        {linkedMarkets.length === 0 && <div className="pt-4 border-t border-border">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Link2 className="w-4 h-4" />
                              <span className="text-sm">No tradeable markets linked yet</span>
                            </div>
                          </div>}

                        {/* Last updated */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                          <span>Last updated: {new Date(signal.last_updated).toLocaleDateString()}</span>
                          <span className="capitalize">Source: {signal.source}</span>
                        </div>
                      </CardContent>
                    </Card>;
              })}
              </div>

              {/* Signal Legend */}
              <div className="p-6 bg-card border border-border rounded-lg">
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

            {/* Drift Map Tab */}
            <TabsContent value="drift" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Signal Drift Map</h2>
                <Badge variant="outline" className="border-accent/30 text-accent">
                  <Activity className="w-3 h-3 mr-1" />
                  Weekly Tracking
                </Badge>
              </div>

              <Card className="bg-card border-border p-6">
                <div className="space-y-6">
                  {signals.map(signal => {
                  const linkedMarkets = getLinkedMarkets(signal.signal_code);
                  const directionValue = signal.current_direction === 'elevated' ? 75 : signal.current_direction === 'improving' ? 25 : 50;
                  return <div key={signal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-primary">{signal.signal_code}</span>
                            <span className="font-medium text-foreground">{signal.name}</span>
                            <Badge variant="outline" className="text-xs">{signal.region}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(signal.current_direction)}
                            <span className="text-sm capitalize text-muted-foreground">
                              {signal.current_direction}
                            </span>
                          </div>
                        </div>
                        
                        {/* Visual drift indicator */}
                        <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                          <div className={`absolute left-0 h-full transition-all duration-500 ${signal.current_direction === 'elevated' ? 'bg-gradient-to-r from-warning to-destructive' : signal.current_direction === 'improving' ? 'bg-gradient-to-r from-primary/50 to-primary' : 'bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/50'}`} style={{
                        width: `${directionValue}%`
                      }} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-foreground">
                              {linkedMarkets.length} linked market{linkedMarkets.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Linked market indicators */}
                        {linkedMarkets.length > 0 && <div className="flex flex-wrap gap-2 pl-4">
                            {linkedMarkets.map(market => {
                        const odds = getOdds(market);
                        return <Badge key={market.id} variant="outline" className="text-xs border-primary/30">
                                  {market.category}: {odds.yes}% YES
                                </Badge>;
                      })}
                          </div>}
                      </div>;
                })}
                </div>
              </Card>

              {/* Drift Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-destructive/10 border-destructive/30">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-destructive">
                      {signals.filter(s => s.current_direction === 'elevated').length}
                    </div>
                    <div className="text-sm text-destructive/80">Elevated Signals</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted border-border">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-muted-foreground">
                      {signals.filter(s => s.current_direction === 'stable').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Stable Signals</div>
                  </CardContent>
                </Card>
                <Card className="bg-primary/10 border-primary/30">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary">
                      {signals.filter(s => s.current_direction === 'improving').length}
                    </div>
                    <div className="text-sm text-primary/80">Improving Signals</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab - Heat Map */}
            <TabsContent value="analytics">
              <AttentionAnalytics />
            </TabsContent>
          </Tabs>

          {/* Email Subscription Section */}
          <div className="max-w-2xl mx-auto mt-12">
            <EmailSubscribeForm />
          </div>
        </div>
      </section>
    </div>;
};
export default Intelligence;