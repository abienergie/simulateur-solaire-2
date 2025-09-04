/*
  # Create max_power_data table

  1. New Tables
    - `max_power_data`
      - `id` (uuid, primary key)
      - `prm` (text, not null)
      - `date` (date, not null)
      - `max_power` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `max_power_data` table
    - Add policy for public read access
    - Add policy for service role to manage data
*/

CREATE TABLE IF NOT EXISTS max_power_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prm text NOT NULL,
  date date NOT NULL,
  max_power numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(prm, date)
);

-- Enable RLS
ALTER TABLE max_power_data ENABLE ROW LEVEL SECURITY;

-- Create policy for reading max power data
CREATE POLICY "Anyone can read max power data" 
  ON max_power_data
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create policy for service role to manage data
CREATE POLICY "Service role can manage max power data"
  ON max_power_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for anonymous users to insert data
CREATE POLICY "Anonymous users can insert max power data"
  ON max_power_data
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy for anonymous users to update data
CREATE POLICY "Anonymous users can update max power data"
  ON max_power_data
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);