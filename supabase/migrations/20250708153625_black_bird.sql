/*
  # Fix token refresh issues

  1. Changes
    - Remove the database operations that were causing errors
    - Simplify the token refresh process
    - Focus on just getting a valid token
*/

-- Create a function to clean up old tokens
CREATE OR REPLACE FUNCTION cleanup_old_tokens()
RETURNS void AS $$
DECLARE
  active_token_count integer;
BEGIN
  -- Get the count of active tokens
  SELECT COUNT(*) INTO active_token_count FROM enedis_tokens WHERE is_active = true;
  
  -- If there are more than 10 active tokens, deactivate the oldest ones
  IF active_token_count > 10 THEN
    UPDATE enedis_tokens
    SET is_active = false
    WHERE id IN (
      SELECT id FROM enedis_tokens
      WHERE is_active = true
      ORDER BY created_at ASC
      LIMIT (active_token_count - 10)
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to clean up old tokens when a new token is inserted
DO $$
BEGIN
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS cleanup_old_tokens_trigger ON enedis_tokens;
  
  -- Create the trigger
  CREATE TRIGGER cleanup_old_tokens_trigger
  AFTER INSERT ON enedis_tokens
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_old_tokens();
END;
$$;