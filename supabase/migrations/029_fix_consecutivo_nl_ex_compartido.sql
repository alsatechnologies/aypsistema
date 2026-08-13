-- ============================================
-- MIGRACIÓN 029: UNIFICAR COUNTER NL- Y EX- POR PRODUCTO
-- ============================================
-- Fecha: 2026-08-13
-- Problema:
--   NL- y EX- del mismo producto deben compartir UN solo consecutivo.
--   El RPC buscaba por tipo_operacion_codigo exacto, generando counters
--   separados para NL- y EX-. Además el counter de EX- (id=68) tenía
--   almacen_codigo="15" mientras que getCodigoAlmacen(almacen_id=15)
--   devuelve "13" → el counter EX- nunca se encontraba en producción.
--
-- Solución:
--   1. Corrección de datos: unificar ambos counters en el NL- (almacen=13)
--      con consecutivo = MAX real de embarques (059 actualmente).
--   2. Eliminar el counter EX- orphan (almacen="15", nunca usado).
--   3. Reescribir RPC para que EX- y NL- usen el mismo counter:
--      - Al buscar, si tipo IN ('NL-','EX-'), busca con tipo='NL-' (canónico).
--      - Al crear un nuevo counter, lo almacena como 'NL-'.
--      - Inicialización desde embarques.codigo_lote en lugar de tabla lotes
--        (que siempre está vacía).
-- ============================================

-- -----------------------------------------------
-- PASO 1: Corrección de datos para producto 03
-- -----------------------------------------------

-- Sincronizar el counter NL- de producto 03 con el MAX real en embarques
UPDATE consecutivos_lotes
SET consecutivo = (
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(e.codigo_lote FROM '.+-(\d+)$')
        AS INTEGER
      )
    ),
    0
  )
  FROM embarques e
  WHERE e.codigo_lote LIKE 'NL-01031326-%'
     OR e.codigo_lote LIKE 'EX-01031326-%'
)
WHERE id = 98;   -- NL- + producto 03 + almacen "13"

-- Eliminar el counter EX- orphan (almacen="15", nunca coincidía con búsquedas reales)
DELETE FROM consecutivos_lotes WHERE id = 68;

-- -----------------------------------------------
-- PASO 2: Reescribir la función RPC
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
  v_record       RECORD;
  v_max_existente INTEGER;
  v_tipo_busqueda VARCHAR(10);
  v_prefijo_nl    VARCHAR(10);
  v_prefijo_ex    VARCHAR(10);
BEGIN
  -- NL- y EX- comparten el mismo counter (NL- es el tipo canónico almacenado).
  -- Cualquier operación EX- consulta y actualiza el counter NL-.
  IF p_tipo_operacion_codigo = 'EX-' THEN
    v_tipo_busqueda := 'NL-';
  ELSE
    v_tipo_busqueda := p_tipo_operacion_codigo;
  END IF;

  -- 1. Buscar el counter por combinación completa (usando tipo canónico)
  SELECT * INTO v_record
  FROM consecutivos_lotes
  WHERE consecutivos_lotes.tipo_operacion_codigo = v_tipo_busqueda
    AND consecutivos_lotes.origen_codigo         = p_origen_codigo
    AND consecutivos_lotes.producto_codigo       = p_producto_codigo
    AND consecutivos_lotes.almacen_codigo        = p_almacen_codigo
    AND consecutivos_lotes.anio                  = p_anio
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
    -- Counter no existe: inicializar desde MAX real en embarques
    -- (la tabla lotes está vacía; los lotes reales viven en embarques.codigo_lote)
    v_prefijo_nl := v_tipo_busqueda || p_origen_codigo || p_producto_codigo || p_almacen_codigo || p_anio_codigo || '-%';
    v_prefijo_ex := 'EX-'           || p_origen_codigo || p_producto_codigo || p_almacen_codigo || p_anio_codigo || '-%';

    SELECT COALESCE(
      MAX(
        CAST(
          SUBSTRING(e.codigo_lote FROM '.+-(\d+)$')
          AS INTEGER
        )
      ),
      0
    ) INTO v_max_existente
    FROM embarques e
    WHERE e.codigo_lote LIKE v_prefijo_nl
       OR e.codigo_lote LIKE v_prefijo_ex;

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
        v_tipo_busqueda,       -- siempre NL- para ventas
        p_origen_codigo,
        p_producto_codigo,
        p_almacen_codigo,
        p_anio_codigo,
        p_anio,
        v_max_existente        -- partir del max real, no de 0
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
      -- Otro proceso insertó el mismo counter justo antes: buscarlo e incrementar
      SELECT * INTO v_record
      FROM consecutivos_lotes
      WHERE consecutivos_lotes.tipo_operacion_codigo = v_tipo_busqueda
        AND consecutivos_lotes.origen_codigo         = p_origen_codigo
        AND consecutivos_lotes.producto_codigo       = p_producto_codigo
        AND consecutivos_lotes.almacen_codigo        = p_almacen_codigo
        AND consecutivos_lotes.anio                  = p_anio
      FOR UPDATE
      LIMIT 1;

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
        RAISE EXCEPTION 'No se pudo crear ni encontrar el consecutivo de lote (tipo=%, producto=%, almacen=%)',
          p_tipo_operacion_codigo, p_producto_codigo, p_almacen_codigo;
      END IF;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------
