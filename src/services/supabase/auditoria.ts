import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';

export interface AuditoriaEntry {
  tabla: string;
  registro_id: number;
  accion: 'INSERT' | 'UPDATE' | 'DELETE' | 'DELETE_PERMANENT';
  datos_anteriores?: Record<string, any> | null;
  datos_nuevos?: Record<string, any> | null;
  usuario_id?: number | null;
  usuario_email?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * Registra una entrada en la tabla de auditoría
 * Esta función debe llamarse después de cada operación INSERT, UPDATE o DELETE
 */
export async function registrarAuditoria(entry: AuditoriaEntry): Promise<void> {
  if (!supabase) {
    logger.warn('Supabase no está configurado, no se puede registrar auditoría', undefined, 'Auditoria');
    return;
  }

  try {
    // Obtener información del usuario actual
    const { data: { session } } = await supabase.auth.getSession();
    const usuario_email = session?.user?.email || null;
    
    // Obtener usuario_id desde la tabla usuarios si existe
    let usuario_id: number | null = null;
    if (usuario_email) {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('id')
        .eq('correo', usuario_email)
        .eq('activo', true)
        .single();
      
      if (usuario) {
        usuario_id = usuario.id;
      }
    }

    // Obtener IP y User Agent (si está disponible en el navegador)
    const ip_address = null; // En el navegador no podemos obtener IP real
    const user_agent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

    const { error } = await supabase
      .from('auditoria')
      .insert({
        tabla: entry.tabla,
        registro_id: entry.registro_id,
        accion: entry.accion,
        datos_anteriores: entry.datos_anteriores || null,
        datos_nuevos: entry.datos_nuevos || null,
        usuario_id: entry.usuario_id || usuario_id,
        usuario_email: entry.usuario_email || usuario_email,
        ip_address: entry.ip_address || ip_address,
        user_agent: entry.user_agent || user_agent,
      });

    if (error) {
      // No lanzar error para no interrumpir el flujo principal
      logger.error('Error al registrar en auditoría', error, 'Auditoria');
    }
  } catch (error) {
    // No lanzar error para no interrumpir el flujo principal
    logger.error('Error al registrar en auditoría', error, 'Auditoria');
  }
}

/**
 * Obtener historial de auditoría para una tabla y registro específico
 */
export async function getAuditoriaPorRegistro(
  tabla: string,
  registro_id: number
): Promise<any[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('auditoria')
    .select('*')
    .eq('tabla', tabla)
    .eq('registro_id', registro_id)
    .order('fecha_hora', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Obtener historial de auditoría para una tabla
 */
export async function getAuditoriaPorTabla(
  tabla: string,
  limit: number = 100
): Promise<any[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('auditoria')
    .select('*')
    .eq('tabla', tabla)
    .order('fecha_hora', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

