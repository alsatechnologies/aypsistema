import { supabase } from '@/lib/supabase';
import { generarCodigoLoteParaOperacion } from './lotes';
import { registrarAuditoria } from './auditoria';
import { logger } from '@/services/logger';

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
  observaciones?: string | null;
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
  
  logger.debug('Creando recepción', recepcion, 'Recepciones');
  
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
    logger.error('Error al crear recepción', error, 'Recepciones');
    throw new Error(`Error al crear recepción: ${error.message} (${error.code})`);
  }
  
  logger.info('Recepción creada exitosamente', { id: data.id, boleta: data.boleta }, 'Recepciones');
  
  // Registrar en auditoría
  await registrarAuditoria({
    tabla: 'recepciones',
    registro_id: data.id,
    accion: 'INSERT',
    datos_nuevos: data,
  });
  
  return data;
}

// Actualizar recepción
export async function updateRecepcion(id: number, recepcion: Partial<Recepcion>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  // Obtener datos anteriores para auditoría Y para verificar si ya tiene lote
  const { data: recepcionAnterior } = await supabase
    .from('recepciones')
    .select('*')
    .eq('id', id)
    .single();
  
  // ⚠️ IMPORTANTE: Verificar directamente en BD si YA tiene lote
  // Esto previene duplicados cuando se guarda múltiples veces
  const loteExistenteEnBD = recepcionAnterior?.codigo_lote;
  
  // Si ya tiene lote en la BD, NO regenerar (previene duplicados)
  if (loteExistenteEnBD) {
    logger.info(`Recepción ${id} ya tiene lote asignado: ${loteExistenteEnBD}`, { recepcionId: id, lote: loteExistenteEnBD }, 'Recepciones');
    // No modificar el codigo_lote si ya existe
    delete recepcion.codigo_lote;
  }
  
  // Usar valores del objeto que se pasa o de la recepción anterior
  const proveedorId = recepcion.proveedor_id || recepcionAnterior?.proveedor_id;
  const productoId = recepcion.producto_id || recepcionAnterior?.producto_id;
  const almacenId = recepcion.almacen_id || recepcionAnterior?.almacen_id;
  
  // Solo generar lote si:
  // 1. El estatus es 'Completado'
  // 2. NO existe lote en la BD (verificación directa)
  // 3. Tenemos todos los datos requeridos
  if (recepcion.estatus === 'Completado' && !loteExistenteEnBD && proveedorId && productoId && almacenId) {
    try {
      const { codigo } = await generarCodigoLoteParaOperacion(
        'Reciba',
        null,
        proveedorId,
        productoId,
        almacenId
      );
      recepcion.codigo_lote = codigo;
      logger.info(`Código de lote generado para recepción ${id}: ${codigo}`, { recepcionId: id, codigo }, 'Recepciones');
    } catch (error) {
      logger.error('Error al generar código de lote', error, 'Recepciones');
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
  
  // Registrar en auditoría
  await registrarAuditoria({
    tabla: 'recepciones',
    registro_id: id,
    accion: 'UPDATE',
    datos_anteriores: recepcionAnterior || null,
    datos_nuevos: data,
  });
  
  return data;
}

// Obtener recepción por boleta
export async function getRecepcionByBoleta(boleta: string) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('recepciones')
    .select(`
      *,
      producto:productos(id, nombre),
      proveedor:proveedores(id, empresa)
    `)
    .eq('boleta', boleta)
    .eq('activo', true)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw error;
  }

  return data || null;
}

// Eliminar recepción permanentemente
export async function deleteRecepcion(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  // Obtener datos anteriores para auditoría
  const { data: recepcionAnterior } = await supabase
    .from('recepciones')
    .select('*')
    .eq('id', id)
    .single();
  
  if (!recepcionAnterior) {
    throw new Error('Recepción no encontrada');
  }
  
  // Eliminar movimientos asociados antes de eliminar la recepción
  const { data: movimientos } = await supabase
    .from('movimientos')
    .select('id')
    .eq('boleta', recepcionAnterior.boleta);
  
  if (movimientos && movimientos.length > 0) {
    // Eliminar todos los movimientos asociados
    const { error: errorMovimientos } = await supabase
      .from('movimientos')
      .delete()
      .eq('boleta', recepcionAnterior.boleta);
    
    if (errorMovimientos) {
      logger.error('Error al eliminar movimientos asociados', errorMovimientos, 'Recepciones');
      throw new Error(`Error al eliminar movimientos asociados: ${errorMovimientos.message}`);
    }
    
    logger.info(`Eliminados ${movimientos.length} movimiento(s) asociado(s) a la recepción`, { boleta: recepcionAnterior.boleta }, 'Recepciones');
  }
  
  // Registrar en auditoría antes de eliminar
  await registrarAuditoria({
    tabla: 'recepciones',
    registro_id: id,
    accion: 'DELETE_PERMANENT',
    datos_anteriores: recepcionAnterior,
  });
  
  // Eliminar permanentemente
  const { error } = await supabase
    .from('recepciones')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

