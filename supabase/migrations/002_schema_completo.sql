-- ============================================
-- LIMPIEZA COMPLETA - ELIMINAR TODAS LAS TABLAS
-- ============================================

-- Eliminar en orden inverso de dependencias
DROP TABLE IF EXISTS operaciones_lotes CASCADE;
DROP TABLE IF EXISTS consecutivos_lotes CASCADE;
DROP TABLE IF EXISTS lotes CASCADE;
DROP TABLE IF EXISTS origenes_lote CASCADE;
DROP TABLE IF EXISTS tipos_operacion_lote CASCADE;

DROP TABLE IF EXISTS rangos_descuento CASCADE;
DROP TABLE IF EXISTS productos_analisis CASCADE;
DROP TABLE IF EXISTS tipos_analisis CASCADE;
DROP TABLE IF EXISTS clientes_productos CASCADE;
DROP TABLE IF EXISTS reportes_laboratorio CASCADE;
DROP TABLE IF EXISTS movimientos CASCADE;
DROP TABLE IF EXISTS ingresos CASCADE;
DROP TABLE IF EXISTS ordenes CASCADE;
DROP TABLE IF EXISTS embarques CASCADE;
DROP TABLE IF EXISTS recepciones CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS almacenes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Eliminar funciones si existen
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- TABLAS BASE (Configuración)
-- ============================================

