-- Script para regenerar el código de lote del embarque 2250003
-- 
-- PASO 1: Verificar el estado actual del embarque
SELECT 
  id,
  boleta,
  estatus,
  codigo_lote,
  cliente_id,
  producto_id,
  almacen_id,
  tipo_embarque
FROM embarques
WHERE boleta = '2250003';

-- PASO 2: Si el embarque está completado pero no tiene lote, 
-- establecer codigo_lote a NULL para forzar la regeneración
-- (Solo ejecutar si el embarque está completado y no tiene lote)
UPDATE embarques
SET codigo_lote = NULL,
    updated_at = NOW()
WHERE boleta = '2250003' 
  AND estatus = 'Completado' 
  AND (codigo_lote IS NULL OR codigo_lote = '');

-- NOTA: Después de ejecutar este UPDATE, el lote se regenerará automáticamente
-- la próxima vez que se actualice el embarque desde el frontend.
-- 
-- Para forzar la regeneración inmediata, puedes:
-- 1. Abrir el embarque en el módulo de Embarque
-- 2. Hacer cualquier cambio menor (como agregar una observación)
-- 3. Guardar - esto activará la lógica de regeneración de lote

