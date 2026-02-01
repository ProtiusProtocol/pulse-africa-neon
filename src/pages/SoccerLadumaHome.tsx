import { Button } from "@/components/ui/button";
import { Eye, Layers, Target, Trophy, TrendingUp, Users, Zap, BarChart3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const SoccerLadumaHome = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-20 lg:py-32 bg-gradient-to-b from-[hsl(0,84%,15%)] via-[hsl(0,84%,10%)] to-background">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full border-4 border-white" />
          <div className="absolute top-40 right-20 w-48 h-48 rounded-full border-4 border-white" />
          <div className="absolute bottom-20 left-1/3 w-24 h-24 rounded-full border-4 border-white" />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <div className="inline-block px-3 sm:px-4 py-2 bg-[hsl(45,100%,50%)]/20 border border-[hsl(45,100%,50%)]/30 rounded-full text-xs sm:text-sm font-bold text-[hsl(45,100%,50%)]">
              ⚽ SOUTH AFRICA'S FOOTBALL PREDICTION GAME
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight text-white">
              <span className="text-[hsl(45,100%,50%)]">Predict. Compete. Win.</span>
              <br />
              <span className="text-white">Prove Your Football Knowledge</span>
            </h1>

            <p className="text-sm sm:text-xl lg:text-2xl text-white/70 max-w-3xl mx-auto px-2">
              Make predictions on PSL, AFCON, Premier League and more. 
              Climb the leaderboard and win weekly prizes!
            </p>

            <p className="text-xs sm:text-lg text-white/60 max-w-2xl mx-auto px-2">
              Powered by real-time intelligence signals that track how match outcomes become likely.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 justify-center">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-[hsl(0,84%,50%)] hover:bg-[hsl(0,84%,45%)] text-white text-lg px-8 py-6"
                onClick={() => navigate("/soccer-laduma/markets")}
              >
                Start Predicting Free
              </Button>
              <Link to="/soccer-laduma/intelligence">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto border-[hsl(45,100%,50%)]/50 text-[hsl(45,100%,50%)] hover:bg-[hsl(45,100%,50%)]/10 text-lg px-8 py-6"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  View Match Signals
                </Button>
              </Link>
            </div>
            
            <div className="pt-4">
              <Link to="/soccer-laduma/dashboard">
                <Button 
                  variant="link" 
                  className="text-white/60 hover:text-white"
                >
                  Already playing? View Dashboard →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Soccer Laduma Predictions */}
      <section className="py-12 sm:py-20 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              <span className="text-[hsl(0,84%,50%)]">Match outcomes shift quietly.</span>
              <br />
              <span className="text-foreground">We make their movement visible.</span>
            </h2>

            <div className="space-y-4 sm:space-y-6 text-base sm:text-lg text-muted-foreground px-2">
              <p>
                Team form, injuries, momentum — these signals change before the final whistle.
                <br className="hidden sm:block" />
                <span className="text-foreground font-medium">Great predictors spot the patterns early.</span>
              </p>

              <p>
                Soccer Laduma Predictions gives you the tools to track probability shifts across football outcomes.
              </p>

              <div className="pt-4 space-y-2">
                <p className="text-foreground font-bold">We don't guess results.</p>
                <p className="text-[hsl(45,100%,40%)] font-bold">We track signals that make outcomes more likely.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Layers: Intelligence + Predictions */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              <span className="text-foreground">Two Layers,</span>{" "}
              <span className="text-[hsl(0,84%,50%)]">One Advantage</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Layer 1: Signal Intelligence */}
            <div className="p-5 sm:p-8 bg-gradient-to-br from-[hsl(0,84%,50%)]/10 via-transparent to-[hsl(45,100%,50%)]/10 border border-[hsl(0,84%,50%)]/30 rounded-lg">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-[hsl(0,84%,50%)]/10 rounded-full flex items-center justify-center">
                    <Eye className="w-5 sm:w-6 h-5 sm:h-6 text-[hsl(0,84%,50%)]" />
                  </div>
                  <div>
                    <div className="text-xs text-[hsl(0,84%,50%)] font-bold uppercase tracking-wider">Layer 1</div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">Match Intelligence</h3>
                  </div>
                </div>

                <div className="inline-block px-3 py-1 bg-[hsl(0,84%,50%)]/20 text-[hsl(0,84%,50%)] text-xs sm:text-sm font-bold rounded-full">
                  Live Now
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base text-muted-foreground">We track:</p>
                  <ul className="space-y-2 text-sm sm:text-base text-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[hsl(0,84%,50%)] rounded-full flex-shrink-0" />
                      Team form & momentum signals
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[hsl(0,84%,50%)] rounded-full flex-shrink-0" />
                      Injury & squad updates
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[hsl(0,84%,50%)] rounded-full flex-shrink-0" />
                      Head-to-head patterns
                    </li>
                  </ul>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base text-muted-foreground">To surface:</p>
                  <ul className="space-y-2 text-sm sm:text-base text-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[hsl(45,100%,50%)] rounded-full flex-shrink-0" />
                      Which outcomes are becoming likely
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[hsl(45,100%,50%)] rounded-full flex-shrink-0" />
                      Where the crowd is wrong
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[hsl(45,100%,50%)] rounded-full flex-shrink-0" />
                      Early-mover advantages
                    </li>
                  </ul>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground italic border-t border-border pt-4">
                  Layer 1 gives you the edge. Intelligence before you predict.
                </p>
              </div>
            </div>

            {/* Layer 2: Prediction Game */}
            <div className="p-5 sm:p-8 bg-gradient-to-br from-[hsl(45,100%,50%)]/10 via-transparent to-[hsl(0,84%,50%)]/10 border border-[hsl(45,100%,50%)]/30 rounded-lg">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-[hsl(45,100%,50%)]/10 rounded-full flex items-center justify-center">
                    <Layers className="w-5 sm:w-6 h-5 sm:h-6 text-[hsl(45,100%,50%)]" />
                  </div>
                  <div>
                    <div className="text-xs text-[hsl(45,100%,50%)] font-bold uppercase tracking-wider">Layer 2</div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">Prediction Markets</h3>
                  </div>
                </div>

                <div className="inline-block px-3 py-1 bg-[hsl(45,100%,50%)]/20 text-[hsl(45,100%,40%)] text-xs sm:text-sm font-bold rounded-full">
                  Free to Play
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base text-muted-foreground">Make predictions on:</p>
                  <ul className="space-y-2 text-sm sm:text-base text-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[hsl(45,100%,50%)] rounded-full flex-shrink-0" />
                      PSL match outcomes
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[hsl(45,100%,50%)] rounded-full flex-shrink-0" />
                      AFCON tournament results
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[hsl(45,100%,50%)] rounded-full flex-shrink-0" />
                      Premier League & Champions League
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[hsl(45,100%,50%)] rounded-full flex-shrink-0" />
                      Season-long outcomes
                    </li>
                  </ul>
                </div>

                <p className="text-sm sm:text-base text-foreground font-medium">Earn points for correct predictions. Climb the leaderboard. Win prizes!</p>

                <p className="text-[hsl(0,84%,50%)] font-bold">No money required. Just knowledge.</p>

                <p className="text-xs sm:text-sm text-muted-foreground italic border-t border-border pt-4">
                  Layer 2 is where you prove what you know.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-12 sm:py-20 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              <span className="text-foreground">What Makes Us</span>{" "}
              <span className="text-[hsl(0,84%,50%)]">Different</span>
            </h2>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div className="p-4 sm:p-6 bg-card border border-border rounded-lg hover:border-[hsl(0,84%,50%)]/50 transition-all group">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-[hsl(0,84%,50%)]/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Target className="w-5 sm:w-6 h-5 sm:h-6 text-[hsl(0,84%,50%)]" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <h3 className="font-bold text-foreground text-sm sm:text-base">Signal-first predictions.</h3>
                  <p className="text-xs sm:text-base text-muted-foreground">
                    We show you why outcomes are shifting, not just what the crowd thinks.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-card border border-border rounded-lg hover:border-[hsl(45,100%,50%)]/50 transition-all group">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-[hsl(45,100%,50%)]/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Trophy className="w-5 sm:w-6 h-5 sm:h-6 text-[hsl(45,100%,50%)]" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <h3 className="font-bold text-foreground text-sm sm:text-base">Compete for glory.</h3>
                  <p className="text-xs sm:text-base text-muted-foreground">Weekly and all-time leaderboards with real prizes for top predictors.</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-card border border-border rounded-lg hover:border-[hsl(0,84%,50%)]/50 transition-all group">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-[hsl(0,84%,50%)]/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Zap className="w-5 sm:w-6 h-5 sm:h-6 text-[hsl(0,84%,50%)]" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <h3 className="font-bold text-foreground text-sm sm:text-base">Early prediction bonus.</h3>
                  <p className="text-xs sm:text-base text-muted-foreground">
                    The earlier you predict correctly, the more points you earn.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-card border border-border rounded-lg hover:border-[hsl(45,100%,50%)]/50 transition-all group">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-[hsl(45,100%,50%)]/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 sm:w-6 h-5 sm:h-6 text-[hsl(45,100%,50%)]" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <h3 className="font-bold text-foreground text-sm sm:text-base">Track your accuracy.</h3>
                  <p className="text-xs sm:text-base text-muted-foreground">
                    Personal dashboard shows your prediction history and performance stats.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto p-6 sm:p-8 bg-gradient-to-br from-[hsl(0,84%,50%)]/10 via-transparent to-[hsl(45,100%,50%)]/10 border border-[hsl(0,84%,50%)]/30 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-[hsl(0,84%,50%)]">50+</div>
                <div className="text-sm text-muted-foreground">Active Markets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-[hsl(45,100%,50%)]">1K+</div>
                <div className="text-sm text-muted-foreground">Weekly Predictions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-[hsl(0,84%,50%)]">R10K</div>
                <div className="text-sm text-muted-foreground">Monthly Prizes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-[hsl(45,100%,50%)]">FREE</div>
                <div className="text-sm text-muted-foreground">To Play</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-[hsl(0,84%,25%)] to-[hsl(0,84%,35%)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
              Ready to prove your football knowledge?
            </h2>
            <p className="text-white/70">
              Join thousands of South African fans making predictions every week.
            </p>
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-[hsl(45,100%,50%)] hover:bg-[hsl(45,100%,45%)] text-black font-bold text-lg px-10 py-6"
              onClick={() => navigate("/soccer-laduma/markets")}
            >
              Start Predicting Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 text-center border-t border-border">
        <p className="text-sm text-muted-foreground">
          Powered by <Link to="/" className="text-primary hover:underline">Augurion</Link> prediction infrastructure
        </p>
      </footer>
    </div>
  );
};

export default SoccerLadumaHome;
