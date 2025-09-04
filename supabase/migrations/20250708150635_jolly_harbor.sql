/*
  # Fix token expiry issues in enedis_tokens table

  1. Changes
    - Create a function to check token expiry and update is_active flag
    - Create a trigger to automatically check token expiry on insert or update
    - Update existing tokens to mark expired ones as inactive
    - Ensure only one token is active at a time
*/

-- Create a function to check token expiry and update is_active flag
CREATE OR REPLACE FUNCTION check_token_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- If the token is being inserted or updated and is marked as active
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.is_active = TRUE THEN
    -- Check if the token has expired
    IF NEW.expires_at < NOW() THEN
      -- If expired, mark it as inactive
      NEW.is_active = FALSE;
      RAISE NOTICE 'Token % has expired and is marked as inactive', NEW.id;
    ELSE
      -- If this token is being marked as active, deactivate all other tokens
      UPDATE enedis_tokens
      SET is_active = FALSE
      WHERE id != NEW.id AND is_active = TRUE;
      
      RAISE NOTICE 'Token % is now the only active token', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically check token expiry on insert or update
DO $$
BEGIN
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS check_token_expiry_trigger ON enedis_tokens;
  
  -- Create the trigger
  CREATE TRIGGER check_token_expiry_trigger
  BEFORE INSERT OR UPDATE ON enedis_tokens
  FOR EACH ROW
  EXECUTE FUNCTION check_token_expiry();
  
  -- Update existing tokens to mark expired ones as inactive
  UPDATE enedis_tokens
  SET is_active = FALSE
  WHERE expires_at < NOW() AND is_active = TRUE;
  
  -- Ensure only one token is active - keep the most recent valid one
  WITH latest_valid_token AS (
    SELECT id
    FROM enedis_tokens
    WHERE expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  )
  UPDATE enedis_tokens
  SET is_active = (id IN (SELECT id FROM latest_valid_token))
  WHERE expires_at > NOW();
  
  RAISE NOTICE 'Token expiry trigger created and existing tokens updated';
END $$;