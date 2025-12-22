import { X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
export const StickyBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();

  // Hide on admin pages and dashboard
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname === '/admin';
  if (!isVisible || isAdminPage) return null;
  return <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/90 via-accent/90 to-primary/90 backdrop-blur-sm border-t border-primary/20 animate-fade-in">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <p className="text-sm md:text-base font-medium text-primary-foreground">🚀 Be an early test user for Africa's first prediction market and outcome intelligence platform</p>
        <div className="flex items-center gap-2">
          <NavLink to="/early-access">
            <Button variant="neon" size="sm" className="whitespace-nowrap">
              Join Beta
            </Button>
          </NavLink>
          <button onClick={() => setIsVisible(false)} className="p-1 hover:bg-background/20 rounded transition-colors" aria-label="Close banner">
            <X className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>;
};