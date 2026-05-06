import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { StickyBanner } from "@/components/StickyBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { WalletProvider } from "@/contexts/WalletContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Markets from "./pages/Markets";
import EarlyAccess from "./pages/EarlyAccess";
import NextSteps from "./pages/NextSteps";

import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import Intelligence from "./pages/Intelligence";
import Pulse from "./pages/Pulse";
import Brief from "./pages/Brief";
import Reports from "./pages/Reports";
import AdminReports from "./pages/AdminReports";
import AdminReportWeek from "./pages/AdminReportWeek";
import Auth from "./pages/Auth";
import Unsubscribe from "./pages/Unsubscribe";
import PastMarkets from "./pages/PastMarkets";
import NotFound from "./pages/NotFound";
import SoccerLadumaHome from "./pages/SoccerLadumaHome";
import SoccerLadumaMarkets from "./pages/SoccerLadumaMarkets";
import SoccerLadumaDashboard from "./pages/SoccerLadumaDashboard";
import SoccerLadumaIntelligence from "./pages/SoccerLadumaIntelligence";
import SoccerLadumaLeaderboard from "./pages/SoccerLadumaLeaderboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin, recheckAccess } = useAuth();
  const [rechecking, setRechecking] = useState(false);
  const [autoRecheckDone, setAutoRecheckDone] = useState(false);
  const routeMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      routeMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setAutoRecheckDone(false);
  }, [user?.id]);

  useEffect(() => {
    if (loading || !user || isAdmin || autoRecheckDone || rechecking) return;

    setRechecking(true);

    recheckAccess().finally(() => {
      if (!routeMountedRef.current) return;
      setAutoRecheckDone(true);
      setRechecking(false);
    });
  }, [autoRecheckDone, isAdmin, loading, recheckAccess, rechecking, user]);

  if (loading || rechecking || (user && !isAdmin && !autoRecheckDone)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">
            {rechecking ? "Refreshing your session and roles..." : "Checking admin access..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/auth?denied=true" replace />;
  }

  return <>{children}</>;
};

// Tenant-aware layout wrapper
const TenantLayout = ({ children }: { children: React.ReactNode }) => {
  const { isDefaultTenant } = useTenant();
  
  // Non-default tenants get their own minimal layout
  if (!isDefaultTenant) {
    return <>{children}</>;
  }
  
  // Default Augurion layout
  return (
    <>
      <Navigation />
      <main className="flex-1">{children}</main>
      <Footer />
      <StickyBanner />
      <WhatsAppButton />
    </>
  );
};

const AppRoutes = () => (
  <div className="flex flex-col min-h-screen">
    <TenantLayout>
      <Routes>
        {/* Augurion routes */}
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/intelligence" element={<Intelligence />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/next-steps" element={<NextSteps />} />
        <Route path="/early-access" element={<EarlyAccess />} />
        
        <Route path="/pulse" element={<Pulse />} />
        <Route path="/brief" element={<Brief />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
        <Route path="/admin/reports/:weekId" element={<AdminRoute><AdminReportWeek /></AdminRoute>} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="/past-markets" element={<PastMarkets />} />
        
        {/* Soccer Laduma tenant routes */}
        <Route path="/soccer-laduma" element={<SoccerLadumaHome />} />
        <Route path="/soccer-laduma/markets" element={<SoccerLadumaMarkets />} />
        <Route path="/soccer-laduma/dashboard" element={<SoccerLadumaDashboard />} />
        <Route path="/soccer-laduma/intelligence" element={<SoccerLadumaIntelligence />} />
        <Route path="/soccer-laduma/leaderboard" element={<SoccerLadumaLeaderboard />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TenantLayout>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <TenantProvider>
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </TenantProvider>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
