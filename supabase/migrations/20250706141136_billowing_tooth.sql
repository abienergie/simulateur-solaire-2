/*
  # Create clients_identity table

  1. New Tables
    - `clients_identity`
      - `usage_point_id` (text, primary key)
      - `identity` (jsonb)
      - `address` (jsonb)
      - `contract` (jsonb)
      - `contact` (jsonb)
      - `coordinates` (jsonb)
      - `updated_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `clients_identity` table
    - Add policy for public read access
    - Add policy for service role to manage data
*/

-- Create the clients_identity table if it doesn't exist
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
CREATE POLICY "Anyone can read client identity data" 
  ON clients_identity
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create policy for service role to manage data
CREATE POLICY "Service role can manage client identity data"
  ON clients_identity
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for anonymous users to insert data
CREATE POLICY "Anonymous users can insert client identity data"
  ON clients_identity
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy for anonymous users to update data
CREATE POLICY "Anonymous users can update client identity data"
  ON clients_identity
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);