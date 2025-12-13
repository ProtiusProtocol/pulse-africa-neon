import { Button } from "@/components/ui/button";
import { Eye, Layers, CheckCircle, Shield, Clock, Filter, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <h1 className="text-4xl lg:text-6xl font-bold">
            <span className="text-foreground">Two Layers.</span>{" "}
            <span className="text-primary text-glow-primary">One System.</span>
          </h1>
        </div>

        {/* Layer 1 */}
        <div className="max-w-5xl mx-auto space-y-20">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center glow-primary">
                <Eye className="w-8 h-8 text-primary" />
              </div>
              <div>
                <div className="text-sm text-primary font-bold uppercase tracking-wider">Layer 1</div>
                <h2 className="text-3xl font-bold text-foreground">Pre-Market Outcome Intelligence</h2>
                <div className="inline-block mt-2 px-3 py-1 bg-primary/20 text-primary text-sm font-bold rounded-full">
                  Live Now
                </div>
              </div>
            </div>

            <p className="text-xl text-muted-foreground">
              We track how outcomes become more or less likely over time.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-card border border-primary/30 rounded-lg space-y-4">
                <h3 className="font-bold text-foreground text-lg">Inputs</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    Crowd signals
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    User observations
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    Data streams
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    Founder-led analysis
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-card border border-secondary/30 rounded-lg space-y-4">
                <h3 className="font-bold text-foreground text-lg">Outputs</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                    Outcome Watchlists
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                    Probability Drift Maps
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                    Scenario Trees
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                    Readiness Levels
                  </li>
                </ul>
              </div>
            </div>

            {/* Outcome Readiness Scale */}
            <div className="p-8 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border border-border rounded-lg">
              <h3 className="font-bold text-foreground text-xl mb-6">Outcome Readiness Scale</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-card border border-border rounded-lg text-center space-y-2">
                  <div className="w-10 h-10 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Stage 1</div>
                  <div className="font-bold text-foreground">Watch</div>
                  <p className="text-xs text-muted-foreground">Movement detected</p>
                </div>

                <div className="p-4 bg-card border border-primary/20 rounded-lg text-center space-y-2">
                  <div className="w-10 h-10 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-xs text-primary uppercase tracking-wider">Stage 2</div>
                  <div className="font-bold text-foreground">Approaching</div>
                  <p className="text-xs text-muted-foreground">Consistent drift</p>
                </div>

                <div className="p-4 bg-card border border-secondary/20 rounded-lg text-center space-y-2">
                  <div className="w-10 h-10 mx-auto bg-secondary/10 rounded-full flex items-center justify-center">
                    <Filter className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="text-xs text-secondary uppercase tracking-wider">Stage 3</div>
                  <div className="font-bold text-foreground">Defined</div>
                  <p className="text-xs text-muted-foreground">Clear outcome boundaries</p>
                </div>

                <div className="p-4 bg-card border border-accent/30 rounded-lg text-center space-y-2 glow-accent">
                  <div className="w-10 h-10 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-xs text-accent uppercase tracking-wider">Stage 4</div>
                  <div className="font-bold text-foreground">Tradeable</div>
                  <p className="text-xs text-muted-foreground">Ready for regulated listing</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-6 text-center italic">
                Only outcomes reaching Stage 4 are eligible for Layer 2.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="flex justify-center">
            <div className="h-20 w-px bg-gradient-to-b from-primary via-secondary to-accent animate-pulse-glow" />
          </div>

          {/* Layer 2 */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center glow-secondary">
                <Layers className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <div className="text-sm text-secondary font-bold uppercase tracking-wider">Layer 2</div>
                <h2 className="text-3xl font-bold text-foreground">Regulated Outcome Markets</h2>
                <div className="inline-block mt-2 px-3 py-1 bg-secondary/20 text-secondary text-sm font-bold rounded-full">
                  Launching Later
                </div>
              </div>
            </div>

            <p className="text-xl text-muted-foreground">
              When an outcome meets our strict criteria:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-card border border-secondary/30 rounded-lg text-center">
                <CheckCircle className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className="text-foreground font-medium">Clear definition</p>
              </div>
              <div className="p-4 bg-card border border-secondary/30 rounded-lg text-center">
                <CheckCircle className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className="text-foreground font-medium">Objective settlement</p>
              </div>
              <div className="p-4 bg-card border border-secondary/30 rounded-lg text-center">
                <CheckCircle className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className="text-foreground font-medium">Institutional determination</p>
              </div>
              <div className="p-4 bg-card border border-secondary/30 rounded-lg text-center">
                <CheckCircle className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className="text-foreground font-medium">Orthogonality</p>
                <p className="text-xs text-muted-foreground mt-1">(market cannot influence reality)</p>
              </div>
            </div>

            <p className="text-xl text-foreground font-medium">
              We activate a selective binary market.
            </p>

            <div className="p-6 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground mb-4">These are:</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-full text-secondary font-medium">
                  Carefully curated
                </span>
                <span className="px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-full text-secondary font-medium">
                  Regulated
                </span>
                <span className="px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-full text-secondary font-medium">
                  Boring by design
                </span>
                <span className="px-4 py-2 bg-accent/10 border border-accent/30 rounded-full text-accent font-medium">
                  Useful for decision-makers and traders
                </span>
              </div>
            </div>

            <p className="text-lg text-accent font-bold">
              Layer 2 follows Layer 1 — never the reverse.
            </p>
          </div>

          {/* Why This Architecture Works */}
          <div className="p-8 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border border-border rounded-lg space-y-6">
            <h3 className="text-2xl font-bold text-foreground">Why This Architecture Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">Keeps analysis honest</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">Removes hype bias</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">Prevents market manipulation</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-secondary flex-shrink-0" />
                <span className="text-muted-foreground">Protects regulatory posture</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-secondary flex-shrink-0" />
                <span className="text-muted-foreground">Allows credibility to accumulate</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-muted-foreground">Creates a durable long-term moat</span>
              </div>
            </div>

            <div className="pt-6 border-t border-border space-y-2">
              <p className="text-foreground font-medium">Augurion is not a crisis platform.</p>
              <p className="text-primary font-bold">It is an outcome-movement platform with a selective trading layer.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
