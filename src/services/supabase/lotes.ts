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
// Consecutivo es GLOBAL por tipo_operacion + año (no por combinación completa)
export async function generarCodigoLote(
  tipoOperacionCodigo: string, // 'AC-', 'VN-', 'VE-'
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

  // Consecutivo GLOBAL por tipo_operacion + año (no por combinación completa)
  const { data: consecutivoData, error: consecutivoError } = await supabase
    .from('consecutivos_lotes')
    .select('consecutivo')
    .eq('tipo_operacion_codigo', tipoOperacionCodigo)
    .eq('anio', anio)
    .single();

  let nuevoConsecutivo: number;

  if (consecutivoError && consecutivoError.code === 'PGRST116') {
    // No existe, crear nuevo con consecutivo 1
    nuevoConsecutivo = 1;
    const { error: insertError } = await supabase
      .from('consecutivos_lotes')
      .insert({
        tipo_operacion_codigo: tipoOperacionCodigo,
        origen_codigo: origenCodigo, // Guardamos pero no usamos para el consecutivo
        producto_codigo: productoCodigo, // Guardamos pero no usamos para el consecutivo
        almacen_codigo: almacenCodigo, // Guardamos pero no usamos para el consecutivo
        anio_codigo: anioCodigo,
        anio: anio,
        consecutivo: 1
      });

    if (insertError) throw insertError;
  } else if (consecutivoError) {
    throw consecutivoError;
  } else {
    // Existe, incrementar
    nuevoConsecutivo = consecutivoData.consecutivo + 1;
    const { error: updateError } = await supabase
      .from('consecutivos_lotes')
      .update({ consecutivo: nuevoConsecutivo })
      .eq('tipo_operacion_codigo', tipoOperacionCodigo)
      .eq('anio', anio);

    if (updateError) throw updateError;
  }

  // Formatear consecutivo a 3 dígitos
  const consecutivoStr = String(nuevoConsecutivo).padStart(3, '0');

  // Construir código: AC-17160525-003
  const codigo = `${tipoOperacionCodigo}${origenCodigo}${productoCodigo}${almacenCodigo}${anioCodigo}-${consecutivoStr}`;

  return { codigo, consecutivo: nuevoConsecutivo };
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

  const { data } = await supabase
    .from('productos')
    .select('codigo_lote, codigo_boleta')
    .eq('id', productoId)
    .single();

  // Priorizar codigo_lote si existe, sino usar codigo_boleta
  return data?.codigo_lote || data?.codigo_boleta || '00';
}

// Obtener código de almacén por ID
export async function getCodigoAlmacen(almacenId: number): Promise<string> {
  if (!supabase) {
    return '00';
  }

  const { data } = await supabase
    .from('almacenes')
    .select('codigo_lote')
    .eq('id', almacenId)
    .single();

  return data?.codigo_lote || String(almacenId).padStart(2, '0');
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

  // Obtener códigos
  const origenCodigo = await getCodigoOrigen(clienteId, proveedorId);
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

