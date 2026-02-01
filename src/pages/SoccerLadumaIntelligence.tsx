import { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, Minus, Activity, Target, Clock, 
  ChevronRight, Globe, Link2, ArrowRight, Trophy, Sparkles,
  ArrowLeft, LayoutDashboard, Calendar, Users, Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import SignalUniverse from "@/components/SignalUniverse";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface FragilitySignal {
  id: string;
  signal_code: string;
  name: string;
  description: string;
  core_components: any[];
  why_it_matters: string;
  current_direction: string;
  last_updated: string;
  region: string;
  weekly_update_md: string | null;
}

interface Market {
  id: string;
  title: string;
  category: string;
  region: string;
  status: string;
  resolution_criteria: string | null;
  linked_signals: string[] | null;
  deadline: string | null;
  yes_total: number | null;
  no_total: number | null;
  outcome_ref: string;
}

const SoccerLadumaIntelligence = () => {
  const navigate = useNavigate();
  const [signal, setSignal] = useState<FragilitySignal | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<string>("ALL");

  useEffect(() => {
    const fetchData = async () => {
      const [signalRes, marketsRes] = await Promise.all([
        supabase
          .from("fragility_signals")
          .select("*")
          .eq("signal_code", "FS-SPORT")
          .single(),
        supabase
          .from("markets")
          .select("*")
          .eq("category", "Sport")
          .eq("status", "active")
          .order("deadline", { ascending: true }),
      ]);

      if (signalRes.data) {
        setSignal({
          ...signalRes.data,
          core_components: Array.isArray(signalRes.data.core_components)
            ? signalRes.data.core_components
            : [],
        });
      }
      if (marketsRes.data) setMarkets(marketsRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

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

  const getDirectionBadge = (direction: string) => {
    const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      elevated: {
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        label: "Elevated",
        icon: <TrendingUp className="w-3 h-3" />,
      },
      stable: {
        color: "bg-[hsl(45,100%,50%)]/20 text-[hsl(45,100%,40%)] border-[hsl(45,100%,50%)]/30",
        label: "Stable",
        icon: <Minus className="w-3 h-3" />,
      },
      improving: {
        color: "bg-green-500/20 text-green-400 border-green-500/30",
        label: "Improving",
        icon: <TrendingDown className="w-3 h-3" />,
      },
    };
    const { color, label, icon } = config[direction] || config.stable;
    return (
      <Badge variant="outline" className={`${color} border flex items-center gap-1`}>
        {icon}
        {label}
      </Badge>
    );
  };

  // Categorize markets by tournament
  const pslMarkets = markets.filter(
    (m) => m.outcome_ref?.includes("PSL") || m.title.toLowerCase().includes("psl")
  );
  const fifaMarkets = markets.filter(
    (m) =>
      m.outcome_ref?.includes("FIFAWC") ||
      m.title.toLowerCase().includes("world cup") ||
      m.title.toLowerCase().includes("fifa")
  );
  const otherMarkets = markets.filter(
    (m) => !pslMarkets.includes(m) && !fifaMarkets.includes(m)
  );

  const filteredMarkets =
    selectedTournament === "PSL"
      ? pslMarkets
      : selectedTournament === "FIFA"
      ? fifaMarkets
      : selectedTournament === "OTHER"
      ? otherMarkets
      : markets;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-to-r from-[hsl(0,84%,25%)] to-[hsl(0,84%,35%)] py-4 px-4">
          <div className="container mx-auto">
            <Skeleton className="h-8 w-48 bg-white/20" />
          </div>
        </header>
        <div className="container mx-auto py-8 px-4">
          <Skeleton className="h-64 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-[hsl(0,84%,25%)] to-[hsl(0,84%,35%)] py-4 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/soccer-laduma">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Match Intelligence</h1>
              <p className="text-white/70 text-sm">Signals driving predictions</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/soccer-laduma/markets">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Predictions</span>
              </Button>
            </Link>
            <Link to="/soccer-laduma/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[hsl(0,84%,25%)] to-background py-12 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="outline" className="mb-4 border-[hsl(45,100%,50%)]/30 text-[hsl(45,100%,50%)]">
            <Activity className="w-3 h-3 mr-1" />
            Live Signal Intelligence
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            <span className="text-[hsl(45,100%,50%)]">Signals</span> That Move Predictions
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Track the real-world factors that shift match probabilities. 
            Better signals mean better predictions.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-8">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{markets.length}</div>
              <div className="text-xs text-white/60">Active Markets</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-[hsl(45,100%,50%)]">{pslMarkets.length}</div>
              <div className="text-xs text-white/60">PSL Markets</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{fifaMarkets.length}</div>
              <div className="text-xs text-white/60">FIFA WC 2026</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 space-y-8">
        {/* Signal Universe */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-[hsl(45,100%,50%)]" />
            <h3 className="text-xl font-bold">Prediction Universe</h3>
            <Badge variant="secondary" className="text-xs">LIVE</Badge>
          </div>
          <Card className="overflow-hidden">
            <SignalUniverse tenantId="soccer-laduma" className="h-48" />
          </Card>
        </section>

        {/* FS-SPORT Signal Card */}
        {signal && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-[hsl(0,84%,50%)]" />
              <h3 className="text-xl font-bold">Primary Signal</h3>
            </div>
            <Card className="border-l-4 border-l-[hsl(0,84%,50%)]">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono text-xs border-[hsl(0,84%,50%)]/30 text-[hsl(0,84%,50%)]">
                    {signal.signal_code}
                  </Badge>
                  {getDirectionBadge(signal.current_direction)}
                  <Badge variant="outline" className="border-border">
                    <Globe className="w-3 h-3 mr-1" />
                    {signal.region}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{signal.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{signal.description}</p>

                {/* Why It Matters */}
                <div className="p-3 bg-[hsl(0,84%,50%)]/10 rounded-lg border border-[hsl(0,84%,50%)]/20">
                  <h4 className="text-sm font-semibold text-[hsl(0,84%,50%)] mb-1">Why It Matters</h4>
                  <p className="text-sm text-foreground">{signal.why_it_matters}</p>
                </div>

                {/* Weekly Update */}
                {signal.weekly_update_md && (
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[hsl(45,100%,50%)]" />
                        <span className="text-sm font-semibold">Weekly Intelligence Update</span>
                      </div>
                      <Badge className="bg-[hsl(0,84%,50%)] text-white border-0 gap-1">
                        <Check className="w-3 h-3" />
                        Approved by Soccer Laduma
                      </Badge>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <MarkdownRenderer content={signal.weekly_update_md} />
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date(signal.last_updated).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Markets by Tournament */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-[hsl(45,100%,50%)]" />
              <h3 className="text-xl font-bold">Markets with Signals</h3>
            </div>
            <Badge variant="secondary">{filteredMarkets.length} markets</Badge>
          </div>

          {/* Tournament Tabs */}
          <Tabs value={selectedTournament} onValueChange={setSelectedTournament} className="space-y-4">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="ALL" className="gap-1">
                All <span className="text-xs text-muted-foreground">({markets.length})</span>
              </TabsTrigger>
              <TabsTrigger value="PSL" className="gap-1">
                🇿🇦 PSL <span className="text-xs text-muted-foreground">({pslMarkets.length})</span>
              </TabsTrigger>
              <TabsTrigger value="FIFA" className="gap-1">
                🏆 FIFA WC <span className="text-xs text-muted-foreground">({fifaMarkets.length})</span>
              </TabsTrigger>
              {otherMarkets.length > 0 && (
                <TabsTrigger value="OTHER" className="gap-1">
                  Other <span className="text-xs text-muted-foreground">({otherMarkets.length})</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value={selectedTournament} className="mt-0">
              <div className="grid gap-4 md:grid-cols-2">
                {filteredMarkets.map((market) => {
                  const odds = getOdds(market);
                  return (
                    <Card
                      key={market.id}
                      className="hover:border-[hsl(0,84%,50%)]/30 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {market.region}
                              </Badge>
                              {market.deadline && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(market.deadline), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium line-clamp-2">{market.title}</h4>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-500">{odds.yes}%</div>
                            <div className="text-xs text-muted-foreground">YES</div>
                          </div>
                        </div>

                        {/* Probability bar */}
                        <div className="mb-3">
                          <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                            <div
                              className="bg-green-500 transition-all"
                              style={{ width: `${odds.yes}%` }}
                            />
                            <div
                              className="bg-red-500 transition-all"
                              style={{ width: `${odds.no}%` }}
                            />
                          </div>
                        </div>

                        {/* Signal link & resolution */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Link2 className="h-3 w-3" />
                            {market.linked_signals?.join(", ") || "FS-SPORT"}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[hsl(0,84%,50%)] hover:text-[hsl(0,84%,45%)] gap-1"
                            onClick={() => navigate("/soccer-laduma/markets")}
                          >
                            Predict <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>

                        {market.resolution_criteria && (
                          <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                            Resolution: {market.resolution_criteria}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredMarkets.length === 0 && (
                <Card className="p-8 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No markets in this category yet.</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* CTA */}
        <Card className="p-6 bg-gradient-to-r from-[hsl(0,84%,50%)]/10 to-[hsl(45,100%,50%)]/10 border-[hsl(0,84%,50%)]/30 text-center">
          <h3 className="text-lg font-bold mb-2">Ready to make your predictions?</h3>
          <p className="text-muted-foreground mb-4">
            Use these signals to inform your predictions and climb the leaderboard.
          </p>
          <Button
            size="lg"
            className="bg-[hsl(0,84%,50%)] hover:bg-[hsl(0,84%,45%)] text-white"
            onClick={() => navigate("/soccer-laduma/markets")}
          >
            Start Predicting
          </Button>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Powered by <Link to="/" className="text-primary hover:underline">Augurion</Link> prediction infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SoccerLadumaIntelligence;
