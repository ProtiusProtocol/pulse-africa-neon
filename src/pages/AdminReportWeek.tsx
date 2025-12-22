import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Shield, 
  Save, 
  Sparkles, 
  Send,
  FileText,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Digest {
  week_id: string;
  week_start: string;
  week_end: string;
  market_snapshot: any;
  market_moves_md: string | null;
  news_digest_md: string | null;
}

interface AdminInputs {
  top_drivers: string[];
  contrarian_view: string;
  sensitive_avoid: string;
  submitted_at: string | null;
}

interface Report {
  id: string;
  report_type: string;
  status: string;
  content_md: string;
  version: number;
}

export default function AdminReportWeek() {
  const { weekId } = useParams<{ weekId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  
  const [digest, setDigest] = useState<Digest | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [adminInputs, setAdminInputs] = useState<AdminInputs>({
    top_drivers: ["", "", ""],
    contrarian_view: "",
    sensitive_avoid: "",
    submitted_at: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin && weekId) {
      fetchData();
    }
  }, [isAdmin, weekId]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch digest
    const { data: digestData } = await supabase
      .from("weekly_digest")
      .select("*")
      .eq("week_id", weekId)
      .single();
    
    setDigest(digestData);
    
    // Fetch reports
    const { data: reportsData } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("week_id", weekId);
    
    setReports(reportsData || []);
    
    // Fetch admin inputs
    const { data: inputsData } = await supabase
      .from("weekly_admin_inputs")
      .select("*")
      .eq("week_id", weekId)
      .single();
    
    if (inputsData) {
      setAdminInputs({
        top_drivers: inputsData.top_drivers?.length ? inputsData.top_drivers : ["", "", ""],
        contrarian_view: inputsData.contrarian_view || "",
        sensitive_avoid: inputsData.sensitive_avoid || "",
        submitted_at: inputsData.submitted_at,
      });
    }
    
    setLoading(false);
  };

  const handleSaveInputs = async () => {
    setSaving(true);
    try {
      const response = await supabase.functions.invoke("weekly-admin-inputs", {
        body: {
          week_id: weekId,
          top_drivers: adminInputs.top_drivers.filter(d => d.trim()),
          contrarian_view: adminInputs.contrarian_view,
          sensitive_avoid: adminInputs.sensitive_avoid,
        },
      });
      
      if (response.error) throw new Error(response.error.message);
      
      toast.success("Inputs saved successfully");
      setAdminInputs(prev => ({ ...prev, submitted_at: new Date().toISOString() }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save inputs");
    }
    setSaving(false);
  };

  const handleGenerateFinal = async () => {
    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("weekly-generate-final", {
        body: { week_id: weekId },
      });
      
      if (response.error) throw new Error(response.error.message);
      
      toast.success("Final reports generated");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate final reports");
    }
    setGenerating(false);
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const response = await supabase.functions.invoke("weekly-publish", {
        body: { week_id: weekId },
      });
      
      if (response.error) throw new Error(response.error.message);
      
      toast.success("Reports published successfully");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish reports");
    }
    setPublishing(false);
  };

  const formatWeekRange = () => {
    if (!digest) return weekId;
    const start = new Date(digest.week_start).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const end = new Date(digest.week_end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${start} – ${end}`;
  };

  const traderReport = reports.find(r => r.report_type === "trader_pulse");
  const execReport = reports.find(r => r.report_type === "executive_brief");

  const renderMarkdown = (content: string) => {
    return content
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("# ")) {
          return <h1 key={i} className="text-xl font-bold text-primary mb-3 mt-4">{line.slice(2)}</h1>;
        }
        if (line.startsWith("## ")) {
          return <h2 key={i} className="text-lg font-semibold text-foreground mb-2 mt-3">{line.slice(3)}</h2>;
        }
        if (line.startsWith("### ")) {
          return <h3 key={i} className="text-base font-medium text-foreground mb-1 mt-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return <li key={i} className="ml-4 text-sm text-muted-foreground">{line.slice(2)}</li>;
        }
        if (line.trim() === "") {
          return <div key={i} className="h-1" />;
        }
        return <p key={i} className="text-sm text-muted-foreground mb-1">{line}</p>;
      });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (!digest) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/admin/reports" className="text-muted-foreground hover:text-primary mb-8 inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <Card className="border-border/50 bg-card/50 mt-8">
            <CardContent className="py-16 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Week Not Found</h3>
              <p className="text-muted-foreground">No data found for week {weekId}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin/reports" className="text-muted-foreground hover:text-primary mb-2 inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-foreground mt-2">
              Week {weekId}
            </h1>
            <p className="text-muted-foreground">{formatWeekRange()}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {traderReport?.status === "draft" && adminInputs.submitted_at && (
              <Button onClick={handleGenerateFinal} disabled={generating}>
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? "Generating..." : "Generate Final"}
              </Button>
            )}
            {(traderReport?.status === "ready_to_publish" || execReport?.status === "ready_to_publish") && (
              <Button onClick={handlePublish} disabled={publishing} className="bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4 mr-2" />
                {publishing ? "Publishing..." : "Publish All"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Digest & Inputs */}
          <div className="lg:col-span-1 space-y-6">
            {/* Admin Inputs */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Admin Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Top 3 Drivers
                  </label>
                  {adminInputs.top_drivers.map((driver, i) => (
                    <Input
                      key={i}
                      placeholder={`Driver ${i + 1}`}
                      value={driver}
                      onChange={(e) => {
                        const newDrivers = [...adminInputs.top_drivers];
                        newDrivers[i] = e.target.value;
                        setAdminInputs(prev => ({ ...prev, top_drivers: newDrivers }));
                      }}
                      className="mb-2"
                    />
                  ))}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Contrarian View
                  </label>
                  <Textarea
                    placeholder="One contrarian perspective to include..."
                    value={adminInputs.contrarian_view}
                    onChange={(e) => setAdminInputs(prev => ({ ...prev, contrarian_view: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Sensitive Items to Avoid
                  </label>
                  <Textarea
                    placeholder="Topics to soften or avoid..."
                    value={adminInputs.sensitive_avoid}
                    onChange={(e) => setAdminInputs(prev => ({ ...prev, sensitive_avoid: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <Button onClick={handleSaveInputs} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Inputs"}
                </Button>
                
                {adminInputs.submitted_at && (
                  <div className="flex items-center gap-2 text-sm text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    Submitted {new Date(adminInputs.submitted_at).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Digest Summary */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Weekly Digest</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Markets ({digest.market_snapshot.length})</h4>
                  <div className="space-y-1">
                    {digest.market_snapshot.map((market: any, i: number) => (
                      <div key={i} className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                        {market.title} ({market.status})
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Market Moves</h4>
                  <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                    {digest.market_moves_md?.slice(0, 500)}...
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">News Digest</h4>
                  <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                    {digest.news_digest_md?.slice(0, 500)}...
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Reports */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="trader">
              <TabsList className="mb-4">
                <TabsTrigger value="trader" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Trader Pulse
                  {traderReport && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      v{traderReport.version}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="exec" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Executive Brief
                  {execReport && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      v{execReport.version}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="trader">
                <Card className="border-border/50 bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Trader Pulse</CardTitle>
                    {traderReport && (
                      <Badge 
                        variant="outline" 
                        className={
                          traderReport.status === "published" 
                            ? "text-green-500 border-green-500" 
                            : traderReport.status === "ready_to_publish"
                            ? "text-blue-500 border-blue-500"
                            : "text-yellow-500 border-yellow-500"
                        }
                      >
                        {traderReport.status === "draft" && "DRAFT"}
                        {traderReport.status === "ready_to_publish" && "READY"}
                        {traderReport.status === "published" && "PUBLISHED"}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="max-h-[600px] overflow-y-auto">
                    {traderReport ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        {renderMarkdown(traderReport.content_md)}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No report generated yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="exec">
                <Card className="border-border/50 bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Executive Brief</CardTitle>
                    {execReport && (
                      <Badge 
                        variant="outline" 
                        className={
                          execReport.status === "published" 
                            ? "text-green-500 border-green-500" 
                            : execReport.status === "ready_to_publish"
                            ? "text-blue-500 border-blue-500"
                            : "text-yellow-500 border-yellow-500"
                        }
                      >
                        {execReport.status === "draft" && "DRAFT"}
                        {execReport.status === "ready_to_publish" && "READY"}
                        {execReport.status === "published" && "PUBLISHED"}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="max-h-[600px] overflow-y-auto">
                    {execReport ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        {renderMarkdown(execReport.content_md)}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No report generated yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
