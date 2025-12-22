import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CommunityResponseFormProps {
  weekId: string;
  reportType: "trader_pulse" | "executive_brief";
  questionText: string;
}

export function CommunityResponseForm({ weekId, reportType, questionText }: CommunityResponseFormProps) {
  const [response, setResponse] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response.trim()) {
      toast({
        title: "Response required",
        description: "Please enter your response before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from("community_responses")
      .insert({
        week_id: weekId,
        report_type: reportType,
        question_text: questionText,
        response_text: response.trim(),
        respondent_name: name.trim() || null,
      });

    setIsSubmitting(false);

    if (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Submission failed",
        description: "Could not submit your response. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitted(true);
    toast({
      title: "Response submitted",
      description: "Thank you for sharing your insights!",
    });
  };

  if (isSubmitted) {
    return (
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-accent">
            <CheckCircle className="w-6 h-6" />
            <div>
              <p className="font-medium">Thank you for your response!</p>
              <p className="text-sm text-muted-foreground">Your insights will help inform future analysis.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5 text-primary" />
          Share Your Perspective
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3 italic">"{questionText}"</p>
          </div>
          <div>
            <Textarea
              placeholder="Share your thoughts, observations, or predictions..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              className="resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{response.length}/1000</p>
          </div>
          <div>
            <Input
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Response
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
