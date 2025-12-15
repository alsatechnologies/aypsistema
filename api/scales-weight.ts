import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    // Hacer la solicitud al servidor de básculas con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
      },
      signal: controller.signal,
    }).catch((fetchError: any) => {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout al conectar con la báscula (más de 10 segundos)');
      }
      throw fetchError;
    });
    
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

    // La API retorna un string con el peso (según la documentación)
    const contentType = response.headers.get('content-type');
    let weightString: string;
    
    if (contentType && contentType.includes('application/json')) {
      // Si es JSON, parsearlo
      const jsonData = await response.json();
      weightString = typeof jsonData === 'string' ? jsonData : String(jsonData);
    } else {
      // Si es texto plano
      weightString = await response.text();
    }

    console.log('Respuesta raw:', weightString);

    // Limpiar y parsear el peso
    const cleanedWeight = weightString.replace(/"/g, '').replace(/'/g, '').trim();
    const weight = parseFloat(cleanedWeight);

    console.log('Peso parseado:', weight);

    if (isNaN(weight)) {
      console.error('Peso inválido, string original:', weightString);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(500).json({
        success: false,
        error: `Respuesta inválida de la báscula: "${weightString}"`,
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
    console.error('Mensaje de error:', errorMessage);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

