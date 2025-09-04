-- Cette migration vérifie si la vue monthly_consumption existe déjà
-- et l'utilise comme source de données pour notre application

DO $$
BEGIN
  -- Vérifier si la vue monthly_consumption existe déjà
  IF EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'monthly_consumption'
  ) THEN
    -- La vue existe déjà, nous allons la conserver
    RAISE NOTICE 'La vue monthly_consumption existe déjà et sera utilisée';
  ELSE
    -- Si la vue n'existe pas, vérifier si la table monthly_consumption existe
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'monthly_consumption'
      AND table_type = 'BASE TABLE'
    ) THEN
      -- La table existe, nous allons l'utiliser directement
      RAISE NOTICE 'La table monthly_consumption existe déjà et sera utilisée directement';
    ELSE
      -- Ni la vue ni la table n'existent, créer une vue basée sur monthly_consumption_table
      -- si cette dernière existe
      IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'monthly_consumption_table'
      ) THEN
        -- Créer la vue basée sur la table
        CREATE OR REPLACE VIEW monthly_consumption AS
        SELECT 
          id,
          prm,
          month,
          hp,
          hc,
          total,
          created_at
        FROM monthly_consumption_table;
        
        RAISE NOTICE 'Vue monthly_consumption créée à partir de monthly_consumption_table';
      ELSE
        -- Aucune table ou vue n'existe, nous devons créer une table
        RAISE NOTICE 'Aucune table ou vue monthly_consumption n''existe, création d''une nouvelle table';
        
        -- Créer la table monthly_consumption
        CREATE TABLE monthly_consumption (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          prm text NOT NULL,
          month date NOT NULL,
          hp numeric DEFAULT 0,
          hc numeric DEFAULT 0,
          total numeric DEFAULT 0,
          created_at timestamptz DEFAULT now(),
          UNIQUE(prm, month)
        );
        
        -- Enable RLS
        ALTER TABLE monthly_consumption ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for reading monthly consumption data
        CREATE POLICY "Anyone can read monthly consumption data" 
          ON monthly_consumption
          FOR SELECT 
          TO PUBLIC
          USING (true);
        
        -- Create policy for service role to manage data
        CREATE POLICY "Service role can manage monthly consumption data"
          ON monthly_consumption
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
        
        -- Create policy for anonymous users to insert data
        CREATE POLICY "Anonymous users can insert monthly consumption data"
          ON monthly_consumption
          FOR INSERT
          TO anon
          WITH CHECK (true);
        
        -- Create policy for anonymous users to update data
        CREATE POLICY "Anonymous users can update monthly consumption data"
          ON monthly_consumption
          FOR UPDATE
          TO anon
          USING (true)
          WITH CHECK (true);
      END IF;
    END IF;
  END IF;
END $$;