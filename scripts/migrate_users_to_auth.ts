/**
 * Script de migración de usuarios a Supabase Auth
 * 
 * Este script migra usuarios de la tabla usuarios a auth.users
 * 
 * Uso:
 * 1. Configurar las variables de entorno:
 *    - SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY (clave de servicio, NO la anon key)
 * 
 * 2. Ejecutar: npx ts-node scripts/migrate_users_to_auth.ts
 * 
 * IMPORTANTE: La SERVICE_ROLE_KEY tiene acceso completo a la base de datos
 * NUNCA la expongas en el frontend o código público
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

async function migrateUsers() {
  console.log('🔄 Iniciando migración de usuarios...\n');

  try {
    // Obtener todos los usuarios activos de la tabla usuarios
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('activo', true);

    if (usuariosError) {
      throw new Error(`Error obteniendo usuarios: ${usuariosError.message}`);
    }

    if (!usuarios || usuarios.length === 0) {
      console.log('⚠️  No hay usuarios para migrar');
      return;
    }

    console.log(`📋 Encontrados ${usuarios.length} usuarios para migrar\n`);

    let migrados = 0;
    let yaExistentes = 0;
    let errores = 0;

    for (const usuario of usuarios) {
      try {
        // Verificar si el usuario ya existe en auth.users
        const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(usuario.correo);

        if (existingUser?.user) {
          console.log(`⏭️  Usuario ya existe: ${usuario.correo} (${usuario.nombre_completo})`);
          yaExistentes++;
          continue;
        }

        // Crear usuario en auth.users usando la API de administración
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: usuario.correo,
          password: usuario.contrasena_hash, // Usar la contraseña hash existente
          email_confirm: true, // Confirmar email automáticamente
          user_metadata: {
            nombre_completo: usuario.nombre_completo,
            nombre_usuario: usuario.nombre_usuario,
            rol: usuario.rol,
            usuario_id: usuario.id
          }
        });

        if (createError) {
          console.error(`❌ Error creando usuario ${usuario.correo}:`, createError.message);
          errores++;
          continue;
        }

        if (newUser?.user) {
          console.log(`✅ Usuario migrado: ${usuario.correo} (${usuario.nombre_completo}) - Rol: ${usuario.rol}`);
          migrados++;
        }
      } catch (error) {
        console.error(`❌ Error procesando usuario ${usuario.correo}:`, error);
        errores++;
      }
    }

    console.log('\n📊 Resumen de migración:');
    console.log(`   ✅ Migrados: ${migrados}`);
    console.log(`   ⏭️  Ya existentes: ${yaExistentes}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   📋 Total procesados: ${usuarios.length}`);

    if (migrados > 0) {
      console.log('\n✨ Migración completada exitosamente');
    }
  } catch (error) {
    console.error('❌ Error fatal en migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateUsers()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  });

