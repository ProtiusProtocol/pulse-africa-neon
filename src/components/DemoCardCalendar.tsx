import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar, Gift, RotateCcw, Sparkles, Star, Flame, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/paperSession";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { RARITY_COLORS, RARITY_GLOW, FanCard } from "@/hooks/useCardPoints";
import { Confetti } from "@/components/gamification/Confetti";

const TENANT_ID = "soccer-laduma";

const DAYS_OF_WEEK = [
  { short: "Mon", full: "Monday" },
  { short: "Tue", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thu", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
  { short: "Sun", full: "Sunday" },
];

// Demo-specific: Track claimed days in localStorage
const DEMO_CLAIMED_KEY = "demo-claimed-days";

function getDemoClaimedDays(): number[] {
  try {
    const stored = localStorage.getItem(DEMO_CLAIMED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setDemoClaimedDays(days: number[]) {
  localStorage.setItem(DEMO_CLAIMED_KEY, JSON.stringify(days));
}

function clearDemoClaimedDays() {
  localStorage.removeItem(DEMO_CLAIMED_KEY);
}

// Rarity drop weights
const RARITY_WEIGHTS = {
  common: 60,
  rare: 25,
  epic: 12,
  legendary: 3,
};

type RevealState = "idle" | "revealing" | "revealed";

export function DemoCardCalendar() {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();
  const [claimedDays, setClaimedDaysState] = useState<number[]>(getDemoClaimedDays());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [revealState, setRevealState] = useState<RevealState>("idle");
  const [revealedCard, setRevealedCard] = useState<FanCard | null>(null);
  const [cpEarned, setCpEarned] = useState(0);
  const [streakBonus, setStreakBonus] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Fetch available cards
  const { data: cards = [] } = useQuery({
    queryKey: ["fan-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fan_cards")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as FanCard[];
    },
  });

  const claimCard = useMutation({
    mutationFn: async (dayIndex: number) => {
      if (cards.length === 0) throw new Error("No cards available");

      // Weighted random selection
      const weightedCards: FanCard[] = [];
      cards.forEach((card) => {
        const weight = RARITY_WEIGHTS[card.rarity as keyof typeof RARITY_WEIGHTS] || 1;
        for (let i = 0; i < weight; i++) {
          weightedCards.push(card);
        }
      });

      const selectedCard = weightedCards[Math.floor(Math.random() * weightedCards.length)];

      // Calculate streak based on consecutive days claimed
      const newClaimedDays = [...claimedDays, dayIndex].sort((a, b) => a - b);
      let currentStreak = 1;
      for (let i = newClaimedDays.indexOf(dayIndex) - 1; i >= 0; i--) {
        if (newClaimedDays[i] === newClaimedDays[i + 1] - 1) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      const streakBonusAmount = Math.min(currentStreak * 5, 50);
      const totalCp = selectedCard.cp_value + streakBonusAmount;

      // Update leaderboard card_points
      const { data: currentStats, error: statsError } = await supabase
        .from("paper_leaderboard")
        .select("id, card_points, card_streak_current, card_streak_best")
        .eq("session_id", sessionId)
        .eq("tenant_id", TENANT_ID)
        .single();

      if (statsError && statsError.code !== "PGRST116") throw statsError;

      const newCardPoints = (currentStats?.card_points || 0) + totalCp;
      const newStreakBest = Math.max(currentStreak, currentStats?.card_streak_best || 0);

      if (currentStats) {
        const { error: updateError } = await supabase
          .from("paper_leaderboard")
          .update({
            card_points: newCardPoints,
            card_streak_current: currentStreak,
            card_streak_best: newStreakBest,
            last_card_claim: new Date().toISOString(),
          })
          .eq("id", currentStats.id);

        if (updateError) throw updateError;
      }

      // Add card to collection
      const { error: cardError } = await supabase
        .from("user_cards")
        .insert({
          session_id: sessionId,
          card_id: selectedCard.id,
          tenant_id: TENANT_ID,
        });

      if (cardError) throw cardError;

      // Update local state
      setDemoClaimedDays(newClaimedDays);
      setClaimedDaysState(newClaimedDays);

      return {
        card: selectedCard,
        cpEarned: totalCp,
        streakBonus: streakBonusAmount,
        streak: currentStreak,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-points-stats"] });
      queryClient.invalidateQueries({ queryKey: ["user-cards"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-entry"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  const handleDayClick = async (dayIndex: number) => {
    if (claimedDays.includes(dayIndex)) return;
    if (cards.length === 0) {
      toast.error("No cards available yet");
      return;
    }

    setSelectedDay(dayIndex);
    setRevealState("revealing");

    try {
      const result = await claimCard.mutateAsync(dayIndex);

      setTimeout(() => {
        setRevealedCard(result.card);
        setCpEarned(result.cpEarned);
        setStreakBonus(result.streakBonus);
        setRevealState("revealed");

        if (result.card.rarity !== "common") {
          setShowConfetti(true);
        }
      }, 1500);
    } catch (error) {
      console.error("Failed to claim card:", error);
      toast.error("Failed to claim card");
      setSelectedDay(null);
      setRevealState("idle");
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      // Clear demo claimed days
      clearDemoClaimedDays();
      setClaimedDaysState([]);

      // Delete all user cards for this session
      const { error: deleteCardsError } = await supabase
        .from("user_cards")
        .delete()
        .eq("session_id", sessionId)
        .eq("tenant_id", TENANT_ID);

      if (deleteCardsError) throw deleteCardsError;

      // Reset card points in leaderboard
      const { error: updateError } = await supabase
        .from("paper_leaderboard")
        .update({
          card_points: 0,
          card_streak_current: 0,
          last_card_claim: null,
        })
        .eq("session_id", sessionId)
        .eq("tenant_id", TENANT_ID);

      if (updateError) throw updateError;

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["card-points-stats"] });
      queryClient.invalidateQueries({ queryKey: ["user-cards"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-entry"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });

      toast.success("Demo reset! You can claim cards again for all days.");
    } catch (error) {
      console.error("Reset failed:", error);
      toast.error("Failed to reset demo");
    } finally {
      setIsResetting(false);
    }
  };

  const closeRevealModal = () => {
    setSelectedDay(null);
    setRevealState("idle");
    setRevealedCard(null);
    setCpEarned(0);
    setStreakBonus(0);
    setShowConfetti(false);
  };

  const getRarityLabel = (rarity: string) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "⭐";
      case "epic": return "💎";
      case "rare": return "🔷";
      default: return "⚪";
    }
  };

  return (
    <>
      <Card className="p-4 border-dashed border-2 border-purple-500/30 bg-purple-500/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            <h3 className="font-bold text-purple-500">Demo Card Week</h3>
            <Badge variant="outline" className="text-purple-500 border-purple-500/50 text-xs">
              {claimedDays.length}/7 Claimed
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isResetting || claimedDays.length === 0}
            className="text-purple-500 border-purple-500/50 hover:bg-purple-500/10"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            {isResetting ? "Resetting..." : "Reset Week"}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Simulate a full week of card collection! Click each day to claim a card.
        </p>

        {/* Day Grid */}
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day, index) => {
            const isClaimed = claimedDays.includes(index);
            const isConsecutive = index > 0 && claimedDays.includes(index - 1) && claimedDays.includes(index);

            return (
              <motion.button
                key={day.short}
                onClick={() => handleDayClick(index)}
                disabled={isClaimed || claimCard.isPending}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                  isClaimed
                    ? "bg-green-500/20 border-2 border-green-500/50"
                    : "bg-muted/50 border-2 border-dashed border-muted-foreground/30 hover:border-purple-500/50 hover:bg-purple-500/10 cursor-pointer"
                }`}
                whileHover={!isClaimed ? { scale: 1.05 } : {}}
                whileTap={!isClaimed ? { scale: 0.95 } : {}}
              >
                <span className="text-xs font-medium text-muted-foreground">{day.short}</span>
                {isClaimed ? (
                  <Check className="h-5 w-5 text-green-500 mt-1" />
                ) : (
                  <Gift className="h-5 w-5 text-purple-400 mt-1" />
                )}
                {isConsecutive && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                    <Flame className="h-3 w-3 text-white" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {claimedDays.length === 7 ? "🎉 Full week complete!" : `${7 - claimedDays.length} days remaining`}
          </span>
          {claimedDays.length >= 2 && (
            <span className="text-orange-500 flex items-center gap-1">
              <Flame className="h-3 w-3" />
              Streak bonuses active!
            </span>
          )}
        </div>
      </Card>

      {/* Reveal Modal */}
      <Dialog open={selectedDay !== null && revealState !== "idle"} onOpenChange={closeRevealModal}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-gradient-to-b from-background to-muted border-2">
          <Confetti isActive={showConfetti} />
          
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-3">
                <Gift className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">
                  {selectedDay !== null ? DAYS_OF_WEEK[selectedDay].full : ""} Card
                </span>
              </div>
              <h2 className="text-xl font-bold">
                {revealState === "revealing" && "Revealing..."}
                {revealState === "revealed" && "You Got It!"}
              </h2>
            </div>

            {/* Card Area */}
            <div className="relative aspect-[3/4] max-w-[200px] mx-auto mb-6">
              <AnimatePresence mode="wait">
                {revealState === "revealing" && (
                  <motion.div
                    key="revealing"
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: [0, 180, 360], scale: [0.8, 1.2, 1] }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-white/50 shadow-2xl flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Star className="h-16 w-16 text-white" />
                    </motion.div>
                  </motion.div>
                )}

                {revealState === "revealed" && revealedCard && (
                  <motion.div
                    key="revealed"
                    initial={{ scale: 0, rotateY: -90 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                    className={`absolute inset-0 rounded-xl overflow-hidden bg-gradient-to-br ${RARITY_COLORS[revealedCard.rarity]} border-4 border-white/30 shadow-2xl ${RARITY_GLOW[revealedCard.rarity]}`}
                  >
                    {/* Card Image */}
                    {revealedCard.image_url ? (
                      <img 
                        src={revealedCard.image_url} 
                        alt={revealedCard.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl">{getRarityIcon(revealedCard.rarity)}</span>
                      </div>
                    )}
                    
                    {/* Gradient Overlay for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Card Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium mb-1">
                        {getRarityIcon(revealedCard.rarity)} {getRarityLabel(revealedCard.rarity)}
                      </div>
                      <p className="text-white font-bold text-sm drop-shadow-lg">{revealedCard.name}</p>
                      <p className="text-white/80 text-xs">{revealedCard.team || revealedCard.category}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rewards */}
            {revealState === "revealed" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-black text-purple-500">+{cpEarned}</div>
                    <div className="text-xs text-muted-foreground">Card Points</div>
                  </div>
                  {streakBonus > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-500 flex items-center gap-1">
                        <Flame className="h-4 w-4" />
                        +{streakBonus}
                      </div>
                      <div className="text-xs text-muted-foreground">Streak Bonus</div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={closeRevealModal}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold"
                >
                  Awesome!
                </Button>
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
