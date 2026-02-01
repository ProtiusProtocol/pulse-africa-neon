import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  Medal,
  Star,
  Award
} from "lucide-react";
import { Link } from "react-router-dom";
import { usePaperPredictions, useLeaderboardEntry, useLeaderboard } from "@/hooks/usePaperTrading";
import { useAchievementProgress } from "@/hooks/useAchievements";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StreakBadge, XPProgressBar, LevelBadge } from "@/components/gamification";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { ReferralCard } from "@/components/ReferralCard";
import { MatchDayChallenges } from "@/components/MatchDayChallenges";
import { motion } from "framer-motion";

const SoccerLadumaDashboard = () => {
  const { data: predictions = [], isLoading: predictionsLoading } = usePaperPredictions();
  const { data: leaderboardEntry } = useLeaderboardEntry();
  const { data: leaderboard = [] } = useLeaderboard(50);
  const { achievements, unlockedCount, totalCount, progressPercent } = useAchievementProgress();
  const [animatedPoints, setAnimatedPoints] = useState(0);

  // Fetch market titles for predictions
  const marketIds = predictions.map(p => p.market_id);
  const { data: markets = [] } = useQuery({
    queryKey: ["markets-for-predictions", marketIds],
    queryFn: async () => {
      if (marketIds.length === 0) return [];
      const { data, error } = await supabase
        .from("markets")
        .select("id, title")
        .in("id", marketIds);
      if (error) throw error;
      return data || [];
    },
    enabled: marketIds.length > 0,
  });

  // Create a map of market_id -> title
  const marketTitleMap = markets.reduce((acc, m) => {
    acc[m.id] = m.title;
    return acc;
  }, {} as Record<string, string>);
  
  // Pull real data from leaderboard entry
  const totalPoints = leaderboardEntry?.total_points ?? 1000;
  const weeklyRank = leaderboardEntry?.weekly_rank;
  const allTimeRank = leaderboardEntry?.all_time_rank;
  const accuracy = leaderboardEntry?.accuracy_pct;
  const weeklyChange = leaderboardEntry?.weekly_points ?? 0;
  const predictionsWon = leaderboardEntry?.predictions_won ?? 0;
  const predictionsLost = leaderboardEntry?.predictions_lost ?? 0;
  
  // Gamification data
  const streakCurrent = leaderboardEntry?.streak_current ?? 0;
  const streakBest = leaderboardEntry?.streak_best ?? 0;
  const xpTotal = leaderboardEntry?.xp_total ?? 0;
  const level = leaderboardEntry?.level ?? 1;

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
  }, [totalPoints]);

  const pendingPredictions = predictions.filter(p => p.status === "pending");
  const resolvedPredictions = predictions.filter(p => p.status !== "pending");
  const wonCount = predictionsWon;
  const lostCount = predictionsLost;
  const accuracyDisplay = accuracy != null ? Math.round(accuracy) : null;

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
          <Link to="/soccer-laduma/leaderboard">
            <Button className="bg-[hsl(45,100%,50%)] text-black hover:bg-[hsl(45,100%,45%)] gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Points Hero */}
      <section className="bg-gradient-to-b from-[hsl(0,84%,25%)] to-background py-12 px-4">
        <div className="container mx-auto text-center">
          {/* Level Badge & Points */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <LevelBadge level={level} size="lg" />
            <div>
              <div className="inline-flex items-center gap-2">
                <Trophy className="h-8 w-8 text-[hsl(45,100%,50%)]" />
                <span className="text-5xl font-black text-white">{animatedPoints.toLocaleString()}</span>
                <span className="text-2xl text-white/60">pts</span>
              </div>
            </div>
          </div>
          
          {/* Streak & Weekly Change */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {streakCurrent >= 2 && (
              <StreakBadge streak={streakCurrent} size="md" />
            )}
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{weeklyChange} this week
            </Badge>
          </div>

          {/* XP Progress */}
          <div className="max-w-sm mx-auto mb-6 bg-white/5 rounded-xl p-4">
            <XPProgressBar xp={xpTotal} level={level} size="md" />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xl font-bold text-white">
                {allTimeRank ? `#${allTimeRank}` : "#--"}
              </div>
              <div className="text-xs text-white/60">Rank</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xl font-bold text-[hsl(45,100%,50%)]">
                {accuracyDisplay != null ? `${accuracyDisplay}%` : "--%"}
              </div>
              <div className="text-xs text-white/60">Accuracy</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xl font-bold text-white">{predictions.length}</div>
              <div className="text-xs text-white/60">Predictions</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xl font-bold text-orange-400">🔥 {streakBest}</div>
              <div className="text-xs text-white/60">Best Streak</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Activity Ticker - Full Width */}
      <LiveActivityFeed />

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 space-y-8">
        
        {/* Match Day Challenges */}
        <MatchDayChallenges />
        
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
                  strokeDasharray={`${(accuracyDisplay ?? 0) * 3.52} 352`}
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
                <span className="text-2xl font-bold">
                  {accuracyDisplay != null ? `${accuracyDisplay}%` : "--%"}
                </span>
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

        {/* Achievements Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-[hsl(45,100%,50%)]" />
              Achievements
            </h2>
            <span className="text-sm text-muted-foreground">
              {unlockedCount}/{totalCount} unlocked
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[hsl(45,100%,50%)] to-[hsl(0,84%,50%)]"
            />
          </div>

          {/* Achievement Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {achievements.slice(0, 16).map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`relative aspect-square rounded-xl flex items-center justify-center text-2xl ${
                  achievement.unlocked
                    ? "bg-gradient-to-br from-[hsl(45,100%,50%)]/20 to-[hsl(0,84%,50%)]/20 border border-[hsl(45,100%,50%)]/50"
                    : "bg-muted/50 grayscale opacity-40"
                }`}
                title={`${achievement.name}: ${achievement.description}${achievement.unlocked ? " ✓" : ""}`}
              >
                <span>{achievement.icon}</span>
                {achievement.unlocked && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {totalCount > 16 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              +{totalCount - 16} more achievements to unlock
            </p>
          )}
        </Card>

        {/* Referral Program */}
        <ReferralCard />

        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-[hsl(45,100%,50%)]" />
            Active Predictions
          </h2>
          
          <div className="space-y-3">
            {pendingPredictions.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No active predictions yet</p>
                <Link to="/soccer-laduma/markets">
                  <Button className="mt-4 bg-[hsl(0,84%,50%)] hover:bg-[hsl(0,84%,45%)]">
                    Make a Prediction
                  </Button>
                </Link>
              </Card>
            ) : (
              pendingPredictions.map((prediction) => (
                <Card key={prediction.id} className="p-4 border-l-4 border-l-[hsl(45,100%,50%)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium line-clamp-1">
                        {marketTitleMap[prediction.market_id] || "Loading..."}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant={prediction.side === "yes" ? "default" : "secondary"} 
                               className={prediction.side === "yes" ? "bg-green-500" : "bg-red-500"}>
                          {prediction.side.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {prediction.points_staked} pts staked
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Staked</div>
                      <div className="text-lg font-bold text-[hsl(45,100%,40%)]">
                        {prediction.points_staked} pts
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Resolved Predictions */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Medal className="h-5 w-5 text-[hsl(0,84%,50%)]" />
            Recent Results
          </h2>
          
          <div className="space-y-3">
            {resolvedPredictions.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No resolved predictions yet</p>
              </Card>
            ) : (
              resolvedPredictions.map((prediction) => (
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
                        <p className="font-medium line-clamp-1">
                          {marketTitleMap[prediction.market_id] || "Loading..."}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {prediction.side.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {prediction.points_staked} pts staked
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {prediction.status === "won" ? (
                        <>
                          <div className="text-sm text-green-600">Won</div>
                          <div className="text-lg font-bold text-green-600">
                            +{prediction.points_won ?? 0} pts
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-red-600">Lost</div>
                          <div className="text-lg font-bold text-red-600">
                            -{prediction.points_staked} pts
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
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
            {/* Show top 3 from real leaderboard */}
            {leaderboard.slice(0, 3).map((entry, index) => {
              const rank = index + 1;
              const badges = ["🥇", "🥈", "🥉"];
              return (
                <div 
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center font-bold">{badges[index]}</span>
                    <span>{entry.display_name}</span>
                  </div>
                  <span className="font-bold">{entry.total_points.toLocaleString()} pts</span>
                </div>
              );
            })}
            
            {/* Show current user's position */}
            {leaderboardEntry && (
              <div 
                className="flex items-center justify-between p-3 rounded-lg bg-[hsl(45,100%,50%)]/20 border border-[hsl(45,100%,50%)]/50"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 text-center font-bold">
                    #{leaderboardEntry.all_time_rank || "--"}
                  </span>
                  <span className="font-bold">You</span>
                </div>
                <span className="font-bold">{leaderboardEntry.total_points.toLocaleString()} pts</span>
              </div>
            )}
          </div>
          
          <Link to="/soccer-laduma/leaderboard">
            <Button className="w-full mt-4 bg-[hsl(0,84%,50%)] hover:bg-[hsl(0,84%,45%)]">
              View Full Leaderboard
            </Button>
          </Link>
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
