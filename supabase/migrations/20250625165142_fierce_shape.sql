/*
  # Fix clients_identity table schema

  1. Table Structure
    - Ensure `clients_identity` table exists with correct schema
    - `usage_point_id` as primary key (text)
    - All required JSONB columns for client data
    - Proper timestamps

  2. Security
    - Enable RLS on `clients_identity` table
    - Add policies for public access and service role management
*/

-- First, drop the table if it exists to ensure clean recreation
DROP TABLE IF EXISTS clients_identity CASCADE;

-- Create the table with the correct structure
CREATE TABLE clients_identity (
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

-- Create policies

-- Policy for reading client identity (public access)
CREATE POLICY "Anyone can read client identity" 
  ON clients_identity
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Policy for service role to manage all operations
CREATE POLICY "Service role can manage client identity"
  ON clients_identity
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy for anonymous users to insert client identity
CREATE POLICY "Anonymous users can insert client identity"
  ON clients_identity
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy for anonymous users to update client identity
CREATE POLICY "Anonymous users can update client identity"
  ON clients_identity
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);