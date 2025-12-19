/**
 * Endpoint serverless para crear usuarios usando Service Role Key
 * Bypass RLS para permitir que administradores creen usuarios
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Leer variables de entorno - intentar múltiples formas
const SUPABASE_URL = 
  process.env.VITE_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  '';
const SUPABASE_SERVICE_ROLE_KEY = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  '';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 [CREATE-USUARIO] Verificando variables de entorno...');
    console.log('🔧 [CREATE-USUARIO] SUPABASE_URL presente:', !!SUPABASE_URL);
    console.log('🔧 [CREATE-USUARIO] SUPABASE_SERVICE_ROLE_KEY presente:', !!SUPABASE_SERVICE_ROLE_KEY);
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ [CREATE-USUARIO] Variables faltantes');
      return res.status(500).json({
        success: false,
        error: 'Supabase no está configurado correctamente. Verifica las variables de entorno en Vercel.',
      });
    }

    const { nombre_completo, nombre_usuario, correo, contrasena_hash, rol, activo } = req.body;

    if (!nombre_completo || !correo || !rol) {
      return res.status(400).json({
        success: false,
        error: 'Nombre completo, correo y rol son requeridos',
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Crear usuario en la tabla usuarios usando Service Role Key (bypass RLS)
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
      console.error('❌ [CREATE-USUARIO] Error creando usuario:', error);
      return res.status(400).json({
        success: false,
        error: `Error al crear usuario: ${error.message}`,
        details: error,
        code: error.code,
      });
    }

    console.log(`✅ [CREATE-USUARIO] Usuario creado correctamente: ${data.id}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      usuario: data,
      message: 'Usuario creado correctamente',
    });
  } catch (error) {
    console.error('❌ [CREATE-USUARIO] Error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

