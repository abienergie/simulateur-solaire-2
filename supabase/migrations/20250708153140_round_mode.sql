/*
  # Fix token cleanup function

  1. Changes
    - Remove event trigger approach which is not supported
    - Create a simpler function for token cleanup
    - Run the cleanup function immediately
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
DO $$
BEGIN
  PERFORM cleanup_old_tokens();
END $$;