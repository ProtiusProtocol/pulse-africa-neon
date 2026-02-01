import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Medal, Crown, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useLeaderboard, useLeaderboardEntry } from "@/hooks/usePaperTrading";
import { getSessionId } from "@/lib/paperSession";

const SoccerLadumaLeaderboard = () => {
  const { data: leaderboard = [], isLoading } = useLeaderboard(50);
  const { data: userEntry } = useLeaderboardEntry();
  const currentSessionId = getSessionId();

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
            <div className="bg-white/10 rounded-lg px-4 py-2 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[hsl(45,100%,50%)]" />
              <span className="text-white font-bold">{userEntry.total_points.toLocaleString()}</span>
              <span className="text-white/70 text-sm">pts</span>
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
              <p className="font-bold text-lg">{userEntry.total_points.toLocaleString()} pts</p>
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
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            All Time
          </Badge>
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
              
              return (
                <Card 
                  key={entry.id} 
                  className={`p-4 transition-all ${
                    isCurrentUser 
                      ? "border-[hsl(45,100%,50%)]/50 bg-[hsl(45,100%,50%)]/10" 
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isCurrentUser ? "font-bold" : ""}`}>
                          {entry.display_name}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{entry.predictions_made} predictions</span>
                        {entry.accuracy_pct != null && (
                          <span>• {Math.round(entry.accuracy_pct)}% accuracy</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Points */}
                    <div className="text-right">
                      <span className={`font-bold text-lg ${
                        rank <= 3 ? "text-[hsl(0,84%,50%)]" : ""
                      }`}>
                        {entry.total_points.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground ml-1">pts</span>
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
  );
};

export default SoccerLadumaLeaderboard;
