import { supabase } from '@/lib/supabase';
import { generarCodigoLoteParaOperacion } from './lotes';
import { registrarAuditoria } from './auditoria';
import { logger } from '@/services/logger';
import { upsertInventarioAlmacen } from './inventarioAlmacenes';

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
  sello_entrada_3?: string | null;
  sello_entrada_4?: string | null;
  sello_entrada_5?: string | null;
  sello_salida_1?: string | null;
  sello_salida_2?: string | null;
  sello_salida_3?: string | null;
  sello_salida_4?: string | null;
  sello_salida_5?: string | null;
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
  
  // Obtener datos anteriores para auditoría Y para verificar si ya tiene lote
  const { data: embarqueAnterior } = await supabase
    .from('embarques')
    .select('*')
    .eq('id', id)
    .single();
  
  // ⚠️ IMPORTANTE: Verificar directamente en BD si YA tiene lote
  // Esto previene duplicados cuando se guarda múltiples veces
  const loteExistenteEnBD = embarqueAnterior?.codigo_lote;
  
  // Si ya tiene lote en la BD, NO regenerar (previene duplicados)
  if (loteExistenteEnBD) {
    logger.info(`Embarque ${id} ya tiene lote asignado: ${loteExistenteEnBD}`, { embarqueId: id, lote: loteExistenteEnBD }, 'Embarques');
    // No modificar el codigo_lote si ya existe
    delete embarque.codigo_lote;
  }
  
  // ⚠️ IMPORTANTE: Guardar PRIMERO la boleta (sin lote si no existe)
  // Luego generar el consecutivo DESPUÉS de confirmar que se guardó exitosamente
  // Esto previene que se incrementen consecutivos si falla el guardado
  
  // Preparar datos para guardar (sin codigo_lote si no existe en BD)
  const embarqueParaGuardar = { ...embarque };
  if (!loteExistenteEnBD) {
    // No incluir codigo_lote si no existe - se generará después
    delete embarqueParaGuardar.codigo_lote;
  }
  
  // PASO 1: Guardar la boleta primero (sin lote si no existe)
  const { data: dataGuardada, error: errorGuardado } = await supabase
    .from('embarques')
    .update({ ...embarqueParaGuardar, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      producto:productos(id, nombre),
      cliente:clientes(id, empresa)
    `)
    .single();
  
  if (errorGuardado) throw errorGuardado;
  
  // PASO 2: Si se guardó exitosamente Y necesita lote, generarlo AHORA
  const estatusFinal = dataGuardada.estatus || embarque.estatus || embarqueAnterior?.estatus;
  const clienteId = dataGuardada.cliente_id || embarque.cliente_id || embarqueAnterior?.cliente_id;
  const productoId = dataGuardada.producto_id || embarque.producto_id || embarqueAnterior?.producto_id;
  const almacenId = dataGuardada.almacen_id || embarque.almacen_id || embarqueAnterior?.almacen_id;
  const tipoEmbarque = dataGuardada.tipo_embarque || embarque.tipo_embarque || embarqueAnterior?.tipo_embarque;
  
  // Solo generar lote si:
  // 1. El estatus final es 'Completado'
  // 2. NO existe lote en la BD (verificación directa)
  // 3. Tenemos todos los datos requeridos
  if (estatusFinal === 'Completado' && !loteExistenteEnBD && clienteId && productoId && almacenId) {
    try {
      // Validar que tenemos todos los datos necesarios
      if (!tipoEmbarque) {
        throw new Error('No se puede generar lote: falta el tipo de embarque (Nacional/Exportación)');
      }
      
      const tipoOperacion = tipoEmbarque === 'Nacional' ? 'Embarque Nacional' : 'Embarque Exportación';
      
      logger.info(`Generando código de lote para embarque ${id} (después de guardar)`, {
        embarqueId: id,
        tipoOperacion,
        clienteId,
        productoId,
        almacenId
      }, 'Embarques');
      
      // AHORA generar el consecutivo (después de confirmar que se guardó)
      const { codigo } = await generarCodigoLoteParaOperacion(
        tipoOperacion,
        clienteId,
        null,
        productoId,
        almacenId
      );
      
      // Validar que el código de lote no esté duplicado
      const { data: loteExistente, error: validacionError } = await supabase
        .from('embarques')
        .select('id, boleta')
        .eq('codigo_lote', codigo)
        .neq('id', id)
        .maybeSingle();
      
      if (validacionError && validacionError.code !== 'PGRST116') {
        logger.error('Error al validar duplicado de código de lote', {
          error: validacionError,
          codigo,
          embarqueId: id
        }, 'Embarques');
        throw new Error(`Error al validar código de lote: ${validacionError.message}`);
      }
      
      if (loteExistente) {
        logger.error('Código de lote duplicado detectado', {
          codigo,
          embarqueId: id,
          boletaExistente: loteExistente.boleta,
          embarqueIdExistente: loteExistente.id
        }, 'Embarques');
        throw new Error(
          `❌ Código de lote duplicado detectado: ${codigo}\n\n` +
          `Este código ya está siendo usado por la boleta ${loteExistente.boleta}.\n` +
          `Esto indica un problema con el sistema de consecutivos.\n\n` +
          `Por favor, contacta al administrador del sistema para resolver este problema.`
        );
      }
      
      // PASO 3: Actualizar la boleta con el código de lote generado
      const { data: dataActualizada, error: errorActualizacion } = await supabase
        .from('embarques')
        .update({ codigo_lote: codigo, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          producto:productos(id, nombre),
          cliente:clientes(id, empresa)
        `)
        .single();
      
      if (errorActualizacion) {
        logger.error('Error al actualizar boleta con código de lote', {
          error: errorActualizacion,
          codigo,
          embarqueId: id
        }, 'Embarques');
        throw new Error(`Error al actualizar boleta con código de lote: ${errorActualizacion.message}`);
      }
      
      logger.info(`Código de lote generado y asignado para embarque ${id}: ${codigo}`, { embarqueId: id, codigo }, 'Embarques');
      
      // Retornar la boleta actualizada con el lote
      return dataActualizada;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const errorDetails = error instanceof Error ? error.stack : String(error);
      
      logger.error('Error crítico al generar código de lote (después de guardar)', {
        error: errorMessage,
        details: errorDetails,
        embarqueId: id,
        clienteId,
        productoId,
        almacenId,
        tipoEmbarque
      }, 'Embarques');
      
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
    logger.warn(`No se puede generar lote para embarque ${id}: faltan datos requeridos`, {
      embarqueId: id,
      tieneClienteId: !!clienteId,
      tieneProductoId: !!productoId,
      tieneAlmacenId: !!almacenId
    }, 'Embarques');
  }
  
  // Retornar la boleta guardada (con o sin lote)
  const data = dataGuardada;
  
  // RESTAR DEL INVENTARIO: Si el embarque está completado y tiene peso_neto y almacen_id
  // Restar automáticamente del inventario del almacén correspondiente
  if (estatusFinal === 'Completado' && productoId && almacenId) {
    const pesoNeto = data.peso_neto || embarque.peso_neto;
    const pesoNetoAnterior = embarqueAnterior?.peso_neto;
    
    // Solo restar si hay peso_neto válido y es mayor a 0
    if (pesoNeto && pesoNeto > 0) {
      try {
        // Obtener inventario actual del almacén para este producto
        const { data: inventarioActual } = await supabase
          .from('inventario_almacenes')
          .select('cantidad')
          .eq('almacen_id', almacenId)
          .eq('producto_id', productoId)
          .single();
        
        const cantidadActual = inventarioActual?.cantidad || 0;
        
        // Si había un peso_neto anterior, primero sumarlo de vuelta (para correcciones)
        const cantidadAjustada = pesoNetoAnterior && pesoNetoAnterior > 0
          ? cantidadActual + pesoNetoAnterior - pesoNeto
          : cantidadActual - pesoNeto;
        
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
          console.error(`[EMBARQUES] Error al actualizar capacidad_actual del almacén ${almacenId}:`, errorCapacidad);
        }
        
        logger.info(`Inventario actualizado para embarque ${id}`, {
          embarqueId: id,
          almacenId,
          productoId,
          pesoNeto,
          cantidadAnterior: cantidadActual,
          cantidadNueva: nuevaCantidad
        }, 'Embarques');
      } catch (inventarioError) {
        // Log el error pero no fallar el guardado del embarque
        const errorMessage = inventarioError instanceof Error ? inventarioError.message : 'Error desconocido';
        logger.error('Error al actualizar inventario después de embarque', {
          error: errorMessage,
          embarqueId: id,
          almacenId,
          productoId,
          pesoNeto
        }, 'Embarques');
        console.error(`[EMBARQUES] Error al actualizar inventario para embarque ${id}:`, errorMessage);
      }
    }
  }
  
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

