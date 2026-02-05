 import { motion } from "framer-motion";
 import { Flame, Coins, Gift } from "lucide-react";
 import { useCardPointsStats, useCanClaimDailyCard } from "@/hooks/useCardPoints";
 import { Badge } from "@/components/ui/badge";
 
 interface CardPointsDisplayProps {
   onCardHuntClick?: () => void;
   size?: "sm" | "md" | "lg";
 }
 
 export function CardPointsDisplay({ onCardHuntClick, size = "md" }: CardPointsDisplayProps) {
   const { data: stats } = useCardPointsStats();
   const canClaim = useCanClaimDailyCard();
 
   const cardPoints = stats?.card_points ?? 0;
   const streak = stats?.card_streak_current ?? 0;
 
   const sizeClasses = {
     sm: "p-2 text-sm",
     md: "p-3",
     lg: "p-4 text-lg",
   };
 
   return (
     <div className={`flex items-center gap-3 ${sizeClasses[size]}`}>
       {/* Card Points */}
       <div className="flex items-center gap-2">
         <div className="p-1.5 rounded-lg bg-gradient-to-br from-[hsl(45,100%,50%)]/20 to-[hsl(45,100%,40%)]/20">
           <Coins className="h-4 w-4 text-[hsl(45,100%,50%)]" />
         </div>
         <div>
           <div className="font-bold text-[hsl(45,100%,50%)]">{cardPoints.toLocaleString()}</div>
           <div className="text-[10px] text-muted-foreground leading-tight">Card Points</div>
         </div>
       </div>
 
       {/* Streak */}
       {streak >= 2 && (
         <Badge variant="outline" className="border-orange-500/50 text-orange-500 gap-1">
           <Flame className="h-3 w-3" />
           {streak}
         </Badge>
       )}
 
       {/* Daily Card Button */}
       {canClaim && onCardHuntClick && (
         <motion.button
           onClick={onCardHuntClick}
           animate={{ scale: [1, 1.05, 1] }}
           transition={{ repeat: Infinity, duration: 2 }}
           className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[hsl(0,84%,50%)] to-[hsl(0,84%,40%)] text-white text-xs font-medium shadow-lg hover:shadow-xl transition-shadow"
         >
           <Gift className="h-3.5 w-3.5" />
           Claim Card
         </motion.button>
       )}
     </div>
   );
 }