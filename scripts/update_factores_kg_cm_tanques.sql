-- ============================================
-- ACTUALIZAR FACTORES KG/CM DE TANQUES
-- ============================================
-- Actualiza los factores de conversión de cm a kg para cada tanque
-- Fórmula: Peso (kg) = Aceite (m) × 100 × factor_kg_cm

-- TQ 201: 457.08 kg/cm
UPDATE almacenes
SET factor_kg_cm = 457.08,
    updated_at = NOW()
WHERE nombre = 'TQ 201';

-- TQ 202: 452.72 kg/cm
UPDATE almacenes
SET factor_kg_cm = 452.72,
    updated_at = NOW()
WHERE nombre = 'TQ 202';

-- TQ 203: 457.39 kg/cm
UPDATE almacenes
SET factor_kg_cm = 457.39,
    updated_at = NOW()
WHERE nombre = 'TQ 203';

-- TQ 204: 456.84 kg/cm
UPDATE almacenes
SET factor_kg_cm = 456.84,
    updated_at = NOW()
WHERE nombre = 'TQ 204';

-- TQ 205: 1,029.51 kg/cm
UPDATE almacenes
SET factor_kg_cm = 1029.51,
    updated_at = NOW()
WHERE nombre = 'TQ 205';

-- TQ 206: 947.32 kg/cm
UPDATE almacenes
SET factor_kg_cm = 947.32,
    updated_at = NOW()
WHERE nombre = 'TQ 206';

-- TQ 207: 962.85 kg/cm
UPDATE almacenes
SET factor_kg_cm = 962.85,
    updated_at = NOW()
WHERE nombre = 'TQ 207';

-- TQ 208: 161 kg/cm
UPDATE almacenes
SET factor_kg_cm = 161.00,
    updated_at = NOW()
WHERE nombre = 'TQ 208';

-- TQ 209: 1,539.51 kg/cm
UPDATE almacenes
SET factor_kg_cm = 1539.51,
    updated_at = NOW()
WHERE nombre = 'TQ 209';

-- TQ 210: 1,595.15 kg/cm
UPDATE almacenes
SET factor_kg_cm = 1595.15,
    updated_at = NOW()
WHERE nombre = 'TQ 210';

-- TQ 211: 1,513.89 kg/cm
UPDATE almacenes
SET factor_kg_cm = 1513.89,
    updated_at = NOW()
WHERE nombre = 'TQ 211';

-- Verificar los cambios
SELECT nombre, factor_kg_cm, updated_at
FROM almacenes
WHERE nombre LIKE 'TQ%'
ORDER BY nombre;

