import { useState, useEffect } from 'react';
import * as usuariosService from '../supabase/usuarios';
import type { Usuario } from '../supabase/usuarios';

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usuariosService.getUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar usuarios'));
      console.error('Error loading usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const addUsuario = async (usuario: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const nuevo = await usuariosService.createUsuario(usuario);
      setUsuarios([...usuarios, nuevo]);
      return nuevo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al crear usuario'));
      throw err;
    }
  };

  const updateUsuario = async (id: number, usuario: Partial<Usuario>) => {
    try {
      const actualizado = await usuariosService.updateUsuario(id, usuario);
      setUsuarios(usuarios.map(u => u.id === id ? actualizado : u));
      return actualizado;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al actualizar usuario'));
      throw err;
    }
  };

  const deleteUsuario = async (id: number) => {
    try {
      await usuariosService.deleteUsuario(id);
      setUsuarios(usuarios.filter(u => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al eliminar usuario'));
      throw err;
    }
  };

  return {
    usuarios,
    loading,
    error,
    loadUsuarios,
    addUsuario,
    updateUsuario,
    deleteUsuario
  };
}

