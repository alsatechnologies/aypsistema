-- ============================================
-- CORREGIR INVENTARIO: Todas las recepciones completadas sin inventario
-- ============================================
-- Este script actualiza el inventario para todas las recepciones completadas
-- que no tienen su inventario actualizado
-- ============================================

DO $$
DECLARE
  v_recepcion RECORD;
  v_inventario_existente RECORD;
  v_nueva_cantidad NUMERIC;
  v_contador INTEGER := 0;
BEGIN
  -- Iterar sobre todas las recepciones completadas
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
      AND producto_id IS NOT NULL
      AND almacen_id IS NOT NULL
      AND peso_neto IS NOT NULL
      AND peso_neto > 0
    ORDER BY created_at
  LOOP
    -- Verificar si ya existe inventario para este producto y almacén
    SELECT * INTO v_inventario_existente
    FROM inventario_almacenes
    WHERE producto_id = v_recepcion.producto_id
      AND almacen_id = v_recepcion.almacen_id;
    
    IF FOUND THEN
      -- Si existe, verificar si necesita actualizarse
      -- Verificar si esta recepción ya está reflejada en el inventario
      -- Si el inventario es menor que el peso_neto, significa que no se actualizó
      -- O si el inventario es 0 y hay peso_neto, definitivamente falta actualizar
      IF v_inventario_existente.cantidad = 0 AND v_recepcion.peso_neto > 0 THEN
        -- El inventario está en 0 pero hay peso_neto, actualizar
        v_nueva_cantidad := v_recepcion.peso_neto;
        
        UPDATE inventario_almacenes
        SET cantidad = v_nueva_cantidad,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_inventario_existente.id;
        
        v_contador := v_contador + 1;
        RAISE NOTICE 'Actualizado inventario para boleta %: Cantidad anterior: 0, Peso neto agregado: %, Nueva cantidad: %', 
          v_recepcion.boleta, v_recepcion.peso_neto, v_nueva_cantidad;
      ELSIF v_inventario_existente.cantidad < v_recepcion.peso_neto THEN
        -- El inventario es menor que el peso_neto, sumar la diferencia
        v_nueva_cantidad := v_inventario_existente.cantidad + (v_recepcion.peso_neto - v_inventario_existente.cantidad);
        
        UPDATE inventario_almacenes
        SET cantidad = v_nueva_cantidad,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_inventario_existente.id;
        
        v_contador := v_contador + 1;
        RAISE NOTICE 'Actualizado inventario para boleta %: Cantidad anterior: %, Diferencia agregada: %, Nueva cantidad: %', 
          v_recepcion.boleta, v_inventario_existente.cantidad, (v_recepcion.peso_neto - v_inventario_existente.cantidad), v_nueva_cantidad;
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
        v_recepcion.almacen_id,
        v_recepcion.producto_id,
        v_recepcion.peso_neto,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      );
      
      v_contador := v_contador + 1;
      RAISE NOTICE 'Creado inventario para boleta %: Producto ID: %, Almacén ID: %, Cantidad: %', 
        v_recepcion.boleta, v_recepcion.producto_id, v_recepcion.almacen_id, v_recepcion.peso_neto;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Proceso completado. Total de recepciones procesadas: %', v_contador;
  
END $$;

-- Verificar recepciones que deberían tener inventario pero no lo tienen
SELECT 
  'RECEPCIONES SIN INVENTARIO' as seccion,
  r.boleta,
  r.estatus,
  r.peso_neto,
  p.nombre as producto,
  a.nombre as almacen,
  CASE 
    WHEN ia.id IS NULL THEN '❌ NO TIENE INVENTARIO'
    WHEN ia.cantidad < r.peso_neto THEN CONCAT('⚠️ INVENTARIO INSUFICIENTE: ', ia.cantidad, ' < ', r.peso_neto)
    ELSE '✓ OK'
  END as estado
FROM recepciones r
LEFT JOIN productos p ON r.producto_id = p.id
LEFT JOIN almacenes a ON r.almacen_id = a.id
LEFT JOIN inventario_almacenes ia 
  ON r.producto_id = ia.producto_id 
  AND r.almacen_id = ia.almacen_id
WHERE r.estatus = 'Completado'
  AND r.producto_id IS NOT NULL
  AND r.almacen_id IS NOT NULL
  AND r.peso_neto > 0
  AND (ia.id IS NULL OR ia.cantidad < r.peso_neto)
ORDER BY r.created_at DESC
LIMIT 20;

