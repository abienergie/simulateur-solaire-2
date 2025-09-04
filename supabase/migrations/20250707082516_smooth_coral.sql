/*
  # Add token refresh debugging and retry improvements

  1. Changes
    - Add new columns to enedis_tokens table for better debugging
    - Add request_id column to track individual requests
    - Add user_agent column to track client information
    - Add retry_delay column to store the delay between retries
    - Add last_request_time column to track when the last request was made
*/

-- Add new columns to enedis_tokens table if they don't exist
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'enedis_tokens') THEN
    -- Add request_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'enedis_tokens' AND column_name = 'request_id') THEN
      ALTER TABLE enedis_tokens ADD COLUMN request_id text;
    END IF;
    
    -- Add user_agent column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'enedis_tokens' AND column_name = 'user_agent') THEN
      ALTER TABLE enedis_tokens ADD COLUMN user_agent text;
    END IF;
    
    -- Add retry_delay column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'enedis_tokens' AND column_name = 'retry_delay') THEN
      ALTER TABLE enedis_tokens ADD COLUMN retry_delay integer;
    END IF;
    
    -- Add last_request_time column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'enedis_tokens' AND column_name = 'last_request_time') THEN
      ALTER TABLE enedis_tokens ADD COLUMN last_request_time timestamptz;
    END IF;
    
    -- Add request_body column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'enedis_tokens' AND column_name = 'request_body') THEN
      ALTER TABLE enedis_tokens ADD COLUMN request_body text;
    END IF;
    
    -- Add response_body column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'enedis_tokens' AND column_name = 'response_body') THEN
      ALTER TABLE enedis_tokens ADD COLUMN response_body text;
    END IF;
    
    RAISE NOTICE 'Added debugging columns to enedis_tokens table';
  ELSE
    RAISE NOTICE 'enedis_tokens table does not exist';
  END IF;
END $$;