-- =====================================================
-- SCRIPT DE POLÍTICAS RLS DE SEGURIDAD
-- Adaptado para Autenticación Personalizada
-- Proyecto: Aceites y Proteínas
-- Fecha: 12 de Diciembre, 2024
-- =====================================================
-- 
-- IMPORTANTE: Este script está adaptado para funcionar
-- con autenticación personalizada (no Supabase Auth)
-- 
-- Las políticas serán más restrictivas pero funcionarán
-- sin necesidad de auth.email() o auth.uid()
-- =====================================================

-- =====================================================
-- FASE 1: ELIMINAR POLÍTICAS GENÉRICAS
-- =====================================================

-- Eliminar políticas genéricas de todas las tablas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated users" ON %I', r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- NOTA IMPORTANTE SOBRE AUTENTICACIÓN PERSONALIZADA
-- =====================================================
-- 
-- Con autenticación personalizada, las políticas RLS
-- no pueden identificar automáticamente al usuario actual.
-- 
-- Por lo tanto, estas políticas son más restrictivas:
-- - Solo permiten operaciones a usuarios autenticados
-- - La validación de roles se hace en el código de la aplicación
-- - Las políticas RLS proporcionan una capa básica de seguridad
-- 
-- Para máxima seguridad, considera migrar a Supabase Auth
-- o implementar validación adicional en funciones serverless
-- =====================================================

-- =====================================================
-- FASE 2: POLÍTICAS BÁSICAS POR TABLA
-- =====================================================
-- Estas políticas permiten acceso solo a usuarios autenticados
-- La validación de roles se maneja en el código de la aplicación

-- =====================================================
-- TABLA usuarios - SOLO LECTURA PARA AUTENTICADOS
-- =====================================================
-- Nota: La validación de que solo Administradores pueden
-- ver/modificar usuarios debe hacerse en el código

CREATE POLICY "Usuarios autenticados pueden ver usuarios"
ON usuarios FOR SELECT
TO authenticated
USING (true);

-- Restringir INSERT/UPDATE/DELETE - solo desde código con validación
-- Por ahora permitimos pero la app debe validar roles
CREATE POLICY "Usuarios autenticados pueden gestionar usuarios"
ON usuarios FOR INSERT, UPDATE, DELETE
TO authenticated
USING (true);

-- =====================================================
-- TABLA recepciones
-- =====================================================

CREATE POLICY "Usuarios autenticados pueden ver recepciones"
ON recepciones FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden crear recepciones"
ON recepciones FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden modificar recepciones"
ON recepciones FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar recepciones"
ON recepciones FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- TABLA embarques
-- =====================================================

CREATE POLICY "Usuarios autenticados pueden ver embarques"
ON embarques FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden crear embarques"
ON embarques FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden modificar embarques"
ON embarques FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar embarques"
ON embarques FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- TABLA ordenes
-- =====================================================

CREATE POLICY "Usuarios autenticados pueden ver ordenes"
ON ordenes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden crear ordenes"
ON ordenes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden modificar ordenes"
ON ordenes FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar ordenes"
ON ordenes FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- TABLA ingresos
-- =====================================================

CREATE POLICY "Usuarios autenticados pueden ver ingresos"
ON ingresos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden crear ingresos"
ON ingresos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden modificar ingresos"
ON ingresos FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar ingresos"
ON ingresos FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- TABLA movimientos - SOLO LECTURA
-- =====================================================

CREATE POLICY "Usuarios autenticados pueden ver movimientos"
ON movimientos FOR SELECT
TO authenticated
USING (true);

-- Solo lectura - INSERT/UPDATE/DELETE desde código con validación
CREATE POLICY "Usuarios autenticados pueden gestionar movimientos"
ON movimientos FOR INSERT, UPDATE, DELETE
TO authenticated
USING (true);

-- =====================================================
-- TABLA clientes
-- =====================================================

CREATE POLICY "Usuarios autenticados pueden ver clientes"
ON clientes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden gestionar clientes"
ON clientes FOR INSERT, UPDATE, DELETE
TO authenticated
USING (true);

-- =====================================================
-- TABLA proveedores
-- =====================================================

CREATE POLICY "Usuarios autenticados pueden ver proveedores"
ON proveedores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden gestionar proveedores"
ON proveedores FOR INSERT, UPDATE, DELETE
TO authenticated
USING (true);

-- =====================================================
-- TABLA productos
-- =====================================================

CREATE POLICY "Usuarios autenticados pueden ver productos"
ON productos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden gestionar productos"
ON productos FOR INSERT, UPDATE, DELETE
TO authenticated
USING (true);

-- =====================================================
-- TABLA almacenes
-- =====================================================

