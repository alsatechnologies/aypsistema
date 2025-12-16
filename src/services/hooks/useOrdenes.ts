import { useState, useEffect } from 'react';
import * as ordenesService from '../supabase/ordenes';
import type { Orden } from '../supabase/ordenes';

const ORDENES_POR_PAGINA = 50;

export function useOrdenes(filters?: {
  estatus?: string;
  tipo_operacion?: string;
}) {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const loadOrdenes = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setOrdenes([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const offset = reset ? 0 : ordenes.length;
      const result = await ordenesService.getOrdenes({
        ...filters,
        limit: ORDENES_POR_PAGINA,
        offset: offset
      });
      
      // Manejar tanto el formato antiguo (array) como el nuevo ({ data, count })
      const data = Array.isArray(result) ? result : (result.data || []);
      const count = Array.isArray(result) ? result.length : (result.count || 0);
      
      if (reset) {
        setOrdenes(data);
      } else {
        setOrdenes(prev => [...prev, ...data]);
      }
      
      setTotalCount(count);
      const currentLength = reset ? data.length : ordenes.length + data.length;
      setHasMore(currentLength < count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar órdenes'));
      console.error('Error loading ordenes:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore) {
      await loadOrdenes(false);
    }
  };

  useEffect(() => {
    loadOrdenes(true);
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
    loadingMore,
    error,
    hasMore,
    totalCount,
    loadOrdenes,
    loadMore,
    addOrden,
    updateOrden,
    deleteOrden
  };
}


