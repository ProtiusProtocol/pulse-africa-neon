import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
const EarlyAccess = () => {
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    email: "",
    whatsapp: "",
    predictorType: ""
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.from('early_access_signups').insert({
        name: formData.name.trim(),
        country: formData.country.trim(),
        email: formData.email.trim().toLowerCase(),
        whatsapp: formData.whatsapp.trim(),
        predictor_type: formData.predictorType
      });
      if (error) throw error;

      // Send welcome email (don't block on this)
      supabase.functions.invoke('send-welcome-email', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase()
        }
      }).catch(console.error);
      toast({
        title: "Welcome to Augurion Africa! 🎉",
        description: "You're on the early access list. Check your email!"
      });
      setFormData({
        name: "",
        country: "",
        email: "",
        whatsapp: "",
        predictorType: ""
      });
    } catch (error: any) {
      toast({
        title: "Oops!",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold">
              <span className="text-primary text-glow-primary">Unlock</span> Early Access
            </h1>
            <p className="text-xl text-muted-foreground">Get the data in early. Predict better. </p>
            <div className="inline-block px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg text-sm font-bold text-accent">
              ⚡ Limited spots for launch predictors
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-card border border-border rounded-lg">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground font-bold">
                Full Name
              </Label>
              <Input id="name" type="text" required value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} className="bg-muted border-border focus:border-primary" placeholder="Your name" />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-foreground font-bold">
                Country
              </Label>
              <Input id="country" type="text" required value={formData.country} onChange={e => setFormData({
              ...formData,
              country: e.target.value
            })} className="bg-muted border-border focus:border-primary" placeholder="e.g., South Africa, Nigeria, Kenya" />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-bold">
                Email
              </Label>
              <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({
              ...formData,
              email: e.target.value
            })} className="bg-muted border-border focus:border-primary" placeholder="your@email.com" />
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-foreground font-bold">
                WhatsApp Number
                <span className="text-accent ml-2">(Most Important)</span>
              </Label>
              <Input id="whatsapp" type="tel" required value={formData.whatsapp} onChange={e => setFormData({
              ...formData,
              whatsapp: e.target.value
            })} className="bg-muted border-border focus:border-primary" placeholder="+27 123 456 789" />
            </div>

            {/* Predictor Type */}
            <div className="space-y-4">
              <Label className="text-foreground font-bold">What type of predictor are you?</Label>
              <RadioGroup value={formData.predictorType} onValueChange={value => setFormData({
              ...formData,
              predictorType: value
            })} className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer">
                  <RadioGroupItem value="political" id="political" />
                  <Label htmlFor="political" className="cursor-pointer flex-1">
                    Political Junkie
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer">
                  <RadioGroupItem value="gambler" id="gambler" />
                  <Label htmlFor="gambler" className="cursor-pointer flex-1">
                    Degenerate Gambler
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer">
                  <RadioGroupItem value="crypto" id="crypto" />
                  <Label htmlFor="crypto" className="cursor-pointer flex-1">
                    Crypto Degen
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer">
                  <RadioGroupItem value="analyst" id="analyst" />
                  <Label htmlFor="analyst" className="cursor-pointer flex-1">
                    Market Analyst
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer">
                  <RadioGroupItem value="curious" id="curious" />
                  <Label htmlFor="curious" className="cursor-pointer flex-1">
                    Just Curious
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Submit */}
            <Button type="submit" variant="neon" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Joining..." : "Unlock Early Access"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              We'll contact you on WhatsApp when we launch. No spam, promise.
            </p>
          </form>

          {/* Social Proof */}
          <div className="mt-12 text-center space-y-4">
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary text-glow-primary">500+</div>
                <div className="text-sm text-muted-foreground">On Waitlist</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary text-glow-secondary">15+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent text-glow-accent">$50K+</div>
                <div className="text-sm text-muted-foreground">Volume Ready</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default EarlyAccess;