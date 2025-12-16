import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Briefcase, Calendar, ArrowRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Report {
  id: string;
  week_id: string;
  report_type: string;
  status: string;
  published_at: string;
}

interface WeekDigest {
  week_id: string;
  week_start: string;
  week_end: string;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [weeks, setWeeks] = useState<WeekDigest[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data: reportsData } = await supabase
      .from("weekly_reports")
      .select("id, week_id, report_type, status, published_at")
      .eq("status", "published")
      .order("week_id", { ascending: false });

    if (reportsData) {
      setReports(reportsData);
      
      const uniqueWeeks = [...new Set(reportsData.map(r => r.week_id))];
      const { data: digests } = await supabase
        .from("weekly_digest")
        .select("week_id, week_start, week_end")
        .in("week_id", uniqueWeeks);
      
      setWeeks(digests || []);
    }
    setLoading(false);
  };

  const formatWeekRange = (weekId: string) => {
    const digest = weeks.find(w => w.week_id === weekId);
    if (digest) {
      const start = new Date(digest.week_start).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const end = new Date(digest.week_end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      return `${start} – ${end}`;
    }
    return weekId;
  };

  const filteredReports = filterType === "all" 
    ? reports 
    : reports.filter(r => r.report_type === filterType);

  // Group by week
  const groupedByWeek = filteredReports.reduce((acc, report) => {
    if (!acc[report.week_id]) {
      acc[report.week_id] = [];
    }
    acc[report.week_id].push(report);
    return acc;
  }, {} as Record<string, Report[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Intelligence Archive
            </h1>
            <p className="text-muted-foreground mt-1">
              Historical weekly reports
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="trader_pulse">Trader Pulse</SelectItem>
                <SelectItem value="executive_brief">Executive Brief</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reports List */}
        {Object.keys(groupedByWeek).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedByWeek)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([weekId, weekReports]) => (
                <Card key={weekId} className="border-border/50 bg-card/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {weekId}
                      </CardTitle>
                      <Badge variant="outline" className="text-muted-foreground">
                        {formatWeekRange(weekId)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {weekReports.map((report) => (
                        <Link
                          key={report.id}
                          to={report.report_type === "trader_pulse" 
                            ? `/pulse?week=${weekId}` 
                            : `/brief?week=${weekId}`}
                          className="block"
                        >
                          <div className="p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {report.report_type === "trader_pulse" ? (
                                  <FileText className="h-5 w-5 text-primary" />
                                ) : (
                                  <Briefcase className="h-5 w-5 text-primary" />
                                )}
                                <div>
                                  <h3 className="font-medium text-foreground">
                                    {report.report_type === "trader_pulse" 
                                      ? "Trader Pulse" 
                                      : "Executive Brief"}
                                  </h3>
                                  <p className="text-xs text-muted-foreground">
                                    Published {new Date(report.published_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Published Reports</h3>
              <p className="text-muted-foreground">
                Reports will appear here once they are published.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-border/50">
          <Link to="/pulse">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Latest Trader Pulse
            </Button>
          </Link>
          <Link to="/brief">
            <Button variant="outline" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Latest Executive Brief
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
