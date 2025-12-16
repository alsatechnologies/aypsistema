import { useState, useEffect } from 'react';
import * as proveedoresService from '../supabase/proveedores';
import type { Proveedor } from '../supabase/proveedores';

const ITEMS_POR_PAGINA = 50;

export function useProveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const loadProveedores = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setProveedores([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const offset = reset ? 0 : proveedores.length;
      const result = await proveedoresService.getProveedores({
        limit: ITEMS_POR_PAGINA,
        offset: offset
      });
      
      // Manejar tanto el formato antiguo (array) como el nuevo ({ data, count })
      const data = Array.isArray(result) ? result : (result.data || []);
      const count = Array.isArray(result) ? result.length : (result.count || 0);
      
      if (reset) {
        setProveedores(data);
      } else {
        setProveedores(prev => [...prev, ...data]);
      }
      
      setTotalCount(count);
      const currentLength = reset ? data.length : proveedores.length + data.length;
      setHasMore(currentLength < count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar proveedores'));
      console.error('Error loading proveedores:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore) {
      await loadProveedores(false);
    }
  };

  useEffect(() => {
    loadProveedores(true);
  }, []);

  const addProveedor = async (proveedor: Omit<Proveedor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const nuevo = await proveedoresService.createProveedor(proveedor);
      setProveedores([...proveedores, nuevo]);
      return nuevo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al crear proveedor'));
      throw err;
    }
  };

  const updateProveedor = async (id: number, proveedor: Partial<Proveedor>) => {
    try {
      const actualizado = await proveedoresService.updateProveedor(id, proveedor);
      setProveedores(proveedores.map(p => p.id === id ? actualizado : p));
      return actualizado;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar proveedor'));
      throw err;
    }
  };

  const deleteProveedor = async (id: number) => {
    try {
      await proveedoresService.deleteProveedor(id);
      setProveedores(proveedores.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al eliminar proveedor'));
      throw err;
    }
  };

  return {
    proveedores,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    loadProveedores,
    loadMore,
    addProveedor,
    updateProveedor,
    deleteProveedor
  };
}


