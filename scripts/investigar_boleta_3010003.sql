-- ============================================
-- INVESTIGACIÓN: Boleta 3010003 - Consecutivo de Lote
-- ============================================
-- Investigar por qué la boleta 3010003 tiene el consecutivo de lote que tiene
-- ============================================

-- 1. Información completa de la boleta 3010003
SELECT 
  'INFORMACIÓN BOLETA' as seccion,
  e.id,
  e.boleta,
  e.codigo_lote,
  e.estatus,
  e.tipo_embarque,
  e.producto_id,
  e.cliente_id,
  e.almacen_id,
  e.created_at,
  e.updated_at,
  p.nombre as producto,
  p.codigo_lote as producto_codigo_lote,
  c.empresa as cliente,
  a.nombre as almacen,
  a.codigo_lote as almacen_codigo_lote
FROM embarques e
LEFT JOIN productos p ON e.producto_id = p.id
LEFT JOIN clientes c ON e.cliente_id = c.id
LEFT JOIN almacenes a ON e.almacen_id = a.id
WHERE e.boleta = '3010003';

-- 2. Analizar el código de lote actual
-- Formato esperado: EX-01031326-XXX
-- Donde:
--   EX- = Exportación
--   01 = Origen (ACEITE Y PROTEINAS SA DE CV)
--   03 = Código de producto (debe coincidir con producto.codigo_lote)
--   13 = Código de almacén
--   26 = Año (2026)
--   XXX = Consecutivo (3 dígitos)

-- 3. Verificar el consecutivo en consecutivos_lotes para esta combinación
SELECT 
  'CONSECUTIVO EN BD' as seccion,
  cl.id,
  cl.tipo_operacion_codigo,
  cl.origen_codigo,
  cl.producto_codigo,
  cl.almacen_codigo,
  cl.anio_codigo,
  cl.anio,
  cl.consecutivo,
  cl.created_at,
  cl.updated_at
FROM consecutivos_lotes cl
WHERE cl.tipo_operacion_codigo = 'EX-'
  AND cl.producto_codigo = (
    SELECT p.codigo_lote 
    FROM embarques e
    JOIN productos p ON e.producto_id = p.id
    WHERE e.boleta = '3010003'
  )
  AND cl.almacen_codigo = (
    SELECT COALESCE(a.codigo_lote, LPAD(a.id::TEXT, 2, '0'))
    FROM embarques e
    JOIN almacenes a ON e.almacen_id = a.id
    WHERE e.boleta = '3010003'
  )
  AND cl.anio = (
    SELECT EXTRACT(YEAR FROM COALESCE(e.created_at, CURRENT_DATE))::INTEGER
    FROM embarques e
    WHERE e.boleta = '3010003'
  );

-- 4. Extraer el consecutivo del código de lote actual
SELECT 
  'ANÁLISIS CÓDIGO LOTE' as seccion,
  e.boleta,
  e.codigo_lote,
  CASE 
    WHEN e.codigo_lote IS NULL THEN 'SIN CÓDIGO DE LOTE'
    WHEN e.codigo_lote !~ '^[A-Z]{2}-[0-9]{8}-[0-9]{3}$' THEN 'FORMATO INVÁLIDO'
    ELSE 'FORMATO VÁLIDO'
  END as estado_formato,
  CASE 
    WHEN e.codigo_lote IS NOT NULL THEN 
      SUBSTRING(e.codigo_lote FROM '([0-9]{3})$')
    ELSE NULL
  END as consecutivo_extraido,
  CASE 
    WHEN e.codigo_lote IS NOT NULL THEN 
      SUBSTRING(e.codigo_lote FROM '^([A-Z]{2})')
    ELSE NULL
  END as tipo_operacion_extraido,
  CASE 
    WHEN e.codigo_lote IS NOT NULL THEN 
      SUBSTRING(e.codigo_lote FROM '^[A-Z]{2}-([0-9]{2})')
    ELSE NULL
  END as origen_extraido,
  CASE 
    WHEN e.codigo_lote IS NOT NULL THEN 
      SUBSTRING(e.codigo_lote FROM '^[A-Z]{2}-[0-9]{2}([0-9]{2})')
    ELSE NULL
  END as producto_extraido,
  CASE 
    WHEN e.codigo_lote IS NOT NULL THEN 
      SUBSTRING(e.codigo_lote FROM '^[A-Z]{2}-[0-9]{4}([0-9]{2})')
    ELSE NULL
  END as almacen_extraido,
  CASE 
    WHEN e.codigo_lote IS NOT NULL THEN 
      SUBSTRING(e.codigo_lote FROM '^[A-Z]{2}-[0-9]{6}([0-9]{2})')
    ELSE NULL
  END as anio_extraido
