-- ============================================
-- INVESTIGACIÓN: ¿Por qué se atascó el consecutivo en 37?
-- ============================================
-- Este script investiga posibles causas del problema
-- ============================================

-- 1. Verificar si hay múltiples registros en consecutivos_lotes (podría causar confusión)
SELECT 
  'VERIFICAR MÚLTIPLES REGISTROS' as seccion,
  COUNT(*) as total_registros,
  STRING_AGG(id::TEXT || ':' || consecutivo::TEXT, ', ') as registros
FROM consecutivos_lotes
WHERE tipo_operacion_codigo = 'NL-'
  AND producto_codigo = '25';

-- 2. Ver el historial de embarques ordenados por fecha para ver cuándo se generó cada consecutivo
SELECT 
  'HISTORIAL DE LOTES POR FECHA' as seccion,
  e.id,
  e.boleta,
  e.codigo_lote,
  CAST(SUBSTRING(e.codigo_lote FROM '([0-9]{3})$') AS INTEGER) as consecutivo_numero,
  e.created_at,
  e.updated_at,
  CASE 
    WHEN e.created_at::DATE = e.updated_at::DATE THEN 'Mismo día'
    ELSE 'Diferente día'
  END as mismo_dia
FROM embarques e
LEFT JOIN productos p ON e.producto_id = p.id
WHERE p.codigo_lote = '25'
  AND e.codigo_lote LIKE 'NL-%'
  AND e.codigo_lote IS NOT NULL
  AND e.codigo_lote ~ '^NL-[0-9]+-([0-9]{3})$'
ORDER BY e.created_at ASC;

-- 3. Ver si hay lotes con consecutivos duplicados (mismo consecutivo, diferentes boletas)
SELECT 
  'LOTES CON CONSECUTIVOS DUPLICADOS' as seccion,
  CAST(SUBSTRING(codigo_lote FROM '([0-9]{3})$') AS INTEGER) as consecutivo_numero,
  COUNT(*) as cantidad_duplicados,
  STRING_AGG(boleta || ' (' || codigo_lote || ')', ', ') as boletas_duplicadas,
  MIN(created_at) as primera_fecha,
  MAX(created_at) as ultima_fecha
FROM embarques e
LEFT JOIN productos p ON e.producto_id = p.id
WHERE p.codigo_lote = '25'
  AND e.codigo_lote LIKE 'NL-%'
  AND e.codigo_lote IS NOT NULL
  AND e.codigo_lote ~ '^NL-[0-9]+-([0-9]{3})$'
GROUP BY CAST(SUBSTRING(codigo_lote FROM '([0-9]{3})$') AS INTEGER)
HAVING COUNT(*) > 1
ORDER BY consecutivo_numero DESC;

-- 4. Verificar si la función RPC existe y está correcta
SELECT 
  'VERIFICAR FUNCIÓN RPC' as seccion,
  proname as nombre_funcion,
  prosrc as codigo_funcion
FROM pg_proc
WHERE proname = 'incrementar_o_crear_consecutivo_lote';

-- 5. Ver si hay algún patrón en los lotes alrededor del consecutivo 37
SELECT 
  'ANÁLISIS ALREDEDOR DEL CONSECUTIVO 37' as seccion,
  e.boleta,
  e.codigo_lote,
  CAST(SUBSTRING(e.codigo_lote FROM '([0-9]{3})$') AS INTEGER) as consecutivo_numero,
  e.created_at,
  e.updated_at,
  EXTRACT(EPOCH FROM (e.updated_at - e.created_at)) as segundos_entre_creacion_y_actualizacion
FROM embarques e
LEFT JOIN productos p ON e.producto_id = p.id
WHERE p.codigo_lote = '25'
  AND e.codigo_lote LIKE 'NL-%'
  AND e.codigo_lote IS NOT NULL
  AND e.codigo_lote ~ '^NL-[0-9]+-([0-9]{3})$'
  AND CAST(SUBSTRING(e.codigo_lote FROM '([0-9]{3})$') AS INTEGER) BETWEEN 35 AND 44
ORDER BY e.created_at ASC;

-- 6. Verificar si hay algún registro en auditoría que muestre cambios en consecutivos_lotes
SELECT 
  'AUDITORÍA DE CAMBIOS EN CONSECUTIVOS_LOTES' as seccion,
  id,
  tabla,
  registro_id,
  accion,
  fecha_hora,
  datos_anteriores->>'consecutivo' as consecutivo_anterior,
  datos_nuevos->>'consecutivo' as consecutivo_nuevo
FROM auditoria
WHERE tabla = 'consecutivos_lotes'
  AND (datos_anteriores->>'tipo_operacion_codigo' = 'NL-' OR datos_nuevos->>'tipo_operacion_codigo' = 'NL-')
  AND (datos_anteriores->>'producto_codigo' = '25' OR datos_nuevos->>'producto_codigo' = '25')
ORDER BY fecha_hora DESC
LIMIT 20;

-- 7. Ver si hay algún problema con el método legacy siendo usado cuando debería usar RPC
-- (Esto requeriría logs del navegador, pero podemos verificar si hay errores en la función RPC)
SELECT 
  'VERIFICAR ERRORES POTENCIALES EN FUNCIÓN RPC' as seccion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'incrementar_o_crear_consecutivo_lote'
    ) THEN '✓ Función RPC existe'
    ELSE '✗ Función RPC NO existe (esto causaría que use método legacy)'
  END as estado_funcion_rpc;

