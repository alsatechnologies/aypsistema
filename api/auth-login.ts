/**
 * Función serverless para autenticar usuarios con Supabase Auth
 * Esto evita problemas de timeout y conexión desde el frontend
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

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos',
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log('Intentando autenticar:', email);

    // Intentar autenticación con timeout
    const authPromise = supabase.auth.signInWithPassword({
      email,
      password,
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout después de 15 segundos')), 15000);
    });

    const result = await Promise.race([authPromise, timeoutPromise]) as any;

    if (result.error) {
      console.error('Error de autenticación:', result.error);
      return res.status(401).json({
        success: false,
        error: result.error.message || 'Credenciales incorrectas',
        details: result.error,
      });
    }

    if (!result.data?.user) {
      return res.status(401).json({
        success: false,
        error: 'No se recibió usuario de Supabase Auth',
      });
    }

    console.log('Autenticación exitosa:', result.data.user.id);
    console.log('Session tokens:', {
      access_token: result.data.session?.access_token ? 'Presente' : 'Faltante',
      refresh_token: result.data.session?.refresh_token ? 'Presente' : 'Faltante',
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      success: true,
      user: result.data.user,
      session: {
        access_token: result.data.session?.access_token,
        refresh_token: result.data.session?.refresh_token,
        expires_in: result.data.session?.expires_in,
        expires_at: result.data.session?.expires_at,
        token_type: result.data.session?.token_type,
        user: result.data.session?.user,
      },
    });
  } catch (error) {
    console.error('Error en auth-login:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (error instanceof Error && error.message.includes('Timeout')) {
      return res.status(504).json({
        success: false,
        error: 'La autenticación está tardando demasiado. Verifica tu conexión a Supabase.',
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

