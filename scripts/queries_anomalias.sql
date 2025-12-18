-- Queries SQL para detección de anomalías en el sistema
-- Ejecutar periódicamente para identificar posibles problemas

-- ============================================
-- 1. RECEPCIONES CON PESOS ANÓMALOS
-- ============================================
-- Identifica recepciones donde el peso neto es negativo o mayor que el bruto
SELECT 
  id,
  boleta,
  producto_id,
  proveedor_id,
  peso_bruto,
  peso_tara,
  peso_neto,
  fecha,
  estatus,
  created_at
FROM recepciones
WHERE activo = true
  AND (
    peso_neto < 0
    OR (peso_bruto IS NOT NULL AND peso_tara IS NOT NULL AND peso_tara > peso_bruto)
    OR (peso_bruto IS NOT NULL AND peso_bruto < 0)
    OR (peso_tara IS NOT NULL AND peso_tara < 0)
  )
ORDER BY created_at DESC;

-- ============================================
-- 2. EMBARQUES CON PESOS ANÓMALOS
-- ============================================
SELECT 
  id,
  boleta,
  producto_id,
  cliente_id,
  peso_bruto,
  peso_tara,
  peso_neto,
  fecha,
  estatus,
  created_at
FROM embarques
WHERE activo = true
  AND (
    peso_neto < 0
    OR (peso_bruto IS NOT NULL AND peso_tara IS NOT NULL AND peso_tara > peso_bruto)
    OR (peso_bruto IS NOT NULL AND peso_bruto < 0)
    OR (peso_tara IS NOT NULL AND peso_tara < 0)
  )
ORDER BY created_at DESC;

-- ============================================
-- 3. RECEPCIONES COMPLETADAS SIN CÓDIGO DE LOTE
-- ============================================
SELECT 
  id,
  boleta,
  codigo_lote,
  producto_id,
  proveedor_id,
  estatus,
  fecha,
  created_at
FROM recepciones
WHERE activo = true
  AND estatus = 'Completado'
  AND (codigo_lote IS NULL OR codigo_lote = '')
ORDER BY created_at DESC;

-- ============================================
-- 4. EMBARQUES COMPLETADOS SIN CÓDIGO DE LOTE
-- ============================================
SELECT 
  id,
  boleta,
  codigo_lote,
  producto_id,
  cliente_id,
  estatus,
  fecha,
  created_at
FROM embarques
WHERE activo = true
  AND estatus = 'Completado'
  AND (codigo_lote IS NULL OR codigo_lote = '')
ORDER BY created_at DESC;

-- ============================================
-- 5. RECEPCIONES SIN PRODUCTO O PROVEEDOR
-- ============================================
SELECT 
  id,
  boleta,
  producto_id,
  proveedor_id,
  estatus,
  fecha,
  created_at
FROM recepciones
WHERE activo = true
  AND estatus = 'Completado'
  AND (producto_id IS NULL OR proveedor_id IS NULL)
ORDER BY created_at DESC;

-- ============================================
-- 6. EMBARQUES SIN PRODUCTO O CLIENTE
-- ============================================
SELECT 
  id,
  boleta,
  producto_id,
  cliente_id,
  estatus,
  fecha,
  created_at
FROM embarques
WHERE activo = true
  AND estatus = 'Completado'
  AND (producto_id IS NULL OR cliente_id IS NULL)
ORDER BY created_at DESC;

-- ============================================
-- 7. MOVIMIENTOS SIN PESO NETO
-- ============================================
SELECT 
  id,
  boleta,
  producto_id,
  tipo,
  peso_neto,
  fecha,
  created_at
FROM movimientos
WHERE activo = true
  AND (peso_neto IS NULL OR peso_neto <= 0)
ORDER BY created_at DESC;

-- ============================================
-- 8. RECEPCIONES CON FECHAS FUTURAS
-- ============================================
SELECT 
  id,
  boleta,
  fecha,
  created_at,
  hora_peso_bruto,
  hora_peso_tara,
  hora_peso_neto
FROM recepciones
WHERE activo = true
  AND (
    fecha > CURRENT_DATE
    OR (hora_peso_bruto IS NOT NULL AND hora_peso_bruto > NOW())
    OR (hora_peso_tara IS NOT NULL AND hora_peso_tara > NOW())
    OR (hora_peso_neto IS NOT NULL AND hora_peso_neto > NOW())
  )
