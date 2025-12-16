/**
 * Función temporal para resetear la contraseña del administrador
 * Esta función usa la Service Role Key directamente (solo para uso temporal)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://higgudeoopxwcvdrhudl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZ2d1ZGVvb3B4d2N2ZHJodWRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA1MjYzNiwiZXhwIjoyMDgwNjI4NjM2fQ.tBQUtqSLd8wQ31XNScDsl5DZ_2Awu9ju7NjZSNt2dFw';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { new_password } = req.body;
    const password = new_password || 'Admin123';

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
        available_users: usersList.users.map(u => u.email),
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
      user_id: adminUser.id,
    });
  } catch (error) {
    console.error('Error en reset-admin-direct:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

