import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Coins, Target } from "lucide-react";

// Soccer ball burst for prediction wins
interface SoccerBallBurstProps {
  isActive: boolean;
  onComplete?: () => void;
}

export const SoccerBallBurst = ({ isActive, onComplete }: SoccerBallBurstProps) => {
  const [balls, setBalls] = useState<{ id: number; x: number; delay: number; rotation: number }[]>([]);

  useEffect(() => {
    if (isActive) {
      const newBalls = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 60,
        delay: Math.random() * 0.3,
        rotation: Math.random() * 720,
      }));
      setBalls(newBalls);

      const timer = setTimeout(() => {
        setBalls([]);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {balls.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {balls.map((ball) => (
            <motion.div
              key={ball.id}
              initial={{
                x: `${ball.x}vw`,
                y: "50vh",
                scale: 0,
                rotate: 0,
              }}
              animate={{
                y: [null, "30vh", "110vh"],
                scale: [0, 1.5, 1],
                rotate: ball.rotation,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.8,
                delay: ball.delay,
                ease: "easeOut",
              }}
              className="absolute text-3xl"
            >
              ⚽
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// Rank up celebration with trophy animation
interface RankUpCelebrationProps {
  isActive: boolean;
  newRank?: number;
  onComplete?: () => void;
}

export const RankUpCelebration = ({ isActive, newRank, onComplete }: RankUpCelebrationProps) => {
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
        >
          {/* Radial burst lines */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5], opacity: [1, 0] }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute w-1 h-32 bg-gradient-to-t from-[hsl(45,100%,50%)] to-transparent"
              style={{
                transform: `rotate(${i * 30}deg)`,
                transformOrigin: "bottom center",
              }}
            />
          ))}

          {/* Central trophy */}
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: [0, 1.3, 1], y: [50, -20, 0] }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative"
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5, delay: 0.6, repeat: 2 }}
            >
              <Trophy className="h-24 w-24 text-[hsl(45,100%,50%)] drop-shadow-lg" />
            </motion.div>
            
            {newRank && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[hsl(45,100%,50%)] to-[hsl(0,84%,50%)] text-white font-black text-xl px-4 py-1 rounded-full"
              >
                #{newRank}
              </motion.div>
            )}
          </motion.div>

          {/* Floating stars */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`star-${i}`}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200,
              }}
              transition={{ duration: 1.5, delay: 0.3 + i * 0.1 }}
              className="absolute text-2xl"
            >
              ⭐
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Card Points coin shower
interface CoinShowerProps {
  isActive: boolean;
  amount?: number;
  onComplete?: () => void;
}

export const CoinShower = ({ isActive, amount, onComplete }: CoinShowerProps) => {
  const [coins, setCoins] = useState<{ id: number; x: number; delay: number; size: number }[]>([]);

  useEffect(() => {
    if (isActive) {
      const coinCount = Math.min(20, Math.max(8, (amount || 10) / 5));
      const newCoins = Array.from({ length: coinCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        size: 20 + Math.random() * 16,
      }));
      setCoins(newCoins);

      const timer = setTimeout(() => {
        setCoins([]);
        onComplete?.();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isActive, amount, onComplete]);

  return (
    <AnimatePresence>
      {coins.length > 0 && (
        <>
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {coins.map((coin) => (
              <motion.div
                key={coin.id}
                initial={{
                  x: `${coin.x}vw`,
                  y: -50,
                  rotateY: 0,
                }}
                animate={{
                  y: "110vh",
                  rotateY: 720,
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: coin.delay,
                  ease: "easeIn",
                }}
                className="absolute"
                style={{ fontSize: coin.size }}
              >
                <Coins className="text-[hsl(45,100%,50%)] drop-shadow-md" style={{ width: coin.size, height: coin.size }} />
              </motion.div>
            ))}
          </div>

          {/* Central amount display */}
          {amount && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            >
              <div className="bg-gradient-to-r from-[hsl(45,100%,50%)] to-[hsl(45,100%,40%)] text-black font-black text-3xl px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2">
                <Coins className="h-8 w-8" />
                +{amount} CP
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

// Prediction placed celebration
interface PredictionPlacedProps {
  isActive: boolean;
  side?: "yes" | "no";
  onComplete?: () => void;
}

export const PredictionPlaced = ({ isActive, side, onComplete }: PredictionPlacedProps) => {
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  const color = side === "yes" ? "hsl(120, 60%, 50%)" : "hsl(0, 84%, 50%)";
  const emoji = side === "yes" ? "✅" : "❌";

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
        >
          {/* Pulse ring */}
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute w-24 h-24 rounded-full border-4"
            style={{ borderColor: color }}
          />
          
          {/* Second pulse ring */}
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="absolute w-24 h-24 rounded-full border-4"
            style={{ borderColor: color }}
          />

          {/* Central icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: [0, 1.3, 1], rotate: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="relative bg-background rounded-full p-4 shadow-xl"
          >
            <Target className="h-12 w-12" style={{ color }} />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -top-2 -right-2 text-2xl"
            >
              {emoji}
            </motion.span>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 60, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute text-lg font-bold"
            style={{ color }}
          >
            Prediction Locked In!
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default {
  SoccerBallBurst,
  RankUpCelebration,
  CoinShower,
  PredictionPlaced,
};
