-- ============================================
-- MIGRACIÓN 038: ESTATUS DE GENERACIÓN DE LOTE
-- ============================================
-- Fecha: 2026-10-21
-- Problema:
--   Cuando la generación del lote fallaba, la boleta quedaba Completada sin
--   lote y no quedaba registro de por qué. Tampoco había forma de distinguir
--   lotes generados por el sistema de lotes puestos a mano en Supabase.
--
-- Solución:
--   Columnas en embarques y recepciones:
--     lote_estatus     'Generado' | 'Error' | 'Sin datos' | 'Manual'
--     lote_error       causa del fallo (o qué datos faltan)
--     lote_intento_at  fecha y hora del último intento / cambio
--   La app llena Generado / Error / Sin datos al completar la boleta.
--   Un trigger marca 'Manual' cuando codigo_lote cambia sin que el mismo
--   UPDATE cambie lote_estatus (por ejemplo, una edición directa en Supabase).
-- ============================================

BEGIN;

-- -----------------------------------------------
-- PASO 1: Columnas
-- -----------------------------------------------
ALTER TABLE embarques
  ADD COLUMN IF NOT EXISTS lote_estatus    VARCHAR(20),
  ADD COLUMN IF NOT EXISTS lote_error      TEXT,
  ADD COLUMN IF NOT EXISTS lote_intento_at TIMESTAMPTZ;

ALTER TABLE recepciones
  ADD COLUMN IF NOT EXISTS lote_estatus    VARCHAR(20),
  ADD COLUMN IF NOT EXISTS lote_error      TEXT,
  ADD COLUMN IF NOT EXISTS lote_intento_at TIMESTAMPTZ;

ALTER TABLE embarques DROP CONSTRAINT IF EXISTS embarques_lote_estatus_check;
ALTER TABLE embarques ADD CONSTRAINT embarques_lote_estatus_check
  CHECK (lote_estatus IS NULL OR lote_estatus IN ('Generado', 'Error', 'Sin datos', 'Manual'));

ALTER TABLE recepciones DROP CONSTRAINT IF EXISTS recepciones_lote_estatus_check;
ALTER TABLE recepciones ADD CONSTRAINT recepciones_lote_estatus_check
  CHECK (lote_estatus IS NULL OR lote_estatus IN ('Generado', 'Error', 'Sin datos', 'Manual'));

-- -----------------------------------------------
-- PASO 2: Boletas existentes
-- -----------------------------------------------
-- Con lote: no se puede saber cuáles fueron a mano → 'Generado'
UPDATE embarques   SET lote_estatus = 'Generado' WHERE codigo_lote IS NOT NULL AND lote_estatus IS NULL;
UPDATE recepciones SET lote_estatus = 'Generado' WHERE codigo_lote IS NOT NULL AND lote_estatus IS NULL;

-- Completadas sin lote → 'Error'
UPDATE embarques
SET lote_estatus = 'Error',
    lote_error   = 'Sin registro del intento (anterior a la migración 038)'
WHERE estatus = 'Completado' AND codigo_lote IS NULL AND lote_estatus IS NULL;

UPDATE recepciones
SET lote_estatus = 'Error',
    lote_error   = 'Sin registro del intento (anterior a la migración 038)'
WHERE estatus = 'Completado' AND codigo_lote IS NULL AND lote_estatus IS NULL;

-- -----------------------------------------------
-- PASO 3: Trigger para lotes puestos a mano
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION marcar_lote_manual()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.codigo_lote IS NOT NULL AND NEW.lote_estatus IS NULL THEN
      NEW.lote_estatus    := 'Manual';
      NEW.lote_error      := NULL;
      NEW.lote_intento_at := now();
    END IF;
  ELSIF NEW.codigo_lote IS NOT NULL
    AND NEW.codigo_lote  IS DISTINCT FROM OLD.codigo_lote
    AND NEW.lote_estatus IS NOT DISTINCT FROM OLD.lote_estatus THEN
    -- El lote cambió pero este UPDATE no fijó el estatus: no lo hizo la app
    NEW.lote_estatus    := 'Manual';
    NEW.lote_error      := NULL;
    NEW.lote_intento_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_embarques_lote_manual ON embarques;
CREATE TRIGGER trg_embarques_lote_manual
  BEFORE INSERT OR UPDATE OF codigo_lote ON embarques
  FOR EACH ROW EXECUTE FUNCTION marcar_lote_manual();

DROP TRIGGER IF EXISTS trg_recepciones_lote_manual ON recepciones;
CREATE TRIGGER trg_recepciones_lote_manual
  BEFORE INSERT OR UPDATE OF codigo_lote ON recepciones
  FOR EACH ROW EXECUTE FUNCTION marcar_lote_manual();

COMMENT ON COLUMN embarques.lote_estatus   IS 'Generado | Error | Sin datos | Manual';
COMMENT ON COLUMN embarques.lote_error     IS 'Causa del fallo al generar el lote, o datos faltantes';
COMMENT ON COLUMN recepciones.lote_estatus IS 'Generado | Error | Sin datos | Manual';
COMMENT ON COLUMN recepciones.lote_error   IS 'Causa del fallo al generar el lote, o datos faltantes';

COMMIT;
