-- ============================================
-- SCRIPT DE DIAGNÓSTICO: Consecutivos de Lotes
-- ============================================
-- Fecha: 2026-01-20
-- Propósito: Verificar estado de sincronización de consecutivos
-- Uso: Ejecutar cuando necesites verificar que todo está correcto
-- ============================================
-- NOTA: En teoría, con RPC no debería haber problemas, pero este script
-- sirve para verificar y detectar cualquier anomalía
-- ============================================

-- ============================================
-- PARTE 1: DIAGNÓSTICO DE PROBLEMAS
-- ============================================

-- 1.1. Detectar códigos de lote duplicados en embarques
SELECT 
  '🔴 DUPLICADO EN EMBARQUES' as severidad,
  e.codigo_lote,
  COUNT(*) as veces_usado,
  STRING_AGG(e.boleta::text, ', ' ORDER BY e.created_at) as boletas_afectadas,
  STRING_AGG(e.id::text, ', ' ORDER BY e.created_at) as ids_embarques,
  MIN(e.created_at) as primera_creacion,
  MAX(e.created_at) as ultima_creacion
FROM embarques e
WHERE e.codigo_lote IS NOT NULL
GROUP BY e.codigo_lote
HAVING COUNT(*) > 1
ORDER BY veces_usado DESC, e.codigo_lote;

-- 1.2. Detectar códigos de lote duplicados en recepciones
SELECT 
  '🔴 DUPLICADO EN RECEPCIONES' as severidad,
  r.codigo_lote,
  COUNT(*) as veces_usado,
  STRING_AGG(r.boleta::text, ', ' ORDER BY r.created_at) as boletas_afectadas,
  STRING_AGG(r.id::text, ', ' ORDER BY r.created_at) as ids_recepciones,
  MIN(r.created_at) as primera_creacion,
  MAX(r.created_at) as ultima_creacion
FROM recepciones r
WHERE r.codigo_lote IS NOT NULL
GROUP BY r.codigo_lote
HAVING COUNT(*) > 1
ORDER BY veces_usado DESC, r.codigo_lote;

-- 1.3. Detectar desincronizaciones en consecutivos_lotes (embarques)
SELECT 
  '🟡 DESINCRONIZACIÓN EMBARQUES' as severidad,
  cl.tipo_operacion_codigo,
  cl.producto_codigo,
  p.nombre as producto_nombre,
  cl.consecutivo as consecutivo_en_tabla,
  COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0) as max_consecutivo_usado,
  cl.consecutivo - COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0) as diferencia,
  CASE 
    WHEN cl.consecutivo < COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0) THEN 
      'CRÍTICO: Consecutivo en tabla es MENOR que el usado'
    WHEN cl.consecutivo = COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0) THEN 
      'OK'
    ELSE 
      'ADELANTADO (normal si hay borradores)'
  END as estado,
  COUNT(e.id) as total_embarques
FROM consecutivos_lotes cl
LEFT JOIN productos p ON cl.producto_codigo = p.codigo_lote::text OR cl.producto_codigo = p.codigo_boleta::text
LEFT JOIN embarques e ON 
  e.codigo_lote IS NOT NULL 
  AND e.codigo_lote LIKE cl.tipo_operacion_codigo || '%'
  AND (
    e.codigo_lote LIKE '%' || cl.producto_codigo || '%'
    OR EXISTS (
      SELECT 1 FROM productos prod 
      WHERE prod.id = e.producto_id 
      AND (prod.codigo_lote::text = cl.producto_codigo OR prod.codigo_boleta::text = cl.producto_codigo)
    )
  )
GROUP BY cl.id, cl.tipo_operacion_codigo, cl.producto_codigo, cl.consecutivo, p.nombre
HAVING cl.consecutivo < COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0)
   OR ABS(cl.consecutivo - COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0)) > 5
ORDER BY ABS(cl.consecutivo - COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0)) DESC;

-- 1.4. Detectar múltiples entradas en consecutivos_lotes para la misma combinación
SELECT 
  '🟡 ENTRADAS DUPLICADAS' as severidad,
  cl.tipo_operacion_codigo,
  cl.producto_codigo,
  COUNT(*) as total_entradas,
  STRING_AGG(cl.id::text || ':' || cl.consecutivo::text, ', ' ORDER BY cl.id) as ids_y_consecutivos,
  MAX(cl.consecutivo) as max_consecutivo,
  MIN(cl.consecutivo) as min_consecutivo
FROM consecutivos_lotes cl
GROUP BY cl.tipo_operacion_codigo, cl.producto_codigo
HAVING COUNT(*) > 1
ORDER BY total_entradas DESC;

