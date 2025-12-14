import { useState, useEffect } from 'react';
import * as movimientosService from '../supabase/movimientos';
import type { Movimiento } from '../supabase/movimientos';

export function useMovimientos(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  tipo?: string;
  producto_id?: number;
}) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMovimientos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await movimientosService.getMovimientos(filters);
      setMovimientos(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar movimientos'));
      console.error('Error loading movimientos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovimientos();
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
    error,
    loadMovimientos,
    addMovimiento,
    deleteMovimiento
  };
}

