/*
  # Token Management Migration

  This migration ensures proper schema and policies for Enedis tokens.
  All token activation and cleanup logic is handled by the enedis-token-refresh Edge Function.

  1. Schema
    - Ensures enedis_tokens table exists with proper structure
    - Maintains RLS policies for security

  2. Security
    - Row Level Security enabled
    - Proper access policies for token management
*/

-- Ensure the enedis_tokens table exists with proper structure
CREATE TABLE IF NOT EXISTS enedis_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_type text NOT NULL,
  access_token text NOT NULL,
  expires_in integer NOT NULL,
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE enedis_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access (used by Edge Functions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'enedis_tokens' 
    AND policyname = 'Service role can manage tokens'
  ) THEN
    CREATE POLICY "Service role can manage tokens"
      ON enedis_tokens
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Token management schema migration completed successfully';
END $$;