import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, Flame, Zap, Activity, Target } from "lucide-react";

interface AttentionScore {
  id: string;
  category_id: string;
  week_id: string;
  attention_score: number;
  engagement_score: number;
  market_worthiness_score: number;
  combined_score: number;
}

interface Category {
  id: string;
  code: string;
  name: string;
  category_group: 'fragility' | 'sport';
  description: string;
  display_order: number;
}

interface AttentionHeatMapProps {
  categories: Category[];
  scores: AttentionScore[];
  previousScores?: AttentionScore[];
  emphasisMode: 'all' | 'fragility' | 'sport';
  onCategoryClick?: (category: Category) => void;
}

export function AttentionHeatMap({
  categories,
  scores,
  previousScores,
  emphasisMode,
  onCategoryClick,
}: AttentionHeatMapProps) {
  // Merge categories with scores
  const categoryData = useMemo(() => {
    return categories
      .filter(cat => {
        if (emphasisMode === 'all') return true;
        return cat.category_group === emphasisMode;
      })
      .map(cat => {
        const score = scores.find(s => s.category_id === cat.id);
        const prevScore = previousScores?.find(s => s.category_id === cat.id);
        
        const attention = score?.attention_score ?? 0;
        const engagement = score?.engagement_score ?? 0;
        const worthiness = score?.market_worthiness_score ?? 0;
        const combined = score?.combined_score ?? 0;
        
        const prevCombined = prevScore?.combined_score ?? combined;
        const trend = combined - prevCombined;
        
        return {
          ...cat,
          attention,
          engagement,
          worthiness,
          combined,
          trend,
          hasData: !!score,
        };
      })
      .sort((a, b) => b.combined - a.combined);
  }, [categories, scores, previousScores, emphasisMode]);

  // Warm-to-cool gradient based on activity (most active = warmest)
  const getHeatColor = (score: number, index: number, total: number) => {
    // Top items get warmest colors, bottom items get coolest
    const position = index / Math.max(total - 1, 1);
    
    if (score >= 80) return 'bg-gradient-to-br from-red-500/90 to-orange-500/80 border-red-500 shadow-red-500/30 shadow-lg';
    if (score >= 70) return 'bg-gradient-to-br from-orange-500/80 to-amber-500/70 border-orange-500 shadow-orange-500/20 shadow-md';
    if (score >= 60) return 'bg-gradient-to-br from-amber-500/70 to-yellow-500/60 border-amber-500';
    if (score >= 50) return 'bg-gradient-to-br from-yellow-500/50 to-lime-500/40 border-yellow-500/70';
    if (score >= 40) return 'bg-gradient-to-br from-lime-500/40 to-emerald-500/30 border-lime-500/50';
    if (score >= 30) return 'bg-gradient-to-br from-emerald-500/30 to-cyan-500/25 border-emerald-500/40';
    if (score >= 20) return 'bg-gradient-to-br from-cyan-500/25 to-blue-500/20 border-cyan-500/30';
    return 'bg-gradient-to-br from-blue-500/15 to-indigo-500/10 border-blue-500/20';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="w-3 h-3 text-red-400 animate-pulse" />;
    if (trend < -5) return <TrendingDown className="w-3 h-3 text-cyan-400" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const getIntensityIcon = (score: number) => {
    if (score >= 80) return <Flame className="w-5 h-5 text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />;
    if (score >= 60) return <Zap className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]" />;
    if (score >= 40) return <Activity className="w-4 h-4 text-lime-400" />;
    return <Activity className="w-4 h-4 text-cyan-400/60" />;
  };

  if (categoryData.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No data available for selected filters
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Heat Legend - Warm to Cool Gradient */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-3 bg-card/50 rounded-lg border border-border/50">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-foreground">Activity Heat:</span>
          <div className="flex items-center gap-1">
            <div className="w-5 h-3 bg-gradient-to-r from-red-500 to-orange-500 rounded shadow-sm" />
            <span className="text-xs text-muted-foreground">80+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded" />
            <span className="text-xs text-muted-foreground">70</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded" />
            <span className="text-xs text-muted-foreground">60</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-3 bg-gradient-to-r from-yellow-500 to-lime-500 rounded" />
            <span className="text-xs text-muted-foreground">50</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-3 bg-gradient-to-r from-lime-500 to-emerald-500 rounded" />
            <span className="text-xs text-muted-foreground">40</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded" />
            <span className="text-xs text-muted-foreground">&lt;30</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Target className="w-3 h-3" />
          <span>Sorted by activity • Most active first</span>
        </div>
      </div>

      {/* Heat Map Grid - Most active signals first */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryData.map((cat, index) => (
          <Tooltip key={cat.id}>
            <TooltipTrigger asChild>
              <Card 
                className={`${getHeatColor(cat.combined, index, categoryData.length)} border-2 cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${
                  cat.category_group === 'sport' ? 'ring-2 ring-secondary/40' : ''
                } ${index === 0 ? 'md:col-span-2 lg:col-span-1' : ''}
                }`}
                onClick={() => onCategoryClick?.(cat)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            cat.category_group === 'sport' 
                              ? 'border-secondary text-secondary' 
                              : 'border-primary text-primary'
                          }`}
                        >
                          #{index + 1}
                        </Badge>
                        {cat.category_group === 'sport' && (
                          <Badge variant="secondary" className="text-xs">
                            Sport
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {cat.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getIntensityIcon(cat.combined)}
                      <div className="text-xl font-bold text-foreground">
                        {cat.combined.toFixed(0)}
                      </div>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(cat.trend)}
                        <span className={`text-xs ${
                          cat.trend > 5 ? 'text-destructive' : 
                          cat.trend < -5 ? 'text-primary' : 
                          'text-muted-foreground'
                        }`}>
                          {cat.trend > 0 ? '+' : ''}{cat.trend.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Score Breakdown */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xs text-muted-foreground">Attention</div>
                        <div className="text-sm font-medium text-foreground">{cat.attention.toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Engage</div>
                        <div className="text-sm font-medium text-foreground">{cat.engagement.toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Market</div>
                        <div className="text-sm font-medium text-foreground">{cat.worthiness.toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-2">
                <p className="font-semibold">{cat.name}</p>
                <p className="text-xs">{cat.description}</p>
                <div className="text-xs text-muted-foreground">
                  Click to see detailed breakdown and market suggestions
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
