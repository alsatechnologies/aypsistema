/**
 * Endpoint TEMPORAL para resetear la contraseña del administrador
 * SOLO PARA USO DE EMERGENCIA - ELIMINAR DESPUÉS
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
        error: 'Supabase no está configurado correctamente. Verifica las variables de entorno en Vercel.',
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const email = 'administrador@apsistema.com';
    const newPassword = req.body.password || 'Admin123';

    // Buscar usuario
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (getUserError || !userData.user) {
      return res.status(404).json({
        success: false,
        error: `Usuario administrador no encontrado en auth.users. Necesita ser creado primero.`,
      });
    }

    // Actualizar contraseña
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.user.id,
      { password: newPassword }
    );

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: `Error al actualizar contraseña: ${updateError.message}`,
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      message: 'Contraseña del administrador actualizada exitosamente',
      credentials: {
        email: email,
        password: newPassword,
        note: 'Ahora puedes iniciar sesión con estas credenciales'
      }
    });
  } catch (error) {
    console.error('Error en reset-admin-password-direct:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

