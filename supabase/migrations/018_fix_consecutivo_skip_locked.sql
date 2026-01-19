-- ============================================
-- MIGRACIÓN: CORRECCIÓN DE FOR UPDATE SKIP LOCKED
-- ============================================
-- Fecha: 2026-01-19
-- Descripción: Cambiar FOR UPDATE SKIP LOCKED a FOR UPDATE normal
--
-- PROBLEMA IDENTIFICADO:
-- FOR UPDATE SKIP LOCKED puede causar que se salte un registro bloqueado
-- y lea un valor desactualizado o cree un registro duplicado.
-- Esto puede causar que el consecutivo se quede atascado en un valor antiguo.
--
-- SOLUCIÓN:
-- Usar FOR UPDATE normal (sin SKIP LOCKED) para esperar si el registro está bloqueado.
-- Esto garantiza que siempre se lea el valor más reciente.
-- ============================================

-- Actualizar función para usar FOR UPDATE normal en lugar de SKIP LOCKED
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
  -- IMPORTANTE: Usar FOR UPDATE (sin SKIP LOCKED) para esperar si está bloqueado
  -- Esto evita que se salte el registro y lea un valor desactualizado
  SELECT * INTO v_record
  FROM consecutivos_lotes
  WHERE tipo_operacion_codigo = p_tipo_operacion_codigo
    AND producto_codigo = p_producto_codigo
  FOR UPDATE  -- Esperar si está bloqueado, no saltar
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
      FOR UPDATE  -- Esperar si está bloqueado, no saltar
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
   Usa FOR UPDATE (sin SKIP LOCKED) para garantizar que siempre se lea el valor más reciente.';

