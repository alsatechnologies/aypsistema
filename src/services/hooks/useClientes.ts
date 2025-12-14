import { useState, useEffect } from 'react';
import * as clientesService from '../supabase/clientes';
import type { Cliente } from '../supabase/clientes';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientesService.getClientes();
      setClientes(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar clientes'));
      console.error('Error loading clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
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
    error,
    loadClientes,
    addCliente,
    updateCliente,
    deleteCliente
  };
}

