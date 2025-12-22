import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

const SUBSCRIPTION_OPTIONS = [
  { id: "trader_pulse", label: "Trader Pulse", description: "Weekly market analysis for traders" },
  { id: "executive_brief", label: "Executive Brief", description: "High-level intelligence summary for executives" },
];

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [currentSubscriptions, setCurrentSubscriptions] = useState<string[]>([]);
  const [selectedToRemove, setSelectedToRemove] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (email) {
      fetchSubscriptions();
    } else {
      setIsFetching(false);
    }
  }, [email]);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("email_subscribers")
        .select("subscribed_to, is_active")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (error) throw error;

      if (data && data.is_active) {
        setCurrentSubscriptions(data.subscribed_to || []);
      } else if (data && !data.is_active) {
        setStatus("success");
        setCurrentSubscriptions([]);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const toggleSubscription = (subId: string) => {
    setSelectedToRemove(prev =>
      prev.includes(subId)
        ? prev.filter(s => s !== subId)
        : [...prev, subId]
    );
  };

  const handleUnsubscribe = async (unsubscribeAll: boolean = false) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("unsubscribe", {
        body: {
          email: email.toLowerCase(),
          subscriptions: unsubscribeAll ? undefined : selectedToRemove,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setStatus("success");
        toast({
          title: "Preferences Updated",
          description: unsubscribeAll 
            ? "You've been unsubscribed from all emails." 
            : "Your email preferences have been updated.",
        });
      } else {
        throw new Error(data?.error || "Failed to update preferences");
      }
    } catch (error) {
      console.error("Unsubscribe error:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update preferences",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              This unsubscribe link is missing required information.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-primary mb-4" />
            <CardTitle className="text-glow-primary">Preferences Updated</CardTitle>
            <CardDescription>
              Your email preferences have been saved successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {email}
            </p>
            <div className="flex justify-center gap-2">
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
              <Link to="/intelligence">
                <Button variant="default">
                  View Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <CardTitle>Something Went Wrong</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={() => setStatus("idle")}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <Mail className="w-12 h-12 mx-auto text-primary mb-4" />
          <CardTitle className="text-glow-primary">Email Preferences</CardTitle>
          <CardDescription>
            Manage your email subscriptions for <span className="text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentSubscriptions.length === 0 ? (
            <p className="text-center text-muted-foreground">
              You're not currently subscribed to any emails.
            </p>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select the emails you want to unsubscribe from:
                </p>
                {SUBSCRIPTION_OPTIONS.filter(opt => 
                  currentSubscriptions.includes(opt.id)
                ).map((option) => (
                  <div
                    key={option.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <Checkbox
                      id={option.id}
                      checked={selectedToRemove.includes(option.id)}
                      onCheckedChange={() => toggleSubscription(option.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={option.id} className="font-medium cursor-pointer">
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => handleUnsubscribe(false)}
                  disabled={isLoading || selectedToRemove.length === 0}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Unsubscribe from Selected
                </Button>
                
                <Button
                  onClick={() => handleUnsubscribe(true)}
                  disabled={isLoading}
                  variant="destructive"
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Unsubscribe from All
                </Button>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-border">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Back to Augurion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
