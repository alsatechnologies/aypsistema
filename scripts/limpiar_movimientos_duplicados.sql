-- Script para limpiar movimientos duplicados
-- Mantiene solo el movimiento más reciente para cada boleta

-- 1. Primero ver cuántos duplicados hay
SELECT boleta, COUNT(*) as cantidad
FROM movimientos
GROUP BY boleta
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- 2. Ver el total de movimientos antes de limpiar
SELECT COUNT(*) as total_movimientos FROM movimientos;

-- 3. Eliminar duplicados, manteniendo solo el registro más reciente (mayor ID) para cada boleta
DELETE FROM movimientos
WHERE id NOT IN (
    SELECT MAX(id)
    FROM movimientos
    GROUP BY boleta
);

-- 4. Ver el total de movimientos después de limpiar
SELECT COUNT(*) as total_movimientos_despues FROM movimientos;

-- 5. Verificar que ya no hay duplicados
SELECT boleta, COUNT(*) as cantidad
FROM movimientos
GROUP BY boleta
HAVING COUNT(*) > 1;

