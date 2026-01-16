-- ============================================
-- MIGRACIÓN: CORRECCIÓN DE CONDICIÓN DE CARRERA EN CONSECUTIVOS
-- ============================================
-- Fecha: 2026-01-15
-- Descripción: Crear función SQL para incremento atómico de consecutivos
--
-- PROBLEMA IDENTIFICADO:
-- Cuando se guardan dos embarques/recepciones al mismo tiempo con el mismo
-- tipo_operacion_codigo y producto_codigo, ambos pueden leer el mismo consecutivo,
-- ambos lo incrementan, y ambos usan el mismo número, causando duplicados.
--
-- SOLUCIÓN:
-- Crear una función PostgreSQL que incremente el consecutivo atómicamente
-- usando UPDATE ... RETURNING, evitando condiciones de carrera.
-- ============================================

-- Función para incrementar consecutivo de forma atómica
CREATE OR REPLACE FUNCTION incrementar_consecutivo_lote(
  p_tipo_operacion_codigo VARCHAR(10),
  p_producto_codigo VARCHAR(10)
) RETURNS TABLE(
  id INTEGER,
  consecutivo INTEGER,
  tipo_operacion_codigo VARCHAR(10),
  origen_codigo VARCHAR(10),
  producto_codigo VARCHAR(10),
  almacen_codigo VARCHAR(10),
  anio_codigo VARCHAR(10),
  anio INTEGER
) AS $$
DECLARE
  v_consecutivo INTEGER;
  v_record RECORD;
BEGIN
  -- Intentar obtener y actualizar el consecutivo en una sola operación atómica
  -- Usar SELECT FOR UPDATE para bloquear el registro durante la actualización
  SELECT id, consecutivo, origen_codigo, almacen_codigo, anio_codigo, anio
  INTO v_record
  FROM consecutivos_lotes
  WHERE tipo_operacion_codigo = p_tipo_operacion_codigo
    AND producto_codigo = p_producto_codigo
  FOR UPDATE SKIP LOCKED  -- Si está bloqueado, saltar y crear nuevo si no existe
  LIMIT 1;

  IF FOUND THEN
    -- Si existe, incrementar y retornar
    UPDATE consecutivos_lotes
    SET consecutivo = consecutivo + 1
    WHERE id = v_record.id
    RETURNING consecutivos_lotes.* INTO v_record;
    
    RETURN QUERY SELECT 
      v_record.id,
      v_record.consecutivo,
      v_record.tipo_operacion_codigo,
      v_record.origen_codigo,
      v_record.producto_codigo,
      v_record.almacen_codigo,
      v_record.anio_codigo,
      v_record.anio;
  ELSE
    -- Si no existe, crear uno nuevo con consecutivo 1
    -- Nota: Necesitamos obtener origen_codigo y almacen_codigo de algún lado
    -- Por ahora, usaremos valores por defecto o los pasaremos como parámetros
    -- Esto requerirá modificar la función para aceptar más parámetros
    RAISE EXCEPTION 'Consecutivo no encontrado. Use la función con parámetros completos para crear uno nuevo.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Función mejorada que puede crear el consecutivo si no existe
CREATE OR REPLACE FUNCTION incrementar_o_crear_consecutivo_lote(
  p_tipo_operacion_codigo VARCHAR(10),
  p_origen_codigo VARCHAR(10),
  p_producto_codigo VARCHAR(10),
  p_almacen_codigo VARCHAR(10),
  p_anio_codigo VARCHAR(10),
  p_anio INTEGER
) RETURNS TABLE(
  id INTEGER,
  consecutivo INTEGER,
  tipo_operacion_codigo VARCHAR(10),
  origen_codigo VARCHAR(10),
  producto_codigo VARCHAR(10),
  almacen_codigo VARCHAR(10),
  anio_codigo VARCHAR(10),
  anio INTEGER
) AS $$
DECLARE
  v_record RECORD;
  v_consecutivo INTEGER;
BEGIN
  -- Intentar obtener y bloquear el registro existente
  SELECT * INTO v_record
  FROM consecutivos_lotes
  WHERE tipo_operacion_codigo = p_tipo_operacion_codigo
    AND producto_codigo = p_producto_codigo
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF FOUND THEN
    -- Si existe, incrementar atómicamente
    UPDATE consecutivos_lotes
    SET consecutivo = consecutivo + 1
    WHERE id = v_record.id
    RETURNING consecutivos_lotes.* INTO v_record;
    
    RETURN QUERY SELECT 
      v_record.id,
      v_record.consecutivo,
      v_record.tipo_operacion_codigo,
      v_record.origen_codigo,
      v_record.producto_codigo,
      v_record.almacen_codigo,
      v_record.anio_codigo,
      v_record.anio;
  ELSE
    -- Si no existe, intentar crear uno nuevo
    -- Si falla por duplicado, otro proceso lo creó primero, intentar leerlo
    BEGIN
      -- Crear nuevo consecutivo iniciando en 0, luego incrementarlo a 1 para el primer lote
      INSERT INTO consecutivos_lotes (
        tipo_operacion_codigo,
        origen_codigo,
        producto_codigo,
        almacen_codigo,
        anio_codigo,
        anio,
        consecutivo
      ) VALUES (
        p_tipo_operacion_codigo,
        p_origen_codigo,
        p_producto_codigo,
        p_almacen_codigo,
        p_anio_codigo,
        p_anio,
        0
      )
      RETURNING consecutivos_lotes.* INTO v_record;
      
      -- Incrementar a 1 para el primer lote
      UPDATE consecutivos_lotes
      SET consecutivo = consecutivo + 1
      WHERE id = v_record.id
      RETURNING consecutivos_lotes.* INTO v_record;
      
      RETURN QUERY SELECT 
        v_record.id,
        v_record.consecutivo,
        v_record.tipo_operacion_codigo,
        v_record.origen_codigo,
        v_record.producto_codigo,
        v_record.almacen_codigo,
        v_record.anio_codigo,
        v_record.anio;
    EXCEPTION WHEN unique_violation THEN
      -- Otro proceso creó el registro, leerlo e incrementarlo
      SELECT * INTO v_record
      FROM consecutivos_lotes
      WHERE tipo_operacion_codigo = p_tipo_operacion_codigo
        AND producto_codigo = p_producto_codigo
      FOR UPDATE SKIP LOCKED
      LIMIT 1;
      
      IF FOUND THEN
        UPDATE consecutivos_lotes
        SET consecutivo = consecutivo + 1
        WHERE id = v_record.id
        RETURNING consecutivos_lotes.* INTO v_record;
        
        RETURN QUERY SELECT 
          v_record.id,
          v_record.consecutivo,
          v_record.tipo_operacion_codigo,
          v_record.origen_codigo,
          v_record.producto_codigo,
          v_record.almacen_codigo,
          v_record.anio_codigo,
          v_record.anio;
      ELSE
        RAISE EXCEPTION 'No se pudo crear ni encontrar el consecutivo';
      END IF;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON FUNCTION incrementar_o_crear_consecutivo_lote IS 
  'Incrementa o crea un consecutivo de lote de forma atómica, evitando condiciones de carrera. 
   Usa SELECT FOR UPDATE SKIP LOCKED para garantizar que solo un proceso puede incrementar el consecutivo a la vez.';

