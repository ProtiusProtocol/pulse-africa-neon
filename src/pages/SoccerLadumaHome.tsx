import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp, Users, Target } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const SoccerLadumaHome = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(0,84%,15%)] via-[hsl(0,84%,10%)] to-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full border-4 border-white" />
          <div className="absolute top-40 right-20 w-48 h-48 rounded-full border-4 border-white" />
          <div className="absolute bottom-20 left-1/3 w-24 h-24 rounded-full border-4 border-white" />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(45,100%,50%)]/20 rounded-full mb-6">
            <span className="text-[hsl(45,100%,50%)] font-bold text-sm">⚽ NEW</span>
            <span className="text-white/80 text-sm">Predict & Win Weekly Prizes</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
            SOCCER LADUMA
            <span className="block text-[hsl(45,100%,50%)]">PREDICTIONS</span>
          </h1>
          
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Compete against thousands of fans. Make your predictions on PSL, AFCON, 
            Premier League and more. Climb the leaderboard and prove you know your football!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-[hsl(0,84%,50%)] hover:bg-[hsl(0,84%,45%)] text-white text-lg px-8 py-6"
              onClick={() => navigate("/soccer-laduma/markets")}
            >
              Start Predicting Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6"
            >
              View Leaderboard
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-background/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 bg-card border-[hsl(0,84%,50%)]/20 hover:border-[hsl(0,84%,50%)]/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[hsl(0,84%,50%)]/20 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-[hsl(0,84%,50%)]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">1. Pick Your Matches</h3>
              <p className="text-muted-foreground">
                Browse upcoming fixtures from PSL, AFCON, Premier League, and more. 
                Select the outcomes you believe will happen.
              </p>
            </Card>
            
            <Card className="p-6 bg-card border-[hsl(45,100%,50%)]/20 hover:border-[hsl(45,100%,50%)]/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[hsl(45,100%,50%)]/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-[hsl(45,100%,50%)]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">2. Make Your Predictions</h3>
              <p className="text-muted-foreground">
                Predict YES or NO on match outcomes. The earlier you predict, 
                the more points you can earn if you're right!
              </p>
            </Card>
            
            <Card className="p-6 bg-card border-[hsl(0,84%,50%)]/20 hover:border-[hsl(0,84%,50%)]/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[hsl(0,84%,50%)]/20 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-[hsl(0,84%,50%)]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">3. Win & Climb</h3>
              <p className="text-muted-foreground">
                Earn points for correct predictions. Compete on weekly and 
                all-time leaderboards. Top predictors win prizes!
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-black text-[hsl(0,84%,50%)]">50+</div>
              <div className="text-muted-foreground">Active Markets</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-[hsl(45,100%,50%)]">1K+</div>
              <div className="text-muted-foreground">Weekly Predictions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-[hsl(0,84%,50%)]">R10K</div>
              <div className="text-muted-foreground">Monthly Prizes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-[hsl(45,100%,50%)]">FREE</div>
              <div className="text-muted-foreground">To Play</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-[hsl(0,84%,25%)] to-[hsl(0,84%,35%)]">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Prove Your Football Knowledge?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Join thousands of South African football fans making predictions every week.
          </p>
          <Button 
            size="lg" 
            className="bg-[hsl(45,100%,50%)] hover:bg-[hsl(45,100%,45%)] text-black font-bold text-lg px-10 py-6"
          >
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer note */}
      <div className="py-6 px-4 text-center border-t border-border">
        <p className="text-sm text-muted-foreground">
          Powered by <Link to="/" className="text-primary hover:underline">Augurion</Link> prediction infrastructure
        </p>
      </div>
    </div>
  );
};

export default SoccerLadumaHome;
