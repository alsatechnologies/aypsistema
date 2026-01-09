// Script para obtener el código de lote de la operación 2250011
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
const envPath = join(__dirname, '..', '.env');
try {
  const envFile = readFileSync(envPath, 'utf8');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
  
  process.env.VITE_SUPABASE_URL = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  process.env.VITE_SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
} catch (error) {
  console.warn('No se pudo cargar .env, usando variables de entorno existentes');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const boleta = '2250011';

async function obtenerLote() {
  console.log(`\n🔍 Buscando código de lote para la boleta: ${boleta}\n`);
  console.log('=' .repeat(60));
  
  // Buscar en embarques
  console.log('\n📦 Buscando en EMBARQUES...');
  const { data: embarque, error: errorEmbarque } = await supabase
    .from('embarques')
    .select('id, boleta, codigo_lote, producto_id, cliente_id, almacen_id, tipo_embarque, estatus, created_at')
    .eq('boleta', boleta)
    .single();
  
  if (errorEmbarque && errorEmbarque.code !== 'PGRST116') {
    console.error('❌ Error al buscar en embarques:', errorEmbarque.message);
  } else if (embarque) {
    console.log('✅ ENCONTRADO en EMBARQUES:');
    console.log(JSON.stringify(embarque, null, 2));
    console.log(`\n🎯 CÓDIGO DE LOTE: ${embarque.codigo_lote || '❌ NO ASIGNADO'}`);
    return;
  } else {
    console.log('   No encontrado en embarques');
  }
  
  // Buscar en recepciones
  console.log('\n📥 Buscando en RECIBAS...');
  const { data: recepcion, error: errorRecepcion } = await supabase
    .from('recepciones')
    .select('id, boleta, codigo_lote, producto_id, proveedor_id, almacen_id, estatus, created_at')
    .eq('boleta', boleta)
    .single();
  
  if (errorRecepcion && errorRecepcion.code !== 'PGRST116') {
    console.error('❌ Error al buscar en recepciones:', errorRecepcion.message);
  } else if (recepcion) {
    console.log('✅ ENCONTRADO en RECIBAS:');
    console.log(JSON.stringify(recepcion, null, 2));
    console.log(`\n🎯 CÓDIGO DE LOTE: ${recepcion.codigo_lote || '❌ NO ASIGNADO'}`);
    return;
  } else {
    console.log('   No encontrado en recepciones');
  }
  
  // Buscar en ordenes
  console.log('\n📋 Buscando en ÓRDENES...');
  const { data: orden, error: errorOrden } = await supabase
    .from('ordenes')
    .select('id, boleta, tipo_operacion, estatus, created_at')
    .eq('boleta', boleta)
    .single();
  
  if (errorOrden && errorOrden.code !== 'PGRST116') {
    console.error('❌ Error al buscar en ordenes:', errorOrden.message);
  } else if (orden) {
    console.log('✅ ENCONTRADO en ÓRDENES:');
    console.log(JSON.stringify(orden, null, 2));
    console.log('\n⚠️  La boleta está en estado de Orden (aún no tiene código de lote asignado)');
    console.log('   El código de lote se asignará cuando la operación se complete.');
  } else {
    console.log('   No encontrado en ordenes');
    console.log('\n❌ La boleta no fue encontrada en ninguna tabla');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

obtenerLote().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

