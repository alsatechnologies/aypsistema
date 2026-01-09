-- =====================================================
-- FIX: Constraint de consecutivos_lotes
-- =====================================================
-- Problema: El constraint UNIQUE era solo (tipo_operacion_codigo, anio)
-- pero el código necesita consecutivos por combinación completa
-- Solución: Cambiar a UNIQUE(tipo + origen + producto + almacen + año)
-- =====================================================

-- 1. Eliminar el constraint incorrecto (si existe)
ALTER TABLE consecutivos_lotes 
DROP CONSTRAINT IF EXISTS consecutivos_lotes_tipo_operacion_codigo_anio_key;

-- 2. Crear el nuevo constraint con todos los campos
ALTER TABLE consecutivos_lotes 
ADD CONSTRAINT consecutivos_lotes_combinacion_key 
UNIQUE(tipo_operacion_codigo, origen_codigo, producto_codigo, almacen_codigo, anio);

-- Nota: Este cambio permite tener consecutivos separados para cada 
-- combinación de tipo_operacion + origen + producto + almacen + año
-- Ejemplo: 
--   EX-01-01-19-2026 → consecutivo 1, 2, 3...
--   EX-01-02-15-2026 → consecutivo 1, 2, 3... (separado)

