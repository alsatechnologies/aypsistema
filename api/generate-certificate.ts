/**
 * Endpoint unificado para generar certificados PDF (entrada y salida)
 * Consolida generate-certificate-entrada y generate-certificate-salida
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit, getClientIP } from './utils/rateLimit.js';

// URLs de las APIs de certificados
const CERTIFICATE_ENTRADA_API_URL = process.env.CERTIFICATE_ENTRADA_API_URL || 'https://pdf-entrada.alsatechnologies.com';
const CERTIFICATE_SALIDA_API_URL = process.env.CERTIFICATE_SALIDA_API_URL || 'https://pdf-salida.alsatechnologies.com';

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

  // Rate limiting: 20 requests por minuto por IP
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(`certificate:${clientIP}`, 20, 60000);
  
  if (!rateLimit.allowed) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Retry-After', Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString());
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    });
  }

  try {
    const { tipo, ...data } = req.body;

    if (!tipo || (tipo !== 'entrada' && tipo !== 'salida')) {
      return res.status(400).json({
        error: 'Tipo de certificado requerido',
        message: 'Debe especificar "tipo": "entrada" o "salida"'
      });
    }

    // Seleccionar URL según el tipo
    const apiUrl = tipo === 'entrada' ? CERTIFICATE_ENTRADA_API_URL : CERTIFICATE_SALIDA_API_URL;
    const endpoint = `${apiUrl}/generate-certificate`;

    console.log(`Generando certificado ${tipo}...`);

    // Hacer la petición a la API externa con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    try {
      console.log(`[CERTIFICATE] Llamando a: ${endpoint}`);
      console.log(`[CERTIFICATE] Datos enviados:`, JSON.stringify(data, null, 2));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`[CERTIFICATE] Respuesta status: ${response.status} ${response.statusText}`);
      console.log(`[CERTIFICATE] Content-Type: ${response.headers.get('content-type')}`);

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          console.error(`[CERTIFICATE] Error de API externa (${tipo}):`, errorText);
        } catch (e) {
          errorText = `Error ${response.status}: ${response.statusText}`;
          console.error(`[CERTIFICATE] No se pudo leer el error de la API:`, e);
        }
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        return res.status(response.status).json({
          error: `Error al generar certificado ${tipo}`,
          message: errorText || `Error ${response.status}: ${response.statusText}`,
          status: response.status,
          endpoint: endpoint
        });
      }

      // Obtener el PDF como blob
      const pdfBlob = await response.blob();
      const pdfBuffer = await pdfBlob.arrayBuffer();

      // Devolver el PDF
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificado-${tipo}.pdf"`);
      return res.status(200).send(Buffer.from(pdfBuffer));

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      console.error(`[CERTIFICATE] Error en fetch (${tipo}):`, fetchError);
      
      if (fetchError.name === 'AbortError') {
        console.error(`[CERTIFICATE] Timeout generando certificado ${tipo}`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        return res.status(504).json({
          error: 'Timeout',
          message: 'La generación del certificado está tardando demasiado',
          endpoint: endpoint
        });
      }

      // Si es un error de conexión o red
      if (fetchError.message && (fetchError.message.includes('fetch') || fetchError.message.includes('network'))) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        return res.status(503).json({
          error: 'Error de conexión',
          message: `No se pudo conectar con la API externa: ${fetchError.message}`,
          endpoint: endpoint
        });
      }

      throw fetchError;
    }

  } catch (error) {
    console.error('[CERTIFICATE] Error generando certificado:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: 'Error interno',
      message: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

