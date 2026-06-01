-- Procedencia capturada en Ingreso (o Origen en Oficina) para boletas de Reciba
ALTER TABLE recepciones ADD COLUMN IF NOT EXISTS procedencia VARCHAR(255);

COMMENT ON COLUMN recepciones.procedencia IS 'Procedencia/origen de la mercancía (desde ingreso o oficina)';

CREATE INDEX IF NOT EXISTS idx_recepciones_procedencia ON recepciones(procedencia) WHERE procedencia IS NOT NULL;

-- Rellenar recepciones existentes desde el último ingreso Reciba con mismas placas y chofer
UPDATE recepciones r
SET procedencia = i.procedencia_destino
FROM (
  SELECT DISTINCT ON (placas, nombre_chofer)
    placas,
    nombre_chofer,
    procedencia_destino
  FROM ingresos
  WHERE motivo = 'Reciba'
    AND procedencia_destino IS NOT NULL
    AND activo = true
    AND placas IS NOT NULL
    AND nombre_chofer IS NOT NULL
  ORDER BY placas, nombre_chofer, fecha_hora_ingreso DESC
) i
WHERE r.procedencia IS NULL
  AND r.placas = i.placas
  AND r.chofer = i.nombre_chofer;
