-- Create visitas table for gym check-in records
CREATE TABLE IF NOT EXISTS visitas (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID        NOT NULL,
  gimnasio_id UUID        NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index so getByUser queries are fast
CREATE INDEX IF NOT EXISTS visitas_usuario_id_idx ON visitas (usuario_id);
CREATE INDEX IF NOT EXISTS visitas_fecha_idx ON visitas (fecha DESC);

-- Enable Row Level Security
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own visits
DROP POLICY IF EXISTS "users_insert_own_visits" ON visitas;
CREATE POLICY "users_insert_own_visits" ON visitas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

-- All authenticated users can read all visits
-- (needed for gym dashboard today-view and admin month count)
DROP POLICY IF EXISTS "authenticated_read_all_visits" ON visitas;
CREATE POLICY "authenticated_read_all_visits" ON visitas
  FOR SELECT TO authenticated
  USING (true);
