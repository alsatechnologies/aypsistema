-- ============================================
-- DIAGNÓSTICO: Por qué no se generó lote para boleta 2090001
-- ============================================
-- Ejecutar este script en Supabase SQL Editor para ver qué datos faltan
-- ============================================

-- 1. Ver datos completos del embarque
SELECT 
  'DATOS DEL EMBARQUE' as seccion,
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

-- 2. Verificar condiciones para generar lote
SELECT 
  'DIAGNÓSTICO DE CONDICIONES' as seccion,
  e.boleta,
  CASE 
    WHEN e.estatus = 'Completado' THEN '✓ CUMPLE' 
    ELSE CONCAT('✗ NO CUMPLE (estatus: ', COALESCE(e.estatus, 'NULL'), ')')
  END as condicion_1_estatus_completado,
  CASE 
    WHEN e.codigo_lote IS NULL OR e.codigo_lote = '' THEN '✓ CUMPLE (no tiene lote)' 
    ELSE CONCAT('✗ NO CUMPLE (ya tiene lote: ', e.codigo_lote, ')')
  END as condicion_2_sin_lote,
  CASE 
    WHEN e.cliente_id IS NOT NULL THEN CONCAT('✓ CUMPLE (cliente_id: ', e.cliente_id, ')') 
    ELSE '✗ NO CUMPLE (cliente_id es NULL)'
  END as condicion_3_tiene_cliente,
  CASE 
    WHEN e.producto_id IS NOT NULL THEN CONCAT('✓ CUMPLE (producto_id: ', e.producto_id, ')') 
    ELSE '✗ NO CUMPLE (producto_id es NULL)'
  END as condicion_4_tiene_producto,
  CASE 
    WHEN e.almacen_id IS NOT NULL THEN CONCAT('✓ CUMPLE (almacen_id: ', e.almacen_id, ')') 
    ELSE '✗ NO CUMPLE (almacen_id es NULL)'
  END as condicion_5_tiene_almacen,
  CASE 
    WHEN e.tipo_embarque IS NOT NULL THEN CONCAT('✓ CUMPLE (tipo: ', e.tipo_embarque, ')') 
    ELSE '✗ NO CUMPLE (tipo_embarque es NULL)'
  END as condicion_6_tiene_tipo_embarque
FROM embarques e
WHERE e.boleta = '2090001';

-- 3. Resumen final: ¿Puede generar lote?
SELECT 
  'RESULTADO FINAL' as seccion,
  e.boleta,
  CASE 
    WHEN e.estatus = 'Completado' 
      AND (e.codigo_lote IS NULL OR e.codigo_lote = '')
      AND e.cliente_id IS NOT NULL
      AND e.producto_id IS NOT NULL
      AND e.almacen_id IS NOT NULL
      AND e.tipo_embarque IS NOT NULL
    THEN '✓ SÍ PUEDE GENERAR LOTE (cumple todas las condiciones)'
    ELSE '✗ NO PUEDE GENERAR LOTE (falta alguna condición)'
  END as resultado,
  CONCAT_WS(', ',
    CASE WHEN e.estatus != 'Completado' THEN CONCAT('Estatus debe ser "Completado" (actual: ', COALESCE(e.estatus, 'NULL'), ')') END,
    CASE WHEN e.codigo_lote IS NOT NULL AND e.codigo_lote != '' THEN CONCAT('Ya tiene lote: ', e.codigo_lote) END,
    CASE WHEN e.cliente_id IS NULL THEN 'Falta cliente_id' END,
    CASE WHEN e.producto_id IS NULL THEN 'Falta producto_id' END,
    CASE WHEN e.almacen_id IS NULL THEN 'Falta almacen_id' END,
    CASE WHEN e.tipo_embarque IS NULL THEN 'Falta tipo_embarque' END
  ) as razones_por_no_generar
FROM embarques e
WHERE e.boleta = '2090001';

-- 4. Ver relaciones del embarque (si existen)
SELECT 
  'RELACIONES DEL EMBARQUE' as seccion,
  e.boleta,
  e.cliente_id,
  c.empresa as nombre_cliente,
  e.producto_id,
  p.nombre as nombre_producto,
  e.almacen_id,
  a.nombre as nombre_almacen
FROM embarques e
LEFT JOIN clientes c ON e.cliente_id = c.id
LEFT JOIN productos p ON e.producto_id = p.id
LEFT JOIN almacenes a ON e.almacen_id = a.id
WHERE e.boleta = '2090001';

