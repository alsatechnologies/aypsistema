-- ============================================
-- MIGRACIÓN 030: MÓDULO EXPORTACIONES
-- ============================================
-- Fecha: 2026-08-13
-- Tablas: clientes_exportacion, unidades_exportacion, ordenes_exportacion, cargas_exportacion
-- ============================================

-- Clientes de exportación (ADAMS, OILSEEDS, AETH, SAIKA, etc.)
CREATE TABLE IF NOT EXISTS public.clientes_exportacion (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  tipo_unidad   VARCHAR(20) NOT NULL DEFAULT 'jumbo', -- jumbo, contenedor, tolva
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Flota de unidades (jumbos, tolvas, contenedores)
CREATE TABLE IF NOT EXISTS public.unidades_exportacion (
  id                  SERIAL PRIMARY KEY,
  identificador       VARCHAR(30) NOT NULL UNIQUE, -- GAMX-6295, ECNX170366
  tipo                VARCHAR(20) NOT NULL,         -- jumbo, tolva, contenedor
  estatus             VARCHAR(30) NOT NULL DEFAULT 'activo', -- activo, en_reparacion, en_transito
  ubicacion_actual    VARCHAR(100),
  fecha_entrada_taller DATE,
  notas               TEXT,
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Órdenes de exportación (agrupan varias cargas para un cliente)
CREATE TABLE IF NOT EXISTS public.ordenes_exportacion (
  id                  SERIAL PRIMARY KEY,
  cliente_id          INTEGER NOT NULL REFERENCES public.clientes_exportacion(id),
  producto            VARCHAR(100) NOT NULL, -- A. Cártamo Prensa, Orgánico, etc.
  fecha_pedido        DATE NOT NULL,
  fecha_embarque      DATE,
  unidades_solicitadas INTEGER NOT NULL DEFAULT 1,
  tipo_unidad         VARCHAR(20) NOT NULL DEFAULT 'jumbo',
  notas               TEXT,
  estatus             VARCHAR(30) NOT NULL DEFAULT 'pendiente', -- pendiente, en_proceso, completada, cancelada
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cargas individuales (cada unidad asignada a una orden)
CREATE TABLE IF NOT EXISTS public.cargas_exportacion (
  id                  SERIAL PRIMARY KEY,
  orden_id            INTEGER REFERENCES public.ordenes_exportacion(id) ON DELETE SET NULL,
  unidad_id           INTEGER REFERENCES public.unidades_exportacion(id) ON DELETE SET NULL,
  carga_anterior      VARCHAR(100),
  proxima_carga       VARCHAR(100),
  ubicacion_actual    VARCHAR(100),
  eta_apsa            DATE,
  fecha_embarque      DATE,
  estatus             VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- pendiente, orden, enviado
  notas               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deshabilitar RLS (sistema usa auth personalizada con rol anon)
ALTER TABLE public.clientes_exportacion    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades_exportacion    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_exportacion     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargas_exportacion      DISABLE ROW LEVEL SECURITY;

-- Datos iniciales: clientes de exportación
INSERT INTO public.clientes_exportacion (nombre, tipo_unidad) VALUES
  ('ADAMS',    'jumbo'),
  ('OILSEEDS', 'jumbo'),
  ('AETH',     'contenedor'),
  ('SAIKA',    'contenedor')
ON CONFLICT DO NOTHING;

-- Datos iniciales: flota (del archivo Excel)
INSERT INTO public.unidades_exportacion (identificador, tipo, estatus) VALUES
  ('GAMX-6289',   'jumbo',      'activo'),
  ('GAMX-6295',   'jumbo',      'activo'),
  ('GAMX-6445',   'jumbo',      'activo'),
  ('GAMX-6297',   'jumbo',      'activo'),
  ('GAMX-6447',   'jumbo',      'activo'),
  ('GAMX-6453',   'jumbo',      'activo'),
  ('GAMX-6442',   'jumbo',      'activo'),
  ('GAMX-6301',   'jumbo',      'activo'),
  ('GAMX-2683',   'jumbo',      'activo'),
  ('GAMX-25049',  'jumbo',      'activo'),
  ('GAMX-25041',  'jumbo',      'activo'),
  ('GAMX-25042',  'jumbo',      'activo'),
  ('GAMX-6299',   'jumbo',      'activo'),
  ('GAMX-3205',   'jumbo',      'en_reparacion'),
  ('GAMX-2680',   'jumbo',      'en_reparacion'),
  ('GAMX-6443',   'jumbo',      'en_reparacion'),
  ('GAMX-6458',   'jumbo',      'en_reparacion'),
  ('GAMX-6307',   'jumbo',      'en_reparacion'),
  ('ECNX-170366', 'tolva',      'activo'),
  ('ECNX-170374', 'tolva',      'activo'),
  ('ECNX-170388', 'tolva',      'activo'),
  ('ECNX-170334', 'tolva',      'activo'),
  ('ECNX-170359', 'tolva',      'activo'),
  ('ECNX-170370', 'tolva',      'activo'),
  ('GAMX-20360',  'tolva',      'activo'),
  ('GAMX-20361',  'tolva',      'activo')
ON CONFLICT (identificador) DO NOTHING;
