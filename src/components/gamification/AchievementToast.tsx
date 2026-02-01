import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

interface AchievementToastProps {
  achievement: Achievement | null;
  isVisible: boolean;
  onClose: () => void;
}

export const AchievementToast = ({ achievement, isVisible, onClose }: AchievementToastProps) => {
  if (!achievement) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          onClick={onClose}
        >
          <div className="bg-gradient-to-r from-[hsl(45,100%,50%)] to-[hsl(0,84%,50%)] p-[2px] rounded-xl shadow-2xl">
            <div className="bg-background rounded-xl p-4 flex items-center gap-4 min-w-[300px]">
              {/* Icon */}
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-4xl"
              >
                {achievement.icon}
              </motion.div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-[hsl(45,100%,50%)]" />
                  <span className="text-xs font-bold text-[hsl(45,100%,50%)] uppercase tracking-wide">
                    Achievement Unlocked!
                  </span>
                </div>
                <h3 className="font-bold text-lg">{achievement.name}</h3>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </div>

              {/* XP Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="bg-[hsl(45,100%,50%)]/20 text-[hsl(45,100%,40%)] px-3 py-1 rounded-full text-sm font-bold"
              >
                +{achievement.xp_reward} XP
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementToast;
