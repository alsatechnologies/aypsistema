-- ============================================
-- CORREGIR CONSECUTIVO: Pasta Convencional de Cártamo
-- ============================================
-- Este script corrige el consecutivo para NL- (Nacional) + Pasta (código 25)
-- estableciéndolo al valor más alto encontrado en los lotes reales + 1
-- ============================================

DO $$
DECLARE
  v_consecutivo_maximo INTEGER;
  v_consecutivo_actual INTEGER;
  v_consecutivo_id INTEGER;
  v_nuevo_consecutivo INTEGER;
BEGIN
  -- Obtener el consecutivo más alto usado en los lotes reales
  SELECT MAX(CAST(SUBSTRING(codigo_lote FROM '([0-9]{3})$') AS INTEGER))
  INTO v_consecutivo_maximo
  FROM embarques
  WHERE codigo_lote LIKE 'NL-%25%'
    AND codigo_lote IS NOT NULL
    AND codigo_lote ~ '^NL-[0-9]+-([0-9]{3})$';
  
  -- Si no hay lotes, empezar en 0
  IF v_consecutivo_maximo IS NULL THEN
    v_consecutivo_maximo := 0;
  END IF;
  
  -- Obtener el consecutivo actual en la BD
  SELECT id, consecutivo
  INTO v_consecutivo_id, v_consecutivo_actual
  FROM consecutivos_lotes
  WHERE tipo_operacion_codigo = 'NL-'
    AND producto_codigo = '25'
  LIMIT 1;
  
  -- Si no existe registro, crear uno nuevo
  IF v_consecutivo_id IS NULL THEN
    -- Crear nuevo registro con el consecutivo máximo + 1
    INSERT INTO consecutivos_lotes (
      tipo_operacion_codigo,
      origen_codigo,
      producto_codigo,
      almacen_codigo,
      anio_codigo,
      anio,
      consecutivo
    ) VALUES (
      'NL-',
      '01', -- ACEITE Y PROTEINAS SA DE CV
      '25', -- Pasta Convencional de Cártamo
      '26', -- Código por defecto (se actualizará según el almacén)
      RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2),
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      v_consecutivo_maximo + 1
    )
    RETURNING id, consecutivo INTO v_consecutivo_id, v_nuevo_consecutivo;
    
    RAISE NOTICE 'Creado nuevo consecutivo para NL- + 25: %', v_nuevo_consecutivo;
  ELSE
    -- Si existe, actualizar al máximo + 1 (solo si el actual es menor)
    IF v_consecutivo_actual < v_consecutivo_maximo THEN
      v_nuevo_consecutivo := v_consecutivo_maximo + 1;
      
      UPDATE consecutivos_lotes
      SET consecutivo = v_nuevo_consecutivo
      WHERE id = v_consecutivo_id;
      
      RAISE NOTICE 'Actualizado consecutivo para NL- + 25: de % a %', v_consecutivo_actual, v_nuevo_consecutivo;
    ELSE
      v_nuevo_consecutivo := v_consecutivo_actual;
      RAISE NOTICE 'El consecutivo actual (%) ya es correcto o mayor que el máximo usado (%)', v_consecutivo_actual, v_consecutivo_maximo;
    END IF;
  END IF;
  
  RAISE NOTICE 'Proceso completado. Próximo consecutivo será: %', v_nuevo_consecutivo + 1;
  
END $$;

-- Verificar el resultado
SELECT 
  'RESULTADO FINAL' as seccion,
  cl.id,
  cl.tipo_operacion_codigo,
  cl.producto_codigo,
  cl.consecutivo as consecutivo_en_bd,
  COALESCE(MAX(CAST(SUBSTRING(e.codigo_lote FROM '([0-9]{3})$') AS INTEGER)), 0) as consecutivo_maximo_en_lotes,
  CASE 
    WHEN cl.consecutivo >= COALESCE(MAX(CAST(SUBSTRING(e.codigo_lote FROM '([0-9]{3})$') AS INTEGER)), 0)
    THEN '✓ CORRECTO: El consecutivo en BD es mayor o igual al máximo usado'
    ELSE '⚠️ PROBLEMA: El consecutivo en BD es menor que el máximo usado'
  END as estado
FROM consecutivos_lotes cl
LEFT JOIN embarques e ON e.codigo_lote LIKE 'NL-%25%' AND e.codigo_lote IS NOT NULL
WHERE cl.tipo_operacion_codigo = 'NL-'
  AND cl.producto_codigo = '25'
GROUP BY cl.id, cl.tipo_operacion_codigo, cl.producto_codigo, cl.consecutivo;

