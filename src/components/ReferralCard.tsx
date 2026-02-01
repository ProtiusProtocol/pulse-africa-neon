import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Copy, Check, Gift, Share2 } from "lucide-react";
import { useReferralCode, useApplyReferralCode, useReferralStats } from "@/hooks/useReferral";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const ReferralCard = () => {
  const { data: referralData, isLoading } = useReferralCode();
  const { data: stats } = useReferralStats();
  const applyReferral = useApplyReferralCode();
  
  const [copied, setCopied] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputCode, setInputCode] = useState("");

  const referralCode = referralData?.referral_code || "";
  const referralCount = stats?.count || 0;
  const referralLink = `${window.location.origin}/soccer-laduma?ref=${referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `🏆 Join me on Soccer Laduma Predictions!\n\nPredict PSL match outcomes and compete on the leaderboard.\n\n🎁 Use my code ${referralCode} to get 100 bonus points!\n\n${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleApplyCode = async () => {
    if (!inputCode.trim()) return;
    
    try {
      await applyReferral.mutateAsync(inputCode);
      toast.success("Referral code applied! +100 bonus points!");
      setInputCode("");
      setShowInput(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to apply code");
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-20 bg-muted rounded" />
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-[hsl(45,100%,50%)]/10 to-[hsl(0,84%,50%)]/10 border-[hsl(45,100%,50%)]/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-[hsl(45,100%,50%)]" />
          Invite Friends
        </h2>
        <Badge variant="secondary" className="gap-1">
          <Gift className="h-3 w-3" />
          +100 pts each
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Share your code and both you and your friend get 100 bonus points!
      </p>

      {/* Referral Code Display */}
      <div className="bg-background/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Your Code</div>
            <div className="text-2xl font-mono font-bold text-[hsl(45,100%,50%)]">
              {referralCode}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={copyToClipboard}
              className="gap-1"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button 
              size="sm" 
              onClick={shareViaWhatsApp}
              className="bg-green-600 hover:bg-green-700 gap-1"
            >
              <Share2 className="h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {referralCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30"
        >
          <div className="text-3xl">🎉</div>
          <div>
            <div className="font-bold text-green-400">
              {referralCount} friend{referralCount > 1 ? 's' : ''} invited!
            </div>
            <div className="text-sm text-muted-foreground">
              You've earned {referralCount * 100} bonus points
            </div>
          </div>
        </motion.div>
      )}

      {/* Apply Code Section */}
      {!showInput ? (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowInput(true)}
          className="text-muted-foreground"
        >
          Have a referral code?
        </Button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex gap-2"
        >
          <Input
            placeholder="Enter code"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="font-mono uppercase"
            maxLength={8}
          />
          <Button 
            onClick={handleApplyCode}
            disabled={applyReferral.isPending || !inputCode.trim()}
          >
            {applyReferral.isPending ? "..." : "Apply"}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setShowInput(false)}
          >
            Cancel
          </Button>
        </motion.div>
      )}
    </Card>
  );
};
