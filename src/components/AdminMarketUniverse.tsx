import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Trade {
  id: string;
  side: string;
  amount: number;
  created_at: string;
  status: string;
  wallet_address: string;
  market_id: string;
}

interface Market {
  id: string;
  title: string;
  category: string;
  yes_total: number | null;
  no_total: number | null;
  fee_bps: number | null;
  status: string;
}

interface AdminMarketUniverseProps {
  markets: Market[];
  trades: Trade[];
  className?: string;
}

interface TradeStar {
  id: string;
  x: number;
  y: number;
  size: number;
  brightness: number;
  side: "YES" | "NO";
  amount: number;
  isSeed: boolean;
}

interface MarketStats {
  totalPool: number;
  yesTotal: number;
  noTotal: number;
  feeAmount: number;
  feeBps: number;
  yesPercent: number;
  noPercent: number;
  tradeCount: number;
  realTradeCount: number;
  avgTradeSize: number;
  maxTradeSize: number;
  minTradeSize: number;
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

// Convert trade to star position
const tradeToStar = (
  trade: Trade,
  allTrades: Trade[],
  maxAmount: number
): TradeStar => {
  const side = trade.side as "YES" | "NO";
  const isSeed = trade.wallet_address === 'SEED_DATA';
  
  // Size based on amount relative to max
  const amountRatio = maxAmount > 0 ? trade.amount / maxAmount : 0.5;
  const baseSize = isSeed ? 2 : 4;
  const sizeRange = isSeed ? 4 : 8;
  const size = baseSize + amountRatio * sizeRange;
  
  // Brightness
  const brightness = isSeed ? 0.4 + amountRatio * 0.3 : 0.5 + amountRatio * 0.5;
  
  // Use hash for consistent scatter
  const hash = hashCode(trade.id);
  const hash2 = hashCode(trade.id + 'y');
  
  // X position: conviction depth from center
  const baseDepth = 0.15 + amountRatio * 0.32;
  const depthJitter = ((hash % 100) / 100 - 0.5) * 0.08;
  const depth = Math.max(0.12, Math.min(0.48, baseDepth + depthJitter));
  
  const x = side === "YES" 
    ? 0.5 - depth
    : 0.5 + depth;
  
  // Y position: spread vertically
  const yBase = 0.22 + ((hash2 % 1000) / 1000) * 0.56;
  const yJitter = ((hash % 50) / 50 - 0.5) * 0.1;
  const y = Math.max(0.15, Math.min(0.85, yBase + yJitter));
  
  return {
    id: trade.id,
    x,
    y,
    size,
    brightness: Math.min(1, brightness),
    side,
    amount: trade.amount,
    isSeed,
  };
};

// Format ALGO amounts (in microAlgos)
const formatAlgo = (microAlgos: number): string => {
  const algos = microAlgos / 1_000_000;
  if (algos >= 1000000) return `${(algos / 1000000).toFixed(2)}M`;
  if (algos >= 1000) return `${(algos / 1000).toFixed(1)}K`;
  return algos.toFixed(2);
};

// Single market universe view
const MarketUniverseView = ({ 
  market,
  trades,
  onClose
}: { 
  market: Market;
  trades: Trade[];
  onClose?: () => void;
}) => {
  const [hoveredStar, setHoveredStar] = useState<TradeStar | null>(null);
  
  const width = 600;
  const height = 360;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const { stars, stats } = useMemo(() => {
    const yesTotal = market.yes_total || 0;
    const noTotal = market.no_total || 0;
    const totalPool = yesTotal + noTotal;
    const feeBps = market.fee_bps || 200;
    const feeAmount = totalPool * feeBps / 10000;
    
    const realTrades = trades.filter(t => t.wallet_address !== 'SEED_DATA');
    const maxAmount = Math.max(...trades.map(t => t.amount), 1);
    const tradeAmounts = trades.map(t => t.amount);
    
    const allStars = trades.map(t => tradeToStar(t, trades, maxAmount));
    
    const marketStats: MarketStats = {
      totalPool,
      yesTotal,
      noTotal,
      feeAmount,
      feeBps,
      yesPercent: totalPool > 0 ? Math.round((yesTotal / totalPool) * 100) : 50,
      noPercent: totalPool > 0 ? Math.round((noTotal / totalPool) * 100) : 50,
      tradeCount: trades.length,
      realTradeCount: realTrades.length,
      avgTradeSize: trades.length > 0 ? tradeAmounts.reduce((a, b) => a + b, 0) / trades.length : 0,
      maxTradeSize: Math.max(...tradeAmounts, 0),
      minTradeSize: Math.min(...tradeAmounts.filter(a => a > 0), 0),
    };
    
    return { stars: allStars, stats: marketStats };
  }, [market, trades]);
  
  return (
    <div className="relative bg-card/50 border border-border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
            {market.title}
          </h3>
          <span className="text-[10px] text-muted-foreground">{market.category}</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            ←
          </button>
        )}
      </div>
      
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Pool</p>
          <p className="text-sm font-bold text-foreground">{formatAlgo(stats.totalPool)}</p>
        </div>
        <div className="bg-primary/10 rounded-lg p-2 text-center">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Fees ({stats.feeBps / 100}%)</p>
          <p className="text-sm font-bold text-primary">{formatAlgo(stats.feeAmount)}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Trades</p>
          <p className="text-sm font-bold text-foreground">{stats.realTradeCount}<span className="text-muted-foreground text-xs">/{stats.tradeCount}</span></p>
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Avg Size</p>
          <p className="text-sm font-bold text-foreground">{formatAlgo(stats.avgTradeSize)}</p>
        </div>
      </div>
      
