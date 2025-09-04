/*
  # Fix clients_identity table DEFAULT value for created_at

  1. Changes
    - Add DEFAULT value for created_at column to prevent insertion errors
    - Ensure the table structure is robust for upsert operations

  2. Security
    - Maintains existing RLS policies
*/

-- Add DEFAULT value for created_at if it doesn't already have one
DO $$
BEGIN
  -- Check if the table exists and if created_at column needs a default
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients_identity') THEN
    -- Add DEFAULT value for created_at column
    ALTER TABLE clients_identity 
      ALTER COLUMN created_at SET DEFAULT now();
    
    RAISE NOTICE 'Added DEFAULT value for created_at column in clients_identity table';
  ELSE
    RAISE NOTICE 'clients_identity table does not exist';
  END IF;
END $$;