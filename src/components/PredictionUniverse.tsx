import { useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Trade {
  id: string;
  side: string;
  amount: number;
  created_at: string;
  status: string;
  wallet_address?: string;
}

interface PredictionUniverseProps {
  userTrades: Trade[];
  globalTrades?: Trade[];
  userWallet?: string;
  className?: string;
}

interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  brightness: number;
  side: "YES" | "NO";
  amount: number;
  status: string;
  isUser: boolean;
}

// Deterministic pseudo-random based on string
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// Convert trade to star with position
const tradeToStar = (
  trade: Trade,
  allTrades: Trade[],
  isUser: boolean
): Star => {
  const side = trade.side as "YES" | "NO";
  
  // Calculate max amount for size normalization across ALL trades
  const maxAmount = Math.max(...allTrades.map(t => t.amount), 1);
  const minAmount = Math.min(...allTrades.map(t => t.amount));
  
  // Size based on amount
  const amountRatio = maxAmount > minAmount 
    ? (trade.amount - minAmount) / (maxAmount - minAmount) 
    : 0.5;
  
  // User stars are larger and brighter
  const baseSize = isUser ? 4 : 2;
  const sizeRange = isUser ? 10 : 5;
  const size = baseSize + amountRatio * sizeRange;
  
  // Brightness
  const statusBoost = (trade.status === 'won' || trade.status === 'claimed') ? 0.2 : 0;
  const userBoost = isUser ? 0.3 : 0;
  const brightness = 0.3 + amountRatio * 0.5 + statusBoost + userBoost;
  
  // Use hash for consistent but scattered positioning
  const hash = hashCode(trade.id);
  const hash2 = hashCode(trade.id + 'offset');
  
  // Distance from center (user trades closer to center for prominence)
  const baseDistance = isUser ? 0.2 : 0.15;
  const distanceRange = isUser ? 0.6 : 0.75;
  const distanceRatio = baseDistance + ((hash % 1000) / 1000) * distanceRange;
  
  // Angle within hemisphere
  // YES = left half (100° to 260°), NO = right half (-80° to 80°)
  const hemisphereSpread = 160;
  const angleVariation = ((hash2 % 1000) / 1000) * hemisphereSpread - hemisphereSpread / 2;
  const baseAngle = side === "YES" ? 180 : 0;
  const angle = (baseAngle + angleVariation) * (Math.PI / 180);
  
  // Convert polar to cartesian (center at 0.5, 0.5)
  const x = 0.5 + Math.cos(angle) * distanceRatio * 0.45;
  const y = 0.5 + Math.sin(angle) * distanceRatio * 0.45;
  
  return {
    id: trade.id,
    x,
    y,
    size,
    brightness: Math.min(1, brightness),
    side,
    amount: trade.amount,
    status: trade.status,
    isUser,
  };
};

