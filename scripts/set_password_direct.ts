/**
 * Script para establecer contraseña directamente sin email
 * 
 * Uso:
 * export SUPABASE_URL="https://tu-proyecto.supabase.co"
 * export SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"
 * npx ts-node scripts/set_password_direct.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setPassword() {
  console.log('🔐 Estableciendo contraseña para administrador@apsistema.com...\n');

  try {
    const email = 'administrador@apsistema.com';
    const password = 'Admin123';

    // Obtener usuario por email
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (getUserError || !userData?.user) {
      console.error(`❌ Error obteniendo usuario: ${getUserError?.message}`);
      console.log('\n💡 El usuario no existe. Creando nuevo usuario...');
      
      // Crear usuario si no existe
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
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

      console.log(`✅ Usuario creado: ${email}`);
      console.log(`✅ Contraseña establecida: ${password}`);
      return;
    }

    const userId = userData.user.id;
    console.log(`✅ Usuario encontrado: ${email} (ID: ${userId})`);

    // Actualizar contraseña usando updateUserById
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: password,
        email_confirm: true // Asegurar que el email esté confirmado
      }
    );

    if (updateError) {
      console.error(`❌ Error actualizando contraseña: ${updateError.message}`);
      console.error(`Detalles:`, updateError);
      process.exit(1);
    }

    console.log(`\n✅ Contraseña actualizada exitosamente`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Contraseña: ${password}`);
    console.log(`\n💡 Ahora puedes iniciar sesión con:`);
    console.log(`   Usuario: administrador`);
    console.log(`   Contraseña: ${password}`);

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

setPassword()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  });

