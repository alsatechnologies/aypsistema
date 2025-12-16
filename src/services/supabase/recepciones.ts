import { supabase } from '@/lib/supabase';
import { generarCodigoLoteParaOperacion } from './lotes';

export interface Recepcion {
  id: number;
  boleta: string;
  codigo_lote?: string | null;
  producto_id?: number | null;
  proveedor_id?: number | null;
  chofer?: string | null;
  placas?: string | null;
  fecha: string;
  estatus: string;
  peso_bruto?: number | null;
  peso_tara?: number | null;
  peso_neto?: number | null;
  tipo_transporte?: string | null;
  tipo_bascula?: string | null;
  sello_entrada_1?: string | null;
  sello_entrada_2?: string | null;
  sello_salida_1?: string | null;
  sello_salida_2?: string | null;
  analisis?: Record<string, number> | null;
  hora_peso_bruto?: string | null;
  hora_peso_tara?: string | null;
  hora_peso_neto?: string | null;
  created_at?: string;
  updated_at?: string;
  producto?: { id: number; nombre: string };
  proveedor?: { id: number; empresa: string };
  almacen_id?: number | null; // Para generar código de lote
}

// Obtener todas las recepciones (con paginación opcional)
export async function getRecepciones(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  estatus?: string;
  producto_id?: number;
  limit?: number;
  offset?: number;
}) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  let query = supabase
    .from('recepciones')
    .select(`
      *,
      producto:productos(id, nombre),
      proveedor:proveedores(id, empresa)
    `, { count: 'exact' })
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

// Crear recepción
export async function createRecepcion(recepcion: Omit<Recepcion, 'id' | 'created_at' | 'updated_at' | 'producto' | 'proveedor'>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  console.log('createRecepcion - Datos recibidos:', recepcion);
  
  const { data, error } = await supabase
    .from('recepciones')
    .insert(recepcion)
    .select(`
      *,
      producto:productos(id, nombre),
      proveedor:proveedores(id, empresa)
    `)
    .single();
  
  if (error) {
    console.error('Error de Supabase al crear recepción:', error);
    console.error('Código de error:', error.code);
    console.error('Mensaje de error:', error.message);
    console.error('Detalles:', error.details);
    throw new Error(`Error al crear recepción: ${error.message} (${error.code})`);
  }
  
  console.log('createRecepcion - Recepción creada exitosamente:', data);
  return data;
}

// Actualizar recepción
export async function updateRecepcion(id: number, recepcion: Partial<Recepcion>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  // Si se está completando y no tiene código de lote, generarlo
  if (recepcion.estatus === 'Completado' && !recepcion.codigo_lote && recepcion.proveedor_id && recepcion.producto_id && recepcion.almacen_id) {
    try {
      const { codigo } = await generarCodigoLoteParaOperacion(
        'Reciba',
        null,
        recepcion.proveedor_id,
        recepcion.producto_id,
        recepcion.almacen_id
      );
      recepcion.codigo_lote = codigo;
    } catch (error) {
      console.error('Error al generar código de lote:', error);
    }
  }
  
  const { data, error } = await supabase
    .from('recepciones')
    .update({ ...recepcion, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      producto:productos(id, nombre),
      proveedor:proveedores(id, empresa)
    `)
    .single();
  
  if (error) throw error;
  return data;
}

// Eliminar recepción
export async function deleteRecepcion(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('recepciones')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

