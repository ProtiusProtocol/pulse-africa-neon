import { MarketCard } from "@/components/MarketCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const MARKETS_DATA = {
  "South Africa": [
    {
      title: "Will there be a cabinet reshuffle before 30 June 2025?",
      yes: 64,
      no: 36,
      volatility: "high" as const,
      endsIn: "23 days",
      trend: "up" as const,
      trendValue: 12,
    },
    {
      title: "Will the GNU coalition remain stable through 2025?",
      yes: 58,
      no: 42,
      volatility: "medium" as const,
      endsIn: "245 days",
      trend: "down" as const,
      trendValue: 3,
    },
    {
      title: "Will load-shedding end permanently by September 2026?",
      yes: 31,
      no: 69,
      volatility: "low" as const,
      endsIn: "180 days",
      trend: "down" as const,
      trendValue: 15,
    },
    {
      title: "Will the ANC retain majority coalition control in the 2027 general elections?",
      yes: 45,
      no: 55,
      volatility: "medium" as const,
      endsIn: "912 days",
      trend: "down" as const,
      trendValue: 8,
    },
  ],
  Nigeria: [
    {
      title: "Will the Naira fall below ₦2000 to USD by December 2025?",
      yes: 78,
      no: 22,
      volatility: "medium" as const,
      endsIn: "180 days",
      trend: "down" as const,
      trendValue: 5,
    },
    {
      title: "Will fuel subsidy be fully removed in 2025?",
      yes: 82,
      no: 18,
      volatility: "high" as const,
      endsIn: "120 days",
      trend: "up" as const,
      trendValue: 18,
    },
    {
      title: "Will a sitting minister resign over corruption charges?",
      yes: 55,
      no: 45,
      volatility: "high" as const,
      endsIn: "90 days",
      trend: "up" as const,
      trendValue: 22,
    },
  ],
  Kenya: [
    {
      title: "Will the government survive a no-confidence vote in 2025?",
      yes: 42,
      no: 58,
      volatility: "high" as const,
      endsIn: "89 days",
      trend: "up" as const,
      trendValue: 8,
    },
    {
      title: "Will fuel prices exceed KSh 300/litre by mid-2025?",
      yes: 67,
      no: 33,
      volatility: "medium" as const,
      endsIn: "150 days",
      trend: "up" as const,
      trendValue: 11,
    },
    {
      title: "Will opposition parties form a formal coalition before elections?",
      yes: 72,
      no: 28,
      volatility: "low" as const,
      endsIn: "200 days",
      trend: "up" as const,
      trendValue: 6,
    },
  ],
};

const Markets = () => {
  const [selectedCountry, setSelectedCountry] = useState<keyof typeof MARKETS_DATA>("South Africa");
  const countries = Object.keys(MARKETS_DATA) as (keyof typeof MARKETS_DATA)[];

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-6">
          <h1 className="text-4xl lg:text-6xl font-bold">
            <span className="text-primary text-glow-primary">Live Political Arena</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Real-time prediction markets on Africa's biggest political events
          </p>
        </div>

        {/* Country Filter */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {countries.map((country) => (
            <Button
              key={country}
              variant={selectedCountry === country ? "neon" : "hero"}
              size="lg"
              onClick={() => setSelectedCountry(country)}
            >
              {country}
            </Button>
          ))}
        </div>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MARKETS_DATA[selectedCountry].map((market, index) => (
            <div
              key={index}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <MarketCard {...market} />
            </div>
          ))}
        </div>

        {/* Stats Banner */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-card border border-border rounded-lg text-center space-y-2 hover:border-primary/50 transition-all glow-primary">
            <div className="text-4xl font-bold text-primary text-glow-primary">24/7</div>
            <div className="text-muted-foreground">Markets Never Sleep</div>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg text-center space-y-2 hover:border-secondary/50 transition-all glow-secondary">
            <div className="text-4xl font-bold text-secondary text-glow-secondary">100+</div>
            <div className="text-muted-foreground">Active Events</div>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg text-center space-y-2 hover:border-accent/50 transition-all glow-accent">
            <div className="text-4xl font-bold text-accent text-glow-accent">Instant</div>
            <div className="text-muted-foreground">On-Chain Settlement</div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mt-20 text-center space-y-4 p-8 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border border-primary/30 rounded-lg">
          <h2 className="text-2xl font-bold text-foreground">More Countries Coming Soon</h2>
          <p className="text-muted-foreground">
            Ghana • Tanzania • Uganda • Zimbabwe • Ethiopia • Egypt
          </p>
        </div>
      </div>
    </div>
  );
};

export default Markets;
