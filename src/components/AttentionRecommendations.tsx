import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingDown, AlertCircle, Sparkles, ChevronRight, Clock } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface Recommendation {
  category_code: string;
  combined_score: number;
  reason: string;
}

interface Deprioritised {
  category_code: string;
  reason: string;
}

interface Snapshot {
  id: string;
  week_id: string;
  summary_md: string | null;
  recommended_markets: Recommendation[];
  deprioritised_topics: Deprioritised[];
  sport_percentage: number;
  generated_at: string | null;
}

interface Category {
  id: string;
  code: string;
  name: string;
  category_group: 'fragility' | 'sport';
}

interface AttentionRecommendationsProps {
  snapshot: Snapshot | null;
  categories: Category[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function AttentionRecommendations({
  snapshot,
  categories,
  onRefresh,
  isLoading,
}: AttentionRecommendationsProps) {
  const getCategoryName = (code: string) => {
    const cat = categories.find(c => c.code === code);
    return cat?.name || code;
  };

  const getCategoryGroup = (code: string) => {
    const cat = categories.find(c => c.code === code);
    return cat?.category_group || 'fragility';
  };

  if (!snapshot) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Snapshot Available</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Run the attention ingestion to generate recommendations
          </p>
          <Button onClick={onRefresh} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Now'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const recommendations = snapshot.recommended_markets || [];
  const deprioritised = snapshot.deprioritised_topics || [];

  return (
    <div className="space-y-6">
      {/* Summary */}
      {snapshot.summary_md && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-primary" />
                Weekly Summary
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {snapshot.week_id}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none">
              <MarkdownRenderer content={snapshot.summary_md} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Markets */}
      <Card className="bg-card border-border border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-primary" />
              Recommended Markets
            </CardTitle>
            <Badge variant="default" className="bg-primary/20 text-primary">
              {recommendations.length} suggestions
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Based on attention, engagement, and market viability scores
          </p>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              No recommendations generated yet
            </p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={rec.category_code}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {getCategoryName(rec.category_code)}
                        </span>
                        {getCategoryGroup(rec.category_code) === 'sport' && (
                          <Badge variant="secondary" className="text-xs">
                            Sport
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rec.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {rec.combined_score?.toFixed(0) || '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">score</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sport Balance Warning */}
          {snapshot.sport_percentage > 30 && (
            <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <div className="flex items-center gap-2 text-accent">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Sport categories at {snapshot.sport_percentage.toFixed(0)}% — above 30% threshold
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deprioritised Topics */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingDown className="w-5 h-5 text-muted-foreground" />
            Deprioritised Topics
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Low attention or poor market characteristics this week
          </p>
        </CardHeader>
        <CardContent>
          {deprioritised.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              No deprioritised topics
            </p>
          ) : (
            <div className="space-y-2">
              {deprioritised.map((topic) => (
                <div
                  key={topic.category_code}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {getCategoryName(topic.category_code)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {topic.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={onRefresh} 
          disabled={isLoading}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
    </div>
  );
}
