import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, Language } from "@/contexts/LanguageContext";

interface TranslationCache {
  [key: string]: string;
}

// Global cache to avoid refetching
const translationCache: { [lang: string]: TranslationCache } = {};

export const useTranslation = (
  sourceTable: 'markets' | 'outcomes_watchlist',
  sourceId: string,
  field: string,
  fallbackText: string
) => {
  const { language, isEnglish } = useLanguage();
  const [translatedText, setTranslatedText] = useState(fallbackText);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If English, always use fallback (English is source of truth)
    if (isEnglish) {
      setTranslatedText(fallbackText);
      return;
    }

    const cacheKey = `${sourceTable}:${sourceId}:${field}`;
    
    // Check cache first
    if (translationCache[language]?.[cacheKey]) {
      setTranslatedText(translationCache[language][cacheKey]);
      return;
    }

    const fetchTranslation = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('market_translations')
          .select('translated_text')
          .eq('source_table', sourceTable)
          .eq('source_id', sourceId)
          .eq('field', field)
          .eq('language', language)
          .maybeSingle();

        if (error) {
          console.error('Translation fetch error:', error);
          setTranslatedText(fallbackText);
        } else if (data?.translated_text) {
          // Cache the result
          if (!translationCache[language]) {
            translationCache[language] = {};
          }
          translationCache[language][cacheKey] = data.translated_text;
          setTranslatedText(data.translated_text);
        } else {
          // No translation found, use fallback
          setTranslatedText(fallbackText);
        }
      } catch (err) {
        console.error('Translation error:', err);
        setTranslatedText(fallbackText);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslation();
  }, [sourceTable, sourceId, field, language, isEnglish, fallbackText]);

  return { text: translatedText, isLoading };
};

// Batch fetch translations for multiple items
export const useBatchTranslations = (
  sourceTable: 'markets' | 'outcomes_watchlist',
  items: { id: string; field: string; fallback: string }[]
) => {
  const { language, isEnglish } = useLanguage();
  const [translations, setTranslations] = useState<{ [id: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If English or no items, use fallbacks
    if (isEnglish || items.length === 0) {
      const fallbacks: { [id: string]: string } = {};
      items.forEach(item => {
        fallbacks[`${item.id}:${item.field}`] = item.fallback;
      });
      setTranslations(fallbacks);
      return;
    }

    const fetchTranslations = async () => {
      setIsLoading(true);
      const result: { [key: string]: string } = {};
      
      // Initialize with fallbacks
      items.forEach(item => {
        result[`${item.id}:${item.field}`] = item.fallback;
      });

      try {
        const ids = [...new Set(items.map(i => i.id))];
        
        const { data, error } = await supabase
          .from('market_translations')
          .select('source_id, field, translated_text')
          .eq('source_table', sourceTable)
          .eq('language', language)
          .in('source_id', ids);

        if (!error && data) {
          data.forEach(t => {
            result[`${t.source_id}:${t.field}`] = t.translated_text;
          });
        }
      } catch (err) {
        console.error('Batch translation error:', err);
      } finally {
        setTranslations(result);
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [sourceTable, items, language, isEnglish]);

  const getTranslation = (id: string, field: string) => {
    return translations[`${id}:${field}`] || '';
  };

  return { getTranslation, isLoading };
};
