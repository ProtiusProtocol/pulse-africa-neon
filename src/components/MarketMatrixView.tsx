import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type SortMode = "pool" | "deadline";

interface Market {
  id: string;
  title: string;
  category: string;
  yes_total: number | null;
  no_total: number | null;
  deadline: string | null;
  linked_signals: string[] | null;
}

interface MarketMatrixViewProps {
  markets: Market[];
  onTrade: (market: Market) => void;
  getOdds: (market: Market) => { yes: number; no: number };
}

const formatAmount = (amount: number): string => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toFixed(0);
};

const formatCountdown = (deadline: string): string => {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 30) return `${Math.floor(days / 30)}mo`;
  if (days > 0) return `${days}d`;
  return `${hours}h`;
};

export const MarketMatrixView = ({ markets, onTrade, getOdds }: MarketMatrixViewProps) => {
  const [sortMode, setSortMode] = useState<SortMode>("pool");

  // Group markets by category and sort by selected mode
  const { categories, matrixData, maxRows } = useMemo(() => {
    // Get unique categories
    const cats = [...new Set(markets.map(m => m.category))].sort();
    
    // Group and sort markets by category
    const grouped: Record<string, Market[]> = {};
    cats.forEach(cat => {
      grouped[cat] = markets
        .filter(m => m.category === cat)
        .sort((a, b) => {
          if (sortMode === "pool") {
            const aTotal = (a.yes_total || 0) + (a.no_total || 0);
            const bTotal = (b.yes_total || 0) + (b.no_total || 0);
            return bTotal - aTotal; // Highest activity first
          } else {
            // Sort by deadline - shortest first, nulls at end
            const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity;
            const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity;
            return aDeadline - bDeadline;
          }
        });
    });
    
    // Find max rows needed
    const max = Math.max(...Object.values(grouped).map(arr => arr.length));
    
    return { categories: cats, matrixData: grouped, maxRows: max };
  }, [markets, sortMode]);

  if (categories.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No markets to display</p>;
  }

  return (
    <div className="w-full">
      {/* Sort Toggle */}
      <div className="flex items-center gap-4 mb-3">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        <ToggleGroup 
          type="single" 
          value={sortMode} 
          onValueChange={(v) => v && setSortMode(v as SortMode)}
          size="sm"
        >
          <ToggleGroupItem value="pool" className="text-xs gap-1 h-7 px-2">
            <TrendingUp className="w-3 h-3" />
            Pool
          </ToggleGroupItem>
          <ToggleGroupItem value="deadline" className="text-xs gap-1 h-7 px-2">
            <Clock className="w-3 h-3" />
            Expiry
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Category Headers */}
      <div 
        className="grid gap-2 mb-2 pb-2 border-b border-border"
        style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}
      >
        {categories.map(category => (
          <div key={category} className="text-center">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wide truncate">
              {category}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {matrixData[category].length}
            </p>
          </div>
        ))}
      </div>

      {/* Matrix Rows */}
      <div className="space-y-2">
        {Array.from({ length: maxRows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}
          >
            {categories.map(category => {
              const market = matrixData[category][rowIndex];
              if (!market) {
                return <div key={`${category}-${rowIndex}-empty`} className="min-h-[60px]" />;
              }
              
              const odds = getOdds(market);
              const totalPool = (market.yes_total || 0) + (market.no_total || 0);
              
              return (
                <Card 
                  key={market.id}
                  className="p-2 bg-card border-border hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => onTrade(market)}
                >
                  <div className="space-y-1">
                    {/* Header row with rank and deadline */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        #{rowIndex + 1}
                      </span>
                      {market.deadline && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatCountdown(market.deadline)}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-[11px] font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {market.title}
                    </h4>

                    {/* Odds bar */}
                    <div className="h-1 bg-muted rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${odds.yes}%` }}
                      />
                      <div 
                        className="h-full bg-secondary" 
                        style={{ width: `${odds.no}%` }}
                      />
                    </div>

                    {/* Odds text */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-primary font-semibold">{odds.yes}%</span>
                      <span className="text-muted-foreground font-mono">
                        {formatAmount(totalPool)}
                      </span>
                      <span className="text-secondary font-semibold">{odds.no}%</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};