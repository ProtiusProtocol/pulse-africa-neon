import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  // Group markets by category and sort by total pool
  const { categories, matrixData, maxRows } = useMemo(() => {
    // Get unique categories
    const cats = [...new Set(markets.map(m => m.category))].sort();
    
    // Group and sort markets by category
    const grouped: Record<string, Market[]> = {};
    cats.forEach(cat => {
      grouped[cat] = markets
        .filter(m => m.category === cat)
        .sort((a, b) => {
          const aTotal = (a.yes_total || 0) + (a.no_total || 0);
          const bTotal = (b.yes_total || 0) + (b.no_total || 0);
          return bTotal - aTotal; // Highest activity first
        });
    });
    
    // Find max rows needed
    const max = Math.max(...Object.values(grouped).map(arr => arr.length));
    
    return { categories: cats, matrixData: grouped, maxRows: max };
  }, [markets]);

  if (categories.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No markets to display</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* Category Headers */}
        <div 
          className="grid gap-4 mb-4 sticky top-0 bg-background z-10 pb-2 border-b border-border"
          style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(280px, 1fr))` }}
        >
          {categories.map(category => (
            <div key={category} className="text-center">
              <h3 className="text-lg font-bold text-primary uppercase tracking-wide">
                {category}
              </h3>
              <p className="text-xs text-muted-foreground">
                {matrixData[category].length} markets
              </p>
            </div>
          ))}
        </div>

        {/* Activity Rank Label */}
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <TrendingUp className="w-3 h-3" />
          <span>Ranked by pool size (highest activity at top)</span>
        </div>

        {/* Matrix Rows */}
        {Array.from({ length: maxRows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4 mb-4"
            style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(280px, 1fr))` }}
          >
            {categories.map(category => {
              const market = matrixData[category][rowIndex];
              if (!market) {
                return <div key={`${category}-${rowIndex}-empty`} className="min-h-[120px]" />;
              }
              
              const odds = getOdds(market);
              const totalPool = (market.yes_total || 0) + (market.no_total || 0);
              
              return (
                <Card 
                  key={market.id}
                  className="p-4 bg-card border-border hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => onTrade(market)}
                >
                  <div className="space-y-3">
                    {/* Rank Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        #{rowIndex + 1}
                      </span>
                      {market.deadline && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatCountdown(market.deadline)}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {market.title}
                    </h4>

                    {/* Odds & Pool */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex gap-3">
                        <span className="text-primary font-bold">{odds.yes}% YES</span>
                        <span className="text-secondary font-bold">{odds.no}% NO</span>
                      </div>
                      <span className="text-muted-foreground font-mono">
                        {formatAmount(totalPool)} pool
                      </span>
                    </div>

                    {/* Mini progress bar */}
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${odds.yes}%` }}
                      />
                      <div 
                        className="h-full bg-secondary" 
                        style={{ width: `${odds.no}%` }}
                      />
                    </div>

                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Trade
                    </Button>
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