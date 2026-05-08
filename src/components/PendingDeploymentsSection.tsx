import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Loader2, Clock, AlertTriangle } from "lucide-react";
import { InfoHint } from "@/components/admin/InfoHint";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Market = Tables<"markets">;

interface PendingDeploymentsSectionProps {
  markets: Market[];
  onDeploySuccess: () => void;
}

export function PendingDeploymentsSection({
  markets,
  onDeploySuccess,
}: PendingDeploymentsSectionProps) {
  const [deployingId, setDeployingId] = useState<string | null>(null);
  const { toast } = useToast();

  const pending = markets.filter((m) => m.app_id === "PENDING");

  const handleAutoDeploy = async (market: Market) => {
    setDeployingId(market.id);
    try {
      const { data, error } = await supabase.functions.invoke("deploy-market", {
        body: { market_id: market.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.app_id) throw new Error("No app_id returned from deploy function");

      toast({
        title: "Contract Deployed!",
        description: `App ID ${data.app_id} created and market activated`,
      });
      onDeploySuccess();
    } catch (err) {
      console.error("Auto-deploy error:", err);
      toast({
        title: "Auto-deploy failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeployingId(null);
    }
  };

  return (
    <section id="pending-deployments" className="scroll-mt-24">
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Pending Deployments</h2>
        <InfoHint text={"Markets whose database row exists but no Algorand contract has been deployed yet (app_id = PENDING).\n\nMarkets land here in two ways:\n1. You approve an AI Market Suggestion (most common)\n2. You manually create a market without deploying the contract\n\nClick 'Auto-Deploy' to create the TestNet contract — takes ~30s and uses ~0.6 ALGO from the deployer wallet. Status flips to 'active' on success."} />
        {pending.length > 0 && (
          <Badge variant="destructive" className="ml-2">
            {pending.length} ready to deploy
          </Badge>
        )}
      </div>

      {pending.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No markets pending deployment.</p>
            <p className="text-sm mt-1">
              Approve an AI Market Suggestion above to add markets to this queue.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Each deployment uses ~0.6 ALGO from the deployer wallet (TestNet) and takes ~30 seconds.
                Status will change to <strong>active</strong> once complete.
              </p>
            </CardContent>
          </Card>
          {pending.map((market) => (
            <Card key={market.id} className="border-primary/30 bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{market.category}</Badge>
                      <Badge variant="secondary" className="text-xs">{market.region}</Badge>
                      <Badge variant="outline" className="text-xs font-mono bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
                        app_id: PENDING
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{market.title}</h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      Outcome ID: {market.outcome_ref}
                    </p>
                    {market.deadline && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Deadline: {new Date(market.deadline).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleAutoDeploy(market)}
                    disabled={deployingId !== null}
                    variant="neon"
                    className="flex-shrink-0"
                  >
                    {deployingId === market.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deploying…
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Auto-Deploy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
