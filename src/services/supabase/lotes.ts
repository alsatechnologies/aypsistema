import { supabase } from '@/lib/supabase';

export interface TipoOperacionLote {
  id: number;
  codigo: string; // 'AC-', 'CH-', etc.
  nombre: string;
  activo: boolean;
  created_at?: string;
}

export interface OrigenLote {
  id: number;
  codigo: string; // '00', '01', '02', etc.
  nombre: string;
  cliente_id: number | null;
  proveedor_id: number | null;
  tipo: 'Cliente' | 'Proveedor' | 'Otros';
  activo: boolean;
  created_at?: string;
}

export interface Lote {
  id: number;
  codigo_lote: string; // 'AC-02071125-111'
  tipo_operacion_codigo: string;
  origen_codigo: string;
  producto_codigo: string;
  almacen_codigo: string;
  anio_codigo: string;
  consecutivo: number;
  tipo_operacion_id: number | null;
  origen_id: number | null;
  producto_id: number;
  almacen_id: number;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
}

export interface ConsecutivoLote {
  id: number;
  tipo_operacion_codigo: string;
  origen_codigo: string;
  producto_codigo: string;
  almacen_codigo: string;
  anio_codigo: string;
  anio: number;
  consecutivo: number;
}

// Generar código de lote según el formato: AC-17160525-003
// Consecutivo es POR TIPO DE OPERACIÓN + PRODUCTO
// (cliente, almacén, año NO afectan el consecutivo)
export async function generarCodigoLote(
  tipoOperacionCodigo: string, // 'AC-', 'NL-', 'EX-'
  origenCodigo: string, // '17'
  productoCodigo: string, // '16'
  almacenCodigo: string, // '05'
  anioCodigo: string, // '25'
  anio: number // 2025
): Promise<{ codigo: string; consecutivo: number }> {
  if (!supabase) {
    // Modo desarrollo sin Supabase - generar consecutivo mock
    const consecutivo = Math.floor(Math.random() * 999) + 1;
    const consecutivoStr = String(consecutivo).padStart(3, '0');
    const codigo = `${tipoOperacionCodigo}${origenCodigo}${productoCodigo}${almacenCodigo}${anioCodigo}-${consecutivoStr}`;
    return { codigo, consecutivo };
  }

  // Consecutivo POR TIPO DE OPERACIÓN + PRODUCTO
  // (cliente, almacén, año NO afectan el consecutivo)
  // Usar función SQL atómica para evitar condiciones de carrera
  // IMPORTANTE: Solo usamos RPC - si falla, lanzamos error para solucionar la causa
  
  const MAX_RETRIES = 3;
  let intentos = MAX_RETRIES;
  let ultimoError: any = null;
  
  while (intentos > 0) {
    const { data: consecutivoDataArray, error: rpcError } = await supabase
      .rpc('incrementar_o_crear_consecutivo_lote', {
        p_tipo_operacion_codigo: tipoOperacionCodigo,
        p_origen_codigo: origenCodigo,
        p_producto_codigo: productoCodigo,
        p_almacen_codigo: almacenCodigo,
        p_anio_codigo: anioCodigo,
        p_anio: anio
      });

    // Si no hay error y hay datos, éxito
    if (!rpcError && consecutivoDataArray && consecutivoDataArray.length > 0) {
      const consecutivoData = consecutivoDataArray[0];
      const nuevoConsecutivo = consecutivoData.consecutivo;
      
      // Log para debugging
      console.log('[LOTES] Consecutivo generado (RPC):', {
        tipoOperacionCodigo,
        productoCodigo,
        nuevoConsecutivo,
        consecutivoId: consecutivoData.id
      });
      
      // Formatear consecutivo a 3 dígitos
      const consecutivoStr = String(nuevoConsecutivo).padStart(3, '0');
      const codigo = `${tipoOperacionCodigo}${origenCodigo}${productoCodigo}${almacenCodigo}${anioCodigo}-${consecutivoStr}`;
      
      return { codigo, consecutivo: nuevoConsecutivo };
    }
    
    // Analizar el tipo de error
    const errorCode = rpcError?.code;
    const errorMessage = rpcError?.message || '';
    const errorDetails = rpcError?.details || '';
    const errorHint = rpcError?.hint || '';
    
    // Errores CRÍTICOS que NO deben reintentar - lanzar error inmediatamente
    if (
      errorMessage.includes('does not exist') ||
      errorMessage.includes('function') && errorMessage.includes('not found') ||
      errorMessage.includes('permission denied') ||
      errorMessage.includes('row-level security') ||
      errorMessage.includes('RLS') ||
      errorCode === 'PGRST301' && errorMessage.includes('function')
    ) {
      console.error('[LOTES] Error crítico en función RPC - no se puede continuar:', {
        error: rpcError,
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
        hint: errorHint,
        tipoOperacionCodigo,
        productoCodigo
      });
      
      throw new Error(
        `❌ Error crítico: La función RPC 'incrementar_o_crear_consecutivo_lote' no está disponible o no tienes permisos.\n\n` +
        `Causa: ${errorMessage}\n` +
        `Código: ${errorCode || 'N/A'}\n\n` +
        `SOLUCIÓN REQUERIDA:\n` +
        `1. Verifica que la migración '018_fix_consecutivo_skip_locked.sql' esté aplicada en Supabase\n` +
        `2. Verifica los permisos RLS de la tabla 'consecutivos_lotes'\n` +
        `3. Verifica que la función existe: SELECT proname FROM pg_proc WHERE proname = 'incrementar_o_crear_consecutivo_lote';\n\n` +
        `Parámetros usados: tipo=${tipoOperacionCodigo}, producto=${productoCodigo}`
      );
    }
    
    // Errores TEMPORALES que pueden reintentar (timeout, conexión, red)
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('network') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorCode === 'PGRST301' // Timeout de PostgREST
    ) {
      ultimoError = rpcError;
      intentos--;
      
      console.warn(`[LOTES] Error temporal en RPC (intentos restantes: ${intentos}):`, {
        error: errorMessage,
        code: errorCode,
        tipoOperacionCodigo,
        productoCodigo
      });
      
      if (intentos > 0) {
        // Esperar antes de reintentar (exponential backoff: 1s, 2s, 3s)
        const delay = (MAX_RETRIES - intentos) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // Reintentar
      }
    } else {
      // Error desconocido - no reintentar, lanzar error
      console.error('[LOTES] Error desconocido en función RPC:', {
        error: rpcError,
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
        hint: errorHint,
        tipoOperacionCodigo,
        productoCodigo
      });
      
      throw new Error(
        `❌ Error desconocido al llamar función RPC 'incrementar_o_crear_consecutivo_lote':\n\n` +
        `Mensaje: ${errorMessage}\n` +
        `Código: ${errorCode || 'N/A'}\n` +
        `Detalles: ${errorDetails || 'N/A'}\n` +
        `Hint: ${errorHint || 'N/A'}\n\n` +
        `Parámetros: tipo=${tipoOperacionCodigo}, producto=${productoCodigo}\n\n` +
        `Por favor, reporta este error al administrador del sistema.`
      );
    }
  }
  
  // Si todos los reintentos fallaron (solo para errores temporales)
  throw new Error(
    `❌ Error: No se pudo generar consecutivo después de ${MAX_RETRIES} intentos.\n\n` +
    `Último error: ${ultimoError?.message || 'Desconocido'}\n` +
    `Código: ${ultimoError?.code || 'N/A'}\n\n` +
    `Posibles causas:\n` +
    `- Problemas de conexión a la base de datos\n` +
    `- Timeout en la función RPC\n` +
    `- La base de datos está sobrecargada\n\n` +
    `Intenta nuevamente en unos momentos. Si el problema persiste, contacta al administrador.\n\n` +
    `Parámetros: tipo=${tipoOperacionCodigo}, producto=${productoCodigo}`
  );
}

