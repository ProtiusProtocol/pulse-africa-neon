import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/contexts/WalletContext";

interface Trade {
  id: string;
  side: string;
  amount: number;
  created_at: string;
  status: string;
  wallet_address?: string;
}

interface MarketCardUniverseProps {
  marketId: string;
  yesTotal: number;
  noTotal: number;
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

interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  brightness: number;
  side: "YES" | "NO";
  isUser: boolean;
}

const tradeToStar = (
  trade: Trade,
  allTrades: Trade[],
  isUser: boolean
): Star => {
  const side = trade.side as "YES" | "NO";
  
  const sameSideTrades = allTrades.filter(t => t.side === side);
  const maxSideAmount = Math.max(...sameSideTrades.map(t => t.amount), 1);
  const convictionRatio = trade.amount / maxSideAmount;
  
  const allAmounts = allTrades.map(t => t.amount);
  const maxAmount = Math.max(...allAmounts, 1);
  const minAmount = Math.min(...allAmounts);
  const amountRatio = maxAmount > minAmount 
    ? (trade.amount - minAmount) / (maxAmount - minAmount) 
    : 0.5;
  
  const baseSize = isUser ? 4 : 2;
  const sizeRange = isUser ? 5 : 3;
  const size = baseSize + amountRatio * sizeRange;
  
  const statusBoost = (trade.status === 'won' || trade.status === 'claimed') ? 0.2 : 0;
  const userBoost = isUser ? 0.3 : 0;
  const brightness = 0.3 + amountRatio * 0.5 + statusBoost + userBoost;
  
  const hash = hashCode(trade.id);
  const hash2 = hashCode(trade.id + 'y');
  
  const baseDepth = 0.18 + convictionRatio * 0.30;
  const depthJitter = ((hash % 100) / 100 - 0.5) * 0.06;
  const depth = Math.max(0.15, Math.min(0.48, baseDepth + depthJitter));
  
  const x = side === "YES" ? 0.5 - depth : 0.5 + depth;
  
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
    isUser,
  };
};

