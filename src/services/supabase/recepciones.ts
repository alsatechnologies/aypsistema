import { supabase } from '@/lib/supabase';
import { generarCodigoLoteParaOperacion } from './lotes';
import { registrarAuditoria } from './auditoria';
import { logger } from '@/services/logger';
import { upsertInventarioAlmacen } from './inventarioAlmacenes';

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
  
  // ⚠️ IMPORTANTE: Guardar PRIMERO la boleta (sin lote si no existe)
  // Luego generar el consecutivo DESPUÉS de confirmar que se guardó exitosamente
  // Esto previene que se incrementen consecutivos si falla el guardado
  
  // Preparar datos para guardar (sin codigo_lote si no existe en BD)
  const recepcionParaGuardar = { ...recepcion };
  if (!loteExistenteEnBD) {
    // No incluir codigo_lote si no existe - se generará después
    delete recepcionParaGuardar.codigo_lote;
  }
  
  // PASO 1: Guardar la boleta primero (sin lote si no existe)
  const { data: dataGuardada, error: errorGuardado } = await supabase
    .from('recepciones')
    .update({ ...recepcionParaGuardar, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      producto:productos(id, nombre),
      proveedor:proveedores(id, empresa)
    `)
    .single();
  
  if (errorGuardado) throw errorGuardado;
  
  // PASO 2: Si se guardó exitosamente Y necesita lote, generarlo AHORA
  const estatusFinal = dataGuardada.estatus || recepcion.estatus || recepcionAnterior?.estatus;
  const proveedorId = dataGuardada.proveedor_id || recepcion.proveedor_id || recepcionAnterior?.proveedor_id;
  const productoId = dataGuardada.producto_id || recepcion.producto_id || recepcionAnterior?.producto_id;
  const almacenId = dataGuardada.almacen_id || recepcion.almacen_id || recepcionAnterior?.almacen_id;
  
  // Solo generar lote si:
  // 1. El estatus final es 'Completado'
  // 2. NO existe lote en la BD (verificación directa)
  // 3. Tenemos todos los datos requeridos
  if (estatusFinal === 'Completado' && !loteExistenteEnBD && proveedorId && productoId && almacenId) {
    try {
      logger.info(`Generando código de lote para recepción ${id} (después de guardar)`, {
        recepcionId: id,
        proveedorId,
        productoId,
        almacenId
      }, 'Recepciones');
      
      // AHORA generar el consecutivo (después de confirmar que se guardó)
      const { codigo } = await generarCodigoLoteParaOperacion(
        'Reciba',
        null,
        proveedorId,
        productoId,
        almacenId
      );
      
      // Validar que el código de lote no esté duplicado
      const { data: loteExistente, error: validacionError } = await supabase
        .from('recepciones')
        .select('id, boleta')
        .eq('codigo_lote', codigo)
        .neq('id', id)
        .maybeSingle();
      
      if (validacionError && validacionError.code !== 'PGRST116') {
        logger.error('Error al validar duplicado de código de lote', {
          error: validacionError,
          codigo,
          recepcionId: id
        }, 'Recepciones');
        throw new Error(`Error al validar código de lote: ${validacionError.message}`);
      }
      
      if (loteExistente) {
        logger.error('Código de lote duplicado detectado', {
          codigo,
          recepcionId: id,
          boletaExistente: loteExistente.boleta,
          recepcionIdExistente: loteExistente.id
        }, 'Recepciones');
        throw new Error(
          `❌ Código de lote duplicado detectado: ${codigo}\n\n` +
          `Este código ya está siendo usado por la boleta ${loteExistente.boleta}.\n` +
          `Esto indica un problema con el sistema de consecutivos.\n\n` +
          `Por favor, contacta al administrador del sistema para resolver este problema.`
        );
      }
      
      // PASO 3: Actualizar la boleta con el código de lote generado
      const { data: dataActualizada, error: errorActualizacion } = await supabase
        .from('recepciones')
        .update({ codigo_lote: codigo, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          producto:productos(id, nombre),
          proveedor:proveedores(id, empresa)
        `)
        .single();
      
      if (errorActualizacion) {
        logger.error('Error al actualizar boleta con código de lote', {
          error: errorActualizacion,
          codigo,
          recepcionId: id
        }, 'Recepciones');
        throw new Error(`Error al actualizar boleta con código de lote: ${errorActualizacion.message}`);
      }
      
      logger.info(`Código de lote generado y asignado para recepción ${id}: ${codigo}`, { recepcionId: id, codigo }, 'Recepciones');
      
      // Retornar la boleta actualizada con el lote
      const data = dataActualizada;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const errorDetails = error instanceof Error ? error.stack : String(error);
      
      logger.error('Error crítico al generar código de lote (después de guardar)', {
        error: errorMessage,
        details: errorDetails,
        recepcionId: id,
        proveedorId,
        productoId,
        almacenId
      }, 'Recepciones');
      
      // ⚠️ IMPORTANTE: La boleta ya se guardó, pero no tiene lote
      // Lanzar error para que el usuario sepa que necesita reintentar
      throw new Error(
        `⚠️ La boleta se guardó, pero no se pudo generar el código de lote.\n\n` +
        `${errorMessage}\n\n` +
        `La boleta quedó sin código de lote. Por favor, intenta guardar nuevamente.\n` +
        `Si el problema persiste, contacta al administrador del sistema.`
      );
    }
  } else if (estatusFinal === 'Completado' && !loteExistenteEnBD) {
    // Log cuando faltan datos requeridos
    logger.warn(`No se puede generar lote para recepción ${id}: faltan datos requeridos`, {
      recepcionId: id,
      tieneProveedorId: !!proveedorId,
      tieneProductoId: !!productoId,
      tieneAlmacenId: !!almacenId
    }, 'Recepciones');
  }
  
  // Retornar la boleta guardada (con o sin lote)
  const data = dataGuardada;
  
  // SUMAR AL INVENTARIO: Si la recepción está completada y tiene peso_neto y almacen_id
  // Sumar automáticamente al inventario del almacén correspondiente
  // (estatusFinal ya fue definido arriba para la generación de lote)
  if (estatusFinal === 'Completado' && productoId && almacenId) {
    const pesoNeto = data.peso_neto || recepcion.peso_neto;
    const pesoNetoAnterior = recepcionAnterior?.peso_neto;
    
    // Solo sumar si hay peso_neto válido y es mayor a 0
    if (pesoNeto && pesoNeto > 0) {
      try {
        // Obtener inventario actual del almacén para este producto
        const { data: inventarioActual, error: inventarioError } = await supabase
          .from('inventario_almacenes')
          .select('cantidad')
          .eq('almacen_id', almacenId)
          .eq('producto_id', productoId)
          .maybeSingle(); // Usar maybeSingle en lugar de single para evitar error si no existe
        
        // Si hay error y no es "no rows", lanzarlo
        if (inventarioError && inventarioError.code !== 'PGRST116') {
          throw inventarioError;
        }
        
        const cantidadActual = inventarioActual?.cantidad || 0;
        
        // Si había un peso_neto anterior, primero restarlo (para correcciones)
        // Luego sumar el nuevo peso_neto
        const cantidadAjustada = pesoNetoAnterior && pesoNetoAnterior > 0
          ? cantidadActual - pesoNetoAnterior + pesoNeto
          : cantidadActual + pesoNeto;
        
        // Asegurar que no sea negativo
        const nuevaCantidad = Math.max(0, cantidadAjustada);
        
        // Actualizar inventario
        await upsertInventarioAlmacen(almacenId, productoId, nuevaCantidad);
        
        // Actualizar capacidad_actual del almacén sumando todas las cantidades de inventario_almacenes
        try {
          const { actualizarCapacidadActualAlmacen } = await import('./inventarioAlmacenes');
          await actualizarCapacidadActualAlmacen(almacenId);
        } catch (errorCapacidad) {
          // Log el error pero no fallar el proceso
          console.error(`[RECEPCIONES] Error al actualizar capacidad_actual del almacén ${almacenId}:`, errorCapacidad);
        }
        
        logger.info(`Inventario actualizado para recepción ${id}`, {
          recepcionId: id,
          almacenId,
          productoId,
          pesoNeto,
          cantidadAnterior: cantidadActual,
          cantidadNueva: nuevaCantidad
        }, 'Recepciones');
      } catch (inventarioError) {
        // Log el error pero no fallar el guardado de la recepción
        const errorMessage = inventarioError instanceof Error ? inventarioError.message : 'Error desconocido';
        logger.error('Error al actualizar inventario después de recepción', {
          error: errorMessage,
          recepcionId: id,
          almacenId,
          productoId,
          pesoNeto
        }, 'Recepciones');
        console.error(`[RECEPCIONES] Error al actualizar inventario para recepción ${id}:`, errorMessage);
      }
    }
  }
  
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

