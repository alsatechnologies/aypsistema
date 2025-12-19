/**
 * Función serverless para buscar usuario durante el login
 * Esto evita problemas de CORS y timeouts desde el frontend
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Leer variables de entorno - intentar múltiples formas
const SUPABASE_URL = 
  process.env.VITE_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  '';
const SUPABASE_ANON_KEY = 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  '';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log para debugging (sin exponer valores sensibles)
    console.log('🔧 [GET-USER-FOR-LOGIN] Verificando variables de entorno...');
    console.log('🔧 [GET-USER-FOR-LOGIN] SUPABASE_URL presente:', !!SUPABASE_URL);
    console.log('🔧 [GET-USER-FOR-LOGIN] SUPABASE_ANON_KEY presente:', !!SUPABASE_ANON_KEY);
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ [GET-USER-FOR-LOGIN] Variables faltantes:', {
        SUPABASE_URL: SUPABASE_URL ? 'presente' : 'FALTANTE',
        SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'presente' : 'FALTANTE',
        envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
      });
      return res.status(500).json({
        success: false,
        error: 'Supabase no está configurado en el servidor. Verifica las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.',
      });
    }

    const { busqueda } = req.body;

    if (!busqueda) {
      return res.status(400).json({
        success: false,
        error: 'Búsqueda requerida',
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Buscar por nombre_usuario primero
    const { data: dataPorUsuario, error: errorPorUsuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('activo', true)
      .eq('nombre_usuario', busqueda.toLowerCase().trim())
      .maybeSingle();

    if (dataPorUsuario && !errorPorUsuario) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({
        success: true,
        usuario: dataPorUsuario,
      });
    }

    // Si no se encuentra por nombre_usuario, buscar por correo
    const { data: dataPorCorreo, error: errorPorCorreo } = await supabase
      .from('usuarios')
      .select('*')
      .eq('activo', true)
      .eq('correo', busqueda.toLowerCase().trim())
      .maybeSingle();

    if (errorPorCorreo) {
      return res.status(500).json({
        success: false,
        error: `Error al buscar usuario: ${errorPorCorreo.message}`,
      });
    }

    if (!dataPorCorreo) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      usuario: dataPorCorreo,
    });
  } catch (error) {
    console.error('Error en get-user-for-login:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

