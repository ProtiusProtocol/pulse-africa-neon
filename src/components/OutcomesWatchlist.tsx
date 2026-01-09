import { useState, useEffect } from "react";
import { Target, Clock, TrendingUp, TrendingDown, Minus, Filter, Calendar, AlertCircle, CheckCircle, Eye, Zap, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OutcomeQuestion {
  id: string;
  signal_code: string;
  question_text: string;
  resolution_criteria: string | null;
  deadline: string;
  status: string;
  probability_current: number;
  probability_previous: number;
  drift_direction: string;
  category: string;
  region: string;
  linked_market_id: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  'WATCH': { 
    color: 'bg-muted text-muted-foreground border-border', 
    icon: <Eye className="w-3 h-3" />,
    label: 'Watch'
  },
  'APPROACHING': { 
    color: 'bg-warning/20 text-warning border-warning/30', 
    icon: <AlertCircle className="w-3 h-3" />,
    label: 'Approaching'
  },
  'DEFINED': { 
    color: 'bg-accent/20 text-accent border-accent/30', 
    icon: <Target className="w-3 h-3" />,
    label: 'Defined'
  },
  'TRADEABLE': { 
    color: 'bg-primary/20 text-primary border-primary/30', 
    icon: <Zap className="w-3 h-3" />,
    label: 'Tradeable'
  },
  'RESOLVED': { 
    color: 'bg-primary/20 text-primary border-primary/30', 
    icon: <CheckCircle className="w-3 h-3" />,
    label: 'Resolved'
  },
  'EXPIRED': { 
    color: 'bg-destructive/20 text-destructive border-destructive/30', 
    icon: <Clock className="w-3 h-3" />,
    label: 'Expired'
  },
};

const SIGNAL_NAMES: Record<string, string> = {
  'FS-01': 'Power System',
  'FS-02': 'Fiscal & Sovereign',
  'FS-03': 'Currency & Capital',
  'FS-04': 'Political Cohesion',
  'FS-05': 'BEE & Regulatory',
  'FS-06': 'Renewable Energy',
  'FS-07': 'Mining Sector',
  'FS-08': 'Healthcare System',
  'FS-09': 'Education System',
  'FS-10': 'Tourism Sector',
};

export const OutcomesWatchlist = () => {
  const [outcomes, setOutcomes] = useState<OutcomeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filterSignal, setFilterSignal] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const { toast } = useToast();

  useEffect(() => {
    fetchOutcomes();
  }, []);

  const fetchOutcomes = async () => {
    const { data, error } = await supabase
      .from('outcomes_watchlist')
      .select('*')
      .order('deadline', { ascending: true });

    if (data) {
      setOutcomes(data);
    }
    if (error) {
      console.error('Error fetching outcomes:', error);
    }
    setLoading(false);
  };

  const handleExportDocx = async () => {
    setExporting(true);
    try {
      const response = await supabase.functions.invoke('export-outcomes-docx');
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      // Convert the response data to a blob and download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Augurion_Outcomes_Watchlist.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: "Outcomes watchlist downloaded as Word document",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not export outcomes",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const getDriftIcon = (drift: string) => {
    if (drift === 'rising') return <TrendingUp className="w-4 h-4 text-destructive" />;
    if (drift === 'falling') return <TrendingDown className="w-4 h-4 text-primary" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();
    
    if (diff < 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    
    if (months > 0) return `${months}mo ${days % 30}d`;
    return `${days}d`;
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'text-destructive';
    if (prob >= 50) return 'text-warning';
    if (prob >= 30) return 'text-accent';
    return 'text-primary';
  };

  // Get unique values for filters
  const signals = ['ALL', ...new Set(outcomes.map(o => o.signal_code))].sort();
  const statuses = ['ALL', 'WATCH', 'APPROACHING', 'DEFINED', 'TRADEABLE'];
  const categories = ['ALL', 'short-term', 'medium-term', 'long-term'];

  // Filter outcomes
  const filteredOutcomes = outcomes.filter(o => {
    const signalMatch = filterSignal === 'ALL' || o.signal_code === filterSignal;
    const statusMatch = filterStatus === 'ALL' || o.status === filterStatus;
    const categoryMatch = filterCategory === 'ALL' || o.category === filterCategory;
    return signalMatch && statusMatch && categoryMatch;
  });

  // Stats
  const stats = {
    total: outcomes.length,
    watch: outcomes.filter(o => o.status === 'WATCH').length,
    approaching: outcomes.filter(o => o.status === 'APPROACHING').length,
    defined: outcomes.filter(o => o.status === 'DEFINED').length,
    tradeable: outcomes.filter(o => o.status === 'TRADEABLE').length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Questions</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{stats.watch}</div>
            <div className="text-xs text-muted-foreground">Watch</div>
          </CardContent>
        </Card>
        <Card className="bg-warning/10 border-warning/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{stats.approaching}</div>
            <div className="text-xs text-warning/80">Approaching</div>
          </CardContent>
        </Card>
        <Card className="bg-accent/10 border-accent/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{stats.defined}</div>
            <div className="text-xs text-accent/80">Defined</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.tradeable}</div>
            <div className="text-xs text-primary/80">Tradeable</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <Select value={filterSignal} onValueChange={setFilterSignal}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Signal" />
          </SelectTrigger>
          <SelectContent>
            {signals.map(s => (
              <SelectItem key={s} value={s}>
                {s === 'ALL' ? 'All Signals' : `${s}: ${SIGNAL_NAMES[s] || s}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(s => (
              <SelectItem key={s} value={s}>
                {s === 'ALL' ? 'All Statuses' : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Timeline" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c} value={c}>
                {c === 'ALL' ? 'All Timelines' : c.replace('-', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3 ml-auto">
          <div className="text-sm text-muted-foreground">
            Showing {filteredOutcomes.length} of {outcomes.length}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportDocx}
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export DOCX'}
          </Button>
        </div>
      </div>

      {/* Outcomes List */}
      <div className="space-y-3">
        {filteredOutcomes.map(outcome => {
          const statusConfig = STATUS_CONFIG[outcome.status] || STATUS_CONFIG['WATCH'];
          const timeRemaining = getTimeRemaining(outcome.deadline);
          
          return (
            <Card 
              key={outcome.id} 
              className={`bg-card border-border hover:border-primary/30 transition-all ${
                outcome.status === 'TRADEABLE' ? 'border-l-4 border-l-primary' : 
                outcome.status === 'DEFINED' ? 'border-l-4 border-l-accent' :
                outcome.status === 'APPROACHING' ? 'border-l-4 border-l-warning' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Main Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary">
                        {outcome.signal_code}
                      </Badge>
                      <Badge variant="outline" className={`${statusConfig.color} border flex items-center gap-1`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {outcome.category.replace('-', ' ')}
                      </Badge>
                    </div>
                    
                    <h3 className="text-sm font-medium text-foreground leading-snug">
                      {outcome.question_text}
                    </h3>
                    
                    {outcome.resolution_criteria && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Resolution:</span> {outcome.resolution_criteria}
                      </p>
                    )}
                  </div>

                  {/* Stats Column */}
                  <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-2 md:min-w-[120px]">
                    {/* Probability */}
                    <div className="text-center md:text-right">
                      <div className={`text-xl font-bold ${getProbabilityColor(outcome.probability_current)}`}>
                        {outcome.probability_current}%
                      </div>
                      <div className="flex items-center justify-center md:justify-end gap-1 text-xs text-muted-foreground">
                        {getDriftIcon(outcome.drift_direction)}
                        <span>probability</span>
                      </div>
                    </div>

                    {/* Time Remaining */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span className={timeRemaining === 'Expired' ? 'text-destructive' : ''}>
                        {timeRemaining}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-20 md:w-full">
                      <Progress value={outcome.probability_current} className="h-1.5" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOutcomes.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No outcomes match your filters</p>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-3">Outcome Status Progression</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={STATUS_CONFIG['WATCH'].color}>
                {STATUS_CONFIG['WATCH'].icon}
                Watch
              </Badge>
              <span className="text-xs text-muted-foreground">Early signal emergence</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={STATUS_CONFIG['APPROACHING'].color}>
                {STATUS_CONFIG['APPROACHING'].icon}
                Approaching
              </Badge>
              <span className="text-xs text-muted-foreground">Signal acceleration</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={STATUS_CONFIG['DEFINED'].color}>
                {STATUS_CONFIG['DEFINED'].icon}
                Defined
              </Badge>
              <span className="text-xs text-muted-foreground">Outcome boundaries crystallizing</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={STATUS_CONFIG['TRADEABLE'].color}>
                {STATUS_CONFIG['TRADEABLE'].icon}
                Tradeable
              </Badge>
              <span className="text-xs text-muted-foreground">Decision-grade clarity</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
