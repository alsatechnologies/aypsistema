-- ============================================================
-- CORRECCIÓN DE INVENTARIO REAL AL 17/03/2026
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- id 2  → Pasta Convencional de Cártamo   | BODEGA DE PASTA    | 4,741,899 → 1,789,480
-- id 8  → Pasta Convencional de Cártamo   | Otros              |      13.26 → 0
-- id 1  → Semilla de Cártamo Convencional | SILO 1 APSA        |   986,270  → 1,133,684
-- id 6  → Semilla de Girasol Convencional | SILO HUM 3 APSA    |         0  → 78,160
-- id 3  → Garbanzo Orgánico               | BODEGA DE SIEMBRA  |    40,639  → 61,214
-- id 5  → Semilla de siembra de Cártamo   | BODEGA DE SIEMBRA  |   133,545  → 7,525
-- id 10 → Semilla de siembra girasol      | BODEGA DE SIEMBRA  |         0  → 30

UPDATE inventario_almacenes SET cantidad = 1789480, updated_at = NOW() WHERE id = 2;
UPDATE inventario_almacenes SET cantidad = 0,       updated_at = NOW() WHERE id = 8;
UPDATE inventario_almacenes SET cantidad = 1133684, updated_at = NOW() WHERE id = 1;
UPDATE inventario_almacenes SET cantidad = 78160,   updated_at = NOW() WHERE id = 6;
UPDATE inventario_almacenes SET cantidad = 61214,   updated_at = NOW() WHERE id = 3;
UPDATE inventario_almacenes SET cantidad = 7525,    updated_at = NOW() WHERE id = 5;
UPDATE inventario_almacenes SET cantidad = 30,      updated_at = NOW() WHERE id = 10;

-- Recalcular capacidad_actual en los almacenes afectados
UPDATE almacenes a
SET capacidad_actual = (
  SELECT COALESCE(SUM(ia.cantidad), 0)
  FROM inventario_almacenes ia
  WHERE ia.almacen_id = a.id
),
updated_at = NOW()
WHERE a.nombre IN ('BODEGA DE PASTA', 'BODEGA DE SIEMBRA', 'SILO 1 APSA', 'SILO HUM 3 APSA', 'Otros', 'BODEGA MARFIL');

-- Verificar resultado
SELECT p.nombre AS producto, SUM(ia.cantidad) AS total
FROM inventario_almacenes ia
JOIN productos p ON p.id = ia.producto_id
WHERE ia.id IN (1, 2, 3, 5, 6, 8, 10)
GROUP BY p.nombre
ORDER BY p.nombre;
