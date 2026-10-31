-- ============================================
-- MIGRACIÓN 039: AJUSTES AL MÓDULO DE EXPORTACIONES
-- ============================================
-- Fecha: 2026-10-31
-- Cambios solicitados:
--   1. Quitar las unidades precargadas por la migración 030 (el módulo aún
--      no se usa; la flota real se captura desde la app).
--   1b. Las órdenes usan los clientes del sistema (tabla clientes); se
--      elimina clientes_exportacion y sus clientes precargados.
--   2. Nuevos estatus de unidad: cargado, vacio, cargado_destino, taller,
--      inactivo (antes: activo, en_reparacion, en_transito).
--   3. Nuevo tipo de unidad: camion.
--   4. Órdenes: folio consecutivo OE-0001 (no se reinicia por año) y
--      responsable de carga.
--   5. Cargas: fechas de llegada y salida de destino para calcular días en
--      tránsito y días en destino.
-- ============================================

BEGIN;

-- -----------------------------------------------
-- PASO 1: Quitar unidades precargadas (solo las de la migración 030 y
-- solo si ninguna carga las usa)
-- -----------------------------------------------
DELETE FROM unidades_exportacion u
WHERE u.identificador IN (
  'GAMX-6289','GAMX-6295','GAMX-6445','GAMX-6297','GAMX-6447','GAMX-6453',
  'GAMX-6442','GAMX-6301','GAMX-2683','GAMX-25049','GAMX-25041','GAMX-25042',
  'GAMX-6299','GAMX-3205','GAMX-2680','GAMX-6443','GAMX-6458','GAMX-6307',
  'ECNX-170366','ECNX-170374','ECNX-170388','ECNX-170334','ECNX-170359',
  'ECNX-170370','GAMX-20360','GAMX-20361'
)
AND NOT EXISTS (SELECT 1 FROM cargas_exportacion c WHERE c.unidad_id = u.id);

-- -----------------------------------------------
-- PASO 1b: Órdenes → clientes del sistema; quitar clientes_exportacion
-- -----------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  -- El módulo no se usa todavía: si ya hubiera órdenes, detener y revisar
  IF EXISTS (SELECT 1 FROM ordenes_exportacion) THEN
    RAISE EXCEPTION 'Hay órdenes de exportación capturadas; revisar antes de cambiar sus clientes';
  END IF;

  -- Quitar la(s) llave(s) foránea(s) de cliente_id hacia clientes_exportacion
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid  = 'public.ordenes_exportacion'::regclass
      AND con.confrelid = 'public.clientes_exportacion'::regclass
      AND con.contype   = 'f'
  LOOP
    EXECUTE format('ALTER TABLE public.ordenes_exportacion DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE ordenes_exportacion DROP CONSTRAINT IF EXISTS ordenes_exportacion_cliente_id_fkey;
ALTER TABLE ordenes_exportacion ADD CONSTRAINT ordenes_exportacion_cliente_id_fkey
  FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);

DROP TABLE IF EXISTS clientes_exportacion;

-- -----------------------------------------------
-- PASO 2: Estatus de unidades
-- -----------------------------------------------
UPDATE unidades_exportacion SET estatus = 'vacio'   WHERE estatus = 'activo';
UPDATE unidades_exportacion SET estatus = 'taller'  WHERE estatus = 'en_reparacion';
UPDATE unidades_exportacion SET estatus = 'cargado' WHERE estatus = 'en_transito';

ALTER TABLE unidades_exportacion ALTER COLUMN estatus SET DEFAULT 'vacio';

ALTER TABLE unidades_exportacion DROP CONSTRAINT IF EXISTS unidades_exportacion_estatus_check;
ALTER TABLE unidades_exportacion ADD CONSTRAINT unidades_exportacion_estatus_check
  CHECK (estatus IN ('cargado', 'vacio', 'cargado_destino', 'taller', 'inactivo'));

-- -----------------------------------------------
-- PASO 3: Tipo de unidad (agrega camion)
-- -----------------------------------------------
ALTER TABLE unidades_exportacion DROP CONSTRAINT IF EXISTS unidades_exportacion_tipo_check;
ALTER TABLE unidades_exportacion ADD CONSTRAINT unidades_exportacion_tipo_check
  CHECK (tipo IN ('jumbo', 'tolva', 'contenedor', 'camion'));

-- -----------------------------------------------
-- PASO 4: Órdenes — folio OE-0001 y responsable de carga
-- -----------------------------------------------
CREATE SEQUENCE IF NOT EXISTS ordenes_exportacion_folio_seq;

ALTER TABLE ordenes_exportacion
  ADD COLUMN IF NOT EXISTS folio VARCHAR(20),
  ADD COLUMN IF NOT EXISTS responsable_carga VARCHAR(50);

-- Órdenes existentes (si las hay), en orden de creación
UPDATE ordenes_exportacion o
SET folio = 'OE-' || lpad(nextval('ordenes_exportacion_folio_seq')::text, 4, '0')
FROM (SELECT id FROM ordenes_exportacion WHERE folio IS NULL ORDER BY created_at, id) s
WHERE o.id = s.id;

ALTER TABLE ordenes_exportacion
  ALTER COLUMN folio SET DEFAULT 'OE-' || lpad(nextval('ordenes_exportacion_folio_seq')::text, 4, '0'),
  ALTER COLUMN folio SET NOT NULL;

ALTER TABLE ordenes_exportacion DROP CONSTRAINT IF EXISTS ordenes_exportacion_folio_key;
ALTER TABLE ordenes_exportacion ADD CONSTRAINT ordenes_exportacion_folio_key UNIQUE (folio);

ALTER SEQUENCE ordenes_exportacion_folio_seq OWNED BY ordenes_exportacion.folio;

-- -----------------------------------------------
-- PASO 5: Cargas — fechas de destino
-- -----------------------------------------------
ALTER TABLE cargas_exportacion
  ADD COLUMN IF NOT EXISTS fecha_llegada_destino DATE,
  ADD COLUMN IF NOT EXISTS fecha_salida_destino  DATE;

COMMENT ON COLUMN ordenes_exportacion.folio IS 'Consecutivo OE-0001, generado por la base; no se reinicia por año';
COMMENT ON COLUMN cargas_exportacion.fecha_llegada_destino IS 'Días en tránsito = llegada a destino − fecha de embarque';
COMMENT ON COLUMN cargas_exportacion.fecha_salida_destino  IS 'Días en destino = salida de destino (o hoy) − llegada a destino';

COMMIT;

-- Que la API (PostgREST) vea la nueva relación ordenes_exportacion → clientes
NOTIFY pgrst, 'reload schema';
