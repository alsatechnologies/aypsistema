-- =====================================================
-- CAMBIO: Consecutivo de lotes POR TIPO DE OPERACIÓN + PRODUCTO
-- =====================================================
-- Antes: Consecutivo por combinación completa (tipo + origen + producto + almacen + año)
-- Ahora: Consecutivo por TIPO DE OPERACIÓN + PRODUCTO
-- 
-- Esto significa:
-- - Cliente diferente NO reinicia consecutivo
-- - Almacén diferente NO reinicia consecutivo  
-- - Año diferente NO reinicia consecutivo
-- - Tipo de operación diferente (NL-, EX-, AC-) = consecutivo separado
-- - Producto diferente = consecutivo separado
-- =====================================================

-- 1. Eliminar constraints existentes
ALTER TABLE consecutivos_lotes 
DROP CONSTRAINT IF EXISTS consecutivos_lotes_combinacion_key;

ALTER TABLE consecutivos_lotes 
DROP CONSTRAINT IF EXISTS consecutivos_lotes_tipo_operacion_codigo_anio_key;

ALTER TABLE consecutivos_lotes 
DROP CONSTRAINT IF EXISTS consecutivos_lotes_producto_key;

-- 2. Limpiar registros duplicados (mantener el de mayor consecutivo por tipo+producto)
DELETE FROM consecutivos_lotes a
USING consecutivos_lotes b
WHERE a.tipo_operacion_codigo = b.tipo_operacion_codigo
  AND a.producto_codigo = b.producto_codigo 
  AND a.id < b.id;

-- 3. Crear nuevo constraint POR TIPO DE OPERACIÓN + PRODUCTO
ALTER TABLE consecutivos_lotes 
ADD CONSTRAINT consecutivos_lotes_tipo_producto_key 
UNIQUE(tipo_operacion_codigo, producto_codigo);

-- 4. Configurar consecutivo de Pasta Convencional de Cártamo (código 25) 
-- para Embarque Nacional (NL-) a 18 para que el siguiente sea 019
INSERT INTO consecutivos_lotes (tipo_operacion_codigo, producto_codigo, consecutivo)
VALUES ('NL-', '25', 18)
ON CONFLICT (tipo_operacion_codigo, producto_codigo) 
DO UPDATE SET consecutivo = 18;

-- Verificar resultado
SELECT tipo_operacion_codigo, producto_codigo, consecutivo 
FROM consecutivos_lotes 
ORDER BY tipo_operacion_codigo, producto_codigo;

