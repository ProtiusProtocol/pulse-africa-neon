import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Coins, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/paperSession";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface DemoSettingsPanelProps {
  currentName?: string;
  currentPoints?: number;
}

export const DemoSettingsPanel = ({ currentName = "Anonymous Fan", currentPoints = 1000 }: DemoSettingsPanelProps) => {
  const [nickname, setNickname] = useState(currentName);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingPoints, setIsAddingPoints] = useState(false);
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

  const handleUpdateNickname = async () => {
    if (!nickname.trim() || nickname.trim().length < 2) {
      toast.error("Nickname must be at least 2 characters");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("paper_leaderboard")
        .update({ display_name: nickname.trim() })
        .eq("session_id", sessionId);

      if (error) throw error;

      toast.success(`Nickname updated to "${nickname.trim()}"!`);
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-entry"] });
    } catch (error) {
      console.error("Error updating nickname:", error);
      toast.error("Failed to update nickname");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddBonusPoints = async (amount: number) => {
    setIsAddingPoints(true);
    try {
      const { data: current, error: fetchError } = await supabase
        .from("paper_leaderboard")
        .select("total_points")
        .eq("session_id", sessionId)
        .single();

      if (fetchError) throw fetchError;

      const newTotal = (current?.total_points ?? 1000) + amount;

      const { error } = await supabase
        .from("paper_leaderboard")
        .update({ total_points: newTotal })
        .eq("session_id", sessionId);

      if (error) throw error;

      toast.success(`Added ${amount} bonus PP! Total: ${newTotal.toLocaleString()}`);
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard-entry"] });
    } catch (error) {
      console.error("Error adding bonus points:", error);
      toast.error("Failed to add bonus points");
    } finally {
      setIsAddingPoints(false);
    }
  };

  return (
    <Card className="p-4 border-dashed border-2 border-orange-500/30 bg-orange-500/5">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5 text-orange-500" />
        <h3 className="font-bold text-orange-500">Demo Settings</h3>
        <Badge variant="outline" className="text-orange-500 border-orange-500/50 text-xs">
          Testing Only
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Nickname Editor */}
        <div className="space-y-2">
          <Label htmlFor="nickname" className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            Display Name
          </Label>
          <div className="flex gap-2">
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname..."
              maxLength={20}
              className="flex-1"
            />
            <Button 
              onClick={handleUpdateNickname} 
              disabled={isUpdating || nickname === currentName}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Choose a fun name like "ChiefsForever" or "BafanaPride"
          </p>
        </div>

        {/* Bonus Points */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <Coins className="h-4 w-4" />
            Bonus Prediction Points
          </Label>
          <div className="flex gap-2">
            <Button
              onClick={() => handleAddBonusPoints(500)}
              disabled={isAddingPoints}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              +500 PP
            </Button>
            <Button
              onClick={() => handleAddBonusPoints(1000)}
              disabled={isAddingPoints}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              +1000 PP
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add test points to place more predictions
          </p>
        </div>
      </div>
    </Card>
  );
};
