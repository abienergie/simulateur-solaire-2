-- Drop existing table if it exists
DROP TABLE IF EXISTS battery_prices_purchase;

CREATE TABLE battery_prices_purchase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model text NOT NULL,
  capacity numeric NOT NULL,
  price numeric NOT NULL,
  autoconsumption_increase integer GENERATED ALWAYS AS (
    CASE 
      WHEN capacity <= 3.5 THEN 12  -- 12% for small batteries
      WHEN capacity <= 5.0 THEN 15  -- 15% for medium batteries
      WHEN capacity <= 7.0 THEN 17  -- 17% for medium-large batteries
      WHEN capacity <= 10.5 THEN 20 -- 20% for large batteries
      ELSE 22                       -- 22% for very large batteries
    END
  ) STORED,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE battery_prices_purchase ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read battery prices" ON battery_prices_purchase;
  DROP POLICY IF EXISTS "Admins can manage battery prices" ON battery_prices_purchase;
END $$;

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