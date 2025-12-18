-- Migración: Agregar columna 'activo' para soft delete
-- Fecha: 2025-12-16
-- Descripción: Agregar soporte para soft delete en todas las tablas principales

-- Agregar columna 'activo' a todas las tablas principales
-- Si la columna ya existe, no se creará (IF NOT EXISTS)

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE almacenes ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE recepciones ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE embarques ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE ingresos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE reportes_laboratorio ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Actualizar registros existentes para que todos estén activos
UPDATE clientes SET activo = true WHERE activo IS NULL;
UPDATE proveedores SET activo = true WHERE activo IS NULL;
UPDATE productos SET activo = true WHERE activo IS NULL;
UPDATE almacenes SET activo = true WHERE activo IS NULL;
UPDATE recepciones SET activo = true WHERE activo IS NULL;
UPDATE embarques SET activo = true WHERE activo IS NULL;
UPDATE ordenes SET activo = true WHERE activo IS NULL;
UPDATE movimientos SET activo = true WHERE activo IS NULL;
UPDATE ingresos SET activo = true WHERE activo IS NULL;
UPDATE reportes_laboratorio SET activo = true WHERE activo IS NULL;

-- Crear índices para mejorar rendimiento de consultas con filtro activo
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);
CREATE INDEX IF NOT EXISTS idx_proveedores_activo ON proveedores(activo);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_almacenes_activo ON almacenes(activo);
CREATE INDEX IF NOT EXISTS idx_recepciones_activo ON recepciones(activo);
CREATE INDEX IF NOT EXISTS idx_embarques_activo ON embarques(activo);
CREATE INDEX IF NOT EXISTS idx_ordenes_activo ON ordenes(activo);
CREATE INDEX IF NOT EXISTS idx_movimientos_activo ON movimientos(activo);
CREATE INDEX IF NOT EXISTS idx_ingresos_activo ON ingresos(activo);
CREATE INDEX IF NOT EXISTS idx_reportes_laboratorio_activo ON reportes_laboratorio(activo);

-- Comentarios para documentación
COMMENT ON COLUMN clientes.activo IS 'Indica si el registro está activo (true) o eliminado lógicamente (false)';
COMMENT ON COLUMN proveedores.activo IS 'Indica si el registro está activo (true) o eliminado lógicamente (false)';
COMMENT ON COLUMN productos.activo IS 'Indica si el registro está activo (true) o eliminado lógicamente (false)';
COMMENT ON COLUMN almacenes.activo IS 'Indica si el registro está activo (true) o eliminado lógicamente (false)';
COMMENT ON COLUMN recepciones.activo IS 'Indica si el registro está activo (true) o eliminado lógicamente (false)';
COMMENT ON COLUMN embarques.activo IS 'Indica si el registro está activo (true) o eliminado lógicamente (false)';
COMMENT ON COLUMN ordenes.activo IS 'Indica si el registro está activo (true) o eliminado lógicamente (false)';
COMMENT ON COLUMN movimientos.activo IS 'Indica si el registro está activo (true) o eliminado lógicamente (false)';
COMMENT ON COLUMN ingresos.activo IS 'Indica si el registro está activo (true) o eliminado lógicamente (false)';
COMMENT ON COLUMN reportes_laboratorio.activo IS 'Indica si el registro está activo (true) o eliminado lógicamente (false)';

