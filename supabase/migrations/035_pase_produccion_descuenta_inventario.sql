-- ============================================
-- MIGRACIÓN 035: PASE A PRODUCCIÓN DESCUENTA INVENTARIO
-- ============================================
-- Fecha: 2026-10-08
-- - movimientos.almacen_id: almacén de donde sale la semilla del pase
-- - inventario_almacenes.base_max_pase_id: corte para recalcularInventarioDesdeBase
--   (los pases anteriores no tienen almacen_id, así que no cambian el inventario actual)
-- - Trigger: un pase solo se registra si el almacén tiene ese producto y alcanza la cantidad
-- ============================================

ALTER TABLE public.movimientos
  ADD COLUMN IF NOT EXISTS almacen_id INTEGER REFERENCES public.almacenes(id);

ALTER TABLE public.inventario_almacenes
  ADD COLUMN IF NOT EXISTS base_max_pase_id INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_movimientos_pase_almacen_producto
  ON public.movimientos (almacen_id, producto_id)
  WHERE tipo = 'Producción';

CREATE OR REPLACE FUNCTION public.validar_pase_produccion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_disponible NUMERIC;
BEGIN
  IF NEW.tipo <> 'Producción' THEN
    RETURN NEW;
  END IF;

  IF NEW.almacen_id IS NULL THEN
    RAISE EXCEPTION 'El pase a producción requiere el almacén de procedencia';
  END IF;

  IF NEW.producto_id IS NULL THEN
    RAISE EXCEPTION 'El pase a producción requiere el producto';
  END IF;

  SELECT cantidad INTO v_disponible
  FROM public.inventario_almacenes
  WHERE almacen_id = NEW.almacen_id
    AND producto_id = NEW.producto_id;

  IF v_disponible IS NULL OR v_disponible <= 0 THEN
    RAISE EXCEPTION 'El almacén seleccionado no tiene inventario de ese producto';
  END IF;

  IF COALESCE(NEW.peso_neto, 0) <= 0 THEN
    RAISE EXCEPTION 'La cantidad del pase debe ser mayor a cero';
  END IF;

  IF NEW.peso_neto > v_disponible THEN
    RAISE EXCEPTION 'Inventario insuficiente: hay % kg disponibles en el almacén', v_disponible;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_pase_produccion ON public.movimientos;
CREATE TRIGGER trg_validar_pase_produccion
  BEFORE INSERT ON public.movimientos
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_pase_produccion();
