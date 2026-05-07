import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type FragilitySignal = Tables<"fragility_signals">;

interface Props {
  signal: FragilitySignal | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}

export function EditFragilitySignalDialog({ signal, open, onOpenChange, onSaved }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [whyItMatters, setWhyItMatters] = useState("");
  const [region, setRegion] = useState("");
  const [direction, setDirection] = useState("stable");
  const [weeklyUpdate, setWeeklyUpdate] = useState("");
  const [components, setComponents] = useState("");
  const [regenMarkets, setRegenMarkets] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!signal) return;
    setName(signal.name ?? "");
    setDescription(signal.description ?? "");
    setWhyItMatters(signal.why_it_matters ?? "");
    setRegion(signal.region ?? "Southern Africa");
    setDirection(signal.current_direction ?? "stable");
    setWeeklyUpdate(signal.weekly_update_md ?? "");
    const comps = Array.isArray(signal.core_components) ? signal.core_components : [];
    setComponents(comps.map((c) => (typeof c === "string" ? c : JSON.stringify(c))).join("\n"));
    setRegenMarkets(false);
  }, [signal]);

  const save = async () => {
    if (!signal) return;
    setSaving(true);
    try {
      const coreComponents = components
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from("fragility_signals")
        .update({
          name,
          description,
          why_it_matters: whyItMatters,
          region,
          current_direction: direction,
          weekly_update_md: weeklyUpdate || null,
          core_components: coreComponents,
          last_updated: new Date().toISOString(),
        })
        .eq("id", signal.id);

      if (error) throw error;

      let triggered = 0;
      if (regenMarkets && direction === "elevated") {
        const { data, error: fnErr } = await supabase.functions.invoke("fragility-market-suggestions", {
          body: {},
        });
        if (!fnErr && (data as any)?.suggestionsCreated) {
          triggered = (data as any).suggestionsCreated;
        }
      }

      toast({
        title: "Signal updated",
        description: triggered
          ? `${signal.signal_code} saved · ${triggered} new market suggestion(s)`
          : `${signal.signal_code} saved`,
      });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Fragility Signal</DialogTitle>
          <DialogDescription>
            {signal?.signal_code ?? ""} — update direction, weekly note, and details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Region</Label>
              <Input value={region} onChange={(e) => setRegion(e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label>Current direction</Label>
              <Select value={direction} onValueChange={setDirection} disabled={saving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="elevated">Elevated</SelectItem>
                  <SelectItem value="declining">Declining</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label>Why it matters</Label>
            <Textarea rows={2} value={whyItMatters} onChange={(e) => setWhyItMatters(e.target.value)} disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label>Core components (one per line)</Label>
            <Textarea rows={4} value={components} onChange={(e) => setComponents(e.target.value)} disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label>Weekly update (markdown)</Label>
            <Textarea
              rows={5}
              placeholder="What changed this week? Sources, datapoints, interpretation…"
              value={weeklyUpdate}
              onChange={(e) => setWeeklyUpdate(e.target.value)}
              disabled={saving}
            />
          </div>
          {direction === "elevated" && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={regenMarkets} onCheckedChange={(v) => setRegenMarkets(Boolean(v))} disabled={saving} />
              Trigger AI market suggestions for elevated signals now
            </label>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} variant="neon">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
