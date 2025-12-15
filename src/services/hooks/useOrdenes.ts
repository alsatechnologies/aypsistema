import { useState, useEffect } from 'react';
import * as ordenesService from '../supabase/ordenes';
import type { Orden } from '../supabase/ordenes';

export function useOrdenes(filters?: {
  estatus?: string;
  tipo_operacion?: string;
}) {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadOrdenes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordenesService.getOrdenes(filters);
      setOrdenes(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar órdenes'));
      console.error('Error loading ordenes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdenes();
  }, [filters?.estatus, filters?.tipo_operacion]);

  const addOrden = async (orden: Omit<Orden, 'id' | 'created_at' | 'updated_at' | 'producto' | 'cliente'>) => {
    try {
      const nueva = await ordenesService.createOrden(orden);
      setOrdenes([nueva, ...ordenes]);
      return nueva;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al crear orden'));
      throw err;
    }
  };

  const updateOrden = async (id: number, orden: Partial<Orden>) => {
    try {
      const actualizada = await ordenesService.updateOrden(id, orden);
      setOrdenes(ordenes.map(o => o.id === id ? actualizada : o));
      return actualizada;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar orden'));
      throw err;
    }
  };

  const deleteOrden = async (id: number) => {
    try {
      await ordenesService.deleteOrden(id);
      setOrdenes(ordenes.filter(o => o.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al eliminar orden'));
      throw err;
    }
  };

  return {
    ordenes,
    loading,
    error,
    loadOrdenes,
    addOrden,
    updateOrden,
    deleteOrden
  };
}


