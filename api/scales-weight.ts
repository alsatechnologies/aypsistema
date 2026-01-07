import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit, getClientIP } from './utils/rateLimit.js';

// Usar HTTP directamente ya que la API está en HTTP
const SCALES_API_URL = process.env.SCALES_API_URL || 'http://apiscales.alsatechnologies.com';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Manejar preflight OPTIONS request para CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting: 60 requests por minuto por IP (lecturas frecuentes de báscula)
  // Envolver en try-catch para evitar que falle todo si hay un problema con rate limiting
  try {
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(`scales:${clientIP}`, 60, 60000);
    
    if (!rateLimit.allowed) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Retry-After', Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString());
      return res.status(429).json({
        success: false,
        error: 'Demasiadas solicitudes a la báscula. Por favor, espera un momento.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
      });
    }
  } catch (rateLimitError) {
    // Si falla el rate limiting, continuar de todas formas (no bloquear la lectura)
    console.warn('Error en rate limiting, continuando:', rateLimitError);
  }

  // Obtener parámetros del query, asegurándose de que sean strings
  const scale_id = typeof req.query.scale_id === 'string' ? req.query.scale_id : Array.isArray(req.query.scale_id) ? req.query.scale_id[0] : '';
  const get_type = typeof req.query.get_type === 'string' ? req.query.get_type : Array.isArray(req.query.get_type) ? req.query.get_type[0] : 'weight';

  console.log('Parámetros recibidos:', { scale_id, get_type, query: req.query });

  if (!scale_id || !get_type) {
    console.error('Parámetros faltantes:', { scale_id, get_type });
    return res.status(400).json({
      success: false,
      error: 'scale_id y get_type son requeridos',
    });
  }

  try {
    // Asegurar que los parámetros estén correctamente codificados
    const encodedScaleId = encodeURIComponent(scale_id);
    const encodedGetType = encodeURIComponent(get_type);
    
    // Usar HTTP directamente ya que la API está en HTTP
    const apiUrl = `http://apiscales.alsatechnologies.com/scales/${encodedScaleId}/${encodedGetType}`;
    console.log('Llamando a API de básculas:', apiUrl);
    console.log('Parámetros codificados:', { encodedScaleId, encodedGetType });
    console.log('Scale ID original:', scale_id);
    console.log('Get type original:', get_type);

    // Hacer la solicitud al servidor de básculas con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
        },
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error('Error en fetch:', fetchError);
      console.error('Error name:', fetchError?.name);
      console.error('Error message:', fetchError?.message);
      console.error('Error code:', fetchError?.code);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout al conectar con la báscula (más de 10 segundos)');
      }
      
      // Proporcionar mensaje más descriptivo
      if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
        throw new Error(`No se pudo conectar con la API de básculas (${apiUrl}). Verifica que el servidor esté disponible.`);
      }
      
      throw new Error(`Error de conexión: ${fetchError.message || 'Error desconocido'}`);
    }
    
    clearTimeout(timeoutId);

    console.log('Respuesta recibida, status:', response.status);

    if (!response.ok) {
      let errorMessage = 'Error al leer peso de la báscula';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorMessage;
      } catch (e) {
        const errorText = await response.text().catch(() => '');
        errorMessage = errorText || `Error ${response.status}: ${response.statusText}`;
      }
      
      console.error('Error en respuesta de API:', errorMessage);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(response.status).json({
        success: false,
        error: errorMessage,
      });
    }

    // La API puede retornar un string, un número, o un objeto JSON
    const contentType = response.headers.get('content-type') || '';
    let weight: number;
    
    console.log('Content-Type recibido:', contentType);
    
    if (contentType.includes('application/json')) {
      // Si es JSON, parsearlo
      const jsonData = await response.json();
      console.log('Respuesta JSON recibida:', jsonData);
      
      // Intentar extraer el peso de diferentes formatos posibles
      if (typeof jsonData === 'number') {
        weight = jsonData;
      } else if (typeof jsonData === 'string') {
        weight = parseFloat(jsonData.replace(/"/g, '').trim());
      } else if (jsonData && typeof jsonData === 'object') {
        // Buscar el peso en diferentes propiedades posibles
        weight = jsonData.weight || jsonData.peso || jsonData.value || jsonData.data || 
                 jsonData.result || parseFloat(String(jsonData));
      } else {
        weight = parseFloat(String(jsonData));
      }
    } else {
      // Si es texto plano, parsearlo
      const textData = await response.text();
      console.log('Respuesta texto recibida:', textData);
      weight = parseFloat(textData.replace(/"/g, '').replace(/'/g, '').trim());
    }

    console.log('Peso parseado:', weight);

    if (isNaN(weight) || weight === null || weight === undefined) {
      console.error('Peso inválido después del parseo');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(500).json({
        success: false,
        error: 'Respuesta inválida de la báscula: no se pudo extraer un peso válido',
      });
    }

    // Retornar la respuesta con los headers CORS necesarios
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json({
      success: true,
      weight: weight,
    });
  } catch (error) {
    console.error('Error en proxy de básculas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al leer peso';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Mensaje de error:', errorMessage);
    console.error('Stack trace:', errorStack);
    console.error('Tipo de error:', error?.constructor?.name);
    console.error('Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        stack: errorStack,
        type: error?.constructor?.name,
      } : undefined,
    });
  }
}

