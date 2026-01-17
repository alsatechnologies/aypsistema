-- ============================================
-- GENERAR LOTE MANUALMENTE PARA BOLETA 1110001 (RECEPCIÓN)
-- ============================================
-- Este script genera el lote para la boleta 1110001
-- usando la misma lógica que el código TypeScript
-- ============================================

DO $$
DECLARE
  v_recepcion_id INTEGER;
  v_boleta VARCHAR;
  v_estatus VARCHAR;
  v_proveedor_id INTEGER;
  v_producto_id INTEGER;
  v_almacen_id INTEGER;
  v_anio INTEGER;
  
  -- Códigos para generar el lote
  v_tipo_operacion_codigo VARCHAR(10);
  v_origen_codigo VARCHAR(10);
  v_producto_codigo VARCHAR(10);
  v_almacen_codigo VARCHAR(10);
  v_anio_codigo VARCHAR(10);
  
  -- Datos del consecutivo
  v_consecutivo_data RECORD;
  v_nuevo_consecutivo INTEGER;
  v_codigo_lote VARCHAR;
  v_consecutivo_existe BOOLEAN;
BEGIN
  -- Obtener datos de la recepción
  SELECT 
    id,
    boleta,
    estatus,
    proveedor_id,
    producto_id,
    almacen_id,
    EXTRACT(YEAR FROM COALESCE(created_at, CURRENT_DATE))::INTEGER
  INTO 
    v_recepcion_id,
    v_boleta,
    v_estatus,
    v_proveedor_id,
    v_producto_id,
    v_almacen_id,
    v_anio
  FROM recepciones
  WHERE boleta = '1110001';
  
  -- Verificar que la recepción existe
  IF v_recepcion_id IS NULL THEN
    RAISE EXCEPTION 'Recepción con boleta 1110001 no encontrada';
  END IF;
  
  -- Verificar que no tenga lote ya asignado
  IF EXISTS (SELECT 1 FROM recepciones WHERE boleta = '1110001' AND codigo_lote IS NOT NULL AND codigo_lote != '') THEN
    RAISE EXCEPTION 'La recepción ya tiene un lote asignado: %', (SELECT codigo_lote FROM recepciones WHERE boleta = '1110001');
  END IF;
  
  -- Verificar condiciones
  IF v_estatus != 'Completado' THEN
    RAISE EXCEPTION 'La recepción no está completada (estatus actual: %)', v_estatus;
  END IF;
  
  IF v_proveedor_id IS NULL THEN
    RAISE EXCEPTION 'La recepción no tiene proveedor_id asignado';
  END IF;
  
  IF v_producto_id IS NULL THEN
    RAISE EXCEPTION 'La recepción no tiene producto_id asignado';
  END IF;
  
  IF v_almacen_id IS NULL THEN
    RAISE EXCEPTION 'La recepción no tiene almacen_id asignado';
  END IF;
  
  -- Para Reciba, el tipo de operación es siempre 'AC-'
  v_tipo_operacion_codigo := 'AC-';
  
  -- Obtener código de origen (proveedor)
  -- Para Reciba, el origen es el proveedor
  SELECT COALESCE(ol.codigo, '00')
  INTO v_origen_codigo
  FROM proveedores p
  LEFT JOIN origenes_lote ol ON ol.proveedor_id = p.id AND ol.activo = true
  WHERE p.id = v_proveedor_id;
  
  IF v_origen_codigo IS NULL THEN
    v_origen_codigo := '00'; -- Otros por defecto
  END IF;
  
  -- Obtener código de producto
  SELECT COALESCE(codigo_lote, '41')
  INTO v_producto_codigo
  FROM productos
  WHERE id = v_producto_id;
  
  IF v_producto_codigo IS NULL THEN
    v_producto_codigo := '41'; -- Otros por defecto
  END IF;
  
  -- Obtener código de almacén
  SELECT COALESCE(codigo_lote, LPAD(v_almacen_id::TEXT, 2, '0'))
  INTO v_almacen_codigo
  FROM almacenes
  WHERE id = v_almacen_id;
  
  IF v_almacen_codigo IS NULL THEN
    v_almacen_codigo := LPAD(v_almacen_id::TEXT, 2, '0');
  END IF;
  
  -- Obtener año código (últimos 2 dígitos)
  v_anio_codigo := RIGHT(v_anio::TEXT, 2);
  
  -- Generar o incrementar consecutivo directamente
  v_consecutivo_existe := FALSE;
  
  BEGIN
    SELECT * INTO STRICT v_consecutivo_data
    FROM consecutivos_lotes
    WHERE tipo_operacion_codigo = v_tipo_operacion_codigo
      AND producto_codigo = v_producto_codigo
    FOR UPDATE;
    
    v_consecutivo_existe := TRUE;
  EXCEPTION WHEN NO_DATA_FOUND THEN
    v_consecutivo_existe := FALSE;
  END;
  
  IF v_consecutivo_existe THEN
    -- Si existe, incrementar
    UPDATE consecutivos_lotes
    SET consecutivo = consecutivo + 1
    WHERE id = v_consecutivo_data.id
    RETURNING * INTO v_consecutivo_data;
    
    v_nuevo_consecutivo := v_consecutivo_data.consecutivo;
  ELSE
    -- Si no existe, crear uno nuevo iniciando en 0
    BEGIN
      INSERT INTO consecutivos_lotes (
        tipo_operacion_codigo,
        origen_codigo,
        producto_codigo,
        almacen_codigo,
        anio_codigo,
        anio,
        consecutivo
      ) VALUES (
        v_tipo_operacion_codigo,
        v_origen_codigo,
        v_producto_codigo,
        v_almacen_codigo,
        v_anio_codigo,
        v_anio,
        0
      )
      RETURNING * INTO v_consecutivo_data;
      
      -- Incrementar a 1 para el primer lote
      UPDATE consecutivos_lotes
      SET consecutivo = consecutivo + 1
      WHERE id = v_consecutivo_data.id
      RETURNING * INTO v_consecutivo_data;
      
      v_nuevo_consecutivo := v_consecutivo_data.consecutivo;
    EXCEPTION WHEN unique_violation THEN
      -- Otro proceso lo creó, leerlo e incrementarlo
      SELECT * INTO STRICT v_consecutivo_data
      FROM consecutivos_lotes
      WHERE tipo_operacion_codigo = v_tipo_operacion_codigo
        AND producto_codigo = v_producto_codigo
      FOR UPDATE;
      
      UPDATE consecutivos_lotes
      SET consecutivo = consecutivo + 1
      WHERE id = v_consecutivo_data.id
      RETURNING * INTO v_consecutivo_data;
      
      v_nuevo_consecutivo := v_consecutivo_data.consecutivo;
    END;
  END IF;
  
  -- Formatear consecutivo a 3 dígitos
  v_codigo_lote := v_tipo_operacion_codigo || 
                   v_origen_codigo || 
                   v_producto_codigo || 
                   v_almacen_codigo || 
                   v_anio_codigo || 
                   '-' || 
                   LPAD(v_nuevo_consecutivo::TEXT, 3, '0');
  
  -- Actualizar la recepción con el código de lote
  UPDATE recepciones
  SET codigo_lote = v_codigo_lote,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = v_recepcion_id;
  
  -- Mostrar resultado
  RAISE NOTICE 'Lote generado exitosamente para boleta %: %', v_boleta, v_codigo_lote;
  RAISE NOTICE 'Consecutivo utilizado: %', v_nuevo_consecutivo;
  
END $$;

-- Verificar el resultado
SELECT 
  boleta,
  codigo_lote,
  estatus,
  proveedor_id,
  producto_id,
  almacen_id
FROM recepciones
WHERE boleta = '1110001';

