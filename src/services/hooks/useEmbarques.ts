import { useState, useEffect } from 'react';
import * as embarquesService from '../supabase/embarques';
import type { Embarque } from '../supabase/embarques';

export function useEmbarques(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  estatus?: string;
  tipo_embarque?: string;
}) {
  const [embarques, setEmbarques] = useState<Embarque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadEmbarques = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await embarquesService.getEmbarques(filters);
      setEmbarques(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar embarques'));
      console.error('Error loading embarques:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmbarques();
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
    error,
    loadEmbarques,
    addEmbarque,
    updateEmbarque,
    deleteEmbarque
  };
}

