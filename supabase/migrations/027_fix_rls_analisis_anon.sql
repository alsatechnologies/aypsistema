-- Fix: permitir acceso anon a tablas de análisis de productos
-- El sistema usa auth personalizada (rol anon en Supabase), no Supabase Auth.
-- Las políticas anteriores podían estar restringidas a 'authenticated' implícitamente.

-- Deshabilitar RLS en tablas de catálogo de análisis para permitir acceso desde app
ALTER TABLE public.tipos_analisis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_analisis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rangos_descuento DISABLE ROW LEVEL SECURITY;
