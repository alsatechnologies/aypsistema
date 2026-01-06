-- ============================================
-- AGREGAR CAMPO FACTOR_KG_CM A ALMACENES
-- ============================================
-- Este campo almacena el factor de conversión de cm a kg para cada tanque
-- Fórmula: Peso (kg) = Aceite (m) × 100 × factor_kg_cm

-- Agregar columna factor_kg_cm
ALTER TABLE almacenes
ADD COLUMN IF NOT EXISTS factor_kg_cm DECIMAL(10,2);

-- Comentario
COMMENT ON COLUMN almacenes.factor_kg_cm IS 'Factor de conversión de centímetros a kilogramos. Fórmula: Peso (kg) = Aceite (m) × 100 × factor_kg_cm';

