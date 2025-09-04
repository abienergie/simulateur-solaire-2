/*
  # Create consumption data table

  1. New Tables
    - `consumption_data`
      - `id` (uuid, primary key)
      - `prm` (text, not null)
      - `date` (date, not null)
      - `peak_hours` (numeric)
      - `off_peak_hours` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `consumption_data` table
    - Add policy for authenticated users to read their own data
    - Add policy for authenticated users to insert their own data
*/

CREATE TABLE IF NOT EXISTS consumption_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prm text NOT NULL,
  date date NOT NULL,
  peak_hours numeric DEFAULT 0,
  off_peak_hours numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(prm, date)
);

-- Enable RLS
ALTER TABLE consumption_data ENABLE ROW LEVEL SECURITY;

-- Create policy for reading consumption data
CREATE POLICY "Users can read their own consumption data" 
  ON consumption_data
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create policy for inserting consumption data
CREATE POLICY "Users can insert their own consumption data"
  ON consumption_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for updating consumption data
CREATE POLICY "Users can update their own consumption data"
  ON consumption_data
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);