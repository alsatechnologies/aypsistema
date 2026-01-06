-- ============================================
-- CORREGIR FACTOR DE TQ 206
-- ============================================

-- Verificar el nombre exacto del tanque
SELECT nombre, factor_kg_cm 
FROM almacenes 
WHERE nombre LIKE '%206%'
ORDER BY nombre;

-- Actualizar TQ 206 con diferentes variaciones posibles
UPDATE almacenes
SET factor_kg_cm = 947.32,
    updated_at = NOW()
WHERE nombre = 'TQ 206' OR nombre = 'TQ206' OR nombre LIKE '%206%';

-- Verificar que se actualizó
SELECT nombre, factor_kg_cm, updated_at
FROM almacenes
WHERE nombre LIKE '%206%';