// Obtener tipos de operación
export async function getTiposOperacionLote() {
  if (!supabase) {
    // Datos mock para desarrollo
    return [
      { id: 1, codigo: 'CH-', nombre: 'COSECHA', activo: true },
      { id: 2, codigo: 'AC-', nombre: 'ACOPIO', activo: true },
      { id: 3, codigo: 'NL-', nombre: 'VENTA NACIONAL', activo: true },
      { id: 4, codigo: 'EX-', nombre: 'VENTA EXPORTACIÓN', activo: true },
      { id: 5, codigo: 'IV-', nombre: 'INGRESOS VARIOS', activo: true },
      { id: 6, codigo: 'MT-', nombre: 'MUESTRAS DE PAQUETERÍA', activo: true },
      { id: 7, codigo: 'IN-', nombre: 'INSUMOS', activo: true },
      { id: 8, codigo: 'MAC-', nombre: 'MOVIMIENTO ENTRE ACOPIOS', activo: true },
      { id: 9, codigo: 'OT-', nombre: 'OTROS', activo: true },
      { id: 10, codigo: 'PT', nombre: 'PRODUCTO TERMINADO', activo: true },
      { id: 11, codigo: 'MP', nombre: 'MATERIA PRIMA', activo: true },
    ];
  }

  const { data, error } = await supabase
    .from('tipos_operacion_lote')
    .select('*')
    .eq('activo', true)
    .order('codigo');
  if (error) throw error;
  return data;
}

