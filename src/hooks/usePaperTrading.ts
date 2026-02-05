import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/paperSession";

export interface PaperPrediction {
  id: string;
  session_id: string;
  market_id: string;
  side: "yes" | "no";
  points_staked: number;
  points_won: number | null;
  status: "pending" | "won" | "lost";
  tenant_id: string;
  created_at: string;
  resolved_at: string | null;
}

export interface LeaderboardEntry {
  id: string;
  session_id: string;
  display_name: string;
  tenant_id: string;
  total_points: number;
  predictions_made: number;
  predictions_won: number;
  predictions_lost: number;
  accuracy_pct: number | null;
  weekly_points: number;
  weekly_rank: number | null;
  all_time_rank: number | null;
  streak_current: number;
  streak_best: number;
  xp_total: number;
  level: number;
   card_points: number;
   card_streak_current: number;
   card_streak_best: number;
   last_card_claim: string | null;
}

const TENANT_ID = "soccer-laduma";

export function usePaperPredictions() {
  const sessionId = getSessionId();

  return useQuery({
    queryKey: ["paper-predictions", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paper_predictions")
        .select("*")
        .eq("session_id", sessionId)
        .eq("tenant_id", TENANT_ID)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PaperPrediction[];
    },
  });
}

export function useLeaderboardEntry() {
  const sessionId = getSessionId();

  return useQuery({
    queryKey: ["leaderboard-entry", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paper_leaderboard")
        .select("*")
        .eq("session_id", sessionId)
        .eq("tenant_id", TENANT_ID)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      return data as LeaderboardEntry | null;
    },
  });
}

export function useLeaderboard(limit = 50) {
  return useQuery({
    queryKey: ["leaderboard", TENANT_ID, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paper_leaderboard")
        .select("*")
        .eq("tenant_id", TENANT_ID)
        .order("total_points", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as LeaderboardEntry[];
    },
  });
}

export function useMakePrediction() {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

  return useMutation({
    mutationFn: async ({ marketId, side }: { marketId: string; side: "yes" | "no" }) => {
      // First, ensure user has a leaderboard entry
      const { data: existingEntry } = await supabase
        .from("paper_leaderboard")
        .select("id, total_points, predictions_made")
        .eq("session_id", sessionId)
        .eq("tenant_id", TENANT_ID)
        .single();

      const pointsToStake = 50;

      if (!existingEntry) {
        // Create new leaderboard entry with starting points
        const { error: createError } = await supabase
          .from("paper_leaderboard")
          .insert({
            session_id: sessionId,
            tenant_id: TENANT_ID,
            total_points: 1000 - pointsToStake,
            predictions_made: 1,
          });
        if (createError) throw createError;
      } else {
        // Update existing entry
        const { error: updateError } = await supabase
          .from("paper_leaderboard")
          .update({
            total_points: existingEntry.total_points - pointsToStake,
            predictions_made: existingEntry.predictions_made + 1,
          })
          .eq("id", existingEntry.id);
        if (updateError) throw updateError;
      }

      // Insert the prediction
      const { data, error } = await supabase
        .from("paper_predictions")
        .insert({
          session_id: sessionId,
          market_id: marketId,
          side,
          points_staked: pointsToStake,
          tenant_id: TENANT_ID,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paper-predictions"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-entry"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["signal-universe"] });
    },
  });
}

export function useHasPredicted(marketId: string) {
  const { data: predictions } = usePaperPredictions();
  return predictions?.some((p) => p.market_id === marketId) || false;
}

export function useGetPrediction(marketId: string) {
  const { data: predictions } = usePaperPredictions();
  return predictions?.find((p) => p.market_id === marketId);
}
