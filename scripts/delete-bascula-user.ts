/**
 * Script temporal para eliminar el usuario de bascula de auth.users
 * Ejecutar desde terminal o como endpoint temporal
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function deleteBasculaUser() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variables de entorno no configuradas');
    return;
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Listar usuarios
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error al listar usuarios:', listError);
      return;
    }

    // Buscar usuario de bascula
    const basculaUser = usersList.users.find(
      u => u.email?.toLowerCase() === 'bascula@apsistema.com'
    );

    if (!basculaUser) {
      console.log('✅ Usuario de bascula no existe en auth.users (ya fue eliminado o nunca existió)');
      return;
    }

    // Eliminar usuario
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(basculaUser.id);

    if (deleteError) {
      console.error('❌ Error al eliminar usuario:', deleteError);
      return;
    }

    console.log('✅ Usuario de bascula eliminado de auth.users correctamente');
    console.log('   Email:', basculaUser.email);
    console.log('   ID:', basculaUser.id);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  deleteBasculaUser();
}

export { deleteBasculaUser };