// Obtener orígenes
export async function getOrigenesLote() {
  if (!supabase) {
    // Datos mock para desarrollo
    return [
      { id: 1, codigo: '00', nombre: 'OTROS', tipo: 'Otros' as const, cliente_id: null, proveedor_id: null, activo: true },
      { id: 2, codigo: '01', nombre: 'ACEITES Y PROTEÍNAS S.A. DE C.V.', tipo: 'Cliente' as const, cliente_id: null, proveedor_id: null, activo: true },
      { id: 3, codigo: '02', nombre: 'SEMILLAS Y FORRAJES DE GUAMÚCHIL S. C. DE R. L.', tipo: 'Proveedor' as const, cliente_id: null, proveedor_id: null, activo: true },
    ];
  }

  const { data, error } = await supabase
    .from('origenes_lote')
    .select('*')
    .eq('activo', true)
    .order('codigo');
  if (error) throw error;
  return data;
}

// Crear lote
export async function createLote(lote: Omit<Lote, 'id' | 'codigo_lote' | 'created_at' | 'updated_at'>): Promise<Lote> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { codigo, consecutivo } = await generarCodigoLote(
    lote.tipo_operacion_codigo,
    lote.origen_codigo,
    lote.producto_codigo,
    lote.almacen_codigo,
    lote.anio_codigo,
    lote.anio
  );

  const { data, error } = await supabase
    .from('lotes')
    .insert({
      ...lote,
      codigo_lote: codigo,
      consecutivo: consecutivo
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Obtener todos los lotes con relaciones
export async function getLotes(filters?: {
  anio?: number;
  activo?: boolean;
  tipo_operacion_codigo?: string;
  producto_codigo?: string;
}) {
  if (!supabase) {
    // Datos mock para desarrollo
    return [];
  }

  let query = supabase
    .from('lotes')
    .select(`
      *,
      tipo_operacion:tipos_operacion_lote(*),
      origen:origenes_lote(*),
      producto:productos(*),
      almacen:almacenes(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.anio) {
    query = query.eq('anio', filters.anio);
  }
  if (filters?.activo !== undefined) {
    query = query.eq('activo', filters.activo);
  }
  if (filters?.tipo_operacion_codigo) {
    query = query.eq('tipo_operacion_codigo', filters.tipo_operacion_codigo);
  }
  if (filters?.producto_codigo) {
    query = query.eq('producto_codigo', filters.producto_codigo);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Actualizar lote
export async function updateLote(id: number, lote: Partial<Lote>): Promise<Lote> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('lotes')
    .update({ ...lote, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar lote (soft delete)
export async function deleteLote(id: number): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { error } = await supabase
    .from('lotes')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// Obtener código de origen (cliente/proveedor) por ID
export async function getCodigoOrigen(clienteId?: number | null, proveedorId?: number | null): Promise<string> {
  if (!supabase) {
    return '00'; // Default en desarrollo
  }

  if (clienteId) {
    const { data } = await supabase
      .from('origenes_lote')
      .select('codigo')
      .eq('cliente_id', clienteId)
      .eq('activo', true)
      .single();
    
    if (data) return data.codigo;
  }

  if (proveedorId) {
    const { data } = await supabase
      .from('origenes_lote')
      .select('codigo')
      .eq('proveedor_id', proveedorId)
      .eq('activo', true)
      .single();
    
    if (data) return data.codigo;
  }

  return '00'; // 'OTROS' por defecto
}

// Obtener código de producto por ID
export async function getCodigoProducto(productoId: number): Promise<string> {
  if (!supabase) {
    // En desarrollo, buscar en productos locales
    return '00';
  }

  const { data, error } = await supabase
    .from('productos')
    .select('codigo_lote, codigo_boleta, nombre')
    .eq('id', productoId)
    .single();

  if (error) {
    throw new Error(`Error al obtener código de producto (ID: ${productoId}): ${error.message}`);
  }

  if (!data) {
    throw new Error(`Producto no encontrado (ID: ${productoId})`);
  }

  // Priorizar codigo_lote si existe, sino usar '41' (Otros)
  const codigo = data.codigo_lote || '41';
  
  if (!data.codigo_lote) {
    console.warn(`Producto ${data.nombre} (ID: ${productoId}) no tiene código de lote configurado, usando '41' (Otros)`);
  }
  
  return codigo;
}

// Obtener código de almacén por ID
export async function getCodigoAlmacen(almacenId: number): Promise<string> {
  if (!supabase) {
    return '00';
  }

  const { data, error } = await supabase
    .from('almacenes')
    .select('codigo_lote, nombre')
    .eq('id', almacenId)
    .single();

  if (error) {
    throw new Error(`Error al obtener código de almacén (ID: ${almacenId}): ${error.message}`);
  }

  if (!data) {
    throw new Error(`Almacén no encontrado (ID: ${almacenId})`);
  }

  const codigo = data.codigo_lote || String(almacenId).padStart(2, '0');
  
  if (!data.codigo_lote) {
    console.warn(`Almacén ${data.nombre} (ID: ${almacenId}) no tiene código de lote configurado, usando ID como código`);
  }
  
  return codigo;
}

// Generar código de lote automáticamente para una operación
export async function generarCodigoLoteParaOperacion(
  tipoOperacion: 'Reciba' | 'Embarque Nacional' | 'Embarque Exportación',
  clienteId?: number | null,
  proveedorId?: number | null,
  productoId: number,
  almacenId: number,
  anio: number = new Date().getFullYear()
): Promise<{ codigo: string; consecutivo: number }> {
  // Mapear tipo de operación a código según la tabla oficial
  const tipoOperacionCodigo = tipoOperacion === 'Reciba' ? 'AC-' : 
                               tipoOperacion === 'Embarque Nacional' ? 'NL-' : 'EX-';
  
  const anioCodigo = String(anio).slice(-2);

  // Para embarques (NL y EX), el origen siempre es ACEITE Y PROTEINAS SA DE CV (código '01')
  // porque el que vende siempre es Aceite y Proteínas
  let origenCodigo: string;
  if (tipoOperacion === 'Embarque Nacional' || tipoOperacion === 'Embarque Exportación') {
    origenCodigo = '01'; // ACEITE Y PROTEINAS SA DE CV
  } else {
    // Para Reciba, usar el proveedor
    origenCodigo = await getCodigoOrigen(clienteId, proveedorId);
  }

  const productoCodigo = await getCodigoProducto(productoId);
  const almacenCodigo = await getCodigoAlmacen(almacenId);

  // Generar código
  return await generarCodigoLote(
    tipoOperacionCodigo,
    origenCodigo,
    productoCodigo,
    almacenCodigo,
    anioCodigo,
    anio
  );
}

