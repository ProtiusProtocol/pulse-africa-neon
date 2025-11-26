import { Button } from "@/components/ui/button";
import { Ticker } from "@/components/Ticker";
import { MarketCard } from "@/components/MarketCard";
import { TrendingUp, Zap, Shield, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const FEATURED_MARKETS = [
  {
    title: "Will South Africa have a cabinet reshuffle before 30 June 2025?",
    yes: 64,
    no: 36,
    volatility: "high" as const,
    endsIn: "23 days",
    trend: "up" as const,
    trendValue: 12,
  },
  {
    title: "Will the Nigerian Naira fall below ₦2000 to USD by Dec 2025?",
    yes: 78,
    no: 22,
    volatility: "medium" as const,
    endsIn: "180 days",
    trend: "down" as const,
    trendValue: 5,
  },
  {
    title: "Will Kenya's government survive a no-confidence vote in 2025?",
    yes: 42,
    no: 58,
    volatility: "high" as const,
    endsIn: "89 days",
    trend: "up" as const,
    trendValue: 8,
  },
];

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
              <Zap className="inline w-4 h-4 mr-2" />
              AFRICA'S FIRST POLITICAL PREDICTION MARKET
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight animate-slide-up">
              <span className="text-primary text-glow-primary">Trade the Pulse</span>
              <br />
              <span className="text-foreground">of African Politics</span>
            </h1>

            <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto animate-slide-up animation-delay-200">
              Elections. Coalitions. Scandals. Reshuffles.
              <br />
              <span className="text-accent font-bold">Predict it all — live.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-slide-up animation-delay-400">
              <Link to="/early-access">
                <Button variant="neon" size="lg" className="w-full sm:w-auto">
                  Join Early Access Beta
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  Learn How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Ticker */}
      <Ticker />

      {/* Featured Markets */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              <span className="text-primary text-glow-primary">Hot Markets</span> Right Now
            </h2>
            <p className="text-lg text-muted-foreground">
              Real-time predictions on Africa's biggest political events
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_MARKETS.map((market, index) => (
              <div
                key={index}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <MarketCard {...market} />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/markets">
              <Button variant="hero" size="lg">
                View All Markets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6 rounded-lg border border-border hover:border-primary/50 transition-all group">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center glow-primary group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Live Markets</h3>
              <p className="text-muted-foreground">
                Prices update in real-time as Africa reacts. Trade 24/7.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg border border-border hover:border-secondary/50 transition-all group">
              <div className="w-16 h-16 mx-auto bg-secondary/10 rounded-full flex items-center justify-center glow-secondary group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold">On-Chain Settlement</h3>
              <p className="text-muted-foreground">
                Smart contracts handle payouts automatically. No middlemen.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg border border-border hover:border-accent/50 transition-all group">
              <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center glow-accent group-hover:scale-110 transition-transform">
                <Globe className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold">Pan-African Coverage</h3>
              <p className="text-muted-foreground">
                From Lagos to Nairobi. Cape Town to Cairo. All of Africa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6 p-8 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 glow-primary">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Ready to <span className="text-primary text-glow-primary">Predict the Future?</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Get early access to Africa's most exciting prediction market.
              <br />
              Limited spots available for launch predictors.
            </p>
            <Link to="/early-access">
              <Button variant="neon" size="lg">
                Unlock Early Access
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
