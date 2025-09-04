-- Fix the clients_identity table policies by removing IF NOT EXISTS which is not supported in this context

-- First, check if the table exists
DO $$
BEGIN
  -- Create the table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients_identity') THEN
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
  END IF;
  
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can read client identity data" ON clients_identity;
  DROP POLICY IF EXISTS "Service role can manage client identity data" ON clients_identity;
  DROP POLICY IF EXISTS "Anonymous users can insert client identity data" ON clients_identity;
  DROP POLICY IF EXISTS "Anonymous users can update client identity data" ON clients_identity;
  
  -- Create policies without IF NOT EXISTS
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
END $$;