-- Add member_covered column to products table.
-- This column was defined in the initial schema migrations but was absent
-- from the live database, causing product save/deactivate to fail.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS member_covered BOOLEAN NOT NULL DEFAULT false;
