import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit, getClientIP } from './utils/rateLimit.js';

// URL de la API de certificados de SALIDA (Embarque)
const CERTIFICATE_SALIDA_API_URL = 'https://pdf-salida.alsatechnologies.com';

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

  // Rate limiting: 20 requests por minuto por IP (generación de PDFs puede ser pesada)
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(`certificate-salida:${clientIP}`, 20, 60000);
  
  if (!rateLimit.allowed) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Retry-After', Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString());
    return res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes de generación de PDF. Por favor, espera un momento.',
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
    });
  }

  try {
    console.log('Generando certificado PDF de SALIDA, URL:', `${CERTIFICATE_SALIDA_API_URL}/generate-certificate`);
    console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    // Timeout de 30 segundos para generación de PDF (puede tardar más)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    // Hacer la solicitud al servidor de certificados de salida
    const response = await fetch(`${CERTIFICATE_SALIDA_API_URL}/generate-certificate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    }).catch((fetchError: any) => {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout al generar PDF de salida (más de 30 segundos)');
      }
      throw fetchError;
    });

    clearTimeout(timeoutId);

    console.log('Respuesta recibida, status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));

    // Retornar la respuesta con los headers CORS necesarios
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `Error ${response.status}: ${response.statusText}` };
      }
      
      console.error('Error de la API:', errorData);
      return res.status(response.status).json({
        success: false,
        error: errorData.error || errorData.message || errorData.detail || 'Error al generar certificado de salida',
      });
    }

    // La API puede devolver el PDF directamente o como JSON con datos del PDF
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/pdf')) {
      // Si devuelve PDF directamente, convertirlo a base64 y retornarlo
      const pdfBuffer = await response.arrayBuffer();
      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
      
      console.log('PDF generado correctamente, tamaño:', pdfBuffer.byteLength, 'bytes');
      
      return res.status(200).json({
        success: true,
        pdf_base64: pdfBase64,
        message: 'Boleta de salida generada correctamente',
      });
    } else {
      // Si devuelve JSON con datos del PDF
      const data = await response.json();
      console.log('Respuesta JSON:', data);
      
      return res.status(200).json({
        success: data.success !== false,
        pdf_url: data.pdf_url,
        pdf_base64: data.pdf_base64,
        message: data.message || 'Boleta de salida generada correctamente',
        error: data.error,
      });
    }
  } catch (error) {
    console.error('Error en proxy de certificados de salida:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al generar certificado de salida',
    });
  }
}

