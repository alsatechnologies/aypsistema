/**
 * Endpoint serverless para eliminar usuarios usando Service Role Key
 * Bypass RLS para permitir que administradores eliminen usuarios
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Supabase no está configurado correctamente. Verifica las variables de entorno en Vercel.',
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
        const { data: userData } = await supabaseAdmin.auth.admin.getUserByEmail(email);
        if (userData?.user) {
          await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
          console.log('Usuario eliminado de auth.users:', email);
        }
      } catch (authError) {
        console.warn('Advertencia: No se pudo eliminar de auth.users:', authError);
        // Continuar de todas formas
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
      return res.status(400).json({
        success: false,
        error: `Error al eliminar usuario: ${deleteError.message}`,
        details: deleteError,
      });
    }

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

