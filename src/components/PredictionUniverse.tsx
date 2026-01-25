import { useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Trade {
  id: string;
  side: string;
  amount: number;
  created_at: string;
  status: string;
}

interface PredictionUniverseProps {
  trades: Trade[];
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
}

// Convert trade to star with position
const tradeToStar = (
  trade: Trade,
  index: number,
  total: number,
  oldestTime: number,
  newestTime: number,
  allTrades: Trade[]
): Star => {
  const side = trade.side as "YES" | "NO";
  
  // Calculate max amount for size normalization
  const maxAmount = Math.max(...allTrades.map(t => t.amount));
  const minAmount = Math.min(...allTrades.map(t => t.amount));
  
  // Size based on amount (min 3, max 12)
  const amountRatio = maxAmount > minAmount 
    ? (trade.amount - minAmount) / (maxAmount - minAmount) 
    : 0.5;
  const size = 3 + amountRatio * 9;
  
  // Brightness based on amount + status
  const statusBoost = trade.status === 'won' || trade.status === 'claimed' ? 0.3 : 0;
  const brightness = 0.4 + amountRatio * 0.6 + statusBoost;
  
  // Distance from center based on recency (0 = center, 1 = edge)
  const tradeTime = new Date(trade.created_at).getTime();
  const timeRange = newestTime - oldestTime;
  const recencyRatio = timeRange > 0 
    ? 1 - (tradeTime - oldestTime) / timeRange // Newer = closer to center
    : 0.5;
  
  // Distance from center (20% to 90% of radius)
  const distanceRatio = 0.2 + recencyRatio * 0.7;
  
  // Angle - spread trades across their hemisphere with some randomness
  // YES = left half (90° to 270°), NO = right half (-90° to 90°)
  const sideTradesCount = allTrades.filter(t => t.side === side).length;
  const sideIndex = allTrades.filter((t, i) => t.side === side && i < allTrades.indexOf(trade)).length;
  
  // Base angle within hemisphere
  const hemisphereSpread = 140; // degrees of spread
  const baseAngle = side === "YES" 
    ? 180 + (sideIndex / Math.max(sideTradesCount - 1, 1)) * hemisphereSpread - hemisphereSpread / 2
    : 0 + (sideIndex / Math.max(sideTradesCount - 1, 1)) * hemisphereSpread - hemisphereSpread / 2;
  
  // Add some deterministic "randomness" based on id for organic feel
  const pseudoRandom = parseInt(trade.id.replace(/\D/g, '').slice(0, 4) || '1000', 10) / 10000;
  const angleOffset = (pseudoRandom - 0.5) * 30;
  const distanceOffset = (pseudoRandom - 0.5) * 0.15;
  
  const angle = (baseAngle + angleOffset) * (Math.PI / 180);
  const finalDistance = Math.max(0.15, Math.min(0.9, distanceRatio + distanceOffset));
  
  // Convert polar to cartesian (center at 0.5, 0.5)
  const x = 0.5 + Math.cos(angle) * finalDistance * 0.45;
  const y = 0.5 + Math.sin(angle) * finalDistance * 0.45;
  
  return {
    id: trade.id,
    x,
    y,
    size,
    brightness,
    side,
    amount: trade.amount,
    status: trade.status,
  };
};

export const PredictionUniverse = ({ trades, className = "" }: PredictionUniverseProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
  
  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width, 300);
        setDimensions({ width: size, height: size });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Calculate stars from trades
  const { stars, yesCount, noCount, yesTotal, noTotal } = useMemo(() => {
    if (trades.length === 0) {
      return { stars: [], yesCount: 0, noCount: 0, yesTotal: 0, noTotal: 0 };
    }
    
    const times = trades.map(t => new Date(t.created_at).getTime());
    const oldestTime = Math.min(...times);
    const newestTime = Math.max(...times);
    
    const starList = trades.map((trade, i) => 
      tradeToStar(trade, i, trades.length, oldestTime, newestTime, trades)
    );
    
    const yesTrades = trades.filter(t => t.side === 'YES');
    const noTrades = trades.filter(t => t.side === 'NO');
    
    return {
      stars: starList,
      yesCount: yesTrades.length,
      noCount: noTrades.length,
      yesTotal: yesTrades.reduce((sum, t) => sum + t.amount, 0),
      noTotal: noTrades.reduce((sum, t) => sum + t.amount, 0),
    };
  }, [trades]);
  
  const { width, height } = dimensions;
  const centerX = width / 2;
  const centerY = height / 2;
  
  if (trades.length === 0) {
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
      style={{ minHeight: height }}
    >
      <svg 
        width={width} 
        height={height} 
        className="mx-auto"
        style={{ overflow: 'visible' }}
      >
        {/* Background gradient - deep space */}
        <defs>
          {/* YES nebula glow */}
          <radialGradient id="yesNebula" cx="30%" cy="50%" r="40%">
            <stop offset="0%" stopColor="hsl(123, 100%, 50%)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(123, 100%, 50%)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(123, 100%, 50%)" stopOpacity="0" />
          </radialGradient>
          
          {/* NO nebula glow */}
          <radialGradient id="noNebula" cx="70%" cy="50%" r="40%">
            <stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(262, 83%, 58%)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(262, 83%, 58%)" stopOpacity="0" />
          </radialGradient>
          
          {/* Star glow filters */}
          <filter id="starGlow" x="-200%" y="-200%" width="500%" height="500%">
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
          fill="hsl(0, 0%, 4%)"
          stroke="hsl(0, 0%, 15%)"
          strokeWidth="1"
        />
        
        {/* YES nebula */}
        <ellipse 
          cx={centerX * 0.6} 
          cy={centerY} 
          rx={width * 0.25} 
          ry={height * 0.35}
          fill="url(#yesNebula)"
        />
        
        {/* NO nebula */}
        <ellipse 
          cx={centerX * 1.4} 
          cy={centerY} 
          rx={width * 0.25} 
          ry={height * 0.35}
          fill="url(#noNebula)"
        />
        
        {/* Center divider (subtle) */}
        <line 
          x1={centerX} 
          y1={centerY - width * 0.35}
          x2={centerX}
          y2={centerY + width * 0.35}
          stroke="hsl(0, 0%, 15%)"
          strokeWidth="1"
          strokeDasharray="4,4"
          opacity="0.5"
        />
        
        {/* Labels */}
        <text 
          x={centerX * 0.5} 
          y={height * 0.12}
          fill="hsl(123, 100%, 50%)"
          fontSize="11"
          fontWeight="600"
          textAnchor="middle"
          style={{ textShadow: '0 0 10px hsl(123 100% 50% / 0.6)' }}
        >
          YES
        </text>
        <text 
          x={centerX * 0.5} 
          y={height * 0.12 + 14}
          fill="hsl(123, 100%, 50%)"
          fontSize="9"
          fontWeight="400"
          textAnchor="middle"
          opacity="0.7"
        >
          {yesCount} · {yesTotal.toFixed(1)}A
        </text>
        
        <text 
          x={centerX * 1.5} 
          y={height * 0.12}
          fill="hsl(262, 83%, 58%)"
          fontSize="11"
          fontWeight="600"
          textAnchor="middle"
          style={{ textShadow: '0 0 10px hsl(262 83% 58% / 0.6)' }}
        >
          NO
        </text>
        <text 
          x={centerX * 1.5} 
          y={height * 0.12 + 14}
          fill="hsl(262, 83%, 58%)"
          fontSize="9"
          fontWeight="400"
          textAnchor="middle"
          opacity="0.7"
        >
          {noCount} · {noTotal.toFixed(1)}A
        </text>
        
        {/* Stars */}
        {stars.map((star) => {
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
              {/* Star glow */}
              <circle
                cx={starX}
                cy={starY}
                r={star.size * 2}
                fill={baseColor}
                opacity={star.brightness * 0.3}
              />
              
              {/* Star core */}
              <circle
                cx={starX}
                cy={starY}
                r={star.size}
                fill={baseColor}
                opacity={star.brightness}
                filter="url(#starGlow)"
                style={{
                  transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                  transformOrigin: `${starX}px ${starY}px`,
                  transition: 'transform 0.2s ease-out',
                }}
              />
              
              {/* Bright center */}
              <circle
                cx={starX}
                cy={starY}
                r={star.size * 0.4}
                fill="white"
                opacity={star.brightness * 0.8}
              />
            </g>
          );
        })}
      </svg>
      
      {/* Tooltip */}
      <AnimatePresence>
        {hoveredStar && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-10 px-3 py-2 text-xs bg-card border border-border rounded-lg shadow-lg pointer-events-none"
            style={{
              left: hoveredStar.x * width + 10,
              top: hoveredStar.y * height - 10,
            }}
          >
            <div className="flex items-center gap-2">
              <span 
                className={`w-2 h-2 rounded-full ${
                  hoveredStar.side === 'YES' ? 'bg-primary' : 'bg-secondary'
                }`}
              />
              <span className="font-semibold">{hoveredStar.side}</span>
              <span className="text-muted-foreground">·</span>
              <span>{hoveredStar.amount} ALGO</span>
            </div>
            <div className="text-muted-foreground capitalize mt-0.5">
              {hoveredStar.status}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          <span>Small bet</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-muted-foreground" />
          <span>Large bet</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Center = recent</span>
        </div>
      </div>
    </div>
  );
};
