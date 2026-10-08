-- Corrección de peso por carga de exportación (jumbos)
-- La usa Exportaciones (CargaExportacion.ajuste_kg) y no se había creado en ninguna migración
-- peso_final = peso_neto - ajuste_kg

ALTER TABLE cargas_exportacion
  ADD COLUMN IF NOT EXISTS ajuste_kg numeric;
