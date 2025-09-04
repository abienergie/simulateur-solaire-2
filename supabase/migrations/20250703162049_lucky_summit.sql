/*
  # Create monthly_consumption table

  1. New Tables
    - `monthly_consumption`
      - `id` (uuid, primary key)
      - `prm` (text, not null)
      - `month` (date, not null)
      - `hp` (numeric)
      - `hc` (numeric)
      - `total` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `monthly_consumption` table
    - Add policy for public read access
    - Add policy for service role to manage data
*/

CREATE TABLE IF NOT EXISTS monthly_consumption (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prm text NOT NULL,
  month date NOT NULL,
  hp numeric DEFAULT 0,
  hc numeric DEFAULT 0,
  total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(prm, month)
);

-- Enable RLS
ALTER TABLE monthly_consumption ENABLE ROW LEVEL SECURITY;

-- Create policy for reading monthly consumption data
CREATE POLICY "Anyone can read monthly consumption data" 
  ON monthly_consumption
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create policy for service role to manage data
CREATE POLICY "Service role can manage monthly consumption data"
  ON monthly_consumption
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for anonymous users to insert data
CREATE POLICY "Anonymous users can insert monthly consumption data"
  ON monthly_consumption
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy for anonymous users to update data
CREATE POLICY "Anonymous users can update monthly consumption data"
  ON monthly_consumption
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);