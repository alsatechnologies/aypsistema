-- =====================================================
-- SCRIPT DE POLÍTICAS RLS DE SEGURIDAD
-- Proyecto: Aceites y Proteínas
-- Fecha: 12 de Diciembre, 2024
-- =====================================================
-- 
-- IMPORTANTE: Ejecutar este script en orden
-- 1. Primero eliminar políticas genéricas
-- 2. Luego crear políticas específicas
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
-- FASE 2: POLÍTICAS PARA TABLA usuarios (CRÍTICO)
-- =====================================================

-- Solo Administradores pueden ver usuarios (sin contraseñas)
CREATE POLICY "Solo administradores pueden ver usuarios"
ON usuarios FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- Solo Administradores pueden crear usuarios
CREATE POLICY "Solo administradores pueden crear usuarios"
ON usuarios FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- Solo Administradores pueden modificar usuarios
CREATE POLICY "Solo administradores pueden modificar usuarios"
ON usuarios FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- Solo Administradores pueden eliminar usuarios
CREATE POLICY "Solo administradores pueden eliminar usuarios"
ON usuarios FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- =====================================================
-- FASE 3: POLÍTICAS PARA recepciones
-- =====================================================

-- Todos los usuarios autenticados pueden ver recepciones
CREATE POLICY "Usuarios autenticados pueden ver recepciones"
ON recepciones FOR SELECT
TO authenticated
USING (true);

-- Solo Báscula y Administrador pueden crear recepciones
CREATE POLICY "Solo báscula puede crear recepciones"
ON recepciones FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol IN ('Báscula', 'Administrador')
  )
);

-- Solo Báscula y Administrador pueden modificar recepciones
CREATE POLICY "Solo báscula puede modificar recepciones"
ON recepciones FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol IN ('Báscula', 'Administrador')
  )
);

-- Solo Administrador puede eliminar recepciones
CREATE POLICY "Solo administrador puede eliminar recepciones"
ON recepciones FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- =====================================================
-- FASE 4: POLÍTICAS PARA embarques
-- =====================================================

-- Todos los usuarios autenticados pueden ver embarques
CREATE POLICY "Usuarios autenticados pueden ver embarques"
ON embarques FOR SELECT
TO authenticated
USING (true);

-- Solo Báscula y Administrador pueden crear embarques
CREATE POLICY "Solo báscula puede crear embarques"
ON embarques FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol IN ('Báscula', 'Administrador')
  )
);

-- Solo Báscula y Administrador pueden modificar embarques
CREATE POLICY "Solo báscula puede modificar embarques"
ON embarques FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol IN ('Báscula', 'Administrador')
  )
);

-- Solo Administrador puede eliminar embarques
CREATE POLICY "Solo administrador puede eliminar embarques"
ON embarques FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- =====================================================
-- FASE 5: POLÍTICAS PARA ordenes
-- =====================================================

-- Todos los usuarios autenticados pueden ver órdenes
CREATE POLICY "Usuarios autenticados pueden ver ordenes"
ON ordenes FOR SELECT
TO authenticated
USING (true);

-- Solo Oficina y Administrador pueden crear órdenes
CREATE POLICY "Solo oficina puede crear ordenes"
ON ordenes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol IN ('Oficina', 'Administrador')
  )
);

-- Solo Oficina y Administrador pueden modificar órdenes
CREATE POLICY "Solo oficina puede modificar ordenes"
ON ordenes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol IN ('Oficina', 'Administrador')
  )
);

-- Solo Administrador puede eliminar órdenes
CREATE POLICY "Solo administrador puede eliminar ordenes"
ON ordenes FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- =====================================================
-- FASE 6: POLÍTICAS PARA ingresos
-- =====================================================

-- Todos los usuarios autenticados pueden ver ingresos
CREATE POLICY "Usuarios autenticados pueden ver ingresos"
ON ingresos FOR SELECT
TO authenticated
USING (true);

