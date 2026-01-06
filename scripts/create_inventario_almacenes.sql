-- ============================================
-- MIGRACIÓN: INVENTARIO ALMACENES
-- ============================================
-- Ejecuta este script en el SQL Editor de Supabase
-- https://app.supabase.com -> Tu Proyecto -> SQL Editor -> New Query

-- ============================================
-- 1. CREAR TABLA
-- ============================================
CREATE TABLE IF NOT EXISTS inventario_almacenes (
  id SERIAL PRIMARY KEY,
  almacen_id INTEGER NOT NULL REFERENCES almacenes(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(almacen_id, producto_id)
);

-- ============================================
-- 2. CREAR ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inventario_almacenes_almacen ON inventario_almacenes(almacen_id);
CREATE INDEX IF NOT EXISTS idx_inventario_almacenes_producto ON inventario_almacenes(producto_id);

-- ============================================
-- 3. AGREGAR COMENTARIOS
-- ============================================
COMMENT ON TABLE inventario_almacenes IS 'Inventario de productos por almacén. Permite múltiples productos en un mismo almacén.';
COMMENT ON COLUMN inventario_almacenes.cantidad IS 'Cantidad del producto en el almacén. La suma de todas las cantidades debe ser <= capacidad_total del almacén.';

-- ============================================
-- 4. HABILITAR RLS (Row Level Security)
-- ============================================
ALTER TABLE inventario_almacenes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREAR POLÍTICAS RLS
-- ============================================

-- Política para lectura: todos los usuarios autenticados pueden leer
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer inventario" ON inventario_almacenes;
CREATE POLICY "Usuarios autenticados pueden leer inventario"
  ON inventario_almacenes
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para inserción: todos los usuarios autenticados pueden insertar
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar inventario" ON inventario_almacenes;
CREATE POLICY "Usuarios autenticados pueden insertar inventario"
  ON inventario_almacenes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para actualización: todos los usuarios autenticados pueden actualizar
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar inventario" ON inventario_almacenes;
CREATE POLICY "Usuarios autenticados pueden actualizar inventario"
  ON inventario_almacenes
  FOR UPDATE
  TO authenticated
  USING (true);

-- Política para eliminación: todos los usuarios autenticados pueden eliminar
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar inventario" ON inventario_almacenes;
CREATE POLICY "Usuarios autenticados pueden eliminar inventario"
  ON inventario_almacenes
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esto para verificar que la tabla se creó correctamente:
-- SELECT * FROM inventario_almacenes LIMIT 1;

