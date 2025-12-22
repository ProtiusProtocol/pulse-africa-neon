import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  RefreshCw, 
  FileText, 
  Briefcase, 
  ArrowRight,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  LogOut,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface WeekStatus {
  week_id: string;
  week_start: string;
  week_end: string;
  has_digest: boolean;
  trader_status: string | null;
  exec_status: string | null;
  admin_submitted: boolean;
}

export default function AdminReports() {
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState<WeekStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchWeekStatuses();
    }
  }, [isAdmin]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const fetchWeekStatuses = async () => {
    setLoading(true);
    
    // Get all digests
    const { data: digests } = await supabase
      .from("weekly_digest")
      .select("week_id, week_start, week_end")
      .order("week_id", { ascending: false })
      .limit(52); // Last year
    
    // Get all reports
    const { data: reports } = await supabase
      .from("weekly_reports")
      .select("week_id, report_type, status");
    
    // Get admin inputs
    const { data: inputs } = await supabase
      .from("weekly_admin_inputs")
      .select("week_id, submitted_at");
    
    const weekStatuses: WeekStatus[] = (digests || []).map(digest => {
      const weekReports = reports?.filter(r => r.week_id === digest.week_id) || [];
      const traderReport = weekReports.find(r => r.report_type === "trader_pulse");
      const execReport = weekReports.find(r => r.report_type === "executive_brief");
      const adminInput = inputs?.find(i => i.week_id === digest.week_id);
      
      return {
        week_id: digest.week_id,
        week_start: digest.week_start,
        week_end: digest.week_end,
        has_digest: true,
        trader_status: traderReport?.status || null,
        exec_status: execReport?.status || null,
        admin_submitted: !!adminInput?.submitted_at,
      };
    });
    
    setWeeks(weekStatuses);
    setLoading(false);
  };

  const handleGenerateDrafts = async () => {
    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("weekly-generate-drafts");
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      toast.success(response.data.message || "Drafts generated successfully");
      fetchWeekStatuses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate drafts");
    }
    setGenerating(false);
  };

  const formatWeekRange = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const end = new Date(weekEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${start} – ${end}`;
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline" className="text-muted-foreground">No Report</Badge>;
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Draft</Badge>;
      case "ready_to_publish":
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Ready</Badge>;
      case "published":
        return <Badge variant="outline" className="text-green-500 border-green-500">Published</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl">Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              You don't have admin privileges. Logged in as: {user.email}
            </p>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Reports Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage weekly intelligence reports
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={fetchWeekStatuses}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button 
              onClick={handleGenerateDrafts}
              disabled={generating}
            >
              {generating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generate This Week
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {weeks.filter(w => w.trader_status === "draft").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Drafts Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {weeks.filter(w => w.trader_status === "ready_to_publish").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Ready to Publish</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {weeks.filter(w => w.trader_status === "published").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weeks List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {weeks.map((week) => (
              <Card key={week.week_id} className="border-border/50 bg-card/50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{week.week_id}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatWeekRange(week.week_start, week.week_end)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {getStatusBadge(week.trader_status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        {getStatusBadge(week.exec_status)}
                      </div>
                      <div className="flex items-center gap-2">
                        {week.admin_submitted ? (
                          <Badge variant="outline" className="text-green-500 border-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Inputs Done
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Needs Input
                          </Badge>
                        )}
                      </div>
                      <Link to={`/admin/reports/${week.week_id}`}>
                        <Button variant="ghost" size="sm">
                          Manage <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {weeks.length === 0 && (
              <Card className="border-border/50 bg-card/50">
                <CardContent className="py-16 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Reports Generated</h3>
                  <p className="text-muted-foreground mb-4">
                    Click "Generate This Week" to create your first weekly reports.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
