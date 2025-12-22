import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, Bell, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { WelcomeFlow } from "./WelcomeFlow";

const subscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().optional(),
});

export function EmailSubscribeForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [subscribePulse, setSubscribePulse] = useState(true);
  const [subscribeBrief, setSubscribeBrief] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [subscribedTo, setSubscribedTo] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = subscribeSchema.safeParse({ email, name });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (!subscribePulse && !subscribeBrief) {
      toast.error("Please select at least one report type");
      return;
    }

    setLoading(true);

    try {
      const subs: string[] = [];
      if (subscribePulse) subs.push("trader_pulse");
      if (subscribeBrief) subs.push("executive_brief");

      const { error } = await supabase
        .from("email_subscribers")
        .upsert({
          email: email.toLowerCase().trim(),
          name: name.trim() || null,
          subscribed_to: subs,
          is_active: true,
        }, {
          onConflict: "email",
        });

      if (error) {
        if (error.code === "23505") {
          // Already subscribed, update preferences
          const { error: updateError } = await supabase
            .from("email_subscribers")
            .update({
              name: name.trim() || null,
              subscribed_to: subs,
              is_active: true,
              unsubscribed_at: null,
            })
            .eq("email", email.toLowerCase().trim());

          if (updateError) throw updateError;
          toast.success("Subscription preferences updated!");
        } else {
          throw error;
        }
      } else {
        toast.success("Successfully subscribed to weekly reports!");
      }

      setSubscribedTo(subs);
      setSuccess(true);
      setShowWelcome(true);
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Card className="border-primary/30 bg-card/50">
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">You're Subscribed!</h3>
            <p className="text-muted-foreground">
              You'll receive weekly intelligence reports in your inbox.
            </p>
          </CardContent>
        </Card>
        <WelcomeFlow 
          isOpen={showWelcome} 
          onClose={() => setShowWelcome(false)}
          subscriberName={name || undefined}
          subscribedTo={subscribedTo}
        />
      </>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Get Weekly Updates</CardTitle>
            <CardDescription>
              Receive intelligence reports directly in your inbox
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sub-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="sub-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-name">Name (optional)</Label>
              <Input
                id="sub-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Subscribe to:</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pulse"
                  checked={subscribePulse}
                  onCheckedChange={(checked) => setSubscribePulse(checked === true)}
                  disabled={loading}
                />
                <Label htmlFor="pulse" className="text-sm font-normal cursor-pointer">
                  Trader Pulse
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="brief"
                  checked={subscribeBrief}
                  onCheckedChange={(checked) => setSubscribeBrief(checked === true)}
                  disabled={loading}
                />
                <Label htmlFor="brief" className="text-sm font-normal cursor-pointer">
                  Executive Brief
                </Label>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Subscribe
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}