-- Tipos de Análisis
CREATE TABLE tipos_analisis (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Productos
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  codigo_boleta VARCHAR(10) NOT NULL UNIQUE,
  codigo_lote VARCHAR(10), -- Código para lotificación (puede ser diferente a codigo_boleta)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Análisis por Producto
CREATE TABLE productos_analisis (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
  tipo_analisis_id VARCHAR(50) REFERENCES tipos_analisis(id) ON DELETE CASCADE,
  genera_descuento BOOLEAN DEFAULT FALSE,
  UNIQUE(producto_id, tipo_analisis_id)
);

-- Rangos de Descuento
CREATE TABLE rangos_descuento (
  id SERIAL PRIMARY KEY,
  producto_analisis_id INTEGER REFERENCES productos_analisis(id) ON DELETE CASCADE,
  porcentaje DECIMAL(5,2) NOT NULL,
  kg_descuento_ton DECIMAL(10,3) NOT NULL,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Almacenes
CREATE TABLE almacenes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  codigo_lote VARCHAR(10), -- Código para lotificación
  capacidad_total DECIMAL(15,2) NOT NULL,
  capacidad_actual DECIMAL(15,2) DEFAULT 0,
  unidad VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usuarios
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre_completo VARCHAR(255) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLAS DE ENTIDADES MAESTRAS
-- ============================================

-- Clientes
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  empresa VARCHAR(255) NOT NULL,
  rfc VARCHAR(20) NOT NULL UNIQUE,
  contacto VARCHAR(255),
  telefono VARCHAR(50),
  email VARCHAR(255),
  direccion TEXT,
  ciudad VARCHAR(255),
  tipo_cliente VARCHAR(50) NOT NULL, -- 'Nacional' | 'Exportación'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Productos por Cliente
CREATE TABLE clientes_productos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
  UNIQUE(cliente_id, producto_id)
);

-- Proveedores
CREATE TABLE proveedores (
  id SERIAL PRIMARY KEY,
  empresa VARCHAR(255) NOT NULL,
  producto VARCHAR(255),
  telefono VARCHAR(50),
  email VARCHAR(255),
  ubicacion VARCHAR(255),
  fecha_alta DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLAS DE OPERACIONES
-- ============================================

-- Recepciones
CREATE TABLE recepciones (
  id SERIAL PRIMARY KEY,
  boleta VARCHAR(20) NOT NULL UNIQUE,
  codigo_lote VARCHAR(50), -- Código de lotificación generado
  producto_id INTEGER REFERENCES productos(id),
  proveedor_id INTEGER REFERENCES proveedores(id),
  chofer VARCHAR(255),
  placas VARCHAR(50),
  fecha DATE NOT NULL,
  estatus VARCHAR(50) NOT NULL, -- 'Pendiente' | 'Peso Bruto' | 'En Descarga' | 'Peso Tara' | 'Completado'
  peso_bruto DECIMAL(10,2),
  peso_tara DECIMAL(10,2),
  peso_neto DECIMAL(10,2),
  tipo_transporte VARCHAR(50), -- 'Camión' | 'Ferroviaria'
  tipo_bascula VARCHAR(50),
  sello_entrada_1 VARCHAR(100),
  sello_entrada_2 VARCHAR(100),
  sello_salida_1 VARCHAR(100),
  sello_salida_2 VARCHAR(100),
  analisis JSONB, -- { "Humedad": 13.5, "Impurezas": 1.8 }
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Embarques
CREATE TABLE embarques (
  id SERIAL PRIMARY KEY,
  boleta VARCHAR(20) NOT NULL UNIQUE,
  codigo_lote VARCHAR(50), -- Código de lotificación generado
  producto_id INTEGER REFERENCES productos(id),
  cliente_id INTEGER REFERENCES clientes(id),
  chofer VARCHAR(255),
  destino VARCHAR(255),
  fecha DATE NOT NULL,
  estatus VARCHAR(50) NOT NULL, -- 'Pendiente' | 'Peso Tara' | 'En Carga' | 'Peso Bruto' | 'Completado'
  peso_bruto DECIMAL(10,2),
  peso_tara DECIMAL(10,2),
  peso_neto DECIMAL(10,2),
  tipo_transporte VARCHAR(50),
  tipo_embarque VARCHAR(50), -- 'Nacional' | 'Exportación'
  sello_entrada_1 VARCHAR(100),
  sello_entrada_2 VARCHAR(100),
  sello_salida_1 VARCHAR(100),
  sello_salida_2 VARCHAR(100),
  valores_analisis JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Órdenes (Oficina)
CREATE TABLE ordenes (
  id SERIAL PRIMARY KEY,
  boleta VARCHAR(20) NOT NULL UNIQUE,
  producto_id INTEGER REFERENCES productos(id),
  cliente_id INTEGER REFERENCES clientes(id),
  tipo_operacion VARCHAR(50) NOT NULL, -- 'Reciba' | 'Embarque Nacional' | 'Embarque Exportación'
  destino VARCHAR(255),
  nombre_chofer VARCHAR(255),
  vehiculo VARCHAR(100),
  placas VARCHAR(50),
  fecha_hora_ingreso TIMESTAMP,
  estatus VARCHAR(50) NOT NULL, -- 'Nuevo' | 'En Proceso' | 'Completado'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Movimientos
CREATE TABLE movimientos (
  id SERIAL PRIMARY KEY,
  boleta VARCHAR(20) NOT NULL,
  producto_id INTEGER REFERENCES productos(id),
  cliente_proveedor VARCHAR(255),
  tipo VARCHAR(50) NOT NULL, -- 'Entrada' | 'Salida'
  transporte VARCHAR(50),
  fecha DATE NOT NULL,
  ubicacion VARCHAR(255),
  peso_neto DECIMAL(10,2),
  peso_bruto DECIMAL(10,2),
  peso_tara DECIMAL(10,2),
  chofer VARCHAR(255),
  placas VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ingresos
CREATE TABLE ingresos (
  id SERIAL PRIMARY KEY,
  nombre_chofer VARCHAR(255) NOT NULL,
  empresa VARCHAR(255),
  procedencia_destino VARCHAR(255),
  motivo VARCHAR(50) NOT NULL, -- 'Reciba' | 'Embarque'
  placas VARCHAR(50),
  vehiculo VARCHAR(100),
  fecha_hora_ingreso TIMESTAMP NOT NULL,
  fecha_hora_salida TIMESTAMP,
  ubicacion VARCHAR(255),
  producto VARCHAR(255),
  proveedor VARCHAR(255),
  cliente VARCHAR(255),
  tipo_transporte VARCHAR(50),
  enviado_a_oficina BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reportes de Laboratorio
CREATE TABLE reportes_laboratorio (
  id VARCHAR(20) PRIMARY KEY, -- 'LAB-0001'
  fecha DATE NOT NULL,
  responsable VARCHAR(255) NOT NULL,
  turno VARCHAR(50) NOT NULL, -- 'Matutino' | 'Vespertino' | 'Nocturno'
  estatus VARCHAR(50) NOT NULL,
  
  -- PLANTA
  planta_textura_promedio DECIMAL(5,2),
  planta_textura_alto DECIMAL(5,2),
  planta_textura_bajo DECIMAL(5,2),
  planta_humedad_promedio DECIMAL(5,2),
  planta_humedad_alto DECIMAL(5,2),
  planta_humedad_bajo DECIMAL(5,2),
  planta_residuales_promedio DECIMAL(5,2),
  planta_residuales_alto DECIMAL(5,2),
  planta_residuales_bajo DECIMAL(5,2),
  planta_temperatura_promedio DECIMAL(5,2),
  planta_aceite_acidez DECIMAL(5,2),
  planta_aceite_oleico DECIMAL(5,2),
  planta_aceite_humedad DECIMAL(5,2),
  planta_aceite_flash_point VARCHAR(1), -- '+' | '-'
  
  -- EXPANDER
  expander_hojuela_residual DECIMAL(5,2),
  expander_hojuela_humedad DECIMAL(5,2),
  expander_semilla_humedad DECIMAL(5,2),
  expander_semilla_contenido_aceite DECIMAL(5,2),
  expander_costra_vibrador_residual DECIMAL(5,2),
  expander_costra_vibrador_humedad DECIMAL(5,2),
  expander_costra_directa_residual DECIMAL(5,2),
  expander_costra_directa_humedad DECIMAL(5,2),
  
  -- JSONB para datos complejos
  planta_proteina JSONB, -- [{ valor: 5.30, porcentaje: 21.47 }, ...]
  expander_aceite JSONB, -- [{ tipo: 'Expander', filtroNumeros: '...', humedad: ..., acidez: ..., acidoOleico: ... }, ...]
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SISTEMA DE LOTIFICACIÓN
-- ============================================

-- Tipos de Operación para Lotificación
CREATE TABLE tipos_operacion_lote (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE, -- 'AC-', 'CH-', 'NL-', etc.
  nombre VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orígenes (Clientes/Proveedores con códigos de lotificación)
CREATE TABLE origenes_lote (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE, -- '00', '01', '02', etc.
  nombre VARCHAR(255) NOT NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL, -- 'Cliente' | 'Proveedor' | 'Otros'
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lotes
CREATE TABLE lotes (
  id SERIAL PRIMARY KEY,
  codigo_lote VARCHAR(50) NOT NULL UNIQUE, -- 'AC-17160525-003'
  
  -- Componentes del código
  tipo_operacion_codigo VARCHAR(10) NOT NULL, -- 'AC-'
  origen_codigo VARCHAR(10) NOT NULL, -- '17'
  producto_codigo VARCHAR(10) NOT NULL, -- '16'
  almacen_codigo VARCHAR(10) NOT NULL, -- '05'
  anio_codigo VARCHAR(10) NOT NULL, -- '25'
  consecutivo INTEGER NOT NULL, -- 3
  
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
  created_by INTEGER REFERENCES usuarios(id)
);

-- Consecutivos GLOBAL por tipo_operacion + año
CREATE TABLE consecutivos_lotes (
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

-- Asignación de Lotes a Operaciones
CREATE TABLE operaciones_lotes (
  id SERIAL PRIMARY KEY,
  lote_id INTEGER REFERENCES lotes(id) ON DELETE RESTRICT,
  operacion_tipo VARCHAR(50) NOT NULL, -- 'recepcion' | 'embarque' | 'orden'
  operacion_id INTEGER NOT NULL,
  peso_asignado DECIMAL(10,2) NOT NULL,
  fecha_asignacion TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

CREATE INDEX idx_recepciones_fecha ON recepciones(fecha);
CREATE INDEX idx_recepciones_estatus ON recepciones(estatus);
CREATE INDEX idx_recepciones_codigo_lote ON recepciones(codigo_lote);
CREATE INDEX idx_recepciones_producto ON recepciones(producto_id);
CREATE INDEX idx_recepciones_proveedor ON recepciones(proveedor_id);

CREATE INDEX idx_embarques_fecha ON embarques(fecha);
CREATE INDEX idx_embarques_estatus ON embarques(estatus);
CREATE INDEX idx_embarques_codigo_lote ON embarques(codigo_lote);
CREATE INDEX idx_embarques_producto ON embarques(producto_id);
CREATE INDEX idx_embarques_cliente ON embarques(cliente_id);

CREATE INDEX idx_ordenes_estatus ON ordenes(estatus);
CREATE INDEX idx_ordenes_fecha ON ordenes(fecha_hora_ingreso);

CREATE INDEX idx_movimientos_fecha ON movimientos(fecha);
CREATE INDEX idx_movimientos_tipo ON movimientos(tipo);
CREATE INDEX idx_movimientos_producto ON movimientos(producto_id);

CREATE INDEX idx_ingresos_fecha ON ingresos(fecha_hora_ingreso);
CREATE INDEX idx_ingresos_motivo ON ingresos(motivo);

CREATE INDEX idx_reportes_lab_fecha ON reportes_laboratorio(fecha);
CREATE INDEX idx_reportes_lab_estatus ON reportes_laboratorio(estatus);

CREATE INDEX idx_lotes_codigo ON lotes(codigo_lote);
CREATE INDEX idx_lotes_anio ON lotes(anio);
CREATE INDEX idx_lotes_activo ON lotes(activo);
CREATE INDEX idx_consecutivos_lotes ON consecutivos_lotes(tipo_operacion_codigo, anio);
CREATE INDEX idx_operaciones_lotes_operacion ON operaciones_lotes(operacion_tipo, operacion_id);

-- ============================================
-- TRIGGERS PARA updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_almacenes_updated_at BEFORE UPDATE ON almacenes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON proveedores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recepciones_updated_at BEFORE UPDATE ON recepciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_embarques_updated_at BEFORE UPDATE ON embarques
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordenes_updated_at BEFORE UPDATE ON ordenes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingresos_updated_at BEFORE UPDATE ON ingresos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reportes_lab_updated_at BEFORE UPDATE ON reportes_laboratorio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lotes_updated_at BEFORE UPDATE ON lotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Tipos de Análisis
INSERT INTO tipos_analisis (id, nombre) VALUES
  ('humedad', 'Humedad'),
  ('impurezas', 'Impurezas'),
  ('impurezasInsolubles', 'Impurezas Insolubles'),
  ('granosDanados', 'Granos Dañados'),
  ('granosQuebrados', 'Granos Quebrados'),
  ('pesoEspecifico', 'Peso Específico'),
  ('aflatoxinas', 'Aflatoxinas'),
  ('proteina', 'Proteína'),
  ('grasa', 'Grasa'),
  ('fibra', 'Fibra'),
  ('cenizas', 'Cenizas'),
  ('acidez', 'Acidez'),
  ('acidoOleico', 'Ácido Oleico'),
  ('indiceSaponificacion', 'Índice de Saponificación'),
  ('indiceYodo', 'Índice de Yodo'),
  ('indiceRefraccion', 'Índice de Refracción'),
  ('colorRojo', 'Color Rojo'),
  ('colorAmarillo', 'Color Amarillo'),
  ('fosfolipidos', 'Fosfolípidos'),
  ('insolubles', 'Insolubles en Acetona')
ON CONFLICT (id) DO NOTHING;

-- Tipos de Operación para Lotificación
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

-- Origen "OTROS" por defecto
INSERT INTO origenes_lote (codigo, nombre, tipo, activo) VALUES
  ('00', 'OTROS', 'Otros', true)
ON CONFLICT (codigo) DO NOTHING;


