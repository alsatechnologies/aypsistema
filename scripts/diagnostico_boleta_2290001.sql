-- ============================================
-- DIAGNÓSTICO: Por qué la boleta 2290001 no generó lote
-- ============================================
-- Este script verifica todas las condiciones necesarias para generar un lote
-- ============================================

-- 1. Verificar datos del embarque
SELECT 
  'DATOS DEL EMBARQUE' as seccion,
  e.id,
  e.boleta,
  e.codigo_lote,
  e.estatus,
  e.tipo_embarque,
  e.cliente_id,
  e.producto_id,
  e.almacen_id,
  e.created_at,
  e.updated_at
FROM embarques e
WHERE e.boleta = '2290001';

-- 2. Verificar datos relacionados (cliente, producto, almacén)
SELECT 
  'DATOS RELACIONADOS' as seccion,
  e.boleta,
  c.empresa as cliente_empresa,
  c.id as cliente_id,
  p.nombre as producto_nombre,
  p.id as producto_id,
  p.codigo_lote as producto_codigo_lote,
  a.nombre as almacen_nombre,
  a.id as almacen_id,
  a.codigo_lote as almacen_codigo_lote
FROM embarques e
LEFT JOIN clientes c ON e.cliente_id = c.id
LEFT JOIN productos p ON e.producto_id = p.id
LEFT JOIN almacenes a ON e.almacen_id = a.id
WHERE e.boleta = '2290001';

-- 3. Verificar si el embarque está completado (condición principal)
SELECT 
  'ESTATUS DEL EMBARQUE' as seccion,
  e.boleta,
  e.estatus,
  CASE 
    WHEN e.estatus = 'Completado' THEN '✓ Cumple condición: Estatus es Completado'
    ELSE '❌ NO cumple: Estatus es ' || COALESCE(e.estatus, 'NULL')
  END as cumple_condicion_estatus
FROM embarques e
WHERE e.boleta = '2290001';

-- 4. Verificar si ya existe un lote (no debe existir para generar uno nuevo)
SELECT 
  'LOTE EXISTENTE' as seccion,
  e.boleta,
  e.codigo_lote,
  CASE 
    WHEN e.codigo_lote IS NULL OR e.codigo_lote = '' THEN '✓ No existe lote (debe generarse)'
    ELSE '⚠️ Ya existe lote: ' || e.codigo_lote
  END as estado_lote
FROM embarques e
WHERE e.boleta = '2290001';

-- 5. Verificar campos obligatorios para generar lote
SELECT 
  'CAMPOS OBLIGATORIOS' as seccion,
  e.boleta,
  CASE 
    WHEN e.tipo_embarque IS NULL THEN '❌ tipo_embarque es NULL'
    ELSE '✓ tipo_embarque: ' || e.tipo_embarque
  END as tipo_embarque_status,
  CASE 
    WHEN e.cliente_id IS NULL THEN '❌ cliente_id es NULL'
    ELSE '✓ cliente_id: ' || e.cliente_id::TEXT
  END as cliente_id_status,
  CASE 
    WHEN e.producto_id IS NULL THEN '❌ producto_id es NULL'
    ELSE '✓ producto_id: ' || e.producto_id::TEXT
  END as producto_id_status,
  CASE 
    WHEN e.almacen_id IS NULL THEN '❌ almacen_id es NULL'
    ELSE '✓ almacen_id: ' || e.almacen_id::TEXT
  END as almacen_id_status
FROM embarques e
WHERE e.boleta = '2290001';

-- 6. Verificar si todos los campos necesarios están presentes
SELECT 
  'RESUMEN DE CONDICIONES' as seccion,
  e.boleta,
  CASE 
    WHEN e.estatus = 'Completado' 
      AND (e.codigo_lote IS NULL OR e.codigo_lote = '')
      AND e.tipo_embarque IS NOT NULL
      AND e.cliente_id IS NOT NULL
      AND e.producto_id IS NOT NULL
      AND e.almacen_id IS NOT NULL
    THEN '✓ TODAS las condiciones se cumplen - DEBERÍA generarse lote'
    ELSE '❌ FALTA alguna condición:'
      || CASE WHEN e.estatus != 'Completado' THEN ' Estatus NO es Completado' ELSE '' END
      || CASE WHEN e.codigo_lote IS NOT NULL AND e.codigo_lote != '' THEN ' Ya existe lote' ELSE '' END
      || CASE WHEN e.tipo_embarque IS NULL THEN ' tipo_embarque es NULL' ELSE '' END
      || CASE WHEN e.cliente_id IS NULL THEN ' cliente_id es NULL' ELSE '' END
      || CASE WHEN e.producto_id IS NULL THEN ' producto_id es NULL' ELSE '' END
      || CASE WHEN e.almacen_id IS NULL THEN ' almacen_id es NULL' ELSE '' END
  END as diagnostico
FROM embarques e
WHERE e.boleta = '2290001';

-- 7. Verificar auditoría para ver si hubo intentos de generar lote
SELECT 
  'AUDITORÍA - INTENTOS DE LOTE' as seccion,
  id,
  tabla,
  registro_id,
  accion,
  fecha_hora,
  datos_anteriores->>'codigo_lote' as codigo_lote_anterior,
  datos_nuevos->>'codigo_lote' as codigo_lote_nuevo,
  datos_nuevos->>'boleta' as boleta_auditoria,
  usuario_email
FROM auditoria
WHERE tabla = 'embarques'
  AND (datos_anteriores->>'boleta' = '2290001' OR datos_nuevos->>'boleta' = '2290001')
ORDER BY fecha_hora DESC
LIMIT 10;

-- 8. Verificar el consecutivo para este tipo de embarque y producto
SELECT 
  'CONSECUTIVO PARA ESTE TIPO' as seccion,
  e.tipo_embarque,
  p.codigo_lote as producto_codigo,
  CASE 
    WHEN e.tipo_embarque = 'Nacional' THEN 'NL-'
    WHEN e.tipo_embarque = 'Exportación' THEN 'EX-'
    ELSE 'DESCONOCIDO'
  END as tipo_operacion_codigo_esperado,
  cl.id as consecutivo_id,
  cl.consecutivo,
  CASE 
    WHEN cl.id IS NULL THEN '⚠️ No existe consecutivo para esta combinación tipo+producto'
    ELSE '✓ Existe consecutivo: ' || cl.consecutivo::TEXT
  END as estado_consecutivo
FROM embarques e
LEFT JOIN productos p ON e.producto_id = p.id
LEFT JOIN consecutivos_lotes cl ON 
  cl.tipo_operacion_codigo = CASE 
    WHEN e.tipo_embarque = 'Nacional' THEN 'NL-'
    WHEN e.tipo_embarque = 'Exportación' THEN 'EX-'
    ELSE NULL
  END
  AND cl.producto_codigo = p.codigo_lote
WHERE e.boleta = '2290001';

