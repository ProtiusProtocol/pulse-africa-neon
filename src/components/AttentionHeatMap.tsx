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

  // Get heat color based on combined score
  const getHeatColor = (score: number, isSport: boolean) => {
    if (score >= 80) return isSport ? 'bg-secondary/80 border-secondary' : 'bg-destructive/80 border-destructive';
    if (score >= 60) return isSport ? 'bg-secondary/50 border-secondary/50' : 'bg-destructive/50 border-destructive/50';
    if (score >= 40) return 'bg-accent/40 border-accent/40';
    if (score >= 20) return 'bg-muted border-border';
    return 'bg-card border-border';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="w-3 h-3 text-destructive" />;
    if (trend < -5) return <TrendingDown className="w-3 h-3 text-primary" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const getIntensityIcon = (score: number) => {
    if (score >= 80) return <Flame className="w-4 h-4 text-destructive animate-pulse" />;
    if (score >= 60) return <Zap className="w-4 h-4 text-accent" />;
    return <Activity className="w-4 h-4 text-muted-foreground" />;
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
      {/* Heat Legend */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Heat Level:</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 bg-destructive/80 rounded" />
            <span className="text-xs">Hot (80+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 bg-destructive/50 rounded" />
            <span className="text-xs">Warm (60-80)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 bg-accent/40 rounded" />
            <span className="text-xs">Moderate (40-60)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 bg-muted rounded" />
            <span className="text-xs">Cool (&lt;40)</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Target className="w-3 h-3" />
          <span>Combined = Attention (40%) + Engagement (30%) + Market-Ready (30%)</span>
        </div>
      </div>

      {/* Heat Map Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categoryData.map((cat, index) => (
          <Tooltip key={cat.id}>
            <TooltipTrigger asChild>
              <Card 
                className={`${getHeatColor(cat.combined, cat.category_group === 'sport')} border-2 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${
                  cat.category_group === 'sport' ? 'ring-1 ring-secondary/30' : ''
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
