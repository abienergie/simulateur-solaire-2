/*
  # Fix token refresh issues and cleanup old tokens

  1. Changes
    - Create a function to clean up old tokens
    - Ensure only one token is active at a time
    - Fix issues with token storage and activation
*/

-- Create a function to clean up old tokens
CREATE OR REPLACE FUNCTION cleanup_old_tokens()
RETURNS void AS $$
DECLARE
  active_token_count integer;
  active_token_id uuid;
BEGIN
  -- Check if there are multiple active tokens
  SELECT COUNT(*) INTO active_token_count
  FROM enedis_tokens
  WHERE is_active = true;
  
  -- If there are multiple active tokens, keep only the most recent one
  IF active_token_count > 1 THEN
    -- Find the most recent active token
    SELECT id INTO active_token_id
    FROM enedis_tokens
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Deactivate all other tokens
    UPDATE enedis_tokens
    SET is_active = false
    WHERE is_active = true
    AND id != active_token_id;
    
    RAISE NOTICE 'Deactivated % old active tokens', active_token_count - 1;
  END IF;
  
  -- Delete tokens older than 7 days
  DELETE FROM enedis_tokens
  WHERE created_at < (NOW() - INTERVAL '7 days')
  AND is_active = false;
  
  -- Check for expired but still active tokens
  UPDATE enedis_tokens
  SET is_active = false
  WHERE expires_at < NOW()
  AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Run the cleanup function
SELECT cleanup_old_tokens();

-- Create a trigger to run the cleanup function daily
DO $$
BEGIN
  -- Check if the event trigger function exists
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'daily_token_cleanup') THEN
    -- Create the event trigger function
    CREATE OR REPLACE FUNCTION daily_token_cleanup()
    RETURNS event_trigger AS $$
    BEGIN
      PERFORM cleanup_old_tokens();
    END;
    $$ LANGUAGE plpgsql;
    
    -- Create the event trigger
    CREATE EVENT TRIGGER daily_token_cleanup_trigger
    ON ddl_command_end
    EXECUTE FUNCTION daily_token_cleanup();
  END IF;
END $$;