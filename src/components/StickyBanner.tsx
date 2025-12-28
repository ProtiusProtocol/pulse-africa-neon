import { X, BookOpen, Zap } from "lucide-react";
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

  const offers = [
    {
      icon: BookOpen,
      text: "FREE E-Book: Master Precision Market Trading",
      cta: "Get Your Copy",
      link: "/early-access",
      highlight: "📘"
    },
    {
      icon: Zap,
      text: "Join our Tester Programme — Trade with ZERO Fees",
      cta: "Start Testing",
      link: "/early-access",
      highlight: "⚡"
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/95 via-accent/95 to-primary/95 backdrop-blur-sm border-t border-primary/20">
      <div className="relative overflow-hidden py-2.5">
        {/* Close button */}
        <button 
          onClick={() => setIsVisible(false)} 
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 hover:bg-background/20 rounded-full transition-colors bg-background/10"
          aria-label="Close banner"
        >
          <X className="w-4 h-4 text-primary-foreground" />
        </button>

        {/* Ticker tape animation */}
        <div className="flex animate-ticker">
          {[...offers, ...offers, ...offers, ...offers].map((offer, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-8 whitespace-nowrap"
            >
              <span className="text-lg">{offer.highlight}</span>
              <offer.icon className="w-4 h-4 text-primary-foreground" />
              <span className="text-sm font-medium text-primary-foreground">
                {offer.text}
              </span>
              <NavLink to={offer.link}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-3 text-xs bg-background/20 border-primary-foreground/30 text-primary-foreground hover:bg-background/40 hover:text-primary-foreground"
                >
                  {offer.cta}
                </Button>
              </NavLink>
              <span className="text-primary-foreground/30 px-4">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};