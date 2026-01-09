-- Script para obtener el código de lote de la operación 2250011
-- Esta boleta puede estar en embarques o recepciones

-- Buscar en embarques
SELECT 
    id,
    boleta,
    'Embarque' as tipo_operacion,
    codigo_lote,
    producto_id,
    cliente_id,
    almacen_id,
    tipo_embarque,
    estatus,
    created_at
FROM public.embarques
WHERE boleta = '2250011';

-- Buscar en recepciones
SELECT 
    id,
    boleta,
    'Reciba' as tipo_operacion,
    codigo_lote,
    producto_id,
    proveedor_id,
    almacen_id,
    estatus,
    created_at
FROM public.recepciones
WHERE boleta = '2250011';

-- Si necesitas buscar en ordenes (por si la boleta está en ese estado)
SELECT 
    id,
    boleta,
    'Orden' as tipo_operacion,
    tipo_operacion as tipo,
    estatus,
    created_at
FROM public.ordenes
WHERE boleta = '2250011';

