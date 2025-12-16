/**
 * Script para actualizar la contraseña del usuario administrador en auth.users
 * 
 * Ejecutar con: npx tsx scripts/fix_admin_password.ts
 * 
 * Requiere que SUPABASE_SERVICE_ROLE_KEY esté configurada en las variables de entorno
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas');
  console.log('\nPara ejecutar este script:');
  console.log('1. Configura las variables de entorno:');
  console.log('   export VITE_SUPABASE_URL="tu_url"');
  console.log('   export SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"');
  console.log('2. Ejecuta: npx tsx scripts/fix_admin_password.ts');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixAdminPassword() {
  const email = 'administrador@apsistema.com';
  const newPassword = 'Admin123'; // Cambiar esta contraseña si es necesario

  console.log('🔧 Actualizando contraseña del usuario administrador...');
  console.log(`   Email: ${email}`);
  console.log(`   Nueva contraseña: ${newPassword}`);

  try {
    // Obtener el usuario por email
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error al listar usuarios:', listError);
      return;
    }

    const userFound = usersList.users.find(user => user.email?.toLowerCase() === email.toLowerCase());

    if (!userFound) {
      console.error(`❌ Usuario con email ${email} no encontrado en auth.users`);
      console.log('\nUsuarios encontrados en auth.users:');
      usersList.users.forEach(u => {
        console.log(`   - ${u.email} (ID: ${u.id})`);
      });
      return;
    }

    console.log(`✅ Usuario encontrado: ${userFound.email} (ID: ${userFound.id})`);

    // Actualizar la contraseña
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userFound.id,
      {
        password: newPassword,
        email_confirm: true, // Asegurar que el email esté confirmado
      }
    );

    if (updateError) {
      console.error('❌ Error al actualizar contraseña:', updateError);
      return;
    }

    console.log('✅ Contraseña actualizada exitosamente');
    console.log(`\n📝 Credenciales de acceso:`);
    console.log(`   Usuario: administrador`);
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${newPassword}`);
    console.log(`\n🎉 Ahora puedes iniciar sesión con estas credenciales`);

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

fixAdminPassword();

