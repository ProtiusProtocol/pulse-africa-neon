import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  ArrowRight, 
  BookOpen, 
  TrendingUp, 
  Bell,
  Sparkles,
  Mail,
  FileText,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";

interface WelcomeFlowProps {
  isOpen: boolean;
  onClose: () => void;
  subscriberName?: string;
  subscribedTo: string[];
}

const steps = [
  {
    id: "welcome",
    title: "Welcome to Augurion",
    subtitle: "You're now part of our intelligence community",
  },
  {
    id: "what-to-expect",
    title: "What to Expect",
    subtitle: "Here's what you'll receive",
  },
  {
    id: "explore-more",
    title: "Explore More",
    subtitle: "Take your engagement further",
  },
];

export function WelcomeFlow({ isOpen, onClose, subscriberName, subscribedTo }: WelcomeFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Welcome{subscriberName ? `, ${subscriberName}` : ""}!
              </h2>
              <p className="text-muted-foreground">
                You're now subscribed to Augurion's weekly intelligence updates
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {subscribedTo.includes("trader_pulse") && (
                <Badge variant="outline" className="border-primary text-primary">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trader Pulse
                </Badge>
              )}
              {subscribedTo.includes("executive_brief") && (
                <Badge variant="outline" className="border-secondary text-secondary">
                  <FileText className="w-3 h-3 mr-1" />
                  Executive Brief
                </Badge>
              )}
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-xl font-bold text-foreground">What You'll Receive</h2>
            </div>
            
            <div className="space-y-4">
              {subscribedTo.includes("trader_pulse") && (
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground">Trader Pulse</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Weekly market analysis with price movements, volume trends, and trading signals for Southern Africa's political risk landscape.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {subscribedTo.includes("executive_brief") && (
                <div className="p-4 rounded-lg border border-secondary/30 bg-secondary/5">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-secondary mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground">Executive Brief</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        High-level intelligence summary for decision-makers. Key developments, risk assessments, and strategic implications.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <Bell className="w-4 h-4" />
                <span>Delivered every Monday morning</span>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Go Deeper</h2>
              <p className="text-muted-foreground">
                Ready to engage more actively?
              </p>
            </div>
            
            <div className="grid gap-3">
              <Link to="/intelligence" onClick={onClose}>
                <div className="p-4 rounded-lg border border-border hover:border-primary/50 bg-card transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-medium text-foreground">Read Past Reports</h3>
                        <p className="text-xs text-muted-foreground">Browse our intelligence archive</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
              
              <Link to="/markets" onClick={onClose}>
                <div className="p-4 rounded-lg border border-border hover:border-secondary/50 bg-card transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-secondary" />
                      <div>
                        <h3 className="font-medium text-foreground">View Live Markets</h3>
                        <p className="text-xs text-muted-foreground">See real-time prediction markets</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
              
              <Link to="/early-access" onClick={onClose}>
                <div className="p-4 rounded-lg border border-border hover:border-accent/50 bg-card transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-accent" />
                      <div>
                        <h3 className="font-medium text-foreground">Join Early Access</h3>
                        <p className="text-xs text-muted-foreground">Get guided onboarding & sandbox access</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <div className="space-y-6">
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-end">
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? "Get Started" : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
