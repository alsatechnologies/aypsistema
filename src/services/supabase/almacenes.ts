import { supabase } from '@/lib/supabase';

export interface Almacen {
  id: number;
  nombre: string;
  codigo_lote?: string | null;
  capacidad_total: number;
  capacidad_actual: number;
  unidad: string;
  created_at?: string;
  updated_at?: string;
}

// Obtener todos los almacenes
export async function getAlmacenes() {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('almacenes')
    .select('*')
    .order('nombre');
  
  if (error) throw error;
  return data;
}

// Crear almacén
export async function createAlmacen(almacen: Omit<Almacen, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('almacenes')
    .insert(almacen)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Actualizar almacén
export async function updateAlmacen(id: number, almacen: Partial<Almacen>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('almacenes')
    .update({ ...almacen, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Eliminar almacén
export async function deleteAlmacen(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('almacenes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

