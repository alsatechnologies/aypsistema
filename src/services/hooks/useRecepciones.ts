import { useState, useEffect } from 'react';
import * as recepcionesService from '../supabase/recepciones';
import type { Recepcion } from '../supabase/recepciones';

const ITEMS_POR_PAGINA = 50;

export function useRecepciones(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  estatus?: string;
  producto_id?: number;
}) {
  const [recepciones, setRecepciones] = useState<Recepcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const loadRecepciones = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setRecepciones([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const offset = reset ? 0 : recepciones.length;
      const result = await recepcionesService.getRecepciones({
        ...filters,
        limit: ITEMS_POR_PAGINA,
        offset: offset
      });
      
      // Manejar tanto el formato antiguo (array) como el nuevo ({ data, count })
      const data = Array.isArray(result) ? result : (result.data || []);
      const count = Array.isArray(result) ? result.length : (result.count || 0);
      
      if (reset) {
        setRecepciones(data);
      } else {
        setRecepciones(prev => [...prev, ...data]);
      }
      
      setTotalCount(count);
      const currentLength = reset ? data.length : recepciones.length + data.length;
      setHasMore(currentLength < count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar recepciones'));
      console.error('Error loading recepciones:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore) {
      await loadRecepciones(false);
    }
  };

  useEffect(() => {
    loadRecepciones(true);
  }, [filters?.fechaDesde, filters?.fechaHasta, filters?.estatus, filters?.producto_id]);

  const addRecepcion = async (recepcion: Omit<Recepcion, 'id' | 'created_at' | 'updated_at' | 'producto' | 'proveedor'>) => {
    try {
      const nueva = await recepcionesService.createRecepcion(recepcion);
      setRecepciones([nueva, ...recepciones]);
      return nueva;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al crear recepción'));
      throw err;
    }
  };

  const updateRecepcion = async (id: number, recepcion: Partial<Recepcion>) => {
    try {
      const actualizada = await recepcionesService.updateRecepcion(id, recepcion);
      setRecepciones(recepciones.map(r => r.id === id ? actualizada : r));
      return actualizada;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar recepción'));
      throw err;
    }
  };

  const deleteRecepcion = async (id: number) => {
    try {
      await recepcionesService.deleteRecepcion(id);
      setRecepciones(recepciones.filter(r => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al eliminar recepción'));
      throw err;
    }
  };

  return {
    recepciones,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    loadRecepciones,
    loadMore,
    addRecepcion,
    updateRecepcion,
    deleteRecepcion
  };
}