-- PASO 3: Sincronizar todos los demás counters
-- que puedan estar por debajo del MAX real en embarques
-- (cubre otros productos en caso de que tengan el mismo desfase)
-- -----------------------------------------------
UPDATE consecutivos_lotes cl
SET consecutivo = sub.max_real
FROM (
  SELECT
    -- normalizar EX- → NL- para el join
    CASE WHEN tipo_codigo = 'EX-' THEN 'NL-' ELSE tipo_codigo END AS tipo_busqueda,
    origen_codigo,
    producto_codigo,
    almacen_codigo,
    anio_codigo,
    MAX(max_consecutivo) AS max_real
  FROM (
    SELECT
      SUBSTRING(e.codigo_lote FROM '^([A-Z]+-)')                       AS tipo_codigo,
      SUBSTRING(e.codigo_lote FROM '^[A-Z]+-(\d{2})')                  AS origen_codigo,
      SUBSTRING(e.codigo_lote FROM '^[A-Z]+-\d{2}(\d{2})')            AS producto_codigo,
      SUBSTRING(e.codigo_lote FROM '^[A-Z]+-\d{4}(\d{2})')            AS almacen_codigo,
      SUBSTRING(e.codigo_lote FROM '^[A-Z]+-\d{6}(\d{2})-')           AS anio_codigo,
      CAST(SUBSTRING(e.codigo_lote FROM '.+-(\d+)$') AS INTEGER)       AS max_consecutivo
    FROM embarques e
    WHERE e.codigo_lote IS NOT NULL
      AND e.codigo_lote ~ '^[A-Z]+-\d{8}-\d+$'
  ) parsed
  GROUP BY tipo_busqueda, origen_codigo, producto_codigo, almacen_codigo, anio_codigo
) sub
WHERE cl.tipo_operacion_codigo = sub.tipo_busqueda
  AND cl.origen_codigo         = sub.origen_codigo
  AND cl.producto_codigo       = sub.producto_codigo
  AND cl.almacen_codigo        = sub.almacen_codigo
  AND cl.anio_codigo           = sub.anio_codigo
  AND cl.consecutivo           < sub.max_real;

COMMENT ON FUNCTION incrementar_o_crear_consecutivo_lote IS
  'Incrementa o crea un consecutivo de lote de forma atómica.
   NL- y EX- comparten el mismo counter (NL- es el tipo canónico).
   Al crear uno nuevo, parte del MAX real en embarques.codigo_lote.
   SECURITY DEFINER para evitar problemas de RLS.';