export const PredictionUniverse = ({ 
  userTrades, 
  globalTrades = [], 
  userWallet,
  className = "" 
}: PredictionUniverseProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [dimensions, setDimensions] = useState({ width: 320, height: 320 });
  
  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width, 320);
        setDimensions({ width: size, height: size });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Filter out user's trades from global to avoid duplicates
  const otherTrades = useMemo(() => {
    if (!userWallet || globalTrades.length === 0) return globalTrades;
    return globalTrades.filter(t => t.wallet_address !== userWallet);
  }, [globalTrades, userWallet]);
  
  // Calculate all stars
  const { userStars, globalStars, stats } = useMemo(() => {
    const allTrades = [...userTrades, ...otherTrades];
    
    const uStars = userTrades.map(t => tradeToStar(t, allTrades, true));
    const gStars = otherTrades.map(t => tradeToStar(t, allTrades, false));
    
    // Calculate stats
    const userYes = userTrades.filter(t => t.side === 'YES');
    const userNo = userTrades.filter(t => t.side === 'NO');
    const globalYes = otherTrades.filter(t => t.side === 'YES');
    const globalNo = otherTrades.filter(t => t.side === 'NO');
    
    const userYesAmount = userYes.reduce((s, t) => s + t.amount, 0);
    const userNoAmount = userNo.reduce((s, t) => s + t.amount, 0);
    const globalYesAmount = globalYes.reduce((s, t) => s + t.amount, 0);
    const globalNoAmount = globalNo.reduce((s, t) => s + t.amount, 0);
    
    const totalYes = userYesAmount + globalYesAmount;
    const totalNo = userNoAmount + globalNoAmount;
    const total = totalYes + totalNo;
    
    return {
      userStars: uStars,
      globalStars: gStars,
      stats: {
        userYesCount: userYes.length,
        userNoCount: userNo.length,
        globalYesCount: globalYes.length,
        globalNoCount: globalNo.length,
        userYesAmount,
        userNoAmount,
        globalYesAmount,
        globalNoAmount,
        yesPercent: total > 0 ? Math.round((totalYes / total) * 100) : 50,
        noPercent: total > 0 ? Math.round((totalNo / total) * 100) : 50,
        totalPredictors: allTrades.length,
      }
    };
  }, [userTrades, otherTrades]);
  
  const { width, height } = dimensions;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const hasAnyData = userTrades.length > 0 || otherTrades.length > 0;
  
  if (!hasAnyData) {
    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ minHeight: 200 }}>
        <div className="text-center text-muted-foreground text-sm">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full border border-border flex items-center justify-center">
            <span className="text-2xl">✦</span>
          </div>
          Your prediction universe awaits
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
      style={{ minHeight: height + 60 }}
    >
      <svg 
        width={width} 
        height={height} 
        className="mx-auto"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* YES nebula glow */}
          <radialGradient id="yesNebula" cx="30%" cy="50%" r="45%">
            <stop offset="0%" stopColor="hsl(123, 100%, 50%)" stopOpacity="0.25" />
            <stop offset="60%" stopColor="hsl(123, 100%, 50%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(123, 100%, 50%)" stopOpacity="0" />
          </radialGradient>
          
          {/* NO nebula glow */}
          <radialGradient id="noNebula" cx="70%" cy="50%" r="45%">
            <stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity="0.25" />
            <stop offset="60%" stopColor="hsl(262, 83%, 58%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(262, 83%, 58%)" stopOpacity="0" />
          </radialGradient>
          
          {/* Star glow filter */}
          <filter id="starGlowUser" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Universe background */}
        <circle 
          cx={centerX} 
          cy={centerY} 
          r={width * 0.48} 
          fill="hsl(0, 0%, 3%)"
          stroke="hsl(0, 0%, 12%)"
          strokeWidth="1"
        />
        
        {/* Nebulae */}
        <ellipse 
          cx={centerX * 0.55} 
          cy={centerY} 
          rx={width * 0.28} 
          ry={height * 0.38}
          fill="url(#yesNebula)"
        />
        <ellipse 
          cx={centerX * 1.45} 
          cy={centerY} 
          rx={width * 0.28} 
          ry={height * 0.38}
          fill="url(#noNebula)"
        />
        
        {/* Center divider */}
        <line 
          x1={centerX} 
          y1={centerY - width * 0.4}
          x2={centerX}
          y2={centerY + width * 0.4}
          stroke="hsl(0, 0%, 18%)"
          strokeWidth="1"
          strokeDasharray="3,5"
          opacity="0.6"
        />
        
        {/* Percentage arc indicators */}
        <text 
          x={centerX * 0.45} 
          y={height * 0.1}
          fill="hsl(123, 100%, 50%)"
          fontSize="18"
          fontWeight="700"
          textAnchor="middle"
          style={{ textShadow: '0 0 12px hsl(123 100% 50% / 0.7)' }}
        >
          {stats.yesPercent}%
        </text>
        <text 
          x={centerX * 0.45} 
          y={height * 0.1 + 16}
          fill="hsl(123, 100%, 60%)"
          fontSize="10"
          textAnchor="middle"
          opacity="0.8"
        >
          YES
        </text>
        
        <text 
          x={centerX * 1.55} 
          y={height * 0.1}
          fill="hsl(262, 83%, 58%)"
          fontSize="18"
          fontWeight="700"
          textAnchor="middle"
          style={{ textShadow: '0 0 12px hsl(262 83% 58% / 0.7)' }}
        >
          {stats.noPercent}%
        </text>
        <text 
          x={centerX * 1.55} 
          y={height * 0.1 + 16}
          fill="hsl(262, 83%, 70%)"
          fontSize="10"
          textAnchor="middle"
          opacity="0.8"
        >
          NO
        </text>
        
        {/* Global stars (background dust) */}
        {globalStars.map((star) => {
          const starX = star.x * width;
          const starY = star.y * height;
          const isYes = star.side === "YES";
          const baseColor = isYes ? "hsl(123, 70%, 45%)" : "hsl(262, 60%, 50%)";
          
          return (
            <g key={star.id}>
              {/* Subtle glow */}
              <circle
                cx={starX}
                cy={starY}
                r={star.size * 1.5}
                fill={baseColor}
                opacity={star.brightness * 0.15}
              />
              {/* Star core */}
              <circle
                cx={starX}
                cy={starY}
                r={star.size}
                fill={baseColor}
                opacity={star.brightness * 0.5}
              />
            </g>
          );
        })}
        
        {/* User stars (prominent foreground) */}
        {userStars.map((star) => {
          const starX = star.x * width;
          const starY = star.y * height;
          const isYes = star.side === "YES";
          const baseColor = isYes ? "hsl(123, 100%, 50%)" : "hsl(262, 83%, 58%)";
          const isHovered = hoveredStar?.id === star.id;
          
          return (
            <g 
              key={star.id}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer glow */}
              <circle
                cx={starX}
                cy={starY}
                r={star.size * 2.5}
                fill={baseColor}
                opacity={star.brightness * 0.25}
              />
              
              {/* Inner glow */}
              <circle
                cx={starX}
                cy={starY}
                r={star.size * 1.5}
                fill={baseColor}
                opacity={star.brightness * 0.5}
              />
              
              {/* Star core */}
              <circle
                cx={starX}
                cy={starY}
                r={star.size}
                fill={baseColor}
                opacity={star.brightness}
                filter="url(#starGlowUser)"
                style={{
                  transform: isHovered ? 'scale(1.4)' : 'scale(1)',
                  transformOrigin: `${starX}px ${starY}px`,
                  transition: 'transform 0.2s ease-out',
                }}
              />
              
              {/* Bright center */}
              <circle
                cx={starX}
                cy={starY}
                r={star.size * 0.35}
                fill="white"
                opacity={star.brightness * 0.9}
              />
              
              {/* "You" indicator ring */}
              <circle
                cx={starX}
                cy={starY}
                r={star.size + 3}
                fill="none"
                stroke="white"
                strokeWidth="1"
                opacity={isHovered ? 0.8 : 0.3}
                strokeDasharray="2,2"
              />
            </g>
          );
        })}
        
        {/* Predictor count at bottom */}
        <text 
          x={centerX} 
          y={height * 0.92}
          fill="hsl(0, 0%, 50%)"
          fontSize="9"
          textAnchor="middle"
        >
          {stats.totalPredictors} predictions · You: {userTrades.length}
        </text>
      </svg>
      
      {/* Tooltip */}
      <AnimatePresence>
        {hoveredStar && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-20 px-3 py-2 text-xs bg-card border border-border rounded-lg shadow-xl pointer-events-none"
            style={{
              left: Math.min(hoveredStar.x * width + 15, width - 100),
              top: hoveredStar.y * height - 15,
            }}
          >
            <div className="flex items-center gap-2 font-semibold">
              <span 
                className={`w-2.5 h-2.5 rounded-full ${
                  hoveredStar.side === 'YES' ? 'bg-primary' : 'bg-secondary'
                }`}
              />
              <span>Your {hoveredStar.side} position</span>
            </div>
            <div className="mt-1 text-foreground">
              {hoveredStar.amount} ALGO
            </div>
            <div className="text-muted-foreground capitalize">
              Status: {hoveredStar.status}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary opacity-90 ring-1 ring-white/30" />
          <span>Your predictions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted-foreground opacity-40" />
          <span>Other predictors</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Larger = bigger bet</span>
        </div>
      </div>
    </div>
  );
};
