/*
  # Create clients_identity table with complete structure

  1. New Table
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

-- Drop existing table if it exists (to ensure clean schema)
DROP TABLE IF EXISTS clients_identity;

-- Create the table with the complete structure
CREATE TABLE clients_identity (
  usage_point_id text PRIMARY KEY,
  identity jsonb,
  address jsonb,
  contract jsonb,
  contact jsonb,
  coordinates jsonb,
  updated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients_identity ENABLE ROW LEVEL SECURITY;

-- Create policy for reading client identity
CREATE POLICY "Anyone can read client identity" 
  ON clients_identity
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create policy for service role to manage client identity
CREATE POLICY "Service role can manage client identity"
  ON clients_identity
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for anonymous users to insert/update client identity
CREATE POLICY "Anonymous users can insert client identity"
  ON clients_identity
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update client identity"
  ON clients_identity
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);