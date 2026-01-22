import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANGUAGES = [
  { code: "fr", name: "French" },
  { code: "pt", name: "Portuguese" },
  { code: "de", name: "German" },
  { code: "af", name: "Afrikaans" },
  { code: "zu", name: "Zulu (isiZulu)" },
  { code: "xh", name: "Xhosa (isiXhosa)" },
  { code: "es", name: "Spanish" },
  { code: "it", name: "Italian" },
];

interface TranslationResult {
  source_id: string;
  translations_added: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const body = await req.json().catch(() => ({}));
    const sourceTable = body.source_table || "markets";
    const onlyMissing = body.only_missing !== false; // Default to true - only translate items missing translations

    console.log(`Batch translating ${sourceTable}, only_missing: ${onlyMissing}`);

    // Get all items from source table
    let items: { id: string; title?: string; question_text?: string; resolution_criteria?: string }[] = [];
    
    if (sourceTable === "markets") {
      const { data, error } = await supabase
        .from("markets")
        .select("id, title, resolution_criteria")
        .eq("status", "active");
      
      if (error) throw error;
      items = data || [];
    } else if (sourceTable === "outcomes_watchlist") {
      const { data, error } = await supabase
        .from("outcomes_watchlist")
        .select("id, question_text, resolution_criteria");
      
      if (error) throw error;
      items = data || [];
    }

    console.log(`Found ${items.length} items to potentially translate`);

    // Get existing translations to avoid re-translating
    const { data: existingTranslations } = await supabase
      .from("market_translations")
      .select("source_id, language, field")
      .eq("source_table", sourceTable);

    const existingSet = new Set(
      (existingTranslations || []).map(t => `${t.source_id}-${t.language}-${t.field}`)
    );

    const results: TranslationResult[] = [];
    let totalTranslationsAdded = 0;

    for (const item of items) {
      const fields: { field: string; text: string }[] = [];
      
      if (sourceTable === "markets") {
        if (item.title) fields.push({ field: "title", text: item.title });
        if (item.resolution_criteria) fields.push({ field: "resolution_criteria", text: item.resolution_criteria });
      } else {
        if (item.question_text) fields.push({ field: "question_text", text: item.question_text });
        if (item.resolution_criteria) fields.push({ field: "resolution_criteria", text: item.resolution_criteria });
      }

      if (fields.length === 0) continue;

      // Check which languages are missing for this item
      const missingLanguages = onlyMissing
        ? LANGUAGES.filter(lang => {
            const titleField = sourceTable === "markets" ? "title" : "question_text";
            return !existingSet.has(`${item.id}-${lang.code}-${titleField}`);
          })
        : LANGUAGES;

      if (missingLanguages.length === 0) {
        console.log(`Skipping ${item.id} - all translations exist`);
        continue;
      }

      console.log(`Translating ${item.id} to ${missingLanguages.length} languages...`);

      const translations: { language: string; field: string; translated_text: string }[] = [];

      // Translate to each missing language
      for (const lang of missingLanguages) {
        const fieldsText = fields.map((f, i) => `[${i + 1}] ${f.field}: "${f.text}"`).join("\n");

        try {
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content: `You are a professional translator. Translate the following prediction market questions/text from English to ${lang.name}. 
                  
IMPORTANT RULES:
- Keep the meaning precise and clear for betting/prediction contexts
- Maintain any numbers, dates, or proper nouns as-is
- Keep the translation natural and idiomatic for ${lang.name} speakers
- Return ONLY the translations in the exact JSON format requested, nothing else`,
                },
                {
                  role: "user",
                  content: `Translate these texts to ${lang.name}. Return a JSON object with numbered keys matching the input:

${fieldsText}

Return format (JSON only, no markdown):
{"1": "translation for field 1", "2": "translation for field 2", ...}`,
                },
              ],
              temperature: 0.3,
            }),
          });

          if (!response.ok) {
            if (response.status === 429) {
              console.error("Rate limited, waiting before retry...");
              await new Promise((r) => setTimeout(r, 3000));
              continue;
            }
            console.error(`AI error for ${lang.name}:`, response.status);
            continue;
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;

          if (content) {
            try {
              const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
              const parsed = JSON.parse(jsonStr);

              fields.forEach((f, i) => {
                const key = String(i + 1);
                if (parsed[key]) {
                  translations.push({
                    language: lang.code,
                    field: f.field,
                    translated_text: parsed[key],
                  });
                }
              });
            } catch (parseErr) {
              console.error(`Failed to parse translation for ${lang.name}:`, parseErr);
            }
          }

          // Small delay to avoid rate limits
          await new Promise((r) => setTimeout(r, 500));
        } catch (err) {
          console.error(`Error translating to ${lang.name}:`, err);
        }
      }

      // Upsert translations into database
      if (translations.length > 0) {
        const records = translations.map((t) => ({
          source_table: sourceTable,
          source_id: item.id,
          field: t.field,
          language: t.language,
          translated_text: t.translated_text,
        }));

        const { error: upsertError } = await supabase
          .from("market_translations")
          .upsert(records, { onConflict: "source_table,source_id,field,language" });

        if (upsertError) {
          console.error("Upsert error:", upsertError);
        } else {
          totalTranslationsAdded += translations.length;
          results.push({
            source_id: item.id,
            translations_added: translations.length,
          });
        }
      }

      // Delay between items to avoid overwhelming the API
      await new Promise((r) => setTimeout(r, 1000));
    }

    console.log(`Batch translation complete. Added ${totalTranslationsAdded} translations for ${results.length} items.`);

    return new Response(
      JSON.stringify({
        success: true,
        items_processed: results.length,
        total_translations_added: totalTranslationsAdded,
        languages: LANGUAGES.map((l) => l.code),
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Batch translation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
