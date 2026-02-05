 import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { getSessionId } from "@/lib/paperSession";
 
 export interface FanCard {
   id: string;
   code: string;
   name: string;
   description: string | null;
   image_url: string | null;
   rarity: "common" | "rare" | "epic" | "legendary";
   cp_value: number;
   category: string;
   team: string | null;
   is_active: boolean;
 }
 
 export interface UserCard {
   id: string;
   session_id: string;
   card_id: string;
   tenant_id: string;
   acquired_at: string;
   is_new: boolean;
   card?: FanCard;
 }
 
 export interface CardSet {
   id: string;
   code: string;
   name: string;
   description: string | null;
   card_codes: string[];
   bonus_cp: number;
   badge_icon: string;
   is_active: boolean;
 }
 
 export interface CardPointsStats {
   card_points: number;
   card_streak_current: number;
   card_streak_best: number;
   last_card_claim: string | null;
 }
 
 const TENANT_ID = "soccer-laduma";
 
 // Rarity drop weights
 const RARITY_WEIGHTS = {
   common: 60,
   rare: 25,
   epic: 12,
   legendary: 3,
 };
 
 // CP values by rarity
 export const RARITY_CP_VALUES = {
   common: 10,
   rare: 25,
   epic: 75,
   legendary: 200,
 };
 
 export const RARITY_COLORS = {
   common: "from-gray-400 to-gray-500",
   rare: "from-blue-400 to-blue-600",
   epic: "from-purple-400 to-purple-600",
   legendary: "from-yellow-400 to-orange-500",
 };
 
 export const RARITY_GLOW = {
   common: "",
   rare: "shadow-blue-500/50",
   epic: "shadow-purple-500/50",
   legendary: "shadow-yellow-500/50 animate-pulse",
 };
 
 // Get card points stats from leaderboard entry
 export function useCardPointsStats() {
   const sessionId = getSessionId();
 
   return useQuery({
     queryKey: ["card-points-stats", sessionId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("paper_leaderboard")
         .select("card_points, card_streak_current, card_streak_best, last_card_claim")
         .eq("session_id", sessionId)
         .eq("tenant_id", TENANT_ID)
         .single();
 
       if (error && error.code !== "PGRST116") throw error;
       return (data as CardPointsStats) || {
         card_points: 0,
         card_streak_current: 0,
         card_streak_best: 0,
         last_card_claim: null,
       };
     },
   });
 }
 
 // Get all available cards
 export function useAvailableCards() {
   return useQuery({
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
 }
 
 // Get user's card collection
 export function useUserCards() {
   const sessionId = getSessionId();
 
   return useQuery({
     queryKey: ["user-cards", sessionId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("user_cards")
         .select("*, card:fan_cards(*)")
         .eq("session_id", sessionId)
         .eq("tenant_id", TENANT_ID)
         .order("acquired_at", { ascending: false });
 
       if (error) throw error;
       return data as (UserCard & { card: FanCard })[];
     },
   });
 }
 
 // Get all card sets
 export function useCardSets() {
   return useQuery({
     queryKey: ["card-sets"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("card_sets")
         .select("*")
         .eq("is_active", true);
 
       if (error) throw error;
       return data as CardSet[];
     },
   });
 }
 
 // Check if user can claim daily card (once per day)
 export function useCanClaimDailyCard() {
   const { data: stats } = useCardPointsStats();
   
   if (!stats?.last_card_claim) return true;
   
   const lastClaim = new Date(stats.last_card_claim);
   const now = new Date();
   
   // Reset at midnight UTC
   const lastClaimDate = lastClaim.toISOString().split('T')[0];
   const todayDate = now.toISOString().split('T')[0];
   
   return lastClaimDate !== todayDate;
 }
 
 // Claim daily card
 export function useClaimDailyCard() {
   const queryClient = useQueryClient();
   const sessionId = getSessionId();
 
   return useMutation({
     mutationFn: async () => {
       // Get available cards
       const { data: cards, error: cardsError } = await supabase
         .from("fan_cards")
         .select("*")
         .eq("is_active", true);
 
       if (cardsError) throw cardsError;
       if (!cards || cards.length === 0) throw new Error("No cards available");
 
       // Weighted random selection by rarity
       const weightedCards: FanCard[] = [];
       cards.forEach((card) => {
         const weight = RARITY_WEIGHTS[card.rarity as keyof typeof RARITY_WEIGHTS] || 1;
         for (let i = 0; i < weight; i++) {
           weightedCards.push(card as FanCard);
         }
       });
 
       const selectedCard = weightedCards[Math.floor(Math.random() * weightedCards.length)];
 
       // Get current stats
       const { data: currentStats, error: statsError } = await supabase
         .from("paper_leaderboard")
         .select("id, card_points, card_streak_current, card_streak_best, last_card_claim")
         .eq("session_id", sessionId)
         .eq("tenant_id", TENANT_ID)
         .single();
 
       if (statsError && statsError.code !== "PGRST116") throw statsError;
 
       const now = new Date();
       let newStreak = 1;
       let streakBonus = 0;
 
       if (currentStats?.last_card_claim) {
         const lastClaim = new Date(currentStats.last_card_claim);
         const hoursSinceClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
         
         // If claimed within 48 hours, continue streak
         if (hoursSinceClaim < 48) {
           newStreak = (currentStats.card_streak_current || 0) + 1;
           // Streak bonus: +5 CP per day of streak (max +50)
           streakBonus = Math.min(newStreak * 5, 50);
         }
       }
 
       const cpEarned = selectedCard.cp_value + streakBonus;
       const newCardPoints = (currentStats?.card_points || 0) + cpEarned;
       const newStreakBest = Math.max(newStreak, currentStats?.card_streak_best || 0);
 
       // Update or create leaderboard entry
       if (currentStats) {
         const { error: updateError } = await supabase
           .from("paper_leaderboard")
           .update({
             card_points: newCardPoints,
             card_streak_current: newStreak,
             card_streak_best: newStreakBest,
             last_card_claim: now.toISOString(),
           })
           .eq("id", currentStats.id);
 
         if (updateError) throw updateError;
       } else {
         const { error: insertError } = await supabase
           .from("paper_leaderboard")
           .insert({
             session_id: sessionId,
             tenant_id: TENANT_ID,
             card_points: cpEarned,
             card_streak_current: 1,
             card_streak_best: 1,
             last_card_claim: now.toISOString(),
           });
 
         if (insertError) throw insertError;
       }
 
       // Add card to user collection
       const { error: cardError } = await supabase
         .from("user_cards")
         .insert({
           session_id: sessionId,
           card_id: selectedCard.id,
           tenant_id: TENANT_ID,
         });
 
       if (cardError) throw cardError;
 
       return {
         card: selectedCard,
         cpEarned,
         streakBonus,
         newStreak,
         isNewStreakBest: newStreak > (currentStats?.card_streak_best || 0),
       };
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["card-points-stats"] });
       queryClient.invalidateQueries({ queryKey: ["user-cards"] });
       queryClient.invalidateQueries({ queryKey: ["leaderboard-entry"] });
     },
   });
 }
 
 // Mark cards as seen (not new)
 export function useMarkCardsSeen() {
   const queryClient = useQueryClient();
   const sessionId = getSessionId();
 
   return useMutation({
     mutationFn: async () => {
       const { error } = await supabase
         .from("user_cards")
         .update({ is_new: false })
         .eq("session_id", sessionId)
         .eq("tenant_id", TENANT_ID)
         .eq("is_new", true);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["user-cards"] });
     },
   });
 }