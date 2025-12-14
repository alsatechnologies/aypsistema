import { useState, useEffect } from 'react';
import * as ingresosService from '../supabase/ingresos';
import type { Ingreso } from '../supabase/ingresos';

export function useIngresos(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  motivo?: string;
  enviado_a_oficina?: boolean;
}) {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadIngresos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ingresosService.getIngresos(filters);
      setIngresos(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar ingresos'));
      console.error('Error loading ingresos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngresos();
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
    error,
    loadIngresos,
    addIngreso,
    updateIngreso,
    deleteIngreso
  };
}

