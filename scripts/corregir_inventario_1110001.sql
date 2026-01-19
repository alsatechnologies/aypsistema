-- ============================================
-- CORREGIR INVENTARIO: Agregar recepción 1110001 al inventario
-- ============================================
-- Este script actualiza el inventario para la recepción 1110001
-- si no se actualizó automáticamente cuando se completó
-- ============================================

DO $$
DECLARE
  v_recepcion_id INTEGER;
  v_boleta VARCHAR;
  v_estatus VARCHAR;
  v_producto_id INTEGER;
  v_almacen_id INTEGER;
  v_peso_neto NUMERIC;
  v_inventario_existente RECORD;
  v_nueva_cantidad NUMERIC;
BEGIN
  -- Obtener datos de la recepción
  SELECT 
    id,
    boleta,
    estatus,
    producto_id,
    almacen_id,
    peso_neto
  INTO 
    v_recepcion_id,
    v_boleta,
    v_estatus,
    v_producto_id,
    v_almacen_id,
    v_peso_neto
  FROM recepciones
  WHERE boleta = '1110001';
  
  -- Verificar que la recepción existe
  IF v_recepcion_id IS NULL THEN
    RAISE EXCEPTION 'Recepción con boleta 1110001 no encontrada';
  END IF;
  
  -- Verificar que esté completada
  IF v_estatus != 'Completado' THEN
    RAISE EXCEPTION 'La recepción no está completada (estatus actual: %)', v_estatus;
  END IF;
  
  -- Verificar que tenga los datos necesarios
  IF v_producto_id IS NULL THEN
    RAISE EXCEPTION 'La recepción no tiene producto_id asignado';
  END IF;
  
  IF v_almacen_id IS NULL THEN
    RAISE EXCEPTION 'La recepción no tiene almacen_id asignado';
  END IF;
  
  IF v_peso_neto IS NULL OR v_peso_neto <= 0 THEN
    RAISE EXCEPTION 'La recepción no tiene peso_neto válido (actual: %)', v_peso_neto;
  END IF;
  
  -- Verificar si ya existe inventario para este producto y almacén
  SELECT * INTO v_inventario_existente
  FROM inventario_almacenes
  WHERE producto_id = v_producto_id
    AND almacen_id = v_almacen_id;
  
  IF FOUND THEN
    -- Si existe, sumar el peso_neto
    v_nueva_cantidad := (v_inventario_existente.cantidad || 0) + v_peso_neto;
    
    UPDATE inventario_almacenes
    SET cantidad = v_nueva_cantidad,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_inventario_existente.id;
    
    RAISE NOTICE 'Inventario actualizado: Cantidad anterior: %, Peso neto agregado: %, Nueva cantidad: %', 
      v_inventario_existente.cantidad, v_peso_neto, v_nueva_cantidad;
  ELSE
    -- Si no existe, crear nuevo registro
    INSERT INTO inventario_almacenes (
      almacen_id,
      producto_id,
      cantidad,
      created_at,
      updated_at
    ) VALUES (
      v_almacen_id,
      v_producto_id,
      v_peso_neto,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE 'Nuevo registro de inventario creado: Producto ID: %, Almacén ID: %, Cantidad: %', 
      v_producto_id, v_almacen_id, v_peso_neto;
  END IF;
  
  RAISE NOTICE 'Inventario corregido exitosamente para boleta %', v_boleta;
  
END $$;

-- Verificar el resultado
SELECT 
  'RESULTADO' as seccion,
  r.boleta,
  r.peso_neto as peso_neto_recepcion,
  ia.cantidad as cantidad_inventario,
  p.nombre as producto,
  a.nombre as almacen
FROM recepciones r
LEFT JOIN inventario_almacenes ia 
  ON r.producto_id = ia.producto_id 
  AND r.almacen_id = ia.almacen_id
LEFT JOIN productos p ON r.producto_id = p.id
LEFT JOIN almacenes a ON r.almacen_id = a.id
WHERE r.boleta = '1110001';

-- Verificar inventario total por producto (Girasol Convencional)
SELECT 
  'INVENTARIO TOTAL GIRASOL CONVENCIONAL' as seccion,
  p.id,
  p.nombre,
  SUM(ia.cantidad) as total
FROM productos p
LEFT JOIN inventario_almacenes ia ON p.id = ia.producto_id
WHERE p.nombre LIKE '%Girasol%Convencional%'
GROUP BY p.id, p.nombre;

