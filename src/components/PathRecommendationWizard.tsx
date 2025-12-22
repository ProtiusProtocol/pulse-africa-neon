import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  BookOpen, 
  Users, 
  Mail,
  CheckCircle,
  Target,
  Clock,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";

interface Question {
  id: string;
  question: string;
  options: {
    label: string;
    value: string;
    points: { learn: number; trade: number; inform: number };
  }[];
}

const questions: Question[] = [
  {
    id: "experience",
    question: "How familiar are you with prediction markets?",
    options: [
      { label: "New to them", value: "new", points: { learn: 3, trade: 0, inform: 2 } },
      { label: "Understand the concept", value: "some", points: { learn: 2, trade: 1, inform: 2 } },
      { label: "Actively use them", value: "active", points: { learn: 0, trade: 3, inform: 1 } },
    ],
  },
  {
    id: "goal",
    question: "What's your primary interest?",
    options: [
      { label: "Understanding political risk", value: "understand", points: { learn: 2, trade: 1, inform: 3 } },
      { label: "Making informed decisions", value: "decisions", points: { learn: 2, trade: 2, inform: 2 } },
      { label: "Expressing views through markets", value: "participate", points: { learn: 0, trade: 3, inform: 1 } },
    ],
  },
  {
    id: "time",
    question: "How much time can you commit?",
    options: [
      { label: "5 min weekly (just updates)", value: "minimal", points: { learn: 1, trade: 0, inform: 3 } },
      { label: "30 min weekly (learn & explore)", value: "moderate", points: { learn: 3, trade: 1, inform: 2 } },
      { label: "Active participation", value: "active", points: { learn: 1, trade: 3, inform: 1 } },
    ],
  },
];

const paths = {
  learn: {
    id: "learn",
    title: "Understanding First",
    description: "For those who want to understand fragility deeply before engaging — building shared language and exploring signals with guidance.",
    icon: BookOpen,
    color: "primary",
    link: "/early-access",
    cta: "Start a Conversation",
  },
  inform: {
    id: "inform",
    title: "Stay Informed",
    description: "For those who want to track developments without active participation — receiving curated intelligence directly in your inbox.",
    icon: Mail,
    color: "accent",
    link: "/next-steps",
    cta: "Subscribe to Updates",
  },
  trade: {
    id: "trade",
    title: "Direct Participation",
    description: "For those who already understand prediction markets and are comfortable acting independently to express a view.",
    icon: Users,
    color: "secondary",
    link: "/markets",
    cta: "Participate Directly",
  },
};

export function PathRecommendationWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<keyof typeof paths | null>(null);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateResult = () => {
    const scores = { learn: 0, trade: 0, inform: 0 };
    
    questions.forEach(q => {
      const answer = answers[q.id];
      const option = q.options.find(o => o.value === answer);
      if (option) {
        scores.learn += option.points.learn;
        scores.trade += option.points.trade;
        scores.inform += option.points.inform;
      }
    });

    const maxScore = Math.max(scores.learn, scores.trade, scores.inform);
    if (scores.inform === maxScore) return "inform";
    if (scores.learn === maxScore) return "learn";
    return "trade";
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setResult(calculateResult());
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
    setIsOpen(false);
  };

  const currentQuestion = questions[currentStep];
  const canProceed = answers[currentQuestion?.id];

  if (!isOpen) {
    return (
      <Card className="border-2 border-dashed border-primary/30 bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setIsOpen(true)}>
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Not sure which path?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Take a quick quiz to find the best way to engage with Augurion
          </p>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <Target className="w-4 h-4 mr-2" />
            Find My Path
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (result) {
    const recommended = paths[result];
    const Icon = recommended.icon;
    
    return (
      <Card className="border-primary bg-card">
        <CardContent className="p-6 space-y-6">
          <div className="text-center space-y-4">
            <Badge className="bg-primary/20 text-primary border-primary">
              <CheckCircle className="w-3 h-3 mr-1" />
              Your Recommended Path
            </Badge>
            
            <div className={`w-16 h-16 bg-${recommended.color}/10 rounded-full flex items-center justify-center mx-auto`}>
              <Icon className={`w-8 h-8 text-${recommended.color}`} />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-foreground">{recommended.title}</h3>
              <p className="text-muted-foreground mt-2">{recommended.description}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link to={recommended.link}>
              <Button className="w-full" variant="default">
                {recommended.cta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button variant="ghost" onClick={resetWizard} className="text-muted-foreground">
              Retake Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary bg-card">
      <CardContent className="p-6 space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Question {currentStep + 1} of {questions.length}</span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            {currentQuestion.question}
          </h3>

          <div className="space-y-2">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(currentQuestion.id, option.value)}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  answers[currentQuestion.id] === option.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={currentStep === 0 ? resetWizard : handleBack}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>
          <Button onClick={handleNext} disabled={!canProceed}>
            {currentStep === questions.length - 1 ? "See Result" : "Next"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
