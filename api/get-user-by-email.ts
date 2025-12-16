/**
 * Función serverless para obtener usuario por email
 * Usada para verificar sesión y cargar usuario
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

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
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Supabase no está configurado en el servidor.',
      });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requerido',
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('correo', email.toLowerCase().trim())
      .eq('activo', true)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        error: `Error al buscar usuario: ${error.message}`,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      usuario: data,
    });
  } catch (error) {
    console.error('Error en get-user-by-email:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

