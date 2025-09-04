/*
  # Create production_data table

  1. New Tables
    - `production_data`
      - `id` (uuid, primary key)
      - `prm` (text, not null)
      - `date` (date, not null)
      - `production` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `production_data` table
    - Add policy for public read access
    - Add policy for service role to manage data
*/

CREATE TABLE IF NOT EXISTS production_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prm text NOT NULL,
  date date NOT NULL,
  production numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(prm, date)
);

-- Enable RLS
ALTER TABLE production_data ENABLE ROW LEVEL SECURITY;

-- Create policy for reading production data
CREATE POLICY "Anyone can read production data" 
  ON production_data
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create policy for service role to manage data
CREATE POLICY "Service role can manage production data"
  ON production_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for anonymous users to insert data
CREATE POLICY "Anonymous users can insert production data"
  ON production_data
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy for anonymous users to update data
CREATE POLICY "Anonymous users can update production data"
  ON production_data
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);