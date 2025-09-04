/*
  # Add initial battery data

  1. Insert initial battery data into battery_prices_purchase table
    - Various battery models with different capacities and prices
    - Autoconsumption increase is calculated automatically
*/

-- Insert initial battery data
INSERT INTO battery_prices_purchase (model, capacity, price) VALUES
  ('HUAWEI LUNA 2000-5', 5, 4990),
  ('HUAWEI LUNA 2000-10', 10, 8990),
  ('HUAWEI LUNA 2000-15', 15, 12990),
  ('ENPHASE IQ BATTERY 5P', 5, 5490),
  ('ENPHASE IQ BATTERY 10P', 10, 9990),
  ('ENPHASE IQ BATTERY 15P', 15, 13990),
  ('BYD HVS 5.1', 5.1, 4790),
  ('BYD HVS 7.7', 7.7, 6990),
  ('BYD HVS 10.2', 10.2, 8990),
  ('BYD HVS 12.8', 12.8, 10990);