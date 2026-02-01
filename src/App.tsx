import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { StickyBanner } from "@/components/StickyBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { WalletProvider } from "@/contexts/WalletContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
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
import NotFound from "./pages/NotFound";
import SoccerLadumaHome from "./pages/SoccerLadumaHome";
import SoccerLadumaMarkets from "./pages/SoccerLadumaMarkets";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

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
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/reports/:weekId" element={<AdminReportWeek />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        
        {/* Soccer Laduma tenant routes */}
        <Route path="/soccer-laduma" element={<SoccerLadumaHome />} />
        <Route path="/soccer-laduma/markets" element={<SoccerLadumaMarkets />} />
        <Route path="/soccer-laduma/*" element={<SoccerLadumaHome />} />
        
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
              <AppRoutes />
            </TenantProvider>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
