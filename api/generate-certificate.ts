import type { VercelRequest, VercelResponse } from '@vercel/node';

// URL de la API de certificados - puede configurarse mediante variable de entorno
// Por defecto usa localhost para desarrollo local, pero en producción debería ser la URL del túnel o servidor
const CERTIFICATE_API_URL = process.env.CERTIFICATE_API_URL || 'http://localhost:8001';

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
    console.log('Generando certificado PDF, URL:', `${CERTIFICATE_API_URL}/generate-certificate`);
    
    // Hacer la solicitud al servidor de certificados
    const response = await fetch(`${CERTIFICATE_API_URL}/generate-certificate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

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
      
      return res.status(response.status).json({
        success: false,
        error: errorData.error || errorData.message || 'Error al generar certificado',
      });
    }

    // La API puede devolver el PDF directamente o como JSON con datos del PDF
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/pdf')) {
      // Si devuelve PDF directamente, convertirlo a base64 y retornarlo
      const pdfBuffer = await response.arrayBuffer();
      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
      
      return res.status(200).json({
        success: true,
        pdf_base64: pdfBase64,
        message: 'Boleta generada correctamente',
      });
    } else {
      // Si devuelve JSON con datos del PDF
      const data = await response.json();
      
      return res.status(200).json({
        success: data.success !== false,
        pdf_url: data.pdf_url,
        pdf_base64: data.pdf_base64,
        message: data.message || 'Boleta generada correctamente',
        error: data.error,
      });
    }
  } catch (error) {
    console.error('Error en proxy de certificados:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al generar certificado',
    });
  }
}

