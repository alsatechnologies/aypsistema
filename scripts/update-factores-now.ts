/**
 * Script para actualizar factores kg/cm usando el cliente de Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      } else if (data && data.length > 0) {
        console.log(`✅ ${nombre}: ${factor} kg/cm`);
      } else {
        console.log(`⚠️  ${nombre}: No encontrado en la base de datos`);
      }
    } catch (err: any) {
      console.error(`❌ Error en ${nombre}:`, err.message);
    }
  }

  console.log('\n✅ Proceso completado!');
}

actualizarFactores();

