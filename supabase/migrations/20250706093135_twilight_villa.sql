/*
  # Create enedis_identity_logs table

  1. New Tables
    - `enedis_identity_logs`
      - `id` (uuid, primary key)
      - `pdl` (text, not null)
      - `request_headers` (jsonb)
      - `response_status` (integer)
      - `response_headers` (jsonb)
      - `response_body` (text)
      - `error` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `enedis_identity_logs` table
    - Add policy for service role to manage logs
    - Add policy for anonymous users to insert logs
*/

CREATE TABLE IF NOT EXISTS enedis_identity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pdl text NOT NULL,
  request_headers jsonb,
  response_status integer,
  response_headers jsonb,
  response_body text,
  error text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE enedis_identity_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to manage logs
CREATE POLICY "Service role can manage enedis_identity_logs"
  ON enedis_identity_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for anonymous users to insert logs
CREATE POLICY "Anonymous users can insert enedis_identity_logs"
  ON enedis_identity_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);