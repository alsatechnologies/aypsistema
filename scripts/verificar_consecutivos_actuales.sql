-- ============================================
-- VERIFICACIÓN RÁPIDA: Estado Actual de Consecutivos
-- ============================================
-- Fecha: 2026-01-20
-- Propósito: Ver rápidamente el estado de todos los consecutivos
-- ============================================

-- Estado completo de todos los consecutivos registrados
SELECT 
  cl.tipo_operacion_codigo as tipo_operacion,
  cl.producto_codigo as producto_codigo,
  p.nombre as producto_nombre,
  cl.consecutivo as siguiente_consecutivo,
  COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0) as max_usado_embarques,
  COALESCE(MAX(SUBSTRING(r.codigo_lote FROM '(\d+)$')::INTEGER), 0) as max_usado_recepciones,
  GREATEST(
    COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0),
    COALESCE(MAX(SUBSTRING(r.codigo_lote FROM '(\d+)$')::INTEGER), 0)
  ) as max_usado_total,
  CASE 
    WHEN cl.consecutivo <= GREATEST(
      COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0),
      COALESCE(MAX(SUBSTRING(r.codigo_lote FROM '(\d+)$')::INTEGER), 0)
    ) THEN 
      '⚠️ PROBLEMA'
    ELSE 
      '✅ OK'
  END as estado
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
ORDER BY 
  CASE WHEN cl.consecutivo <= GREATEST(
    COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0),
    COALESCE(MAX(SUBSTRING(r.codigo_lote FROM '(\d+)$')::INTEGER), 0)
  ) THEN 0 ELSE 1 END,
  cl.tipo_operacion_codigo, 
  cl.producto_codigo;
