import { supabase } from '@/lib/supabase';

export interface Orden {
  id: number;
  boleta: string;
  producto_id?: number | null;
  cliente_id?: number | null;
  proveedor_id?: number | null;
  tipo_operacion: string;
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

// Obtener todas las órdenes
export async function getOrdenes(filters?: {
  estatus?: string;
  tipo_operacion?: string;
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
    `)
    .order('fecha_hora_ingreso', { ascending: false });
  
  if (filters?.estatus) {
    query = query.eq('estatus', filters.estatus);
  }
  if (filters?.tipo_operacion) {
    query = query.eq('tipo_operacion', filters.tipo_operacion);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
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

// Eliminar orden
export async function deleteOrden(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('ordenes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

