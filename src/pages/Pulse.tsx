import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, ArrowRight, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Report {
  id: string;
  week_id: string;
  report_type: string;
  content_md: string;
  published_at: string;
  status: string;
}

interface WeekDigest {
  week_id: string;
  week_start: string;
  week_end: string;
}

export default function Pulse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [weeks, setWeeks] = useState<WeekDigest[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeks();
  }, []);

  useEffect(() => {
    const weekParam = searchParams.get("week");
    if (weekParam) {
      setSelectedWeek(weekParam);
    } else if (weeks.length > 0) {
      setSelectedWeek(weeks[0].week_id);
    }
  }, [searchParams, weeks]);

  useEffect(() => {
    if (selectedWeek) {
      fetchReport(selectedWeek);
    }
  }, [selectedWeek]);

  const fetchWeeks = async () => {
    const { data } = await supabase
      .from("weekly_reports")
      .select("week_id")
      .eq("report_type", "trader_pulse")
      .eq("status", "published")
      .order("week_id", { ascending: false });

    if (data) {
      const uniqueWeeks = [...new Set(data.map(r => r.week_id))];
      // Fetch digest info for week ranges
      const { data: digests } = await supabase
        .from("weekly_digest")
        .select("week_id, week_start, week_end")
        .in("week_id", uniqueWeeks);
      
      setWeeks(digests || []);
    }
    setLoading(false);
  };

  const fetchReport = async (weekId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("week_id", weekId)
      .eq("report_type", "trader_pulse")
      .eq("status", "published")
      .single();

    setCurrentReport(data);
    setLoading(false);
  };

  const handleWeekChange = (value: string) => {
    setSelectedWeek(value);
    setSearchParams({ week: value });
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

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering - convert headers, bold, tables, lists
    return content
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("# ")) {
          return <h1 key={i} className="text-2xl font-bold text-primary mb-4 mt-6">{line.slice(2)}</h1>;
        }
        if (line.startsWith("## ")) {
          return <h2 key={i} className="text-xl font-semibold text-foreground mb-3 mt-5">{line.slice(3)}</h2>;
        }
        if (line.startsWith("### ")) {
          return <h3 key={i} className="text-lg font-medium text-foreground mb-2 mt-4">{line.slice(4)}</h3>;
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return <li key={i} className="ml-4 text-muted-foreground">{line.slice(2)}</li>;
        }
        if (line.match(/^\d+\.\s/)) {
          return <li key={i} className="ml-4 list-decimal text-muted-foreground">{line.replace(/^\d+\.\s/, "")}</li>;
        }
        if (line.startsWith("|")) {
          const cells = line.split("|").filter(c => c.trim());
          if (cells.every(c => c.trim().match(/^-+$/))) return null;
          return (
            <div key={i} className="grid grid-cols-4 gap-2 py-1 border-b border-border/50">
              {cells.map((cell, j) => (
                <span key={j} className="text-sm text-muted-foreground">{cell.trim()}</span>
              ))}
            </div>
          );
        }
        if (line.trim() === "") {
          return <div key={i} className="h-2" />;
        }
        return <p key={i} className="text-muted-foreground mb-2">{line}</p>;
      });
  };

  if (loading && !currentReport) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-[600px] w-full" />
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
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Trader Pulse
            </h1>
            <p className="text-muted-foreground mt-1">
              Weekly market intelligence for traders
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedWeek} onValueChange={handleWeekChange}>
              <SelectTrigger className="w-[200px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((week) => (
                  <SelectItem key={week.week_id} value={week.week_id}>
                    {formatWeekRange(week.week_id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" disabled>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Report Content */}
        {currentReport ? (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-primary">
                  Trader Pulse — {selectedWeek}
                </CardTitle>
                <Badge variant="outline" className="text-primary border-primary">
                  {formatWeekRange(selectedWeek)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 prose prose-invert max-w-none">
              {renderMarkdown(currentReport.content_md)}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="py-16 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Reports Available</h3>
              <p className="text-muted-foreground mb-4">
                There are no published Trader Pulse reports yet.
              </p>
              <Link to="/reports">
                <Button variant="outline">
                  View All Reports <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border/50">
          <Link to="/brief" className="text-muted-foreground hover:text-primary transition-colors">
            View Executive Brief →
          </Link>
          <Link to="/reports" className="text-muted-foreground hover:text-primary transition-colors">
            All Reports →
          </Link>
        </div>
      </div>
    </div>
  );
}
