-- Remove any prior schedule with this name (idempotent)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'deployer-wallet-monitor-every-6h';

SELECT cron.schedule(
  'deployer-wallet-monitor-every-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://elrfcqtfdiqevgvbwjac.supabase.co/functions/v1/deployer-wallet-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscmZjcXRmZGlxZXZndmJ3amFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4ODgxNzAsImV4cCI6MjA4MTQ2NDE3MH0.4OqpB2rG2YjQUVIb86FBY3ltT4HPUMdJr5P91gMM9DI'
    ),
    body := '{}'::jsonb
  );
  $$
);