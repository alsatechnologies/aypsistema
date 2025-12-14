-- ============================================
-- LIMPIEZA DE DATOS - TRUNCATE TODAS LAS TABLAS
-- ============================================
-- Este script limpia todos los datos de las tablas
-- manteniendo la estructura intacta

-- Desactivar temporalmente las restricciones de foreign key
SET session_replication_role = 'replica';

-- Limpiar tablas en orden inverso de dependencias
TRUNCATE TABLE operaciones_lotes CASCADE;
TRUNCATE TABLE consecutivos_lotes CASCADE;
TRUNCATE TABLE lotes CASCADE;
TRUNCATE TABLE origenes_lote CASCADE;
TRUNCATE TABLE tipos_operacion_lote CASCADE;

TRUNCATE TABLE rangos_descuento CASCADE;
TRUNCATE TABLE productos_analisis CASCADE;
TRUNCATE TABLE tipos_analisis CASCADE;
TRUNCATE TABLE clientes_productos CASCADE;
TRUNCATE TABLE reportes_laboratorio CASCADE;
TRUNCATE TABLE movimientos CASCADE;
TRUNCATE TABLE ingresos CASCADE;
TRUNCATE TABLE ordenes CASCADE;
TRUNCATE TABLE embarques CASCADE;
TRUNCATE TABLE recepciones CASCADE;
TRUNCATE TABLE proveedores CASCADE;
TRUNCATE TABLE clientes CASCADE;
TRUNCATE TABLE productos CASCADE;
TRUNCATE TABLE almacenes CASCADE;
TRUNCATE TABLE usuarios CASCADE;

-- Limpiar también tablas antiguas si existen
TRUNCATE TABLE IF EXISTS registros CASCADE;
TRUNCATE TABLE IF EXISTS cliente CASCADE;
TRUNCATE TABLE IF EXISTS proveedor CASCADE;
TRUNCATE TABLE IF EXISTS almacen CASCADE;
TRUNCATE TABLE IF EXISTS lotificacion CASCADE;
TRUNCATE TABLE IF EXISTS tipoOperacion CASCADE;
TRUNCATE TABLE IF EXISTS lotificacion_consecutivo CASCADE;
TRUNCATE TABLE IF EXISTS lotificacion_ano CASCADE;
TRUNCATE TABLE IF EXISTS catalogo_tipo_operacion CASCADE;
TRUNCATE TABLE IF EXISTS catalogo_producto CASCADE;
TRUNCATE TABLE IF EXISTS catalogo_almacen CASCADE;

-- Reiniciar secuencias
ALTER SEQUENCE IF EXISTS productos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS almacenes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS usuarios_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS clientes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS proveedores_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS recepciones_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS embarques_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ordenes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS movimientos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tipos_operacion_lote_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS origenes_lote_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS lotes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS consecutivos_lotes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS operaciones_lotes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tipos_analisis_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS productos_analisis_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS rangos_descuento_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS clientes_productos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS reportes_laboratorio_id_seq RESTART WITH 1;

-- Reactivar restricciones de foreign key
SET session_replication_role = 'origin';

-- ============================================
-- REINSERTAR DATOS INICIALES
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

