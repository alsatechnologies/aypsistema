-- ============================================
-- MIGRACIÓN 037: CONSECUTIVO DE LOTE SOLO POR TIPO + PRODUCTO
-- ============================================
-- Fecha: 2026-10-21
-- Problema:
--   consecutivos_lotes tiene UNIQUE(tipo_operacion_codigo, producto_codigo)
--   (migración 015), pero el RPC buscaba el counter por la combinación
--   completa (tipo + origen + producto + almacén + año). Cuando un embarque
--   salía de un almacén distinto al guardado en el counter:
--     búsqueda no encuentra → INSERT → unique_violation → búsqueda no
--     encuentra → RAISE EXCEPTION
--   La boleta quedaba Completada SIN lote. Casos reales:
--     - Aceite prensa (03) desde TQ 210 ("18"): counter en 63 con almacén
--       "13"; lotes 064–072 se pusieron a mano.
--     - Aceite solvente (02) EX-: counter EX- en 12; lotes 013–019 a mano.
--     - Mochote (29) desde bodega pasta ("36"), productos sin código ("41"),
--       garbanzo, etc.
--   Además, los lotes puestos a mano no avanzaban el counter, así que el
--   siguiente intento chocaba con el chequeo de duplicado.
--
-- Regla de negocio (confirmada):
--   - Un consecutivo por tipo de operación + producto.
--   - NL- y EX- comparten el mismo consecutivo (NL- es el tipo canónico).
--   - El almacén, el origen y el año NO afectan el consecutivo.
--   - El consecutivo NO se reinicia con el año.
--
-- Solución:
--   1. Unificar counters EX- en NL- y sincronizar con el MAX real.
--   2. RPC: buscar solo por (tipo canónico, producto) y devolver
--      GREATEST(counter, MAX real en embarques/recepciones) + 1, para que se
--      corrija sola aunque se capturen lotes a mano.
-- ============================================

BEGIN;

-- -----------------------------------------------
-- Helper: MAX consecutivo real ya usado para (tipo canónico, producto)
-- Formato del lote: <TIPO><origen 2><producto 2><almacén 2><año 2>-<consecutivo>
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION max_consecutivo_lote_real(
  p_tipo_canonico VARCHAR(10),
  p_producto_codigo VARCHAR(10)
) RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_regex TEXT;
  v_max   INTEGER;
BEGIN
  v_regex := CASE WHEN p_tipo_canonico = 'NL-' THEN '^(?:NL|EX)-' ELSE '^' || p_tipo_canonico END
             || '\d{2}' || p_producto_codigo || '\d{4}-(\d+)$';

  SELECT COALESCE(MAX((regexp_match(s.codigo_lote, v_regex))[1]::INTEGER), 0)
  INTO v_max
  FROM (
    SELECT codigo_lote FROM embarques   WHERE codigo_lote ~ v_regex
    UNION ALL
    SELECT codigo_lote FROM recepciones WHERE codigo_lote ~ v_regex
  ) s;

  RETURN v_max;
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------
-- PASO 1: Unificar counters EX- en NL-
-- -----------------------------------------------

-- Si ya existe NL- para el producto: conservar el mayor y borrar el EX-
UPDATE consecutivos_lotes nl
SET consecutivo = GREATEST(nl.consecutivo, ex.consecutivo)
FROM consecutivos_lotes ex
WHERE nl.tipo_operacion_codigo = 'NL-'
  AND ex.tipo_operacion_codigo = 'EX-'
  AND nl.producto_codigo = ex.producto_codigo;

DELETE FROM consecutivos_lotes ex
USING consecutivos_lotes nl
WHERE ex.tipo_operacion_codigo = 'EX-'
  AND nl.tipo_operacion_codigo = 'NL-'
  AND nl.producto_codigo = ex.producto_codigo;

-- Si no existe NL-: el EX- pasa a ser el counter NL- del producto
UPDATE consecutivos_lotes
SET tipo_operacion_codigo = 'NL-'
WHERE tipo_operacion_codigo = 'EX-';

-- -----------------------------------------------
-- PASO 2: Sincronizar todos los counters con el MAX real
-- -----------------------------------------------
UPDATE consecutivos_lotes cl
SET consecutivo = max_consecutivo_lote_real(cl.tipo_operacion_codigo, cl.producto_codigo)
WHERE cl.consecutivo < max_consecutivo_lote_real(cl.tipo_operacion_codigo, cl.producto_codigo);

-- -----------------------------------------------
-- PASO 3: Reescribir el RPC
-- -----------------------------------------------
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
  v_tipo   VARCHAR(10);
  v_max    INTEGER;
BEGIN
  -- NL- y EX- comparten counter; NL- es el tipo canónico
  v_tipo := CASE WHEN p_tipo_operacion_codigo = 'EX-' THEN 'NL-' ELSE p_tipo_operacion_codigo END;

  -- 1. Bloquear el counter del (tipo, producto); crearlo si no existe
  SELECT * INTO v_record
  FROM consecutivos_lotes cl
  WHERE cl.tipo_operacion_codigo = v_tipo
    AND cl.producto_codigo       = p_producto_codigo
  ORDER BY cl.consecutivo DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    BEGIN
      INSERT INTO consecutivos_lotes (
        tipo_operacion_codigo, origen_codigo, producto_codigo,
        almacen_codigo, anio_codigo, anio, consecutivo
      ) VALUES (
        v_tipo, p_origen_codigo, p_producto_codigo,
        p_almacen_codigo, p_anio_codigo, p_anio, 0
      )
      RETURNING consecutivos_lotes.* INTO v_record;
    EXCEPTION WHEN unique_violation THEN
      -- Otro proceso lo creó al mismo tiempo: tomarlo
      SELECT * INTO v_record
      FROM consecutivos_lotes cl
      WHERE cl.tipo_operacion_codigo = v_tipo
        AND cl.producto_codigo       = p_producto_codigo
      LIMIT 1
      FOR UPDATE;
    END;
  END IF;

  -- 2. Siguiente = mayor entre counter y lotes reales (incluye capturas manuales) + 1
  v_max := max_consecutivo_lote_real(v_tipo, p_producto_codigo);

  UPDATE consecutivos_lotes cl
  SET consecutivo = GREATEST(cl.consecutivo, v_max) + 1
  WHERE cl.id = v_record.id
  RETURNING cl.* INTO v_record;

  RETURN QUERY SELECT
    v_record.id,
    v_record.consecutivo,
    v_record.tipo_operacion_codigo,
    v_record.origen_codigo,
    v_record.producto_codigo,
    v_record.almacen_codigo,
    v_record.anio_codigo,
    v_record.anio;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION incrementar_o_crear_consecutivo_lote IS
  'Consecutivo de lote por tipo de operación + producto (NL-/EX- comparten counter).
   Almacén, origen y año no afectan el consecutivo y no se reinicia por año.
   Devuelve GREATEST(counter, MAX real en embarques/recepciones) + 1.';

COMMIT;
