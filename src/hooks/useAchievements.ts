import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/paperSession";

const TENANT_ID = "soccer-laduma";

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
  requirement_type: string;
  requirement_value: number;
}

export interface UserAchievement {
  id: string;
  session_id: string;
  achievement_id: string;
  tenant_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("xp_reward", { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
  });
}

export function useUserAchievements() {
  const sessionId = getSessionId();

  return useQuery({
    queryKey: ["user-achievements", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq("session_id", sessionId)
        .eq("tenant_id", TENANT_ID)
        .order("unlocked_at", { ascending: false });

      if (error) throw error;
      return data as (UserAchievement & { achievement: Achievement })[];
    },
  });
}

export function useAchievementProgress() {
  const { data: achievements = [] } = useAchievements();
  const { data: userAchievements = [] } = useUserAchievements();

  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

  const achievementsWithStatus = achievements.map(achievement => ({
    ...achievement,
    unlocked: unlockedIds.has(achievement.id),
    unlockedAt: userAchievements.find(ua => ua.achievement_id === achievement.id)?.unlocked_at,
  }));

  const unlockedCount = achievementsWithStatus.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return {
    achievements: achievementsWithStatus,
    unlockedCount,
    totalCount,
    progressPercent,
  };
}
