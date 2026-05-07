import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lightbulb, Sparkles } from "lucide-react";

export function AdminSignalSuggestionBox() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [region, setRegion] = useState("Global");
  const [autoMarkets, setAutoMarkets] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (topic.trim().length < 5) {
      toast({ title: "Topic too short", description: "Please enter at least 5 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-suggest-signal", {
        body: { topic, context, region, autoGenerateMarkets: autoMarkets },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const signal = (data as any)?.signal;
      const triggered = (data as any)?.marketsTriggered ?? 0;
      toast({
        title: "Fragility signal created",
        description: `${signal?.signal_code} — ${signal?.name}${triggered ? ` · ${triggered} market suggestion(s) generated` : ""}`,
      });
      setTopic("");
      setContext("");
    } catch (e) {
      toast({
        title: "Failed to create signal",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent" />
          Suggest a Topic to the Platform
        </CardTitle>
        <CardDescription>
          Describe a topic — religion, world events, scientific breakthroughs, geopolitics — and the platform will
          create a new fragility signal. Optionally auto-generate market suggestions for elevated signals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="suggest-topic">Topic</Label>
          <Input
            id="suggest-topic"
            placeholder="e.g. Public debate between Trump and the Pope on migration"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="suggest-context">Additional context (optional)</Label>
          <Textarea
            id="suggest-context"
            placeholder="Why this matters now, who the actors are, key dates, links to sources…"
            rows={3}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="suggest-region">Region</Label>
            <Input
              id="suggest-region"
              placeholder="Global / Africa / Southern Africa / Europe…"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={autoMarkets}
                onCheckedChange={(v) => setAutoMarkets(Boolean(v))}
                disabled={loading}
              />
              Auto-generate market suggestions if elevated
            </label>
          </div>
        </div>
        <Button onClick={submit} disabled={loading} variant="neon" className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating signal…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Create Fragility Signal
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
