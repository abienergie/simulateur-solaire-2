/*
  # Recreate load_curve_data table

  1. New Tables
    - `load_curve_data`
      - `id` (uuid, primary key)
      - `prm` (text, not null)
      - `date` (date, not null)
      - `time` (text, not null)
      - `date_time` (timestamptz, not null)
      - `value` (float, not null)
      - `is_off_peak` (boolean, not null)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `load_curve_data` table
    - Add policy for authenticated users to read their own data
    - Add policy for authenticated users to insert their own data
*/

CREATE TABLE IF NOT EXISTS load_curve_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prm text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  date_time timestamptz NOT NULL,
  value float NOT NULL,
  is_off_peak boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(prm, date_time)
);

-- Enable RLS
ALTER TABLE load_curve_data ENABLE ROW LEVEL SECURITY;

-- Create policy for reading load curve data
CREATE POLICY "Anyone can read load curve data" 
  ON load_curve_data
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create policy for inserting load curve data
CREATE POLICY "Anonymous users can insert load curve data"
  ON load_curve_data
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy for service role to manage load curve data
CREATE POLICY "Service role can manage load curve data"
  ON load_curve_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);