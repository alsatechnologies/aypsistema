// Versión que se muestra en el inicio de sesión.
//
// Formato V <mayor>.<cambio>:
//   - Cada cambio que se sube a producción suma 1 al segundo número
//     (1.9 → 1.10 → 1.11; es un contador, no un decimal).
//   - El primer número solo cambia cuando se decide un hito grande
//     (módulo nuevo, etapa cotizada); ahí vuelve a 2.0, 3.0...
//
// En cada cambio: actualizar APP_VERSION y agregar su línea al historial.

export const APP_VERSION = '1.1';

export const HISTORIAL_VERSIONES: { version: string; fecha: string; cambio: string }[] = [
  { version: '1.1', fecha: '2026-11-09', cambio: 'Punto de partida del control de versiones: lotes (037/038), ajustes de Exportaciones, consulta para Báscula/Oficina y jumbos con carga abierta' },
  { version: '1.0', fecha: '2025-12-10', cambio: 'Versión inicial del sistema' },
];
