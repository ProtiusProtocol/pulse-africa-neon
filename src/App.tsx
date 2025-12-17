import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { StickyBanner } from "@/components/StickyBanner";
import { WalletProvider } from "@/contexts/WalletContext";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Markets from "./pages/Markets";
import EarlyAccess from "./pages/EarlyAccess";

import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import Intelligence from "./pages/Intelligence";
import Pulse from "./pages/Pulse";
import Brief from "./pages/Brief";
import Reports from "./pages/Reports";
import AdminReports from "./pages/AdminReports";
import AdminReportWeek from "./pages/AdminReportWeek";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/intelligence" element={<Intelligence />} />
                <Route path="/markets" element={<Markets />} />
                <Route path="/early-access" element={<EarlyAccess />} />
                
                <Route path="/pulse" element={<Pulse />} />
                <Route path="/brief" element={<Brief />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/reports/:weekId" element={<AdminReportWeek />} />
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <StickyBanner />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
