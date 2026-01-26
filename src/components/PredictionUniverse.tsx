import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Trade {
  id: string;
  side: string;
  amount: number;
  created_at: string;
  status: string;
  wallet_address?: string;
  market_id?: string;
  market?: {
    title: string;
    category?: string;
  };
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

interface MarketUniverse {
  marketId: string;
  marketTitle: string;
  marketCategory?: string;
  userTrades: Trade[];
  globalTrades: Trade[];
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

// Convert trade to star with position based on conviction depth
const tradeToStar = (
  trade: Trade,
  allTrades: Trade[],
  isUser: boolean
): Star => {
  const side = trade.side as "YES" | "NO";
  
  // Get all trades on the same side for relative conviction
  const sameSideTrades = allTrades.filter(t => t.side === side);
  const maxSideAmount = Math.max(...sameSideTrades.map(t => t.amount), 1);
  
  // Conviction ratio: how deep is this bet relative to the side's max
  const convictionRatio = trade.amount / maxSideAmount;
  
  // Size based on amount (global comparison within this market)
  const allAmounts = allTrades.map(t => t.amount);
  const maxAmount = Math.max(...allAmounts, 1);
  const minAmount = Math.min(...allAmounts);
  const amountRatio = maxAmount > minAmount 
    ? (trade.amount - minAmount) / (maxAmount - minAmount) 
    : 0.5;
  
  // User stars are larger and brighter
  const baseSize = isUser ? 5 : 2.5;
  const sizeRange = isUser ? 8 : 4;
  const size = baseSize + amountRatio * sizeRange;
  
  // Brightness
  const statusBoost = (trade.status === 'won' || trade.status === 'claimed') ? 0.2 : 0;
  const userBoost = isUser ? 0.3 : 0;
  const brightness = 0.3 + amountRatio * 0.5 + statusBoost + userBoost;
  
  // Use hash for consistent scatter
  const hash = hashCode(trade.id);
  const hash2 = hashCode(trade.id + 'y');
  
  // === CONVICTION DEPTH POSITIONING ===
  // X position: distance from center based on conviction
  const baseDepth = 0.18 + convictionRatio * 0.30;
  const depthJitter = ((hash % 100) / 100 - 0.5) * 0.06;
  const depth = Math.max(0.15, Math.min(0.48, baseDepth + depthJitter));
  
  // X: YES goes left of center, NO goes right
  const x = side === "YES" 
    ? 0.5 - depth
    : 0.5 + depth;
  
  // Y position: spread vertically
  const yBase = 0.28 + ((hash2 % 1000) / 1000) * 0.44;
  const yJitter = ((hash % 50) / 50 - 0.5) * 0.12;
  const y = Math.max(0.18, Math.min(0.82, yBase + yJitter));
  
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

// Single market universe component
const MarketUniverseView = ({ 
  universe, 
  userWallet 
}: { 
  universe: MarketUniverse; 
  userWallet?: string;
}) => {
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  
  const width = 500;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Filter duplicates from global trades
  const otherTrades = useMemo(() => {
    if (!userWallet) return universe.globalTrades;
    return universe.globalTrades.filter(t => t.wallet_address !== userWallet);
  }, [universe.globalTrades, userWallet]);
  
  const { userStars, globalStars, stats, interpretation } = useMemo(() => {
    const allTrades = [...universe.userTrades, ...otherTrades];
    
    const uStars = universe.userTrades.map(t => tradeToStar(t, allTrades, true));
    const gStars = otherTrades.map(t => tradeToStar(t, allTrades, false));
    
    const userYesAmount = universe.userTrades.filter(t => t.side === 'YES').reduce((s, t) => s + t.amount, 0);
    const userNoAmount = universe.userTrades.filter(t => t.side === 'NO').reduce((s, t) => s + t.amount, 0);
    const globalYesAmount = otherTrades.filter(t => t.side === 'YES').reduce((s, t) => s + t.amount, 0);
    const globalNoAmount = otherTrades.filter(t => t.side === 'NO').reduce((s, t) => s + t.amount, 0);
    
    const totalYes = userYesAmount + globalYesAmount;
    const totalNo = userNoAmount + globalNoAmount;
    const total = totalYes + totalNo;
    
    // User's position on the side they bet on
    const userSide = universe.userTrades.length > 0 ? universe.userTrades[0].side : null;
    const userTotalOnSide = userSide === 'YES' ? userYesAmount : userNoAmount;
    const poolOnSide = userSide === 'YES' ? totalYes : totalNo;
    const userPoolShare = poolOnSide > 0 ? (userTotalOnSide / poolOnSide) * 100 : 0;
    
    // Generate interpretation
    const userBetCount = universe.userTrades.length;
    const totalBetCount = allTrades.length;
    const userTotalAmount = userYesAmount + userNoAmount;
    const avgBetSize = userBetCount > 0 ? userTotalAmount / userBetCount : 0;
    const crowdAvgBet = otherTrades.length > 0 ? (globalYesAmount + globalNoAmount) / otherTrades.length : 0;
    
    // Determine conviction level
    const sidePoolTotal = userSide === 'YES' ? totalYes : totalNo;
    const oppositeSideTotal = userSide === 'YES' ? totalNo : totalYes;
    const crowdFavors = totalYes > totalNo ? 'YES' : totalNo > totalYes ? 'NO' : 'split';
    const isContrarian = crowdFavors !== 'split' && crowdFavors !== userSide;
    
    // Build interpretation
    let positionDesc = '';
    let convictionDesc = '';
    let crowdContext = '';
    
    // Position size description
    if (userPoolShare > 50) {
      positionDesc = 'Dominant position';
    } else if (userPoolShare > 20) {
      positionDesc = 'Significant stake';
    } else if (userPoolShare > 5) {
      positionDesc = 'Moderate position';
    } else {
      positionDesc = 'Small position';
    }
    
    // Conviction description based on bet count and relative size
    if (userBetCount > 1 && avgBetSize > crowdAvgBet * 2) {
      convictionDesc = 'with repeated high-conviction bets';
    } else if (userBetCount > 1) {
      convictionDesc = 'across multiple entries';
    } else if (avgBetSize > crowdAvgBet * 2) {
      convictionDesc = 'with above-average conviction';
    } else if (crowdAvgBet > 0 && avgBetSize < crowdAvgBet * 0.5) {
      convictionDesc = 'with cautious sizing';
    } else {
      convictionDesc = 'at market-typical size';
    }
    
    // Crowd context
    if (isContrarian) {
      const crowdPercent = Math.round((oppositeSideTotal / total) * 100);
      crowdContext = `Contrarian view against ${crowdPercent}% of pool.`;
    } else if (crowdFavors === userSide) {
      crowdContext = 'Aligned with crowd sentiment.';
    } else {
      crowdContext = 'Market evenly split.';
    }
    
    const interpretationText = `${positionDesc} ${convictionDesc}. ${crowdContext}`;
    
    return {
      userStars: uStars,
      globalStars: gStars,
      stats: {
        yesPercent: total > 0 ? Math.round((totalYes / total) * 100) : 50,
        noPercent: total > 0 ? Math.round((totalNo / total) * 100) : 50,
        totalPredictors: allTrades.length,
        userSide,
        userPoolShare: Math.round(userPoolShare * 10) / 10,
      },
      interpretation: interpretationText,
    };
  }, [universe.userTrades, otherTrades]);
  
  return (
    <div className="relative bg-card/50 border border-border rounded-xl p-3">
      {/* Market title */}
      <div className="mb-2">
        <h4 className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
          {universe.marketTitle}
        </h4>
        {universe.marketCategory && (
          <span className="text-[10px] text-muted-foreground">{universe.marketCategory}</span>
        )}
      </div>
      
      <svg 
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[500px] h-auto mx-auto"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={`yes-${universe.marketId}`} cx="30%" cy="50%" r="45%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`no-${universe.marketId}`} cx="70%" cy="50%" r="45%">
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0" />
          </radialGradient>
          <filter id={`glow-${universe.marketId}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Background */}
        <rect
          x={2}
          y={2}
          width={width - 4}
          height={height - 4}
          rx={8}
          fill="hsl(0, 0%, 4%)"
        />
        
        {/* Nebulae */}
        <ellipse 
          cx={centerX * 0.5} 
          cy={centerY} 
          rx={width * 0.25} 
          ry={height * 0.35}
          fill={`url(#yes-${universe.marketId})`}
        />
        <ellipse 
          cx={centerX * 1.5} 
          cy={centerY} 
          rx={width * 0.25} 
          ry={height * 0.35}
          fill={`url(#no-${universe.marketId})`}
        />
        
        {/* Center divider */}
        <line 
          x1={centerX} 
          y1={20}
          x2={centerX}
          y2={height - 20}
          stroke="hsl(0, 0%, 18%)"
          strokeWidth="1"
          strokeDasharray="2,4"
          opacity="0.5"
        />
        
        {/* Side labels with percentages */}
        <text 
          x={centerX * 0.5} 
          y={18}
          fill="hsl(var(--primary))"
          fontSize="14"
          fontWeight="600"
          textAnchor="middle"
        >
          YES {stats.yesPercent}%
        </text>
        <text 
          x={centerX * 1.5} 
          y={18}
          fill="hsl(var(--secondary))"
          fontSize="14"
          fontWeight="600"
          textAnchor="middle"
        >
          NO {stats.noPercent}%
        </text>
        
        {/* Conviction depth labels */}
        <text x={8} y={centerY} fill="hsl(0,0%,30%)" fontSize="7" textAnchor="start" dominantBaseline="middle">
          Deep
        </text>
        <text x={width - 8} y={centerY} fill="hsl(0,0%,30%)" fontSize="7" textAnchor="end" dominantBaseline="middle">
          Deep
        </text>
        <text x={centerX} y={centerY} fill="hsl(0,0%,25%)" fontSize="7" textAnchor="middle" dominantBaseline="middle">
          ·
        </text>
        
        {/* Global stars (crowd) */}
        {globalStars.map((star) => {
          const starX = star.x * width;
          const starY = star.y * height;
          const isYes = star.side === "YES";
          const baseColor = isYes ? "hsl(var(--primary))" : "hsl(var(--secondary))";
          
          return (
            <g key={star.id}>
              <circle
                cx={starX}
                cy={starY}
                r={star.size * 1.3}
                fill={baseColor}
                opacity={star.brightness * 0.15}
              />
              <circle
                cx={starX}
                cy={starY}
                r={star.size}
                fill={baseColor}
                opacity={star.brightness * 0.45}
              />
            </g>
          );
        })}
        
        {/* User stars */}
        {userStars.map((star) => {
          const starX = star.x * width;
          const starY = star.y * height;
          const isYes = star.side === "YES";
          const baseColor = isYes ? "hsl(var(--primary))" : "hsl(var(--secondary))";
          const isHovered = hoveredStar?.id === star.id;
          
          return (
            <g 
              key={star.id}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow layers */}
              <circle cx={starX} cy={starY} r={star.size * 2.5} fill={baseColor} opacity={star.brightness * 0.2} />
              <circle cx={starX} cy={starY} r={star.size * 1.5} fill={baseColor} opacity={star.brightness * 0.4} />
              
              {/* Core */}
              <circle
                cx={starX}
                cy={starY}
                r={star.size}
                fill={baseColor}
                opacity={star.brightness}
                filter={`url(#glow-${universe.marketId})`}
                style={{
                  transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                  transformOrigin: `${starX}px ${starY}px`,
                  transition: 'transform 0.15s',
                }}
              />
              
              {/* Bright center */}
              <circle cx={starX} cy={starY} r={star.size * 0.3} fill="white" opacity={star.brightness * 0.85} />
              
              {/* User indicator */}
              <circle
                cx={starX}
                cy={starY}
                r={star.size + 3}
                fill="none"
                stroke="white"
                strokeWidth="0.75"
                opacity={isHovered ? 0.7 : 0.25}
                strokeDasharray="2,2"
              />
            </g>
          );
        })}
        
        {/* Bottom stats */}
        <text 
          x={centerX} 
          y={height - 8}
          fill="hsl(0, 0%, 45%)"
          fontSize="8"
          textAnchor="middle"
        >
          {stats.totalPredictors} total · You: {stats.userPoolShare}% of {stats.userSide} pool
        </text>
      </svg>
      
      {/* Tooltip */}
      <AnimatePresence>
        {hoveredStar && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute z-20 px-2.5 py-1.5 text-[10px] bg-card border border-border rounded-md shadow-lg pointer-events-none"
            style={{
              left: Math.min(hoveredStar.x * width + 20, width - 80),
              top: hoveredStar.y * height + 30,
            }}
          >
            <div className="font-semibold">{hoveredStar.side} · {hoveredStar.amount} ALGO</div>
            <div className="text-muted-foreground capitalize">{hoveredStar.status}</div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Position Interpretation */}
      <div className="mt-3 px-2 py-2 bg-muted/30 rounded-lg border border-border/50">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-foreground/80 font-medium">Your position: </span>
          {interpretation}
        </p>
      </div>
    </div>
  );
};

// Compact card view for grid
const MarketUniverseCard = ({ 
  universe, 
  userWallet,
  onClick
}: { 
  universe: MarketUniverse; 
  userWallet?: string;
  onClick: () => void;
}) => {
  const width = 200;
  const height = 120;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const otherTrades = useMemo(() => {
    if (!userWallet) return universe.globalTrades;
    return universe.globalTrades.filter(t => t.wallet_address !== userWallet);
  }, [universe.globalTrades, userWallet]);
  
  const { userStars, globalStars, stats } = useMemo(() => {
    const allTrades = [...universe.userTrades, ...otherTrades];
    
    const uStars = universe.userTrades.map(t => tradeToStar(t, allTrades, true));
    const gStars = otherTrades.map(t => tradeToStar(t, allTrades, false));
    
    const userYesAmount = universe.userTrades.filter(t => t.side === 'YES').reduce((s, t) => s + t.amount, 0);
    const userNoAmount = universe.userTrades.filter(t => t.side === 'NO').reduce((s, t) => s + t.amount, 0);
    const globalYesAmount = otherTrades.filter(t => t.side === 'YES').reduce((s, t) => s + t.amount, 0);
    const globalNoAmount = otherTrades.filter(t => t.side === 'NO').reduce((s, t) => s + t.amount, 0);
    
    const totalYes = userYesAmount + globalYesAmount;
    const totalNo = userNoAmount + globalNoAmount;
    const total = totalYes + totalNo;
    
    return {
      userStars: uStars,
      globalStars: gStars,
      stats: {
        yesPercent: total > 0 ? Math.round((totalYes / total) * 100) : 50,
        noPercent: total > 0 ? Math.round((totalNo / total) * 100) : 50,
      },
    };
  }, [universe.userTrades, otherTrades]);
  
  return (
    <motion.div 
      className="relative bg-card/50 border border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 hover:bg-card/70 transition-all"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Market title */}
      <h4 className="text-xs font-medium text-foreground line-clamp-1 leading-snug mb-2">
        {universe.marketTitle}
      </h4>
      
      <svg 
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={`yes-card-${universe.marketId}`} cx="30%" cy="50%" r="45%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`no-card-${universe.marketId}`} cx="70%" cy="50%" r="45%">
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Background */}
        <rect x={0} y={0} width={width} height={height} rx={6} fill="hsl(0, 0%, 4%)" />
        
        {/* Nebulae */}
        <ellipse cx={centerX * 0.5} cy={centerY} rx={width * 0.22} ry={height * 0.35} fill={`url(#yes-card-${universe.marketId})`} />
        <ellipse cx={centerX * 1.5} cy={centerY} rx={width * 0.22} ry={height * 0.35} fill={`url(#no-card-${universe.marketId})`} />
        
        {/* Center divider */}
        <line x1={centerX} y1={10} x2={centerX} y2={height - 10} stroke="hsl(0, 0%, 18%)" strokeWidth="1" strokeDasharray="2,4" opacity="0.4" />
        
        {/* Side labels */}
        <text x={centerX * 0.5} y={14} fill="hsl(var(--primary))" fontSize="10" fontWeight="600" textAnchor="middle">
          {stats.yesPercent}%
        </text>
        <text x={centerX * 1.5} y={14} fill="hsl(var(--secondary))" fontSize="10" fontWeight="600" textAnchor="middle">
          {stats.noPercent}%
        </text>
        
        {/* Global stars (smaller) */}
        {globalStars.slice(0, 15).map((star) => {
          const starX = star.x * width;
          const starY = star.y * height;
          const isYes = star.side === "YES";
          const baseColor = isYes ? "hsl(var(--primary))" : "hsl(var(--secondary))";
          
          return (
            <circle
              key={star.id}
              cx={starX}
              cy={starY}
              r={star.size * 0.6}
              fill={baseColor}
              opacity={star.brightness * 0.35}
            />
          );
        })}
        
        {/* User stars */}
        {userStars.map((star) => {
          const starX = star.x * width;
          const starY = star.y * height;
          const isYes = star.side === "YES";
          const baseColor = isYes ? "hsl(var(--primary))" : "hsl(var(--secondary))";
          
          return (
            <g key={star.id}>
              <circle cx={starX} cy={starY} r={star.size * 1.2} fill={baseColor} opacity={star.brightness * 0.3} />
              <circle cx={starX} cy={starY} r={star.size * 0.8} fill={baseColor} opacity={star.brightness * 0.9} />
              <circle cx={starX} cy={starY} r={star.size * 0.2} fill="white" opacity={0.7} />
            </g>
          );
        })}
      </svg>
      
      {/* Tap hint */}
      <div className="absolute bottom-1.5 right-2 text-[9px] text-muted-foreground/60">
        Tap to expand →
      </div>
    </motion.div>
  );
};

export const PredictionUniverse = ({
  userTrades, 
  globalTrades = [], 
  userWallet,
  className = "" 
}: PredictionUniverseProps) => {
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  
  // Group trades by market
  const universes = useMemo((): MarketUniverse[] => {
    const marketMap = new Map<string, MarketUniverse>();
    
    userTrades.forEach(trade => {
      const marketId = trade.market_id || trade.id;
      if (!marketMap.has(marketId)) {
        marketMap.set(marketId, {
          marketId,
          marketTitle: trade.market?.title || 'Unknown Market',
          marketCategory: trade.market?.category,
          userTrades: [],
          globalTrades: [],
        });
      }
      marketMap.get(marketId)!.userTrades.push(trade);
    });
    
    globalTrades.forEach(trade => {
      const marketId = trade.market_id || trade.id;
      if (marketMap.has(marketId)) {
        marketMap.get(marketId)!.globalTrades.push(trade);
      }
    });
    
    return Array.from(marketMap.values());
  }, [userTrades, globalTrades]);
  
  const selectedUniverse = useMemo(() => {
    return universes.find(u => u.marketId === selectedMarketId) || null;
  }, [universes, selectedMarketId]);
  
  if (universes.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ minHeight: 180 }}>
        <div className="text-center text-muted-foreground text-sm">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full border border-border flex items-center justify-center">
            <span className="text-xl">✦</span>
          </div>
          Your prediction universes await
        </div>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {selectedUniverse ? (
          /* Expanded single market view */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Back button */}
            <button
              onClick={() => setSelectedMarketId(null)}
              className="flex items-center gap-2 mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <motion.span 
                className="inline-block"
                initial={{ x: 0 }}
                whileHover={{ x: -3 }}
              >
                ←
              </motion.span>
              <span className="group-hover:underline">Back to all markets</span>
            </button>
            
            <MarketUniverseView 
              universe={selectedUniverse} 
              userWallet={userWallet}
            />
          </motion.div>
        ) : (
          /* Grid of compact cards */
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {universes.length === 1 ? (
              /* Single market - show full view directly */
              <MarketUniverseView 
                universe={universes[0]} 
                userWallet={userWallet}
              />
            ) : (
              /* Multiple markets - show grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {universes.map((universe) => (
                  <MarketUniverseCard 
                    key={universe.marketId} 
                    universe={universe} 
                    userWallet={userWallet}
                    onClick={() => setSelectedMarketId(universe.marketId)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
