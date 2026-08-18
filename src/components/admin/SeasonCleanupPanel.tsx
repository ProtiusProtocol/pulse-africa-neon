import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Brush, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExpiredMarket {
  id: string;
  title: string;
  category: string;
  region: string;
  status: string;
  deadline: string | null;
  prior_yes_pct: number | null;
  yes_total: number | null;
  no_total: number | null;
  pending_predictions: number;
  real_trades: number;
}

type Outcome = "YES" | "NO";

/** Suggested outcome: market pool if traded, else the model prior, else NO. */
function suggestedOutcome(m: ExpiredMarket): Outcome {
  const yes = Number(m.yes_total ?? 0);
  const no = Number(m.no_total ?? 0);
  if (yes + no > 0) return yes >= no ? "YES" : "NO";
  if (m.prior_yes_pct != null) return Number(m.prior_yes_pct) >= 50 ? "YES" : "NO";
  return "NO";
}

export function SeasonCleanupPanel({ onChanged }: { onChanged?: () => void }) {
  const [markets, setMarkets] = useState<ExpiredMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-season-cleanup", {
        body: { action: "preview" },
      });
      if (error) throw error;
      const list: ExpiredMarket[] = data?.markets ?? [];
      setMarkets(list);
      setSelected(Object.fromEntries(list.map((m) => [m.id, true])));
      setOutcomes(Object.fromEntries(list.map((m) => [m.id, suggestedOutcome(m)])));
    } catch (e) {
      toast.error("Could not load expired markets", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectedIds = markets.filter((m) => selected[m.id]).map((m) => m.id);
  const byCategory = markets.reduce<Record<string, ExpiredMarket[]>>((acc, m) => {
    (acc[m.category] ||= []).push(m);
    return acc;
  }, {});

  const run = async (action: "settle" | "void") => {
    if (!selectedIds.length) return;
    const verb = action === "settle" ? "auto-settle" : "void & refund";
    if (!confirm(
      `${verb.toUpperCase()} ${selectedIds.length} expired market(s)?\n\n` +
      (action === "settle"
        ? "Each market is resolved in the database to the outcome shown, paper predictions are paid out, and leaderboard points, streaks and accuracy are updated."
        : "Each market is cancelled, staked prediction points are refunded and open trades are marked refunded.") +
      "\n\nThis cannot be undone."
    )) return;

    setWorking(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-season-cleanup", {
        body: {
          action,
          items: selectedIds.map((id) => ({ market_id: id, outcome: outcomes[id] })),
        },
      });
      if (error) throw error;
      toast.success(`${data.processed} market(s) ${action === "settle" ? "settled" : "voided"}`, {
        description: `${data.skipped} skipped · ${data.sessions_affected} player(s) updated`,
      });
      await load();
      onChanged?.();
    } catch (e) {
      toast.error("Cleanup failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setWorking(false);
    }
  };

  return (
    <Card className="border-amber-500/30">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brush className="h-5 w-5 text-amber-500" />
              Season Cleanup — Expired Markets
            </CardTitle>
            <CardDescription>
              Every market whose deadline has passed but has no outcome yet. Auto-settle uses the
              traded pool, falling back to the model prior. Resolution is database-only (demo/TestNet safe).
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading || working}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading expired markets…
          </div>
        ) : markets.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" /> Nothing expired — the platform is up to date.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{markets.length} expired</Badge>
              <Badge variant="outline">{selectedIds.length} selected</Badge>
              <Badge variant="outline">
                {markets.reduce((s, m) => s + m.pending_predictions, 0)} unsettled predictions
              </Badge>
              <div className="ml-auto flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected(Object.fromEntries(markets.map((m) => [m.id, true])))}
                  disabled={working}
                >
                  Select all
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelected({})} disabled={working}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => run("settle")} disabled={working || !selectedIds.length}>
                {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Auto-settle selected ({selectedIds.length})
              </Button>
              <Button
                variant="destructive"
                onClick={() => run("void")}
                disabled={working || !selectedIds.length}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Void &amp; refund selected
              </Button>
            </div>

            <div className="space-y-6">
              {Object.entries(byCategory).map(([category, list]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {category} · {list.length}
                  </h4>
                  {list.map((m) => {
                    const overdueDays = m.deadline
                      ? Math.floor((Date.now() - new Date(m.deadline).getTime()) / 86400000)
                      : 0;
                    return (
                      <div
                        key={m.id}
                        className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm"
                      >
                        <Checkbox
                          checked={!!selected[m.id]}
                          onCheckedChange={(v) =>
                            setSelected((s) => ({ ...s, [m.id]: !!v }))
                          }
                          aria-label={`Select ${m.title}`}
                        />
                        <div className="min-w-[240px] flex-1">
                          <p className="font-medium leading-snug">{m.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {overdueDays}d overdue · {m.region} · {m.pending_predictions} prediction(s)
                            {m.real_trades > 0 && ` · ${m.real_trades} real trade(s)`}
                            {m.prior_yes_pct != null && ` · prior ${m.prior_yes_pct}% YES`}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {(["YES", "NO"] as Outcome[]).map((side) => (
                            <Button
                              key={side}
                              size="sm"
                              variant={outcomes[m.id] === side ? "default" : "outline"}
                              className="min-h-11 min-w-16"
                              onClick={() => setOutcomes((o) => ({ ...o, [m.id]: side }))}
                              disabled={working}
                            >
                              {side}
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
