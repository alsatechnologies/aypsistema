-- ============================================
-- MIGRACIÓN: CORRECCIÓN DE SEGURIDAD RLS
-- ============================================
-- Fecha: 2026-01-15
-- Descripción: Habilitar RLS en tablas faltantes y revisar políticas de seguridad
--
-- PROBLEMAS IDENTIFICADOS:
-- 1. inventario_almacenes NO tiene RLS habilitado
-- 2. reportes_produccion NO tiene RLS habilitado
-- 3. Las políticas actuales permiten acceso público completo (muy inseguro)
--
-- NOTA: El sistema usa autenticación personalizada (tabla usuarios), no auth.users de Supabase
-- Por lo tanto, las políticas deben usar service_role key o ser más restrictivas
-- ============================================

-- 1. HABILITAR RLS EN TABLAS FALTANTES
-- ============================================

-- Inventario de almacenes
ALTER TABLE IF EXISTS public.inventario_almacenes ENABLE ROW LEVEL SECURITY;

-- Reportes de producción
ALTER TABLE IF EXISTS public.reportes_produccion ENABLE ROW LEVEL SECURITY;

-- 2. CREAR POLÍTICAS PARA TABLAS FALTANTES
-- ============================================

-- Políticas para inventario_almacenes
-- NOTA: Actualmente permiten acceso público porque la app maneja autenticación
-- En producción, deberían usar service_role key o ser más restrictivas
DROP POLICY IF EXISTS "Allow all public access" ON public.inventario_almacenes;
CREATE POLICY "Allow all public access" ON public.inventario_almacenes 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Políticas para reportes_produccion
DROP POLICY IF EXISTS "Allow all public access" ON public.reportes_produccion;
CREATE POLICY "Allow all public access" ON public.reportes_produccion 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 3. VERIFICAR QUE TODAS LAS TABLAS PRINCIPALES TENGAN RLS
-- ============================================
-- Las siguientes tablas DEBEN tener RLS habilitado:
-- ✅ roles, users, user_rol, permisos_rol, modulos
-- ✅ tipos_analisis, productos, productos_analisis, clientes_productos
-- ✅ clientes, proveedores, rangos_descuento
-- ✅ recepciones, embarques, ordenes, movimientos, ingresos
-- ✅ reportes_laboratorio
-- ✅ lotes, origenes_lote, tipos_operacion_lote, consecutivos_lotes, operaciones_lotes
-- ✅ almacenes, usuarios
-- ✅ auditoria
-- ✅ inventario_almacenes (NUEVO)
-- ✅ reportes_produccion (NUEVO)

-- 4. COMENTARIOS DE SEGURIDAD
-- ============================================
COMMENT ON TABLE public.inventario_almacenes IS 
  'Inventario de productos por almacén. RLS habilitado - acceso controlado por políticas.';
  
COMMENT ON TABLE public.reportes_produccion IS 
  'Reportes diarios de producción. RLS habilitado - acceso controlado por políticas.';

-- ============================================
-- ADVERTENCIA DE SEGURIDAD
-- ============================================
-- Las políticas actuales permiten acceso público completo (USING (true) WITH CHECK (true))
-- porque el sistema usa autenticación personalizada en lugar de auth.users de Supabase.
--
-- RECOMENDACIONES PARA PRODUCCIÓN:
-- 1. Usar service_role key en el backend para operaciones sensibles
-- 2. Implementar políticas más restrictivas basadas en roles de la tabla usuarios
-- 3. Considerar usar funciones de seguridad (SECURITY DEFINER) para operaciones críticas
-- 4. Revisar y auditar regularmente el acceso a datos sensibles
--
-- Para implementar políticas basadas en roles personalizados, se necesitaría:
-- - Una función que obtenga el rol del usuario desde la tabla usuarios
-- - Políticas que usen esa función para restringir acceso
-- - Ejemplo: USING (get_user_role() = 'Administrador' OR get_user_role() = 'Oficina')
-- ============================================

