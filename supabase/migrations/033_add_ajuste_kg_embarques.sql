-- Corrección de peso en embarques ferroviarios de jumbo
-- Solo aplica para Ferroviaria; lo captura Oficina/Admin/Sistemas
-- peso_final = peso_neto - ajuste_kg

ALTER TABLE embarques
  ADD COLUMN IF NOT EXISTS ajuste_kg numeric;
