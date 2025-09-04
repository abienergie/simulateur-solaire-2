-- Create a new test record for PDL 21426917471391
INSERT INTO clients_identity (usage_point_id, identity, address, contract, contact, updated_at, created_at)
VALUES (
  '21426917471391',
  '{"customer_id": "test456", "natural_person": {"title": "M", "firstname": "Jean", "lastname": "Dupont"}}',
  '{"street": "123 Rue de Paris", "postal_code": "75001", "city": "Paris", "country": "France"}',
  '{"subscribed_power": "6 kVA", "meter_type": "AMM", "offpeak_hours": "HC (22H00-6H00)"}',
  '{"email": "jean.dupont@example.com", "phone": "0123456789"}',
  now(),
  now()
)
ON CONFLICT (usage_point_id) DO NOTHING;

-- Log the changes
DO $$
DECLARE
  record_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO record_count FROM clients_identity WHERE usage_point_id = '21426917471391';
  
  IF record_count > 0 THEN
    RAISE NOTICE 'Test record for PDL 21426917471391 exists';
  ELSE
    RAISE NOTICE 'Failed to insert test record for PDL 21426917471391';
  END IF;
END $$;