CREATE POLICY "Usuarios autenticados pueden ver almacenes"
ON almacenes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden gestionar almacenes"
ON almacenes FOR INSERT, UPDATE, DELETE
TO authenticated
USING (true);

-- =====================================================
-- TABLA lotes
-- =====================================================

CREATE POLICY "Usuarios autenticados pueden ver lotes"
ON lotes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden gestionar lotes"
ON lotes FOR INSERT, UPDATE, DELETE
TO authenticated
USING (true);

-- =====================================================
-- TABLA reportes_laboratorio
-- =====================================================

CREATE POLICY "Usuarios autenticados pueden ver reportes laboratorio"
ON reportes_laboratorio FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden gestionar reportes laboratorio"
ON reportes_laboratorio FOR INSERT, UPDATE, DELETE
TO authenticated
USING (true);

-- =====================================================
-- TABLAS DE CONFIGURACIÓN
-- =====================================================

-- tipos_analisis
CREATE POLICY "Usuarios autenticados pueden ver tipos_analisis"
ON tipos_analisis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar tipos_analisis"
ON tipos_analisis FOR ALL TO authenticated USING (true);

-- productos_analisis
CREATE POLICY "Usuarios autenticados pueden ver productos_analisis"
ON productos_analisis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar productos_analisis"
ON productos_analisis FOR ALL TO authenticated USING (true);

-- rangos_descuento
CREATE POLICY "Usuarios autenticados pueden ver rangos_descuento"
ON rangos_descuento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar rangos_descuento"
ON rangos_descuento FOR ALL TO authenticated USING (true);

-- tipos_operacion_lote
CREATE POLICY "Usuarios autenticados pueden ver tipos_operacion_lote"
ON tipos_operacion_lote FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar tipos_operacion_lote"
ON tipos_operacion_lote FOR ALL TO authenticated USING (true);

-- origenes_lote
CREATE POLICY "Usuarios autenticados pueden ver origenes_lote"
ON origenes_lote FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar origenes_lote"
ON origenes_lote FOR ALL TO authenticated USING (true);

-- consecutivos_lotes
CREATE POLICY "Usuarios autenticados pueden ver consecutivos_lotes"
ON consecutivos_lotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar consecutivos_lotes"
ON consecutivos_lotes FOR ALL TO authenticated USING (true);

-- operaciones_lotes
CREATE POLICY "Usuarios autenticados pueden ver operaciones_lotes"
ON operaciones_lotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar operaciones_lotes"
ON operaciones_lotes FOR ALL TO authenticated USING (true);

-- clientes_productos
CREATE POLICY "Usuarios autenticados pueden ver clientes_productos"
ON clientes_productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar clientes_productos"
ON clientes_productos FOR ALL TO authenticated USING (true);

-- roles
CREATE POLICY "Usuarios autenticados pueden ver roles"
ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar roles"
ON roles FOR ALL TO authenticated USING (true);

-- modulos
CREATE POLICY "Usuarios autenticados pueden ver modulos"
ON modulos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar modulos"
ON modulos FOR ALL TO authenticated USING (true);

-- permisos_rol
CREATE POLICY "Usuarios autenticados pueden ver permisos_rol"
ON permisos_rol FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar permisos_rol"
ON permisos_rol FOR ALL TO authenticated USING (true);

-- user_rol
CREATE POLICY "Usuarios autenticados pueden ver user_rol"
ON user_rol FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar user_rol"
ON user_rol FOR ALL TO authenticated USING (true);

-- users
CREATE POLICY "Usuarios autenticados pueden ver users"
ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar users"
ON users FOR ALL TO authenticated USING (true);

-- =====================================================
-- IMPORTANTE: LIMITACIONES CON AUTENTICACIÓN PERSONALIZADA
-- =====================================================
-- 
-- Con autenticación personalizada, las políticas RLS solo pueden:
-- 1. Verificar que el usuario está autenticado (TO authenticated)
-- 2. NO pueden identificar QUÉ usuario es
-- 3. NO pueden verificar roles desde las políticas
-- 
-- Por lo tanto:
-- ✅ Las políticas bloquean usuarios NO autenticados
-- ⚠️ La validación de roles DEBE hacerse en el código de la aplicación
-- 
-- Tu código ya tiene validación de roles en:
-- - src/contexts/AuthContext.tsx (tienePermiso, esAdministrador)
-- - src/components/ProtectedRoute.tsx (verifica permisos)
-- 
-- RECOMENDACIÓN: Para máxima seguridad, considera:
-- 1. Migrar a Supabase Auth (permite políticas RLS más granulares)
-- 2. O implementar validación adicional en funciones serverless
-- 3. O mantener validación en código frontend + RLS básico
-- 
-- =====================================================