-- 1.5. Detectar embarques completados sin código de lote (últimos 30 días)
SELECT 
  '🟠 SIN CÓDIGO DE LOTE (EMBARQUES)' as severidad,
  e.id,
  e.boleta,
  e.producto_id,
  p.nombre as producto_nombre,
  e.estatus,
  e.created_at,
  e.updated_at
FROM embarques e
LEFT JOIN productos p ON e.producto_id = p.id
WHERE e.codigo_lote IS NULL
  AND e.estatus = 'Completado'
  AND e.created_at >= NOW() - INTERVAL '30 days'
ORDER BY e.created_at DESC;

-- 1.6. Detectar recepciones completadas sin código de lote (últimos 30 días)
SELECT 
  '🟠 SIN CÓDIGO DE LOTE (RECEPCIONES)' as severidad,
  r.id,
  r.boleta,
  r.producto_id,
  p.nombre as producto_nombre,
  r.estatus,
  r.created_at,
  r.updated_at
FROM recepciones r
LEFT JOIN productos p ON r.producto_id = p.id
WHERE r.codigo_lote IS NULL
  AND r.estatus = 'Completado'
  AND r.created_at >= NOW() - INTERVAL '30 days'
ORDER BY r.created_at DESC;

-- ============================================
-- PARTE 2: ESTADO ACTUAL DE TODOS LOS CONSECUTIVOS
-- ============================================

SELECT 
  '📊 ESTADO DE CONSECUTIVOS' as tipo,
  cl.tipo_operacion_codigo,
  cl.producto_codigo,
  p.nombre as producto_nombre,
  cl.consecutivo as siguiente_consecutivo,
  COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0) as max_consecutivo_usado_embarques,
  COALESCE(MAX(SUBSTRING(r.codigo_lote FROM '(\d+)$')::INTEGER), 0) as max_consecutivo_usado_recepciones,
  GREATEST(
    COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0),
    COALESCE(MAX(SUBSTRING(r.codigo_lote FROM '(\d+)$')::INTEGER), 0)
  ) as max_consecutivo_usado_total,
  CASE 
    WHEN cl.consecutivo <= GREATEST(
      COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0),
      COALESCE(MAX(SUBSTRING(r.codigo_lote FROM '(\d+)$')::INTEGER), 0)
    ) THEN 
      '⚠️ PROBLEMA: Consecutivo es menor o igual al usado'
    ELSE 
      '✅ OK'
  END as estado,
  COUNT(DISTINCT e.id) as total_embarques,
  COUNT(DISTINCT r.id) as total_recepciones
FROM consecutivos_lotes cl
LEFT JOIN productos p ON cl.producto_codigo = p.codigo_lote::text OR cl.producto_codigo = p.codigo_boleta::text
LEFT JOIN embarques e ON 
  e.codigo_lote IS NOT NULL 
  AND e.codigo_lote LIKE cl.tipo_operacion_codigo || '%'
  AND (
    e.codigo_lote LIKE '%' || cl.producto_codigo || '%'
    OR EXISTS (
      SELECT 1 FROM productos prod 
      WHERE prod.id = e.producto_id 
      AND (prod.codigo_lote::text = cl.producto_codigo OR prod.codigo_boleta::text = cl.producto_codigo)
    )
  )
LEFT JOIN recepciones r ON 
  r.codigo_lote IS NOT NULL 
  AND r.codigo_lote LIKE '%' || cl.producto_codigo || '%'
GROUP BY cl.id, cl.tipo_operacion_codigo, cl.producto_codigo, cl.consecutivo, p.nombre
ORDER BY cl.tipo_operacion_codigo, cl.producto_codigo;

-- ============================================
-- PARTE 3: RESUMEN GENERAL
-- ============================================

SELECT 
  '📊 RESUMEN GENERAL' as tipo,
  COUNT(DISTINCT cl.id) as total_consecutivos_registrados,
  COUNT(DISTINCT CASE WHEN e.codigo_lote IS NOT NULL THEN e.codigo_lote END) as total_lotes_embarques,
  COUNT(DISTINCT CASE WHEN r.codigo_lote IS NOT NULL THEN r.codigo_lote END) as total_lotes_recepciones,
  COUNT(DISTINCT CASE WHEN e.codigo_lote IS NULL AND e.estatus = 'Completado' THEN e.id END) as embarques_sin_lote,
  COUNT(DISTINCT CASE WHEN r.codigo_lote IS NULL AND r.estatus = 'Completado' THEN r.id END) as recepciones_sin_lote
FROM consecutivos_lotes cl
LEFT JOIN embarques e ON e.codigo_lote IS NOT NULL
LEFT JOIN recepciones r ON r.codigo_lote IS NOT NULL;