      {/* Universe SVG */}
      <svg 
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[600px] h-auto mx-auto"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={`admin-yes-${market.id}`} cx="30%" cy="50%" r="45%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`admin-no-${market.id}`} cx="70%" cy="50%" r="45%">
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0" />
          </radialGradient>
          <filter id={`admin-glow-${market.id}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Background */}
        <rect x={2} y={2} width={width - 4} height={height - 4} rx={10} fill="hsl(0, 0%, 3%)" />
        
        {/* Nebulae */}
        <ellipse 
          cx={centerX * 0.5} 
          cy={centerY} 
          rx={width * 0.28} 
          ry={height * 0.4}
          fill={`url(#admin-yes-${market.id})`}
        />
        <ellipse 
          cx={centerX * 1.5} 
          cy={centerY} 
          rx={width * 0.28} 
          ry={height * 0.4}
          fill={`url(#admin-no-${market.id})`}
        />
        
        {/* Fee accumulation ring (center) */}
        <circle
          cx={centerX}
          cy={centerY}
          r={Math.min(25 + (stats.feeAmount / 1000000) * 0.00005, 60)}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          opacity="0.4"
          strokeDasharray="4,2"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={8 + (stats.feeAmount / 1000000) * 0.00003}
          fill="hsl(var(--accent))"
          opacity="0.2"
        />
        
        {/* Center divider */}
        <line 
          x1={centerX} 
          y1={25}
          x2={centerX}
          y2={height - 25}
          stroke="hsl(0, 0%, 20%)"
          strokeWidth="1"
          strokeDasharray="3,5"
          opacity="0.4"
        />
        
        {/* Side labels with amounts */}
        <text 
          x={centerX * 0.5} 
          y={22}
          fill="hsl(var(--primary))"
          fontSize="16"
          fontWeight="700"
          textAnchor="middle"
        >
          YES {stats.yesPercent}%
        </text>
        <text 
          x={centerX * 0.5} 
          y={40}
          fill="hsl(var(--primary))"
          fontSize="11"
          textAnchor="middle"
          opacity="0.7"
        >
          {formatAlgo(stats.yesTotal)} ALGO
        </text>
        
        <text 
          x={centerX * 1.5} 
          y={22}
          fill="hsl(var(--secondary))"
          fontSize="16"
          fontWeight="700"
          textAnchor="middle"
        >
          NO {stats.noPercent}%
        </text>
        <text 
          x={centerX * 1.5} 
          y={40}
          fill="hsl(var(--secondary))"
          fontSize="11"
          textAnchor="middle"
          opacity="0.7"
        >
          {formatAlgo(stats.noTotal)} ALGO
        </text>
        
        {/* Fee label at center */}
        <text 
          x={centerX} 
          y={centerY - 20}
          fill="hsl(var(--accent))"
          fontSize="9"
          textAnchor="middle"
          fontWeight="500"
        >
          FEE POOL
        </text>
        <text 
          x={centerX} 
          y={centerY}
          fill="hsl(var(--accent))"
          fontSize="12"
          textAnchor="middle"
          fontWeight="700"
        >
          {formatAlgo(stats.feeAmount)}
        </text>
        
        {/* Conviction depth labels */}
        <text x={12} y={centerY} fill="hsl(0,0%,35%)" fontSize="8" textAnchor="start" dominantBaseline="middle">
          High Conviction
        </text>
        <text x={width - 12} y={centerY} fill="hsl(0,0%,35%)" fontSize="8" textAnchor="end" dominantBaseline="middle">
          High Conviction
        </text>
        
        {/* Trade stars */}
        {stars.map((star) => {
          const starX = star.x * width;
          const starY = star.y * height;
          const isYes = star.side === "YES";
          const baseColor = isYes ? "hsl(var(--primary))" : "hsl(var(--secondary))";
          const isHovered = hoveredStar?.id === star.id;
          
          if (star.isSeed) {
            // Seed data: light star dust
            return (
              <g 
                key={star.id}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={starX} cy={starY} r={star.size * 1.2} fill="hsl(0, 0%, 85%)" opacity={star.brightness * 0.15} />
                <circle cx={starX} cy={starY} r={star.size * 0.7} fill="hsl(0, 0%, 92%)" opacity={star.brightness * 0.5} />
                <circle cx={starX} cy={starY} r={star.size * 0.25} fill="hsl(0, 0%, 100%)" opacity={star.brightness * 0.65} />
              </g>
            );
          }
          
          // Real user trades: colored stars with glow
          return (
            <g 
              key={star.id}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer glow */}
              <circle cx={starX} cy={starY} r={star.size * 2.2} fill={baseColor} opacity={star.brightness * 0.2} />
              <circle cx={starX} cy={starY} r={star.size * 1.4} fill={baseColor} opacity={star.brightness * 0.4} />
              
              {/* Core */}
              <circle
                cx={starX}
                cy={starY}
                r={star.size}
                fill={baseColor}
                opacity={star.brightness}
                filter={`url(#admin-glow-${market.id})`}
                style={{
                  transform: isHovered ? 'scale(1.4)' : 'scale(1)',
                  transformOrigin: `${starX}px ${starY}px`,
                  transition: 'transform 0.15s',
                }}
              />
              
              {/* Bright center */}
              <circle cx={starX} cy={starY} r={star.size * 0.3} fill="white" opacity={star.brightness * 0.9} />
              
              {/* Hover ring */}
              {isHovered && (
                <circle
                  cx={starX}
                  cy={starY}
                  r={star.size + 5}
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                  opacity={0.6}
                />
              )}
            </g>
          );
        })}
        
        {/* Trade size distribution legend */}
        <text 
          x={centerX} 
          y={height - 12}
          fill="hsl(0, 0%, 50%)"
          fontSize="9"
          textAnchor="middle"
        >
          Size range: {formatAlgo(stats.minTradeSize)} — {formatAlgo(stats.maxTradeSize)} ALGO
        </text>
      </svg>
      
      {/* Tooltip */}
      <AnimatePresence>
        {hoveredStar && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute z-20 px-3 py-2 text-xs bg-card border border-border rounded-lg shadow-xl pointer-events-none"
            style={{
              left: Math.min(hoveredStar.x * 600 * 0.9, 500),
              top: 180,
            }}
          >
            <div className="font-semibold">{hoveredStar.side} · {formatAlgo(hoveredStar.amount)} ALGO</div>
            <div className="text-muted-foreground">{hoveredStar.isSeed ? 'Seed liquidity' : 'User trade'}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Compact card for grid view
const MarketUniverseCard = ({ 
  market,
  trades,
  onClick
}: { 
  market: Market;
  trades: Trade[];
  onClick: () => void;
}) => {
  const width = 220;
  const height = 130;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const { stars, stats } = useMemo(() => {
    const yesTotal = market.yes_total || 0;
    const noTotal = market.no_total || 0;
    const totalPool = yesTotal + noTotal;
    const feeBps = market.fee_bps || 200;
    const feeAmount = totalPool * feeBps / 10000;
    
    const realTrades = trades.filter(t => t.wallet_address !== 'SEED_DATA');
    const maxAmount = Math.max(...trades.map(t => t.amount), 1);
    
    const allStars = trades.slice(0, 20).map(t => tradeToStar(t, trades, maxAmount));
    
    return {
      stars: allStars,
      stats: {
        totalPool,
        yesTotal,
        noTotal,
        feeAmount,
        yesPercent: totalPool > 0 ? Math.round((yesTotal / totalPool) * 100) : 50,
        noPercent: totalPool > 0 ? Math.round((noTotal / totalPool) * 100) : 50,
        tradeCount: trades.length,
        realTradeCount: realTrades.length,
      },
    };
  }, [market, trades]);
  
  return (
    <motion.div 
      className="relative bg-card/50 border border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 hover:bg-card/70 transition-all"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Market title */}
      <h4 className="text-[11px] font-medium text-foreground line-clamp-1 leading-snug mb-1">
        {market.title}
      </h4>
      
      {/* Quick stats */}
      <div className="flex items-center gap-2 text-[9px] text-muted-foreground mb-2">
        <span className="text-primary font-semibold">{formatAlgo(stats.feeAmount)} fee</span>
        <span>·</span>
        <span>{stats.realTradeCount} trades</span>
      </div>
      
      <svg 
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={`admin-card-yes-${market.id}`} cx="30%" cy="50%" r="45%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`admin-card-no-${market.id}`} cx="70%" cy="50%" r="45%">
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Background */}
        <rect x={0} y={0} width={width} height={height} rx={6} fill="hsl(0, 0%, 4%)" />
        
        {/* Nebulae */}
        <ellipse cx={centerX * 0.5} cy={centerY} rx={width * 0.22} ry={height * 0.35} fill={`url(#admin-card-yes-${market.id})`} />
        <ellipse cx={centerX * 1.5} cy={centerY} rx={width * 0.22} ry={height * 0.35} fill={`url(#admin-card-no-${market.id})`} />
        
        {/* Fee center dot */}
        <circle cx={centerX} cy={centerY} r={4} fill="hsl(var(--accent))" opacity="0.5" />
        
        {/* Center divider */}
        <line x1={centerX} y1={12} x2={centerX} y2={height - 12} stroke="hsl(0, 0%, 20%)" strokeWidth="1" strokeDasharray="2,3" opacity="0.3" />
        
        {/* Side percentages */}
        <text x={centerX * 0.5} y={16} fill="hsl(var(--primary))" fontSize="11" fontWeight="600" textAnchor="middle">
          {stats.yesPercent}%
        </text>
        <text x={centerX * 1.5} y={16} fill="hsl(var(--secondary))" fontSize="11" fontWeight="600" textAnchor="middle">
          {stats.noPercent}%
        </text>
        
        {/* Stars */}
        {stars.map((star) => {
          const starX = star.x * width;
          const starY = star.y * height;
          const isYes = star.side === "YES";
          
          if (star.isSeed) {
            return (
              <g key={star.id}>
                <circle cx={starX} cy={starY} r={star.size * 0.5} fill="hsl(0, 0%, 90%)" opacity={star.brightness * 0.4} />
                <circle cx={starX} cy={starY} r={star.size * 0.2} fill="hsl(0, 0%, 100%)" opacity={star.brightness * 0.6} />
              </g>
            );
          }
          
          const baseColor = isYes ? "hsl(var(--primary))" : "hsl(var(--secondary))";
          return (
            <g key={star.id}>
              <circle cx={starX} cy={starY} r={star.size * 0.9} fill={baseColor} opacity={star.brightness * 0.35} />
              <circle cx={starX} cy={starY} r={star.size * 0.5} fill={baseColor} opacity={star.brightness * 0.85} />
              <circle cx={starX} cy={starY} r={star.size * 0.15} fill="white" opacity={0.7} />
            </g>
          );
        })}
        
        {/* Pool amount */}
        <text x={centerX} y={height - 8} fill="hsl(0, 0%, 50%)" fontSize="9" textAnchor="middle">
          {formatAlgo(stats.totalPool)} pool
        </text>
      </svg>
      
      {/* Expand hint */}
      <div className="absolute bottom-2 right-2 text-[8px] text-muted-foreground/50">
        →
      </div>
    </motion.div>
  );
};

