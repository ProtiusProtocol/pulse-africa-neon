import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TranslateOptions {
  source_table: "markets" | "outcomes_watchlist";
  source_id: string;
  fields: { field: string; text: string }[];
}

export const useAutoTranslate = () => {
  const [isTranslating, setIsTranslating] = useState(false);

  const translateItem = async ({ source_table, source_id, fields }: TranslateOptions) => {
    if (!source_id || fields.length === 0) return false;

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-market", {
        body: { source_table, source_id, fields },
      });

      if (error) {
        console.error("Translation error:", error);
        toast.error("Failed to generate translations");
        return false;
      }

      toast.success(`Generated ${data.translations_count} translations across ${data.languages.length} languages`);
      return true;
    } catch (err) {
      console.error("Translation error:", err);
      toast.error("Translation failed");
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  // Convenience method for translating a market
  const translateMarket = async (marketId: string, title: string, resolutionCriteria?: string) => {
    const fields = [{ field: "title", text: title }];
    if (resolutionCriteria) {
      fields.push({ field: "resolution_criteria", text: resolutionCriteria });
    }
    return translateItem({ source_table: "markets", source_id: marketId, fields });
  };

  // Convenience method for translating an outcome question
  const translateOutcome = async (outcomeId: string, questionText: string, resolutionCriteria?: string) => {
    const fields = [{ field: "question_text", text: questionText }];
    if (resolutionCriteria) {
      fields.push({ field: "resolution_criteria", text: resolutionCriteria });
    }
    return translateItem({ source_table: "outcomes_watchlist", source_id: outcomeId, fields });
  };

  return {
    isTranslating,
    translateItem,
    translateMarket,
    translateOutcome,
  };
};
