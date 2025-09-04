/*
  # Create detailed Enedis error logging table

  1. New Tables
    - `enedis_error_logs`
      - `id` (uuid, primary key)
      - `endpoint` (text, not null)
      - `pdl` (text, not null)
      - `request_headers` (jsonb)
      - `request_body` (jsonb)
      - `response_status` (integer)
      - `response_headers` (jsonb)
      - `response_body` (text)
      - `error_message` (text)
      - `error_type` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `enedis_error_logs` table
    - Add policy for service role to manage logs
    - Add policy for anonymous users to insert logs
*/

CREATE TABLE IF NOT EXISTS enedis_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  pdl text NOT NULL,
  request_headers jsonb,
  request_body jsonb,
  response_status integer,
  response_headers jsonb,
  response_body text,
  error_message text,
  error_type text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE enedis_error_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to manage logs
CREATE POLICY "Service role can manage enedis_error_logs"
  ON enedis_error_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for anonymous users to insert logs
CREATE POLICY "Anonymous users can insert enedis_error_logs"
  ON enedis_error_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);