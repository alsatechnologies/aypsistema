import { supabase } from '@/lib/supabase';

export interface ReporteLab {
  id: string; // 'LAB-0001'
  fecha: string;
  responsable: string;
  turno: string;
  estatus: string;
  
  // PLANTA
  planta_textura_promedio?: number | null;
  planta_textura_alto?: number | null;
  planta_textura_bajo?: number | null;
  planta_humedad_promedio?: number | null;
  planta_humedad_alto?: number | null;
  planta_humedad_bajo?: number | null;
  planta_residuales_promedio?: number | null;
  planta_residuales_alto?: number | null;
  planta_residuales_bajo?: number | null;
  planta_temperatura_promedio?: number | null;
  planta_aceite_acidez?: number | null;
  planta_aceite_oleico?: number | null;
  planta_aceite_humedad?: number | null;
  planta_aceite_flash_point?: string | null;
  
  // EXPANDER
  expander_hojuela_residual?: number | null;
  expander_hojuela_humedad?: number | null;
  expander_semilla_humedad?: number | null;
  expander_semilla_contenido_aceite?: number | null;
  expander_costra_vibrador_residual?: number | null;
  expander_costra_vibrador_humedad?: number | null;
  expander_costra_directa_residual?: number | null;
  expander_costra_directa_humedad?: number | null;
  
  // JSONB
  planta_proteina?: Array<{ valor: number; porcentaje: number }> | null;
  expander_aceite?: Array<{
    tipo: string;
    filtroNumeros?: string;
    humedad?: number;
    acidez?: number;
    acidoOleico?: number;
  }> | null;
  
  created_at?: string;
  updated_at?: string;
}

// Obtener todos los reportes
export async function getReportesLab(filters?: {
  fechaDesde?: string;
  fechaHasta?: string;
  estatus?: string;
}) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  let query = supabase
    .from('reportes_laboratorio')
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
  return data;
}

// Crear reporte
export async function createReporteLab(reporte: Omit<ReporteLab, 'created_at' | 'updated_at'>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('reportes_laboratorio')
    .insert(reporte)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Actualizar reporte
export async function updateReporteLab(id: string, reporte: Partial<ReporteLab>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('reportes_laboratorio')
    .update({ ...reporte, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Eliminar reporte (soft delete)
export async function deleteReporteLab(id: string) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('reportes_laboratorio')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
}

// Generar siguiente ID de reporte
export async function getSiguienteIdReporte(): Promise<string> {
  if (!supabase) {
    // Modo desarrollo
    return `LAB-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
  }
  
  const { data, error } = await supabase
    .from('reportes_laboratorio')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  if (!data) {
    return 'LAB-0001';
  }
  
  // Extraer número del último ID
  const ultimoNumero = parseInt(data.id.replace('LAB-', ''), 10);
  const siguienteNumero = ultimoNumero + 1;
  
  return `LAB-${String(siguienteNumero).padStart(4, '0')}`;
}


