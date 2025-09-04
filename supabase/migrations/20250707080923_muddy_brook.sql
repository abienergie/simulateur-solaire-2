/*
  # Fix token refresh issues

  1. Changes
    - Add retry_count column to enedis_tokens table
    - Add last_error column to enedis_tokens table
    - Add request_headers column to enedis_tokens table
    - Add response_headers column to enedis_tokens table
    - These columns will help with debugging token refresh issues
*/

-- Add new columns to enedis_tokens table if they don't exist
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'enedis_tokens') THEN
    -- Add retry_count column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'enedis_tokens' AND column_name = 'retry_count') THEN
      ALTER TABLE enedis_tokens ADD COLUMN retry_count integer DEFAULT 0;
    END IF;
    
    -- Add last_error column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'enedis_tokens' AND column_name = 'last_error') THEN
      ALTER TABLE enedis_tokens ADD COLUMN last_error text;
    END IF;
    
    -- Add request_headers column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'enedis_tokens' AND column_name = 'request_headers') THEN
      ALTER TABLE enedis_tokens ADD COLUMN request_headers jsonb;
    END IF;
    
    -- Add response_headers column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'enedis_tokens' AND column_name = 'response_headers') THEN
      ALTER TABLE enedis_tokens ADD COLUMN response_headers jsonb;
    END IF;
    
    RAISE NOTICE 'Added debugging columns to enedis_tokens table';
  ELSE
    RAISE NOTICE 'enedis_tokens table does not exist';
  END IF;
END $$;