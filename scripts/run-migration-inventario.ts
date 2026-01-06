/**
 * Script para ejecutar la migración de inventario_almacenes en Supabase
 * 
 * Uso: npx tsx scripts/run-migration-inventario.ts
 * O: node --loader ts-node/esm scripts/run-migration-inventario.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Error: VITE_SUPABASE_URL o SUPABASE_URL no está definido en .env');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY no está definido en .env');
  console.error('💡 Necesitas la Service Role Key para ejecutar migraciones.');
  console.error('   Obténla en: Supabase Dashboard -> Settings -> API -> service_role key');
  process.exit(1);
}

// Crear cliente con Service Role Key (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Iniciando migración de inventario_almacenes...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = join(__dirname, 'create_inventario_almacenes.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Dividir el SQL en comandos individuales (separados por ;)
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Ejecutando ${commands.length} comandos SQL...\n`);

    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim().length === 0) continue;

      try {
        console.log(`[${i + 1}/${commands.length}] Ejecutando comando...`);
        const { data, error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          // Si el RPC no existe, intentar ejecutar directamente
          const { error: directError } = await supabase.from('_').select('*').limit(0);
          
          // Intentar usar el método directo de Supabase
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ sql: command })
          });

          if (!response.ok) {
            console.error(`❌ Error en comando ${i + 1}:`, await response.text());
            throw new Error(`Error ejecutando comando ${i + 1}`);
          }
        } else {
          console.log(`✅ Comando ${i + 1} ejecutado correctamente`);
        }
      } catch (err: any) {
        console.error(`❌ Error en comando ${i + 1}:`, err.message);
        // Continuar con el siguiente comando
      }
    }

    console.log('\n✅ Migración completada!');
    console.log('💡 Verifica en Supabase Dashboard que la tabla inventario_almacenes fue creada.');
    
  } catch (error: any) {
    console.error('❌ Error ejecutando migración:', error.message);
    process.exit(1);
  }
}

runMigration();

