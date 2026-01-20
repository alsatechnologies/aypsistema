-- ============================================
-- MIGRACIÓN: AGREGAR SECURITY DEFINER A FUNCIÓN RPC
-- ============================================
-- Fecha: 2026-01-20
-- Descripción: La función RPC necesita SECURITY DEFINER para poder crear
--              consecutivos sin problemas de RLS
--
-- PROBLEMA IDENTIFICADO:
-- La tabla consecutivos_lotes tiene RLS que requiere ser Administrador para INSERT.
-- La función RPC ejecuta con los permisos del usuario que la llama, por lo que
-- usuarios no administradores no pueden crear consecutivos.
--
-- SOLUCIÓN:
-- Agregar SECURITY DEFINER a la función para que ejecute con permisos de postgres
-- y pueda crear consecutivos sin problemas de RLS.
-- ============================================

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
) 
SECURITY DEFINER  -- Ejecutar con permisos del propietario (postgres)
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Intentar obtener y bloquear el registro existente
  -- IMPORTANTE: Buscar por TODOS los campos de la constraint única completa
  SELECT * INTO v_record
  FROM consecutivos_lotes
  WHERE consecutivos_lotes.tipo_operacion_codigo = p_tipo_operacion_codigo
    AND consecutivos_lotes.origen_codigo = p_origen_codigo
    AND consecutivos_lotes.producto_codigo = p_producto_codigo
    AND consecutivos_lotes.almacen_codigo = p_almacen_codigo
    AND consecutivos_lotes.anio = p_anio
  FOR UPDATE
  LIMIT 1;

  IF FOUND THEN
    -- Si existe, incrementar atómicamente
    UPDATE consecutivos_lotes
    SET consecutivo = consecutivos_lotes.consecutivo + 1
    WHERE consecutivos_lotes.id = v_record.id
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
      SET consecutivo = consecutivos_lotes.consecutivo + 1
      WHERE consecutivos_lotes.id = v_record.id
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
      -- Otro proceso creó el registro, intentar encontrarlo
      -- Primero buscar por la combinación completa
      SELECT * INTO v_record
      FROM consecutivos_lotes
      WHERE consecutivos_lotes.tipo_operacion_codigo = p_tipo_operacion_codigo
        AND consecutivos_lotes.origen_codigo = p_origen_codigo
        AND consecutivos_lotes.producto_codigo = p_producto_codigo
        AND consecutivos_lotes.almacen_codigo = p_almacen_codigo
        AND consecutivos_lotes.anio = p_anio
      FOR UPDATE
      LIMIT 1;
      
      -- Si no se encuentra por combinación completa, buscar por tipo_producto
      IF NOT FOUND THEN
        SELECT * INTO v_record
        FROM consecutivos_lotes
        WHERE consecutivos_lotes.tipo_operacion_codigo = p_tipo_operacion_codigo
          AND consecutivos_lotes.producto_codigo = p_producto_codigo
        FOR UPDATE
        LIMIT 1;
      END IF;
      
      IF FOUND THEN
        UPDATE consecutivos_lotes
        SET consecutivo = consecutivos_lotes.consecutivo + 1
        WHERE consecutivos_lotes.id = v_record.id
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
        RAISE EXCEPTION 'No se pudo crear ni encontrar el consecutivo después de unique_violation';
      END IF;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON FUNCTION incrementar_o_crear_consecutivo_lote IS 
  'Incrementa o crea un consecutivo de lote de forma atómica, evitando condiciones de carrera. 
   Busca por TODOS los campos de la constraint única completa: tipo_operacion_codigo, 
   origen_codigo, producto_codigo, almacen_codigo, anio. Si no existe, lo crea. Si hay 
   unique_violation, busca primero por combinación completa, luego por tipo_producto. 
   Usa FOR UPDATE (sin SKIP LOCKED) para garantizar que siempre se lea el valor más reciente.
   SECURITY DEFINER permite que la función ejecute con permisos de postgres para evitar
   problemas de RLS al crear nuevos consecutivos.';
