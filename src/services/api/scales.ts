// Usar función serverless de Vercel como proxy para evitar CORS
const API_BASE_URL = '/api/scales-weight';

export interface ScaleConfig {
  scale_id: string;
  model: string;
  connection_type: 'serial' | 'network';
  address: string;
  port?: number;
  baudrate?: number;
}

export interface ScaleReadingResponse {
  success: boolean;
  weight?: number;
  error?: string;
  message?: string;
}

/**
 * Registra una báscula en el sistema
 * Nota: Las básculas ya están predefinidas, pero esta función está disponible si se necesita
 */
export async function registerScale(config: ScaleConfig): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/scales/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || 'Báscula registrada correctamente',
    };
  } catch (error) {
    console.error('Error al registrar báscula:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al registrar báscula',
    };
  }
}

/**
 * Obtiene el peso actual de una báscula
 * Usa una función serverless de Vercel como proxy para evitar problemas de CORS
 * @param scaleId ID de la báscula (ej: 'bascula_02' para ferroviaria)
 * @param getType Tipo de lectura ('weight' para peso)
 */
export async function getScaleWeight(scaleId: string, getType: string = 'weight'): Promise<ScaleReadingResponse> {
  try {
    // Usar la función serverless proxy con query parameters
    const response = await fetch(`${API_BASE_URL}?scale_id=${encodeURIComponent(scaleId)}&get_type=${encodeURIComponent(getType)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Error al leer peso de la báscula',
      };
    }

    return {
      success: true,
      weight: result.weight,
    };
  } catch (error) {
    console.error('Error al leer peso de la báscula:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al leer peso',
    };
  }
}

/**
 * Básculas predefinidas en el sistema
 */
export const PREDEFINED_SCALES = {
  CAMION: {
    scale_id: 'bascula_01',
    model: '720i2A',
    connection_type: 'serial' as const,
    address: 'COM1',
    baudrate: 9600,
  },
  FERROVIARIA: {
    scale_id: 'bascula_02',
    model: '720i2A',
    connection_type: 'serial' as const,
    address: 'COM3',
    baudrate: 9600,
  },
};

