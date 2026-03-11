-- Seed dietary_flags table
-- We will Run this once against your Neon database to enable dietary preference persistence.

INSERT INTO dietary_flags (name) VALUES
  ('Vegetarian'),
  ('Vegan'),
  ('Gluten-Free'),
  ('Dairy-Free'),
  ('Nut-Allergy'),
  ('Seafood-Allergy')
ON CONFLICT (name) DO NOTHING;
