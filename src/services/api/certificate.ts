/**
 * Servicio para generar certificados/boletas PDF usando la API externa
 * La URL puede configurarse mediante variable de entorno o usar localhost por defecto
 */

// Usar la función serverless de Vercel como proxy para evitar problemas de CORS
// La URL real de la API se configura en la variable de entorno CERTIFICATE_API_URL en Vercel
const CERTIFICATE_API_URL = '/api/generate-certificate';

export interface AnalisisItem {
  nombre: string;
  valor: number;
  unidad?: string;
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
  analisis: AnalisisItem[];
  pesos_info1: PesosInfo1;
  pesos_info2: PesosInfo2;
  observaciones?: string;
}

export interface BoletaEmbarqueRequest {
  boleta_no: string;
  fecha: string;
  lote?: string;
  cliente: string;
  producto: string;
  destino: string;
  vehiculo: string;
  placas?: string;
  chofer: string;
  tipo_transporte: 'Camión' | 'Ferroviaria';
  tipo_embarque: 'Nacional' | 'Exportación';
  analisis?: AnalisisItem[];
  pesos_info1: PesosInfo1;
  pesos_info2?: PesosInfo2;
  observaciones?: string;
  sellos?: {
    entrada1?: string;
    entrada2?: string;
    salida1?: string;
    salida2?: string;
  };
}

export interface CertificateResponse {
  success: boolean;
  pdf_url?: string;
  pdf_base64?: string;
  error?: string;
  message?: string;
}

/**
 * Genera un PDF de boleta de Reciba usando la API externa
 */
export async function generateBoletaRecibaPDF(data: BoletaRecibaRequest): Promise<CertificateResponse> {
  try {
    const response = await fetch(CERTIFICATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    // La función serverless siempre devuelve JSON
    const result = await response.json();
    return {
      success: result.success !== false,
      pdf_url: result.pdf_url,
      pdf_base64: result.pdf_base64,
      message: result.message || 'Boleta generada correctamente',
      error: result.error,
    };
  } catch (error) {
    console.error('Error al generar boleta PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al generar PDF',
    };
  }
}

/**
 * Genera un PDF de boleta de Embarque usando la API externa
 */
export async function generateBoletaEmbarquePDF(data: BoletaEmbarqueRequest): Promise<CertificateResponse> {
  try {
    const response = await fetch(CERTIFICATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    // La función serverless siempre devuelve JSON
    const result = await response.json();
    return {
      success: result.success !== false,
      pdf_url: result.pdf_url,
      pdf_base64: result.pdf_base64,
      message: result.message || 'Boleta generada correctamente',
      error: result.error,
    };
  } catch (error) {
    console.error('Error al generar boleta PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al generar PDF',
    };
  }
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