export const MarketCardUniverse = ({ marketId, yesTotal, noTotal }: MarketCardUniverseProps) => {
  const { walletAddress } = useWallet();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  
  const width = 180;
  const height = 100;
  const centerX = width / 2;
  const centerY = height / 2;
  
  useEffect(() => {
    const fetchTrades = async () => {
      const { data } = await supabase
        .from('user_trades')
        .select('id, side, amount, created_at, status, wallet_address')
        .eq('market_id', marketId)
        .limit(50);
      
      setTrades(data || []);
      setLoading(false);
    };
    
    fetchTrades();
  }, [marketId]);
  
  const { userStars, globalStars, stats, isContrarian } = useMemo(() => {
    const userTrades = walletAddress 
      ? trades.filter(t => t.wallet_address === walletAddress)
      : [];
    const otherTrades = walletAddress
      ? trades.filter(t => t.wallet_address !== walletAddress)
      : trades;
    
    const allTrades = trades;
    
    const uStars = userTrades.map(t => tradeToStar(t, allTrades, true));
    const gStars = otherTrades.map(t => tradeToStar(t, allTrades, false));
    
    const total = yesTotal + noTotal;
    const yesPercent = total > 0 ? Math.round((yesTotal / total) * 100) : 50;
    const noPercent = total > 0 ? Math.round((noTotal / total) * 100) : 50;
    
    // Determine if user is contrarian
    const userSide = userTrades.length > 0 ? userTrades[0].side : null;
    const crowdFavors = yesTotal > noTotal ? 'YES' : noTotal > yesTotal ? 'NO' : 'split';
    const contrarian = userSide && crowdFavors !== 'split' && crowdFavors !== userSide;
    
    return {
      userStars: uStars,
      globalStars: gStars,
      stats: { yesPercent, noPercent, totalPredictors: trades.length },
      isContrarian: contrarian,
    };
  }, [trades, walletAddress, yesTotal, noTotal]);
  
  if (loading) {
    return (
      <div className="h-[100px] bg-muted/20 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Loading universe...</span>
      </div>
    );
  }
  
  if (trades.length === 0) {
    return (
      <div className="h-[100px] bg-card/30 rounded-lg border border-border/50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-lg">✦</span>
          <p className="text-[10px] text-muted-foreground mt-1">No trades yet</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative rounded-lg overflow-hidden ${isContrarian ? 'ring-1 ring-accent/30' : ''}`}>
      {/* Contrarian badge */}
      {isContrarian && (
        <motion.div 
          className="absolute top-1 right-1 z-10 bg-accent text-accent-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span>⚡</span>
        </motion.div>
      )}
      
      <svg 
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={`yes-mc-${marketId}`} cx="30%" cy="50%" r="45%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`no-mc-${marketId}`} cx="70%" cy="50%" r="45%">
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Background */}
        <rect x={0} y={0} width={width} height={height} rx={6} fill="hsl(0, 0%, 4%)" />
        
        {/* Nebulae */}
        <ellipse cx={centerX * 0.5} cy={centerY} rx={width * 0.22} ry={height * 0.35} fill={`url(#yes-mc-${marketId})`} />
        <ellipse cx={centerX * 1.5} cy={centerY} rx={width * 0.22} ry={height * 0.35} fill={`url(#no-mc-${marketId})`} />
        
        {/* Center divider */}
        <line x1={centerX} y1={8} x2={centerX} y2={height - 8} stroke="hsl(0, 0%, 18%)" strokeWidth="1" strokeDasharray="2,4" opacity="0.4" />
        
        {/* Side labels */}
        <text x={centerX * 0.5} y={12} fill="hsl(var(--primary))" fontSize="9" fontWeight="600" textAnchor="middle">
          YES {stats.yesPercent}%
        </text>
        <text x={centerX * 1.5} y={12} fill="hsl(var(--secondary))" fontSize="9" fontWeight="600" textAnchor="middle">
          NO {stats.noPercent}%
        </text>
        
        {/* Global stars (light star dust) */}
        {globalStars.slice(0, 20).map((star) => {
          const starX = star.x * width;
          const starY = star.y * height;
          
          return (
            <g key={star.id}>
              <circle
                cx={starX}
                cy={starY}
                r={star.size * 0.6}
                fill="hsl(0, 0%, 90%)"
                opacity={star.brightness * 0.4}
              />
              <circle
                cx={starX}
                cy={starY}
                r={star.size * 0.2}
                fill="hsl(0, 0%, 100%)"
                opacity={star.brightness * 0.6}
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
          
          return (
            <g key={star.id}>
              {/* Contrarian pulse ring */}
              {isContrarian && (
                <motion.circle
                  cx={starX}
                  cy={starY}
                  r={star.size * 2}
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="1"
                  initial={{ opacity: 0.5, scale: 0.8 }}
                  animate={{ 
                    opacity: [0.5, 0.2, 0.5],
                    scale: [0.8, 1.3, 0.8],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ transformOrigin: `${starX}px ${starY}px` }}
                />
              )}
              <circle cx={starX} cy={starY} r={star.size * 1.2} fill={baseColor} opacity={star.brightness * 0.3} />
              <circle cx={starX} cy={starY} r={star.size * 0.8} fill={baseColor} opacity={star.brightness * 0.9} />
              <circle cx={starX} cy={starY} r={star.size * 0.2} fill="white" opacity={0.7} />
              {/* User ring */}
              <circle 
                cx={starX} 
                cy={starY} 
                r={star.size + 1.5} 
                fill="none" 
                stroke={isContrarian ? "hsl(var(--accent))" : "white"} 
                strokeWidth="0.75" 
                opacity={isContrarian ? 0.6 : 0.3} 
              />
            </g>
          );
        })}
        
        {/* Bottom stats */}
        <text x={centerX} y={height - 4} fill="hsl(0, 0%, 40%)" fontSize="7" textAnchor="middle">
          {stats.totalPredictors} predictor{stats.totalPredictors !== 1 ? 's' : ''}
        </text>
      </svg>
    </div>
  );
};
