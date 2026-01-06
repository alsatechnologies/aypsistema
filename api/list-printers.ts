import type { VercelRequest, VercelResponse } from '@vercel/node';

const PRINTER_API_URL = process.env.PRINTER_API_URL || 'https://apiticket.alsatechnologies.com';
const PRINTER_API_URL_2 = process.env.PRINTER_API_URL_2 || 'https://ticket_prod.alsatechnologies.com';

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

  try {
    // Obtener rol del usuario del query string (opcional)
    const { rol_usuario } = req.query;
    
    // Seleccionar API según el rol del usuario (solo cambia la URL, el resto es idéntico)
    const apiUrl = rol_usuario === 'Oficina' ? PRINTER_API_URL_2 : PRINTER_API_URL;

    // Timeout de 10 segundos para listar impresoras
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Hacer la solicitud al servidor de impresión
    const response = await fetch(`${apiUrl}/api/printer/list-usb`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    }).catch((fetchError: any) => {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout al conectar con la API (más de 10 segundos)');
      }
      throw fetchError;
    });

    clearTimeout(timeoutId);

    // Verificar el Content-Type antes de intentar parsear JSON
    const contentType = response.headers.get('content-type') || '';
    let data: any;
    
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonError) {
        const textResponse = await response.text();
        console.error('🔧 [LIST-PRINTERS] Error al parsear JSON:', textResponse.substring(0, 500));
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(500).json({
          success: false,
          error: `La API devolvió una respuesta inválida. Verifica que la URL ${apiUrl} esté correcta y funcionando.`,
        });
      }
    } else {
      // Si no es JSON, probablemente es HTML (página de error 404)
      const textResponse = await response.text();
      console.error('🔧 [LIST-PRINTERS] La API devolvió HTML en lugar de JSON');
      console.error('🔧 [LIST-PRINTERS] Status:', response.status);
      console.error('🔧 [LIST-PRINTERS] Content-Type:', contentType);
      console.error('🔧 [LIST-PRINTERS] Respuesta (primeros 500 caracteres):', textResponse.substring(0, 500));
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(500).json({
        success: false,
        error: `Error de conexión con la API de impresión (${apiUrl}). La API devolvió una respuesta HTML (posible 404). Verifica que la URL esté correcta y que el servidor esté funcionando.`,
      });
    }

    // Retornar la respuesta con los headers CORS necesarios
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Error al listar impresoras',
      });
    }

    return res.status(200).json({
      success: true,
      printers: data.printers || [],
      count: data.count || 0,
      platform: data.platform,
      message: data.message || 'Impresoras listadas correctamente',
    });
  } catch (error) {
    console.error('Error en proxy de listado de impresoras:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al listar impresoras',
    });
  }
}
