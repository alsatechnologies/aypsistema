/**
 * Endpoint serverless para eliminar usuarios usando Service Role Key
 * Bypass RLS para permitir que administradores eliminen usuarios
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Leer variables de entorno - en Vercel las funciones serverless pueden acceder a VITE_ variables
// pero también intentamos sin prefijo por si acaso
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log para debugging (sin exponer valores sensibles)
    console.log('🔧 [DELETE-USUARIO] Verificando variables de entorno...');
    console.log('🔧 [DELETE-USUARIO] SUPABASE_URL presente:', !!SUPABASE_URL);
    console.log('🔧 [DELETE-USUARIO] SUPABASE_SERVICE_ROLE_KEY presente:', !!SUPABASE_SERVICE_ROLE_KEY);
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ [DELETE-USUARIO] Variables faltantes:', {
        SUPABASE_URL: SUPABASE_URL ? 'presente' : 'FALTANTE',
        SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? 'presente' : 'FALTANTE',
        envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
      });
      return res.status(500).json({
        success: false,
        error: 'Supabase no está configurado correctamente. Verifica que VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén configuradas en Vercel.',
        debug: {
          hasUrl: !!SUPABASE_URL,
          hasKey: !!SUPABASE_SERVICE_ROLE_KEY
        }
      });
    }

    const { usuarioId, email } = req.body;

    if (!usuarioId) {
      return res.status(400).json({
        success: false,
        error: 'ID de usuario es requerido',
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Eliminar de auth.users si se proporciona el email
    if (email) {
      try {
        // Buscar usuario por email usando listUsers (getUserByEmail no existe en la API)
        const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.warn('Error al listar usuarios en auth.users:', listError.message);
        } else {
          // Buscar el usuario por email
          const userToDelete = usersList.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
          
          if (userToDelete) {
            const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
            if (deleteAuthError) {
              console.warn('Advertencia: No se pudo eliminar de auth.users:', deleteAuthError.message);
            } else {
              console.log('Usuario eliminado de auth.users:', email);
            }
          } else {
            console.log('Usuario no encontrado en auth.users (puede que no exista):', email);
          }
        }
      } catch (authError) {
        console.warn('Advertencia: Error al eliminar de auth.users:', authError);
        // Continuar de todas formas - el soft delete en usuarios es más importante
      }
    }

    // Eliminar de la tabla usuarios (soft delete usando Service Role Key)
    const { error: deleteError } = await supabaseAdmin
      .from('usuarios')
      .update({ 
        activo: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', usuarioId);

    if (deleteError) {
      console.error('Error eliminando usuario:', deleteError);
      console.error('Detalles del error:', JSON.stringify(deleteError, null, 2));
      return res.status(400).json({
        success: false,
        error: `Error al eliminar usuario: ${deleteError.message}`,
        details: deleteError,
        code: deleteError.code,
        hint: deleteError.hint,
      });
    }

    console.log(`Usuario ${usuarioId} eliminado correctamente (soft delete)`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente',
    });
  } catch (error) {
    console.error('Error en delete-usuario:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

