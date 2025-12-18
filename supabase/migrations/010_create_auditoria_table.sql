-- Migración: Crear tabla de auditoría
-- Fecha: 2025-12-16
-- Descripción: Tabla para registrar todos los cambios en las tablas principales

CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  tabla VARCHAR(100) NOT NULL,
  registro_id INTEGER NOT NULL,
  accion VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  usuario_id INTEGER,
  usuario_email VARCHAR(255),
  fecha_hora TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(50),
  user_agent TEXT
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla ON auditoria(tabla);
CREATE INDEX IF NOT EXISTS idx_auditoria_registro_id ON auditoria(registro_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha_hora ON auditoria(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON auditoria(accion);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_fecha ON auditoria(tabla, fecha_hora DESC);

-- Comentarios para documentación
COMMENT ON TABLE auditoria IS 'Registra todos los cambios (INSERT, UPDATE, DELETE) en las tablas principales del sistema';
COMMENT ON COLUMN auditoria.tabla IS 'Nombre de la tabla donde ocurrió el cambio';
COMMENT ON COLUMN auditoria.registro_id IS 'ID del registro afectado';
COMMENT ON COLUMN auditoria.accion IS 'Tipo de acción: INSERT, UPDATE, DELETE';
COMMENT ON COLUMN auditoria.datos_anteriores IS 'Datos antes del cambio (solo para UPDATE y DELETE)';
COMMENT ON COLUMN auditoria.datos_nuevos IS 'Datos después del cambio (solo para INSERT y UPDATE)';
COMMENT ON COLUMN auditoria.usuario_id IS 'ID del usuario que realizó la acción';
COMMENT ON COLUMN auditoria.usuario_email IS 'Email del usuario que realizó la acción';
COMMENT ON COLUMN auditoria.fecha_hora IS 'Fecha y hora del cambio';
COMMENT ON COLUMN auditoria.ip_address IS 'Dirección IP desde donde se realizó la acción';
COMMENT ON COLUMN auditoria.user_agent IS 'User agent del navegador';

-- Habilitar RLS en la tabla de auditoría
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Política: Solo usuarios autenticados pueden leer auditoría
CREATE POLICY "Usuarios autenticados pueden leer auditoría"
  ON auditoria
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Solo el sistema puede insertar en auditoría (a través de triggers)
CREATE POLICY "Solo sistema puede insertar auditoría"
  ON auditoria
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

