import { motion } from "framer-motion";
import { Flame, Zap, Crown } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const StreakBadge = ({ streak, size = "md", showLabel = true }: StreakBadgeProps) => {
  if (streak < 2) return null;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const getStreakConfig = () => {
    if (streak >= 10) {
      return {
        icon: Crown,
        color: "from-purple-500 to-pink-500",
        textColor: "text-purple-100",
        label: "Legendary",
        animate: true,
      };
    }
    if (streak >= 5) {
      return {
        icon: Zap,
        color: "from-[hsl(45,100%,50%)] to-[hsl(30,100%,50%)]",
        textColor: "text-yellow-100",
        label: "On Fire",
        animate: true,
      };
    }
    return {
      icon: Flame,
      color: "from-orange-500 to-red-500",
      textColor: "text-orange-100",
      label: "Hot",
      animate: false,
    };
  };

  const config = getStreakConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center gap-1 bg-gradient-to-r ${config.color} rounded-full ${sizeClasses[size]} font-bold ${config.textColor} shadow-lg`}
    >
      <motion.div
        animate={config.animate ? { 
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0],
        } : {}}
        transition={{ 
          duration: 0.5, 
          repeat: Infinity, 
          repeatDelay: 1 
        }}
      >
        <Icon className={iconSizes[size]} />
      </motion.div>
      <span>{streak}</span>
      {showLabel && <span className="opacity-80">{config.label}</span>}
    </motion.div>
  );
};

export default StreakBadge;
