import { useState, useEffect } from 'react';
import * as almacenesService from '../supabase/almacenes';
import type { Almacen } from '../supabase/almacenes';

export function useAlmacenes() {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadAlmacenes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await almacenesService.getAlmacenes();
      setAlmacenes(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar almacenes'));
      console.error('Error loading almacenes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlmacenes();
  }, []);

  const addAlmacen = async (almacen: Omit<Almacen, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const nuevo = await almacenesService.createAlmacen(almacen);
      setAlmacenes([...almacenes, nuevo]);
      return nuevo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al crear almacén'));
      throw err;
    }
  };

  const updateAlmacen = async (id: number, almacen: Partial<Almacen>) => {
    try {
      const actualizado = await almacenesService.updateAlmacen(id, almacen);
      setAlmacenes(almacenes.map(a => a.id === id ? actualizado : a));
      return actualizado;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar almacén'));
      throw err;
    }
  };

  const deleteAlmacen = async (id: number) => {
    try {
      await almacenesService.deleteAlmacen(id);
      setAlmacenes(almacenes.filter(a => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al eliminar almacén'));
      throw err;
    }
  };

  return {
    almacenes,
    loading,
    error,
    loadAlmacenes,
    addAlmacen,
    updateAlmacen,
    deleteAlmacen
  };
}