-- Solo Portero y Administrador pueden crear ingresos
CREATE POLICY "Solo portero puede crear ingresos"
ON ingresos FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol IN ('Portero', 'Administrador')
  )
);

-- Solo Portero y Administrador pueden modificar ingresos
CREATE POLICY "Solo portero puede modificar ingresos"
ON ingresos FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol IN ('Portero', 'Administrador')
  )
);

-- Solo Administrador puede eliminar ingresos
CREATE POLICY "Solo administrador puede eliminar ingresos"
ON ingresos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- =====================================================
-- FASE 7: POLÍTICAS PARA movimientos (Solo lectura)
-- =====================================================

-- Todos pueden ver movimientos (solo lectura)
CREATE POLICY "Usuarios autenticados pueden ver movimientos"
ON movimientos FOR SELECT
TO authenticated
USING (true);

-- Solo Administrador puede crear/modificar/eliminar movimientos
CREATE POLICY "Solo administrador puede gestionar movimientos"
ON movimientos FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- =====================================================
-- FASE 8: POLÍTICAS PARA clientes
-- =====================================================

-- Todos pueden ver clientes
CREATE POLICY "Usuarios autenticados pueden ver clientes"
ON clientes FOR SELECT
TO authenticated
USING (true);

-- Solo Oficina y Administrador pueden gestionar clientes
CREATE POLICY "Solo oficina puede gestionar clientes"
ON clientes FOR INSERT, UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol IN ('Oficina', 'Administrador')
  )
);

CREATE POLICY "Solo administrador puede eliminar clientes"
ON clientes FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- =====================================================
-- FASE 9: POLÍTICAS PARA proveedores
-- =====================================================

-- Todos pueden ver proveedores
CREATE POLICY "Usuarios autenticados pueden ver proveedores"
ON proveedores FOR SELECT
TO authenticated
USING (true);

-- Solo Oficina y Administrador pueden gestionar proveedores
CREATE POLICY "Solo oficina puede gestionar proveedores"
ON proveedores FOR INSERT, UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol IN ('Oficina', 'Administrador')
  )
);

CREATE POLICY "Solo administrador puede eliminar proveedores"
ON proveedores FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- =====================================================
-- FASE 10: POLÍTICAS PARA productos (Solo lectura general)
-- =====================================================

-- Todos pueden ver productos
CREATE POLICY "Usuarios autenticados pueden ver productos"
ON productos FOR SELECT
TO authenticated
USING (true);

-- Solo Administrador puede gestionar productos
CREATE POLICY "Solo administrador puede gestionar productos"
ON productos FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- =====================================================
-- FASE 11: POLÍTICAS PARA almacenes (Solo lectura general)
-- =====================================================

-- Todos pueden ver almacenes
CREATE POLICY "Usuarios autenticados pueden ver almacenes"
ON almacenes FOR SELECT
TO authenticated
USING (true);

-- Solo Administrador puede gestionar almacenes
CREATE POLICY "Solo administrador puede gestionar almacenes"
ON almacenes FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- =====================================================
-- FASE 12: POLÍTICAS PARA lotes (Solo lectura general)
-- =====================================================

-- Todos pueden ver lotes
CREATE POLICY "Usuarios autenticados pueden ver lotes"
ON lotes FOR SELECT
TO authenticated
USING (true);

-- Solo Administrador puede gestionar lotes
CREATE POLICY "Solo administrador puede gestionar lotes"
ON lotes FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- =====================================================
-- FASE 13: POLÍTICAS PARA reportes_laboratorio
-- =====================================================

-- Todos pueden ver reportes de laboratorio
CREATE POLICY "Usuarios autenticados pueden ver reportes laboratorio"
ON reportes_laboratorio FOR SELECT
TO authenticated
USING (true);

-- Solo Laboratorio y Administrador pueden gestionar reportes
CREATE POLICY "Solo laboratorio puede gestionar reportes"
ON reportes_laboratorio FOR INSERT, UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol IN ('Laboratorio', 'Administrador')
  )
);

