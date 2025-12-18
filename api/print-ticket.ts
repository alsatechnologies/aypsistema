import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit, getClientIP } from './utils/rateLimit';

const PRINTER_API_URL = process.env.PRINTER_API_URL || 'https://apiticket.alsatechnologies.com';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Manejar preflight OPTIONS request para CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting: 30 requests por minuto por IP
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(`print-ticket:${clientIP}`, 30, 60000);
  
  if (!rateLimit.allowed) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Retry-After', Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString());
    return res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes. Por favor, espera un momento antes de intentar de nuevo.',
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
    });
  }

  try {
    // Timeout de 15 segundos para impresión
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Hacer la solicitud al servidor de impresión
    const response = await fetch(`${PRINTER_API_URL}/api/printer/print-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    }).catch((fetchError: any) => {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout al conectar con la impresora (más de 15 segundos)');
      }
      throw fetchError;
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    // Retornar la respuesta con los headers CORS necesarios
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Error al imprimir ticket',
      });
    }

    return res.status(200).json({
      success: true,
      message: data.message || 'Ticket impreso correctamente',
    });
  } catch (error) {
    console.error('Error en proxy de impresión:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al imprimir',
    });
  }
}