// Obtener total de salidas de pasta desde el inicio del sistema
export async function getTotalSalidasPasta() {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  // Buscar todos los embarques de productos de pasta completados
  // Productos de pasta típicamente contienen "Pasta" en el nombre
  const { data: embarquesPasta, error } = await supabase
    .from('embarques')
    .select(`
      peso_neto,
      producto:productos(id, nombre),
      estatus
    `)
    .eq('estatus', 'Completado')
    .not('peso_neto', 'is', null);
  
  if (error) throw error;
  
  // Filtrar solo productos de pasta y sumar peso_neto
  const totalSalidas = (embarquesPasta || [])
    .filter(e => {
      const nombreProducto = e.producto?.nombre || '';
      // Identificar productos de pasta (contiene "pasta" en el nombre, sin importar mayúsculas)
      return nombreProducto.toLowerCase().includes('pasta');
    })
    .reduce((total, e) => total + (e.peso_neto || 0), 0);
  
  return totalSalidas;
}

// Obtener salidas por producto desde el inicio del sistema
export async function getSalidasPorProducto(productoId?: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  let query = supabase
    .from('embarques')
    .select(`
      peso_neto,
      producto_id,
      producto:productos(id, nombre),
      estatus
    `)
    .eq('estatus', 'Completado')
    .not('peso_neto', 'is', null);
  
  if (productoId) {
    query = query.eq('producto_id', productoId);
  }
  
  const { data: embarques, error } = await query;
  
  if (error) throw error;
  
  // Agrupar por producto_id y sumar peso_neto
  const salidasPorProducto = (embarques || []).reduce((acc: Record<number, number>, e) => {
    const pid = e.producto_id;
    if (pid) {
      acc[pid] = (acc[pid] || 0) + (e.peso_neto || 0);
    }
    return acc;
  }, {});
  
  if (productoId) {
    // Si se solicitó un producto específico, retornar su total
    return salidasPorProducto[productoId] || 0;
  }
  
  // Si no se especificó producto, retornar objeto con todos los productos
  return salidasPorProducto;
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
  
  // Eliminar movimientos asociados antes de eliminar el embarque
  const { data: movimientos } = await supabase
    .from('movimientos')
    .select('id')
    .eq('boleta', embarqueAnterior.boleta);
  
  if (movimientos && movimientos.length > 0) {
    // Eliminar todos los movimientos asociados
    const { error: errorMovimientos } = await supabase
      .from('movimientos')
      .delete()
      .eq('boleta', embarqueAnterior.boleta);
    
    if (errorMovimientos) {
      logger.error('Error al eliminar movimientos asociados', errorMovimientos, 'Embarques');
      throw new Error(`Error al eliminar movimientos asociados: ${errorMovimientos.message}`);
    }
    
    logger.info(`Eliminados ${movimientos.length} movimiento(s) asociado(s) al embarque`, { boleta: embarqueAnterior.boleta }, 'Embarques');
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


