/**
 * Servicio para generar certificados/boletas PDF usando las APIs externas
 * - Entradas (Reciba): https://pdf-entrada.alsatechnologies.com
 * - Salidas (Embarque): https://pdf-salida.alsatechnologies.com
 */

// Usar las funciones serverless de Vercel como proxy para evitar problemas de CORS
const CERTIFICATE_API_URL = '/api/generate-certificate';

// Formato antiguo (mantener para compatibilidad con entrada)
export interface AnalisisItem {
  nombre: string;
  valor: number;
  unidad?: string;
}

// Formato nuevo para salidas (embarques) - según especificación de API
export interface AnalisisSalidaItem {
  tipo: string;           // OBLIGATORIO - Nombre del tipo de análisis
  porcentaje: number | null;  // OPCIONAL - Número decimal o null
  castigo: number | null;     // OPCIONAL - Número decimal o null (siempre null para salidas)
}

export interface PesosInfo1 {
  peso_bruto: number;
  peso_tara: number;
  peso_neto: number;
  fechaneto?: string;
  fechabruto?: string;
  fechatara?: string;
  horabruto?: string;
  horatara?: string;
}

export interface PesosInfo2 {
  deduccion: number;
  peso_neto_analizado: number;
}

export interface BoletaRecibaRequest {
  boleta_no: string;
  fecha: string;
  lote?: string;
  productor: string;
  producto: string;
  procedencia: string;
  vehiculo: string;
  placas: string;
  chofer: string;
  analisis: AnalisisSalidaItem[]; // Mismo formato que salidas: { tipo, porcentaje, castigo }
  pesos_info1: PesosInfo1;
  pesos_info2: PesosInfo2;
  observaciones?: string;
  rol_usuario?: string; // Rol del usuario para determinar qué API usar
}

// La API de salida usa formato diferente para análisis
// (productor, procedencia en lugar de cliente, destino)
export interface BoletaEmbarqueRequest {
  boleta_no: string;
  fecha: string;
  lote?: string;
  productor: string;  // Usa "productor" aunque sea cliente en embarque
  producto: string;
  procedencia: string;  // Usa "procedencia" aunque sea destino en embarque
  vehiculo: string;
  placas: string;
  chofer: string;
  analisis: AnalisisSalidaItem[]; // Formato: { tipo, porcentaje, castigo }
  pesos_info1: PesosInfo1;
  pesos_info2: PesosInfo2;
  observaciones?: string;
  rol_usuario?: string; // Rol del usuario para determinar qué API usar
}

export interface CertificateResponse {
  success: boolean;
  pdf_url?: string;
  pdf_base64?: string;
  error?: string;
  message?: string;
}

/**
 * Genera un PDF de boleta de Reciba (Entrada) usando la API externa
 */
