import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface FlyingPoint {
  id: number;
  value: number;
  x: number;
  y: number;
}

interface FlyingPointsProps {
  points: number | null;
  triggerKey?: number; // Change this to trigger animation
}

export const FlyingPoints = ({ points, triggerKey = 0 }: FlyingPointsProps) => {
  const [flyingPoints, setFlyingPoints] = useState<FlyingPoint[]>([]);

  useEffect(() => {
    if (points && points !== 0 && triggerKey > 0) {
      const newPoint: FlyingPoint = {
        id: Date.now(),
        value: points,
        x: 50 + (Math.random() - 0.5) * 20,
        y: 50,
      };
      
      setFlyingPoints(prev => [...prev, newPoint]);

      // Remove after animation
      setTimeout(() => {
        setFlyingPoints(prev => prev.filter(p => p.id !== newPoint.id));
      }, 2000);
    }
  }, [triggerKey, points]);

  return (
    <AnimatePresence>
      {flyingPoints.map((point) => (
        <motion.div
          key={point.id}
          initial={{
            opacity: 1,
            scale: 0.5,
            x: "-50%",
            y: 0,
          }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0.5, 1.2, 1],
            y: -100,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
          }}
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
          }}
        >
          <div className={`text-2xl font-black ${point.value > 0 ? "text-green-500" : "text-red-500"}`}>
            {point.value > 0 ? "+" : ""}{point.value} pts
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default FlyingPoints;
