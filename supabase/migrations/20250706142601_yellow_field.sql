-- Update the clients_identity table to ensure it has the correct structure for storing identity information
-- This migration ensures the identity field has the natural_person structure as shown in the screenshot

-- Create a function to update the identity structure
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients_identity') THEN
    -- Loop through all records with identity data
    FOR rec IN SELECT usage_point_id, identity FROM clients_identity WHERE identity IS NOT NULL
    LOOP
      -- Check if identity already has natural_person field
      IF (rec.identity->'natural_person') IS NULL THEN
        -- Create the new structure
        UPDATE clients_identity
        SET identity = jsonb_build_object(
          'customer_id', COALESCE(rec.identity->>'customer_id', '-1'),
          'natural_person', jsonb_build_object(
            'title', COALESCE(rec.identity->>'title', ''),
            'firstname', COALESCE(rec.identity->>'firstname', ''),
            'lastname', COALESCE(rec.identity->>'lastname', '')
          )
        )
        WHERE usage_point_id = rec.usage_point_id;
      END IF;
    END LOOP;
    
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