export async function generateBoletaRecibaPDF(data: BoletaRecibaRequest): Promise<CertificateResponse> {
  try {
    console.log('[CERTIFICATE] Generando boleta de ENTRADA (Reciba):', data.boleta_no);
    console.log('🔧 [CERTIFICATE] Rol usuario:', data.rol_usuario);
    console.log('🔧 [CERTIFICATE] Análisis enviado:', JSON.stringify(data.analisis, null, 2));
    console.log('🔧 [CERTIFICATE] Total análisis:', data.analisis?.length || 0);
    console.log('[CERTIFICATE] Datos:', JSON.stringify(data, null, 2));
    
    // Timeout de 35 segundos en frontend (el servidor tiene 30s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);
    
    const response = await fetch(CERTIFICATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tipo: 'entrada', ...data }),
      signal: controller.signal,
    }).catch((fetchError: any) => {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout al generar PDF de entrada (más de 35 segundos)');
      }
      throw fetchError;
    });

    clearTimeout(timeoutId);

    console.log('🔧 [CERTIFICATE] Respuesta status:', response.status);
    console.log('🔧 [CERTIFICATE] Content-Type:', response.headers.get('content-type'));

    if (!response.ok) {
      // Intentar leer como JSON primero (si es un error)
      const contentType = response.headers.get('content-type');
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      let errorDetail = '';
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          console.error('[CERTIFICATE] Error de API (JSON):', errorData);
          
          // Obtener el mensaje de error
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.log('[CERTIFICATE] errorMessage original:', errorMessage);
          console.log('[CERTIFICATE] errorData.detail:', errorData.detail);
          
          // Primero verificar si hay un campo detail directo
          if (errorData.detail) {
            errorDetail = errorData.detail;
            console.log('[CERTIFICATE] Usando errorData.detail directo:', errorDetail);
          } else if (typeof errorMessage === 'string') {
            // Intentar parsear el mensaje si viene como JSON string anidado
            // El mensaje puede ser: '{"detail":"Error generando el PDF: Cannot open resource \"./images/logo.png\""}'
            const trimmedMessage = errorMessage.trim();
            console.log('[CERTIFICATE] Mensaje trimmeado:', trimmedMessage);
            console.log('[CERTIFICATE] ¿Es JSON?', trimmedMessage.startsWith('{') || trimmedMessage.startsWith('['));
            
            if (trimmedMessage.startsWith('{') || trimmedMessage.startsWith('[')) {
              try {
                // Intentar parsear el JSON, manejando posibles caracteres de escape
                let jsonString = errorMessage;
                // Limpiar posibles escapes dobles
                jsonString = jsonString.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                const parsedMessage = JSON.parse(jsonString);
                console.log('[CERTIFICATE] Mensaje parseado:', parsedMessage);
                errorDetail = parsedMessage.detail || parsedMessage.message || errorMessage;
                console.log('[CERTIFICATE] errorDetail después de parsear:', errorDetail);
              } catch (e) {
                console.error('[CERTIFICATE] Error al parsear JSON:', e);
                // Si falla el parse, intentar extraer el mensaje manualmente
                const detailMatch = errorMessage.match(/"detail"\s*:\s*"([^"]+)"/);
                if (detailMatch && detailMatch[1]) {
                  errorDetail = detailMatch[1];
                  console.log('[CERTIFICATE] Extraído con regex:', errorDetail);
                } else {
                  // Si falla todo, usar el mensaje tal cual
                  errorDetail = errorMessage;
                }
              }
            } else {
              errorDetail = errorMessage;
            }
          } else {
            errorDetail = String(errorMessage);
          }
          
          console.log('[CERTIFICATE] errorDetail final antes de traducción:', errorDetail);
          
          // Traducir errores comunes a mensajes más amigables
          if (errorDetail && typeof errorDetail === 'string') {
            if (errorDetail.includes('logo.png') || errorDetail.includes('Cannot open resource')) {
              errorDetail = 'Error en el servidor de generación de PDF: No se encuentra el archivo del logo. Por favor, contacta al administrador de la API de certificados (pdf-entrada.alsatechnologies.com).';
            } else if (errorDetail.includes('Error generando el PDF')) {
              // Extraer el detalle del error si está disponible
              const match = errorDetail.match(/Error generando el PDF: (.+)/);
              if (match && match[1]) {
                const errorCause = match[1];
                if (errorCause.includes('logo.png') || errorCause.includes('Cannot open resource')) {
                  errorDetail = 'Error en el servidor de generación de PDF: No se encuentra el archivo del logo. Por favor, contacta al administrador de la API de certificados (pdf-entrada.alsatechnologies.com).';
                } else {
                  errorDetail = `Error al generar el PDF: ${errorCause}`;
                }
              }
            }
          }
          
        } catch (e) {
          console.error('[CERTIFICATE] No se pudo parsear error como JSON:', e);
          errorDetail = errorMessage;
        }
      } else {
        // Si no es JSON, intentar leer como texto
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
            errorDetail = errorText;
            // Intentar parsear si es JSON string
            if (errorText.startsWith('{')) {
              try {
                const parsed = JSON.parse(errorText);
                errorDetail = parsed.detail || parsed.message || errorText;
                if (errorDetail.includes('logo.png') || errorDetail.includes('Cannot open resource')) {
                  errorDetail = 'Error en el servidor de generación de PDF: No se encuentra el logo. Por favor, contacta al administrador del sistema.';
                }
              } catch (e) {
                // No es JSON válido, usar el texto tal cual
              }
            }
            console.error('[CERTIFICATE] Error de API (texto):', errorText);
          }
        } catch (e) {
          console.error('[CERTIFICATE] No se pudo leer error:', e);
          errorDetail = errorMessage;
        }
      }
      
      throw new Error(errorDetail || errorMessage);
    }

    // Verificar que la respuesta sea un PDF
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      const responseText = await response.text();
      console.error('[CERTIFICATE] Respuesta no es PDF. Content-Type:', contentType);
      console.error('[CERTIFICATE] Respuesta:', responseText.substring(0, 500));
      throw new Error(`La API no devolvió un PDF. Content-Type: ${contentType}. Respuesta: ${responseText.substring(0, 200)}`);
    }

    // El nuevo endpoint devuelve PDF directamente, no JSON
    const pdfBlob = await response.blob();
    console.log('[CERTIFICATE] PDF recibido, tamaño:', pdfBlob.size, 'bytes');
    const pdfBase64 = await blobToBase64(pdfBlob);
    
    return {
      success: true,
      pdf_base64: pdfBase64,
      message: 'Boleta de entrada generada correctamente',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[CERTIFICATE] Error al generar boleta de entrada PDF:', errorMessage);
    if (error instanceof Error && error.stack) {
      console.error('[CERTIFICATE] Stack trace:', error.stack);
    }
    return {
      success: false,
      error: errorMessage || 'Error desconocido al generar PDF de entrada',
    };
  }
}

