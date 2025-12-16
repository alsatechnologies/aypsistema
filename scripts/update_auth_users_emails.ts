/**
 * Script para actualizar emails en auth.users a @apsistema.com
 * 
 * Uso:
 * export SUPABASE_URL="https://tu-proyecto.supabase.co"
 * export SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"
 * npx ts-node scripts/update_auth_users_emails.ts
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

async function updateAuthUsersEmails() {
  console.log('🔄 Actualizando emails en auth.users a @apsistema.com...\n');

  try {
    // Mapeo de emails antiguos a nuevos
    const emailMappings: Record<string, string> = {
      'admin@test.com': 'administrador@apsistema.com',
      'oficina@test.com': 'oficina@apsistema.com',
      'bascula@test.com': 'bascula@apsistema.com'
    };

    for (const [oldEmail, newEmail] of Object.entries(emailMappings)) {
      console.log(`📧 Actualizando ${oldEmail} → ${newEmail}`);

      // Obtener usuario por email antiguo
      const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(oldEmail);

      if (getUserError || !userData?.user) {
        console.log(`⚠️  Usuario ${oldEmail} no encontrado, saltando...`);
        continue;
      }

      const userId = userData.user.id;

      // Actualizar email
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          email: newEmail,
          email_confirm: true // Confirmar automáticamente
        }
      );

      if (updateError) {
        console.error(`❌ Error actualizando ${oldEmail}:`, updateError.message);
        continue;
      }

      console.log(`✅ ${oldEmail} actualizado a ${newEmail}`);
    }

    console.log('\n✅ Actualización completada');
    console.log('\n📋 Emails actualizados:');
    console.log('   - administrador@apsistema.com');
    console.log('   - oficina@apsistema.com');
    console.log('   - bascula@apsistema.com');

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

updateAuthUsersEmails()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  });

