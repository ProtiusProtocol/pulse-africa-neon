import { Eye, TrendingUp, Shield, Globe, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header / Mission */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
            Our Mission
          </h1>
          <p className="text-xl text-muted-foreground">
            To observe how real-world outcomes evolve — and turn them into markets only when they are ready.
          </p>
          <div className="pt-4 space-y-3">
            <p className="text-lg text-muted-foreground">
              Modern markets react late. Decisions deserve earlier insight.
            </p>
            <p className="text-lg text-foreground font-medium">
              Augurion exists to track <span className="text-primary">outcome readiness</span>: the moment when probability meaningfully shifts.
            </p>
          </div>
        </div>

        {/* Our Approach */}
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="p-8 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border border-primary/30 rounded-lg space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center glow-primary">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Our Approach</h2>
            </div>

            <h3 className="text-xl font-bold text-primary">Outcome Intelligence, Powered by Signals</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-muted-foreground">We combine:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 text-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    Distributed human judgement
                  </li>
                  <li className="flex items-center gap-3 text-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    Structured data
                  </li>
                  <li className="flex items-center gap-3 text-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    Narrative interpretation
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground">To identify:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 text-foreground">
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                    Which outcomes are moving
                  </li>
                  <li className="flex items-center gap-3 text-foreground">
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                    Why they are moving
                  </li>
                  <li className="flex items-center gap-3 text-foreground">
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                    What scenarios are emerging
                  </li>
                  <li className="flex items-center gap-3 text-foreground">
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                    When an outcome nears decision-grade clarity
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-muted-foreground italic border-t border-border pt-4">
              Fragility signals help us understand why probability changes — but outcomes, not crises, are the focus.
            </p>
          </div>

          {/* Our Belief */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Our Belief</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-card border border-border rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary mb-2" />
                <p className="text-foreground font-medium">Probability moves before price</p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <Clock className="w-5 h-5 text-primary mb-2" />
                <p className="text-foreground font-medium">Information should precede speculation</p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <CheckCircle className="w-5 h-5 text-secondary mb-2" />
                <p className="text-foreground font-medium">Markets should be earned, not spammed</p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <Shield className="w-5 h-5 text-secondary mb-2" />
                <p className="text-foreground font-medium">Curation is a responsibility</p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <Shield className="w-5 h-5 text-accent mb-2" />
                <p className="text-foreground font-medium">Regulation is a moat</p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <Globe className="w-5 h-5 text-accent mb-2" />
                <p className="text-foreground font-medium">Africa deserves first-class outcome intelligence</p>
              </div>
            </div>

            <p className="text-muted-foreground text-center italic pt-4">
              We build quietly, publish clearly, and act only when justified.
            </p>
          </div>

          {/* Why Africa */}
          <div className="p-8 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 border border-accent/30 rounded-lg space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center glow-accent">
                <Globe className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Why Africa</h2>
            </div>

            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                Africa's most important outcomes — energy availability, policy reforms, fiscal direction, institutional coordination — shape possibility long before they become tradeable.
              </p>
              <p>
                Yet these shifts are rarely mapped in advance.
              </p>
              <p className="text-foreground font-medium">
                Augurion exists to fill that gap.
              </p>
              <p className="text-accent font-bold">
                We observe outcome movement where decisions are made, not where global headlines arrive late.
              </p>
            </div>
          </div>

          {/* How We Build Trust */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">How We Build Trust</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">We timestamp insight publicly.</p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">We explain what changed — and why.</p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg">
                <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">We reference our earlier signals calmly, without hype.</p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg">
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">We acknowledge when we're wrong.</p>
              </div>
            </div>

            <p className="text-foreground font-medium text-center pt-4">
              Credibility compounds through process, not prediction.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-20 space-y-6">
          <Link to="/early-access">
            <Button variant="neon" size="lg">
              Join Early Access
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
