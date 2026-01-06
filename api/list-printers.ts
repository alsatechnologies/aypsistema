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
    
    // Seleccionar API según el rol del usuario
    let apiUrl = PRINTER_API_URL;
    if (rol_usuario === 'Oficina') {
      apiUrl = PRINTER_API_URL_2;
      console.log('🔧 [LIST-PRINTERS] Usando API 2 (ticket_prod) para usuario Oficina');
    } else {
      console.log('🔧 [LIST-PRINTERS] Usando API 1 (apiticket) para otros usuarios');
    }

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

    const data = await response.json();

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

