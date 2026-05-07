-- Add codigo column to gimnasios table for gym access codes used in check-in
ALTER TABLE gimnasios ADD COLUMN IF NOT EXISTS codigo TEXT DEFAULT '';
