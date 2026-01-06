/**
 * Script para actualizar factores kg/cm directamente usando el cliente de Supabase
 * Ejecutar con: npx tsx scripts/update-factores-direct.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const factores = [
  { nombre: 'TQ 201', factor: 457.08 },
  { nombre: 'TQ 202', factor: 452.72 },
  { nombre: 'TQ 203', factor: 457.39 },
  { nombre: 'TQ 204', factor: 456.84 },
  { nombre: 'TQ 205', factor: 1029.51 },
  { nombre: 'TQ 206', factor: 947.32 },
  { nombre: 'TQ 207', factor: 962.85 },
  { nombre: 'TQ 208', factor: 161.00 },
  { nombre: 'TQ 209', factor: 1539.51 },
  { nombre: 'TQ 210', factor: 1595.15 },
  { nombre: 'TQ 211', factor: 1513.89 },
];

async function actualizarFactores() {
  console.log('🚀 Actualizando factores kg/cm de tanques...\n');

  for (const { nombre, factor } of factores) {
    try {
      const { data, error } = await supabase
        .from('almacenes')
        .update({ 
          factor_kg_cm: factor,
          updated_at: new Date().toISOString()
        })
        .eq('nombre', nombre)
        .select();

      if (error) {
        console.error(`❌ Error actualizando ${nombre}:`, error.message);
      } else {
        console.log(`✅ ${nombre}: ${factor} kg/cm`);
      }
    } catch (err: any) {
      console.error(`❌ Error en ${nombre}:`, err.message);
    }
  }

  console.log('\n✅ Proceso completado!');
}

actualizarFactores();

