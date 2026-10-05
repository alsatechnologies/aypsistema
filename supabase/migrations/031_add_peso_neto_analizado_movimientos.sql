-- Agregar columna peso_neto_analizado a movimientos
-- Almacena el peso neto después de aplicar descuentos de análisis (peso a liquidar)
-- Para semillas: es el peso_neto menos los castigos por humedad/impurezas/granos dañados
-- Null = sin descuentos aplicados (igual al peso_neto)

ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS peso_neto_analizado numeric;
