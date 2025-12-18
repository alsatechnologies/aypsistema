/**
 * Endpoint temporal para crear el usuario Oficina en auth.users
 * SOLO EJECUTAR UNA VEZ - Luego eliminar este archivo
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
        error: 'Supabase no está configurado correctamente',
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar si ya existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail('oficina@apsistema.com');
    
    if (existingUser.user) {
      return res.status(200).json({
        success: true,
        message: 'El usuario ya existe en auth.users',
        user: existingUser.user,
      });
    }

    // Crear usuario
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'oficina@apsistema.com',
      password: 'Admin123',
      email_confirm: true,
      user_metadata: {
        nombre_completo: 'Usuario Oficina',
        nombre_usuario: 'oficina',
        rol: 'Oficina'
      }
    });

    if (authError || !authUser.user) {
      return res.status(400).json({
        success: false,
        error: authError?.message || 'Error al crear usuario en auth.users',
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      message: 'Usuario Oficina creado exitosamente en auth.users',
      user: authUser.user,
    });
  } catch (error) {
    console.error('Error en create-oficina-user-once:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

