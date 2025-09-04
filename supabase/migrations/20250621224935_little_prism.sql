-- Drop existing table if it exists
DROP TABLE IF EXISTS enedis_tokens;

-- Create a new table with the correct structure
CREATE TABLE enedis_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_type text NOT NULL,
  access_token text NOT NULL,
  expires_in integer NOT NULL,
  expires_at timestamptz NOT NULL,
  scope text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE enedis_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for reading active tokens
CREATE POLICY "Anyone can read active tokens" 
  ON enedis_tokens
  FOR SELECT 
  TO PUBLIC
  USING (is_active = true);

-- Create policy for service role to manage tokens
CREATE POLICY "Service role can manage tokens"
  ON enedis_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for anonymous users to insert tokens
CREATE POLICY "Anonymous users can insert tokens"
  ON enedis_tokens
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy for anonymous users to update tokens
CREATE POLICY "Anonymous users can update tokens"
  ON enedis_tokens
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);