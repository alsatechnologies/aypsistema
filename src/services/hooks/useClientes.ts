import { useState, useEffect } from 'react';
import * as clientesService from '../supabase/clientes';
import type { Cliente } from '../supabase/clientes';

const ITEMS_POR_PAGINA = 50;

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const loadClientes = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setClientes([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const offset = reset ? 0 : clientes.length;
      const result = await clientesService.getClientes({
        limit: ITEMS_POR_PAGINA,
        offset: offset
      });
      
      // Manejar tanto el formato antiguo (array) como el nuevo ({ data, count })
      const data = Array.isArray(result) ? result : (result.data || []);
      const count = Array.isArray(result) ? result.length : (result.count || 0);
      
      if (reset) {
        setClientes(data);
      } else {
        setClientes(prev => [...prev, ...data]);
      }
      
      setTotalCount(count);
      const currentLength = reset ? data.length : clientes.length + data.length;
      setHasMore(currentLength < count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar clientes'));
      console.error('Error loading clientes:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore) {
      await loadClientes(false);
    }
  };

  useEffect(() => {
    loadClientes(true);
  }, []);

  const addCliente = async (cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at' | 'productos'>, productosIds?: number[]) => {
    try {
      const nuevo = await clientesService.createCliente(cliente, productosIds);
      await loadClientes(); // Recargar para obtener productos
      return nuevo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al crear cliente'));
      throw err;
    }
  };

  const updateCliente = async (id: number, cliente: Partial<Cliente>, productosIds?: number[]) => {
    try {
      const actualizado = await clientesService.updateCliente(id, cliente, productosIds);
      await loadClientes(); // Recargar para obtener productos
      return actualizado;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar cliente'));
      throw err;
    }
  };

  const deleteCliente = async (id: number) => {
    try {
      await clientesService.deleteCliente(id);
      setClientes(clientes.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al eliminar cliente'));
      throw err;
    }
  };

  return {
    clientes,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    loadClientes,
    loadMore,
    addCliente,
    updateCliente,
    deleteCliente
  };
}


