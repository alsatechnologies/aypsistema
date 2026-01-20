-- ============================================
-- MIGRACIÓN: Agregar columnas sello_entrada_5 y sello_salida_5
-- ============================================
-- Fecha: 2026-01-20
-- Descripción: Agregar columnas para el quinto sello de entrada y salida
-- ============================================

-- Agregar columnas sello_entrada_5 y sello_salida_5 a la tabla embarques
ALTER TABLE embarques
ADD COLUMN IF NOT EXISTS sello_entrada_5 VARCHAR(100),
ADD COLUMN IF NOT EXISTS sello_salida_5 VARCHAR(100);

-- Comentarios para documentación
COMMENT ON COLUMN embarques.sello_entrada_5 IS 'Quinto sello de entrada';
COMMENT ON COLUMN embarques.sello_salida_5 IS 'Quinto sello de salida';
