import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar que hay una clave secreta para seguridad
  const secretKey = req.headers['x-secret-key'] || req.body?.secretKey;
  const expectedSecret = process.env.MIGRATION_SECRET_KEY;

  if (!expectedSecret || secretKey !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized. Se requiere secretKey válido.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      error: 'Configuración faltante. Se requieren VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY' 
    });
  }

  const { sql } = req.body;

  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'Se requiere un campo "sql" con la consulta SQL' });
  }

  // Crear cliente con Service Role Key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Ejecutar SQL usando rpc o directamente
    // Nota: Supabase no permite ejecutar SQL arbitrario desde el cliente
    // Necesitamos usar el SQL Editor del dashboard o crear funciones SQL
    
    return res.status(200).json({ 
      success: true,
      message: '⚠️ No se puede ejecutar SQL arbitrario desde el cliente de Supabase por seguridad.',
      instruction: 'Por favor, ejecuta la migración manualmente en el SQL Editor de Supabase Dashboard.',
      sql: sql
    });

  } catch (error: any) {
    console.error('Error ejecutando SQL:', error);
    return res.status(500).json({ 
      error: 'Error ejecutando SQL',
      message: error.message 
    });
  }
}

