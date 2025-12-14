import { useState, useEffect } from 'react';
import * as proveedoresService from '../supabase/proveedores';
import type { Proveedor } from '../supabase/proveedores';

export function useProveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProveedores = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await proveedoresService.getProveedores();
      setProveedores(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar proveedores'));
      console.error('Error loading proveedores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProveedores();
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
    error,
    loadProveedores,
    addProveedor,
    updateProveedor,
    deleteProveedor
  };
}

