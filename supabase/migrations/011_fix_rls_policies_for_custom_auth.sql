-- Corregir políticas RLS para permitir acceso sin autenticación de Supabase
-- El sistema usa autenticación personalizada (tabla usuarios), no auth.users de Supabase
-- Por lo tanto, las políticas deben permitir acceso público o usar service_role

-- Eliminar políticas existentes que requieren autenticación
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.ordenes;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.embarques;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.recepciones;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.movimientos;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.ingresos;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.clientes;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.proveedores;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.productos;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.usuarios;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.almacenes;

-- Crear políticas que permiten acceso público (la aplicación maneja la autenticación)
-- NOTA: En producción, esto debería ser más restrictivo o usar service_role key

-- Tablas de operaciones (permitir acceso público ya que la app maneja auth)
CREATE POLICY "Allow all public access" ON public.ordenes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access" ON public.embarques FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access" ON public.recepciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access" ON public.movimientos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access" ON public.ingresos FOR ALL USING (true) WITH CHECK (true);

-- Tablas de catálogos (permitir acceso público ya que la app maneja auth)
CREATE POLICY "Allow all public access" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access" ON public.proveedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access" ON public.productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access" ON public.almacenes FOR ALL USING (true) WITH CHECK (true);

-- Eliminar políticas adicionales que requieren autenticación de Supabase
-- Estas políticas entran en conflicto con el acceso público necesario

-- Políticas de ordenes
DROP POLICY IF EXISTS "Solo oficina puede crear ordenes" ON public.ordenes;
DROP POLICY IF EXISTS "Solo oficina puede modificar ordenes" ON public.ordenes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver ordenes" ON public.ordenes;
DROP POLICY IF EXISTS "Solo administrador puede eliminar ordenes" ON public.ordenes;

-- Políticas de embarques
DROP POLICY IF EXISTS "Solo báscula puede crear embarques" ON public.embarques;
DROP POLICY IF EXISTS "Solo báscula puede modificar embarques" ON public.embarques;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver embarques" ON public.embarques;
DROP POLICY IF EXISTS "Solo administrador puede eliminar embarques" ON public.embarques;

-- Políticas de recepciones
DROP POLICY IF EXISTS "Solo báscula puede crear recepciones" ON public.recepciones;
DROP POLICY IF EXISTS "Solo báscula puede modificar recepciones" ON public.recepciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver recepciones" ON public.recepciones;
DROP POLICY IF EXISTS "Solo administrador puede eliminar recepciones" ON public.recepciones;

-- Políticas de clientes
DROP POLICY IF EXISTS "Solo oficina puede crear clientes" ON public.clientes;
DROP POLICY IF EXISTS "Solo oficina puede modificar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver clientes" ON public.clientes;
DROP POLICY IF EXISTS "Solo administrador puede eliminar clientes" ON public.clientes;

-- Políticas de proveedores
DROP POLICY IF EXISTS "Solo oficina puede crear proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Solo oficina puede modificar proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Solo administrador puede eliminar proveedores" ON public.proveedores;

-- Políticas de productos
DROP POLICY IF EXISTS "Solo administrador puede crear productos" ON public.productos;
DROP POLICY IF EXISTS "Solo administrador puede modificar productos" ON public.productos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver productos" ON public.productos;
DROP POLICY IF EXISTS "Solo administrador puede eliminar productos" ON public.productos;

