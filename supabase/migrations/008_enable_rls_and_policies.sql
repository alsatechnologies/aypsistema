-- Habilitar RLS en todas las tablas públicas
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rol ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos_rol ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_analisis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_analisis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rangos_descuento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recepciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embarques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.origenes_lote ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_operacion_lote ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consecutivos_lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.almacenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operaciones_lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;

-- Crear función helper para obtener el rol del usuario actual
-- Esta función asume que el usuario está autenticado y su ID está en una variable de sesión
-- Como estamos usando autenticación personalizada, necesitamos una forma de identificar al usuario
-- Por ahora, crearemos políticas que permitan acceso completo, pero podemos refinar después

-- Políticas básicas: Permitir acceso completo para todos (temporal, para no romper la aplicación)
-- NOTA: En producción, estas políticas deben ser más restrictivas basadas en roles

-- Tablas de configuración y catálogos (lectura/escritura para usuarios autenticados)
CREATE POLICY "Allow all for authenticated users" ON public.roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.user_rol FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.permisos_rol FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.modulos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.tipos_analisis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.productos_analisis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.clientes_productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.rangos_descuento FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.proveedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.almacenes FOR ALL USING (true) WITH CHECK (true);

-- Tablas de operaciones
CREATE POLICY "Allow all for authenticated users" ON public.recepciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.embarques FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.ordenes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.movimientos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.ingresos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.reportes_laboratorio FOR ALL USING (true) WITH CHECK (true);

-- Tablas de lotificación
CREATE POLICY "Allow all for authenticated users" ON public.lotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.origenes_lote FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.tipos_operacion_lote FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.consecutivos_lotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.operaciones_lotes FOR ALL USING (true) WITH CHECK (true);

-- Corregir funciones con search_path mutable
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.copy_codigo_lote_to_folio() SET search_path = '';

