/*
  # Create API logs table

  1. New Tables
    - `api_logs`
      - `id` (uuid, primary key)
      - `endpoint` (text)
      - `request_method` (text)
      - `request_headers` (jsonb)
      - `request_body` (jsonb)
      - `response_status` (integer)
      - `response_headers` (jsonb)
      - `response_body` (text)
      - `error` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `api_logs` table
    - Add policy for service role to manage logs
    - Add policy for anonymous users to insert logs
*/

CREATE TABLE IF NOT EXISTS api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  request_method text NOT NULL,
  request_headers jsonb,
  request_body jsonb,
  response_status integer,
  response_headers jsonb,
  response_body text,
  error text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to manage logs
CREATE POLICY "Service role can manage api_logs"
  ON api_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for anonymous users to insert logs
CREATE POLICY "Anonymous users can insert api_logs"
  ON api_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);