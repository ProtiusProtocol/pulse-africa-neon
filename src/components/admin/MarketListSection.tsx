import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  RefreshCw, 
  Languages, 
  Play, 
  Pencil, 
  Trash2, 
  Loader2,
  Rocket,
  X,
  Save,
  Sparkles,
  List
} from "lucide-react";
import { AdminMarketUniverse } from "@/components/AdminMarketUniverse";
import type { Tables } from "@/integrations/supabase/types";

type Market = Tables<'markets'>;
type FragilitySignal = Tables<'fragility_signals'>;
type TradeCounts = Record<string, number>;
type RealTradeCounts = Record<string, number>;
type TradeRecord = {
  id: string;
  market_id: string;
  side: string;
  amount: number;
  wallet_address: string;
  status: string;
  created_at: string;
};

interface MarketListSectionProps {
  markets: Market[];
  signals: FragilitySignal[];
  tradeCounts: TradeCounts;
  realTradeCounts: RealTradeCounts;
  allTrades: TradeRecord[];
  isLoading: boolean;
  actionLoading: string | null;
  isConnected: boolean;
  isBatchTranslating: boolean;
  translatingMarketId: string | null;
  isTranslating: boolean;
  editingMarket: Market | null;
  editForm: {
    title: string;
    category: string;
    region: string;
    linkedSignals: string[];
    deadline: string;
    resolutionCriteria: string;
    resolutionCriteriaFull: string;
    outcomeRef: string;
  };
  isSavingEdit: boolean;
  onTriggerIndexer: () => void;
  onBatchTranslate: () => void;
  onOpenMarket: (market: Market) => void;
  onTranslateMarket: (market: Market) => void;
  onStartEdit: (market: Market) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDeleteMarket: (market: Market) => void;
  onOpenDeployDialog: (market: Market) => void;
  onEditFormChange: (field: string, value: string | string[]) => void;
  onToggleEditSignal: (signalCode: string) => void;
}

