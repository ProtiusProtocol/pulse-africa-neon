import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, TrendingUp, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PaperPrediction {
  marketId: string;
  side: "yes" | "no";
}

const SoccerLadumaMarkets = () => {
  // Local state for paper predictions (UI only for pitch)
  const [predictions, setPredictions] = useState<PaperPrediction[]>([]);
  const [points, setPoints] = useState(1000); // Starting points

  const { data: markets, isLoading } = useQuery({
    queryKey: ["soccer-laduma-markets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("category", "Sport")
        .eq("status", "active")
        .order("deadline", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const hasPredicted = (marketId: string) => {
    return predictions.some((p) => p.marketId === marketId);
  };

  const getPrediction = (marketId: string) => {
    return predictions.find((p) => p.marketId === marketId);
  };

  const makePrediction = (marketId: string, side: "yes" | "no") => {
    if (hasPredicted(marketId)) return;

    setPredictions([...predictions, { marketId, side }]);
    // Deduct points for making prediction
    setPoints((prev) => prev - 50);
  };

  // Calculate implied probability from yes/no totals
  const getYesProbability = (yesTotal: number | null, noTotal: number | null) => {
    const yes = yesTotal || 0;
    const no = noTotal || 0;
    if (yes + no === 0) return 50;
    return Math.round((yes / (yes + no)) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-[hsl(0,84%,25%)] to-[hsl(0,84%,35%)] py-4 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/soccer-laduma">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Soccer Laduma</h1>
              <p className="text-white/70 text-sm">Predictions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/10 rounded-lg px-4 py-2 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[hsl(45,100%,50%)]" />
              <span className="text-white font-bold">{points}</span>
              <span className="text-white/70 text-sm">pts</span>
            </div>
            <Badge variant="outline" className="border-white/30 text-white">
              <Users className="h-3 w-3 mr-1" />
              {predictions.length} predictions
            </Badge>
          </div>
        </div>
      </header>

      {/* Stats Banner */}
      <div className="bg-muted/50 border-b py-3 px-4">
        <div className="container mx-auto flex items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Your Rank:</span>
            <span className="font-bold text-[hsl(0,84%,50%)]">#--</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Accuracy:</span>
            <span className="font-bold">--%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">This Week:</span>
            <span className="font-bold text-[hsl(45,100%,40%)]">+0 pts</span>
          </div>
        </div>
      </div>

      {/* Markets Grid */}
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Active Predictions</h2>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Updates live
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="h-3 bg-muted rounded w-1/2 mb-6" />
                <div className="flex gap-2">
                  <div className="h-10 bg-muted rounded flex-1" />
                  <div className="h-10 bg-muted rounded flex-1" />
                </div>
              </Card>
            ))}
          </div>
        ) : markets && markets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {markets.map((market) => {
              const yesPct = getYesProbability(market.yes_total, market.no_total);
              const noPct = 100 - yesPct;
              const predicted = hasPredicted(market.id);
              const userPrediction = getPrediction(market.id);

              return (
                <Card 
                  key={market.id} 
                  className={`p-6 transition-all ${
                    predicted 
                      ? "border-[hsl(45,100%,50%)]/50 bg-[hsl(45,100%,50%)]/5" 
                      : "hover:border-[hsl(0,84%,50%)]/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {market.region}
                    </Badge>
                    {market.deadline && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(market.deadline), "MMM d")}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold mb-4 line-clamp-2">{market.title}</h3>

                  {/* Probability bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-600 font-medium">Yes {yesPct}%</span>
                      <span className="text-red-600 font-medium">No {noPct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                      <div 
                        className="bg-green-500 transition-all" 
                        style={{ width: `${yesPct}%` }} 
                      />
                      <div 
                        className="bg-red-500 transition-all" 
                        style={{ width: `${noPct}%` }} 
                      />
                    </div>
                  </div>

                  {/* Prediction buttons */}
                  {predicted ? (
                    <div className="flex items-center justify-center gap-2 py-2 bg-muted rounded-lg">
                      <TrendingUp className="h-4 w-4 text-[hsl(45,100%,40%)]" />
                      <span className="font-medium">
                        You predicted: {userPrediction?.side.toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-green-500/50 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500"
                        onClick={() => makePrediction(market.id, "yes")}
                      >
                        Yes ({yesPct}%)
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500/50 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500"
                        onClick={() => makePrediction(market.id, "no")}
                      >
                        No ({noPct}%)
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    50 pts to predict
                  </p>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sports Markets Yet</h3>
            <p className="text-muted-foreground mb-4">
              Sports prediction markets will appear here once they're created.
            </p>
            <p className="text-sm text-muted-foreground">
              Check back soon for PSL, AFCON, and Premier League predictions!
            </p>
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

export default SoccerLadumaMarkets;
