-- Créer une table au lieu d'une vue
CREATE TABLE IF NOT EXISTS monthly_consumption_table (
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
ALTER TABLE monthly_consumption_table ENABLE ROW LEVEL SECURITY;

-- Create policy for reading monthly consumption data
CREATE POLICY "Anyone can read monthly consumption data" 
  ON monthly_consumption_table
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Create policy for service role to manage data
CREATE POLICY "Service role can manage monthly consumption data"
  ON monthly_consumption_table
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for anonymous users to insert data
CREATE POLICY "Anonymous users can insert monthly consumption data"
  ON monthly_consumption_table
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy for anonymous users to update data
CREATE POLICY "Anonymous users can update monthly consumption data"
  ON monthly_consumption_table
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Créer une vue pour la compatibilité avec le code existant
CREATE OR REPLACE VIEW monthly_consumption AS
SELECT * FROM monthly_consumption_table;