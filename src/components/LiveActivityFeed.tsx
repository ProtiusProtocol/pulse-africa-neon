import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

interface ActivityItem {
  id: string;
  session_id: string;
  market_id: string;
  side: string;
  points_staked: number;
  created_at: string;
}

const FAN_NAMES = [
  "ChiefsForever", "PiratesPride", "SundownsFan99", "Bafana_Believer", 
  "GoldenArrows_Fan", "CelticWarrior", "RoyalAM_King", "StellaFanatic",
  "AmaZulu_Lion", "SuperSportFan", "MaritzStar", "GalaxiesGuru"
];

const getRandomFanName = (sessionId: string) => {
  const hash = sessionId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return FAN_NAMES[Math.abs(hash) % FAN_NAMES.length];
};

export const LiveActivityFeed = () => {
  const [liveItems, setLiveItems] = useState<ActivityItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Fetch recent predictions
  const { data: recentPredictions = [] } = useQuery({
    queryKey: ["recent-predictions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paper_predictions")
        .select("id, session_id, market_id, side, points_staked, created_at")
        .eq("tenant_id", "soccer-laduma")
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch market titles
  const marketIds = [...new Set([...recentPredictions, ...liveItems].map(p => p.market_id))];
  const { data: markets = [] } = useQuery({
    queryKey: ["markets-for-feed", marketIds],
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

  const marketMap = markets.reduce((acc, m) => {
    acc[m.id] = m.title;
    return acc;
  }, {} as Record<string, string>);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('live-predictions-ticker')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'paper_predictions',
          filter: 'tenant_id=eq.soccer-laduma'
        },
        (payload) => {
          const newItem = payload.new as ActivityItem;
          setLiveItems(prev => [newItem, ...prev.slice(0, 14)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Combine live and recent, deduplicate
  const allItems = [...liveItems, ...recentPredictions];
  const uniqueItems = allItems.filter((item, index, self) =>
    index === self.findIndex(t => t.id === item.id)
  ).slice(0, 15);

  if (uniqueItems.length === 0) {
    return null;
  }

  // Duplicate items for seamless loop
  const tickerItems = [...uniqueItems, ...uniqueItems];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[hsl(0,84%,15%)] via-[hsl(0,84%,20%)] to-[hsl(0,84%,15%)] border-y border-[hsl(45,100%,50%)]/30">
      {/* Live indicator */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-2 px-3 bg-gradient-to-r from-[hsl(0,84%,15%)] via-[hsl(0,84%,15%)] to-transparent pr-8">
        <Activity className="h-4 w-4 text-[hsl(45,100%,50%)]" />
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-xs font-semibold text-white uppercase tracking-wide">Live</span>
      </div>

      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-[hsl(0,84%,15%)] to-transparent" />

      {/* Ticker tape */}
      <div 
        ref={tickerRef}
        className="flex py-2.5 pl-24"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.div
          className="flex gap-8 whitespace-nowrap"
          animate={{
            x: isPaused ? 0 : [0, -50 * uniqueItems.length],
          }}
          transition={{
            x: {
              duration: uniqueItems.length * 4,
              ease: "linear",
              repeat: Infinity,
              repeatType: "loop",
            },
          }}
        >
          {tickerItems.map((item, index) => {
            const fanName = getRandomFanName(item.session_id);
            const marketTitle = marketMap[item.market_id] || "a market";
            const shortTitle = marketTitle.length > 25 ? marketTitle.slice(0, 25) + '...' : marketTitle;

            return (
              <div 
                key={`${item.id}-${index}`} 
                className="flex items-center gap-2 text-sm"
              >
                <Zap className={`h-3 w-3 flex-shrink-0 ${item.side === 'yes' ? 'text-green-400' : 'text-red-400'}`} />
                <span className="font-semibold text-[hsl(45,100%,50%)]">{fanName}</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs px-1.5 py-0 ${
                    item.side === 'yes' ? 'bg-green-500/30 text-green-300 border-green-500/50' : 'bg-red-500/30 text-red-300 border-red-500/50'
                  }`}
                >
                  {item.side.toUpperCase()}
                </Badge>
                <span className="text-white/70" title={marketTitle}>
                  {shortTitle}
                </span>
                <span className="text-[hsl(45,100%,50%)]/60">•</span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};
