import { supabase } from '@/lib/supabase';

export interface Proveedor {
  id: number;
  empresa: string;
  producto?: string | null;
  telefono?: string | null;
  email?: string | null;
  ubicacion?: string | null;
  fecha_alta?: string;
  created_at?: string;
  updated_at?: string;
}

// Obtener todos los proveedores (con paginación opcional)
export async function getProveedores(filters?: {
  limit?: number;
  offset?: number;
}) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  let query = supabase
    .from('proveedores')
    .select('*', { count: 'exact' })
    .order('empresa');
  
  // Aplicar paginación si se proporciona
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset !== undefined && filters?.limit) {
    query = query.range(filters.offset, filters.offset + filters.limit - 1);
  }
  
  const { data, error, count } = await query;
  if (error) throw error;
  
  // Si no hay paginación, devolver directamente el array (compatibilidad hacia atrás)
  if (filters?.limit === undefined && filters?.offset === undefined) {
    return data || [];
  }
  
  // Si hay paginación, devolver objeto con data y count
  return { data: data || [], count: count || 0 };
}

// Crear proveedor
export async function createProveedor(proveedor: Omit<Proveedor, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('proveedores')
    .insert(proveedor)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Actualizar proveedor
export async function updateProveedor(id: number, proveedor: Partial<Proveedor>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('proveedores')
    .update({ ...proveedor, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Eliminar proveedor
export async function deleteProveedor(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('proveedores')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}


