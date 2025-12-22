import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MessageSquare, Wallet, BookOpen, Users, ArrowRight, Mail, Bell } from "lucide-react";
import { PathRecommendationWizard } from "@/components/PathRecommendationWizard";
import { EmailSubscribeForm } from "@/components/EmailSubscribeForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const NextSteps = () => {
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Choose How to Engage
            </h1>
            
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                People engage with Augurion in different ways.
              </p>
              <p>
                There is no right or wrong path — only the one that matches how you prefer to explore new systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendation Wizard */}
      <section className="pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <PathRecommendationWizard />
          </div>
        </div>
      </section>

      {/* Three Paths Section */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Path 1: Education & Relationship */}
            <div className="p-8 bg-card border border-border rounded-lg hover:border-primary/30 transition-all">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      Understanding First
                    </h2>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    For those who want to understand fragility deeply before engaging — building shared language and exploring signals with guidance.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                    What this involves
                  </h3>
                  <ul className="space-y-2 text-sm text-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>Learning how fragility signals are constructed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>Discussion with our team about domains of interest</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>Guided sandbox access when appropriate</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-border">
                  <Link to="/early-access">
                    <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:border-primary">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Start a Conversation
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Path 2: Stay Informed */}
            <div className="p-8 bg-card border border-border rounded-lg hover:border-accent/30 transition-all">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                      <Mail className="w-6 h-6 text-accent" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      Stay Informed
                    </h2>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    For those who want to track developments without active participation — receiving curated intelligence directly in your inbox.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-accent uppercase tracking-wider">
                    What this involves
                  </h3>
                  <ul className="space-y-2 text-sm text-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                      <span>Weekly Trader Pulse with market analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                      <span>Executive Brief for strategic overview</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                      <span>No wallet or commitment required</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    className="w-full border-accent/50 text-accent hover:bg-accent/10 hover:border-accent"
                    onClick={() => setShowSubscribeModal(true)}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Subscribe to Updates
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Path 3: Direct Participation */}
            <div className="p-8 bg-card border border-border rounded-lg hover:border-secondary/30 transition-all">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-secondary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      Direct Participation
                    </h2>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    For those who already understand prediction markets and are comfortable acting independently to express a view.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                    What this involves
                  </h3>
                  <ul className="space-y-2 text-sm text-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 flex-shrink-0" />
                      <span>Connecting a wallet to the platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 flex-shrink-0" />
                      <span>Taking positions on live fragility signals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 flex-shrink-0" />
                      <span>Expressing views through informed participation</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-border">
                  <Link to="/markets">
                    <Button variant="outline" className="w-full border-secondary/50 text-secondary hover:bg-secondary/10 hover:border-secondary">
                      <Wallet className="w-4 h-4 mr-2" />
                      Participate Directly
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing Note */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-muted-foreground text-lg">
              All paths lead to the same destination — a clearer view of how outcomes are shifting.
              <br />
              <span className="text-foreground font-medium">The difference is only in how you prefer to engage.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Subscribe Modal */}
      <Dialog open={showSubscribeModal} onOpenChange={setShowSubscribeModal}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-center">Subscribe to Weekly Updates</DialogTitle>
          </DialogHeader>
          <EmailSubscribeForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NextSteps;
