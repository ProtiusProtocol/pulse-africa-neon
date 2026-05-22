import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Rocket, Loader2, Clock, AlertTriangle, Pencil, Save } from "lucide-react";
import { InfoHint } from "@/components/admin/InfoHint";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Market = Tables<"markets">;

interface PendingDeploymentsSectionProps {
  markets: Market[];
  onDeploySuccess: () => void;
}

// Convert ISO timestamp to value suitable for <input type="datetime-local">
const toLocalInputValue = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function PendingDeploymentsSection({
  markets,
  onDeploySuccess,
}: PendingDeploymentsSectionProps) {
  const [deployingId, setDeployingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Market | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    deadline: "",
    outcome_ref: "",
    resolution_criteria: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Only show markets that are actually awaiting deployment — exclude any that
  // have already been resolved or cancelled in the DB (those should never be
  // deployed on-chain, even if their app_id is still "PENDING").
  const pending = markets.filter(
    (m) =>
      m.app_id?.startsWith("PENDING") &&
      m.status !== "resolved" &&
      m.status !== "cancelled" &&
      !m.resolved_outcome,
  );

  const openEdit = (m: Market) => {
    setEditing(m);
    setEditForm({
      title: m.title ?? "",
      deadline: toLocalInputValue(m.deadline),
      outcome_ref: m.outcome_ref ?? "",
      resolution_criteria: m.resolution_criteria ?? "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editForm.deadline) {
      toast({ title: "Deadline required", description: "Pick a deadline before saving.", variant: "destructive" });
      return;
    }
    const deadlineDate = new Date(editForm.deadline);
    if (deadlineDate.getTime() <= Date.now()) {
      toast({
        title: "Deadline must be in the future",
        description: "On-chain expiry is immutable — pick a date after today.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase
      .from("markets")
      .update({
        title: editForm.title,
        deadline: editForm.deadline ? new Date(editForm.deadline).toISOString() : null,
        outcome_ref: editForm.outcome_ref,
        resolution_criteria: editForm.resolution_criteria || null,
      })
      .eq("id", editing.id);
    setIsSaving(false);
    if (error) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Market updated", description: "Ready to deploy." });
    setEditing(null);
    onDeploySuccess(); // refetch
  };

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
        <InfoHint text={"Markets whose database row exists but no Algorand contract has been deployed yet (app_id = PENDING).\n\nClick 'Edit' to fix the title, deadline, outcome ID, or resolution criteria BEFORE deploying. Once deployed on-chain, the deadline is locked into the contract.\n\nClick 'Auto-Deploy' to create the TestNet contract — takes ~30s and uses ~0.6 ALGO from the deployer wallet."} />
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
                Edit any market BEFORE deploying — the deadline is written into the on-chain contract and can't be changed afterward.
                Each deployment uses ~0.6 ALGO from the deployer wallet (TestNet) and takes ~30 seconds.
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      onClick={() => openEdit(market)}
                      disabled={deployingId !== null}
                      variant="outline"
                      size="sm"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleAutoDeploy(market)}
                      disabled={deployingId !== null}
                      variant="neon"
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Pending Market</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Textarea
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-deadline">Deadline</Label>
              <Input
                id="edit-deadline"
                type="datetime-local"
                value={editForm.deadline}
                onChange={(e) => setEditForm((f) => ({ ...f, deadline: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This deadline will be written into the Algorand contract on deploy.
              </p>
            </div>
            <div>
              <Label htmlFor="edit-outcome-ref">Outcome Ref (ID)</Label>
              <Input
                id="edit-outcome-ref"
                value={editForm.outcome_ref}
                onChange={(e) => setEditForm((f) => ({ ...f, outcome_ref: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-criteria">Resolution Criteria</Label>
              <Textarea
                id="edit-criteria"
                value={editForm.resolution_criteria}
                onChange={(e) => setEditForm((f) => ({ ...f, resolution_criteria: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={isSaving} variant="neon">
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
