-- Create visitas table for gym check-in records
CREATE TABLE IF NOT EXISTS visitas (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID        NOT NULL,
  gimnasio_id UUID        NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own visits
CREATE POLICY "users_insert_own_visits" ON visitas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

-- All authenticated users can read all visits
-- (needed for gym dashboard today-view and admin month count)
CREATE POLICY "authenticated_read_all_visits" ON visitas
  FOR SELECT TO authenticated
  USING (true);
