const API_BASE_URL = import.meta.env.VITE_PRINTER_API_URL || 'https://apiticket.alsatechnologies.com';

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
 */
export async function printTicket(data: PrintTicketRequest): Promise<PrintTicketResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/printer/print-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
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

