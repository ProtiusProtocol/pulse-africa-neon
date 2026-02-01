import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  session_id: string;
  market_id: string;
  side: string;
  points_staked: number;
  created_at: string;
  display_name?: string;
  market_title?: string;
}

const FAN_NAMES = [
  "ChiefsForever", "PiratesPride", "SundownsFan99", "Bafana_Believer", 
  "GoldenArrows_Fan", "CelticWarrior", "RoyalAM_King", "StellaFanatic",
  "AmaZulu_Lion", "SuperSportFan", "MaritzStar", "GalaxiesGuru"
];

const getRandomFanName = (sessionId: string) => {
  // Use session_id to generate consistent name for same user
  const hash = sessionId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return FAN_NAMES[Math.abs(hash) % FAN_NAMES.length];
};

export const LiveActivityFeed = () => {
  const [liveItems, setLiveItems] = useState<ActivityItem[]>([]);

  // Fetch recent predictions
  const { data: recentPredictions = [] } = useQuery({
    queryKey: ["recent-predictions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paper_predictions")
        .select("id, session_id, market_id, side, points_staked, created_at")
        .eq("tenant_id", "soccer-laduma")
        .order("created_at", { ascending: false })
        .limit(10);
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
      .channel('live-predictions')
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
          setLiveItems(prev => [newItem, ...prev.slice(0, 4)]);
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
  ).slice(0, 5);

  if (uniqueItems.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 border-[hsl(45,100%,50%)]/30 bg-gradient-to-br from-[hsl(45,100%,50%)]/5 to-transparent">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-[hsl(45,100%,50%)]" />
        <h3 className="font-semibold text-sm">Live Activity</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-green-500">Live</span>
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {uniqueItems.map((item, index) => {
            const fanName = getRandomFanName(item.session_id);
            const marketTitle = marketMap[item.market_id] || "a market";
            const isNew = liveItems.some(li => li.id === item.id);
            const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

            return (
              <motion.div
                key={item.id}
                initial={isNew ? { opacity: 0, x: -20, scale: 0.95 } : false}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 text-sm"
              >
                <Zap className={`h-3 w-3 flex-shrink-0 ${item.side === 'yes' ? 'text-green-500' : 'text-red-500'}`} />
                <span className="font-medium text-[hsl(45,100%,50%)]">{fanName}</span>
                <span className="text-muted-foreground">predicted</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs px-1.5 py-0 ${
                    item.side === 'yes' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {item.side.toUpperCase()}
                </Badge>
                <span className="text-muted-foreground truncate max-w-[120px]" title={marketTitle}>
                  on {marketTitle.length > 20 ? marketTitle.slice(0, 20) + '...' : marketTitle}
                </span>
                <span className="text-xs text-muted-foreground/60 ml-auto flex-shrink-0">
                  {timeAgo}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Card>
  );
};
