import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Check, 
  X, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
interface MarketSuggestion {
  id: string;
  signal_code: string;
  suggested_title: string;
  suggested_outcome_ref: string;
  suggested_category: string;
  suggested_region: string;
  suggested_deadline: string | null;
  suggested_resolution_criteria: string | null;
  ai_reasoning: string | null;
  source_signal_direction: string | null;
  status: string;
  created_at: string;
  created_market_id: string | null;
}
interface MarketSuggestionsReviewProps {
  onCreateMarket?: (suggestion: MarketSuggestion) => void;
}

export function MarketSuggestionsReview({ onCreateMarket }: MarketSuggestionsReviewProps) {
  const [suggestions, setSuggestions] = useState<MarketSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('market_suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch suggestions", variant: "destructive" });
    } else {
      setSuggestions((data || []) as MarketSuggestion[]);
    }
    setIsLoading(false);
  };

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('fragility-market-suggestions');
      
      if (response.error) throw response.error;
      
      toast({ 
        title: "Suggestions Generated", 
        description: `Created ${response.data.suggestionsCreated} new market suggestions` 
      });
      
      await fetchSuggestions();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to generate suggestions", 
        variant: "destructive" 
      });
    }
    setIsGenerating(false);
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    setActionLoading(id);
    
    const suggestion = suggestions.find(s => s.id === id);
    
    // If approving, create a market record with PENDING app_id
    if (status === 'approved' && suggestion) {
      const { data: newMarket, error: marketError } = await supabase
        .from('markets')
        .insert({
          app_id: 'PENDING',
          title: suggestion.suggested_title,
          outcome_ref: suggestion.suggested_outcome_ref,
          category: suggestion.suggested_category,
          region: suggestion.suggested_region,
          deadline: suggestion.suggested_deadline,
          resolution_criteria: suggestion.suggested_resolution_criteria,
          status: 'draft',
          linked_signals: [suggestion.signal_code]
        })
        .select('id')
        .single();

      if (marketError) {
        toast({ title: "Error", description: "Failed to create market record", variant: "destructive" });
        setActionLoading(null);
        return;
      }

      // Update suggestion with created_market_id and status
      const { error: updateError } = await supabase
        .from('market_suggestions')
        .update({ 
          status: 'approved', 
          reviewed_at: new Date().toISOString(),
          created_market_id: newMarket.id
        })
        .eq('id', id);

      if (updateError) {
        toast({ title: "Error", description: "Failed to update suggestion", variant: "destructive" });
      } else {
        toast({ 
          title: "Market Created", 
          description: `Created market with outcome_ref: ${suggestion.suggested_outcome_ref}. Ready for Algorand deployment.` 
        });
        setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'approved', created_market_id: newMarket.id } : s));
      }
    } else {
      // For reject/pending, just update the suggestion status
      const { error } = await supabase
        .from('market_suggestions')
        .update({ 
          status, 
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
      } else {
        toast({ title: "Updated", description: `Suggestion ${status}` });
        setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      }
    }
    setActionLoading(null);
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const approvedSuggestions = suggestions.filter(s => s.status === 'approved');
  const rejectedSuggestions = suggestions.filter(s => s.status === 'rejected');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/50"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/50"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/50"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'Not set';
    return new Date(deadline).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <Card className="border-accent/30 bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading suggestions...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-semibold">AI Market Suggestions</h2>
          {pendingSuggestions.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingSuggestions.length} pending review
            </Badge>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={generateSuggestions}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" />Generate from Signals</>
          )}
        </Button>
      </div>

      {suggestions.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-6 text-center text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No market suggestions yet.</p>
            <p className="text-sm">Click "Generate from Signals" to create suggestions from elevated fragility signals.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Pending Suggestions */}
          {pendingSuggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Pending Review</h3>
              {pendingSuggestions.map((suggestion) => (
                <Card key={suggestion.id} className="border-yellow-500/30 bg-yellow-500/5">
                  <CardContent className="p-4">
                    <Collapsible open={expandedId === suggestion.id} onOpenChange={(open) => setExpandedId(open ? suggestion.id : null)}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className="text-xs font-mono">{suggestion.signal_code}</Badge>
                            <Badge variant="secondary" className="text-xs">{suggestion.suggested_category}</Badge>
                            {getStatusBadge(suggestion.status)}
                          </div>
                          <h4 className="font-medium text-sm mb-1">{suggestion.suggested_title}</h4>
                          <p className="text-xs text-muted-foreground font-mono">
                            ID: {suggestion.suggested_outcome_ref}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Deadline: {formatDeadline(suggestion.suggested_deadline)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {expandedId === suggestion.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </CollapsibleTrigger>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-green-500 border-green-500/50 hover:bg-green-500/10"
                            onClick={() => updateStatus(suggestion.id, 'approved')}
                            disabled={actionLoading === suggestion.id}
                          >
                            {actionLoading === suggestion.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                            onClick={() => updateStatus(suggestion.id, 'rejected')}
                            disabled={actionLoading === suggestion.id}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                        <CollapsibleContent className="mt-4 pt-4 border-t border-border">
                        <div className="space-y-3 text-sm">
                          {suggestion.suggested_resolution_criteria && (
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Resolution Criteria</p>
                              <p className="text-foreground">{suggestion.suggested_resolution_criteria}</p>
                            </div>
                          )}
                          {suggestion.ai_reasoning && (
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">AI Reasoning</p>
                              <p className="text-muted-foreground">{suggestion.ai_reasoning}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Approving will create a market with <span className="font-mono">app_id=PENDING</span> ready for Algorand deployment.
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Approved Suggestions */}
          {approvedSuggestions.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-muted-foreground hover:text-foreground">
                  <span className="text-sm font-medium uppercase tracking-wide">
                    Approved ({approvedSuggestions.length})
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {approvedSuggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="border-green-500/20 bg-green-500/5">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono">{suggestion.signal_code}</Badge>
                        <span className="text-sm flex-1 truncate">{suggestion.suggested_title}</span>
                        {getStatusBadge(suggestion.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Rejected Suggestions */}
          {rejectedSuggestions.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-muted-foreground hover:text-foreground">
                  <span className="text-sm font-medium uppercase tracking-wide">
                    Rejected ({rejectedSuggestions.length})
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {rejectedSuggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="border-red-500/20 bg-red-500/5 opacity-60">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono">{suggestion.signal_code}</Badge>
                        <span className="text-sm flex-1 truncate">{suggestion.suggested_title}</span>
                        {getStatusBadge(suggestion.status)}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-xs"
                          onClick={() => updateStatus(suggestion.id, 'pending')}
                        >
                          Restore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </section>
  );
}
