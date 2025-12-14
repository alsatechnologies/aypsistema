/**
 * Genera el Número de Boleta con formato: XYYZZZZ (sin guiones)
 * 
 * X = Tipo de operación:
 *   1 = Entradas (Reciba)
 *   2 = Embarque Nacional
 *   3 = Exportación
 * 
 * YY = Boleta del producto (configurable por producto)
 * 
 * ZZZZ = Número consecutivo reiniciado anualmente
 */

export type TipoOperacion = 'Entradas' | 'Embarque Nacional' | 'Exportación';

// Mapeo de tipo de operación a código
const TIPO_OPERACION_CODES: Record<TipoOperacion, string> = {
  'Entradas': '1',
  'Embarque Nacional': '2',
  'Exportación': '3',
};

// Boletas de productos (temporal - debería venir de la base de datos)
const PRODUCTO_BOLETAS: Record<string, string> = {
  'Aceite Crudo de Soya': '01',
  'Pasta de Soya': '02',
  'Frijol Soya': '03',
  'Aceite Refinado': '04',
  'Cascarilla de Soya': '05',
  'Maíz': '06',
  'Sorgo': '07',
};

/**
 * Obtiene el código de tipo de operación
 */
export const getTipoOperacionCode = (tipo: TipoOperacion): string => {
  return TIPO_OPERACION_CODES[tipo] || '1';
};

/**
 * Obtiene la boleta del producto
 */
export const getProductoBoleta = (producto: string): string => {
  return PRODUCTO_BOLETAS[producto] || '00';
};

/**
 * Formatea el número consecutivo a 4 dígitos
 */
export const formatConsecutivo = (num: number): string => {
  return num.toString().padStart(4, '0');
};

/**
 * Genera el número de boleta completo (sin guiones)
 * @param tipoOperacion - Tipo de operación
 * @param codigoBoleta - Código de boleta del producto (2 dígitos) o nombre del producto (para retrocompatibilidad)
 * @param consecutivo - Número consecutivo
 */
export const generateNumeroBoleta = (
  tipoOperacion: TipoOperacion,
  codigoBoleta: string,
  consecutivo: number
): string => {
  const tipoCode = getTipoOperacionCode(tipoOperacion);
  // Si codigoBoleta tiene 2 dígitos, usarlo directamente; si no, buscar en el mapeo (retrocompatibilidad)
  const productoBoleta = codigoBoleta.length === 2 ? codigoBoleta : getProductoBoleta(codigoBoleta);
  const consecutivoStr = formatConsecutivo(consecutivo);
  
  return `${tipoCode}${productoBoleta}${consecutivoStr}`;
};

/**
 * Parsea un número de boleta existente (formato: XYYZZZZ)
 */
export const parseNumeroBoleta = (boleta: string): {
  tipoCode: string;
  productoBoleta: string;
  consecutivo: number;
} | null => {
  if (boleta.length !== 7) return null;
  
  return {
    tipoCode: boleta.substring(0, 1),
    productoBoleta: boleta.substring(1, 3),
    consecutivo: parseInt(boleta.substring(3, 7), 10),
  };
};

/**
 * Obtiene el nombre del tipo de operación desde el código
 */
export const getTipoOperacionFromCode = (code: string): TipoOperacion | null => {
  const entries = Object.entries(TIPO_OPERACION_CODES);
  const found = entries.find(([_, c]) => c === code);
  return found ? found[0] as TipoOperacion : null;
};

/**
 * Genera una boleta para entradas basado en el producto
 * @param codigoBoleta - Código de boleta del producto (2 dígitos) o nombre del producto (para retrocompatibilidad)
 * @param consecutivo - Número consecutivo
 */
export const generarBoletaEntradas = (codigoBoleta: string, consecutivo: number): string => {
  return generateNumeroBoleta('Entradas', codigoBoleta, consecutivo);
};

/**
 * Genera una boleta para embarque nacional
 */
export const generarBoletaEmbarqueNacional = (producto: string, consecutivo: number): string => {
  return generateNumeroBoleta('Embarque Nacional', producto, consecutivo);
};

/**
 * Genera una boleta para exportación
 */
export const generarBoletaExportacion = (producto: string, consecutivo: number): string => {
  return generateNumeroBoleta('Exportación', producto, consecutivo);
};
