/**
 * Script para resetear la contraseña del administrador
 * Ejecutar: node scripts/reset-admin-password.js
 * 
 * Requiere variables de entorno:
 * - VITE_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('\n   Asegúrate de tener un archivo .env.local con estas variables');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAdminPassword() {
  try {
    const email = 'administrador@apsistema.com';
    const newPassword = process.argv[2] || 'Admin123';

    console.log('🔐 Reseteando contraseña del administrador...');
    console.log('   Email:', email);
    console.log('   Nueva contraseña:', newPassword);

    // Buscar usuario
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (getUserError || !userData.user) {
      console.error('❌ Usuario administrador no encontrado en auth.users');
      console.error('   Error:', getUserError?.message);
      process.exit(1);
    }

    console.log('✅ Usuario encontrado:', userData.user.id);

    // Actualizar contraseña
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('❌ Error al actualizar contraseña:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Contraseña actualizada exitosamente');
    console.log('\n📋 Credenciales:');
    console.log('   Email:', email);
    console.log('   Contraseña:', newPassword);
    console.log('\n   Ahora puedes iniciar sesión con estas credenciales');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();

