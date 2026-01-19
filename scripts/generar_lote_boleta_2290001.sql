-- ============================================
-- GENERAR LOTE: Boleta 2290001
-- ============================================
-- Este script genera el lote para la boleta 2290001
-- El problema es que NO existe consecutivo para NL- + producto código 29
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
  v_consecutivo_id INTEGER;
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
  WHERE boleta = '2290001';
  
  -- Verificar que el embarque existe
  IF v_embarque_id IS NULL THEN
    RAISE EXCEPTION 'Embarque con boleta 2290001 no encontrado';
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
  
  RAISE NOTICE 'Configuración: tipo_operacion=% producto=% almacen=% anio=%', 
    v_tipo_operacion_codigo, v_producto_codigo, v_almacen_codigo, v_anio_codigo;
  
  -- Verificar si existe consecutivo para esta combinación tipo+producto
  SELECT id, consecutivo
  INTO v_consecutivo_data
  FROM consecutivos_lotes
  WHERE tipo_operacion_codigo = v_tipo_operacion_codigo
    AND producto_codigo = v_producto_codigo;
  
  IF NOT FOUND THEN
    -- NO EXISTE CONSECUTIVO: Crear uno nuevo empezando en 0, luego incrementar a 1
    RAISE NOTICE 'No existe consecutivo para NL- + producto %. Creando uno nuevo...', v_producto_codigo;
    
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
      0  -- Empezar en 0, luego incrementar a 1 para el primer lote
    )
    RETURNING id, consecutivo INTO v_consecutivo_id, v_nuevo_consecutivo;
    
    RAISE NOTICE 'Consecutivo creado con ID: %, consecutivo inicial: %', v_consecutivo_id, v_nuevo_consecutivo;
  ELSE
    v_consecutivo_id := v_consecutivo_data.id;
    v_nuevo_consecutivo := v_consecutivo_data.consecutivo;
    RAISE NOTICE 'Consecutivo existente encontrado: ID=%, consecutivo=%', v_consecutivo_id, v_nuevo_consecutivo;
  END IF;
  
  -- Incrementar el consecutivo atómicamente (usando FOR UPDATE para evitar race conditions)
  UPDATE consecutivos_lotes
  SET consecutivo = consecutivo + 1
  WHERE id = v_consecutivo_id
  RETURNING consecutivo INTO v_nuevo_consecutivo;
  
  RAISE NOTICE 'Consecutivo incrementado a: %', v_nuevo_consecutivo;
  
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
  RAISE NOTICE 'Lote generado para boleta %: %', v_boleta, v_codigo_lote;
  RAISE NOTICE 'Consecutivo utilizado: %', v_nuevo_consecutivo;
  
END $$;

-- Verificar el resultado
SELECT 
  'RESULTADO' as seccion,
  e.boleta,
  e.codigo_lote,
  e.estatus,
  p.nombre as producto,
  c.empresa as cliente,
  a.nombre as almacen
FROM embarques e
LEFT JOIN productos p ON e.producto_id = p.id
LEFT JOIN clientes c ON e.cliente_id = c.id
LEFT JOIN almacenes a ON e.almacen_id = a.id
WHERE e.boleta = '2290001';

-- Verificar el consecutivo creado
SELECT 
  'CONSECUTIVO CREADO' as seccion,
  id,
  tipo_operacion_codigo,
  producto_codigo,
  consecutivo
FROM consecutivos_lotes
WHERE tipo_operacion_codigo = 'NL-'
  AND producto_codigo = '29';

