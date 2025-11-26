import { Shield, Zap, Globe, Lock, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <h1 className="text-4xl lg:text-6xl font-bold">
            <span className="text-primary text-glow-primary">Crypto</span> Meets{" "}
            <span className="text-accent text-glow-accent">Africa</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            The first on-chain prediction market built for Africa's political energy
          </p>
        </div>

        {/* Mission Blocks */}
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Built for Africa */}
          <div className="p-8 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border border-primary/30 rounded-lg glow-primary">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 glow-primary">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">Built for Africa's Energy</h2>
                <p className="text-muted-foreground text-lg">
                  Africa's politics move fast — elections swing, coalitions shift, scandals break.
                  Augurion lets you trade these moments in real-time, turning political insight into
                  tangible value. This is a new way to engage with the continent's most dynamic
                  stories.
                </p>
              </div>
            </div>
          </div>

          {/* Trustless Settlement */}
          <div className="p-8 bg-gradient-to-br from-secondary/5 via-transparent to-accent/5 border border-secondary/30 rounded-lg glow-secondary">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0 glow-secondary">
                <Shield className="w-6 h-6 text-secondary" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">Trustless Settlement</h2>
                <p className="text-muted-foreground text-lg">
                  Smart contracts handle all payouts automatically. No middlemen. No delays. When an
                  event resolves, winners get paid instantly on-chain. The code is the arbiter, not a
                  bookmaker.
                </p>
              </div>
            </div>
          </div>

          {/* Clear Oracles */}
          <div className="p-8 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 border border-accent/30 rounded-lg glow-accent">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 glow-accent">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">Clear Oracles</h2>
                <p className="text-muted-foreground text-lg">
                  Results come from verified sources: Independent Electoral Commissions, courts,
                  official government announcements. Every market resolution is transparent and
                  auditable. No room for manipulation.
                </p>
              </div>
            </div>
          </div>

          {/* Identity Privacy */}
          <div className="p-8 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border border-primary/30 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">Your Identity Stays Yours</h2>
                <p className="text-muted-foreground text-lg">
                  No KYC for proof of concept. Optional crypto wallet login. We believe in privacy
                  and permissionless access. Your political predictions are your business.
                </p>
              </div>
            </div>
          </div>

          {/* Fast Global */}
          <div className="p-8 bg-gradient-to-br from-secondary/5 via-transparent to-accent/5 border border-secondary/30 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">Fast, Global, Unstoppable</h2>
                <p className="text-muted-foreground text-lg">
                  Internet + mobile = full access. Trade from anywhere on the continent. Markets
                  never close. Predictions never sleep. This is 24/7 political futures.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Trust Signals */}
        <div className="max-w-5xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-card border border-border rounded-lg text-center space-y-3 hover:border-primary/50 transition-all">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center glow-primary">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">On-Chain Proof</h3>
            <p className="text-sm text-muted-foreground">
              Every trade, every outcome, every payout is verifiable on the blockchain.
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg text-center space-y-3 hover:border-secondary/50 transition-all">
            <div className="w-16 h-16 mx-auto bg-secondary/10 rounded-full flex items-center justify-center glow-secondary">
              <Zap className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="font-bold text-foreground">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Trades settle in seconds. Instant price updates. Real-time market reactions.
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg text-center space-y-3 hover:border-accent/50 transition-all">
            <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center glow-accent">
              <Users className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-bold text-foreground">Community Driven</h3>
            <p className="text-sm text-muted-foreground">
              Markets find truth through collective intelligence. The crowd knows.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-20 space-y-6">
          <h2 className="text-3xl font-bold">
            Ready to <span className="text-primary text-glow-primary">Join the Movement?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Be part of Africa's first generation of political predictors.
          </p>
          <Link to="/early-access">
            <Button variant="neon" size="lg">
              Get Early Access
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
