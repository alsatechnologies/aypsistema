import { supabase } from '@/lib/supabase';
import { generarCodigoLoteParaOperacion } from './lotes';
import { registrarAuditoria } from './auditoria';
import { logger } from '@/services/logger';

export interface Embarque {
  id: number;
  boleta: string;
  codigo_lote?: string | null;
  producto_id?: number | null;
  cliente_id?: number | null;
  chofer?: string | null;
  placas?: string | null;
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
  hora_peso_bruto?: string | null;
  hora_peso_tara?: string | null;
  hora_peso_neto?: string | null;
  observaciones?: string | null;
  created_at?: string;
  updated_at?: string;
  producto?: { id: number; nombre: string };
  cliente?: { id: number; empresa: string };
  almacen_id?: number | null; // Para generar código de lote
}

// Obtener todos los embarques (con paginación opcional)
export async function getEmbarques(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  estatus?: string;
  tipo_embarque?: string;
  limit?: number;
  offset?: number;
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
    `, { count: 'exact' })
    .eq('activo', true)
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
  
  // Registrar en auditoría
  await registrarAuditoria({
    tabla: 'embarques',
    registro_id: data.id,
    accion: 'INSERT',
    datos_nuevos: data,
  });
  
  return data;
}

// Obtener embarque por boleta
export async function getEmbarqueByBoleta(boleta: string) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('embarques')
    .select(`
      *,
      producto:productos(id, nombre),
      cliente:clientes(id, empresa)
    `)
    .eq('boleta', boleta)
    .eq('activo', true)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw error;
  }
  
  return data || null;
}

// Actualizar embarque
export async function updateEmbarque(id: number, embarque: Partial<Embarque>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  // Obtener datos anteriores para auditoría
  const { data: embarqueAnterior } = await supabase
    .from('embarques')
    .select('*')
    .eq('id', id)
    .single();
  
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
      logger.error('Error al generar código de lote', error, 'Embarques');
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
  
  // Registrar en auditoría
  await registrarAuditoria({
    tabla: 'embarques',
    registro_id: id,
    accion: 'UPDATE',
    datos_anteriores: embarqueAnterior || null,
    datos_nuevos: data,
  });
  
  return data;
}

// Eliminar embarque permanentemente
export async function deleteEmbarque(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  // Obtener datos anteriores para auditoría
  const { data: embarqueAnterior } = await supabase
    .from('embarques')
    .select('*')
    .eq('id', id)
    .single();
  
  if (!embarqueAnterior) {
    throw new Error('Embarque no encontrado');
  }
  
  // Verificar si hay referencias (movimientos)
  const { data: movimientos } = await supabase
    .from('movimientos')
    .select('id')
    .eq('boleta', embarqueAnterior.boleta)
    .limit(1);
  
  if (movimientos && movimientos.length > 0) {
    throw new Error('No se puede eliminar: existe un movimiento asociado con esta boleta');
  }
  
  // Registrar en auditoría antes de eliminar
  await registrarAuditoria({
    tabla: 'embarques',
    registro_id: id,
    accion: 'DELETE_PERMANENT',
    datos_anteriores: embarqueAnterior,
  });
  
  // Eliminar permanentemente
  const { error } = await supabase
    .from('embarques')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}


