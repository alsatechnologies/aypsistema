-- ============================================================
-- ESTABLECER BASE DE INVENTARIO
-- Ejecutar en Supabase SQL Editor UNA SOLA VEZ
-- Esto convierte el inventario actual en la "base" y solo
-- calcula movimientos nuevos a partir de este momento.
-- ============================================================

-- PASO 1: Agregar columnas de base a inventario_almacenes
ALTER TABLE inventario_almacenes
  ADD COLUMN IF NOT EXISTS cantidad_base NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_max_recepcion_id INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_max_embarque_id INTEGER DEFAULT 0;

-- PASO 2: Inicializar con valores actuales y IDs máximos de boletas completadas
DO $$
DECLARE
  v_max_recepcion_id INTEGER;
  v_max_embarque_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(id), 0) INTO v_max_recepcion_id
  FROM recepciones WHERE estatus = 'Completado';

  SELECT COALESCE(MAX(id), 0) INTO v_max_embarque_id
  FROM embarques WHERE estatus = 'Completado';

  UPDATE inventario_almacenes SET
    cantidad_base = cantidad,
    base_max_recepcion_id = v_max_recepcion_id,
    base_max_embarque_id = v_max_embarque_id;

  RAISE NOTICE 'Base establecida. Max recepcion ID: %, Max embarque ID: %',
    v_max_recepcion_id, v_max_embarque_id;
END $$;

-- PASO 3: Verificar resultado
SELECT
  p.nombre AS producto,
  a.nombre AS almacen,
  ia.cantidad AS cantidad_actual,
  ia.cantidad_base,
  ia.base_max_recepcion_id,
  ia.base_max_embarque_id
FROM inventario_almacenes ia
JOIN productos p ON p.id = ia.producto_id
JOIN almacenes a ON a.id = ia.almacen_id
WHERE ia.cantidad > 0
ORDER BY p.nombre;
