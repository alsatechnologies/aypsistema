-- ============================================
-- VERIFICAR: Por qué no aparece en inventario la recepción 1110001
-- ============================================

-- 1. Verificar datos de la recepción
SELECT 
  'DATOS DE LA RECEPCIÓN' as seccion,
  id,
  boleta,
  estatus,
  producto_id,
  almacen_id,
  peso_neto,
  created_at,
  updated_at
FROM recepciones
WHERE boleta = '1110001';

-- 2. Verificar si existe registro en inventario_almacenes
SELECT 
  'INVENTARIO EN ALMACÉN' as seccion,
  ia.id,
  ia.almacen_id,
  a.nombre as almacen,
  ia.producto_id,
  p.nombre as producto,
  ia.cantidad,
  ia.updated_at
FROM inventario_almacenes ia
LEFT JOIN almacenes a ON ia.almacen_id = a.id
LEFT JOIN productos p ON ia.producto_id = p.id
WHERE ia.producto_id = (SELECT producto_id FROM recepciones WHERE boleta = '1110001')
  AND ia.almacen_id = (SELECT almacen_id FROM recepciones WHERE boleta = '1110001');

-- 3. Verificar inventario total por producto (Girasol Convencional)
SELECT 
  'INVENTARIO TOTAL POR PRODUCTO' as seccion,
  p.id as producto_id,
  p.nombre as producto,
  SUM(ia.cantidad) as total_inventario
FROM productos p
LEFT JOIN inventario_almacenes ia ON p.id = ia.producto_id
WHERE p.nombre LIKE '%Girasol%Convencional%'
GROUP BY p.id, p.nombre;

-- 4. Verificar todas las recepciones completadas de Girasol Convencional
SELECT 
  'RECEPCIONES COMPLETADAS DE GIRASOL' as seccion,
  r.boleta,
  r.estatus,
  r.peso_neto,
  r.producto_id,
  p.nombre as producto,
  r.almacen_id,
  a.nombre as almacen,
  r.created_at
FROM recepciones r
LEFT JOIN productos p ON r.producto_id = p.id
LEFT JOIN almacenes a ON r.almacen_id = a.id
WHERE p.nombre LIKE '%Girasol%Convencional%'
  AND r.estatus = 'Completado'
ORDER BY r.created_at DESC;

-- 5. Verificar si hay errores en la actualización (comparar peso_neto con inventario)
SELECT 
  'COMPARACIÓN: PESO NETO VS INVENTARIO' as seccion,
  r.boleta,
  r.peso_neto as peso_neto_recepcion,
  ia.cantidad as cantidad_inventario,
  CASE 
    WHEN ia.cantidad IS NULL THEN '❌ NO HAY REGISTRO EN INVENTARIO'
    WHEN ia.cantidad != r.peso_neto THEN CONCAT('⚠️ DIFERENCIA: Inventario=', ia.cantidad, ', Peso Neto=', r.peso_neto)
    ELSE '✓ COINCIDE'
  END as estado
FROM recepciones r
LEFT JOIN inventario_almacenes ia 
  ON r.producto_id = ia.producto_id 
  AND r.almacen_id = ia.almacen_id
WHERE r.boleta = '1110001';

