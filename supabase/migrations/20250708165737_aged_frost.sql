-- Simple migration to fix token refresh without using functions or triggers
-- This migration ensures only one token is active at a time and fixes the issue with token access

-- First, mark all expired tokens as inactive
UPDATE enedis_tokens
SET is_active = false
WHERE expires_at < NOW() AND is_active = true;

-- Then, ensure only the most recent non-expired token is active
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

-- Delete old tokens to keep the table clean (keep only the 10 most recent)
DELETE FROM enedis_tokens
WHERE id NOT IN (
  SELECT id FROM enedis_tokens
  ORDER BY created_at DESC
  LIMIT 10
);

-- Log the changes
DO $$
DECLARE
  active_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count FROM enedis_tokens WHERE is_active = true;
  SELECT COUNT(*) INTO total_count FROM enedis_tokens;
  
  RAISE NOTICE 'Token cleanup completed: % active tokens out of % total tokens', active_count, total_count;
END $$;