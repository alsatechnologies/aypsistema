/**
 * Endpoint temporal para verificar/crear usuario Oficina
 * Útil para solucionar problemas de login
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Supabase no está configurado correctamente',
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const supabaseAnon = createClient(
      SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
    );

    // Buscar usuario oficina en la tabla usuarios
    const { data: usuarioDB, error: errorDB } = await supabaseAnon
      .from('usuarios')
      .select('*')
      .or('nombre_usuario.eq.oficina,correo.eq.oficina@apsistema.com')
      .eq('activo', true)
      .maybeSingle();

    if (errorDB) {
      return res.status(500).json({
        success: false,
        error: `Error buscando usuario: ${errorDB.message}`,
      });
    }

    if (!usuarioDB) {
      return res.status(404).json({
        success: false,
        error: 'Usuario Oficina no encontrado en la tabla usuarios. Debe crearlo primero desde Configuración → Usuarios.',
      });
    }

    const correoOficina = usuarioDB.correo || 'oficina@apsistema.com';
    const passwordDefault = 'Admin123';

    // Verificar si existe en auth.users
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return res.status(500).json({
        success: false,
        error: `Error listando usuarios: ${listError.message}`,
      });
    }

    const authUserExists = authUsers.users.find(u => u.email === correoOficina);

    if (authUserExists) {
      // Usuario existe, intentar actualizar contraseña
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        authUserExists.id,
        {
          password: passwordDefault,
          email_confirm: true
        }
      );

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: `Error actualizando contraseña: ${updateError.message}`,
        });
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({
        success: true,
        message: `Usuario Oficina ya existe en auth.users. Contraseña actualizada a: ${passwordDefault}`,
        usuario: {
          correo: correoOficina,
          nombre_usuario: usuarioDB.nombre_usuario,
          password: passwordDefault
        }
      });
    }

    // Crear usuario en auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: correoOficina,
      password: passwordDefault,
      email_confirm: true,
      user_metadata: {
        nombre_completo: usuarioDB.nombre_completo,
        nombre_usuario: usuarioDB.nombre_usuario || 'oficina',
        rol: usuarioDB.rol
      }
    });

    if (authError || !authUser.user) {
      return res.status(500).json({
        success: false,
        error: authError?.message || 'Error al crear usuario en auth.users',
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      message: `Usuario Oficina creado en auth.users. Puedes iniciar sesión con: ${correoOficina} / ${passwordDefault}`,
      usuario: {
        correo: correoOficina,
        nombre_usuario: usuarioDB.nombre_usuario || 'oficina',
        password: passwordDefault
      }
    });
  } catch (error) {
    console.error('Error en fix-oficina-user:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

