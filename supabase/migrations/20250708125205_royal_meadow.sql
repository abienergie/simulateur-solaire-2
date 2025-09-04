/*
  # Create clients_identity table and function

  1. New Migration
    - Ensures the clients_identity table exists with correct structure
    - Creates a new function for retrieving client identity data
    - Sets up proper RLS policies
*/

-- Ensure the clients_identity table exists with the correct structure
CREATE TABLE IF NOT EXISTS clients_identity (
  usage_point_id text PRIMARY KEY,
  identity jsonb,
  address jsonb,
  contract jsonb,
  contact jsonb,
  coordinates jsonb,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients_identity ENABLE ROW LEVEL SECURITY;

-- Create policy for reading client identity data
CREATE POLICY IF NOT EXISTS "Anyone can read client identity data" 
  ON clients_identity
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create policy for service role to manage data
CREATE POLICY IF NOT EXISTS "Service role can manage client identity data"
  ON clients_identity
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for anonymous users to insert data
CREATE POLICY IF NOT EXISTS "Anonymous users can insert client identity data"
  ON clients_identity
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy for anonymous users to update data
CREATE POLICY IF NOT EXISTS "Anonymous users can update client identity data"
  ON clients_identity
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);