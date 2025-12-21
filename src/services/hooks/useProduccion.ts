import { useState, useEffect } from 'react';
import * as produccionService from '../supabase/produccion';
import type { ReporteProduccion } from '../supabase/produccion';

export function useProduccion(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  estatus?: string;
}) {
  const [reportes, setReportes] = useState<ReporteProduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadReportes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await produccionService.getReportesProduccion(filters);
      setReportes(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar reportes'));
      console.error('Error loading reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportes();
  }, [filters?.fechaDesde, filters?.fechaHasta, filters?.estatus]);

  const addReporte = async (reporte: Omit<ReporteProduccion, 'created_at' | 'updated_at' | 'activo'>) => {
    try {
      // Generar ID si no se proporciona
      if (!reporte.id) {
        reporte.id = await produccionService.getSiguienteIdReporteProduccion();
      }
      
      const nuevo = await produccionService.createReporteProduccion(reporte);
      setReportes([nuevo, ...reportes]);
      return nuevo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al crear reporte'));
      throw err;
    }
  };

  const updateReporte = async (id: string, reporte: Partial<ReporteProduccion>) => {
    try {
      const actualizado = await produccionService.updateReporteProduccion(id, reporte);
      setReportes(reportes.map(r => r.id === id ? actualizado : r));
      return actualizado;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar reporte'));
      throw err;
    }
  };

  const deleteReporte = async (id: string) => {
    try {
      await produccionService.deleteReporteProduccion(id);
      setReportes(reportes.filter(r => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al eliminar reporte'));
      throw err;
    }
  };

  return {
    reportes,
    loading,
    error,
    loadReportes,
    addReporte,
    updateReporte,
    deleteReporte
  };
}