export function MarketListSection({
  markets,
  signals,
  tradeCounts,
  realTradeCounts,
  allTrades,
  isLoading,
  actionLoading,
  isConnected,
  isBatchTranslating,
  translatingMarketId,
  isTranslating,
  editingMarket,
  editForm,
  isSavingEdit,
  onTriggerIndexer,
  onBatchTranslate,
  onOpenMarket,
  onTranslateMarket,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteMarket,
  onOpenDeployDialog,
  onEditFormChange,
  onToggleEditSignal,
}: MarketListSectionProps) {
  const [isListOpen, setIsListOpen] = useState(false);
  const [isUniverseOpen, setIsUniverseOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  const getNumericAppId = (appId: string): number | null => {
    const parsed = parseInt(appId, 10);
    return isNaN(parsed) ? null : parsed;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-primary/20 text-primary border-primary">ACTIVE</Badge>;
      case 'frozen':
        return <Badge className="bg-secondary/20 text-secondary border-secondary">FROZEN</Badge>;
      case 'resolved':
        return <Badge className="bg-accent/20 text-accent border-accent">RESOLVED</Badge>;
      case 'cancelled':
        return <Badge className="bg-destructive/20 text-destructive border-destructive">CANCELLED</Badge>;
      case 'pending':
        return <Badge className="bg-muted text-muted-foreground border-muted">PENDING</Badge>;
      default:
        return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
  };

  const handleMarketClick = (market: Market) => {
    setSelectedMarket(selectedMarket?.id === market.id ? null : market);
  };

  const marketTrades = selectedMarket 
    ? allTrades.filter(t => t.market_id === selectedMarket.id)
    : [];

  return (
    <div className="space-y-4">
      {/* Selected Market Detail View */}
      {selectedMarket && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{selectedMarket.title}</CardTitle>
                <CardDescription>
                  App ID: {selectedMarket.app_id} | Outcome Ref: {selectedMarket.outcome_ref}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedMarket(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Market Universe for selected market */}
            <div className="bg-card rounded-lg p-4 border border-border">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Market Universe
              </h4>
              <AdminMarketUniverse 
                markets={[selectedMarket]}
                trades={marketTrades}
              />
            </div>

            {/* Market Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                {getStatusBadge(selectedMarket.status)}
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">YES Pool</p>
                <p className="font-semibold text-primary">{(selectedMarket.yes_total || 0).toLocaleString()}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">NO Pool</p>
                <p className="font-semibold text-accent">{(selectedMarket.no_total || 0).toLocaleString()}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Trades</p>
                <p className="font-semibold">{tradeCounts[selectedMarket.id] || 0}</p>
              </div>
            </div>

            {/* Linked Signals */}
            {selectedMarket.linked_signals && selectedMarket.linked_signals.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Linked Signals</p>
                <div className="flex flex-wrap gap-1">
                  {selectedMarket.linked_signals.map(code => (
                    <Badge key={code} variant="secondary" className="text-xs">{code}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Criteria */}
            {selectedMarket.resolution_criteria && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Resolution Criteria</p>
                <p className="text-sm">{selectedMarket.resolution_criteria}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {selectedMarket.app_id === 'PENDING' && (
                <Button 
                  onClick={() => onOpenDeployDialog(selectedMarket)}
                  disabled={!isConnected}
                  variant="outline"
                  size="sm"
                  className="border-accent text-accent"
                >
                  <Rocket className="w-3 h-3 mr-1" />
                  Deploy
                </Button>
              )}
              {selectedMarket.status === 'pending' && getNumericAppId(selectedMarket.app_id) && (
                <Button 
                  onClick={() => onOpenMarket(selectedMarket)}
                  disabled={actionLoading === selectedMarket.id || !isConnected}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Open
                </Button>
              )}
              <Button 
                onClick={() => onTranslateMarket(selectedMarket)}
                disabled={translatingMarketId === selectedMarket.id || isTranslating}
                variant="secondary"
                size="sm"
              >
                <Languages className="w-3 h-3 mr-1" />
                Translate
              </Button>
              <Button 
                onClick={() => onStartEdit(selectedMarket)}
                disabled={(realTradeCounts[selectedMarket.id] || 0) > 0}
                variant="outline"
                size="sm"
              >
                <Pencil className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button 
                onClick={() => onDeleteMarket(selectedMarket)}
                disabled={actionLoading === selectedMarket.id}
                variant="ghost"
                size="sm"
                className="text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expandable Market List */}
      <Collapsible open={isListOpen} onOpenChange={setIsListOpen}>
        <Card className="border-border bg-card">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">All Markets</CardTitle>
                  <Badge variant="outline">{markets.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {!isListOpen && (
                    <span className="text-sm text-muted-foreground">Click to expand</span>
                  )}
                  {isListOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onBatchTranslate}
                  disabled={isBatchTranslating}
                >
                  {isBatchTranslating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Languages className="w-4 h-4 mr-2" />
                  )}
                  Translate All
                </Button>
                <Button variant="outline" size="sm" onClick={onTriggerIndexer} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Sync from Chain
                </Button>
              </div>

              {/* Market Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {markets.map((market) => {
                  const hasContract = !!getNumericAppId(market.app_id);
                  const isSelected = selectedMarket?.id === market.id;
                  
                  return (
                    <Card 
                      key={market.id} 
                      className={`border-border bg-card cursor-pointer transition-all hover:border-primary/50 ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleMarketClick(market)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-medium text-sm line-clamp-2">{market.title}</h3>
                          {getStatusBadge(market.status)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{market.category}</span>
                          <span>•</span>
                          <span>{market.region}</span>
                          {!hasContract && <Badge variant="outline" className="text-xs">No contract</Badge>}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-primary">YES: {(market.yes_total || 0).toLocaleString()}</span>
                          <span className="text-accent">NO: {(market.no_total || 0).toLocaleString()}</span>
                          <span className="text-muted-foreground">{tradeCounts[market.id] || 0} trades</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Expandable Market Universe */}
      <Collapsible open={isUniverseOpen} onOpenChange={setIsUniverseOpen}>
        <Card className="border-border bg-card">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <CardTitle className="text-lg">Full Market Universe</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {!isUniverseOpen && (
                    <span className="text-sm text-muted-foreground">Click to expand</span>
                  )}
                  {isUniverseOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <AdminMarketUniverse 
                markets={markets}
                trades={allTrades}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
