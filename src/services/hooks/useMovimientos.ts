import { useState, useEffect } from 'react';
import * as movimientosService from '../supabase/movimientos';
import type { Movimiento } from '../supabase/movimientos';

const ITEMS_POR_PAGINA = 50;

export function useMovimientos(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  tipo?: string;
  producto_id?: number;
}) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const loadMovimientos = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setMovimientos([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const offset = reset ? 0 : movimientos.length;
      const result = await movimientosService.getMovimientos({
        ...filters,
        limit: ITEMS_POR_PAGINA,
        offset: offset
      });
      
      // Manejar tanto el formato antiguo (array) como el nuevo ({ data, count })
      const data = Array.isArray(result) ? result : (result.data || []);
      const count = Array.isArray(result) ? result.length : (result.count || 0);
      
      if (reset) {
        setMovimientos(data);
      } else {
        setMovimientos(prev => [...prev, ...data]);
      }
      
      setTotalCount(count);
      const currentLength = reset ? data.length : movimientos.length + data.length;
      setHasMore(currentLength < count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar movimientos'));
      console.error('Error loading movimientos:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore) {
      await loadMovimientos(false);
    }
  };

  useEffect(() => {
    loadMovimientos(true);
  }, [filters?.fechaDesde, filters?.fechaHasta, filters?.tipo, filters?.producto_id]);

  const addMovimiento = async (movimiento: Omit<Movimiento, 'id' | 'created_at' | 'producto'>) => {
    try {
      const nuevo = await movimientosService.createMovimiento(movimiento);
      setMovimientos([nuevo, ...movimientos]);
      return nuevo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al crear movimiento'));
      throw err;
    }
  };

  const deleteMovimiento = async (id: number) => {
    try {
      await movimientosService.deleteMovimiento(id);
      setMovimientos(movimientos.filter(m => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al eliminar movimiento'));
      throw err;
    }
  };

  return {
    movimientos,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    loadMovimientos,
    loadMore,
    addMovimiento,
    deleteMovimiento
  };
}


