/*
  # Create agency commissions table

  1. New Tables
    - `agency_commissions`
      - `id` (uuid, primary key)
      - `power_kwc` (numeric)
      - `commission_c` (numeric)
      - `commission_s` (numeric)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `agency_commissions` table
    - Add policy for reading commissions
    - Add policy for managing commissions (admin only)
*/

CREATE TABLE IF NOT EXISTS agency_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  power_kwc numeric NOT NULL,
  commission_c numeric NOT NULL,
  commission_s numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE agency_commissions ENABLE ROW LEVEL SECURITY;

-- Create policy for reading commissions
CREATE POLICY "Anyone can read agency commissions" 
  ON agency_commissions
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create policy for managing commissions (admin only)
CREATE POLICY "Admins can manage agency commissions"
  ON agency_commissions
  FOR ALL
  TO authenticated
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');