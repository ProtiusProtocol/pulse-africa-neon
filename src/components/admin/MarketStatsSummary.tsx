import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Activity, Globe, CheckCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Market = Tables<'markets'>;

interface MarketStatsSummaryProps {
  markets: Market[];
}

export function MarketStatsSummary({ markets }: MarketStatsSummaryProps) {
  // Calculate stats by category
  const categoryStats = markets.reduce((acc, market) => {
    const category = market.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate stats by status
  const statusStats = markets.reduce((acc, market) => {
    const status = market.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate stats by region
  const regionStats = markets.reduce((acc, market) => {
    const region = market.region || 'Unknown';
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);
  const sortedStatuses = Object.entries(statusStats).sort((a, b) => b[1] - a[1]);
  const sortedRegions = Object.entries(regionStats).sort((a, b) => b[1] - a[1]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary/20 text-primary border-primary';
      case 'resolved':
        return 'bg-accent/20 text-accent border-accent';
      case 'frozen':
        return 'bg-secondary/20 text-secondary border-secondary';
      case 'pending':
        return 'bg-muted text-muted-foreground border-muted';
      case 'cancelled':
        return 'bg-destructive/20 text-destructive border-destructive';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <div className="space-y-4">
      {/* Total Markets */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Markets</p>
                <p className="text-3xl font-bold text-primary">{markets.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* By Category */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-secondary" />
              <h3 className="font-medium text-sm">By Category</h3>
            </div>
            <div className="space-y-2">
              {sortedCategories.slice(0, 6).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground truncate">{category}</span>
                  <Badge variant="outline" className="text-xs ml-2">{count}</Badge>
                </div>
              ))}
              {sortedCategories.length > 6 && (
                <p className="text-xs text-muted-foreground">+{sortedCategories.length - 6} more</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Status */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-sm">By Status</h3>
            </div>
            <div className="space-y-2">
              {sortedStatuses.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge className={`text-xs ${getStatusColor(status)}`}>
                    {status.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Region */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-accent" />
              <h3 className="font-medium text-sm">By Region</h3>
            </div>
            <div className="space-y-2">
              {sortedRegions.slice(0, 6).map(([region, count]) => (
                <div key={region} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground truncate">{region}</span>
                  <Badge variant="outline" className="text-xs ml-2">{count}</Badge>
                </div>
              ))}
              {sortedRegions.length > 6 && (
                <p className="text-xs text-muted-foreground">+{sortedRegions.length - 6} more</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
