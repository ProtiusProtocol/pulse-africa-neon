import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Copy, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function DeployerWalletInfo() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<{ address: string; balanceAlgo: number | null; network: string } | null>(null);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-deployer-info");
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setInfo(data as any);
    } catch (e: any) {
      toast({ title: "Failed to load deployer info", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!info) return;
    navigator.clipboard.writeText(info.address);
    toast({ title: "Address copied" });
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-primary" />
          Deployer Wallet
          <Badge variant="outline" className="ml-2 text-[10px]">{info?.network ?? "testnet"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!info ? (
          <Button onClick={fetchInfo} disabled={loading} size="sm">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wallet className="h-4 w-4 mr-2" />}
            Reveal address & balance
          </Button>
        ) : (
          <>
            <div className="font-mono text-xs break-all p-2 rounded bg-muted/50 border border-border">
              {info.address}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {info.balanceAlgo === null ? "balance unavailable" : `${info.balanceAlgo.toFixed(4)} ALGO`}
              </Badge>
              <Button size="sm" variant="outline" onClick={copy}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open(`https://lora.algokit.io/${info.network}/account/${info.address}`, "_blank")}>
                <ExternalLink className="h-3 w-3 mr-1" /> Lora
              </Button>
              <Button size="sm" variant="ghost" onClick={fetchInfo} disabled={loading}>
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              This wallet signs all automatic market deployments. Keep it funded to avoid failed deployments.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