export const AdminMarketUniverse = ({
  markets,
  trades,
  className = ""
}: AdminMarketUniverseProps) => {
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  
  // Group trades by market
  const marketTradesMap = useMemo(() => {
    const map = new Map<string, Trade[]>();
    trades.forEach(trade => {
      const existing = map.get(trade.market_id) || [];
      existing.push(trade);
      map.set(trade.market_id, existing);
    });
    return map;
  }, [trades]);
  
  // Get active markets with pools
  const activeMarkets = useMemo(() => {
    return markets.filter(m => {
      const pool = (m.yes_total || 0) + (m.no_total || 0);
      return pool > 0;
    });
  }, [markets]);
  
  const selectedMarket = useMemo(() => {
    return activeMarkets.find(m => m.id === selectedMarketId) || null;
  }, [activeMarkets, selectedMarketId]);
  
  const selectedTrades = useMemo(() => {
    if (!selectedMarketId) return [];
    return marketTradesMap.get(selectedMarketId) || [];
  }, [selectedMarketId, marketTradesMap]);
  
  if (activeMarkets.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ minHeight: 200 }}>
        <div className="text-center text-muted-foreground text-sm">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full border border-border flex items-center justify-center">
            <span className="text-xl">✦</span>
          </div>
          No markets with trading activity
        </div>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {selectedMarket ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <MarketUniverseView 
              market={selectedMarket}
              trades={selectedTrades}
              onClose={() => setSelectedMarketId(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeMarkets.map((market) => (
                <MarketUniverseCard 
                  key={market.id} 
                  market={market}
                  trades={marketTradesMap.get(market.id) || []}
                  onClick={() => setSelectedMarketId(market.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
