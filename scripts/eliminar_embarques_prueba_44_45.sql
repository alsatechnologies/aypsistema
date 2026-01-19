-- ============================================
-- ELIMINAR EMBARQUES DE PRUEBA: Boletas 2250042 y 2250043
-- ============================================
-- Este script elimina los embarques de prueba que usaron los consecutivos 44 y 45
-- y ajusta el consecutivo de vuelta a 43
-- ============================================

DO $$
DECLARE
  v_embarque_2250042_id INTEGER;
  v_embarque_2250043_id INTEGER;
  v_consecutivo_id INTEGER;
  v_consecutivo_actual INTEGER;
BEGIN
  -- Obtener IDs de los embarques
  SELECT id INTO v_embarque_2250042_id
  FROM embarques
  WHERE boleta = '2250042';
  
  SELECT id INTO v_embarque_2250043_id
  FROM embarques
  WHERE boleta = '2250043';
  
  -- Verificar que existen
  IF v_embarque_2250042_id IS NULL THEN
    RAISE NOTICE 'Embarque 2250042 no encontrado';
  END IF;
  
  IF v_embarque_2250043_id IS NULL THEN
    RAISE NOTICE 'Embarque 2250043 no encontrado';
  END IF;
  
  -- Eliminar movimientos asociados primero (si existen)
  DELETE FROM movimientos
  WHERE boleta IN ('2250042', '2250043');
  
  RAISE NOTICE 'Movimientos eliminados para boletas 2250042 y 2250043';
  
  -- Eliminar los embarques
  IF v_embarque_2250042_id IS NOT NULL THEN
    DELETE FROM embarques
    WHERE id = v_embarque_2250042_id;
    RAISE NOTICE 'Embarque 2250042 eliminado';
  END IF;
  
  IF v_embarque_2250043_id IS NOT NULL THEN
    DELETE FROM embarques
    WHERE id = v_embarque_2250043_id;
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
    UPDATE consecutivos_lotes
    SET consecutivo = GREATEST(0, consecutivo - 2)
    WHERE id = v_consecutivo_id;
    
    RAISE NOTICE 'Consecutivo ajustado de % a %', v_consecutivo_actual, GREATEST(0, consecutivo - 2);
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

