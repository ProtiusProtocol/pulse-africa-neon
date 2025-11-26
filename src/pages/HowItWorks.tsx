import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Coins } from "lucide-react";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <h1 className="text-4xl lg:text-6xl font-bold">
            <span className="text-primary text-glow-primary">Simple.</span>
            <span className="text-secondary text-glow-secondary"> Crypto.</span>
            <span className="text-accent text-glow-accent"> Fast.</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Trade political events like stocks. Get paid automatically when you're right.
          </p>
        </div>

        {/* 3-Step Process */}
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Step 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="lg:w-1/3">
              <div className="relative">
                <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center glow-primary animate-pulse-glow">
                  <Target className="w-16 h-16 text-primary" />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl glow-primary">
                  1
                </div>
              </div>
            </div>
            <div className="lg:w-2/3 space-y-4 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-foreground">Pick an Event</h2>
              <p className="text-lg text-muted-foreground">
                Browse live markets on African politics, economics, scandals, reshuffles, and more.
                Every event has a YES or NO outcome.
              </p>
              <div className="inline-block px-4 py-2 bg-card border border-primary/30 rounded-lg text-sm font-bold text-primary">
                Example: "Will Nigeria's Naira fall below ₦2000 by December?"
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex justify-center">
            <div className="h-16 w-px bg-gradient-to-b from-primary via-secondary to-accent animate-pulse-glow" />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-12">
            <div className="lg:w-1/3">
              <div className="relative">
                <div className="w-32 h-32 mx-auto bg-secondary/10 rounded-full flex items-center justify-center glow-secondary animate-pulse-glow">
                  <TrendingUp className="w-16 h-16 text-secondary" />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center font-bold text-xl glow-secondary">
                  2
                </div>
              </div>
            </div>
            <div className="lg:w-2/3 space-y-4 text-center lg:text-right">
              <h2 className="text-3xl font-bold text-foreground">Predict YES/NO</h2>
              <p className="text-lg text-muted-foreground">
                Buy YES shares if you think it'll happen. Buy NO if you don't. Prices move
                instantly as thousands of Africans trade their predictions.
              </p>
              <div className="inline-block px-4 py-2 bg-card border border-secondary/30 rounded-lg text-sm font-bold text-secondary">
                Live AMM pricing • Your profit = how right you are
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex justify-center">
            <div className="h-16 w-px bg-gradient-to-b from-secondary via-accent to-primary animate-pulse-glow" />
          </div>

          {/* Step 3 */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="lg:w-1/3">
              <div className="relative">
                <div className="w-32 h-32 mx-auto bg-accent/10 rounded-full flex items-center justify-center glow-accent animate-pulse-glow">
                  <Coins className="w-16 h-16 text-accent" />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold text-xl glow-accent">
                  3
                </div>
              </div>
            </div>
            <div className="lg:w-2/3 space-y-4 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-foreground">Get Paid Automatically</h2>
              <p className="text-lg text-muted-foreground">
                When the event resolves, smart contracts pay out winners instantly. No waiting. No
                disputes. Just pure, trustless settlement.
              </p>
              <div className="inline-block px-4 py-2 bg-card border border-accent/30 rounded-lg text-sm font-bold text-accent">
                On-chain oracles verify results • Payouts in seconds
              </div>
            </div>
          </div>
        </div>

        {/* Visual Extras */}
        <div className="max-w-5xl mx-auto mt-20 p-8 bg-card border border-border rounded-lg">
          <h3 className="text-2xl font-bold text-center mb-8">How Prices Move</h3>
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Augurion uses an <span className="text-primary font-bold">Automated Market Maker (AMM)</span> 
              — the same tech behind crypto's biggest DEXs.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg">
                <span className="text-primary font-bold">More YES buyers</span> → Price ↑
              </div>
              <span className="text-2xl text-muted-foreground">•</span>
              <div className="px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-lg">
                <span className="text-secondary font-bold">More NO buyers</span> → Price ↓
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto pt-4">
              Your profit depends on when you enter and exit. Early predictors take more risk but can earn more.
              The market finds the truth through the wisdom of the crowd.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-20">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">
              Ready to <span className="text-primary text-glow-primary">Start Predicting?</span>
            </h2>
            <Link to="/early-access">
              <Button variant="neon" size="lg">
                Join the Beta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
