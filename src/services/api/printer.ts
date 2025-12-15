export interface PrinterConfig {
  connection_type: 'usb' | 'network';
  printer_name?: string;
  ip?: string;
  port?: number;
  timeout?: number;
}

export interface PrintTicketRequest {
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
}

export interface PrintTicketResponse {
  success: boolean;
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
    
    const response = await fetch(apiUrl, {
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

