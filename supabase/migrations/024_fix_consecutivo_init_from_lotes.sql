-- ============================================
-- MIGRACIÓN: INICIALIZAR COUNTER DESDE MAX REAL EN TABLA LOTES
-- ============================================
-- Fecha: 2026-06-22
-- Descripción: Cuando la función crea un nuevo registro en consecutivos_lotes porque
--              no existe la combinación exacta, inicia desde MAX(consecutivo) de la
--              tabla lotes en lugar de 0. Esto evita que nuevas combinaciones generen
--              números duplicados con lotes ya existentes.
--
-- PROBLEMA IDENTIFICADO:
-- Las migraciones 020-022 cambiaron la búsqueda a por combinación completa
-- (tipo + origen + producto + almacen + anio). Cuando esa combinación específica
-- no tiene un counter previo, el sistema insertaba uno nuevo iniciando en 0,
-- ignorando que ya podían existir 29+ lotes históricos con esa misma combinación.
-- Resultado: el counter decía "7" aunque ya había 29 lotes → generaba duplicados.
--
-- SOLUCIÓN:
-- Al inicializar un nuevo counter, hacer MAX(consecutivo) en la tabla lotes
-- para esa misma combinación y partir de ahí.
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
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_max_existente INTEGER;
BEGIN
  -- 1. Buscar el counter por combinación completa
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
    -- Counter existe: incrementar atómicamente
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
    -- Counter no existe: inicializar desde MAX(consecutivo) real en la tabla lotes
    SELECT COALESCE(MAX(l.consecutivo), 0) INTO v_max_existente
    FROM lotes l
    WHERE l.tipo_operacion_codigo = p_tipo_operacion_codigo
      AND l.origen_codigo        = p_origen_codigo
      AND l.producto_codigo      = p_producto_codigo
      AND l.almacen_codigo       = p_almacen_codigo
      AND l.anio                 = p_anio;

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
        p_tipo_operacion_codigo,
        p_origen_codigo,
        p_producto_codigo,
        p_almacen_codigo,
        p_anio_codigo,
        p_anio,
        v_max_existente  -- Partir del max real, no de 0
      )
      RETURNING consecutivos_lotes.* INTO v_record;

      -- Incrementar al siguiente disponible
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
      -- Otro proceso creó el registro primero: buscarlo e incrementar
      SELECT * INTO v_record
      FROM consecutivos_lotes
      WHERE consecutivos_lotes.tipo_operacion_codigo = p_tipo_operacion_codigo
        AND consecutivos_lotes.origen_codigo = p_origen_codigo
        AND consecutivos_lotes.producto_codigo = p_producto_codigo
        AND consecutivos_lotes.almacen_codigo = p_almacen_codigo
        AND consecutivos_lotes.anio = p_anio
      FOR UPDATE
      LIMIT 1;

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
        RAISE EXCEPTION 'No se pudo crear ni encontrar el consecutivo de lote';
      END IF;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Sincronizar todos los counters existentes que estén por debajo del max real en lotes
-- Esto corrige counters ya desincronizados sin intervención manual por cada combinación
UPDATE consecutivos_lotes cl
SET consecutivo = sub.max_real
FROM (
  SELECT
    l.tipo_operacion_codigo,
    l.origen_codigo,
    l.producto_codigo,
    l.almacen_codigo,
    l.anio,
    MAX(l.consecutivo) AS max_real
  FROM lotes l
  GROUP BY l.tipo_operacion_codigo, l.origen_codigo, l.producto_codigo, l.almacen_codigo, l.anio
) sub
WHERE cl.tipo_operacion_codigo = sub.tipo_operacion_codigo
  AND cl.origen_codigo        = sub.origen_codigo
  AND cl.producto_codigo      = sub.producto_codigo
  AND cl.almacen_codigo       = sub.almacen_codigo
  AND cl.anio                 = sub.anio
  AND cl.consecutivo          < sub.max_real;

COMMENT ON FUNCTION incrementar_o_crear_consecutivo_lote IS
  'Incrementa o crea un consecutivo de lote de forma atómica. Busca por combinación completa
   (tipo, origen, producto, almacen, anio). Al crear uno nuevo, parte del MAX(consecutivo)
   real en la tabla lotes para evitar huecos por counters desincronizados.
   SECURITY DEFINER para evitar problemas de RLS.';
