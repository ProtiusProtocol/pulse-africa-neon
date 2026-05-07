import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/paperSession";

const REFERRAL_BONUS = 100;

export const useReferralCode = () => {
  const sessionId = getSessionId();

  return useQuery({
    queryKey: ["referral-code", sessionId],
    queryFn: async () => {
      // Read first
      const { data: existing } = await supabase
        .from("paper_leaderboard")
        .select("referral_code, referral_count")
        .eq("session_id", sessionId)
        .eq("tenant_id", "soccer-laduma")
        .maybeSingle();

      if (existing?.referral_code) return existing;

      // Ask backend to create/ensure
      const { data, error } = await supabase.functions.invoke("paper-trading-write", {
        body: { action: "ensure_referral_code", session_id: sessionId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return {
        referral_code: data.referral_code as string,
        referral_count: data.referral_count as number,
      };
    },
  });
};

export const useApplyReferralCode = () => {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

  return useMutation({
    mutationFn: async (referralCode: string) => {
      const { data, error } = await supabase.functions.invoke("paper-trading-write", {
        body: {
          action: "apply_referral_code",
          session_id: sessionId,
          referral_code: referralCode,
        },
      });
      if (error) throw error;
      if (data?.error) {
        const map: Record<string, string> = {
          already_referred: "You've already used a referral code",
          invalid_code: "Invalid referral code",
          self_referral: "You can't use your own referral code",
        };
        throw new Error(map[data.error] || data.error);
      }
      return { bonus: data?.bonus ?? REFERRAL_BONUS };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard-entry"] });
      queryClient.invalidateQueries({ queryKey: ["referral-code"] });
    },
  });
};

export const useReferralStats = () => {
  const sessionId = getSessionId();

  return useQuery({
    queryKey: ["referral-stats", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("id, created_at")
        .eq("referrer_session_id", sessionId)
        .eq("tenant_id", "soccer-laduma");

      if (error) throw error;

      return {
        count: data?.length || 0,
        referrals: data || [],
      };
    },
  });
};
