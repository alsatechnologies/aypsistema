-- ============================================
-- DIAGNÓSTICO: Consecutivo atorado para Pasta Convencional de Cártamo
-- ============================================
-- Este script verifica el estado del consecutivo para NL- (Nacional) + Pasta (código 25)
-- ============================================

-- 1. Ver el consecutivo actual en la tabla consecutivos_lotes
SELECT 
  'CONSECUTIVO ACTUAL EN BD' as seccion,
  id,
  tipo_operacion_codigo,
  producto_codigo,
  consecutivo,
  origen_codigo,
  almacen_codigo,
  anio_codigo,
  anio
FROM consecutivos_lotes
WHERE tipo_operacion_codigo = 'NL-'
  AND producto_codigo = '25'
ORDER BY id;

-- 2. Ver los últimos lotes generados para Pasta Convencional de Cártamo (producto código 25)
SELECT 
  'ÚLTIMOS LOTES GENERADOS PARA PASTA' as seccion,
  e.id,
  e.boleta,
  e.codigo_lote,
  e.estatus,
  e.created_at,
  e.updated_at,
  p.nombre as producto,
  SUBSTRING(e.codigo_lote FROM '([0-9]{3})$') as consecutivo_extraido
FROM embarques e
LEFT JOIN productos p ON e.producto_id = p.id
WHERE p.codigo_lote = '25'
  AND e.codigo_lote LIKE 'NL-%'
  AND e.codigo_lote IS NOT NULL
ORDER BY e.created_at DESC
LIMIT 20;

-- 3. Verificar si hay múltiples registros en consecutivos_lotes para NL- + 25
SELECT 
  'VERIFICAR DUPLICADOS' as seccion,
  tipo_operacion_codigo,
  producto_codigo,
  COUNT(*) as cantidad_registros,
  STRING_AGG(id::TEXT, ', ') as ids,
  STRING_AGG(consecutivo::TEXT, ', ') as consecutivos
FROM consecutivos_lotes
WHERE tipo_operacion_codigo = 'NL-'
  AND producto_codigo = '25'
GROUP BY tipo_operacion_codigo, producto_codigo;

-- 4. Ver el consecutivo más alto usado en los lotes reales
SELECT 
  'CONSECUTIVO MÁS ALTO EN LOTES REALES' as seccion,
  MAX(CAST(SUBSTRING(codigo_lote FROM '([0-9]{3})$') AS INTEGER)) as consecutivo_maximo
FROM embarques
WHERE codigo_lote LIKE 'NL-%25%'
  AND codigo_lote IS NOT NULL
  AND codigo_lote ~ '^NL-[0-9]+-([0-9]{3})$';

-- 5. Comparar: consecutivo en BD vs consecutivo más alto en lotes reales
SELECT 
  'COMPARACIÓN' as seccion,
  cl.consecutivo as consecutivo_en_bd,
  COALESCE(MAX(CAST(SUBSTRING(e.codigo_lote FROM '([0-9]{3})$') AS INTEGER)), 0) as consecutivo_maximo_en_lotes,
  CASE 
    WHEN cl.consecutivo < COALESCE(MAX(CAST(SUBSTRING(e.codigo_lote FROM '([0-9]{3})$') AS INTEGER)), 0) 
    THEN '⚠️ PROBLEMA: El consecutivo en BD es MENOR que el máximo usado en lotes'
    WHEN cl.consecutivo = COALESCE(MAX(CAST(SUBSTRING(e.codigo_lote FROM '([0-9]{3})$') AS INTEGER)), 0)
    THEN '✓ CORRECTO: El consecutivo en BD coincide con el máximo usado'
    ELSE '⚠️ ATENCIÓN: El consecutivo en BD es MAYOR que el máximo usado (puede ser normal si hay lotes pendientes)'
  END as estado
FROM consecutivos_lotes cl
LEFT JOIN embarques e ON e.codigo_lote LIKE 'NL-%25%' AND e.codigo_lote IS NOT NULL
WHERE cl.tipo_operacion_codigo = 'NL-'
  AND cl.producto_codigo = '25'
GROUP BY cl.id, cl.consecutivo;

-- 6. Ver todos los lotes de pasta ordenados por consecutivo
SELECT 
  'LOTES DE PASTA ORDENADOS POR CONSECUTIVO' as seccion,
  e.boleta,
  e.codigo_lote,
  CAST(SUBSTRING(e.codigo_lote FROM '([0-9]{3})$') AS INTEGER) as consecutivo_numero,
  e.created_at,
  e.estatus
FROM embarques e
LEFT JOIN productos p ON e.producto_id = p.id
WHERE p.codigo_lote = '25'
  AND e.codigo_lote LIKE 'NL-%'
  AND e.codigo_lote IS NOT NULL
  AND e.codigo_lote ~ '^NL-[0-9]+-([0-9]{3})$'
ORDER BY CAST(SUBSTRING(e.codigo_lote FROM '([0-9]{3})$') AS INTEGER) DESC
LIMIT 20;

