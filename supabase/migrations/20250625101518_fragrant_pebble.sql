/*
  # Create clients identity table

  1. New Tables
    - `clients_identity`
      - `prm` (text, primary key)
      - `customer_id` (text)
      - `title` (text)
      - `firstname` (text)
      - `lastname` (text)
      - `legal_name` (text)

  2. Security
    - Enable RLS on `clients_identity` table
    - Add policy for public read access
    - Add policy for service role to manage data
*/

CREATE TABLE IF NOT EXISTS clients_identity (
  prm text PRIMARY KEY,
  customer_id text,
  title text,
  firstname text,
  lastname text,
  legal_name text,
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