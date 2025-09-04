-- Update the clients_identity table to ensure it has the correct structure for storing identity information
-- This migration ensures the identity field has the natural_person structure

-- Create a function to update the identity structure
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients_identity') THEN
    -- Update records that have identity data but not in the new format
    UPDATE clients_identity
    SET identity = jsonb_build_object(
      'customer_id', COALESCE(identity->>'customer_id', '-1'),
      'natural_person', jsonb_build_object(
        'title', COALESCE(identity->>'title', ''),
        'firstname', COALESCE(identity->>'firstname', ''),
        'lastname', COALESCE(identity->>'lastname', '')
      )
    )
    WHERE 
      identity IS NOT NULL 
      AND (identity->'natural_person') IS NULL;
    
    RAISE NOTICE 'Updated identity structure in clients_identity table';
  ELSE
    -- Create the table if it doesn't exist
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
    
    -- Create policy for reading client identity data
    CREATE POLICY "Anyone can read client identity data" 
      ON clients_identity
      FOR SELECT 
      TO PUBLIC
      USING (true);
    
    -- Create policy for service role to manage data
    CREATE POLICY "Service role can manage client identity data"
      ON clients_identity
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    
    -- Create policy for anonymous users to insert data
    CREATE POLICY "Anonymous users can insert client identity data"
      ON clients_identity
      FOR INSERT
      TO anon
      WITH CHECK (true);
    
    -- Create policy for anonymous users to update data
    CREATE POLICY "Anonymous users can update client identity data"
      ON clients_identity
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
    
    RAISE NOTICE 'Created clients_identity table with correct structure';
  END IF;
END $$;