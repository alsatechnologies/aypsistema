-- ============================================================
-- CORRECCIÓN DE INVENTARIO AL 18/03/2026
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- id 2  → Pasta de Cártamo             | BODEGA DE PASTA   | → 1,713,530
-- id 6  → Semilla de Girasol Conv.     | SILO HUM 3 APSA   | → 106,460
-- id 10 → Semilla de siembra girasol   | BODEGA DE SIEMBRA | → 403

UPDATE inventario_almacenes SET cantidad = 1713530, updated_at = NOW() WHERE id = 2;
UPDATE inventario_almacenes SET cantidad = 106460,  updated_at = NOW() WHERE id = 6;
UPDATE inventario_almacenes SET cantidad = 403,     updated_at = NOW() WHERE id = 10;

-- Recalcular capacidad_actual en los almacenes afectados
UPDATE almacenes a
SET capacidad_actual = (
  SELECT COALESCE(SUM(ia.cantidad), 0)
  FROM inventario_almacenes ia
  WHERE ia.almacen_id = a.id
),
updated_at = NOW()
WHERE a.nombre IN ('BODEGA DE PASTA', 'SILO HUM 3 APSA', 'BODEGA DE SIEMBRA');

-- Verificar resultado
SELECT p.nombre AS producto, a.nombre AS almacen, ia.cantidad
FROM inventario_almacenes ia
JOIN productos p ON p.id = ia.producto_id
JOIN almacenes a ON a.id = ia.almacen_id
WHERE ia.id IN (2, 6, 10)
ORDER BY p.nombre;
