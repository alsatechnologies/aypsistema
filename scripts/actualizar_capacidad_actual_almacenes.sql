-- ============================================
-- ACTUALIZAR CAPACIDAD_ACTUAL DE TODOS LOS ALMACENES
-- ============================================
-- Este script actualiza el campo capacidad_actual de la tabla almacenes
-- basándose en la suma de todas las cantidades en inventario_almacenes
-- ============================================

DO $$
DECLARE
  v_almacen RECORD;
  v_suma_cantidad NUMERIC;
  v_contador INTEGER := 0;
BEGIN
  RAISE NOTICE 'Iniciando actualización de capacidad_actual para todos los almacenes...';

  -- Iterar sobre todos los almacenes
  FOR v_almacen IN 
    SELECT id, nombre
    FROM almacenes
    ORDER BY id
  LOOP
    -- Calcular la suma de todas las cantidades de inventario_almacenes para este almacén
    SELECT COALESCE(SUM(cantidad), 0)
    INTO v_suma_cantidad
    FROM inventario_almacenes
    WHERE almacen_id = v_almacen.id;
    
    -- Actualizar capacidad_actual del almacén
    UPDATE almacenes
    SET capacidad_actual = v_suma_cantidad,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_almacen.id;
    
    v_contador := v_contador + 1;
    RAISE NOTICE 'Actualizado almacén % (ID: %): capacidad_actual = %', 
      v_almacen.nombre, v_almacen.id, v_suma_cantidad;
  END LOOP;
  
  RAISE NOTICE 'Proceso completado. Total de almacenes actualizados: %', v_contador;
  
END $$;

-- Verificar los resultados
SELECT 
  'RESULTADO' as seccion,
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
GROUP BY a.id, a.nombre, a.capacidad_total, a.capacidad_actual
ORDER BY a.id;

