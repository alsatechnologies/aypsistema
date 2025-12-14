import { supabase } from '@/lib/supabase';
import { generarCodigoLoteParaOperacion } from './lotes';

export interface Embarque {
  id: number;
  boleta: string;
  codigo_lote?: string | null;
  producto_id?: number | null;
  cliente_id?: number | null;
  chofer?: string | null;
  destino?: string | null;
  fecha: string;
  estatus: string;
  peso_bruto?: number | null;
  peso_tara?: number | null;
  peso_neto?: number | null;
  tipo_transporte?: string | null;
  tipo_embarque?: string | null;
  sello_entrada_1?: string | null;
  sello_entrada_2?: string | null;
  sello_salida_1?: string | null;
  sello_salida_2?: string | null;
  valores_analisis?: Record<string, number> | null;
  created_at?: string;
  updated_at?: string;
  producto?: { id: number; nombre: string };
  cliente?: { id: number; empresa: string };
  almacen_id?: number | null; // Para generar código de lote
}

// Obtener todos los embarques
export async function getEmbarques(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  estatus?: string;
  tipo_embarque?: string;
}) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  let query = supabase
    .from('embarques')
    .select(`
      *,
      producto:productos(id, nombre),
      cliente:clientes(id, empresa)
    `)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (filters?.fechaDesde) {
    query = query.gte('fecha', filters.fechaDesde);
  }
  if (filters?.fechaHasta) {
    query = query.lte('fecha', filters.fechaHasta);
  }
  if (filters?.estatus) {
    query = query.eq('estatus', filters.estatus);
  }
  if (filters?.tipo_embarque) {
    query = query.eq('tipo_embarque', filters.tipo_embarque);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Crear embarque
export async function createEmbarque(embarque: Omit<Embarque, 'id' | 'created_at' | 'updated_at' | 'producto' | 'cliente'>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('embarques')
    .insert(embarque)
    .select(`
      *,
      producto:productos(id, nombre),
      cliente:clientes(id, empresa)
    `)
    .single();
  
  if (error) throw error;
  return data;
}

// Actualizar embarque
export async function updateEmbarque(id: number, embarque: Partial<Embarque>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  // Si se está completando y no tiene código de lote, generarlo
  if (embarque.estatus === 'Completado' && !embarque.codigo_lote && embarque.cliente_id && embarque.producto_id && embarque.almacen_id) {
    try {
      const tipoOperacion = embarque.tipo_embarque === 'Nacional' ? 'Embarque Nacional' : 'Embarque Exportación';
      const { codigo } = await generarCodigoLoteParaOperacion(
        tipoOperacion,
        embarque.cliente_id,
        null,
        embarque.producto_id,
        embarque.almacen_id
      );
      embarque.codigo_lote = codigo;
    } catch (error) {
      console.error('Error al generar código de lote:', error);
    }
  }
  
  const { data, error } = await supabase
    .from('embarques')
    .update({ ...embarque, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      producto:productos(id, nombre),
      cliente:clientes(id, empresa)
    `)
    .single();
  
  if (error) throw error;
  return data;
}

// Eliminar embarque
export async function deleteEmbarque(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('embarques')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

