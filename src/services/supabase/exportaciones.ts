import { supabase } from '@/lib/supabase';

export interface ClienteExportacion {
  id: number;
  nombre: string;
  tipo_unidad: string;
  activo: boolean;
  created_at?: string;
}

export interface UnidadExportacion {
  id: number;
  identificador: string;
  tipo: 'jumbo' | 'tolva' | 'contenedor';
  estatus: 'activo' | 'en_reparacion' | 'en_transito';
  ubicacion_actual?: string | null;
  fecha_entrada_taller?: string | null;
  notas?: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OrdenExportacion {
  id: number;
  cliente_id: number;
  producto: string;
  fecha_pedido: string;
  fecha_embarque?: string | null;
  unidades_solicitadas: number;
  tipo_unidad: string;
  notas?: string | null;
  estatus: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';
  created_at?: string;
  updated_at?: string;
  cliente?: ClienteExportacion;
  cargas?: CargaExportacion[];
}

export interface CargaExportacion {
  id: number;
  orden_id?: number | null;
  unidad_id?: number | null;
  carga_anterior?: string | null;
  proxima_carga?: string | null;
  ubicacion_actual?: string | null;
  eta_apsa?: string | null;
  fecha_embarque?: string | null;
  estatus: 'pendiente' | 'orden' | 'enviado';
  notas?: string | null;
  peso_neto?: number | null;
  ajuste_kg?: number | null;
  created_at?: string;
  updated_at?: string;
  unidad?: UnidadExportacion;
  orden?: OrdenExportacion;
}

// ─── Clientes ─────────────────────────────────────────────────────────────────

export async function getClientesExportacion() {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data, error } = await supabase
    .from('clientes_exportacion')
    .select('*')
    .eq('activo', true)
    .order('nombre');
  if (error) throw error;
  return data as ClienteExportacion[];
}

export async function createClienteExportacion(cliente: Omit<ClienteExportacion, 'id' | 'created_at'>) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data, error } = await supabase
    .from('clientes_exportacion')
    .insert(cliente)
    .select()
    .single();
  if (error) throw error;
  return data as ClienteExportacion;
}

export async function updateClienteExportacion(id: number, updates: Partial<ClienteExportacion>) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data, error } = await supabase
    .from('clientes_exportacion')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ClienteExportacion;
}

// ─── Unidades ─────────────────────────────────────────────────────────────────

export async function getUnidadesExportacion() {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data, error } = await supabase
    .from('unidades_exportacion')
    .select('*')
    .eq('activo', true)
    .order('tipo')
    .order('identificador');
  if (error) throw error;
  return data as UnidadExportacion[];
}

export async function createUnidadExportacion(unidad: Omit<UnidadExportacion, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data, error } = await supabase
    .from('unidades_exportacion')
    .insert(unidad)
    .select()
    .single();
  if (error) throw error;
  return data as UnidadExportacion;
}

export async function updateUnidadExportacion(id: number, updates: Partial<UnidadExportacion>) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data, error } = await supabase
    .from('unidades_exportacion')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as UnidadExportacion;
}

// ─── Órdenes ──────────────────────────────────────────────────────────────────

export async function getOrdenesExportacion(filtros?: { estatus?: string; cliente_id?: number }) {
  if (!supabase) throw new Error('Supabase no configurado');
  let query = supabase
    .from('ordenes_exportacion')
    .select(`
      *,
      cliente:clientes_exportacion(*),
      cargas:cargas_exportacion(*, unidad:unidades_exportacion(*))
    `)
    .order('fecha_pedido', { ascending: false });

  if (filtros?.estatus) query = query.eq('estatus', filtros.estatus);
  if (filtros?.cliente_id) query = query.eq('cliente_id', filtros.cliente_id);

  const { data, error } = await query;
  if (error) throw error;
  return data as OrdenExportacion[];
}

export async function createOrdenExportacion(orden: Omit<OrdenExportacion, 'id' | 'created_at' | 'updated_at' | 'cliente' | 'cargas'>) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data, error } = await supabase
    .from('ordenes_exportacion')
    .insert(orden)
    .select()
    .single();
  if (error) throw error;
  return data as OrdenExportacion;
}

export async function updateOrdenExportacion(id: number, updates: Partial<OrdenExportacion>) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data, error } = await supabase
    .from('ordenes_exportacion')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as OrdenExportacion;
}

// ─── Cargas ───────────────────────────────────────────────────────────────────

export async function getCargasExportacion(ordenId?: number) {
  if (!supabase) throw new Error('Supabase no configurado');
  let query = supabase
    .from('cargas_exportacion')
    .select(`
      *,
      unidad:unidades_exportacion(*),
      orden:ordenes_exportacion(*, cliente:clientes_exportacion(*))
    `)
    .order('created_at', { ascending: false });

  if (ordenId) query = query.eq('orden_id', ordenId);

  const { data, error } = await query;
  if (error) throw error;
  return data as CargaExportacion[];
}

export async function createCargaExportacion(carga: Omit<CargaExportacion, 'id' | 'created_at' | 'updated_at' | 'unidad' | 'orden'>) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data, error } = await supabase
    .from('cargas_exportacion')
    .insert(carga)
    .select()
    .single();
  if (error) throw error;
  return data as CargaExportacion;
}

export async function updateCargaExportacion(id: number, updates: Partial<CargaExportacion>) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { data, error } = await supabase
    .from('cargas_exportacion')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as CargaExportacion;
}

export async function deleteCargaExportacion(id: number) {
  if (!supabase) throw new Error('Supabase no configurado');
  const { error } = await supabase
    .from('cargas_exportacion')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
