-- Drop the table if it exists to ensure clean recreation
DROP TABLE IF EXISTS clients_identity;

-- Create the table with the correct structure
CREATE TABLE clients_identity (
  usage_point_id text PRIMARY KEY,
  identity jsonb,
  address jsonb,
  contract jsonb,
  contact jsonb,
  coordinates jsonb,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients_identity ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read client identity data" 
  ON clients_identity
  FOR SELECT 
  TO PUBLIC
  USING (true);

CREATE POLICY "Service role can manage client identity data"
  ON clients_identity
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can insert client identity data"
  ON clients_identity
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update client identity data"
  ON clients_identity
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Insert a test record to verify the table works
INSERT INTO clients_identity (usage_point_id, identity, address, contract, contact, updated_at, created_at)
VALUES (
  '14862373311505',
  '{"customer_id": "test123", "natural_person": {"title": "M", "firstname": "John", "lastname": "Doe"}}',
  '{"street": "123 Test Street", "postal_code": "75001", "city": "Paris", "country": "France"}',
  '{"subscribed_power": "9 kVA", "meter_type": "AMM", "offpeak_hours": "HC (22H00-6H00)"}',
  '{"email": "test@example.com", "phone": "0123456789"}',
  now(),
  now()
);