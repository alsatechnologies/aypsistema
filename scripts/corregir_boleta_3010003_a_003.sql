-- ============================================
-- CORRECCIÓN: Boleta 3010003 - Cambiar consecutivo de 004 a 003
-- ============================================
-- Fecha: 2026-01-21
-- Problema: El consecutivo 003 falta porque hubo un error donde otro tipo de aceite
--           estaba siendo considerado como aceite de cártamo orgánico
-- Solución: Corregir la boleta 3010003 para usar el consecutivo 003
-- ============================================

-- 1. Verificar estado actual
SELECT 
  'ESTADO ANTES DE CORRECCIÓN' as seccion,
  e.id,
  e.boleta,
  e.codigo_lote,
  e.estatus,
  p.nombre as producto,
  p.codigo_lote as producto_codigo,
  SUBSTRING(e.codigo_lote FROM '([0-9]{3})$') as consecutivo_actual
FROM embarques e
LEFT JOIN productos p ON e.producto_id = p.id
WHERE e.boleta = '3010003';

-- 2. Verificar consecutivo en BD antes de corregir
SELECT 
  'CONSECUTIVO EN BD ANTES' as seccion,
  cl.id,
  cl.consecutivo,
  cl.producto_codigo,
  cl.almacen_codigo
FROM consecutivos_lotes cl
WHERE cl.tipo_operacion_codigo = 'EX-'
  AND cl.producto_codigo = '01'
  AND cl.almacen_codigo = '19'
  AND cl.anio = 2026;

-- 3. Actualizar el código de lote de la boleta 3010003
-- Cambiar de EX-01011926-004 a EX-01011926-003
UPDATE embarques
SET codigo_lote = 'EX-01011926-003',
    updated_at = CURRENT_TIMESTAMP
WHERE boleta = '3010003'
  AND codigo_lote = 'EX-01011926-004';

-- 4. Decrementar el consecutivo en consecutivos_lotes de 4 a 3
UPDATE consecutivos_lotes
SET consecutivo = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE tipo_operacion_codigo = 'EX-'
  AND producto_codigo = '01'
  AND almacen_codigo = '19'
  AND anio = 2026
  AND consecutivo = 4;

-- 5. Verificar estado después de la corrección
SELECT 
  'ESTADO DESPUÉS DE CORRECCIÓN' as seccion,
  e.id,
  e.boleta,
  e.codigo_lote,
  e.estatus,
  p.nombre as producto,
  p.codigo_lote as producto_codigo,
  SUBSTRING(e.codigo_lote FROM '([0-9]{3})$') as consecutivo_corregido
FROM embarques e
LEFT JOIN productos p ON e.producto_id = p.id
WHERE e.boleta = '3010003';

-- 6. Verificar consecutivo en BD después de corregir
SELECT 
  'CONSECUTIVO EN BD DESPUÉS' as seccion,
  cl.id,
  cl.consecutivo,
  cl.producto_codigo,
  cl.almacen_codigo
FROM consecutivos_lotes cl
WHERE cl.tipo_operacion_codigo = 'EX-'
  AND cl.producto_codigo = '01'
  AND cl.almacen_codigo = '19'
  AND cl.anio = 2026;

-- 7. Verificar secuencia completa después de la corrección
SELECT 
  'SECUENCIA COMPLETA' as seccion,
  e.boleta,
  e.codigo_lote,
  e.created_at,
  SUBSTRING(e.codigo_lote FROM '([0-9]{3})$')::INTEGER as consecutivo_numero
FROM embarques e
JOIN productos p ON e.producto_id = p.id
WHERE e.tipo_embarque = 'Exportación'
AND p.codigo_lote = '01'
AND e.almacen_id = 20
AND EXTRACT(YEAR FROM COALESCE(e.created_at, CURRENT_DATE)) = 2026
AND e.codigo_lote IS NOT NULL
ORDER BY e.created_at;
