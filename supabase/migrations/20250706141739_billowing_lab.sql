/*
  # Update clients_identity table structure

  1. Changes
    - Update the identity field structure to include natural_person object
    - Maintain existing data by transforming it to the new structure
    - Keep all existing RLS policies
*/

-- Create a temporary function to update the identity structure
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
    RAISE NOTICE 'clients_identity table does not exist';
  END IF;
END $$;