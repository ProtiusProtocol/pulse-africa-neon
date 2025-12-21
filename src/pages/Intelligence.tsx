import { useState } from "react";
import { 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  Activity,
  Target,
  Clock,
  ChevronRight,
  Zap,
  Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Readiness levels for outcome tracking
type ReadinessLevel = 'WATCH' | 'APPROACHING' | 'DEFINED' | 'TRADEABLE';

interface WatchlistOutcome {
  id: string;
  name: string;
  country: string;
  description: string;
  readiness: ReadinessLevel;
  probability: number;
  previousProbability: number;
  driftDirection: 'UP' | 'DOWN' | 'STABLE';
  lastUpdated: Date;
  triggers: string[];
  resolutionDate?: Date;
}

interface FragilitySignal {
  id: string;
  name: string;
  country: string;
  value: number;
  previousValue: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  category: 'POLITICAL' | 'ECONOMIC' | 'SOCIAL' | 'SECURITY';
  lastUpdated: Date;
  description: string;
}

// Mock watchlist data
const mockWatchlist: WatchlistOutcome[] = [
  {
    id: '1',
    name: 'ANC Coalition Survival 2027',
    country: 'South Africa',
    description: 'Will the ANC-led Government of National Unity survive until the 2027 elections?',
    readiness: 'TRADEABLE',
    probability: 62,
    previousProbability: 58,
    driftDirection: 'UP',
    lastUpdated: new Date(),
    triggers: ['DA Cabinet tension rising', 'Economic indicators improving', 'Zuma factor declining'],
    resolutionDate: new Date('2027-05-15'),
  },
  {
    id: '2',
    name: 'Tinubu Economic Stabilization',
    country: 'Nigeria',
    description: 'Will Nigeria achieve single-digit inflation by end of 2025?',
    readiness: 'DEFINED',
    probability: 28,
    previousProbability: 32,
    driftDirection: 'DOWN',
    lastUpdated: new Date(),
    triggers: ['Naira volatility continuing', 'CBN policy shifts', 'Fuel subsidy effects'],
    resolutionDate: new Date('2025-12-31'),
  },
  {
    id: '3',
    name: 'Kenya Gen-Z Movement',
    country: 'Kenya',
    description: 'Will sustained protests force major cabinet changes by Q2 2025?',
    readiness: 'APPROACHING',
    probability: 71,
    previousProbability: 65,
    driftDirection: 'UP',
    lastUpdated: new Date(),
    triggers: ['Social media mobilization', 'Opposition alignment', 'International pressure'],
  },
  {
    id: '4',
    name: 'ECOWAS Niger Reintegration',
    country: 'Niger',
    description: 'Will Niger rejoin ECOWAS under new terms by 2026?',
    readiness: 'WATCH',
    probability: 35,
    previousProbability: 35,
    driftDirection: 'STABLE',
    lastUpdated: new Date(),
    triggers: ['Russia influence assessment', 'Economic pressure metrics', 'Regional diplomacy signals'],
  },
  {
    id: '5',
    name: 'Ethiopian Peace Consolidation',
    country: 'Ethiopia',
    description: 'Will the Tigray peace agreement hold through 2025 without major violations?',
    readiness: 'DEFINED',
    probability: 55,
    previousProbability: 60,
    driftDirection: 'DOWN',
    lastUpdated: new Date(),
    triggers: ['Humanitarian access reports', 'Disarmament progress', 'Amhara region tensions'],
  },
];

// Mock fragility signals
const mockFragilitySignals: FragilitySignal[] = [
  {
    id: '1',
    name: 'Coalition Cohesion Index',
    country: 'South Africa',
    value: 45,
    previousValue: 52,
    trend: 'DOWN',
    category: 'POLITICAL',
    lastUpdated: new Date(),
    description: 'Measuring internal alignment within GNU coalition partners',
  },
  {
    id: '2',
    name: 'Currency Volatility Score',
    country: 'Nigeria',
    value: 78,
    previousValue: 72,
    trend: 'UP',
    category: 'ECONOMIC',
    lastUpdated: new Date(),
    description: 'Naira exchange rate stability indicator',
  },
  {
    id: '3',
    name: 'Social Mobilization Index',
    country: 'Kenya',
    value: 82,
    previousValue: 75,
    trend: 'UP',
    category: 'SOCIAL',
    lastUpdated: new Date(),
    description: 'Tracking protest activity and social media coordination',
  },
  {
    id: '4',
    name: 'Regional Security Index',
    country: 'Sahel',
    value: 34,
    previousValue: 38,
    trend: 'DOWN',
    category: 'SECURITY',
    lastUpdated: new Date(),
    description: 'Composite security assessment for Sahel region',
  },
  {
    id: '5',
    name: 'Fiscal Stress Indicator',
    country: 'Ghana',
    value: 68,
    previousValue: 65,
    trend: 'UP',
    category: 'ECONOMIC',
    lastUpdated: new Date(),
    description: 'Government debt sustainability metrics',
  },
  {
    id: '6',
    name: 'Electoral Integrity Score',
    country: 'DRC',
    value: 42,
    previousValue: 40,
    trend: 'UP',
    category: 'POLITICAL',
    lastUpdated: new Date(),
    description: 'Assessment of electoral process credibility',
  },
];

const Intelligence = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const getReadinessBadge = (readiness: ReadinessLevel) => {
    const config = {
      WATCH: { color: 'bg-muted text-muted-foreground', label: 'Watch', icon: Eye },
      APPROACHING: { color: 'bg-warning/20 text-warning border-warning/30', label: 'Approaching', icon: Clock },
      DEFINED: { color: 'bg-accent/20 text-accent border-accent/30', label: 'Defined', icon: Target },
      TRADEABLE: { color: 'bg-primary/20 text-primary border-primary/30', label: 'Tradeable', icon: Zap },
    };
    const { color, label, icon: Icon } = config[readiness];
    return (
      <Badge variant="outline" className={`${color} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const getTrendIcon = (trend: 'UP' | 'DOWN' | 'STABLE') => {
    if (trend === 'UP') return <TrendingUp className="w-4 h-4 text-primary" />;
    if (trend === 'DOWN') return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      POLITICAL: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      ECONOMIC: 'bg-primary/20 text-primary border-primary/30',
      SOCIAL: 'bg-accent/20 text-accent border-accent/30',
      SECURITY: 'bg-destructive/20 text-destructive border-destructive/30',
    };
    return colors[category as keyof typeof colors] || 'bg-muted';
  };

  const filteredSignals = selectedCategory === 'ALL' 
    ? mockFragilitySignals 
    : mockFragilitySignals.filter(s => s.category === selectedCategory);

  const tradeableCount = mockWatchlist.filter(o => o.readiness === 'TRADEABLE').length;
  const approachingCount = mockWatchlist.filter(o => o.readiness === 'APPROACHING' || o.readiness === 'DEFINED').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              <Activity className="w-3 h-3 mr-1" />
              Layer 1 Intelligence
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-primary text-glow-primary">Outcome Intelligence</span>
              <br />
              <span className="text-foreground">Before Markets Move</span>
            </h1>
            <p className="text-muted-foreground">
              Track how real-world fragilities change. Surface probability drift before outcomes become tradeable.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{mockWatchlist.length}</div>
                <div className="text-xs text-muted-foreground">Outcomes Tracked</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{tradeableCount}</div>
                <div className="text-xs text-muted-foreground">Tradeable</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent">{approachingCount}</div>
                <div className="text-xs text-muted-foreground">Approaching</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{mockFragilitySignals.length}</div>
                <div className="text-xs text-muted-foreground">Active Signals</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links to Reports */}
          <div className="flex justify-center gap-4 mt-8">
            <a 
              href="/pulse" 
              className="group flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-lg hover:border-primary/50 hover:glow-primary transition-all duration-300"
            >
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-medium">Read Trader Pulse</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
            <a 
              href="/brief" 
              className="group flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-lg hover:border-accent/50 transition-all duration-300"
            >
              <Target className="w-4 h-4 text-accent" />
              <span className="font-medium">Read Executive Brief</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="watchlist" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-card border border-border">
              <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
              <TabsTrigger value="fragilities">Fragilities</TabsTrigger>
              <TabsTrigger value="drift">Drift Map</TabsTrigger>
            </TabsList>

            {/* Watchlist Tab */}
            <TabsContent value="watchlist" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Outcome Watchlist</h2>
                <Badge variant="outline" className="border-primary/30">
                  {mockWatchlist.length} outcomes
                </Badge>
              </div>
              
              <div className="space-y-4">
                {mockWatchlist.map((outcome) => (
                  <Card key={outcome.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {getReadinessBadge(outcome.readiness)}
                            <Badge variant="outline" className="border-border">
                              <Globe className="w-3 h-3 mr-1" />
                              {outcome.country}
                            </Badge>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-foreground">{outcome.name}</h3>
                          <p className="text-sm text-muted-foreground">{outcome.description}</p>
                          
                          <div className="flex flex-wrap gap-2">
                            {outcome.triggers.slice(0, 3).map((trigger, i) => (
                              <Badge key={i} variant="secondary" className="text-xs bg-muted/50">
                                {trigger}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-2 md:min-w-[140px]">
                          <div className="flex items-center gap-2">
                            {getTrendIcon(outcome.driftDirection)}
                            <span className="text-2xl font-bold text-primary">{outcome.probability}%</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            was {outcome.previousProbability}%
                          </div>
                          <Progress 
                            value={outcome.probability} 
                            className="w-24 h-2 bg-muted"
                          />
                          {outcome.resolutionDate && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {outcome.resolutionDate.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Fragilities Tab */}
            <TabsContent value="fragilities" className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-semibold">Fragility Signals</h2>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'POLITICAL', 'ECONOMIC', 'SOCIAL', 'SECURITY'].map((cat) => (
                    <Badge 
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      className={`cursor-pointer ${selectedCategory === cat ? 'bg-primary' : 'hover:bg-muted'}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSignals.map((signal) => (
                  <Card key={signal.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={getCategoryColor(signal.category)}>
                          {signal.category}
                        </Badge>
                        {getTrendIcon(signal.trend)}
                      </div>
                      <CardTitle className="text-base">{signal.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{signal.country}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-foreground">{signal.value}</span>
                          <span className="text-xs text-muted-foreground">/ 100</span>
                        </div>
                      </div>
                      <Progress value={signal.value} className="h-2 bg-muted" />
                      <p className="text-xs text-muted-foreground">{signal.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Previous: {signal.previousValue}</span>
                        <span>Δ {signal.value - signal.previousValue > 0 ? '+' : ''}{signal.value - signal.previousValue}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Drift Map Tab */}
            <TabsContent value="drift" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Probability Drift Map</h2>
                <Badge variant="outline" className="border-accent/30 text-accent">
                  <Activity className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              </div>

              <Card className="bg-card border-border p-6">
                <div className="space-y-6">
                  {mockWatchlist.map((outcome) => {
                    const drift = outcome.probability - outcome.previousProbability;
                    const driftColor = drift > 0 ? 'text-primary' : drift < 0 ? 'text-destructive' : 'text-muted-foreground';
                    
                    return (
                      <div key={outcome.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{outcome.name}</span>
                            <Badge variant="outline" className="text-xs">{outcome.country}</Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold ${driftColor}`}>
                              {drift > 0 ? '+' : ''}{drift}%
                            </span>
                            <span className="text-lg font-bold text-primary">{outcome.probability}%</span>
                          </div>
                        </div>
                        
                        {/* Visual drift bar */}
                        <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                          {/* Base probability */}
                          <div 
                            className="absolute inset-y-0 left-0 bg-primary/30 transition-all duration-500"
                            style={{ width: `${outcome.previousProbability}%` }}
                          />
                          {/* Current probability with glow */}
                          <div 
                            className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                            style={{ 
                              width: `${outcome.probability}%`,
                              boxShadow: drift !== 0 ? '0 0 20px hsl(var(--primary))' : 'none'
                            }}
                          />
                          {/* Drift indicator */}
                          {drift !== 0 && (
                            <div 
                              className={`absolute inset-y-0 flex items-center justify-center transition-all duration-500 ${drift > 0 ? 'bg-primary/50' : 'bg-destructive/50'}`}
                              style={{ 
                                left: `${Math.min(outcome.probability, outcome.previousProbability)}%`,
                                width: `${Math.abs(drift)}%`
                              }}
                            >
                              <ChevronRight className={`w-4 h-4 ${drift > 0 ? 'text-primary' : 'text-destructive rotate-180'}`} />
                            </div>
                          )}
                          {/* Markers */}
                          <div className="absolute inset-0 flex items-center justify-between px-2 text-xs">
                            <span className="text-muted-foreground">0%</span>
                            <span className="text-muted-foreground">50%</span>
                            <span className="text-muted-foreground">100%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Drift Summary */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-primary/10 border-primary/30">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">
                      {mockWatchlist.filter(o => o.driftDirection === 'UP').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Rising Probability</div>
                  </CardContent>
                </Card>
                <Card className="bg-destructive/10 border-destructive/30">
                  <CardContent className="p-4 text-center">
                    <TrendingDown className="w-6 h-6 text-destructive mx-auto mb-2" />
                    <div className="text-2xl font-bold text-destructive">
                      {mockWatchlist.filter(o => o.driftDirection === 'DOWN').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Falling Probability</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted border-border">
                  <CardContent className="p-4 text-center">
                    <Minus className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">
                      {mockWatchlist.filter(o => o.driftDirection === 'STABLE').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Stable</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Intelligence;
