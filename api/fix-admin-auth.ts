/**
 * Endpoint temporal para sincronizar el usuario administrador con auth.users
 * Esto corrige el problema de login cuando el usuario existe en usuarios pero no en auth.users
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Leer variables de entorno - intentar múltiples formas
const SUPABASE_URL = 
  process.env.VITE_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  '';
const SUPABASE_SERVICE_ROLE_KEY = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  '';
const SUPABASE_ANON_KEY = 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  '';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Manejar preflight OPTIONS request para CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 [FIX-ADMIN-AUTH] Verificando variables de entorno...');
    console.log('🔧 [FIX-ADMIN-AUTH] SUPABASE_URL presente:', !!SUPABASE_URL);
    console.log('🔧 [FIX-ADMIN-AUTH] SUPABASE_SERVICE_ROLE_KEY presente:', !!SUPABASE_SERVICE_ROLE_KEY);
    console.log('🔧 [FIX-ADMIN-AUTH] SUPABASE_ANON_KEY presente:', !!SUPABASE_ANON_KEY);

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Supabase no está configurado correctamente. Verifica las variables de entorno en Vercel.',
      });
    }

    // Crear cliente admin con service role key
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Crear cliente normal para leer la tabla usuarios
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Obtener usuario administrador de la tabla usuarios
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('correo', 'administrador@apsistema.com')
      .eq('activo', true)
      .maybeSingle();

    if (usuarioError || !usuarioData) {
      return res.status(404).json({
        success: false,
        error: 'Usuario administrador no encontrado en la tabla usuarios',
      });
    }

    console.log('✅ [FIX-ADMIN-AUTH] Usuario encontrado en tabla usuarios:', usuarioData.correo);

    // Verificar si existe en auth.users
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return res.status(500).json({
        success: false,
        error: `Error al listar usuarios: ${listError.message}`,
      });
    }

    const existingAuthUser = usersList.users.find(
      u => u.email?.toLowerCase() === usuarioData.correo.toLowerCase()
    );

    const { password } = req.body || {};
    const passwordToUse = password || 'Admin123'; // Contraseña por defecto

    if (existingAuthUser) {
      // Usuario existe, actualizar contraseña
      console.log('🔄 [FIX-ADMIN-AUTH] Usuario existe en auth.users, actualizando contraseña...');
      
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        {
          password: passwordToUse,
          email_confirm: true,
        }
      );

      if (updateError) {
        return res.status(400).json({
          success: false,
          error: `Error al actualizar usuario: ${updateError.message}`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Usuario administrador actualizado correctamente en auth.users',
        user: updatedUser.user,
        action: 'updated',
      });
    } else {
      // Usuario no existe, crearlo
      console.log('➕ [FIX-ADMIN-AUTH] Usuario no existe en auth.users, creando...');
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: usuarioData.correo,
        password: passwordToUse,
        email_confirm: true,
        user_metadata: {
          nombre_completo: usuarioData.nombre_completo,
          nombre_usuario: usuarioData.nombre_usuario || '',
          rol: usuarioData.rol || '',
        }
      });

      if (createError || !newUser.user) {
        return res.status(400).json({
          success: false,
          error: `Error al crear usuario: ${createError?.message || 'Error desconocido'}`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Usuario administrador creado correctamente en auth.users',
        user: newUser.user,
        action: 'created',
      });
    }
  } catch (error) {
    console.error('❌ [FIX-ADMIN-AUTH] Error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

