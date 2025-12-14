import { useState, useEffect } from 'react';
import * as productosService from '../supabase/productos';
import type { Producto, TipoAnalisis, ProductoAnalisis } from '../supabase/productos';

export function useProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [tiposAnalisis, setTiposAnalisis] = useState<TipoAnalisis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProductos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productosService.getProductos();
      setProductos(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar productos'));
      console.error('Error loading productos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTiposAnalisis = async () => {
    try {
      const data = await productosService.getTiposAnalisis();
      setTiposAnalisis(data);
    } catch (err) {
      console.error('Error loading tipos analisis:', err);
    }
  };

  useEffect(() => {
    loadProductos();
    loadTiposAnalisis();
  }, []);

  const addProducto = async (producto: Omit<Producto, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const nuevo = await productosService.createProducto(producto);
      setProductos([...productos, nuevo]);
      return nuevo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al crear producto'));
      throw err;
    }
  };

  const updateProducto = async (id: number, producto: Partial<Producto>) => {
    try {
      const actualizado = await productosService.updateProducto(id, producto);
      setProductos(productos.map(p => p.id === id ? actualizado : p));
      return actualizado;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar producto'));
      throw err;
    }
  };

  const deleteProducto = async (id: number) => {
    try {
      await productosService.deleteProducto(id);
      setProductos(productos.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al eliminar producto'));
      throw err;
    }
  };

  const addTipoAnalisis = async (nombre: string) => {
    try {
      // Generar ID único
      const id = nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '');
      
      const nuevo = await productosService.createTipoAnalisis(id, nombre);
      // Recargar la lista completa para asegurar sincronización
      await loadTiposAnalisis();
      return nuevo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al crear tipo de análisis'));
      throw err;
    }
  };

  const removeTipoAnalisis = async (id: string) => {
    try {
      await productosService.deleteTipoAnalisis(id);
      // Recargar la lista completa para asegurar sincronización
      await loadTiposAnalisis();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al eliminar tipo de análisis'));
      throw err;
    }
  };

  return {
    productos,
    tiposAnalisis,
    loading,
    error,
    loadProductos,
    loadTiposAnalisis,
    addProducto,
    updateProducto,
    deleteProducto,
    addTipoAnalisis,
    removeTipoAnalisis
  };
}

