import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FragilitySignalCard } from "@/components/FragilitySignalCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ShieldCheck, Activity, Archive, Clock, Wallet } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import meshLogo from "@/assets/mesh-logo.png";

const SIGNAL_CODE = "MESH-01";

interface Suggestion {
  id: string;
  suggested_title: string;
  suggested_deadline: string | null;
  suggested_initial_yes_probability: number | null;
  status: string;
  ai_reasoning: string | null;
}

interface Market {
  id: string;
  title: string;
  status: string;
  category: string;
  deadline: string | null;
  prior_yes_pct: number | null;
  yes_total: number | null;
  no_total: number | null;
  resolved_outcome: string | null;
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

const ProbabilityBar = ({ pct }: { pct: number }) => (
  <div className="flex items-center gap-2 min-w-[120px]">
    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
      <div className="h-full bg-primary glow-primary" style={{ width: `${pct}%` }} />
    </div>
    <span className="text-xs font-mono text-primary w-10 text-right">{pct}%</span>
  </div>
);

const MeshIntelligence = () => {
  const [signal, setSignal] = useState<any | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const { walletAddress, isConnecting, connect, disconnect } = useWallet();

  useEffect(() => {
    (async () => {
      const [sigRes, sugRes, mktRes] = await Promise.all([
        supabase.from("fragility_signals").select("*").eq("signal_code", SIGNAL_CODE).maybeSingle(),
        supabase.from("market_suggestions").select("*").eq("signal_code", SIGNAL_CODE).order("created_at"),
        supabase
          .from("markets")
          .select("*")
          .contains("linked_signals", [SIGNAL_CODE])
          .order("created_at", { ascending: false }),
      ]);
      if (sigRes.data) {
        setSignal({
          ...sigRes.data,
          core_components: Array.isArray(sigRes.data.core_components)
            ? sigRes.data.core_components
            : JSON.parse(sigRes.data.core_components as string),
        });
      }
      setSuggestions(sugRes.data ?? []);
      setMarkets((mktRes.data as Market[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const pending = suggestions.filter((s) => s.status === "pending");
  const approved = markets.filter((m) => m.status === "pending");
  const live = markets.filter((m) => m.status === "active" || m.status === "frozen");
  const resolved = markets.filter((m) => m.status === "resolved" || m.status === "cancelled");

  return (
    <div className="min-h-screen bg-background">
      {/* MESH-only top bar */}
      <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between max-w-6xl">
          <Link to="/mesh" className="flex items-center gap-3">
            <img src={meshLogo} alt="MESH" className="h-8 w-auto object-contain" />
            <span className="font-bold tracking-tight text-primary text-glow-primary hidden sm:inline">
              MESH Intelligence
            </span>
          </Link>
          {walletAddress ? (
            <Button variant="outline" size="sm" onClick={disconnect} className="font-mono text-xs">
              <Wallet className="w-4 h-4 mr-2 text-primary" />
              {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)}
            </Button>
          ) : (
            <Button variant="hero" size="sm" onClick={connect} disabled={isConnecting}>
              <Wallet className="w-4 h-4 mr-2" />
              {isConnecting ? "Connecting…" : "Connect Wallet"}
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl">

        {/* Header / Logo */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <img
              src={meshLogo}
              alt="MESH logo"
              width={1536}
              height={1024}
              loading="lazy"
              className="h-14 md:h-16 w-auto object-contain"
            />
            <div>
              <Badge variant="outline" className="border-primary/50 text-primary mb-2">
                Institutional Intelligence
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">MESH Intelligence</h1>
            </div>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Regulated digital asset infrastructure signal
          </div>
        </div>

        {/* Explainer */}
        <Card className="mb-8 border-primary/30">
          <CardContent className="p-6 text-sm md:text-base text-muted-foreground leading-relaxed">
            <strong className="text-foreground">MESH</strong> is a South African digital asset exchange and
            infrastructure platform focused on regulated digital assets, custody, tokenization and institutional
            access. The <strong className="text-foreground">MESH Intelligence Signal</strong> uses Augurion&rsquo;s
            prediction-market engine to surface forward-looking intelligence on regulation, adoption, tokenized
            assets and renewable infrastructure.
          </CardContent>
        </Card>

        {/* Signal card */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Intelligence Signal
          </h2>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : signal ? (
            <FragilitySignalCard signal={signal} />
          ) : (
            <Card>
              <CardContent className="p-6 text-muted-foreground">
                MESH signal not yet seeded.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="recommendations" className="text-xs md:text-sm">
              Recommendations ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs md:text-sm">
              Approved ({approved.length})
            </TabsTrigger>
            <TabsTrigger value="live" className="text-xs md:text-sm">
              Live ({live.length})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs md:text-sm">
              Archive ({resolved.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-3 mt-6">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : pending.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No pending recommendations. Generate new ones from the Admin Dashboard.
                </CardContent>
              </Card>
            ) : (
              pending.map((s) => (
                <Card key={s.id} className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">PENDING REVIEW</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {fmtDate(s.suggested_deadline)}
                        </span>
                      </div>
                      <p className="text-sm md:text-base font-medium">{s.suggested_title}</p>
                      {s.ai_reasoning && (
                        <p className="text-xs text-muted-foreground mt-1.5 italic">{s.ai_reasoning}</p>
                      )}
                    </div>
                    {s.suggested_initial_yes_probability !== null && (
                      <ProbabilityBar pct={Number(s.suggested_initial_yes_probability)} />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
            <p className="text-xs text-muted-foreground pt-2">
              Approve, adjust opening odds, and deploy from the{" "}
              <Link to="/admin" className="text-primary underline">Admin Dashboard</Link>.
            </p>
          </TabsContent>

          <TabsContent value="approved" className="space-y-3 mt-6">
            {approved.length === 0 ? (
              <EmptyState icon={<ShieldCheck className="w-5 h-5" />} text="No approved markets awaiting deployment." />
            ) : (
              approved.map((m) => <MarketRow key={m.id} m={m} />)
            )}
          </TabsContent>

          <TabsContent value="live" className="space-y-3 mt-6">
            {live.length === 0 ? (
              <EmptyState icon={<Activity className="w-5 h-5" />} text="No live MESH markets yet." />
            ) : (
              live.map((m) => <MarketRow key={m.id} m={m} />)
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-3 mt-6">
            {resolved.length === 0 ? (
              <EmptyState icon={<Archive className="w-5 h-5" />} text="No resolved MESH markets yet." />
            ) : (
              resolved.map((m) => <MarketRow key={m.id} m={m} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const EmptyState = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <Card>
    <CardContent className="p-6 text-sm text-muted-foreground flex items-center gap-2">
      {icon}
      {text}
    </CardContent>
  </Card>
);

const MarketRow = ({ m }: { m: Market }) => {
  const total = (m.yes_total ?? 0) + (m.no_total ?? 0);
  const yesPct =
    total > 0
      ? Math.round(((m.yes_total ?? 0) / total) * 100)
      : m.prior_yes_pct !== null
      ? Math.round(Number(m.prior_yes_pct))
      : 50;
  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] uppercase">{m.status}</Badge>
            {m.resolved_outcome && (
              <Badge variant="default" className="text-[10px]">Resolved: {m.resolved_outcome}</Badge>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {fmtDate(m.deadline)}
            </span>
          </div>
          <p className="text-sm md:text-base font-medium">{m.title}</p>
        </div>
        <ProbabilityBar pct={yesPct} />
      </CardContent>
    </Card>
  );
};

export default MeshIntelligence;
