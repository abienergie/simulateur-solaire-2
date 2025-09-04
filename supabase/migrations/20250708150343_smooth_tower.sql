/*
  # Fix Enedis tokens table expiry issues

  1. Changes
    - Add a trigger to automatically deactivate expired tokens
    - Add a function to check token expiry and update is_active flag
    - This ensures that expired tokens are not considered active
    - Improves reliability of token refresh mechanism
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
  
  RAISE NOTICE 'Token expiry trigger created and existing tokens updated';
END $$;