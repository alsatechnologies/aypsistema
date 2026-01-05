-- ============================================
-- TABLA: INVENTARIO ALMACENES
-- ============================================
-- Relación muchos-a-muchos entre almacenes y productos
-- Permite que un almacén tenga múltiples productos con sus respectivas cantidades
-- La capacidad_actual del almacén se calcula automáticamente como la suma de todas las cantidades

CREATE TABLE IF NOT EXISTS inventario_almacenes (
  id SERIAL PRIMARY KEY,
  almacen_id INTEGER NOT NULL REFERENCES almacenes(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(almacen_id, producto_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_inventario_almacenes_almacen ON inventario_almacenes(almacen_id);
CREATE INDEX IF NOT EXISTS idx_inventario_almacenes_producto ON inventario_almacenes(producto_id);

-- Comentarios
COMMENT ON TABLE inventario_almacenes IS 'Inventario de productos por almacén. Permite múltiples productos en un mismo almacén.';
COMMENT ON COLUMN inventario_almacenes.cantidad IS 'Cantidad del producto en el almacén. La suma de todas las cantidades debe ser <= capacidad_total del almacén.';

