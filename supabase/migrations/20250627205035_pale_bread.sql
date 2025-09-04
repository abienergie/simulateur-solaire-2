-- This migration fixes the issues with the offpeak_windows table
-- It uses separate BEGIN/EXCEPTION blocks for each operation to handle errors individually

DO $$
DECLARE
  table_exists boolean;
BEGIN
  -- Check if the table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'offpeak_windows'
  ) INTO table_exists;

  -- Create the table if it doesn't exist
  IF NOT table_exists THEN
    CREATE TABLE offpeak_windows (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      prm text UNIQUE NOT NULL,
      start_time time DEFAULT '22:00'::time NOT NULL,
      end_time time DEFAULT '06:00'::time NOT NULL,
      created_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE offpeak_windows ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Anyone can read offpeak windows" 
      ON offpeak_windows
      FOR SELECT 
      TO PUBLIC
      USING (true);
    
    CREATE POLICY "Anonymous users can insert offpeak windows"
      ON offpeak_windows
      FOR INSERT
      TO anon
      WITH CHECK (true);
    
    CREATE POLICY "Anonymous users can update offpeak windows"
      ON offpeak_windows
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
    
    CREATE POLICY "Service role can manage offpeak windows"
      ON offpeak_windows
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    
    RAISE NOTICE 'offpeak_windows table created successfully';
  ELSE
    -- Table exists, check column types
    BEGIN
      -- Check if start_time is of type time
      IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'offpeak_windows'
        AND column_name = 'start_time'
        AND data_type = 'time without time zone'
      ) THEN
        -- Alter column type to time
        ALTER TABLE offpeak_windows
        ALTER COLUMN start_time TYPE time USING start_time::time;
        
        RAISE NOTICE 'start_time column type changed to time';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error changing start_time column type: %', SQLERRM;
    END;
    
    BEGIN
      -- Check if end_time is of type time
      IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'offpeak_windows'
        AND column_name = 'end_time'
        AND data_type = 'time without time zone'
      ) THEN
        -- Alter column type to time
        ALTER TABLE offpeak_windows
        ALTER COLUMN end_time TYPE time USING end_time::time;
        
        RAISE NOTICE 'end_time column type changed to time';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error changing end_time column type: %', SQLERRM;
    END;
    
    -- Set default values for columns
    BEGIN
      ALTER TABLE offpeak_windows
      ALTER COLUMN start_time SET DEFAULT '22:00'::time;
      
      RAISE NOTICE 'Default value set for start_time';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error setting default value for start_time: %', SQLERRM;
    END;
    
    BEGIN
      ALTER TABLE offpeak_windows
      ALTER COLUMN end_time SET DEFAULT '06:00'::time;
      
      RAISE NOTICE 'Default value set for end_time';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error setting default value for end_time: %', SQLERRM;
    END;
    
    -- Update NULL values to default values
    BEGIN
      UPDATE offpeak_windows
      SET start_time = '22:00'::time
      WHERE start_time IS NULL;
      
      RAISE NOTICE 'NULL values in start_time updated to default';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error updating NULL values in start_time: %', SQLERRM;
    END;
    
    BEGIN
      UPDATE offpeak_windows
      SET end_time = '06:00'::time
      WHERE end_time IS NULL;
      
      RAISE NOTICE 'NULL values in end_time updated to default';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error updating NULL values in end_time: %', SQLERRM;
    END;
    
    -- Set NOT NULL constraints
    BEGIN
      ALTER TABLE offpeak_windows
      ALTER COLUMN start_time SET NOT NULL;
      
      RAISE NOTICE 'NOT NULL constraint added to start_time';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding NOT NULL constraint to start_time: %', SQLERRM;
    END;
    
    BEGIN
      ALTER TABLE offpeak_windows
      ALTER COLUMN end_time SET NOT NULL;
      
      RAISE NOTICE 'NOT NULL constraint added to end_time';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding NOT NULL constraint to end_time: %', SQLERRM;
    END;
    
    RAISE NOTICE 'offpeak_windows table updated successfully';
  END IF;
END $$;