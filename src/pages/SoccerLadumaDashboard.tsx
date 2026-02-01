import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Trophy, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  Medal,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// Demo predictions for pitch (in real app, these come from database)
const DEMO_PREDICTIONS = [
  { id: "1", marketTitle: "Mamelodi Sundowns to win DStv Premiership 2024/25", side: "yes", points: 50, status: "pending", potentialWin: 85 },
  { id: "2", marketTitle: "Bafana Bafana to qualify for AFCON 2025 knockout stage", side: "yes", points: 50, status: "won", wonPoints: 92 },
  { id: "3", marketTitle: "Orlando Pirates to finish top 3 in PSL", side: "no", points: 50, status: "pending", potentialWin: 120 },
  { id: "4", marketTitle: "Kaizer Chiefs to win any trophy this season", side: "no", points: 50, status: "lost", wonPoints: 0 },
];

const SoccerLadumaDashboard = () => {
  const [predictions] = useState(DEMO_PREDICTIONS);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  
  const totalPoints = 1142;
  const weeklyRank = 23;
  const accuracy = 67;
  const weeklyChange = 142;

  // Animate points on load
  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += Math.ceil((totalPoints - current) / 10);
        if (current >= totalPoints) {
          setAnimatedPoints(totalPoints);
          clearInterval(interval);
        } else {
          setAnimatedPoints(current);
        }
      }, 50);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const pendingPredictions = predictions.filter(p => p.status === "pending");
  const resolvedPredictions = predictions.filter(p => p.status !== "pending");
  const wonCount = predictions.filter(p => p.status === "won").length;
  const lostCount = predictions.filter(p => p.status === "lost").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-[hsl(0,84%,25%)] to-[hsl(0,84%,35%)] py-4 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/soccer-laduma/markets">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">My Dashboard</h1>
              <p className="text-white/70 text-sm">Track your predictions</p>
            </div>
          </div>
        </div>
      </header>

      {/* Points Hero */}
      <section className="bg-gradient-to-b from-[hsl(0,84%,25%)] to-background py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Trophy className="h-8 w-8 text-[hsl(45,100%,50%)]" />
            <span className="text-5xl font-black text-white">{animatedPoints.toLocaleString()}</span>
            <span className="text-2xl text-white/60">pts</span>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{weeklyChange} this week
            </Badge>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">#{weeklyRank}</div>
              <div className="text-xs text-white/60">Weekly Rank</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-[hsl(45,100%,50%)]">{accuracy}%</div>
              <div className="text-xs text-white/60">Accuracy</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{predictions.length}</div>
              <div className="text-xs text-white/60">Predictions</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 space-y-8">
        
        {/* Prediction Accuracy Ring */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-[hsl(0,84%,50%)]" />
            Prediction Performance
          </h2>
          
          <div className="flex items-center gap-8">
            {/* Visual Ring */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${accuracy * 3.52} 352`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(0, 84%, 50%)" />
                    <stop offset="100%" stopColor="hsl(45, 100%, 50%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{accuracy}%</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Won</span>
                </div>
                <span className="font-bold text-green-500">{wonCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Lost</span>
                </div>
                <span className="font-bold text-red-500">{lostCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Pending</span>
                </div>
                <span className="font-bold">{pendingPredictions.length}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Active Predictions */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-[hsl(45,100%,50%)]" />
            Active Predictions
          </h2>
          
          <div className="space-y-3">
            {pendingPredictions.map((prediction) => (
              <Card key={prediction.id} className="p-4 border-l-4 border-l-[hsl(45,100%,50%)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium line-clamp-1">{prediction.marketTitle}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant={prediction.side === "yes" ? "default" : "secondary"} 
                             className={prediction.side === "yes" ? "bg-green-500" : "bg-red-500"}>
                        {prediction.side.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {prediction.points} pts staked
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Potential</div>
                    <div className="text-lg font-bold text-[hsl(45,100%,40%)]">
                      +{prediction.potentialWin} pts
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Resolved Predictions */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Medal className="h-5 w-5 text-[hsl(0,84%,50%)]" />
            Recent Results
          </h2>
          
          <div className="space-y-3">
            {resolvedPredictions.map((prediction) => (
              <Card 
                key={prediction.id} 
                className={`p-4 border-l-4 ${
                  prediction.status === "won" 
                    ? "border-l-green-500 bg-green-500/5" 
                    : "border-l-red-500 bg-red-500/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {prediction.status === "won" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <p className="font-medium line-clamp-1">{prediction.marketTitle}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {prediction.side.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {prediction.points} pts staked
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {prediction.status === "won" ? (
                      <>
                        <div className="text-sm text-green-600">Won</div>
                        <div className="text-lg font-bold text-green-600">
                          +{prediction.wonPoints} pts
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-red-600">Lost</div>
                        <div className="text-lg font-bold text-red-600">
                          -{prediction.points} pts
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Leaderboard Preview */}
        <Card className="p-6 bg-gradient-to-br from-[hsl(0,84%,50%)]/10 to-[hsl(45,100%,50%)]/10 border-[hsl(45,100%,50%)]/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Star className="h-5 w-5 text-[hsl(45,100%,50%)]" />
              Weekly Leaderboard
            </h2>
            <Badge variant="outline">Top 50</Badge>
          </div>
          
          <div className="space-y-2">
            {[
              { rank: 1, name: "SundownsFan92", points: 2450, badge: "🥇" },
              { rank: 2, name: "ChiefKaizer", points: 2180, badge: "🥈" },
              { rank: 3, name: "PiratesForever", points: 1890, badge: "🥉" },
              { rank: 23, name: "You", points: 1142, highlight: true },
            ].map((player) => (
              <div 
                key={player.rank}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.highlight 
                    ? "bg-[hsl(45,100%,50%)]/20 border border-[hsl(45,100%,50%)]/50" 
                    : "bg-background/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 text-center font-bold">
                    {player.badge || `#${player.rank}`}
                  </span>
                  <span className={player.highlight ? "font-bold" : ""}>{player.name}</span>
                </div>
                <span className="font-bold">{player.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
          
          <Button className="w-full mt-4 bg-[hsl(0,84%,50%)] hover:bg-[hsl(0,84%,45%)]">
            View Full Leaderboard
          </Button>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Powered by <Link to="/" className="text-primary hover:underline">Augurion</Link> prediction infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SoccerLadumaDashboard;
