/*
  # Create promo codes table

  1. New Tables
    - `promo_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `discount` (numeric)
      - `active` (boolean)
      - `expiration_date` (timestamptz, nullable)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `promo_codes` table
    - Add policy for reading promo codes
    - Add policy for managing promo codes (admin only)
*/

CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount numeric NOT NULL,
  active boolean DEFAULT true,
  expiration_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for reading promo codes
CREATE POLICY "Anyone can read promo codes" 
  ON promo_codes
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create policy for managing promo codes (admin only)
CREATE POLICY "Admins can manage promo codes"
  ON promo_codes
  FOR ALL
  TO authenticated
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

-- Insert some sample promo codes
INSERT INTO promo_codes (code, discount, active)
VALUES 
  ('SOLEIL2025', 500, true),
  ('BIENVENUE', 300, true),
  ('PRINTEMPS', 250, true);