/**
 * Genera un PDF de boleta de Embarque (Salida) usando la API externa
 */
export async function generateBoletaEmbarquePDF(data: BoletaEmbarqueRequest): Promise<CertificateResponse> {
  try {
    console.log('Generando boleta de SALIDA (Embarque):', data.boleta_no);
    console.log('🔧 [CERTIFICATE] Rol usuario:', data.rol_usuario);
    console.log('🔧 [CERTIFICATE] Análisis enviado:', JSON.stringify(data.analisis, null, 2));
    console.log('🔧 [CERTIFICATE] Total análisis:', data.analisis?.length || 0);
    
    // Timeout de 35 segundos en frontend (el servidor tiene 30s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);
    
    const response = await fetch(CERTIFICATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tipo: 'salida', ...data }),
      signal: controller.signal,
    }).catch((fetchError: any) => {
      clearTimeout(timeoutId);
      console.error('❌ [CERTIFICATE] Error en fetch:', fetchError);
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout al generar PDF de salida (más de 35 segundos)');
      }
      throw new Error(`Error de conexión: ${fetchError.message || 'No se pudo conectar con el servidor'}`);
    });

    clearTimeout(timeoutId);

    console.log('🔧 [CERTIFICATE] Respuesta status:', response.status);
    console.log('🔧 [CERTIFICATE] Content-Type:', response.headers.get('content-type'));

    // Verificar Content-Type antes de parsear JSON
    const contentType = response.headers.get('content-type') || '';
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      if (contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('❌ [CERTIFICATE] Error de API:', errorData);
        } catch (e) {
          // Si no se puede parsear JSON, usar el texto de respuesta
          const textResponse = await response.text();
          errorMessage = textResponse || errorMessage;
          console.error('❌ [CERTIFICATE] Error al parsear respuesta:', textResponse.substring(0, 500));
        }
      } else {
        // Si no es JSON, leer como texto
        const textResponse = await response.text();
        errorMessage = textResponse || errorMessage;
        console.error('❌ [CERTIFICATE] Respuesta no es JSON:', textResponse.substring(0, 500));
      }
      throw new Error(errorMessage);
    }

    // El nuevo endpoint devuelve PDF directamente, no JSON
    const pdfBlob = await response.blob();
    const pdfBase64 = await blobToBase64(pdfBlob);
    
    return {
      success: true,
      pdf_base64: pdfBase64,
      message: 'Boleta de salida generada correctamente',
    };
  } catch (error) {
    console.error('Error al generar boleta de salida PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al generar PDF de salida',
    };
  }
}

/**
 * Convierte un Blob a base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Descarga o abre un PDF desde una URL o base64
 */
export function openPDF(pdfUrl?: string, pdfBase64?: string) {
  if (pdfUrl) {
    // Abrir PDF en nueva ventana
    window.open(pdfUrl, '_blank');
  } else if (pdfBase64) {
    // Convertir base64 a blob y abrir
    const byteCharacters = atob(pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Limpiar URL después de un tiempo
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

