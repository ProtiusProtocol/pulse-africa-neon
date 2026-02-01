import { motion } from "framer-motion";
import { Star, Crown, Gem, Award, Zap } from "lucide-react";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
  showTitle?: boolean;
}

const getLevelConfig = (level: number) => {
  if (level >= 20) {
    return {
      icon: Crown,
      title: "Legend",
      color: "from-purple-600 to-pink-500",
      glow: "shadow-purple-500/50",
    };
  }
  if (level >= 15) {
    return {
      icon: Gem,
      title: "Diamond",
      color: "from-cyan-400 to-blue-500",
      glow: "shadow-cyan-500/50",
    };
  }
  if (level >= 10) {
    return {
      icon: Award,
      title: "Pro",
      color: "from-[hsl(45,100%,50%)] to-[hsl(30,100%,45%)]",
      glow: "shadow-yellow-500/50",
    };
  }
  if (level >= 5) {
    return {
      icon: Zap,
      title: "Rising Star",
      color: "from-orange-500 to-red-500",
      glow: "shadow-orange-500/50",
    };
  }
  return {
    icon: Star,
    title: "Rookie",
    color: "from-gray-400 to-gray-500",
    glow: "shadow-gray-500/30",
  };
};

export const LevelBadge = ({ level, size = "md", showTitle = false }: LevelBadgeProps) => {
  const config = getLevelConfig(level);
  const Icon = config.icon;

  const sizeClasses = {
    sm: { badge: "w-8 h-8", icon: "h-4 w-4", text: "text-xs" },
    md: { badge: "w-12 h-12", icon: "h-6 w-6", text: "text-sm" },
    lg: { badge: "w-16 h-16", icon: "h-8 w-8", text: "text-base" },
  };

  const styles = sizeClasses[size];

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12 }}
        className={`relative ${styles.badge} rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg ${config.glow}`}
      >
        <Icon className={`${styles.icon} text-white`} />
        
        {/* Level number */}
        <div className="absolute -bottom-1 -right-1 bg-background border-2 border-current rounded-full w-5 h-5 flex items-center justify-center">
          <span className="text-[10px] font-bold">{level}</span>
        </div>

        {/* Pulse effect for high levels */}
        {level >= 10 && (
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color}`}
          />
        )}
      </motion.div>

      {showTitle && (
        <span className={`${styles.text} font-medium text-muted-foreground`}>
          {config.title}
        </span>
      )}
    </div>
  );
};

export default LevelBadge;
