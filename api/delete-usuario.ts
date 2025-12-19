/**
 * Endpoint serverless para eliminar usuarios usando Service Role Key
 * Bypass RLS para permitir que administradores eliminen usuarios
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Leer TODAS las variantes posibles de variables de entorno
const SUPABASE_URL = 
  process.env.VITE_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  '';
const SUPABASE_SERVICE_ROLE_KEY = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  '';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar variables de entorno
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Variables de entorno faltantes');
      return res.status(500).json({
        success: false,
        error: 'Configuración de Supabase incompleta',
      });
    }

    const { usuarioId, email } = req.body;

    if (!usuarioId) {
      return res.status(400).json({
        success: false,
        error: 'ID de usuario es requerido',
      });
    }

    // Crear cliente con Service Role Key
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar que no sea el administrador (protección)
    const { data: usuarioData } = await supabaseAdmin
      .from('usuarios')
      .select('rol, correo')
      .eq('id', usuarioId)
      .single();

    if (usuarioData?.rol === 'Administrador') {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el usuario administrador',
      });
    }

    // Eliminar de auth.users si se proporciona el email
    if (email) {
      try {
        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
        const userToDelete = usersList?.users.find(
          (u: any) => u.email?.toLowerCase() === email.toLowerCase()
        );
        
        if (userToDelete) {
          await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
        }
      } catch (authError) {
        // Continuar aunque falle auth.users
        console.warn('⚠️ No se pudo eliminar de auth.users:', authError);
      }
    }

    // Eliminar PERMANENTEMENTE de la tabla usuarios
    const { error: deleteError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', usuarioId);

    if (deleteError) {
      console.error('❌ Error eliminando usuario:', deleteError);
      return res.status(400).json({
        success: false,
        error: deleteError.message || 'Error al eliminar usuario',
        code: deleteError.code,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente',
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}
