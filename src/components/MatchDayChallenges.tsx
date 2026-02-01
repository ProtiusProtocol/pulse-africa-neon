import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Clock, Zap, Trophy, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";

interface Challenge {
  id: string;
  market_id: string;
  title: string;
  description: string | null;
  xp_multiplier: number;
  bonus_points: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  challenge_type: string;
  market?: {
    id: string;
    title: string;
  };
}

const CountdownTimer = ({ endsAt }: { endsAt: string }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const end = new Date(endsAt);
      
      if (end <= now) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = differenceInHours(end, now);
      const minutes = differenceInMinutes(end, now) % 60;
      const seconds = differenceInSeconds(end, now) % 60;
      
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const isUrgent = timeLeft.hours < 2;

  return (
    <div className={`flex items-center gap-1 font-mono text-sm ${isUrgent ? 'text-red-400' : 'text-[hsl(45,100%,50%)]'}`}>
      <Clock className="h-3 w-3" />
      <span>{String(timeLeft.hours).padStart(2, '0')}</span>
      <span className="animate-pulse">:</span>
      <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
      <span className="animate-pulse">:</span>
      <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
    </div>
  );
};

export const MatchDayChallenges = () => {
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["match-day-challenges"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("match_day_challenges")
        .select(`
          id, market_id, title, description, xp_multiplier, bonus_points, 
          starts_at, ends_at, is_active, challenge_type
        `)
        .eq("tenant_id", "soccer-laduma")
        .eq("is_active", true)
        .gte("ends_at", now)
        .lte("starts_at", now)
        .order("ends_at", { ascending: true })
        .limit(3);
      
      if (error) throw error;
      
      // Fetch market titles
      if (data && data.length > 0) {
        const marketIds = data.map(c => c.market_id);
        const { data: markets } = await supabase
          .from("markets")
          .select("id, title")
          .in("id", marketIds);
        
        return data.map(challenge => ({
          ...challenge,
          market: markets?.find(m => m.id === challenge.market_id)
        })) as Challenge[];
      }
      
      return data as Challenge[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-24 bg-muted rounded" />
      </Card>
    );
  }

  if (challenges.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-[hsl(0,84%,50%)]/50 bg-gradient-to-br from-[hsl(0,84%,50%)]/10 via-background to-[hsl(45,100%,50%)]/10">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[hsl(0,84%,40%)] to-[hsl(0,84%,30%)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Flame className="h-5 w-5 text-[hsl(45,100%,50%)]" />
          </motion.div>
          <h2 className="font-bold text-white">Match Day Challenges</h2>
        </div>
        <Badge className="bg-[hsl(45,100%,50%)] text-black border-0 gap-1">
          <Zap className="h-3 w-3" />
          2x XP
        </Badge>
      </div>

      {/* Challenges List */}
      <div className="p-4 space-y-3">
        {challenges.map((challenge, index) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={`/soccer-laduma/markets`}>
              <div className="group p-3 rounded-lg bg-background/50 border border-[hsl(45,100%,50%)]/20 hover:border-[hsl(45,100%,50%)]/50 transition-all hover:bg-[hsl(45,100%,50%)]/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs bg-[hsl(0,84%,50%)]/20 text-[hsl(0,84%,60%)] border-[hsl(0,84%,50%)]/50">
                        {challenge.challenge_type === 'match_day' ? '⚽ Match Day' : '🏆 Special'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Trophy className="h-3 w-3" />
                        +{challenge.bonus_points} pts
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-[hsl(45,100%,50%)] transition-colors">
                      {challenge.title}
                    </h3>
                    {challenge.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {challenge.description}
                      </p>
                    )}
                    {challenge.market && (
                      <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-1">
                        📊 {challenge.market.title}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <CountdownTimer endsAt={challenge.ends_at} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[hsl(45,100%,50%)] transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="px-4 pb-4">
        <Link to="/soccer-laduma/markets">
          <Button className="w-full bg-gradient-to-r from-[hsl(0,84%,50%)] to-[hsl(0,84%,40%)] hover:opacity-90 gap-2">
            <Flame className="h-4 w-4" />
            View All Challenges
          </Button>
        </Link>
      </div>
    </Card>
  );
};
