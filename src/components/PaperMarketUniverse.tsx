import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/paperSession";

interface Prediction {
  id: string;
  side: string;
  points_staked: number;
  created_at: string;
  status: string;
  session_id: string;
}

interface PaperMarketUniverseProps {
  marketId: string;
  className?: string;
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
  side: "yes" | "no";
  isUser: boolean;
}

const predictionToStar = (
  prediction: Prediction,
  allPredictions: Prediction[],
  isUser: boolean
): Star => {
  const side = prediction.side as "yes" | "no";
  
  const sameSidePredictions = allPredictions.filter(p => p.side === side);
  const maxSideAmount = Math.max(...sameSidePredictions.map(p => p.points_staked), 1);
  const convictionRatio = prediction.points_staked / maxSideAmount;
  
  const allAmounts = allPredictions.map(p => p.points_staked);
  const maxAmount = Math.max(...allAmounts, 1);
  const minAmount = Math.min(...allAmounts);
  const amountRatio = maxAmount > minAmount 
    ? (prediction.points_staked - minAmount) / (maxAmount - minAmount) 
    : 0.5;
  
  const baseSize = isUser ? 5 : 2.5;
  const sizeRange = isUser ? 6 : 4;
  const size = baseSize + amountRatio * sizeRange;
  
  const statusBoost = (prediction.status === 'won' || prediction.status === 'claimed') ? 0.2 : 0;
  const userBoost = isUser ? 0.3 : 0;
  const brightness = 0.3 + amountRatio * 0.5 + statusBoost + userBoost;
  
  const hash = hashCode(prediction.id);
  const hash2 = hashCode(prediction.id + 'y');
  
  const baseDepth = 0.18 + convictionRatio * 0.30;
  const depthJitter = ((hash % 100) / 100 - 0.5) * 0.06;
  const depth = Math.max(0.15, Math.min(0.48, baseDepth + depthJitter));
  
  const x = side === "yes" ? 0.5 - depth : 0.5 + depth;
  
  const yBase = 0.28 + ((hash2 % 1000) / 1000) * 0.44;
  const yJitter = ((hash % 50) / 50 - 0.5) * 0.12;
  const y = Math.max(0.18, Math.min(0.82, yBase + yJitter));
  
  return {
    id: prediction.id,
    x,
    y,
    size,
    brightness: Math.min(1, brightness),
    side,
    isUser,
  };
};

