-- ============================================
-- CORREGIR LOTE: Boleta 2250042
-- ============================================
-- Este script regenera el lote para la boleta 2250042
-- usando el consecutivo correcto (44)
-- ============================================

DO $$
DECLARE
  v_embarque_id INTEGER;
  v_boleta VARCHAR;
  v_tipo_embarque VARCHAR;
  v_cliente_id INTEGER;
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
BEGIN
  -- Obtener datos del embarque
  SELECT 
    id,
    boleta,
    tipo_embarque,
    cliente_id,
    producto_id,
    almacen_id,
    EXTRACT(YEAR FROM COALESCE(created_at, CURRENT_DATE))::INTEGER
  INTO 
    v_embarque_id,
    v_boleta,
    v_tipo_embarque,
    v_cliente_id,
    v_producto_id,
    v_almacen_id,
    v_anio
  FROM embarques
  WHERE boleta = '2250042';
  
  -- Verificar que el embarque existe
  IF v_embarque_id IS NULL THEN
    RAISE EXCEPTION 'Embarque con boleta 2250042 no encontrado';
  END IF;
  
  -- Verificar condiciones
  IF v_tipo_embarque IS NULL THEN
    RAISE EXCEPTION 'El embarque no tiene tipo_embarque asignado';
  END IF;
  
  IF v_cliente_id IS NULL THEN
    RAISE EXCEPTION 'El embarque no tiene cliente_id asignado';
  END IF;
  
  IF v_producto_id IS NULL THEN
    RAISE EXCEPTION 'El embarque no tiene producto_id asignado';
  END IF;
  
  IF v_almacen_id IS NULL THEN
    RAISE EXCEPTION 'El embarque no tiene almacen_id asignado';
  END IF;
  
  -- Determinar tipo de operación
  IF v_tipo_embarque = 'Nacional' THEN
    v_tipo_operacion_codigo := 'NL-';
  ELSIF v_tipo_embarque = 'Exportación' THEN
    v_tipo_operacion_codigo := 'EX-';
  ELSE
    RAISE EXCEPTION 'Tipo de embarque inválido: %', v_tipo_embarque;
  END IF;
  
  -- Para embarques, el origen siempre es '01' (ACEITE Y PROTEINAS SA DE CV)
  v_origen_codigo := '01';
  
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
  
  -- Obtener el consecutivo actual (debería estar en 44)
  -- NO incrementarlo porque este lote debería usar el consecutivo 44
  SELECT id, consecutivo
  INTO v_consecutivo_data
  FROM consecutivos_lotes
  WHERE tipo_operacion_codigo = v_tipo_operacion_codigo
    AND producto_codigo = v_producto_codigo;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró consecutivo para tipo_operacion_codigo=% y producto_codigo=%', v_tipo_operacion_codigo, v_producto_codigo;
  END IF;
  
  -- Usar el consecutivo actual (44) sin incrementarlo
  -- porque este embarque debería haber usado el 44 cuando se creó
  v_nuevo_consecutivo := v_consecutivo_data.consecutivo;
  
  -- Formatear consecutivo a 3 dígitos
  v_codigo_lote := v_tipo_operacion_codigo || 
                   v_origen_codigo || 
                   v_producto_codigo || 
                   v_almacen_codigo || 
                   v_anio_codigo || 
                   '-' || 
                   LPAD(v_nuevo_consecutivo::TEXT, 3, '0');
  
  -- Actualizar el embarque con el nuevo código de lote
  UPDATE embarques
  SET codigo_lote = v_codigo_lote,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = v_embarque_id;
  
  -- Mostrar resultado
  RAISE NOTICE 'Lote corregido para boleta %: %', v_boleta, v_codigo_lote;
  RAISE NOTICE 'Consecutivo utilizado: %', v_nuevo_consecutivo;
  
END $$;

-- Verificar el resultado
SELECT 
  'RESULTADO' as seccion,
  e.boleta,
  e.codigo_lote,
  e.estatus,
  p.nombre as producto,
  c.empresa as cliente
FROM embarques e
LEFT JOIN productos p ON e.producto_id = p.id
LEFT JOIN clientes c ON e.cliente_id = c.id
WHERE e.boleta = '2250042';

