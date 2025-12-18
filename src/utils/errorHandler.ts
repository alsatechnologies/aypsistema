/**
 * Utilidades para manejo centralizado de errores
 */

import { toast } from 'sonner';
import { logger } from '@/services/logger';

export interface ErrorContext {
  module?: string;
  action?: string;
  data?: any;
}

/**
 * Maneja errores de manera consistente en toda la aplicación
 */
export function handleError(
  error: unknown,
  context?: ErrorContext,
  userMessage?: string
): void {
  // Log del error
  const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
  logger.error(
    `Error en ${context?.module || 'desconocido'}: ${errorMessage}`,
    error,
    context?.module
  );

  // Mostrar mensaje al usuario
  const message = userMessage || getErrorMessage(error, context);
  toast.error(message);

  // En producción, aquí podrías enviar a un servicio de monitoreo
  if (!import.meta.env.DEV) {
    // TODO: Enviar a Sentry, LogRocket, etc.
  }
}

/**
 * Obtiene un mensaje de error amigable para el usuario
 */
function getErrorMessage(error: unknown, context?: ErrorContext): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Errores de red
    if (message.includes('network') || message.includes('fetch')) {
      return 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.';
    }

    // Errores de timeout
    if (message.includes('timeout') || message.includes('abort')) {
      return 'La operación tardó demasiado. Por favor, intenta de nuevo.';
    }

    // Errores de autenticación
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
    }

    // Errores de permisos
    if (message.includes('forbidden') || message.includes('403')) {
      return 'No tienes permisos para realizar esta acción.';
    }

    // Errores de validación
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Los datos ingresados no son válidos. Por favor, verifica e intenta de nuevo.';
    }

    // Errores de servidor
    if (message.includes('500') || message.includes('server')) {
      return 'Error del servidor. Por favor, intenta más tarde o contacta al administrador.';
    }

    // Errores específicos del contexto
    if (context?.module === 'Reciba') {
      if (message.includes('peso')) {
        return 'Error al capturar peso. Verifica la conexión con la báscula.';
      }
      if (message.includes('guardar')) {
        return 'Error al guardar la recepción. Verifica los datos e intenta de nuevo.';
      }
    }

    if (context?.module === 'Embarque') {
      if (message.includes('peso')) {
        return 'Error al capturar peso. Verifica la conexión con la báscula.';
      }
      if (message.includes('guardar')) {
        return 'Error al guardar el embarque. Verifica los datos e intenta de nuevo.';
      }
    }

    // Mensaje genérico
    return `Error: ${error.message}`;
  }

  return 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.';
}

/**
 * Wrapper para funciones async que maneja errores automáticamente
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext,
  userMessage?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context, userMessage);
      throw error; // Re-lanzar para que el caller pueda manejarlo si es necesario
    }
  }) as T;
}

