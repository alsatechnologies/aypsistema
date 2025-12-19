/**
 * Endpoint serverless para crear usuarios usando Service Role Key
 * Bypass RLS para permitir que administradores creen usuarios
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// En Vercel, las funciones serverless acceden a variables SIN prefijo VITE_
// Las variables con VITE_ son solo para el frontend
const SUPABASE_URL = 
  process.env.SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  '';
const SUPABASE_SERVICE_ROLE_KEY = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  '';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar variables de entorno con logging detallado
    const envKeys = Object.keys(process.env).filter(k => k.includes('SUPABASE'));
    console.log('🔧 [CREATE-USUARIO] Variables disponibles:', envKeys);
    console.log('🔧 [CREATE-USUARIO] SUPABASE_URL:', SUPABASE_URL ? 'presente' : 'FALTANTE');
    console.log('🔧 [CREATE-USUARIO] SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'presente' : 'FALTANTE');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Variables faltantes. Verifica en Vercel:');
      console.error('   - SUPABASE_URL o VITE_SUPABASE_URL');
      console.error('   - SUPABASE_SERVICE_ROLE_KEY o VITE_SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({
        success: false,
        error: 'Configuración de Supabase incompleta. Verifica las variables de entorno en Vercel.',
        debug: {
          envKeys: envKeys,
          hasUrl: !!SUPABASE_URL,
          hasKey: !!SUPABASE_SERVICE_ROLE_KEY
        }
      });
    }

    const { nombre_completo, nombre_usuario, correo, contrasena_hash, rol, activo } = req.body;

    if (!nombre_completo || !correo || !rol) {
      return res.status(400).json({
        success: false,
        error: 'Nombre completo, correo y rol son requeridos',
      });
    }

    // Crear cliente con Service Role Key
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Crear usuario en la tabla usuarios
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .insert({
        nombre_completo,
        nombre_usuario: nombre_usuario || null,
        correo,
        contrasena_hash: contrasena_hash || '********',
        rol,
        activo: activo !== undefined ? activo : true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando usuario:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al crear usuario',
        code: error.code,
      });
    }

    return res.status(200).json({
      success: true,
      usuario: data,
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}
