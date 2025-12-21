-- ============================================
-- TABLA: REPORTES DE PRODUCCIÓN
-- ============================================
-- Reportes diarios de niveles de aceite por tanque y gomas

CREATE TABLE IF NOT EXISTS reportes_produccion (
  id VARCHAR(20) PRIMARY KEY, -- 'PROD-0001'
  fecha DATE NOT NULL,
  responsable VARCHAR(255) NOT NULL,
  turno VARCHAR(50) NOT NULL, -- 'Matutino' | 'Vespertino' | 'Nocturno'
  estatus VARCHAR(50) NOT NULL DEFAULT 'Pendiente', -- 'Pendiente' | 'En proceso' | 'Completado'
  
  -- Niveles de aceite por tanque (JSONB para flexibilidad)
  -- Estructura: [{ tanque: 'TANQUE 1', nivel: 1500.50, unidad: 'L' }, ...]
  niveles_tanques JSONB DEFAULT '[]'::jsonb,
  
  -- Niveles de gomas (JSONB para flexibilidad)
  -- Estructura: [{ goma: 'GOMA 1', nivel: 800.25, unidad: 'L' }, ...]
  niveles_gomas JSONB DEFAULT '[]'::jsonb,
  
  -- Observaciones generales
  observaciones TEXT,
  
  -- Soft delete
  activo BOOLEAN DEFAULT TRUE,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_reportes_prod_fecha ON reportes_produccion(fecha);
CREATE INDEX IF NOT EXISTS idx_reportes_prod_estatus ON reportes_produccion(estatus);
CREATE INDEX IF NOT EXISTS idx_reportes_prod_activo ON reportes_produccion(activo);
CREATE INDEX IF NOT EXISTS idx_reportes_prod_responsable ON reportes_produccion(responsable);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_reportes_prod_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reportes_prod_updated_at 
  BEFORE UPDATE ON reportes_produccion 
  FOR EACH ROW 
  EXECUTE FUNCTION update_reportes_prod_updated_at();

-- Comentarios
COMMENT ON TABLE reportes_produccion IS 'Reportes diarios de niveles de aceite por tanque y gomas';
COMMENT ON COLUMN reportes_produccion.id IS 'Identificador único del reporte (ej: PROD-0001)';
COMMENT ON COLUMN reportes_produccion.fecha IS 'Fecha del reporte';
COMMENT ON COLUMN reportes_produccion.responsable IS 'Nombre del responsable que crea el reporte';
COMMENT ON COLUMN reportes_produccion.turno IS 'Turno de trabajo (Matutino, Vespertino, Nocturno)';
COMMENT ON COLUMN reportes_produccion.estatus IS 'Estado del reporte (Pendiente, En proceso, Completado)';
COMMENT ON COLUMN reportes_produccion.niveles_tanques IS 'JSONB con array de niveles por tanque: [{tanque: string, nivel: number, unidad: string}]';
COMMENT ON COLUMN reportes_produccion.niveles_gomas IS 'JSONB con array de niveles por goma: [{goma: string, nivel: number, unidad: string}]';
COMMENT ON COLUMN reportes_produccion.observaciones IS 'Observaciones generales del reporte';
COMMENT ON COLUMN reportes_produccion.activo IS 'Indica si el registro está activo (true) o eliminado lógicamente (false)';

