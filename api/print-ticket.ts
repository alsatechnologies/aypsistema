import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  try {
    // Hacer la solicitud al servidor de impresión
    const response = await fetch(`${PRINTER_API_URL}/api/printer/print-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

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

