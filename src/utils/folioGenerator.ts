/**
 * Genera el Número de Boleta con formato: XYYZZZZ (sin guiones)
 * 
 * X = Tipo de operación:
 *   1 = Entradas (Reciba)
 *   2 = Embarque Nacional
 *   3 = Exportación
 * 
 * YY = Folio del producto (configurable por producto)
 * 
 * ZZZZ = Número consecutivo reiniciado mensualmente
 */

export type TipoOperacion = 'Entradas' | 'Embarque Nacional' | 'Exportación';

// Mapeo de tipo de operación a código
const TIPO_OPERACION_CODES: Record<TipoOperacion, string> = {
  'Entradas': '1',
  'Embarque Nacional': '2',
  'Exportación': '3',
};

// Folios de productos (temporal - debería venir de la base de datos)
const PRODUCTO_FOLIOS: Record<string, string> = {
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
 * Obtiene el folio del producto
 */
export const getProductoFolio = (producto: string): string => {
  return PRODUCTO_FOLIOS[producto] || '00';
};

/**
 * Formatea el número consecutivo a 4 dígitos
 */
export const formatConsecutivo = (num: number): string => {
  return num.toString().padStart(4, '0');
};

/**
 * Genera el número de boleta completo (sin guiones)
 */
export const generateNumeroBoleta = (
  tipoOperacion: TipoOperacion,
  producto: string,
  consecutivo: number
): string => {
  const tipoCode = getTipoOperacionCode(tipoOperacion);
  const productoFolio = getProductoFolio(producto);
  const consecutivoStr = formatConsecutivo(consecutivo);
  
  return `${tipoCode}${productoFolio}${consecutivoStr}`;
};

/**
 * Parsea un número de boleta existente (formato: XYYZZZZ)
 */
export const parseNumeroBoleta = (boleta: string): {
  tipoCode: string;
  productoFolio: string;
  consecutivo: number;
} | null => {
  if (boleta.length !== 7) return null;
  
  return {
    tipoCode: boleta.substring(0, 1),
    productoFolio: boleta.substring(1, 3),
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
 */
export const generarBoletaEntradas = (producto: string, consecutivo: number): string => {
  return generateNumeroBoleta('Entradas', producto, consecutivo);
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
