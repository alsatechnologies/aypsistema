-- ============================================
-- SISTEMA DE LOTIFICACIÓN
-- ============================================

-- Tabla de Tipos de Operación (con códigos)
CREATE TABLE IF NOT EXISTS tipos_operacion_lote (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE, -- 'AC-', 'CH-', 'NL-', etc.
  nombre VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Orígenes (Clientes/Proveedores con códigos de lotificación)
CREATE TABLE IF NOT EXISTS origenes_lote (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE, -- '00', '01', '02', etc.
  nombre VARCHAR(255) NOT NULL, -- Nombre de la empresa
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL, -- 'Cliente' | 'Proveedor' | 'Otros'
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Lotes
CREATE TABLE IF NOT EXISTS lotes (
  id SERIAL PRIMARY KEY,
  codigo_lote VARCHAR(50) NOT NULL UNIQUE, -- 'AC-02071125-111'
  
  -- Componentes del código
  tipo_operacion_codigo VARCHAR(10) NOT NULL, -- 'AC-'
  origen_codigo VARCHAR(10) NOT NULL, -- '02'
  producto_codigo VARCHAR(10) NOT NULL, -- '07'
  almacen_codigo VARCHAR(10) NOT NULL, -- '11'
  anio_codigo VARCHAR(10) NOT NULL, -- '25'
  consecutivo INTEGER NOT NULL, -- 111
  
  -- Referencias a tablas principales
  tipo_operacion_id INTEGER REFERENCES tipos_operacion_lote(id),
  origen_id INTEGER REFERENCES origenes_lote(id),
  producto_id INTEGER REFERENCES productos(id),
  almacen_id INTEGER REFERENCES almacenes(id),
  anio INTEGER NOT NULL, -- 2025
  
  -- Datos adicionales
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  activo BOOLEAN DEFAULT TRUE,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES usuarios(id),
  
  -- Índice único para evitar duplicados
  UNIQUE(tipo_operacion_codigo, origen_codigo, producto_codigo, almacen_codigo, anio_codigo, consecutivo, anio)
);

-- Tabla de Consecutivos GLOBAL por tipo_operacion + año
CREATE TABLE IF NOT EXISTS consecutivos_lotes (
  id SERIAL PRIMARY KEY,
  tipo_operacion_codigo VARCHAR(10) NOT NULL,
  anio INTEGER NOT NULL,
  consecutivo INTEGER DEFAULT 1,
  -- Campos adicionales para referencia (no usados en el consecutivo)
  origen_codigo VARCHAR(10),
  producto_codigo VARCHAR(10),
  almacen_codigo VARCHAR(10),
  anio_codigo VARCHAR(10),
  UNIQUE(tipo_operacion_codigo, anio)
);

-- Tabla de Asignación de Lotes a Operaciones
CREATE TABLE IF NOT EXISTS operaciones_lotes (
  id SERIAL PRIMARY KEY,
  lote_id INTEGER REFERENCES lotes(id) ON DELETE RESTRICT,
  operacion_tipo VARCHAR(50) NOT NULL, -- 'recepcion' | 'embarque' | 'orden'
  operacion_id INTEGER NOT NULL,
  peso_asignado DECIMAL(10,2) NOT NULL,
  fecha_asignacion TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_lotes_codigo ON lotes(codigo_lote);
CREATE INDEX IF NOT EXISTS idx_lotes_anio ON lotes(anio);
CREATE INDEX IF NOT EXISTS idx_lotes_activo ON lotes(activo);
CREATE INDEX IF NOT EXISTS idx_lotes_tipo_operacion ON lotes(tipo_operacion_codigo);
CREATE INDEX IF NOT EXISTS idx_lotes_producto ON lotes(producto_codigo);
CREATE INDEX IF NOT EXISTS idx_operaciones_lotes_operacion ON operaciones_lotes(operacion_tipo, operacion_id);
CREATE INDEX IF NOT EXISTS idx_consecutivos_lotes ON consecutivos_lotes(tipo_operacion_codigo, anio);

-- Datos iniciales: Tipos de Operación
INSERT INTO tipos_operacion_lote (codigo, nombre, activo) VALUES
  ('CH-', 'COSECHA', true),
  ('AC-', 'ACOPIO', true),
  ('NL-', 'VENTA NACIONAL', true),
  ('EX-', 'VENTA EXPORTACIÓN', true),
  ('IV-', 'INGRESOS VARIOS', true),
  ('MT-', 'MUESTRAS DE PAQUETERÍA', true),
  ('IN-', 'INSUMOS', true),
  ('MAC-', 'MOVIMIENTO ENTRE ACOPIOS', true),
  ('OT-', 'OTROS', true),
  ('PT', 'PRODUCTO TERMINADO', true),
  ('MP', 'MATERIA PRIMA', true)
ON CONFLICT (codigo) DO NOTHING;

-- Datos iniciales: Orígenes (ejemplos)
INSERT INTO origenes_lote (codigo, nombre, tipo, activo) VALUES
  ('00', 'OTROS', 'Otros', true),
  ('01', 'ACEITES Y PROTEÍNAS S.A. DE C.V.', 'Cliente', true),
  ('02', 'SEMILLAS Y FORRAJES DE GUAMÚCHIL S. C. DE R. L.', 'Proveedor', true),
  ('03', 'SEMILLAS SAN RAFAEL S.C. DE R. L.', 'Proveedor', true),
  ('04', 'GRANERA DEL NOROESTE S.A. DE C. V.', 'Proveedor', true),
  ('05', 'FERROPUERTO DE SONORA', 'Proveedor', true),
  ('06', 'AGRÍCOLA B&P S.P.R. DE R.L.', 'Proveedor', true),
  ('07', 'AGRÍCOLA FERAZ S.A. DE C.V.', 'Proveedor', true),
  ('08', 'LENEY S.P.R.', 'Proveedor', true),
  ('09', 'BUNGE COMERCIAL S.A. DE C.V.', 'Proveedor', true),
  ('10', 'AGRÍCOLA INDUSTRIAL HUATABAMPO S.A. DE C.V.', 'Proveedor', true)
ON CONFLICT (codigo) DO NOTHING;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lotes_updated_at BEFORE UPDATE ON lotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

