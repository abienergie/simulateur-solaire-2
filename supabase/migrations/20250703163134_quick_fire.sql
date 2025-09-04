-- Cette migration corrige les problèmes précédents en utilisant la table existante
-- au lieu d'essayer de créer une nouvelle table ou vue

-- Vérifier si la vue monthly_consumption existe déjà
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'monthly_consumption'
  ) THEN
    -- La vue existe déjà, nous allons la conserver
    RAISE NOTICE 'La vue monthly_consumption existe déjà et sera conservée';
  ELSE
    -- Si la vue n'existe pas, vérifier si la table monthly_consumption_table existe
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
      -- Ni la vue ni la table n'existent, nous allons utiliser la table existante
      -- comme source de données pour notre application
      RAISE NOTICE 'Utilisation de la table monthly_consumption existante';
    END IF;
  END IF;
END $$;

-- Assurons-nous que les politiques RLS sont correctement configurées
-- pour la table ou vue existante
DO $$
BEGIN
  -- Vérifier si les politiques existent déjà pour monthly_consumption
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'monthly_consumption' 
    AND policyname = 'Anyone can read monthly consumption data'
  ) THEN
    -- Activer RLS si ce n'est pas déjà fait
    BEGIN
      ALTER TABLE IF EXISTS monthly_consumption ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN
      -- Si c'est une vue, nous ne pouvons pas activer RLS directement
      RAISE NOTICE 'Impossible d''activer RLS sur la vue monthly_consumption: %', SQLERRM;
    END;
    
    -- Créer la politique de lecture si elle n'existe pas
    BEGIN
      CREATE POLICY "Anyone can read monthly consumption data" 
        ON monthly_consumption
        FOR SELECT 
        TO PUBLIC
        USING (true);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Impossible de créer la politique de lecture: %', SQLERRM;
    END;
  END IF;
END $$;