import { supabase } from '@/lib/supabase';

export interface Movimiento {
  id: number;
  boleta: string;
  producto_id?: number | null;
  cliente_proveedor?: string | null;
  tipo: string;
  transporte?: string | null;
  fecha: string;
  ubicacion?: string | null;
  peso_neto?: number | null;
  peso_bruto?: number | null;
  peso_tara?: number | null;
  chofer?: string | null;
  placas?: string | null;
  created_at?: string;
  producto?: { id: number; nombre: string };
}

// Obtener todos los movimientos (con paginación opcional)
export async function getMovimientos(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  tipo?: string;
  producto_id?: number;
  limit?: number;
  offset?: number;
}) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  let query = supabase
    .from('movimientos')
    .select(`
      *,
      producto:productos(id, nombre)
    `, { count: 'exact' })
    .eq('activo', true)
    .order('fecha', { ascending: false });
  
  if (filters?.fechaDesde) {
    query = query.gte('fecha', filters.fechaDesde);
  }
  if (filters?.fechaHasta) {
    query = query.lte('fecha', filters.fechaHasta);
  }
  if (filters?.tipo) {
    query = query.eq('tipo', filters.tipo);
  }
  if (filters?.producto_id) {
    query = query.eq('producto_id', filters.producto_id);
  }
  
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

// Crear movimiento
export async function createMovimiento(movimiento: Omit<Movimiento, 'id' | 'created_at' | 'producto'>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('movimientos')
    .insert(movimiento)
    .select(`
      *,
      producto:productos(id, nombre)
    `)
    .single();
  
  if (error) throw error;
  return data;
}

// Eliminar movimiento (soft delete)
export async function deleteMovimiento(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('movimientos')
    .update({ activo: false })
    .eq('id', id);
  
  if (error) throw error;
}


