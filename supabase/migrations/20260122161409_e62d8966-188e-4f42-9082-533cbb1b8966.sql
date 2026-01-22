-- Allow Xhosa (xh) translations
ALTER TABLE public.market_translations
  DROP CONSTRAINT IF EXISTS market_translations_language_check;

ALTER TABLE public.market_translations
  ADD CONSTRAINT market_translations_language_check
  CHECK (
    language = ANY (ARRAY[
      'fr'::text,
      'pt'::text,
      'de'::text,
      'af'::text,
      'zu'::text,
      'xh'::text,
      'es'::text,
      'it'::text
    ])
  );
