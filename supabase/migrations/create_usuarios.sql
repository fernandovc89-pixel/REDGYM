CREATE TABLE IF NOT EXISTS usuarios (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan       TEXT        NOT NULL DEFAULT 'estandar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own" ON usuarios;
CREATE POLICY "users_manage_own" ON usuarios
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
