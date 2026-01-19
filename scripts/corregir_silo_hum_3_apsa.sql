-- ============================================
-- CORREGIR INVENTARIO: Solo SILO HUM 3 APSA
-- ============================================
-- Este script actualiza el inventario SOLO para el almacén "SILO HUM 3 APSA"
-- basándose en las recepciones completadas que tienen este almacén como destino
-- ============================================

DO $$
DECLARE
  v_almacen_id INTEGER;
  v_recepcion RECORD;
  v_inventario_existente RECORD;
  v_nueva_cantidad NUMERIC;
  v_suma_total NUMERIC := 0;
BEGIN
  -- Obtener el ID del almacén "SILO HUM 3 APSA"
  SELECT id INTO v_almacen_id
  FROM almacenes
  WHERE nombre = 'SILO HUM 3 APSA';
  
  IF v_almacen_id IS NULL THEN
    RAISE EXCEPTION 'Almacén "SILO HUM 3 APSA" no encontrado';
  END IF;
  
  RAISE NOTICE 'Procesando recepciones para almacén ID: % (SILO HUM 3 APSA)', v_almacen_id;
  
  -- Iterar sobre todas las recepciones completadas que tienen este almacén como destino
  FOR v_recepcion IN 
    SELECT 
      id,
      boleta,
      estatus,
      producto_id,
      almacen_id,
      peso_neto
    FROM recepciones
    WHERE estatus = 'Completado'
      AND almacen_id = v_almacen_id
      AND producto_id IS NOT NULL
      AND peso_neto IS NOT NULL
      AND peso_neto > 0
    ORDER BY created_at ASC
  LOOP
    -- Verificar si ya existe inventario para este producto y almacén
    SELECT * INTO v_inventario_existente
    FROM inventario_almacenes
    WHERE producto_id = v_recepcion.producto_id
      AND almacen_id = v_almacen_id;
    
    IF FOUND THEN
      -- Si existe, sumar el peso_neto si no está ya incluido
      -- Si el inventario está en 0 o es menor que el peso_neto, agregar la diferencia
      IF v_inventario_existente.cantidad = 0 OR v_inventario_existente.cantidad < v_recepcion.peso_neto THEN
        IF v_inventario_existente.cantidad = 0 THEN
          v_nueva_cantidad := v_recepcion.peso_neto;
        ELSE
          -- Sumar solo la diferencia faltante
          v_nueva_cantidad := v_inventario_existente.cantidad + (v_recepcion.peso_neto - v_inventario_existente.cantidad);
        END IF;
        
        UPDATE inventario_almacenes
        SET cantidad = v_nueva_cantidad,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_inventario_existente.id;
        
        RAISE NOTICE 'Actualizado inventario para boleta %: Producto ID: %, Cantidad anterior: %, Nueva cantidad: %', 
          v_recepcion.boleta, v_recepcion.producto_id, v_inventario_existente.cantidad, v_nueva_cantidad;
      END IF;
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
        v_recepcion.producto_id,
        v_recepcion.peso_neto,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      );
      
      RAISE NOTICE 'Creado inventario para boleta %: Producto ID: %, Cantidad: %', 
        v_recepcion.boleta, v_recepcion.producto_id, v_recepcion.peso_neto;
    END IF;
    
    v_suma_total := v_suma_total + v_recepcion.peso_neto;
  END LOOP;
  
  -- Actualizar capacidad_actual del almacén sumando todas las cantidades
  SELECT COALESCE(SUM(cantidad), 0)
  INTO v_suma_total
  FROM inventario_almacenes
  WHERE almacen_id = v_almacen_id;
  
  UPDATE almacenes
  SET capacidad_actual = v_suma_total,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = v_almacen_id;
  
  RAISE NOTICE 'Proceso completado para SILO HUM 3 APSA. Capacidad actual actualizada a: %', v_suma_total;
  
END $$;

-- Verificar el resultado
SELECT 
  'RESULTADO: SILO HUM 3 APSA' as seccion,
  a.id,
  a.nombre as almacen,
  a.capacidad_total,
  a.capacidad_actual,
  COALESCE(SUM(ia.cantidad), 0) as suma_inventario_almacenes,
  CASE 
    WHEN a.capacidad_actual = COALESCE(SUM(ia.cantidad), 0) THEN '✓ CORRECTO'
    ELSE CONCAT('⚠️ DIFERENCIA: capacidad_actual=', a.capacidad_actual, ', suma_inventario=', COALESCE(SUM(ia.cantidad), 0))
  END as estado
FROM almacenes a
LEFT JOIN inventario_almacenes ia ON a.id = ia.almacen_id
WHERE a.nombre = 'SILO HUM 3 APSA'
GROUP BY a.id, a.nombre, a.capacidad_total, a.capacidad_actual;

-- Ver recepciones procesadas para este almacén
SELECT 
  'RECEPCIONES EN SILO HUM 3 APSA' as seccion,
  r.boleta,
  r.estatus,
  p.nombre as producto,
  r.peso_neto,
  COALESCE(ia.cantidad, 0) as cantidad_inventario
FROM recepciones r
LEFT JOIN productos p ON r.producto_id = p.id
LEFT JOIN inventario_almacenes ia 
  ON r.producto_id = ia.producto_id 
  AND r.almacen_id = ia.almacen_id
WHERE r.almacen_id = (SELECT id FROM almacenes WHERE nombre = 'SILO HUM 3 APSA')
  AND r.estatus = 'Completado'
ORDER BY r.created_at DESC;

