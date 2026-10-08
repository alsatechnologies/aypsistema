-- ============================================
-- MIGRACIÓN 036: % DE PASTA EN PASE A PRODUCCIÓN
-- ============================================
-- Fecha: 2026-10-08
-- El rendimiento de pasta se conoce al día siguiente del pase y se captura una sola vez.
-- kg de pasta = peso_neto × porcentaje_pasta / 100
-- Esos kg entran al inventario de la bodega de pasta (almacen_pasta_id) como el
-- producto de pasta que corresponde a la semilla (producto_pasta_id).
-- Reglas:
--   - % de pasta, bodega y producto de pasta se capturan juntos
--   - una vez registrados solo Báscula o Administrador pueden corregirlos
--     (rol del usuario de usuarios cuyo correo coincide con la sesión de Supabase Auth)
--   - pasta de cártamo solo a bodega de cártamo; pasta de girasol solo a bodega de girasol
-- ============================================

ALTER TABLE public.movimientos
  ADD COLUMN IF NOT EXISTS porcentaje_pasta NUMERIC
    CHECK (porcentaje_pasta IS NULL OR (porcentaje_pasta > 0 AND porcentaje_pasta <= 100)),
  ADD COLUMN IF NOT EXISTS almacen_pasta_id INTEGER REFERENCES public.almacenes(id),
  ADD COLUMN IF NOT EXISTS producto_pasta_id INTEGER REFERENCES public.productos(id);

CREATE INDEX IF NOT EXISTS idx_movimientos_pasta_almacen_producto
  ON public.movimientos (almacen_pasta_id, producto_pasta_id)
  WHERE porcentaje_pasta IS NOT NULL;

-- Nombre sin acentos y en minúsculas para comparar especie (cártamo / girasol)
CREATE OR REPLACE FUNCTION public.normalizar_nombre(texto TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT translate(lower(coalesce(texto, '')), 'áéíóúü', 'aeiouu');
$$;

-- SECURITY DEFINER: necesita leer usuarios para validar el rol aunque RLS lo restrinja
CREATE OR REPLACE FUNCTION public.validar_pasta_pase_produccion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_almacen TEXT;
  v_producto TEXT;
  v_rol TEXT;
BEGIN
  -- Una vez capturado, el % de pasta (y su bodega/producto) solo lo corrige Báscula o Administrador
  IF TG_OP = 'UPDATE' AND OLD.porcentaje_pasta IS NOT NULL AND (
       NEW.porcentaje_pasta IS DISTINCT FROM OLD.porcentaje_pasta
    OR NEW.almacen_pasta_id IS DISTINCT FROM OLD.almacen_pasta_id
    OR NEW.producto_pasta_id IS DISTINCT FROM OLD.producto_pasta_id
  ) THEN
    SELECT u.rol INTO v_rol
    FROM public.usuarios u
    WHERE lower(u.correo) = lower(auth.jwt() ->> 'email')
      AND u.activo = true
    LIMIT 1;

    IF v_rol IS NULL OR v_rol NOT IN ('Administrador', 'Báscula') THEN
      RAISE EXCEPTION 'El %% de pasta ya fue registrado; solo Báscula o Administración pueden corregirlo';
    END IF;

    IF NEW.porcentaje_pasta IS NULL THEN
      RAISE EXCEPTION 'El %% de pasta se puede corregir pero no borrar';
    END IF;
  END IF;

  IF NEW.porcentaje_pasta IS NULL AND NEW.almacen_pasta_id IS NULL AND NEW.producto_pasta_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.tipo <> 'Producción' THEN
    RAISE EXCEPTION 'El %% de pasta solo aplica a pases a producción';
  END IF;

  IF NEW.porcentaje_pasta IS NULL OR NEW.almacen_pasta_id IS NULL OR NEW.producto_pasta_id IS NULL THEN
    RAISE EXCEPTION 'El %% de pasta requiere la bodega y el producto de pasta';
  END IF;

  SELECT public.normalizar_nombre(nombre) INTO v_almacen FROM public.almacenes WHERE id = NEW.almacen_pasta_id;
  SELECT public.normalizar_nombre(nombre) INTO v_producto FROM public.productos WHERE id = NEW.producto_pasta_id;

  IF v_producto NOT LIKE '%pasta%' THEN
    RAISE EXCEPTION 'El producto de destino debe ser una pasta';
  END IF;

  IF (v_producto LIKE '%cartamo%' AND v_almacen NOT LIKE '%pasta%cartamo%')
     OR (v_producto LIKE '%girasol%' AND v_almacen NOT LIKE '%pasta%girasol%') THEN
    RAISE EXCEPTION 'La pasta debe ir a la bodega de pasta de su misma semilla (cártamo o girasol)';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_pasta_pase_produccion ON public.movimientos;
CREATE TRIGGER trg_validar_pasta_pase_produccion
  BEFORE INSERT OR UPDATE ON public.movimientos
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_pasta_pase_produccion();
