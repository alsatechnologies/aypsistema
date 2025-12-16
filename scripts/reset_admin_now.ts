/**
 * Script temporal para resetear la contraseña del administrador
 * 
 * Ejecutar con: npx tsx scripts/reset_admin_now.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://higgudeoopxwcvdrhudl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZ2d1ZGVvb3B4d2N2ZHJodWRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA1MjYzNiwiZXhwIjoyMDgwNjI4NjM2fQ.tBQUtqSLd8wQ31XNScDsl5DZ_2Awu9ju7NjZSNt2dFw';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resetAdminPassword() {
  const email = 'administrador@apsistema.com';
  const newPassword = 'Admin123';

  console.log('🔧 Reseteando contraseña del administrador...');
  console.log(`   Email: ${email}`);
  console.log(`   Nueva contraseña: ${newPassword}\n`);

  try {
    // Obtener el usuario por email
    console.log('📋 Listando usuarios...');
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error al listar usuarios:', listError);
      return;
    }

    console.log(`✅ Encontrados ${usersList.users.length} usuarios en auth.users`);

    const userFound = usersList.users.find(user => user.email?.toLowerCase() === email.toLowerCase());

    if (!userFound) {
      console.error(`❌ Usuario con email ${email} no encontrado en auth.users`);
      console.log('\nUsuarios encontrados:');
      usersList.users.forEach(u => {
        console.log(`   - ${u.email} (ID: ${u.id.substring(0, 8)}...)`);
      });
      return;
    }

    console.log(`✅ Usuario encontrado:`);
    console.log(`   ID: ${userFound.id}`);
    console.log(`   Email: ${userFound.email}`);
    console.log(`   Email confirmado: ${userFound.email_confirmed_at ? 'Sí' : 'No'}\n`);

    // Actualizar la contraseña
    console.log('🔑 Actualizando contraseña...');
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userFound.id,
      {
        password: newPassword,
        email_confirm: true, // Asegurar que el email esté confirmado
      }
    );

    if (updateError) {
      console.error('❌ Error al actualizar contraseña:', updateError);
      console.error('   Detalles:', JSON.stringify(updateError, null, 2));
      return;
    }

    console.log('✅ Contraseña actualizada exitosamente!\n');
    console.log('📝 Credenciales de acceso:');
    console.log(`   Usuario: administrador`);
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${newPassword}\n`);
    console.log('🎉 Ahora puedes iniciar sesión con estas credenciales');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

resetAdminPassword();

