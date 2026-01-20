-- ============================================
-- MIGRACIÓN: CORRECCIÓN DE BÚSQUEDA EN RPC
-- ============================================
-- Fecha: 2026-01-20
-- Descripción: La función RPC debe buscar por TODOS los campos de la constraint única
--              no solo por tipo_operacion_codigo y producto_codigo
--
-- PROBLEMA IDENTIFICADO:
-- La función buscaba solo por tipo_operacion_codigo y producto_codigo, pero la constraint
-- única completa requiere: tipo_operacion_codigo, origen_codigo, producto_codigo, 
-- almacen_codigo, anio. Esto causaba que no encontrara el consecutivo correcto o
-- no lo creara cuando no existía.
--
-- SOLUCIÓN:
-- Buscar por TODOS los campos de la constraint única completa.
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
) AS $$
DECLARE
  v_record RECORD;
  v_consecutivo INTEGER;
BEGIN
  -- Intentar obtener y bloquear el registro existente
  -- IMPORTANTE: Buscar por TODOS los campos de la constraint única completa
  -- (tipo_operacion_codigo, origen_codigo, producto_codigo, almacen_codigo, anio)
  SELECT * INTO v_record
  FROM consecutivos_lotes
  WHERE consecutivos_lotes.tipo_operacion_codigo = p_tipo_operacion_codigo
    AND consecutivos_lotes.origen_codigo = p_origen_codigo
    AND consecutivos_lotes.producto_codigo = p_producto_codigo
    AND consecutivos_lotes.almacen_codigo = p_almacen_codigo
    AND consecutivos_lotes.anio = p_anio
  FOR UPDATE  -- Esperar si está bloqueado, no saltar
  LIMIT 1;

  IF FOUND THEN
    -- Si existe, incrementar atómicamente
    UPDATE consecutivos_lotes
    SET consecutivo = consecutivo + 1
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
      -- Otro proceso creó el registro, leerlo e incrementarlo
      SELECT * INTO v_record
      FROM consecutivos_lotes
      WHERE consecutivos_lotes.tipo_operacion_codigo = p_tipo_operacion_codigo
        AND consecutivos_lotes.origen_codigo = p_origen_codigo
        AND consecutivos_lotes.producto_codigo = p_producto_codigo
        AND consecutivos_lotes.almacen_codigo = p_almacen_codigo
        AND consecutivos_lotes.anio = p_anio
      FOR UPDATE  -- Esperar si está bloqueado, no saltar
      LIMIT 1;
      
      IF FOUND THEN
        UPDATE consecutivos_lotes
        SET consecutivo = consecutivo + 1
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
        RAISE EXCEPTION 'No se pudo crear ni encontrar el consecutivo';
      END IF;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON FUNCTION incrementar_o_crear_consecutivo_lote IS 
  'Incrementa o crea un consecutivo de lote de forma atómica, evitando condiciones de carrera. 
   Busca por TODOS los campos de la constraint única completa: tipo_operacion_codigo, 
   origen_codigo, producto_codigo, almacen_codigo, anio. Usa FOR UPDATE (sin SKIP LOCKED) 
   para garantizar que siempre se lea el valor más reciente.';
