-- Supprimer la vue existante
DROP VIEW IF EXISTS monthly_consumption;

-- Recréer la vue avec les noms de colonnes corrects
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