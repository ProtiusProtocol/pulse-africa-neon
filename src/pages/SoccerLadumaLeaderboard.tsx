import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Medal, Crown, TrendingUp, Sparkles, Target, Flame, Star, Zap, Shield, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { useLeaderboard, useLeaderboardEntry } from "@/hooks/usePaperTrading";
import { getSessionId } from "@/lib/paperSession";
import { 
  Confetti, 
  FlyingPoints, 
  AchievementToast,
  SoccerBallBurst,
  RankUpCelebration,
  CoinShower,
  PredictionPlaced
} from "@/components/gamification";

const DEMO_ACHIEVEMENTS = [
  { id: "1", name: "First Prediction", description: "Make your first prediction", icon: "🎯", xp_reward: 50 },
  { id: "2", name: "Hot Streak", description: "Win 3 predictions in a row", icon: "🔥", xp_reward: 150 },
  { id: "3", name: "Sharp Shooter", description: "Reach 60% accuracy", icon: "🎯", xp_reward: 200 },
  { id: "4", name: "Pro Predictor", description: "Reach level 10", icon: "🌟", xp_reward: 500 },
];

const SoccerLadumaLeaderboard = () => {
  const { data: leaderboard = [], isLoading } = useLeaderboard(50);
  const { data: userEntry } = useLeaderboardEntry();
  const currentSessionId = getSessionId();

  // Demo state
  const [showConfetti, setShowConfetti] = useState(false);
  const [flyingPointsKey, setFlyingPointsKey] = useState(0);
  const [flyingPointsValue, setFlyingPointsValue] = useState(0);
  const [currentAchievement, setCurrentAchievement] = useState<typeof DEMO_ACHIEVEMENTS[0] | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  
  // New celebration states
  const [showSoccerBalls, setShowSoccerBalls] = useState(false);
  const [showRankUp, setShowRankUp] = useState(false);
  const [showCoinShower, setShowCoinShower] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [predictionSide, setPredictionSide] = useState<"yes" | "no">("yes");
  const [cpAmount, setCpAmount] = useState(50);
  const [newRank, setNewRank] = useState(5);

  const runPredictionDemo = () => {
    setPredictionSide(Math.random() > 0.5 ? "yes" : "no");
    setShowPrediction(true);
    
    // After prediction animation, show soccer balls for win
    setTimeout(() => {
      setShowSoccerBalls(true);
      setFlyingPointsValue(100);
      setFlyingPointsKey(prev => prev + 1);
    }, 1500);
  };

  const runRankUpDemo = () => {
    setNewRank(Math.floor(Math.random() * 10) + 1);
    setShowRankUp(true);
    setShowConfetti(true);
    
    setTimeout(() => {
      const randomAchievement = DEMO_ACHIEVEMENTS[Math.floor(Math.random() * DEMO_ACHIEVEMENTS.length)];
      setCurrentAchievement(randomAchievement);
      setShowAchievement(true);
    }, 1500);

    setTimeout(() => {
      setShowAchievement(false);
    }, 5500);
  };

  const runCPDemo = () => {
    setCpAmount(Math.floor(Math.random() * 100) + 25);
    setShowCoinShower(true);
  };

  const runAllDemo = () => {
    setShowConfetti(true);
    
    setTimeout(() => {
      setFlyingPointsValue(150);
      setFlyingPointsKey(prev => prev + 1);
    }, 500);

    setTimeout(() => {
      setShowSoccerBalls(true);
    }, 1000);

    setTimeout(() => {
      setNewRank(3);
      setShowRankUp(true);
    }, 2500);

    setTimeout(() => {
      setCpAmount(75);
      setShowCoinShower(true);
    }, 4500);

    setTimeout(() => {
      const randomAchievement = DEMO_ACHIEVEMENTS[Math.floor(Math.random() * DEMO_ACHIEVEMENTS.length)];
      setCurrentAchievement(randomAchievement);
      setShowAchievement(true);
    }, 6000);

    setTimeout(() => {
      setShowAchievement(false);
    }, 10000);
  };

  // Get accuracy badge based on accuracy percentage
  const getAccuracyBadge = (accuracy: number | null, predictionsWon: number) => {
    if (accuracy === null || accuracy === undefined) return null;
    
    if (accuracy >= 75) {
      return { icon: "🎯", label: "Sharp Shooter", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
    }
    if (accuracy >= 60) {
      return { icon: "🔥", label: "On Fire", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
    }
    if (accuracy >= 50 && predictionsWon >= 5) {
      return { icon: "⚡", label: "Rising Star", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    }
    return null;
  };

  // Check if user qualifies for Expert tier (top 10 with 10+ predictions and 55%+ accuracy)
  const isExpert = (rank: number, accuracy: number | null, predictions: number) => {
    return rank <= 10 && predictions >= 10 && accuracy !== null && accuracy >= 55;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-[hsl(45,100%,50%)]" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold">#{rank}</span>;
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <>
      {/* Gamification Effects */}
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
      <FlyingPoints points={flyingPointsValue} triggerKey={flyingPointsKey} />
      <AchievementToast 
        achievement={currentAchievement} 
        isVisible={showAchievement} 
        onClose={() => setShowAchievement(false)} 
      />
      <SoccerBallBurst isActive={showSoccerBalls} onComplete={() => setShowSoccerBalls(false)} />
      <RankUpCelebration isActive={showRankUp} newRank={newRank} onComplete={() => setShowRankUp(false)} />
      <CoinShower isActive={showCoinShower} amount={cpAmount} onComplete={() => setShowCoinShower(false)} />
      <PredictionPlaced isActive={showPrediction} side={predictionSide} onComplete={() => setShowPrediction(false)} />

    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-[hsl(0,84%,25%)] to-[hsl(0,84%,35%)] py-4 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/soccer-laduma/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Leaderboard</h1>
              <p className="text-white/70 text-sm">Top Predictors</p>
            </div>
          </div>
          
          {userEntry && (
             <div className="flex items-center gap-3">
               <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                 <Trophy className="h-4 w-4 text-[hsl(45,100%,50%)]" />
                 <span className="text-white font-bold">{userEntry.total_points.toLocaleString()}</span>
                 <span className="text-white/70 text-xs">PP</span>
               </div>
               <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                 <Coins className="h-4 w-4 text-[hsl(45,100%,50%)]" />
                 <span className="text-white font-bold">{(userEntry.card_points ?? 0).toLocaleString()}</span>
                 <span className="text-white/70 text-xs">CP</span>
               </div>
            </div>
          )}
        </div>
      </header>

      {/* Your Position Banner */}
      {userEntry && (
        <div className="bg-gradient-to-r from-[hsl(45,100%,50%)]/20 to-[hsl(0,84%,50%)]/20 border-b py-4 px-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-[hsl(45,100%,50%)] text-black font-bold rounded-full w-10 h-10 flex items-center justify-center">
                #{userEntry.all_time_rank || "--"}
              </div>
              <div>
                <p className="font-bold">{userEntry.display_name}</p>
                <p className="text-sm text-muted-foreground">Your Position</p>
              </div>
            </div>
            <div className="text-right">
               <div className="flex items-center gap-3 justify-end">
                 <div>
                   <p className="font-bold text-lg">{userEntry.total_points.toLocaleString()} <span className="text-sm text-muted-foreground">PP</span></p>
                 </div>
                 <div className="border-l pl-3">
                   <p className="font-bold text-[hsl(45,100%,50%)] flex items-center gap-1">
                     <Coins className="h-4 w-4" />
                     {(userEntry.card_points ?? 0).toLocaleString()}
                   </p>
                 </div>
               </div>
              <p className="text-sm text-muted-foreground">
                {userEntry.accuracy_pct != null 
                  ? `${Math.round(userEntry.accuracy_pct)}% accuracy` 
                  : "No resolved predictions"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Top 50 Predictors</h2>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button 
              onClick={runPredictionDemo}
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
            >
              <Target className="h-3 w-3" />
              Prediction
            </Button>
            <Button 
              onClick={runRankUpDemo}
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
            >
              <Trophy className="h-3 w-3" />
              Rank Up
            </Button>
            <Button 
              onClick={runCPDemo}
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
            >
              <Coins className="h-3 w-3" />
              CP Earned
            </Button>
            <Button 
              onClick={runAllDemo}
              size="sm"
              className="bg-gradient-to-r from-[hsl(45,100%,50%)] to-[hsl(0,84%,50%)] text-white hover:opacity-90 gap-1 text-xs"
            >
              <Sparkles className="h-3 w-3" />
              All Effects
            </Button>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              All Time
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-32 mb-2" />
                    <div className="h-3 bg-muted rounded w-20" />
                  </div>
                  <div className="h-5 bg-muted rounded w-16" />
                </div>
              </Card>
            ))}
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = entry.session_id === currentSessionId;
              const emoji = getRankEmoji(rank);
              const accuracyBadge = getAccuracyBadge(entry.accuracy_pct, entry.predictions_won);
              const expertStatus = isExpert(rank, entry.accuracy_pct, entry.predictions_made);
              
              return (
                <Card 
                  key={entry.id} 
                  className={`p-4 transition-all ${
                    isCurrentUser 
                      ? "border-[hsl(45,100%,50%)]/50 bg-[hsl(45,100%,50%)]/10" 
                      : expertStatus
                        ? "border-purple-500/40 bg-gradient-to-r from-purple-500/10 to-transparent"
                        : rank <= 3 
                          ? "border-[hsl(0,84%,50%)]/30 bg-[hsl(0,84%,50%)]/5"
                          : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      rank === 1 
                        ? "bg-[hsl(45,100%,50%)] text-black" 
                        : rank === 2 
                          ? "bg-gray-300 text-gray-800"
                          : rank === 3 
                            ? "bg-amber-600 text-white"
                            : "bg-muted text-muted-foreground"
                    }`}>
                      {emoji || `#${rank}`}
                    </div>
                    
                    {/* Name & Stats */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${isCurrentUser ? "font-bold" : ""}`}>
                          {entry.display_name}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                        {expertStatus && (
                          <Badge className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 gap-1">
                            <Shield className="h-3 w-3" />
                            Expert
                          </Badge>
                        )}
                        {accuracyBadge && (
                          <Badge variant="outline" className={`text-xs ${accuracyBadge.color} gap-1`}>
                            <span>{accuracyBadge.icon}</span>
                            {accuracyBadge.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{entry.predictions_made} predictions</span>
                        {entry.accuracy_pct != null && (
                          <span className={`${entry.accuracy_pct >= 60 ? 'text-green-500 font-medium' : ''}`}>
                            • {Math.round(entry.accuracy_pct)}% accuracy
                          </span>
                        )}
                        {entry.streak_current >= 3 && (
                          <span className="text-orange-400">
                            🔥 {entry.streak_current} streak
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Points */}
                    <div className="text-right">
                       <div className="flex items-center gap-2">
                         <div>
                           <span className={`font-bold text-lg ${
                             rank <= 3 ? "text-[hsl(0,84%,50%)]" : ""
                           }`}>
                             {entry.total_points.toLocaleString()}
                           </span>
                           <span className="text-muted-foreground text-xs ml-1">pts</span>
                         </div>
                         {(entry.card_points ?? 0) > 0 && (
                           <div className="flex items-center gap-1 text-[hsl(45,100%,50%)] text-sm">
                             <Coins className="h-3 w-3" />
                             {entry.card_points}
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Predictors Yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to make predictions and top the leaderboard!
            </p>
            <Link to="/soccer-laduma/markets">
              <Button className="bg-[hsl(0,84%,50%)] hover:bg-[hsl(0,84%,45%)]">
                Make a Prediction
              </Button>
            </Link>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t mt-8">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Powered by <Link to="/" className="text-primary hover:underline">Augurion</Link> prediction infrastructure
          </p>
        </div>
      </footer>
    </div>
    </>
  );
};

export default SoccerLadumaLeaderboard;
