-- Insert a test record if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM clients_identity WHERE usage_point_id = '14862373311505') THEN
    INSERT INTO clients_identity (usage_point_id, identity, address, contract, contact, updated_at, created_at)
    VALUES (
      '14862373311505',
      '{"customer_id": "test123", "natural_person": {"title": "M", "firstname": "John", "lastname": "Doe"}}',
      '{"street": "123 Test Street", "postal_code": "75001", "city": "Paris", "country": "France"}',
      '{"subscribed_power": "9 kVA", "meter_type": "AMM", "offpeak_hours": "HC (22H00-6H00)"}',
      '{"email": "test@example.com", "phone": "0123456789"}',
      now(),
      now()
    );
    
    RAISE NOTICE 'Test record inserted into clients_identity table';
  ELSE
    RAISE NOTICE 'Test record already exists in clients_identity table';
  END IF;
END $$;