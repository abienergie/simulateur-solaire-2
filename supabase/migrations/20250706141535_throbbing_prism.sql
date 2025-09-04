/*
  # Update clients_identity table structure

  1. Changes
    - Add natural_person field to identity jsonb column
    - Ensure proper structure for storing customer identity information
    - Maintain existing RLS policies
*/

-- First, check if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients_identity') THEN
    -- The table exists, we'll update the structure of existing records
    
    -- Create a temporary function to update the identity structure
    CREATE OR REPLACE FUNCTION update_identity_structure()
    RETURNS void AS $$
    DECLARE
      rec RECORD;
    BEGIN
      FOR rec IN SELECT usage_point_id, identity FROM clients_identity WHERE identity IS NOT NULL
      LOOP
        -- Check if identity already has natural_person field
        IF rec.identity ? 'natural_person' THEN
          CONTINUE; -- Skip this record, it already has the correct structure
        END IF;
        
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
      END LOOP;
    END;
    $$ LANGUAGE plpgsql;

    -- Execute the function
    PERFORM update_identity_structure();
    
    -- Drop the temporary function
    DROP FUNCTION update_identity_structure();
    
    RAISE NOTICE 'Updated identity structure in clients_identity table';
  ELSE
    -- The table doesn't exist, create it with the correct structure
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