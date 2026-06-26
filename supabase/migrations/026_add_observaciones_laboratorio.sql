-- Agregar campos de observaciones al reporte de laboratorio
ALTER TABLE reportes_laboratorio ADD COLUMN IF NOT EXISTS aceite_observaciones TEXT;
ALTER TABLE reportes_laboratorio ADD COLUMN IF NOT EXISTS observaciones_generales TEXT;
