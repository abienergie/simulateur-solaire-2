/*
  # Create battery prices table

  1. New Tables
    - `battery_prices_purchase`
      - `id` (uuid, primary key)
      - `model` (text)
      - `capacity` (numeric)
      - `price` (numeric)
      - `autoconsumption_increase` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `battery_prices_purchase` table
    - Add policy for authenticated users to read battery prices
*/

CREATE TABLE IF NOT EXISTS battery_prices_purchase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model text NOT NULL,
  capacity numeric NOT NULL,
  price numeric NOT NULL,
  autoconsumption_increase integer DEFAULT 15,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE battery_prices_purchase ENABLE ROW LEVEL SECURITY;

-- Create policy for reading battery prices
CREATE POLICY "Anyone can read battery prices" 
  ON battery_prices_purchase
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create policy for managing battery prices (admin only)
CREATE POLICY "Admins can manage battery prices"
  ON battery_prices_purchase
  FOR ALL
  TO authenticated
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');