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
  { code: "es", name: "Spanish" },
  { code: "it", name: "Italian" },
];

interface TranslationRequest {
  source_table: "markets" | "outcomes_watchlist";
  source_id: string;
  fields: { field: string; text: string }[];
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

    const { source_table, source_id, fields }: TranslationRequest = await req.json();

    if (!source_table || !source_id || !fields || fields.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: source_table, source_id, fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Translating ${fields.length} field(s) for ${source_table}/${source_id}`);

    // Build the prompt for batch translation
    const fieldsText = fields.map((f, i) => `[${i + 1}] ${f.field}: "${f.text}"`).join("\n");
    
    const translations: { language: string; field: string; translated_text: string }[] = [];

    // Translate to each language
    for (const lang of LANGUAGES) {
      console.log(`Translating to ${lang.name}...`);

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
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        console.error(`AI error for ${lang.name}:`, response.status);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        try {
          // Clean up potential markdown code blocks
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
          console.error(`Failed to parse translation for ${lang.name}:`, parseErr, content);
        }
      }

      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 300));
    }

    console.log(`Generated ${translations.length} translations`);

    // Upsert translations into database
    if (translations.length > 0) {
      const records = translations.map((t) => ({
        source_table,
        source_id,
        field: t.field,
        language: t.language,
        translated_text: t.translated_text,
      }));

      const { error: upsertError } = await supabase
        .from("market_translations")
        .upsert(records, { onConflict: "source_table,source_id,field,language" });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        throw new Error(`Failed to save translations: ${upsertError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        translations_count: translations.length,
        languages: LANGUAGES.map((l) => l.code),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Translation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
