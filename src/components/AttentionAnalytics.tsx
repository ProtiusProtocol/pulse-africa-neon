import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { AttentionHeatMap } from "./AttentionHeatMap";
import { AttentionRecommendations } from "./AttentionRecommendations";
import { Flame, BarChart3, Lightbulb, RefreshCw, Calendar, Filter, Activity, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  code: string;
  name: string;
  category_group: 'fragility' | 'sport';
  description: string;
  display_order: number;
}

interface Score {
  id: string;
  category_id: string;
  week_id: string;
  attention_score: number;
  engagement_score: number;
  market_worthiness_score: number;
  combined_score: number;
}

interface Snapshot {
  id: string;
  week_id: string;
  summary_md: string | null;
  recommended_markets: any[];
  deprioritised_topics: any[];
  sport_percentage: number;
  generated_at: string | null;
}

export function AttentionAnalytics() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [previousScores, setPreviousScores] = useState<Score[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeWindow, setTimeWindow] = useState<'7' | '14' | '30'>('7');
  const [emphasisMode, setEmphasisMode] = useState<'all' | 'fragility' | 'sport'>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      // Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('attention_categories')
        .select('*')
        .order('display_order');

      if (catError) throw catError;
      setCategories((catData || []).map(c => ({
        ...c,
        category_group: c.category_group as 'fragility' | 'sport',
      })));

      // Get available weeks
      const { data: weeksData } = await supabase
        .from('attention_scores')
        .select('week_id')
        .order('week_id', { ascending: false });
      
      const uniqueWeeks = [...new Set((weeksData || []).map(w => w.week_id))];
      setAvailableWeeks(uniqueWeeks);
      
      // Set current week if not set
      const currentWeek = selectedWeek || uniqueWeeks[0] || '';
      if (!selectedWeek && currentWeek) {
        setSelectedWeek(currentWeek);
      }

      if (currentWeek) {
        // Fetch current week scores
        const { data: scoresData, error: scoresError } = await supabase
          .from('attention_scores')
          .select('*')
          .eq('week_id', currentWeek);

        if (scoresError) throw scoresError;
        setScores(scoresData || []);

        // Fetch previous week scores for comparison
        const weekIndex = uniqueWeeks.indexOf(currentWeek);
        if (weekIndex < uniqueWeeks.length - 1) {
          const prevWeek = uniqueWeeks[weekIndex + 1];
          const { data: prevData } = await supabase
            .from('attention_scores')
            .select('*')
            .eq('week_id', prevWeek);
          setPreviousScores(prevData || []);
        }

        // Fetch snapshot
        const { data: snapData } = await supabase
          .from('attention_snapshots')
          .select('*')
          .eq('week_id', currentWeek)
          .maybeSingle();

        if (snapData) {
          setSnapshot({
            ...snapData,
            recommended_markets: Array.isArray(snapData.recommended_markets) ? snapData.recommended_markets : [],
            deprioritised_topics: Array.isArray(snapData.deprioritised_topics) ? snapData.deprioritised_topics : [],
          });
        } else {
          setSnapshot(null);
        }
      }
    } catch (error) {
      console.error('Error fetching attention data:', error);
      toast({
        title: "Error",
        description: "Failed to load attention data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedWeek, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh data from edge function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('attention-ingest');
      
      if (error) throw error;
      
      toast({
        title: "Data Refreshed",
        description: `Processed ${data.categories_processed} categories for ${data.week_id}`,
      });
      
      // Reload data
      await fetchData();
    } catch (error) {
      console.error('Error refreshing attention data:', error);
      toast({
        title: "Refresh Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate stats
  const fragilityCategories = categories.filter(c => c.category_group === 'fragility');
  const sportCategories = categories.filter(c => c.category_group === 'sport');
  
  const avgAttention = scores.length > 0
    ? scores.reduce((sum, s) => sum + s.attention_score, 0) / scores.length
    : 0;
  
  const hotCategories = scores.filter(s => s.combined_score >= 60).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Flame className="w-6 h-6 text-destructive" />
            Attention Heat Map
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track where public attention is concentrating to prioritise markets
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              {availableWeeks.map(week => (
                <SelectItem key={week} value={week}>{week}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1">
            {(['all', 'fragility', 'sport'] as const).map(mode => (
              <Badge
                key={mode}
                variant={emphasisMode === mode ? 'default' : 'outline'}
                className={`cursor-pointer ${emphasisMode === mode ? 'bg-primary' : 'hover:bg-muted'}`}
                onClick={() => setEmphasisMode(mode)}
              >
                {mode === 'all' ? 'All' : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground">Window:</span>
          {(['7', '14', '30'] as const).map(days => (
            <Badge
              key={days}
              variant={timeWindow === days ? 'default' : 'outline'}
              className={`cursor-pointer ${timeWindow === days ? 'bg-secondary' : 'hover:bg-muted'}`}
              onClick={() => setTimeWindow(days)}
            >
              {days}d
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{categories.length}</div>
            <div className="text-xs text-muted-foreground">Categories Tracked</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{hotCategories}</div>
            <div className="text-xs text-muted-foreground">Hot (60+ score)</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{avgAttention.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Avg Attention</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary">{sportCategories.length}/{fragilityCategories.length}</div>
            <div className="text-xs text-muted-foreground">Sport / Fragility</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="heatmap" className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-card border border-border">
          <TabsTrigger value="heatmap" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Heat Map
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2">
            <Lightbulb className="w-4 h-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap">
          {scores.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Data Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click "Refresh Data" to fetch attention scores for this week
                </p>
                <Button onClick={handleRefresh} disabled={refreshing}>
                  <Zap className="w-4 h-4 mr-2" />
                  {refreshing ? 'Fetching...' : 'Fetch Attention Data'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AttentionHeatMap
              categories={categories}
              scores={scores}
              previousScores={previousScores}
              emphasisMode={emphasisMode}
            />
          )}
        </TabsContent>

        <TabsContent value="recommendations">
          <AttentionRecommendations
            snapshot={snapshot}
            categories={categories}
            onRefresh={handleRefresh}
            isLoading={refreshing}
          />
        </TabsContent>
      </Tabs>

      {/* Explanation */}
      <Card className="bg-muted/30 border-border">
        <CardContent className="p-4">
          <h4 className="font-semibold text-foreground mb-2">How This Works</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">Attention Score (40%)</strong>
              <p>External public interest from news, search trends, and media coverage</p>
            </div>
            <div>
              <strong className="text-foreground">Engagement Score (30%)</strong>
              <p>On-platform user activity: page views, clicks, time spent</p>
            </div>
            <div>
              <strong className="text-foreground">Market-Worthiness (30%)</strong>
              <p>How suitable the topic is for clean, settleable prediction markets</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
