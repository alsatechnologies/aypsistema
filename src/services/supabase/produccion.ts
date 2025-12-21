import { supabase } from '@/lib/supabase';

export interface NivelTanque {
  tanque: string;
  nivel: number;
  unidad: string;
}

export interface NivelGoma {
  goma: string;
  nivel: number;
  unidad: string;
}

export interface ReporteProduccion {
  id: string; // 'PROD-0001'
  fecha: string;
  responsable: string;
  turno: 'Matutino' | 'Vespertino' | 'Nocturno';
  estatus: 'Pendiente' | 'En proceso' | 'Completado';
  niveles_tanques?: NivelTanque[] | null;
  niveles_gomas?: NivelGoma[] | null;
  observaciones?: string | null;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Obtener todos los reportes
export async function getReportesProduccion(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  estatus?: string;
}) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  let query = supabase
    .from('reportes_produccion')
    .select('*')
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
  
  const { data, error } = await query;
  if (error) throw error;
  return data as ReporteProduccion[];
}

// Crear reporte
export async function createReporteProduccion(reporte: Omit<ReporteProduccion, 'created_at' | 'updated_at' | 'activo'>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('reportes_produccion')
    .insert({
      ...reporte,
      niveles_tanques: reporte.niveles_tanques || [],
      niveles_gomas: reporte.niveles_gomas || [],
      activo: true
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as ReporteProduccion;
}

// Actualizar reporte
export async function updateReporteProduccion(id: string, reporte: Partial<ReporteProduccion>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('reportes_produccion')
    .update({ ...reporte, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as ReporteProduccion;
}

// Eliminar reporte (soft delete)
export async function deleteReporteProduccion(id: string) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('reportes_produccion')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
}

// Generar siguiente ID de reporte
export async function getSiguienteIdReporteProduccion(): Promise<string> {
  if (!supabase) {
    // Modo desarrollo
    return `PROD-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
  }
  
  const { data, error } = await supabase
    .from('reportes_produccion')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  if (!data) {
    return 'PROD-0001';
  }
  
  // Extraer número del último ID
  const ultimoNumero = parseInt(data.id.replace('PROD-', ''), 10);
  const siguienteNumero = ultimoNumero + 1;
  
  return `PROD-${String(siguienteNumero).padStart(4, '0')}`;
}

