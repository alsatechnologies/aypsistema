-- ============================================
-- DIAGNÓSTICO: Por qué no se generó lote para boleta 1110001 (RECEPCIÓN)
-- ============================================

-- 1. Ver datos completos de la recepción
SELECT 
  'DATOS DE LA RECEPCIÓN' as seccion,
  id,
  boleta,
  codigo_lote,
  estatus,
  proveedor_id,
  producto_id,
  almacen_id,
  peso_bruto,
  peso_tara,
  peso_neto,
  created_at,
  updated_at
FROM recepciones
WHERE boleta = '1110001';

-- 2. Verificar condiciones para generar lote
SELECT 
  'DIAGNÓSTICO DE CONDICIONES' as seccion,
  r.boleta,
  CASE 
    WHEN r.estatus = 'Completado' THEN '✓ CUMPLE' 
    ELSE CONCAT('✗ NO CUMPLE (estatus: ', COALESCE(r.estatus, 'NULL'), ')')
  END as condicion_1_estatus_completado,
  CASE 
    WHEN r.codigo_lote IS NULL OR r.codigo_lote = '' THEN '✓ CUMPLE (no tiene lote)' 
    ELSE CONCAT('✗ NO CUMPLE (ya tiene lote: ', r.codigo_lote, ')')
  END as condicion_2_sin_lote,
  CASE 
    WHEN r.proveedor_id IS NOT NULL THEN CONCAT('✓ CUMPLE (proveedor_id: ', r.proveedor_id, ')') 
    ELSE '✗ NO CUMPLE (proveedor_id es NULL)'
  END as condicion_3_tiene_proveedor,
  CASE 
    WHEN r.producto_id IS NOT NULL THEN CONCAT('✓ CUMPLE (producto_id: ', r.producto_id, ')') 
    ELSE '✗ NO CUMPLE (producto_id es NULL)'
  END as condicion_4_tiene_producto,
  CASE 
    WHEN r.almacen_id IS NOT NULL THEN CONCAT('✓ CUMPLE (almacen_id: ', r.almacen_id, ')') 
    ELSE '✗ NO CUMPLE (almacen_id es NULL)'
  END as condicion_5_tiene_almacen
FROM recepciones r
WHERE r.boleta = '1110001';

-- 3. Resumen final: ¿Puede generar lote?
SELECT 
  'RESULTADO FINAL' as seccion,
  r.boleta,
  CASE 
    WHEN r.estatus = 'Completado' 
      AND (r.codigo_lote IS NULL OR r.codigo_lote = '')
      AND r.proveedor_id IS NOT NULL
      AND r.producto_id IS NOT NULL
      AND r.almacen_id IS NOT NULL
    THEN '✓ SÍ PUEDE GENERAR LOTE (cumple todas las condiciones)'
    ELSE '✗ NO PUEDE GENERAR LOTE (falta alguna condición)'
  END as resultado,
  CONCAT_WS(', ',
    CASE WHEN r.estatus != 'Completado' THEN CONCAT('Estatus debe ser "Completado" (actual: ', COALESCE(r.estatus, 'NULL'), ')') END,
    CASE WHEN r.codigo_lote IS NOT NULL AND r.codigo_lote != '' THEN CONCAT('Ya tiene lote: ', r.codigo_lote) END,
    CASE WHEN r.proveedor_id IS NULL THEN 'Falta proveedor_id' END,
    CASE WHEN r.producto_id IS NULL THEN 'Falta producto_id' END,
    CASE WHEN r.almacen_id IS NULL THEN 'Falta almacen_id' END
  ) as razones_por_no_generar
FROM recepciones r
WHERE r.boleta = '1110001';

-- 4. Ver relaciones de la recepción (si existen)
SELECT 
  'RELACIONES DE LA RECEPCIÓN' as seccion,
  r.boleta,
  r.proveedor_id,
  p.empresa as nombre_proveedor,
  r.producto_id,
  pr.nombre as nombre_producto,
  r.almacen_id,
  a.nombre as nombre_almacen
FROM recepciones r
LEFT JOIN proveedores p ON r.proveedor_id = p.id
LEFT JOIN productos pr ON r.producto_id = pr.id
LEFT JOIN almacenes a ON r.almacen_id = a.id
WHERE r.boleta = '1110001';

