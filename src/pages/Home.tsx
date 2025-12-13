import { Button } from "@/components/ui/button";
import { Eye, Layers, Target, Globe, Filter, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow animation-delay-1000" />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block px-4 py-2 bg-card border border-primary/30 rounded-full text-sm font-bold text-primary glow-primary animate-slide-down">
              AFRICA'S FIRST PREDICTION MARKET
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight animate-slide-up">
              <span className="text-primary text-glow-primary">Outcome Intelligence.</span>
              <br />
              <span className="text-foreground">Before Markets Move.</span>
            </h1>

            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto animate-slide-up animation-delay-200">
              Augurion tracks how real world fragilities are changing and then turns them into signals for the market.
            </p>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up animation-delay-300">
              A pre-market outcome intelligence platform powered by crowd signals, structured data, and disciplined interpretation.
            </p>

            <div className="flex flex-wrap gap-3 justify-center pt-2 animate-slide-up animation-delay-400">
              <span className="px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-sm font-bold text-primary">
                Africa-first
              </span>
              <span className="px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-full text-sm font-bold text-secondary">
                Outcome-first
              </span>
              <span className="px-4 py-2 bg-accent/10 border border-accent/30 rounded-full text-sm font-bold text-accent">
                Regulation-aligned
              </span>
            </div>

            <div className="pt-6 animate-slide-up animation-delay-500">
              <Link to="/early-access">
                <Button variant="neon" size="lg">
                  Get Early Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Augurion Exists */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold">
              <span className="text-primary text-glow-primary">Outcomes shift quietly.</span>
              <br />
              <span className="text-foreground">We make the movement visible.</span>
            </h2>

            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                Most outcomes — policy changes, infrastructure delivery, energy availability — don't arrive suddenly.
                <br />
                <span className="text-foreground font-medium">They become likely gradually.</span>
              </p>

              <p>
                Augurion observes how probability drifts before events harden into headlines or market prices.
              </p>

              <div className="pt-4 space-y-2">
                <p className="text-foreground font-bold">We don't predict the future.</p>
                <p className="text-accent font-bold">We detect when outcomes begin to move.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Layers, One Discipline */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">
              <span className="text-foreground">Two Layers,</span>{" "}
              <span className="text-primary text-glow-primary">One Discipline</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Layer 1 */}
            <div className="p-8 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border border-primary/30 rounded-lg glow-primary">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center glow-primary">
                    <Eye className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-primary font-bold uppercase tracking-wider">Layer 1</div>
                    <h3 className="text-xl font-bold text-foreground">Outcome Intelligence</h3>
                  </div>
                </div>

                <div className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm font-bold rounded-full">
                  Live Now
                </div>

                <div className="space-y-4">
                  <p className="text-muted-foreground">We aggregate:</p>
                  <ul className="space-y-2 text-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      Crowd-sourced signals
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      Structured data
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      Founder-led interpretation
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <p className="text-muted-foreground">To surface:</p>
                  <ul className="space-y-2 text-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                      Outcomes becoming more likely
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                      Outcomes becoming less likely
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                      Emerging shifts worth monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                      Decision-grade readiness levels
                    </li>
                  </ul>
                </div>

                <p className="text-sm text-muted-foreground italic border-t border-border pt-4">
                  Layer 1 is not a market. It is a probability-movement engine.
                </p>
              </div>
            </div>

            {/* Layer 2 */}
            <div className="p-8 bg-gradient-to-br from-secondary/5 via-transparent to-accent/5 border border-secondary/30 rounded-lg glow-secondary">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center glow-secondary">
                    <Layers className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <div className="text-xs text-secondary font-bold uppercase tracking-wider">Layer 2</div>
                    <h3 className="text-xl font-bold text-foreground">Selective Outcome Markets</h3>
                  </div>
                </div>

                <div className="inline-block px-3 py-1 bg-secondary/20 text-secondary text-sm font-bold rounded-full">
                  Launching Later
                </div>

                <div className="space-y-4">
                  <p className="text-muted-foreground">When an outcome becomes:</p>
                  <ul className="space-y-2 text-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                      Clearly defined
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                      Institutionally determined
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                      Objectively settleable
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                      Causally independent of traders
                    </li>
                  </ul>
                </div>

                <p className="text-foreground font-medium">
                  —we activate a regulated binary market.
                </p>

                <p className="text-accent font-bold">Not before.</p>

                <p className="text-sm text-muted-foreground italic border-t border-border pt-4">
                  Layer 2 is a precision trading layer, downstream of insight — never the driver of it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Augurion Different */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">
              <span className="text-foreground">What Makes Augurion</span>{" "}
              <span className="text-primary text-glow-primary">Different</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">Outcome-first, not crisis-first.</h3>
                  <p className="text-muted-foreground">
                    We focus on how outcomes evolve, not dramatic events.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg hover:border-secondary/50 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Filter className="w-6 h-6 text-secondary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">Curation over noise.</h3>
                  <p className="text-muted-foreground">
                    Only outcomes that pass readiness criteria advance to markets.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg hover:border-accent/50 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">Orthogonality as a rule.</h3>
                  <p className="text-muted-foreground">
                    Markets cannot influence outcomes — ever.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">Africa, with global standards.</h3>
                  <p className="text-muted-foreground">
                    We start where uncertainty is highest and clarity is most needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6 p-8 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 glow-primary">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              Be part of the first cohort building the world's outcome-intelligence layer for Africa.
            </h2>
            <Link to="/early-access">
              <Button variant="neon" size="lg">
                Join Early Access
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
