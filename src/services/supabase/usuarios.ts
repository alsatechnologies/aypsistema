import { supabase } from '@/lib/supabase';

export interface Usuario {
  id: number;
  nombre_completo: string;
  nombre_usuario?: string | null;
  correo: string;
  contrasena_hash: string;
  rol: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

// Obtener todos los usuarios
export async function getUsuarios() {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('nombre_completo');
  
  if (error) throw error;
  return data;
}

// Crear usuario
export async function createUsuario(usuario: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('usuarios')
    .insert(usuario)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Actualizar usuario
export async function updateUsuario(id: number, usuario: Partial<Usuario>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('usuarios')
    .update({ ...usuario, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Eliminar usuario (soft delete)
export async function deleteUsuario(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('usuarios')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
}

