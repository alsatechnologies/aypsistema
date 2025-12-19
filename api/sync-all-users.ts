/**
 * Endpoint para sincronizar TODOS los usuarios de la tabla usuarios con auth.users
 * Esto asegura que todos los usuarios puedan hacer login
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
    console.log('🔧 [SYNC-ALL-USERS] Verificando variables de entorno...');
    console.log('🔧 [SYNC-ALL-USERS] SUPABASE_URL presente:', !!SUPABASE_URL);
    console.log('🔧 [SYNC-ALL-USERS] SUPABASE_SERVICE_ROLE_KEY presente:', !!SUPABASE_SERVICE_ROLE_KEY);
    console.log('🔧 [SYNC-ALL-USERS] SUPABASE_ANON_KEY presente:', !!SUPABASE_ANON_KEY);

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Supabase no está configurado correctamente. Verifica las variables de entorno en Vercel.',
        debug: {
          hasUrl: !!SUPABASE_URL,
          hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
          hasAnonKey: !!SUPABASE_ANON_KEY,
        }
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

    // Obtener TODOS los usuarios activos de la tabla usuarios
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('activo', true);

    if (usuariosError) {
      return res.status(500).json({
        success: false,
        error: `Error al leer usuarios: ${usuariosError.message}`,
      });
    }

    if (!usuariosData || usuariosData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron usuarios activos en la tabla usuarios',
      });
    }

    console.log(`📋 [SYNC-ALL-USERS] Encontrados ${usuariosData.length} usuarios en tabla usuarios`);

    // Obtener todos los usuarios de auth.users
    const { data: authUsersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return res.status(500).json({
        success: false,
        error: `Error al listar usuarios de auth.users: ${listError.message}`,
      });
    }

    console.log(`📋 [SYNC-ALL-USERS] Encontrados ${authUsersList.users.length} usuarios en auth.users`);

    const results = {
      created: [] as any[],
      updated: [] as any[],
      skipped: [] as any[],
      errors: [] as any[],
    };

    // Sincronizar cada usuario
    for (const usuario of usuariosData) {
      try {
        const existingAuthUser = authUsersList.users.find(
          u => u.email?.toLowerCase() === usuario.correo.toLowerCase()
        );

        // Contraseña por defecto: Admin123 para administrador, el nombre_usuario para otros
        const defaultPassword = usuario.rol === 'Administrador' 
          ? 'Admin123' 
          : (usuario.nombre_usuario || 'Password123');

        if (existingAuthUser) {
          // Usuario existe, actualizar si es necesario
          console.log(`🔄 [SYNC-ALL-USERS] Usuario ${usuario.correo} existe, actualizando...`);
          
          const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingAuthUser.id,
            {
              email_confirm: true,
              user_metadata: {
                nombre_completo: usuario.nombre_completo,
                nombre_usuario: usuario.nombre_usuario || '',
                rol: usuario.rol || '',
              }
            }
          );

          if (updateError) {
            results.errors.push({
              email: usuario.correo,
              error: updateError.message,
            });
          } else {
            results.updated.push({
              email: usuario.correo,
              id: updatedUser.user.id,
            });
          }
        } else {
          // Usuario no existe, crearlo
          console.log(`➕ [SYNC-ALL-USERS] Usuario ${usuario.correo} no existe, creando...`);
          
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: usuario.correo,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: {
              nombre_completo: usuario.nombre_completo,
              nombre_usuario: usuario.nombre_usuario || '',
              rol: usuario.rol || '',
            }
          });

          if (createError || !newUser.user) {
            results.errors.push({
              email: usuario.correo,
              error: createError?.message || 'Error desconocido',
            });
          } else {
            results.created.push({
              email: usuario.correo,
              id: newUser.user.id,
              password: defaultPassword, // Incluir para referencia
            });
          }
        }
      } catch (error) {
        results.errors.push({
          email: usuario.correo,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      message: `Sincronización completada: ${results.created.length} creados, ${results.updated.length} actualizados, ${results.errors.length} errores`,
      results,
      summary: {
        total: usuariosData.length,
        created: results.created.length,
        updated: results.updated.length,
        errors: results.errors.length,
      }
    });
  } catch (error) {
    console.error('❌ [SYNC-ALL-USERS] Error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

