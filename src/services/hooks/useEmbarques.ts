import { useState, useEffect } from 'react';
import * as embarquesService from '../supabase/embarques';
import type { Embarque } from '../supabase/embarques';

const ITEMS_POR_PAGINA = 50;

export function useEmbarques(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  estatus?: string;
  tipo_embarque?: string;
}) {
  const [embarques, setEmbarques] = useState<Embarque[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const loadEmbarques = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setEmbarques([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const offset = reset ? 0 : embarques.length;
      const result = await embarquesService.getEmbarques({
        ...filters,
        limit: ITEMS_POR_PAGINA,
        offset: offset
      });
      
      // Manejar tanto el formato antiguo (array) como el nuevo ({ data, count })
      const data = Array.isArray(result) ? result : (result.data || []);
      const count = Array.isArray(result) ? result.length : (result.count || 0);
      
      if (reset) {
        setEmbarques(data);
      } else {
        setEmbarques(prev => [...prev, ...data]);
      }
      
      setTotalCount(count);
      const currentLength = reset ? data.length : embarques.length + data.length;
      setHasMore(currentLength < count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar embarques'));
      console.error('Error loading embarques:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore) {
      await loadEmbarques(false);
    }
  };

  useEffect(() => {
    loadEmbarques(true);
  }, [filters?.fechaDesde, filters?.fechaHasta, filters?.estatus, filters?.tipo_embarque]);

  const addEmbarque = async (embarque: Omit<Embarque, 'id' | 'created_at' | 'updated_at' | 'producto' | 'cliente'>) => {
    try {
      const nuevo = await embarquesService.createEmbarque(embarque);
      setEmbarques([nuevo, ...embarques]);
      return nuevo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al crear embarque'));
      throw err;
    }
  };

  const updateEmbarque = async (id: number, embarque: Partial<Embarque>) => {
    try {
      const actualizado = await embarquesService.updateEmbarque(id, embarque);
      setEmbarques(embarques.map(e => e.id === id ? actualizado : e));
      return actualizado;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar embarque'));
      throw err;
    }
  };

  const deleteEmbarque = async (id: number) => {
    try {
      await embarquesService.deleteEmbarque(id);
      setEmbarques(embarques.filter(e => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al eliminar embarque'));
      throw err;
    }
  };

  return {
    embarques,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    loadEmbarques,
    loadMore,
    addEmbarque,
    updateEmbarque,
    deleteEmbarque
  };
}


