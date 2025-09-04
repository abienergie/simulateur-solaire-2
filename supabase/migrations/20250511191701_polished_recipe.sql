/*
  # Create subsidies table

  1. New Tables
    - `subsidies`
      - `id` (uuid, primary key)
      - `power_range` (text) - Range of power the subsidy applies to
      - `amount` (numeric) - Subsidy amount
      - `effective_date` (timestamptz) - When the subsidy becomes effective
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `subsidies` table
    - Add policy for public read access
    - Add policy for admin write access
*/

CREATE TABLE IF NOT EXISTS subsidies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  power_range text NOT NULL,
  amount numeric NOT NULL,
  effective_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subsidies ENABLE ROW LEVEL SECURITY;

-- Create policy for reading subsidies
CREATE POLICY "Anyone can read subsidies" 
  ON subsidies
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create policy for managing subsidies (admin only)
CREATE POLICY "Admins can manage subsidies"
  ON subsidies
  FOR ALL
  TO authenticated
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');