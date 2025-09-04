/*
  # Add token cleanup function and scheduled job

  1. Changes
    - Add a function to clean up old tokens
    - Create a scheduled job to run the cleanup function daily
    - This ensures the tokens table doesn't grow too large
    - Keeps only the most recent tokens for better performance
*/

-- Create a function to clean up old tokens
CREATE OR REPLACE FUNCTION cleanup_old_tokens()
RETURNS void AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Keep only the 10 most recent tokens and delete the rest
  WITH old_tokens AS (
    SELECT id
    FROM enedis_tokens
    WHERE is_active = FALSE
    ORDER BY created_at DESC
    OFFSET 10
  )
  DELETE FROM enedis_tokens
  WHERE id IN (SELECT id FROM old_tokens)
  RETURNING count(*) INTO deleted_count;
  
  -- Log the number of deleted tokens
  RAISE NOTICE 'Deleted % old tokens', deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the cleanup function daily
DO $$
BEGIN
  -- Check if the pg_cron extension is available
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- If pg_cron is available, create a scheduled job
    PERFORM cron.schedule(
      'cleanup-old-tokens',
      '0 0 * * *',  -- Run at midnight every day
      $$SELECT cleanup_old_tokens()$$
    );
    
    RAISE NOTICE 'Scheduled job created to clean up old tokens daily';
  ELSE
    -- If pg_cron is not available, just log a message
    RAISE NOTICE 'pg_cron extension not available, scheduled job not created';
  END IF;
END $$;