export const PaperMarketUniverse = ({ marketId, className }: PaperMarketUniverseProps) => {
  const sessionId = getSessionId();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const width = 220;
  const height = 120;
  const centerX = width / 2;
  const centerY = height / 2;
  
  useEffect(() => {
    const fetchPredictions = async () => {
      const { data } = await supabase
        .from('paper_predictions')
        .select('id, side, points_staked, created_at, status, session_id')
        .eq('market_id', marketId)
        .eq('tenant_id', 'soccer-laduma')
        .limit(50);
      
      setPredictions(data || []);
      setLoading(false);
    };
    
    fetchPredictions();
  }, [marketId]);
  
  const { userStars, globalStars, stats, isContrarian, interpretation } = useMemo(() => {
    const userPredictions = sessionId 
      ? predictions.filter(p => p.session_id === sessionId)
      : [];
    const otherPredictions = sessionId
      ? predictions.filter(p => p.session_id !== sessionId)
      : predictions;
    
    const allPredictions = predictions;
    
    const uStars = userPredictions.map(p => predictionToStar(p, allPredictions, true));
    const gStars = otherPredictions.map(p => predictionToStar(p, allPredictions, false));
    
    const yesPredictions = predictions.filter(p => p.side === 'yes');
    const noPredictions = predictions.filter(p => p.side === 'no');
    const yesTotal = yesPredictions.reduce((sum, p) => sum + p.points_staked, 0);
    const noTotal = noPredictions.reduce((sum, p) => sum + p.points_staked, 0);
    const total = yesTotal + noTotal;
    const yesPercent = total > 0 ? Math.round((yesTotal / total) * 100) : 50;
    const noPercent = total > 0 ? Math.round((noTotal / total) * 100) : 50;
    
    // Calculate conviction metrics
    const yesAvg = yesPredictions.length > 0 ? yesTotal / yesPredictions.length : 0;
    const noAvg = noPredictions.length > 0 ? noTotal / noPredictions.length : 0;
    const maxStake = Math.max(...predictions.map(p => p.points_staked), 0);
    const hasWhale = maxStake >= 150;
    
    // Generate interpretation
    let interp = "";
    const dominantSide = yesPercent > noPercent ? "YES" : "NO";
    const margin = Math.abs(yesPercent - noPercent);
    
    if (margin >= 40) {
      interp = `Strong ${dominantSide} consensus (${Math.max(yesPercent, noPercent)}%). `;
      interp += hasWhale 
        ? "Heavy conviction from key predictors drives the crowd." 
        : "Broad agreement across the crowd.";
    } else if (margin >= 20) {
      interp = `${dominantSide} leads with ${Math.max(yesPercent, noPercent)}% of stakes. `;
      interp += `${yesPredictions.length} believers vs ${noPredictions.length} skeptics. `;
      interp += yesAvg > noAvg * 1.3 
        ? "YES backers show stronger individual conviction." 
        : noAvg > yesAvg * 1.3 
          ? "NO backers show stronger individual conviction."
          : "Similar conviction levels on both sides.";
    } else {
      interp = `Crowd is split (${yesPercent}% YES / ${noPercent}% NO). `;
      interp += "Contested outcome — contrarian opportunity exists.";
    }
    
    // Add user context
    const userSide = userPredictions.length > 0 ? userPredictions[0].side : null;
    const crowdFavors = yesTotal > noTotal ? 'yes' : noTotal > yesTotal ? 'no' : 'split';
    const contrarian = userSide && crowdFavors !== 'split' && crowdFavors !== userSide;
    
    if (userSide) {
      const userTotal = userPredictions.reduce((sum, p) => sum + p.points_staked, 0);
      const userPoolShare = userSide === 'yes' 
        ? (yesTotal > 0 ? Math.round((userTotal / yesTotal) * 100) : 0)
        : (noTotal > 0 ? Math.round((userTotal / noTotal) * 100) : 0);
      
      if (contrarian) {
        interp += ` ⚡ You're contrarian — ${100 - (userSide === 'yes' ? yesPercent : noPercent)}% oppose you.`;
      } else if (userPoolShare >= 20) {
        interp += ` Your stake represents ${userPoolShare}% of the ${userSide.toUpperCase()} pool.`;
      }
    }
    
    return {
      userStars: uStars,
      globalStars: gStars,
      stats: { yesPercent, noPercent, totalPredictors: predictions.length, yesCount: yesPredictions.length, noCount: noPredictions.length },
      isContrarian: contrarian,
      interpretation: interp,
    };
  }, [predictions, sessionId]);
  
  if (loading) {
    return (
      <div className={`h-[120px] bg-muted/20 rounded-lg animate-pulse flex items-center justify-center ${className}`}>
        <span className="text-xs text-muted-foreground">Loading universe...</span>
      </div>
    );
  }
  
  if (predictions.length === 0) {
    return (
      <div className={`h-[120px] bg-card/30 rounded-lg border border-border/50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <span className="text-2xl">✦</span>
          <p className="text-xs text-muted-foreground mt-1">Be the first to predict</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative rounded-lg overflow-hidden ${isContrarian ? 'ring-2 ring-accent/50' : ''} ${className}`}>
      {/* Contrarian badge */}
      {isContrarian && (
        <motion.div 
          className="absolute top-2 right-2 z-10 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span>⚡</span> CONTRARIAN
        </motion.div>
      )}
      
      <svg 
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={`yes-paper-${marketId}`} cx="30%" cy="50%" r="45%">
            <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(142, 76%, 36%)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`no-paper-${marketId}`} cx="70%" cy="50%" r="45%">
            <stop offset="0%" stopColor="hsl(0, 84%, 50%)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(0, 84%, 50%)" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Background */}
        <rect x={0} y={0} width={width} height={height} rx={8} fill="hsl(0, 0%, 6%)" />
        
        {/* Nebulae */}
        <ellipse cx={centerX * 0.5} cy={centerY} rx={width * 0.25} ry={height * 0.4} fill={`url(#yes-paper-${marketId})`} />
        <ellipse cx={centerX * 1.5} cy={centerY} rx={width * 0.25} ry={height * 0.4} fill={`url(#no-paper-${marketId})`} />
        
        {/* Center divider */}
        <line x1={centerX} y1={12} x2={centerX} y2={height - 12} stroke="hsl(0, 0%, 20%)" strokeWidth="1" strokeDasharray="3,5" opacity="0.5" />
        
        {/* Side labels with percentages */}
        <text x={centerX * 0.5} y={16} fill="hsl(142, 76%, 45%)" fontSize="12" fontWeight="700" textAnchor="middle">
          YES {stats.yesPercent}%
        </text>
        <text x={centerX * 1.5} y={16} fill="hsl(0, 84%, 55%)" fontSize="12" fontWeight="700" textAnchor="middle">
          NO {stats.noPercent}%
        </text>
        
        {/* Global stars (light star dust) */}
        {globalStars.map((star) => {
          const starX = star.x * width;
          const starY = star.y * height;
          
          return (
            <g key={star.id}>
              <circle
                cx={starX}
                cy={starY}
                r={star.size * 0.7}
                fill="hsl(0, 0%, 85%)"
                opacity={star.brightness * 0.5}
              />
              <circle
                cx={starX}
                cy={starY}
                r={star.size * 0.25}
                fill="hsl(0, 0%, 100%)"
                opacity={star.brightness * 0.7}
              />
            </g>
          );
        })}
        
        {/* User stars */}
        {userStars.map((star) => {
          const starX = star.x * width;
          const starY = star.y * height;
          const isYes = star.side === "yes";
          const baseColor = isYes ? "hsl(142, 76%, 45%)" : "hsl(0, 84%, 55%)";
          
          return (
            <g key={star.id}>
              {/* Contrarian pulse ring */}
              {isContrarian && (
                <motion.circle
                  cx={starX}
                  cy={starY}
                  r={star.size * 2}
                  fill="none"
                  stroke="hsl(45, 100%, 50%)"
                  strokeWidth="1.5"
                  initial={{ opacity: 0.6, scale: 0.8 }}
                  animate={{ 
                    opacity: [0.6, 0.2, 0.6],
                    scale: [0.8, 1.4, 0.8],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ transformOrigin: `${starX}px ${starY}px` }}
                />
              )}
              <circle cx={starX} cy={starY} r={star.size * 1.3} fill={baseColor} opacity={star.brightness * 0.3} />
              <circle cx={starX} cy={starY} r={star.size * 0.85} fill={baseColor} opacity={star.brightness * 0.9} />
              <circle cx={starX} cy={starY} r={star.size * 0.25} fill="white" opacity={0.8} />
              {/* User ring */}
              <circle 
                cx={starX} 
                cy={starY} 
                r={star.size + 2} 
                fill="none" 
                stroke={isContrarian ? "hsl(45, 100%, 50%)" : "white"} 
                strokeWidth="1" 
                opacity={isContrarian ? 0.7 : 0.4} 
              />
            </g>
          );
        })}
        
        {/* Bottom stats */}
        <text x={centerX} y={height - 6} fill="hsl(0, 0%, 50%)" fontSize="9" textAnchor="middle">
          {stats.totalPredictors} prediction{stats.totalPredictors !== 1 ? 's' : ''} • {stats.yesCount} YES / {stats.noCount} NO
        </text>
      </svg>
      
      {/* Interpretation */}
      <div className="mt-2 px-2 py-1.5 bg-muted/30 rounded text-xs text-muted-foreground leading-relaxed">
        {interpretation}
      </div>
    </div>
  );
};