ORDER BY created_at DESC;

-- ============================================
-- 9. EMBARQUES CON FECHAS FUTURAS
-- ============================================
SELECT 
  id,
  boleta,
  fecha,
  created_at,
  hora_peso_bruto,
  hora_peso_tara,
  hora_peso_neto
FROM embarques
WHERE activo = true
  AND (
    fecha > CURRENT_DATE
    OR (hora_peso_bruto IS NOT NULL AND hora_peso_bruto > NOW())
    OR (hora_peso_tara IS NOT NULL AND hora_peso_tara > NOW())
    OR (hora_peso_neto IS NOT NULL AND hora_peso_neto > NOW())
  )
ORDER BY created_at DESC;

-- ============================================
-- 10. REGISTROS MODIFICADOS DESPUÉS DE COMPLETARSE
-- ============================================
-- Identifica recepciones que fueron modificadas después de completarse
SELECT 
  r.id,
  r.boleta,
  r.estatus,
  r.updated_at,
  a.fecha_hora as fecha_modificacion,
  a.accion,
  a.usuario_email
FROM recepciones r
JOIN auditoria a ON a.tabla = 'recepciones' AND a.registro_id = r.id
WHERE r.activo = true
  AND r.estatus = 'Completado'
  AND a.accion = 'UPDATE'
  AND a.fecha_hora > (
    SELECT MAX(fecha_hora)
    FROM auditoria
    WHERE tabla = 'recepciones'
      AND registro_id = r.id
      AND datos_nuevos->>'estatus' = 'Completado'
  )
ORDER BY a.fecha_hora DESC;

-- ============================================
-- 11. USUARIOS INACTIVOS CON ACTIVIDAD RECIENTE
-- ============================================
SELECT 
  u.id,
  u.nombre_completo,
  u.correo,
  u.activo,
  MAX(a.fecha_hora) as ultima_actividad
FROM usuarios u
JOIN auditoria a ON a.usuario_id = u.id
WHERE u.activo = false
GROUP BY u.id, u.nombre_completo, u.correo, u.activo
HAVING MAX(a.fecha_hora) > NOW() - INTERVAL '7 days'
ORDER BY ultima_actividad DESC;

-- ============================================
-- 12. REGISTROS ELIMINADOS RECIENTEMENTE (SOFT DELETE)
-- ============================================
-- Identifica registros eliminados en las últimas 24 horas
SELECT 
  tabla,
  registro_id,
  accion,
  usuario_email,
  fecha_hora
FROM auditoria
WHERE accion = 'DELETE'
  AND fecha_hora > NOW() - INTERVAL '24 hours'
ORDER BY fecha_hora DESC;

-- ============================================
-- 13. RECEPCIONES CON PESO NETO MUY ALTO (POSIBLE ERROR)
-- ============================================
-- Identifica recepciones con peso neto mayor a 100,000 kg (100 toneladas)
SELECT 
  id,
  boleta,
  producto_id,
  proveedor_id,
  peso_bruto,
  peso_tara,
  peso_neto,
  fecha,
  created_at
FROM recepciones
WHERE activo = true
  AND peso_neto > 100000
ORDER BY peso_neto DESC;

-- ============================================
-- 14. EMBARQUES CON PESO NETO MUY ALTO (POSIBLE ERROR)
-- ============================================
SELECT 
  id,
  boleta,
  producto_id,
  cliente_id,
  peso_bruto,
  peso_tara,
  peso_neto,
  fecha,
  created_at
FROM embarques
WHERE activo = true
  AND peso_neto > 100000
ORDER BY peso_neto DESC;

-- ============================================
-- 15. REGISTROS SIN ACTUALIZAR EN MÁS DE 30 DÍAS
-- ============================================
-- Identifica recepciones pendientes sin actualizar
SELECT 
  id,
  boleta,
  estatus,
  fecha,
  updated_at,
  created_at
FROM recepciones
WHERE activo = true
  AND estatus != 'Completado'
  AND updated_at < NOW() - INTERVAL '30 days'
ORDER BY updated_at ASC;

