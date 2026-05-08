CREATE TABLE IF NOT EXISTS calificaciones (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gimnasio_id UUID        NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  estrellas   INT         NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  comentario  TEXT        DEFAULT '',
  fecha       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calificaciones_gimnasio_id_idx ON calificaciones (gimnasio_id);

ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_insert_own_ratings" ON calificaciones;
CREATE POLICY "users_insert_own_ratings" ON calificaciones
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "authenticated_read_ratings" ON calificaciones;
CREATE POLICY "authenticated_read_ratings" ON calificaciones
  FOR SELECT TO authenticated
  USING (true);
