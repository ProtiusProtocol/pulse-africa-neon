import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Gavel, Loader2, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Market = Tables<"markets">;

interface Props {
  markets: Market[];
  onResolved: () => void;
}

export function ResolveMarketPanel({ markets, onResolved }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Markets that still need resolving: no resolved_outcome AND status not cancelled
  const pending = markets.filter(
    (m) => !m.resolved_outcome && m.status !== "cancelled"
  );

  const resolveMarket = async (market: Market, side: "YES" | "NO") => {
    if (!confirm(
      `Resolve "${market.title}" as ${side}?\n\n` +
      `This will:\n` +
      `1. Call resolve_market(${side}) on-chain via the deployer wallet\n` +
      `2. Mark the market resolved in the database\n` +
      `3. Automatically pay every winning trader (pro-rata, net 2% fee) directly from the deployer wallet on TestNet\n\n` +
      `Continue?`
    )) return;

    setLoadingId(market.id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-resolve-market", {
        body: { market_id: market.id, winning_side: side },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const paid = (data?.payouts || []).filter((p: any) => p.tx_id).length;
      const failed = (data?.payouts || []).filter((p: any) => p.error).length;
      toast.success(
        `Resolved as ${side} · ${paid} winner${paid === 1 ? "" : "s"} paid${failed ? ` · ${failed} payout error(s)` : ""}`,
        { description: data?.steps?.join(" · ") }
      );
      onResolved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Resolve failed", { description: msg });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card className="border-primary/30 bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="w-5 h-5 text-primary" />
          Resolve Markets (Semi-Automated, TestNet)
        </CardTitle>
        <CardDescription>
          Pick a winning side. The deployer wallet will resolve on-chain and pay every winner directly. No user wallet action needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            All markets are resolved or cancelled.
          </div>
        ) : (
          pending.map((m) => {
            const deadlinePast = m.deadline ? new Date(m.deadline) < new Date() : false;
            return (
              <div
                key={m.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{m.title}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                    <span>app: {m.app_id || "—"}</span>
                    {m.deadline && (
                      <span className={deadlinePast ? "text-destructive" : ""}>
                        deadline: {new Date(m.deadline).toLocaleDateString()}
                        {deadlinePast && " (past)"}
                      </span>
                    )}
                    <span>
                      pool: {Number(m.yes_total || 0).toFixed(2)} YES / {Number(m.no_total || 0).toFixed(2)} NO ALGO
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    disabled={loadingId === m.id}
                    onClick={() => resolveMarket(m, "YES")}
                    className="min-h-11"
                  >
                    {loadingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resolve YES"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={loadingId === m.id}
                    onClick={() => resolveMarket(m, "NO")}
                    className="min-h-11"
                  >
                    {loadingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resolve NO"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
