import { useState, useEffect } from 'react';
import * as ingresosService from '../supabase/ingresos';
import type { Ingreso } from '../supabase/ingresos';

const ITEMS_POR_PAGINA = 50;

export function useIngresos(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  motivo?: string;
  enviado_a_oficina?: boolean;
}) {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const loadIngresos = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setIngresos([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const offset = reset ? 0 : ingresos.length;
      const result = await ingresosService.getIngresos({
        ...filters,
        limit: ITEMS_POR_PAGINA,
        offset: offset
      });
      
      // Manejar tanto el formato antiguo (array) como el nuevo ({ data, count })
      const data = Array.isArray(result) ? result : (result.data || []);
      const count = Array.isArray(result) ? result.length : (result.count || 0);
      
      if (reset) {
        setIngresos(data);
      } else {
        setIngresos(prev => [...prev, ...data]);
      }
      
      setTotalCount(count);
      const currentLength = reset ? data.length : ingresos.length + data.length;
      setHasMore(currentLength < count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar ingresos'));
      console.error('Error loading ingresos:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore) {
      await loadIngresos(false);
    }
  };

  useEffect(() => {
    loadIngresos(true);
  }, [filters?.fechaDesde, filters?.fechaHasta, filters?.motivo, filters?.enviado_a_oficina]);

  const addIngreso = async (ingreso: Omit<Ingreso, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const nuevo = await ingresosService.createIngreso(ingreso);
      setIngresos([nuevo, ...ingresos]);
      return nuevo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al crear ingreso'));
      throw err;
    }
  };

  const updateIngreso = async (id: number, ingreso: Partial<Ingreso>) => {
    try {
      const actualizado = await ingresosService.updateIngreso(id, ingreso);
      setIngresos(ingresos.map(i => i.id === id ? actualizado : i));
      return actualizado;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar ingreso'));
      throw err;
    }
  };

  const deleteIngreso = async (id: number) => {
    try {
      await ingresosService.deleteIngreso(id);
      setIngresos(ingresos.filter(i => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al eliminar ingreso'));
      throw err;
    }
  };

  return {
    ingresos,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    loadIngresos,
    loadMore,
    addIngreso,
    updateIngreso,
    deleteIngreso
  };
}