CREATE POLICY "Solo administrador puede eliminar reportes"
ON reportes_laboratorio FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- =====================================================
-- FASE 14: POLÍTICAS PARA tablas de configuración
-- =====================================================

-- Tablas de solo lectura para usuarios normales
-- Solo Administrador puede modificar

-- tipos_analisis
CREATE POLICY "Usuarios autenticados pueden ver tipos_analisis"
ON tipos_analisis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo administrador puede gestionar tipos_analisis"
ON tipos_analisis FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- productos_analisis
CREATE POLICY "Usuarios autenticados pueden ver productos_analisis"
ON productos_analisis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo administrador puede gestionar productos_analisis"
ON productos_analisis FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- rangos_descuento
CREATE POLICY "Usuarios autenticados pueden ver rangos_descuento"
ON rangos_descuento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo administrador puede gestionar rangos_descuento"
ON rangos_descuento FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- tipos_operacion_lote
CREATE POLICY "Usuarios autenticados pueden ver tipos_operacion_lote"
ON tipos_operacion_lote FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo administrador puede gestionar tipos_operacion_lote"
ON tipos_operacion_lote FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- origenes_lote
CREATE POLICY "Usuarios autenticados pueden ver origenes_lote"
ON origenes_lote FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo administrador puede gestionar origenes_lote"
ON origenes_lote FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- consecutivos_lotes
CREATE POLICY "Usuarios autenticados pueden ver consecutivos_lotes"
ON consecutivos_lotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo administrador puede gestionar consecutivos_lotes"
ON consecutivos_lotes FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- operaciones_lotes
CREATE POLICY "Usuarios autenticados pueden ver operaciones_lotes"
ON operaciones_lotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo administrador puede gestionar operaciones_lotes"
ON operaciones_lotes FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- clientes_productos
CREATE POLICY "Usuarios autenticados pueden ver clientes_productos"
ON clientes_productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo administrador puede gestionar clientes_productos"
ON clientes_productos FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- roles, modulos, permisos_rol, user_rol, users
-- Estas tablas solo para Administrador
CREATE POLICY "Solo administrador puede ver roles"
ON roles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);
CREATE POLICY "Solo administrador puede gestionar roles"
ON roles FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

CREATE POLICY "Solo administrador puede ver modulos"
ON modulos FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);
CREATE POLICY "Solo administrador puede gestionar modulos"
ON modulos FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

CREATE POLICY "Solo administrador puede ver permisos_rol"
ON permisos_rol FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);
CREATE POLICY "Solo administrador puede gestionar permisos_rol"
ON permisos_rol FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

CREATE POLICY "Solo administrador puede ver user_rol"
ON user_rol FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);
CREATE POLICY "Solo administrador puede gestionar user_rol"
ON user_rol FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

CREATE POLICY "Solo administrador puede ver users"
ON users FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);
CREATE POLICY "Solo administrador puede gestionar users"
ON users FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1)
    AND rol = 'Administrador'
  )
);

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 
-- 1. Este script asume que tienes autenticación configurada
--    con Supabase Auth y que auth.email() está disponible
-- 
-- 2. Si usas un sistema de autenticación diferente, necesitarás
--    ajustar las políticas para usar tu método de identificación
--    de usuario (por ejemplo, auth.uid() si usas UUIDs)
-- 
-- 3. Las políticas verifican el rol del usuario desde la tabla
--    usuarios usando el correo electrónico del usuario autenticado
-- 
-- 4. Después de ejecutar este script, prueba cada módulo para
--    asegurarte de que los permisos funcionan correctamente
-- 
-- 5. Considera crear una función helper para obtener el usuario
--    actual de manera más eficiente:
-- 
--    CREATE OR REPLACE FUNCTION get_current_user_id()
--    RETURNS INTEGER AS $$
--    BEGIN
--      RETURN (SELECT id FROM usuarios WHERE correo = auth.email() LIMIT 1);
--    END;
--    $$ LANGUAGE plpgsql SECURITY DEFINER;
-- 
-- =====================================================

