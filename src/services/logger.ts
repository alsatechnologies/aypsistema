/**
 * Servicio de logging centralizado
 * Solo registra logs en desarrollo, en producción se silencian
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  user?: string;
  module?: string;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  }

  private formatMessage(level: LogLevel, message: string, data?: any, module?: string): string {
    const timestamp = new Date().toISOString();
    const modulePrefix = module ? `[${module}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${modulePrefix} ${message}`;
  }

  private log(level: LogLevel, message: string, data?: any, module?: string): void {
    if (!this.isDevelopment) {
      return; // No loguear en producción
    }

    const formattedMessage = this.formatMessage(level, message, data, module);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, data || '');
        break;
      case 'info':
        console.info(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'error':
        console.error(formattedMessage, data || '');
        break;
    }
  }

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message: string, data?: any, module?: string): void {
    this.log('debug', message, data, module);
  }

  /**
   * Log de información
   */
  info(message: string, data?: any, module?: string): void {
    this.log('info', message, data, module);
  }

  /**
   * Log de advertencia
   */
  warn(message: string, data?: any, module?: string): void {
    this.log('warn', message, data, module);
  }

  /**
   * Log de error
   * En producción, estos errores deberían enviarse a un servicio de monitoreo
   */
  error(message: string, error?: Error | any, module?: string): void {
    this.log('error', message, error, module);
    
    // En producción, aquí podrías enviar el error a un servicio como Sentry, LogRocket, etc.
    if (!this.isDevelopment) {
      // TODO: Integrar con servicio de monitoreo de errores
      // Ejemplo: Sentry.captureException(error);
    }
  }

  /**
   * Log de operaciones críticas (siempre se registra, incluso en producción)
   * Útil para auditoría y debugging de problemas críticos
   */
  critical(message: string, data?: any, module?: string): void {
    const timestamp = new Date().toISOString();
    const modulePrefix = module ? `[${module}]` : '';
    const formattedMessage = `${timestamp} CRITICAL ${modulePrefix} ${message}`;
    
    console.error(formattedMessage, data || '');
    
    // En producción, enviar a servicio de monitoreo
    if (!this.isDevelopment) {
      // TODO: Enviar a servicio de monitoreo
    }
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Exportar clase para testing
export { Logger };

