import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Rocket, AlertTriangle, CheckCircle, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Market {
  id: string;
  title: string;
  outcome_ref: string;
  deadline: string | null;
  fee_bps: number | null;
  app_id: string;
}

interface DeployContractDialogProps {
  market: Market | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeploySuccess: () => void;
}

type DialogStep = "instructions" | "enter-app-id" | "saving" | "success";

export function DeployContractDialog({
  market,
  open,
  onOpenChange,
  onDeploySuccess,
}: DeployContractDialogProps) {
  const [step, setStep] = useState<DialogStep>("instructions");
  const [newAppId, setNewAppId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setStep("instructions");
    setNewAppId("");
    setIsSaving(false);
  };

  const loraUrl = "https://lora.algokit.io/testnet/applications";

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const copyAllParams = () => {
    if (!market) return;
    
    const params = `AugurionMarketV4 Deployment Parameters
────────────────────────────────
outcome_ref: ${market.outcome_ref}
fee_bps: ${market.fee_bps || 200}
deadline: ${market.deadline ? new Date(market.deadline).toISOString().split('T')[0] : 'Not set'}
────────────────────────────────
Deploy at: ${loraUrl}`;

    navigator.clipboard.writeText(params);
    toast({
      title: "All Parameters Copied!",
      description: "Paste in Lora's Create form",
    });
  };

  const handleSaveAppId = async () => {
    if (!market || !newAppId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid App ID",
        variant: "destructive",
      });
      return;
    }

    // Validate that it's a number
    const parsedAppId = parseInt(newAppId.trim(), 10);
    if (isNaN(parsedAppId) || parsedAppId <= 0) {
      toast({
        title: "Error",
        description: "App ID must be a positive number",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setStep("saving");

    try {
      const { error } = await supabase
        .from("markets")
        .update({ app_id: parsedAppId.toString() })
        .eq("id", market.id);

      if (error) {
        throw new Error(error.message);
      }

      setStep("success");
      toast({
        title: "App ID Updated!",
        description: `Market now linked to App ID ${parsedAppId}`,
      });
    } catch (err) {
      console.error("Save error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save App ID",
        variant: "destructive",
      });
      setStep("enter-app-id");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessClose = () => {
    onDeploySuccess();
    handleClose();
  };

  if (!market) return null;

  // Define loraUrl here so it's accessible to both copyAllParams and the JSX

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-accent" />
            Deploy to Algorand TestNet
          </DialogTitle>
          <DialogDescription>
            Deploy AugurionMarketV4 contract via Lora, then enter the App ID here.
          </DialogDescription>
        </DialogHeader>

        {step === "instructions" && (
          <>
            <div className="space-y-4 py-4">
              {/* Market summary */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                <p className="text-sm font-semibold line-clamp-2">{market.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Outcome ID:</span>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {market.outcome_ref}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(market.outcome_ref, "Outcome ID")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                
                {/* Copy All Parameters Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={copyAllParams}
                >
                  <Copy className="w-3 h-3 mr-2" />
                  Copy All Parameters
                </Button>
              </div>

              {/* Step by step instructions */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Deployment Steps:</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">1</Badge>
                    <div className="flex-1">
                      <p>Open Lora Applications</p>
                      <a 
                        href={loraUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {loraUrl}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">2</Badge>
                    <div className="flex-1">
                      <p>Click <strong>"Create"</strong> and select AugurionMarketV4</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">3</Badge>
                    <div className="flex-1">
                      <p>Configure the market with:</p>
                      <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                        <li>• outcome_ref: <code className="bg-muted px-1 rounded">{market.outcome_ref}</code></li>
                        <li>• fee_bps: <code className="bg-muted px-1 rounded">{market.fee_bps || 200}</code></li>
                        {market.deadline && (
                          <li>• deadline: {new Date(market.deadline).toLocaleDateString()}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">4</Badge>
                    <div className="flex-1">
                      <p>Sign the transaction with your Pera Wallet</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">5</Badge>
                    <div className="flex-1">
                      <p>Copy the <strong>App ID</strong> after deployment</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-secondary/10 rounded-lg border border-secondary/30">
                <AlertTriangle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Make sure your wallet is connected to <strong>TestNet</strong> and has ALGO for transaction fees.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep("enter-app-id")}>
                I've Deployed → Enter App ID
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "enter-app-id" && (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="appId">Algorand App ID</Label>
                <Input
                  id="appId"
                  type="text"
                  placeholder="e.g. 752590885"
                  value={newAppId}
                  onChange={(e) => setNewAppId(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the App ID shown in Lora after deployment
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("instructions")}>
                Back
              </Button>
              <Button 
                onClick={handleSaveAppId}
                disabled={!newAppId.trim()}
              >
                Save App ID
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "saving" && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
            <p className="font-medium">Saving App ID...</p>
          </div>
        )}

        {step === "success" && (
          <>
            <div className="py-8 text-center space-y-4">
              <CheckCircle className="w-12 h-12 mx-auto text-primary" />
              <div>
                <p className="font-medium text-lg">Market Linked!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  App ID {newAppId} is now connected to this market
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                You can now click <strong>"Open"</strong> to activate the market for trading.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleSuccessClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
