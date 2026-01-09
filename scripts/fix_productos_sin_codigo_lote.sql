-- =====================================================
-- FIX: Asignar codigo_lote = '41' a productos sin código
-- =====================================================

-- 1. Ver productos SIN codigo_lote (antes del fix)
SELECT 
    id,
    nombre,
    codigo_boleta,
    codigo_lote,
    '❌ Sin código - Se asignará 41' as estado
FROM productos 
WHERE codigo_lote IS NULL
ORDER BY nombre;

-- 2. ACTUALIZAR: Asignar '41' (Otros) a todos los productos sin codigo_lote
UPDATE productos 
SET codigo_lote = '41'
WHERE codigo_lote IS NULL;

-- 3. Verificar el resultado (después del fix)
SELECT 
    id,
    nombre,
    codigo_boleta,
    codigo_lote,
    '✅ Actualizado' as estado
FROM productos 
WHERE codigo_lote = '41'
ORDER BY nombre;

-- 4. Mostrar resumen
SELECT 
    'RESUMEN' as info,
    COUNT(*) FILTER (WHERE codigo_lote IS NULL) as "Productos sin código",
    COUNT(*) FILTER (WHERE codigo_lote = '41') as "Productos con código 41",
    COUNT(*) as "Total productos"
FROM productos;

