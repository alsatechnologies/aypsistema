-- ============================================
-- ELIMINAR EMBARQUES DE PRUEBA: Boletas 2250042 y 2250043
-- ============================================
-- Este script elimina los embarques de prueba que usaron los consecutivos 44 y 45
-- y ajusta el consecutivo de vuelta a 43
-- ============================================

DO $$
DECLARE
  v_embarque_2250042 RECORD;
  v_embarque_2250043 RECORD;
  v_consecutivo_id INTEGER;
  v_consecutivo_actual INTEGER;
  v_consecutivo_nuevo INTEGER;
BEGIN
  -- Obtener datos completos de los embarques (incluyendo peso_neto para revertir inventario)
  SELECT * INTO v_embarque_2250042
  FROM embarques
  WHERE boleta = '2250042';
  
  SELECT * INTO v_embarque_2250043
  FROM embarques
  WHERE boleta = '2250043';
  
  -- Verificar que existen
  IF v_embarque_2250042.id IS NULL THEN
    RAISE NOTICE 'Embarque 2250042 no encontrado';
  END IF;
  
  IF v_embarque_2250043.id IS NULL THEN
    RAISE NOTICE 'Embarque 2250043 no encontrado';
  END IF;
  
  -- REVERTIR INVENTARIO: Si los embarques estaban completados, sumar de vuelta el peso_neto
  IF v_embarque_2250042.id IS NOT NULL AND v_embarque_2250042.estatus = 'Completado' 
     AND v_embarque_2250042.peso_neto IS NOT NULL AND v_embarque_2250042.peso_neto > 0
     AND v_embarque_2250042.producto_id IS NOT NULL AND v_embarque_2250042.almacen_id IS NOT NULL THEN
    
    -- Sumar de vuelta al inventario
    UPDATE inventario_almacenes
    SET cantidad = cantidad + v_embarque_2250042.peso_neto
    WHERE producto_id = v_embarque_2250042.producto_id
      AND almacen_id = v_embarque_2250042.almacen_id;
    
    -- Actualizar capacidad_actual del almacén
    UPDATE almacenes
    SET capacidad_actual = (
      SELECT COALESCE(SUM(cantidad), 0)
      FROM inventario_almacenes
      WHERE almacen_id = v_embarque_2250042.almacen_id
    )
    WHERE id = v_embarque_2250042.almacen_id;
    
    RAISE NOTICE 'Inventario revertido para boleta 2250042: +% kg', v_embarque_2250042.peso_neto;
  END IF;
  
  IF v_embarque_2250043.id IS NOT NULL AND v_embarque_2250043.estatus = 'Completado'
     AND v_embarque_2250043.peso_neto IS NOT NULL AND v_embarque_2250043.peso_neto > 0
     AND v_embarque_2250043.producto_id IS NOT NULL AND v_embarque_2250043.almacen_id IS NOT NULL THEN
    
    -- Sumar de vuelta al inventario
    UPDATE inventario_almacenes
    SET cantidad = cantidad + v_embarque_2250043.peso_neto
    WHERE producto_id = v_embarque_2250043.producto_id
      AND almacen_id = v_embarque_2250043.almacen_id;
    
    -- Actualizar capacidad_actual del almacén
    UPDATE almacenes
    SET capacidad_actual = (
      SELECT COALESCE(SUM(cantidad), 0)
      FROM inventario_almacenes
      WHERE almacen_id = v_embarque_2250043.almacen_id
    )
    WHERE id = v_embarque_2250043.almacen_id;
    
    RAISE NOTICE 'Inventario revertido para boleta 2250043: +% kg', v_embarque_2250043.peso_neto;
  END IF;
  
  -- Eliminar movimientos asociados primero (si existen)
  DELETE FROM movimientos
  WHERE boleta IN ('2250042', '2250043');
  
  RAISE NOTICE 'Movimientos eliminados para boletas 2250042 y 2250043';
  
  -- Eliminar los embarques
  IF v_embarque_2250042.id IS NOT NULL THEN
    DELETE FROM embarques
    WHERE id = v_embarque_2250042.id;
    RAISE NOTICE 'Embarque 2250042 eliminado';
  END IF;
  
  IF v_embarque_2250043.id IS NOT NULL THEN
    DELETE FROM embarques
    WHERE id = v_embarque_2250043.id;
    RAISE NOTICE 'Embarque 2250043 eliminado';
  END IF;
  
  -- Ajustar el consecutivo de vuelta a 43
  -- (ya que estos dos embarques de prueba usaron 44 y 45)
  SELECT id, consecutivo
  INTO v_consecutivo_id, v_consecutivo_actual
  FROM consecutivos_lotes
  WHERE tipo_operacion_codigo = 'NL-'
    AND producto_codigo = '25';
  
  IF v_consecutivo_id IS NOT NULL THEN
    -- Decrementar el consecutivo en 2 (porque eliminamos 2 embarques)
    v_consecutivo_nuevo := GREATEST(0, v_consecutivo_actual - 2);
    
    UPDATE consecutivos_lotes
    SET consecutivo = v_consecutivo_nuevo
    WHERE id = v_consecutivo_id;
    
    RAISE NOTICE 'Consecutivo ajustado de % a %', v_consecutivo_actual, v_consecutivo_nuevo;
  END IF;
  
  RAISE NOTICE 'Proceso completado';
  
END $$;

-- Verificar que se eliminaron
SELECT 
  'VERIFICACIÓN' as seccion,
  COUNT(*) as embarques_restantes,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ Ambos embarques eliminados correctamente'
    ELSE CONCAT('⚠️ Aún existen ', COUNT(*), ' embarque(s)')
  END as estado
FROM embarques
WHERE boleta IN ('2250042', '2250043');

-- Verificar el consecutivo
SELECT 
  'CONSECUTIVO ACTUAL' as seccion,
  id,
  tipo_operacion_codigo,
  producto_codigo,
  consecutivo
FROM consecutivos_lotes
WHERE tipo_operacion_codigo = 'NL-'
  AND producto_codigo = '25';