FROM embarques e
WHERE e.boleta = '3010003';

-- 5. Verificar otras boletas del mismo producto/tipo para comparar
SELECT 
  'BOLETAS SIMILARES' as seccion,
  e.boleta,
  e.codigo_lote,
  e.estatus,
  e.created_at,
  p.nombre as producto,
  p.codigo_lote as producto_codigo,
  CASE 
    WHEN e.codigo_lote IS NOT NULL THEN 
      SUBSTRING(e.codigo_lote FROM '([0-9]{3})$')
    ELSE NULL
  END as consecutivo_lote
FROM embarques e
JOIN productos p ON e.producto_id = p.id
WHERE e.tipo_embarque = (
  SELECT tipo_embarque FROM embarques WHERE boleta = '3010003'
)
AND p.codigo_lote = (
  SELECT p2.codigo_lote 
  FROM embarques e2
  JOIN productos p2 ON e2.producto_id = p2.id
  WHERE e2.boleta = '3010003'
)
AND e.almacen_id = (
  SELECT almacen_id FROM embarques WHERE boleta = '3010003'
)
AND EXTRACT(YEAR FROM COALESCE(e.created_at, CURRENT_DATE)) = (
  SELECT EXTRACT(YEAR FROM COALESCE(e2.created_at, CURRENT_DATE))
  FROM embarques e2
  WHERE e2.boleta = '3010003'
)
ORDER BY e.created_at;

-- 6. Verificar si hay inconsistencias en los consecutivos
SELECT 
  'VERIFICACIÓN CONSECUTIVOS' as seccion,
  cl.tipo_operacion_codigo,
  cl.producto_codigo,
  cl.almacen_codigo,
  cl.anio,
  cl.consecutivo as consecutivo_actual,
  (
    SELECT MAX(
      CASE 
        WHEN e.codigo_lote IS NOT NULL AND e.codigo_lote ~ '^[A-Z]{2}-[0-9]{8}-[0-9]{3}$' THEN
          SUBSTRING(e.codigo_lote FROM '([0-9]{3})$')::INTEGER
        ELSE 0
      END
    )
    FROM embarques e
    JOIN productos p ON e.producto_id = p.id
    JOIN almacenes a ON e.almacen_id = a.id
    WHERE e.tipo_embarque = CASE 
      WHEN cl.tipo_operacion_codigo = 'EX-' THEN 'Exportación'
      WHEN cl.tipo_operacion_codigo = 'NL-' THEN 'Nacional'
      ELSE NULL
    END
    AND p.codigo_lote = cl.producto_codigo
    AND COALESCE(a.codigo_lote, LPAD(a.id::TEXT, 2, '0')) = cl.almacen_codigo
    AND EXTRACT(YEAR FROM COALESCE(e.created_at, CURRENT_DATE)) = cl.anio
    AND e.codigo_lote IS NOT NULL
  ) as max_consecutivo_usado
FROM consecutivos_lotes cl
WHERE cl.tipo_operacion_codigo = 'EX-'
  AND cl.producto_codigo = (
    SELECT p.codigo_lote 
    FROM embarques e
    JOIN productos p ON e.producto_id = p.id
    WHERE e.boleta = '3010003'
  )
  AND cl.almacen_codigo = (
    SELECT COALESCE(a.codigo_lote, LPAD(a.id::TEXT, 2, '0'))
    FROM embarques e
    JOIN almacenes a ON e.almacen_id = a.id
    WHERE e.boleta = '3010003'
  )
  AND cl.anio = (
    SELECT EXTRACT(YEAR FROM COALESCE(e.created_at, CURRENT_DATE))::INTEGER
    FROM embarques e
    WHERE e.boleta = '3010003'
  );

-- 7. Historial de cambios (si existe tabla de auditoría)
-- SELECT * FROM ... (si existe)
