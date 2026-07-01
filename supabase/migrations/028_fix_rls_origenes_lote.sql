-- Fix: deshabilitar RLS en origenes_lote para permitir acceso desde auth personalizada (rol anon)
ALTER TABLE public.origenes_lote DISABLE ROW LEVEL SECURITY;
