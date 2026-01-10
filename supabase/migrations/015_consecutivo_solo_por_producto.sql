-- =====================================================
-- CAMBIO: Consecutivo de lotes SOLO POR PRODUCTO
-- =====================================================
-- Antes: Consecutivo por combinación (tipo + origen + producto + almacen + año)
-- Ahora: Consecutivo SOLO por producto
-- 
-- Esto significa:
-- - Cliente diferente NO reinicia consecutivo
-- - Almacén diferente NO reinicia consecutivo  
-- - Año diferente NO reinicia consecutivo
-- - Solo producto diferente = consecutivo separado
-- =====================================================

-- 1. Eliminar constraints existentes
ALTER TABLE consecutivos_lotes 
DROP CONSTRAINT IF EXISTS consecutivos_lotes_combinacion_key;

ALTER TABLE consecutivos_lotes 
DROP CONSTRAINT IF EXISTS consecutivos_lotes_tipo_operacion_codigo_anio_key;

-- 2. Crear nuevo constraint SOLO por producto
ALTER TABLE consecutivos_lotes 
ADD CONSTRAINT consecutivos_lotes_producto_key 
UNIQUE(producto_codigo);

-- 3. Limpiar registros duplicados (mantener el de mayor consecutivo por producto)
DELETE FROM consecutivos_lotes a
USING consecutivos_lotes b
WHERE a.producto_codigo = b.producto_codigo 
  AND a.id < b.id;

-- 4. Configurar consecutivo de Pasta Convencional de Cártamo (código 25) a 18
-- Para que el siguiente sea 019
INSERT INTO consecutivos_lotes (tipo_operacion_codigo, producto_codigo, consecutivo)
VALUES ('NL-', '25', 18)
ON CONFLICT (producto_codigo) 
DO UPDATE SET consecutivo = 18;

-- Verificar resultado
SELECT producto_codigo, consecutivo FROM consecutivos_lotes ORDER BY producto_codigo;

