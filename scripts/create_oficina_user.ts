/**
 * Script temporal para crear el usuario Oficina en auth.users
 * Ejecutar con: npx tsx scripts/create_oficina_user.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

async function createOficinaUser() {
  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🔐 Creando usuario Oficina en auth.users...');
    console.log('   Email: oficina@apsistema.com');
    console.log('   Password: Admin123');

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

    if (authError) {
      console.error('❌ Error creando usuario:', authError.message);
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  El usuario ya existe en auth.users');
      }
      process.exit(1);
    }

    if (!authUser.user) {
      console.error('❌ No se recibió usuario de Supabase');
      process.exit(1);
    }

    console.log('✅ Usuario creado exitosamente en auth.users');
    console.log('   ID:', authUser.user.id);
    console.log('   Email:', authUser.user.email);
    console.log('\n📝 Ahora puedes iniciar sesión con:');
    console.log('   Usuario: oficina');
    console.log('   Contraseña: Admin123');
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }
}

createOficinaUser();

