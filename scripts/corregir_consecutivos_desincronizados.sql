-- ============================================
-- CORRECCIÓN: Consecutivos Desincronizados
-- ============================================
-- Fecha: 2026-01-20
-- Propósito: Corregir consecutivos que están desincronizados
-- ============================================

-- 1. AC-11 (Semilla de Girasol Convencional)
-- Máximo usado: 1 → Siguiente debería ser: 2
UPDATE consecutivos_lotes
SET consecutivo = 2
WHERE tipo_operacion_codigo = 'AC-'
  AND producto_codigo = '11'
  AND consecutivo < 2;

-- 2. EX-01 (Aceite de Cártamo Orgánico)
-- Máximo usado: 2 → Siguiente debería ser: 3
UPDATE consecutivos_lotes
SET consecutivo = 3
WHERE tipo_operacion_codigo = 'EX-'
  AND producto_codigo = '01'
  AND consecutivo < 3;

-- 3. EX-02 (Aceite de Cártamo Convencional)
-- Máximo usado: 2 → Siguiente debería ser: 3
UPDATE consecutivos_lotes
SET consecutivo = 3
WHERE tipo_operacion_codigo = 'EX-'
  AND producto_codigo = '02'
  AND consecutivo < 3;

-- 4. NL-09 (Semilla de Cártamo Convencional)
-- Máximo usado: 9 → Siguiente debería ser: 10
UPDATE consecutivos_lotes
SET consecutivo = 10
WHERE tipo_operacion_codigo = 'NL-'
  AND producto_codigo = '09'
  AND consecutivo < 10;

-- 5. NL-25 (Pasta Convencional de Cártamo)
-- Máximo usado: 49 → Siguiente debería ser: 50
UPDATE consecutivos_lotes
SET consecutivo = 50
WHERE tipo_operacion_codigo = 'NL-'
  AND producto_codigo = '25'
  AND consecutivo < 50;

-- 6. NL-29 (Mochote de Cártamo)
-- Máximo usado: 29 → Siguiente debería ser: 30
UPDATE consecutivos_lotes
SET consecutivo = 30
WHERE tipo_operacion_codigo = 'NL-'
  AND producto_codigo = '29'
  AND consecutivo < 30;

-- 7. NL-41 (Otros)
-- Máximo usado: 41 → Siguiente debería ser: 42
UPDATE consecutivos_lotes
SET consecutivo = 42
WHERE tipo_operacion_codigo = 'NL-'
  AND producto_codigo = '41'
  AND consecutivo < 42;

-- ============================================
-- VERIFICACIÓN POST-CORRECCIÓN
-- ============================================

SELECT 
  'VERIFICACIÓN POST-CORRECCIÓN' as tipo,
  cl.tipo_operacion_codigo,
  cl.producto_codigo,
  p.nombre as producto_nombre,
  cl.consecutivo as siguiente_consecutivo,
  GREATEST(
    COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0),
    COALESCE(MAX(SUBSTRING(r.codigo_lote FROM '(\d+)$')::INTEGER), 0)
  ) as max_usado_total,
  CASE 
    WHEN cl.consecutivo > GREATEST(
      COALESCE(MAX(SUBSTRING(e.codigo_lote FROM '(\d+)$')::INTEGER), 0),
      COALESCE(MAX(SUBSTRING(r.codigo_lote FROM '(\d+)$')::INTEGER), 0)
    ) THEN 
      '✅ CORREGIDO'
    ELSE 
      '⚠️ AÚN HAY PROBLEMA'
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
WHERE cl.tipo_operacion_codigo IN ('AC-', 'EX-', 'NL-')
  AND cl.producto_codigo IN ('11', '01', '02', '09', '25', '29', '41')
GROUP BY cl.id, cl.tipo_operacion_codigo, cl.producto_codigo, cl.consecutivo, p.nombre
ORDER BY cl.tipo_operacion_codigo, cl.producto_codigo;
