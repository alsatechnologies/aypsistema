export interface PrinterConfig {
  connection_type: 'usb' | 'network';
  printer_name?: string;
  ip?: string;
  port?: number;
  timeout?: number;
}

export interface PrintTicketRequest {
  rol_usuario?: string; // Rol del usuario para determinar qué API usar (Opcional)
  printer_config: PrinterConfig;
  producto: string;
  fecha: string;
  boleta: string;
  cliente: string;
  destino: string;
  placas: string;
  vehiculo: string;
  chofer: string;
  copias: number;
  logo?: string; // Logo en formato base64 (opcional)
}

export interface PrintTicketResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ListPrintersResponse {
  success: boolean;
  printers?: string[];
  count?: number;
  platform?: string;
  message?: string;
  error?: string;
}

/**
 * Imprime un ticket térmico usando la API de impresión
 * Usa una función serverless de Vercel como proxy para evitar problemas de CORS
 */
export async function printTicket(data: PrintTicketRequest): Promise<PrintTicketResponse> {
  try {
    // Usar la ruta relativa que apunta a la función serverless de Vercel
    const apiUrl = '/api/print-ticket';
    
    // Timeout de 18 segundos en frontend (el servidor tiene 15s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    }).catch((fetchError: any) => {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout al imprimir ticket (más de 18 segundos)');
      }
      throw fetchError;
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: result.success || true,
      message: result.message || 'Ticket impreso correctamente',
    };
  } catch (error) {
    console.error('Error al imprimir ticket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al imprimir',
    };
  }
}

/**
 * Lista las impresoras USB disponibles en el servidor de impresión
 * @param rol_usuario Rol del usuario para determinar qué API usar (opcional)
 */
export async function listPrinters(rol_usuario?: string): Promise<ListPrintersResponse> {
  try {
    const apiUrl = '/api/list-printers';
    const url = rol_usuario ? `${apiUrl}?rol_usuario=${encodeURIComponent(rol_usuario)}` : apiUrl;
    
    // Timeout de 12 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    }).catch((fetchError: any) => {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout al listar impresoras (más de 12 segundos)');
      }
      throw fetchError;
    });

    clearTimeout(timeoutId);

    // Verificar Content-Type antes de parsear JSON
    const contentType = response.headers.get('content-type') || '';
    
    if (!contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('❌ [LIST-PRINTERS] La API devolvió HTML en lugar de JSON');
      console.error('❌ [LIST-PRINTERS] Status:', response.status);
      console.error('❌ [LIST-PRINTERS] Respuesta:', textResponse.substring(0, 500));
      throw new Error(`Error de conexión: La API devolvió una respuesta HTML (posible 404). Verifica que la función serverless esté desplegada correctamente.`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: result.success || true,
      printers: result.printers || [],
      count: result.count || 0,
      platform: result.platform,
      message: result.message || 'Impresoras listadas correctamente',
    };
  } catch (error) {
    console.error('Error al listar impresoras:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al listar impresoras',
    };
  }
}

