/*
  # Create Enedis tokens table for automatic refresh

  1. New Tables
    - `enedis_tokens`
      - `id` (uuid, primary key)
      - `token_type` (text, not null)
      - `access_token` (text, not null)
      - `expires_in` (integer, not null)
      - `expires_at` (timestamptz, not null)
      - `scope` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `enedis_tokens` table
    - Add policy for public read access to active tokens
    - Add policy for service role to manage tokens
*/

CREATE TABLE IF NOT EXISTS enedis_tokens (
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