-- Agregar peso_neto a cargas_exportacion
-- Almacena el peso base del jumbo cargado; ajuste_kg es la corrección a restar
-- peso_final = peso_neto - ajuste_kg (calculado en la UI)

ALTER TABLE cargas_exportacion
  ADD COLUMN IF NOT EXISTS peso_neto numeric;
