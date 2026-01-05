import { useState, useEffect, useCallback } from 'react';
import * as inventarioService from '@/services/supabase/inventarioAlmacenes';
import type { InventarioAlmacen } from '@/services/supabase/inventarioAlmacenes';
import { toast } from 'sonner';

export function useInventarioAlmacenes(almacenId?: number) {
  const [inventario, setInventario] = useState<InventarioAlmacen[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInventario = useCallback(async () => {
    if (!almacenId) {
      setInventario([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await inventarioService.getInventarioByAlmacen(almacenId);
      setInventario(data);
    } catch (error) {
      console.error('Error loading inventario:', error);
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  }, [almacenId]);

  const agregarProducto = useCallback(async (productoId: number, cantidad: number) => {
    if (!almacenId) return;
    
    try {
      await inventarioService.upsertInventarioAlmacen(almacenId, productoId, cantidad);
      // Actualizar capacidad_actual del almacén
      await inventarioService.actualizarCapacidadActualAlmacen(almacenId);
      await loadInventario();
      toast.success('Producto agregado al inventario');
    } catch (error) {
      console.error('Error adding producto:', error);
      toast.error('Error al agregar producto');
      throw error;
    }
  }, [almacenId, loadInventario]);

  const actualizarCantidad = useCallback(async (id: number, cantidad: number) => {
    if (!almacenId) return;
    
    try {
      const item = inventario.find(i => i.id === id);
      if (!item) return;
      
      await inventarioService.upsertInventarioAlmacen(almacenId, item.producto_id, cantidad);
      // Actualizar capacidad_actual del almacén
      await inventarioService.actualizarCapacidadActualAlmacen(almacenId);
      await loadInventario();
      toast.success('Cantidad actualizada');
    } catch (error) {
      console.error('Error updating cantidad:', error);
      toast.error('Error al actualizar cantidad');
      throw error;
    }
  }, [almacenId, inventario, loadInventario]);

  const eliminarProducto = useCallback(async (id: number) => {
    if (!almacenId) return;
    
    try {
      await inventarioService.deleteInventarioAlmacen(id);
      // Actualizar capacidad_actual del almacén
      await inventarioService.actualizarCapacidadActualAlmacen(almacenId);
      await loadInventario();
      toast.success('Producto eliminado del inventario');
    } catch (error) {
      console.error('Error deleting producto:', error);
      toast.error('Error al eliminar producto');
      throw error;
    }
  }, [almacenId, loadInventario]);

  useEffect(() => {
    loadInventario();
  }, [loadInventario]);

  return {
    inventario,
    loading,
    loadInventario,
    agregarProducto,
    actualizarCantidad,
    eliminarProducto,
  };
}

