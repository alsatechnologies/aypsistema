-- Agregar hora_ingreso a embarques y recepciones
-- Permite registrar una hora personalizada independiente del timestamp de creación.
-- Formato HH:MM (VARCHAR 5) para consistencia con hora_peso_*.

ALTER TABLE embarques ADD COLUMN IF NOT EXISTS hora_ingreso VARCHAR(5);
ALTER TABLE recepciones ADD COLUMN IF NOT EXISTS hora_ingreso VARCHAR(5);
