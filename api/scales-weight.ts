import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  const { scale_id, get_type } = req.query;

  if (!scale_id || !get_type) {
    return res.status(400).json({
      success: false,
      error: 'scale_id y get_type son requeridos',
    });
  }

  try {
    // Hacer la solicitud al servidor de básculas
    const response = await fetch(`${SCALES_API_URL}/scales/${scale_id}/${get_type}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(response.status).json({
        success: false,
        error: errorData.message || 'Error al leer peso de la báscula',
      });
    }

    // La API retorna un string con el peso
    const weightString = await response.text();
    const weight = parseFloat(weightString.replace(/"/g, '').trim());

    if (isNaN(weight)) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(500).json({
        success: false,
        error: 'Respuesta inválida de la báscula',
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al leer peso',
    });
  }
}

