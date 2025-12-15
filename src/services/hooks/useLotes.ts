import { useState, useEffect } from 'react';
import { 
  getLotes, 
  createLote, 
  updateLote,
  deleteLote,
  getTiposOperacionLote,
  getOrigenesLote,
  generarCodigoLote,
  Lote,
  TipoOperacionLote,
  OrigenLote
} from '../supabase/lotes';
import { toast } from 'sonner';

export function useLotes() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [tiposOperacion, setTiposOperacion] = useState<TipoOperacionLote[]>([]);
  const [origenes, setOrigenes] = useState<OrigenLote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLotes = async (filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLotes(filters);
      setLotes(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar lotes';
      setError(errorMessage);
      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadTiposOperacion = async () => {
    try {
      const data = await getTiposOperacionLote();
      setTiposOperacion(data);
    } catch (err) {
      console.error('Error al cargar tipos de operación:', err);
    }
  };

  const loadOrigenes = async () => {
    try {
      const data = await getOrigenesLote();
      setOrigenes(data);
    } catch (err) {
      console.error('Error al cargar orígenes:', err);
    }
  };

  useEffect(() => {
    loadLotes();
    loadTiposOperacion();
    loadOrigenes();
  }, []);

  const addLote = async (lote: Omit<Lote, 'id' | 'codigo_lote' | 'created_at' | 'updated_at'>) => {
    try {
      const nuevo = await createLote(lote);
      setLotes(prev => [nuevo, ...prev]);
      toast.success('Lote creado exitosamente');
      return nuevo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear lote';
      toast.error(errorMessage);
      throw err;
    }
  };

  const editLote = async (id: number, lote: Partial<Lote>) => {
    try {
      const actualizado = await updateLote(id, lote);
      setLotes(prev => prev.map(l => l.id === id ? actualizado : l));
      toast.success('Lote actualizado exitosamente');
      return actualizado;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar lote';
      toast.error(errorMessage);
      throw err;
    }
  };

  const removeLote = async (id: number) => {
    try {
      await deleteLote(id);
      setLotes(prev => prev.filter(l => l.id !== id));
      toast.success('Lote eliminado exitosamente');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar lote';
      toast.error(errorMessage);
      throw err;
    }
  };

  const generarCodigo = async (
    tipoOperacionCodigo: string,
    origenCodigo: string,
    productoCodigo: string,
    almacenCodigo: string,
    anioCodigo: string,
    anio: number
  ) => {
    try {
      return await generarCodigoLote(
        tipoOperacionCodigo,
        origenCodigo,
        productoCodigo,
        almacenCodigo,
        anioCodigo,
        anio
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar código';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    lotes,
    tiposOperacion,
    origenes,
    loading,
    error,
    loadLotes,
    addLote,
    editLote,
    removeLote,
    generarCodigo
  };
}


