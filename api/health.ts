import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'unknown' as 'ok' | 'error' | 'unknown',
      apis: {
        printer: 'unknown' as 'ok' | 'error' | 'unknown',
        scales: 'unknown' as 'ok' | 'error' | 'unknown',
        certificates: 'unknown' as 'ok' | 'error' | 'unknown',
      },
    },
  };

  // Verificar conexión a Supabase
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { error } = await supabase.from('usuarios').select('id').limit(1);
      
      if (error) {
        healthStatus.services.database = 'error';
      } else {
        healthStatus.services.database = 'ok';
      }
    } catch (error) {
      healthStatus.services.database = 'error';
    }
  } else {
    healthStatus.services.database = 'error';
  }

  // Verificar APIs externas (solo verificar que las URLs estén configuradas)
  const PRINTER_API_URL = process.env.PRINTER_API_URL;
  const SCALES_API_URL = process.env.SCALES_API_URL;
  const CERTIFICATE_ENTRADA_API_URL = process.env.CERTIFICATE_ENTRADA_API_URL;
  const CERTIFICATE_SALIDA_API_URL = process.env.CERTIFICATE_SALIDA_API_URL;

  healthStatus.services.apis.printer = PRINTER_API_URL ? 'ok' : 'error';
  healthStatus.services.apis.scales = SCALES_API_URL ? 'ok' : 'error';
  healthStatus.services.apis.certificates = 
    (CERTIFICATE_ENTRADA_API_URL && CERTIFICATE_SALIDA_API_URL) ? 'ok' : 'error';

  // Determinar estado general
  const allServicesOk = 
    healthStatus.services.database === 'ok' &&
    healthStatus.services.apis.printer === 'ok' &&
    healthStatus.services.apis.scales === 'ok' &&
    healthStatus.services.apis.certificates === 'ok';

  const statusCode = allServicesOk ? 200 : 503;

  return res.status(statusCode).json(healthStatus);
}

