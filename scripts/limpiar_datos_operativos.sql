-- ============================================
-- LIMPIEZA DE DATOS OPERATIVOS
-- ============================================
-- Este script elimina todos los ingresos, órdenes, recepciones y embarques
-- MANTIENE: productos, almacenes, clientes, proveedores, usuarios, configuración
-- 
-- ⚠️ ADVERTENCIA: Esta operación es IRREVERSIBLE
-- Ejecutar solo si estás seguro de querer eliminar todos los datos operativos

BEGIN;

-- Desactivar temporalmente las restricciones de foreign key para evitar errores
SET session_replication_role = 'replica';

-- 1. Eliminar operaciones de lotes que puedan referenciar recepciones/embarques/ordenes
-- Estas operaciones pueden tener referencias a recepciones, embarques u ordenes
DELETE FROM operaciones_lotes 
WHERE operacion_tipo IN ('recepcion', 'embarque', 'orden');

-- 2. Eliminar movimientos (pueden referenciar recepciones/embarques)
DELETE FROM movimientos;

-- 3. Eliminar ingresos
DELETE FROM ingresos;

-- 4. Eliminar órdenes
DELETE FROM ordenes;

-- 5. Eliminar recepciones
DELETE FROM recepciones;

-- 6. Eliminar embarques
DELETE FROM embarques;

-- Reiniciar secuencias para que los nuevos registros empiecen desde 1
ALTER SEQUENCE IF EXISTS ingresos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ordenes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS recepciones_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS embarques_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS movimientos_id_seq RESTART WITH 1;

-- Reactivar restricciones de foreign key
SET session_replication_role = 'origin';

COMMIT;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta estas consultas para verificar que se eliminaron todos los registros:

-- SELECT COUNT(*) as total_ingresos FROM ingresos;
-- SELECT COUNT(*) as total_ordenes FROM ordenes;
-- SELECT COUNT(*) as total_recepciones FROM recepciones;
-- SELECT COUNT(*) as total_embarques FROM embarques;
-- SELECT COUNT(*) as total_movimientos FROM movimientos;

