/**
 * Script para resetear la contraseña del administrador en auth.users
 * 
 * Uso:
 * 1. Configurar variables de entorno:
 *    export SUPABASE_URL="https://tu-proyecto.supabase.co"
 *    export SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"
 *    export NEW_PASSWORD="tu_nueva_contraseña"
 * 
 * 2. Ejecutar: npx ts-node scripts/reset_admin_password.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const NEW_PASSWORD = process.env.NEW_PASSWORD || 'Admin123';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas');
  process.exit(1);
}

// Crear cliente con service role key (tiene permisos de administrador)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAdminPassword() {
  console.log('🔐 Reseteando contraseña del administrador...\n');

  try {
    const adminEmail = 'admin@test.com';

    // Obtener el usuario admin
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(adminEmail);

    if (getUserError || !userData?.user) {
      console.error(`❌ Error obteniendo usuario: ${getUserError?.message}`);
      console.log('\n💡 Intentando crear el usuario si no existe...');
      
      // Intentar crear el usuario si no existe
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: NEW_PASSWORD,
        email_confirm: true,
        user_metadata: {
          nombre_completo: 'Administrador',
          rol: 'Administrador'
        }
      });

      if (createError) {
        console.error(`❌ Error creando usuario: ${createError.message}`);
        process.exit(1);
      }

      console.log(`✅ Usuario creado: ${adminEmail}`);
      console.log(`✅ Contraseña establecida: ${NEW_PASSWORD}`);
      return;
    }

    const userId = userData.user.id;
    console.log(`✅ Usuario encontrado: ${adminEmail} (ID: ${userId})`);

    // Actualizar la contraseña
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: NEW_PASSWORD
      }
    );

    if (updateError) {
      console.error(`❌ Error actualizando contraseña: ${updateError.message}`);
      process.exit(1);
    }

    console.log(`\n✅ Contraseña actualizada exitosamente`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Nueva contraseña: ${NEW_PASSWORD}`);
    console.log(`\n💡 Ahora puedes iniciar sesión con estas credenciales`);

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar
resetAdminPassword()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  });

