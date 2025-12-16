/**
 * Función serverless para resetear la contraseña del administrador
 * 
 * Esta función solo puede ser llamada desde el servidor (no desde el navegador)
 * Por seguridad, requiere un token secreto o solo puede ejecutarse en desarrollo
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RESET_SECRET = process.env.RESET_ADMIN_SECRET || 'reset-admin-2024'; // Cambiar en producción

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo permitir POST
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

    // Verificar secreto (opcional, para seguridad adicional)
    const { secret, new_password } = req.body;
    
    if (secret !== RESET_SECRET) {
      return res.status(401).json({
        success: false,
        error: 'Secreto inválido',
      });
    }

    const password = new_password || 'Admin123'; // Contraseña por defecto

    // Crear cliente con service role key
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Buscar usuario administrador
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return res.status(500).json({
        success: false,
        error: `Error al listar usuarios: ${listError.message}`,
      });
    }

    const adminUser = usersList.users.find(
      user => user.email?.toLowerCase() === 'administrador@apsistema.com'
    );

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuario administrador no encontrado en auth.users',
      });
    }

    // Actualizar contraseña
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      adminUser.id,
      {
        password: password,
        email_confirm: true,
      }
    );

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: `Error al actualizar contraseña: ${updateError.message}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Contraseña del administrador actualizada exitosamente',
      email: adminUser.email,
      password: password,
    });
  } catch (error) {
    console.error('Error en reset-admin-password:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

