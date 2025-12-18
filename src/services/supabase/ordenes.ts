import { supabase } from '@/lib/supabase';

export interface Orden {
  id: number;
  boleta: string;
  producto_id?: number | null;
  cliente_id?: number | null;
  proveedor_id?: number | null;
  tipo_operacion: string;
  tipo_transporte?: string | null;
  destino?: string | null;
  nombre_chofer?: string | null;
  vehiculo?: string | null;
  placas?: string | null;
  fecha_hora_ingreso?: string | null;
  estatus: string;
  created_at?: string;
  updated_at?: string;
  producto?: { id: number; nombre: string };
  cliente?: { id: number; empresa: string };
  proveedor?: { id: number; empresa: string };
}

// Obtener todas las órdenes (con paginación opcional)
export async function getOrdenes(filters?: {
  estatus?: string;
  tipo_operacion?: string;
  limit?: number;
  offset?: number;
}) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  let query = supabase
    .from('ordenes')
    .select(`
      *,
      producto:productos(id, nombre),
      cliente:clientes(id, empresa),
      proveedor:proveedores(id, empresa)
    `, { count: 'exact' })
    .eq('activo', true)
    .order('fecha_hora_ingreso', { ascending: false });
  
  if (filters?.estatus) {
    query = query.eq('estatus', filters.estatus);
  }
  if (filters?.tipo_operacion) {
    query = query.eq('tipo_operacion', filters.tipo_operacion);
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

// Crear orden
export async function createOrden(orden: Omit<Orden, 'id' | 'created_at' | 'updated_at' | 'producto' | 'cliente'>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('ordenes')
    .insert(orden)
    .select(`
      *,
      producto:productos(id, nombre),
      cliente:clientes(id, empresa),
      proveedor:proveedores(id, empresa)
    `)
    .single();
  
  if (error) throw error;
  return data;
}

// Actualizar orden
export async function updateOrden(id: number, orden: Partial<Orden>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('ordenes')
    .update({ ...orden, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      producto:productos(id, nombre),
      cliente:clientes(id, empresa),
      proveedor:proveedores(id, empresa)
    `)
    .single();
  
  if (error) throw error;
  return data;
}

// Eliminar orden (soft delete)
export async function deleteOrden(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('ordenes')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
}

