import { motion } from "framer-motion";
import { Star, Sparkles } from "lucide-react";

interface XPProgressBarProps {
  xp: number;
  level: number;
  size?: "sm" | "md" | "lg";
}

// XP required for each level (exponential growth)
const getXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

const getTotalXPForLevel = (level: number): number => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
};

export const XPProgressBar = ({ xp, level, size = "md" }: XPProgressBarProps) => {
  const xpForCurrentLevel = getXPForLevel(level);
  const xpAtLevelStart = getTotalXPForLevel(level);
  const xpIntoLevel = xp - xpAtLevelStart;
  const progress = Math.min((xpIntoLevel / xpForCurrentLevel) * 100, 100);

  const sizeClasses = {
    sm: { bar: "h-2", text: "text-xs", icon: "h-4 w-4", badge: "text-sm" },
    md: { bar: "h-3", text: "text-sm", icon: "h-5 w-5", badge: "text-lg" },
    lg: { bar: "h-4", text: "text-base", icon: "h-6 w-6", badge: "text-xl" },
  };

  const styles = sizeClasses[size];

  return (
    <div className="w-full">
      {/* Level Badge and XP Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 10 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-[hsl(45,100%,50%)] to-[hsl(30,100%,45%)] rounded-full p-2 shadow-lg">
              <Star className={`${styles.icon} text-white fill-white`} />
            </div>
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gradient-to-br from-[hsl(45,100%,50%)] to-[hsl(30,100%,45%)] rounded-full blur-sm -z-10"
            />
          </motion.div>
          <div>
            <span className={`font-black ${styles.badge}`}>Level {level}</span>
          </div>
        </div>

        <div className={`${styles.text} text-muted-foreground`}>
          <span className="font-bold text-foreground">{xpIntoLevel}</span>
          <span> / {xpForCurrentLevel} XP</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`w-full ${styles.bar} bg-muted rounded-full overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-[hsl(45,100%,50%)] via-[hsl(30,100%,50%)] to-[hsl(0,84%,50%)] relative"
        >
          {/* Shimmer effect */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 3,
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </motion.div>
      </div>

      {/* Next Level Hint */}
      {progress >= 90 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 mt-2 text-xs text-[hsl(45,100%,40%)]"
        >
          <Sparkles className="h-3 w-3" />
          <span>Almost there! Level up soon!</span>
        </motion.div>
      )}
    </div>
  );
};

export default XPProgressBar;
