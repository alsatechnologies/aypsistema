import { useState, useEffect } from 'react';
import * as recepcionesService from '../supabase/recepciones';
import type { Recepcion } from '../supabase/recepciones';

export function useRecepciones(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  estatus?: string;
  producto_id?: number;
}) {
  const [recepciones, setRecepciones] = useState<Recepcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadRecepciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recepcionesService.getRecepciones(filters);
      setRecepciones(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar recepciones'));
      console.error('Error loading recepciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecepciones();
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
    error,
    loadRecepciones,
    addRecepcion,
    updateRecepcion,
    deleteRecepcion
  };
}


