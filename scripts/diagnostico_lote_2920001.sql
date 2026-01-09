-- =====================================================
-- DIAGNÓSTICO: ¿Por qué la boleta 2920001 no tiene lote?
-- =====================================================

-- 1. Ver todos los datos del embarque
SELECT 
    'EMBARQUE' as tabla,
    id,
    boleta,
    codigo_lote,
    estatus,
    tipo_embarque,
    producto_id,
    cliente_id,
    almacen_id,
    chofer,
    placas,
    peso_bruto,
    peso_tara,
    peso_neto,
    created_at
FROM embarques
WHERE boleta = '2920001';

-- 2. Verificar si el producto tiene codigo_lote configurado
SELECT 
    'PRODUCTO' as tabla,
    p.id,
    p.nombre,
    p.codigo_boleta,
    p.codigo_lote,
    CASE 
        WHEN p.codigo_lote IS NULL AND p.codigo_boleta IS NULL THEN '❌ SIN CÓDIGO - PROBLEMA'
        WHEN p.codigo_lote IS NOT NULL THEN '✅ Tiene codigo_lote'
        WHEN p.codigo_boleta IS NOT NULL THEN '⚠️ Solo tiene codigo_boleta'
    END as estado
FROM productos p
WHERE p.id = (SELECT producto_id FROM embarques WHERE boleta = '2920001');

-- 3. Verificar si el almacén tiene codigo_lote configurado
SELECT 
    'ALMACEN' as tabla,
    a.id,
    a.nombre,
    a.codigo_lote,
    CASE 
        WHEN a.codigo_lote IS NULL THEN '❌ SIN CÓDIGO - PROBLEMA'
        ELSE '✅ Tiene codigo_lote'
    END as estado
FROM almacenes a
WHERE a.id = (SELECT almacen_id FROM embarques WHERE boleta = '2920001');

-- 4. Verificar el cliente
SELECT 
    'CLIENTE' as tabla,
    c.id,
    c.empresa,
    ol.codigo as codigo_origen,
    CASE 
        WHEN ol.codigo IS NOT NULL THEN '✅ Tiene origen configurado'
        ELSE '⚠️ Sin origen (usará 01 por defecto para embarques)'
    END as estado
FROM clientes c
LEFT JOIN origenes_lote ol ON ol.cliente_id = c.id
WHERE c.id = (SELECT cliente_id FROM embarques WHERE boleta = '2920001');

-- 5. RESUMEN DE DIAGNÓSTICO
SELECT '============ DIAGNÓSTICO FINAL ============' as info;

SELECT 
    e.boleta,
    CASE WHEN e.estatus = 'Completado' THEN '✅' ELSE '❌' END as "¿Completado?",
    CASE WHEN e.codigo_lote IS NULL THEN '⚠️ NULL' ELSE e.codigo_lote END as "codigo_lote",
    CASE WHEN e.producto_id IS NOT NULL THEN '✅ ' || e.producto_id::text ELSE '❌ NULL' END as "producto_id",
    CASE WHEN e.cliente_id IS NOT NULL THEN '✅ ' || e.cliente_id::text ELSE '❌ NULL' END as "cliente_id",
    CASE WHEN e.almacen_id IS NOT NULL THEN '✅ ' || e.almacen_id::text ELSE '❌ NULL - PROBLEMA!' END as "almacen_id",
    CASE WHEN e.tipo_embarque IS NOT NULL THEN '✅ ' || e.tipo_embarque ELSE '❌ NULL - PROBLEMA!' END as "tipo_embarque",
    CASE 
        WHEN e.estatus != 'Completado' THEN '❌ No está completado'
        WHEN e.codigo_lote IS NOT NULL THEN '✅ Ya tiene lote'
        WHEN e.producto_id IS NULL THEN '❌ Falta producto_id'
        WHEN e.cliente_id IS NULL THEN '❌ Falta cliente_id'
        WHEN e.almacen_id IS NULL THEN '❌ FALTA ALMACEN_ID - Esta es la causa'
        WHEN e.tipo_embarque IS NULL THEN '❌ Falta tipo_embarque'
        ELSE '⚠️ Debería tener lote - revisar logs'
    END as "DIAGNÓSTICO"
FROM embarques e
WHERE e.boleta = '2920001';

-- 6. Si el almacén es null, ver qué almacenes existen
SELECT 
    'ALMACENES DISPONIBLES' as info,
    id,
    nombre,
    codigo_lote,
    tipo
FROM almacenes
WHERE activo = true
ORDER BY nombre;

