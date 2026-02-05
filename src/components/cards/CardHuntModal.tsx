 import { useState, useEffect } from "react";
 import { Dialog, DialogContent } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { motion, AnimatePresence } from "framer-motion";
 import { Sparkles, Gift, Flame, Star } from "lucide-react";
 import { useClaimDailyCard, useCanClaimDailyCard, RARITY_COLORS, RARITY_GLOW, FanCard } from "@/hooks/useCardPoints";
 import { Confetti } from "@/components/gamification/Confetti";
 
 interface CardHuntModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 type RevealState = "idle" | "revealing" | "revealed";
 
 export function CardHuntModal({ open, onOpenChange }: CardHuntModalProps) {
   const [revealState, setRevealState] = useState<RevealState>("idle");
   const [revealedCard, setRevealedCard] = useState<FanCard | null>(null);
   const [cpEarned, setCpEarned] = useState(0);
   const [streakBonus, setStreakBonus] = useState(0);
   const [newStreak, setNewStreak] = useState(0);
   const [showConfetti, setShowConfetti] = useState(false);
   
   const canClaim = useCanClaimDailyCard();
   const claimCard = useClaimDailyCard();
 
   useEffect(() => {
     if (!open) {
       // Reset state when modal closes
       setTimeout(() => {
         setRevealState("idle");
         setRevealedCard(null);
         setCpEarned(0);
         setStreakBonus(0);
         setNewStreak(0);
         setShowConfetti(false);
       }, 300);
     }
   }, [open]);
 
   const handleClaim = async () => {
     setRevealState("revealing");
     
     try {
       const result = await claimCard.mutateAsync();
       
       // Delay reveal for suspense
       setTimeout(() => {
         setRevealedCard(result.card);
         setCpEarned(result.cpEarned);
         setStreakBonus(result.streakBonus);
         setNewStreak(result.newStreak);
         setRevealState("revealed");
         
         // Confetti for rare+ cards
         if (result.card.rarity !== "common") {
           setShowConfetti(true);
         }
       }, 1500);
     } catch (error) {
       console.error("Failed to claim card:", error);
       setRevealState("idle");
     }
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
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-gradient-to-b from-background to-muted border-2">
         <Confetti isActive={showConfetti} />
         
         <div className="p-6">
           {/* Header */}
           <div className="text-center mb-6">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[hsl(45,100%,50%)]/20 to-[hsl(0,84%,50%)]/20 border border-[hsl(45,100%,50%)]/30 mb-3">
               <Gift className="h-4 w-4 text-[hsl(45,100%,50%)]" />
               <span className="text-sm font-medium">Daily Card Hunt</span>
             </div>
             <h2 className="text-xl font-bold">
               {revealState === "idle" && "Claim Your Daily Card!"}
               {revealState === "revealing" && "Revealing..."}
               {revealState === "revealed" && "You Got It!"}
             </h2>
           </div>
 
           {/* Card Area */}
           <div className="relative aspect-[3/4] max-w-[200px] mx-auto mb-6">
             <AnimatePresence mode="wait">
               {revealState === "idle" && (
                 <motion.div
                   key="mystery"
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   exit={{ scale: 1.1, opacity: 0, rotateY: 90 }}
                   className="absolute inset-0 rounded-xl bg-gradient-to-br from-[hsl(0,84%,40%)] to-[hsl(0,84%,25%)] border-4 border-[hsl(45,100%,50%)]/50 shadow-2xl flex items-center justify-center cursor-pointer"
                   onClick={canClaim ? handleClaim : undefined}
                 >
                   <div className="text-center">
                     <motion.div
                       animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                       transition={{ repeat: Infinity, duration: 2 }}
                     >
                       <Sparkles className="h-16 w-16 text-[hsl(45,100%,50%)] mx-auto" />
                     </motion.div>
                     <p className="text-white/80 text-sm mt-2">Tap to Reveal</p>
                   </div>
                 </motion.div>
               )}
 
               {revealState === "revealing" && (
                 <motion.div
                   key="revealing"
                   initial={{ rotateY: 90 }}
                   animate={{ rotateY: [90, 180, 270, 360], scale: [0.8, 1.2, 0.9, 1] }}
                   transition={{ duration: 1.5, ease: "easeInOut" }}
                   className="absolute inset-0 rounded-xl bg-gradient-to-br from-[hsl(45,100%,50%)] to-[hsl(45,100%,40%)] border-4 border-white/50 shadow-2xl flex items-center justify-center"
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
                   className={`absolute inset-0 rounded-xl bg-gradient-to-br ${RARITY_COLORS[revealedCard.rarity]} border-4 border-white/30 shadow-2xl ${RARITY_GLOW[revealedCard.rarity]} flex flex-col items-center justify-center p-4`}
                 >
                   <span className="text-4xl mb-2">{getRarityIcon(revealedCard.rarity)}</span>
                   <p className="text-white font-bold text-center text-sm">{revealedCard.name}</p>
                   <p className="text-white/70 text-xs mt-1">{revealedCard.team || revealedCard.category}</p>
                   <div className="mt-3 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
                     {getRarityLabel(revealedCard.rarity)}
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
 
           {/* Rewards Display */}
           {revealState === "revealed" && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="space-y-3"
             >
               <div className="flex items-center justify-center gap-4">
                 <div className="text-center">
                   <div className="text-2xl font-black text-[hsl(45,100%,50%)]">+{cpEarned}</div>
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
 
               {newStreak >= 2 && (
                 <div className="flex items-center justify-center gap-2 text-orange-500">
                   <Flame className="h-5 w-5" />
                   <span className="font-bold">{newStreak} Day Streak!</span>
                 </div>
               )}
             </motion.div>
           )}
 
           {/* Action Button */}
           <div className="mt-6">
             {revealState === "idle" && (
               <Button
                 onClick={handleClaim}
                 disabled={!canClaim || claimCard.isPending}
                 className="w-full bg-gradient-to-r from-[hsl(0,84%,50%)] to-[hsl(0,84%,40%)] hover:from-[hsl(0,84%,45%)] hover:to-[hsl(0,84%,35%)] text-white font-bold py-6"
               >
                 {canClaim ? (
                   <>
                     <Gift className="h-5 w-5 mr-2" />
                     Claim Daily Card
                   </>
                 ) : (
                   "Come Back Tomorrow!"
                 )}
               </Button>
             )}
 
             {revealState === "revealed" && (
               <Button
                 onClick={() => onOpenChange(false)}
                 className="w-full bg-[hsl(45,100%,50%)] hover:bg-[hsl(45,100%,45%)] text-black font-bold"
               >
                 Awesome!
               </Button>
             )}
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }