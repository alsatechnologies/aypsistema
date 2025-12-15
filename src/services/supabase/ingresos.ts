import { supabase } from '@/lib/supabase';

export interface Ingreso {
  id: number;
  nombre_chofer: string;
  empresa?: string | null;
  procedencia_destino?: string | null;
  motivo: string;
  placas?: string | null;
  vehiculo?: string | null;
  fecha_hora_ingreso: string;
  fecha_hora_salida?: string | null;
  ubicacion?: string | null;
  producto?: string | null;
  proveedor?: string | null;
  cliente?: string | null;
  tipo_transporte?: string | null;
  enviado_a_oficina: boolean;
  created_at?: string;
  updated_at?: string;
}

// Obtener todos los ingresos
export async function getIngresos(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  motivo?: string;
  enviado_a_oficina?: boolean;
}) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  let query = supabase
    .from('ingresos')
    .select('*')
    .order('fecha_hora_ingreso', { ascending: false });
  
  if (filters?.fechaDesde) {
    query = query.gte('fecha_hora_ingreso', filters.fechaDesde);
  }
  if (filters?.fechaHasta) {
    query = query.lte('fecha_hora_ingreso', filters.fechaHasta);
  }
  if (filters?.motivo) {
    query = query.eq('motivo', filters.motivo);
  }
  if (filters?.enviado_a_oficina !== undefined) {
    query = query.eq('enviado_a_oficina', filters.enviado_a_oficina);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Crear ingreso
export async function createIngreso(ingreso: Omit<Ingreso, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('ingresos')
    .insert(ingreso)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Actualizar ingreso
export async function updateIngreso(id: number, ingreso: Partial<Ingreso>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('ingresos')
    .update({ ...ingreso, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Eliminar ingreso
export async function deleteIngreso(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('ingresos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}


