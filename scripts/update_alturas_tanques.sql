-- ============================================
-- ACTUALIZAR ALTURAS MÁXIMAS DE TANQUES
-- ============================================
-- Actualiza las alturas máximas de los tanques TQ 209, TQ 210 y TQ 211

-- TQ 209: 11.20 m
UPDATE almacenes
SET altura_maxima = 11.20,
    updated_at = NOW()
WHERE nombre = 'TQ 209';

-- TQ 210: 11.20 m
UPDATE almacenes
SET altura_maxima = 11.20,
    updated_at = NOW()
WHERE nombre = 'TQ 210';

-- TQ 211: 11.40 m
UPDATE almacenes
SET altura_maxima = 11.40,
    updated_at = NOW()
WHERE nombre = 'TQ 211';

-- Verificar los cambios
SELECT nombre, altura_maxima, updated_at
FROM almacenes
WHERE nombre IN ('TQ 209', 'TQ 210', 'TQ 211')
ORDER BY nombre;

