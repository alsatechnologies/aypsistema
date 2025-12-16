import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Manejar preflight OPTIONS request para CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Solo permitir PUT
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(500).json({
        success: false,
        error: 'Supabase no está configurado correctamente',
      });
    }

    const { email, password, new_email } = req.body;

    if (!email) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(400).json({
        success: false,
        error: 'Email es requerido',
      });
    }

    // Crear cliente con service role key
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Obtener usuario por email
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (getUserError || !userData?.user) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado en auth.users',
      });
    }

    const userId = userData.user.id;
    const updateData: any = {};

    if (password) {
      updateData.password = password;
    }

    if (new_email && new_email !== email) {
      updateData.email = new_email;
      updateData.email_confirm = true;
    }

    // Actualizar usuario
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updateData
    );

    if (updateError) {
      console.error('Error actualizando usuario en auth.users:', updateError);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(400).json({
        success: false,
        error: updateError.message || 'Error al actualizar usuario en auth.users',
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      user: updatedUser.user,
      message: 'Usuario actualizado en auth.users correctamente',
    });
  } catch (error) {
    console.error('Error en update-auth-user:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar usuario',
    });
  }
}

