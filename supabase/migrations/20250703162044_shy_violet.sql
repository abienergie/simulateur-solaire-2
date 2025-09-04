/*
  # Create production_load_curve_data table

  1. New Tables
    - `production_load_curve_data`
      - `id` (uuid, primary key)
      - `prm` (text, not null)
      - `date` (date, not null)
      - `time` (text, not null)
      - `date_time` (timestamptz, not null)
      - `value` (float, not null)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `production_load_curve_data` table
    - Add policy for public read access
    - Add policy for service role to manage data
*/

CREATE TABLE IF NOT EXISTS production_load_curve_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prm text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  date_time timestamptz NOT NULL,
  value float NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(prm, date_time)
);

-- Enable RLS
ALTER TABLE production_load_curve_data ENABLE ROW LEVEL SECURITY;

-- Create policy for reading production load curve data
CREATE POLICY "Anyone can read production load curve data" 
  ON production_load_curve_data
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create policy for service role to manage data
CREATE POLICY "Service role can manage production load curve data"
  ON production_load_curve_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for anonymous users to insert data
CREATE POLICY "Anonymous users can insert production load curve data"
  ON production_load_curve_data
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy for anonymous users to update data
CREATE POLICY "Anonymous users can update production load curve data"
  ON production_load_curve_data
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);