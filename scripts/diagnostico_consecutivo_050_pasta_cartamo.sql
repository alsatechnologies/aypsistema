-- ============================================
-- DIAGNÓSTICO: Consecutivo 050 de Pasta de Cártamo
-- ============================================
-- Problema: La boleta 2250048 debería haber sido consecutivo 050, pero tiene 051
-- ============================================

-- 1. Verificar el estado actual
SELECT 
  'ESTADO ACTUAL' as seccion,
  e.boleta,
  e.codigo_lote,
  SUBSTRING(e.codigo_lote FROM '([0-9]{3})$')::INTEGER as consecutivo_actual,
  ROW_NUMBER() OVER (ORDER BY e.created_at) + 44 as consecutivo_deberia_ser,
  CASE 
    WHEN SUBSTRING(e.codigo_lote FROM '([0-9]{3})$')::INTEGER = ROW_NUMBER() OVER (ORDER BY e.created_at) + 44
    THEN '✅ CORRECTO'
    ELSE '❌ DEBERÍA SER ' || (ROW_NUMBER() OVER (ORDER BY e.created_at) + 44)::TEXT
  END as correccion_necesaria
FROM embarques e
JOIN productos p ON e.producto_id = p.id
LEFT JOIN almacenes a ON e.almacen_id = a.id
WHERE p.codigo_lote = '25'
  AND e.tipo_embarque = 'Nacional'
  AND COALESCE(a.codigo_lote, LPAD(a.id::TEXT, 2, '0')) = '36'
  AND e.codigo_lote IS NOT NULL
  AND e.codigo_lote ~ '^NL-01253626-[0-9]{3}$'
  AND SUBSTRING(e.codigo_lote FROM '([0-9]{3})$')::INTEGER BETWEEN 45 AND 53
ORDER BY e.created_at;

-- 2. Verificar el consecutivo en BD
SELECT 
  'CONSECUTIVO EN BD' as seccion,
  cl.consecutivo as consecutivo_actual_en_bd,
  (
    SELECT MAX(SUBSTRING(e.codigo_lote FROM '([0-9]{3})$')::INTEGER)
    FROM embarques e
    JOIN productos p ON e.producto_id = p.id
    LEFT JOIN almacenes a ON e.almacen_id = a.id
    WHERE p.codigo_lote = '25'
      AND e.tipo_embarque = 'Nacional'
      AND COALESCE(a.codigo_lote, LPAD(a.id::TEXT, 2, '0')) = '36'
      AND e.codigo_lote IS NOT NULL
      AND e.codigo_lote ~ '^NL-01253626-[0-9]{3}$'
  ) as max_consecutivo_usado,
  CASE 
    WHEN cl.consecutivo > (
      SELECT MAX(SUBSTRING(e.codigo_lote FROM '([0-9]{3})$')::INTEGER)
      FROM embarques e
      JOIN productos p ON e.producto_id = p.id
      LEFT JOIN almacenes a ON e.almacen_id = a.id
      WHERE p.codigo_lote = '25'
        AND e.tipo_embarque = 'Nacional'
        AND COALESCE(a.codigo_lote, LPAD(a.id::TEXT, 2, '0')) = '36'
        AND e.codigo_lote IS NOT NULL
        AND e.codigo_lote ~ '^NL-01253626-[0-9]{3}$'
    )
    THEN '⚠️ DESINCRONIZADO'
    ELSE '✅ SINCRONIZADO'
  END as estado
FROM consecutivos_lotes cl
WHERE cl.tipo_operacion_codigo = 'NL-'
  AND cl.producto_codigo = '25'
  AND cl.almacen_codigo = '36'
  AND cl.anio = 2026;

-- 3. Resumen del problema
SELECT 
  'RESUMEN' as seccion,
  'La boleta 2250048 debería haber sido consecutivo 050' as problema,
  'Pero tiene consecutivo 051' as estado_actual,
  'El consecutivo en BD se incrementó incorrectamente, saltándose 049 y 050' as causa,
  'Las boletas 2250048, 2250049 y 2250050 tienen consecutivos incorrectos' as afectadas;
