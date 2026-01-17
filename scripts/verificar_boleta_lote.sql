-- Script para verificar por qué una boleta no tiene lote generado
-- Uso: Cambiar '2090001' por el número de boleta que quieras verificar

-- Verificar boleta 2090001
SELECT 
  id,
  boleta,
  codigo_lote,
  estatus,
  cliente_id,
  producto_id,
  almacen_id,
  tipo_embarque,
  peso_bruto,
  peso_tara,
  peso_neto,
  created_at,
  updated_at
FROM embarques
WHERE boleta = '2090001';

-- Verificar si tiene cliente asignado
SELECT 
  e.id,
  e.boleta,
  e.cliente_id,
  c.id as cliente_existe,
  c.empresa as nombre_cliente
FROM embarques e
LEFT JOIN clientes c ON e.cliente_id = c.id
WHERE e.boleta = '2090001';

-- Verificar si tiene producto asignado
SELECT 
  e.id,
  e.boleta,
  e.producto_id,
  p.id as producto_existe,
  p.nombre as nombre_producto
FROM embarques e
LEFT JOIN productos p ON e.producto_id = p.id
WHERE e.boleta = '2090001';

-- Verificar si tiene almacén asignado
SELECT 
  e.id,
  e.boleta,
  e.almacen_id,
  a.id as almacen_existe,
  a.nombre as nombre_almacen
FROM embarques e
LEFT JOIN almacenes a ON e.almacen_id = a.id
WHERE e.boleta = '2090001';

-- Resumen de condiciones para generar lote
SELECT 
  e.boleta,
  e.estatus as '¿Estatus = Completado?',
  e.codigo_lote as '¿Tiene lote?',
  CASE WHEN e.estatus = 'Completado' THEN '✓' ELSE '✗' END as condicion_estatus,
  CASE WHEN e.codigo_lote IS NULL OR e.codigo_lote = '' THEN '✓' ELSE '✗' END as condicion_sin_lote,
  CASE WHEN e.cliente_id IS NOT NULL THEN '✓' ELSE '✗' END as condicion_cliente,
  CASE WHEN e.producto_id IS NOT NULL THEN '✓' ELSE '✗' END as condicion_producto,
  CASE WHEN e.almacen_id IS NOT NULL THEN '✓' ELSE '✗' END as condicion_almacen,
  CASE WHEN e.tipo_embarque IS NOT NULL THEN '✓' ELSE '✗' END as condicion_tipo_embarque,
  CASE 
    WHEN e.estatus = 'Completado' 
      AND (e.codigo_lote IS NULL OR e.codigo_lote = '')
      AND e.cliente_id IS NOT NULL
      AND e.producto_id IS NOT NULL
      AND e.almacen_id IS NOT NULL
      AND e.tipo_embarque IS NOT NULL
    THEN '✓ DEBERÍA GENERAR LOTE'
    ELSE '✗ NO CUMPLE CONDICIONES'
  END as resultado
FROM embarques e
WHERE e.boleta = '2090001';

