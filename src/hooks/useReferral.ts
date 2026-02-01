import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/paperSession";

const REFERRAL_BONUS = 100; // Points for both referrer and referee

export const useReferralCode = () => {
  const sessionId = getSessionId();
  
  return useQuery({
    queryKey: ["referral-code", sessionId],
    queryFn: async () => {
      // First try to get existing code
      const { data: existing } = await supabase
        .from("paper_leaderboard")
        .select("referral_code, referral_count")
        .eq("session_id", sessionId)
        .eq("tenant_id", "soccer-laduma")
        .maybeSingle();

      if (existing?.referral_code) {
        return existing;
      }

      // Generate new code if doesn't exist
      const newCode = sessionId.substring(0, 8).toUpperCase();
      
      // Try to update existing entry with new code
      const { data: updated, error } = await supabase
        .from("paper_leaderboard")
        .update({ referral_code: newCode })
        .eq("session_id", sessionId)
        .eq("tenant_id", "soccer-laduma")
        .select("referral_code, referral_count")
        .maybeSingle();

      if (updated) {
        return updated;
      }

      // If no entry exists, create one
      const { data: created } = await supabase
        .from("paper_leaderboard")
        .insert({
          session_id: sessionId,
          tenant_id: "soccer-laduma",
          referral_code: newCode,
          display_name: "Anonymous Fan"
        })
        .select("referral_code, referral_count")
        .single();

      return created;
    },
  });
};

export const useApplyReferralCode = () => {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

  return useMutation({
    mutationFn: async (referralCode: string) => {
      // Check if already referred
      const { data: existingReferral } = await supabase
        .from("referrals")
        .select("id")
        .eq("referee_session_id", sessionId)
        .maybeSingle();

      if (existingReferral) {
        throw new Error("You've already used a referral code");
      }

      // Find the referrer
      const { data: referrer, error: referrerError } = await supabase
        .from("paper_leaderboard")
        .select("session_id, total_points, referral_count")
        .eq("referral_code", referralCode.toUpperCase())
        .eq("tenant_id", "soccer-laduma")
        .maybeSingle();

      if (!referrer) {
        throw new Error("Invalid referral code");
      }

      if (referrer.session_id === sessionId) {
        throw new Error("You can't use your own referral code");
      }

      // Create referral record
      const { error: referralError } = await supabase
        .from("referrals")
        .insert({
          referrer_session_id: referrer.session_id,
          referee_session_id: sessionId,
          referral_code: referralCode.toUpperCase(),
          tenant_id: "soccer-laduma",
          bonus_awarded: true
        });

      if (referralError) throw referralError;

      // Award bonus to referrer
      await supabase
        .from("paper_leaderboard")
        .update({ 
          total_points: referrer.total_points + REFERRAL_BONUS,
          referral_count: (referrer.referral_count || 0) + 1
        })
        .eq("session_id", referrer.session_id)
        .eq("tenant_id", "soccer-laduma");

      // Award bonus to referee (current user)
      const { data: currentUser } = await supabase
        .from("paper_leaderboard")
        .select("total_points")
        .eq("session_id", sessionId)
        .eq("tenant_id", "soccer-laduma")
        .maybeSingle();

      if (currentUser) {
        await supabase
          .from("paper_leaderboard")
          .update({ 
            total_points: currentUser.total_points + REFERRAL_BONUS,
            referred_by: referralCode.toUpperCase()
          })
          .eq("session_id", sessionId)
          .eq("tenant_id", "soccer-laduma");
      }

      return { bonus: REFERRAL_BONUS };
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
        referrals: data || []
      };
    },
  });
};
