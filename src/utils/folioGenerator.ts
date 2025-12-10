/**
 * Genera el Número de Boleta con formato: X-YY-ZZZZ
 * 
 * X = Tipo de operación:
 *   0 = Reciba
 *   1 = Embarque Nacional
 *   2 = Embarque Exportación
 * 
 * YY = Folio del producto (configurable por producto)
 * 
 * ZZZZ = Número consecutivo reiniciado mensualmente
 */

export type TipoOperacion = 'Reciba' | 'Embarque Nacional' | 'Embarque Exportación';

// Mapeo de tipo de operación a código
const TIPO_OPERACION_CODES: Record<TipoOperacion, string> = {
  'Reciba': '0',
  'Embarque Nacional': '1',
  'Embarque Exportación': '2',
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
  return TIPO_OPERACION_CODES[tipo] || '0';
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
 * Genera el número de boleta completo
 */
export const generateNumeroBoleta = (
  tipoOperacion: TipoOperacion,
  producto: string,
  consecutivo: number
): string => {
  const tipoCode = getTipoOperacionCode(tipoOperacion);
  const productoFolio = getProductoFolio(producto);
  const consecutivoStr = formatConsecutivo(consecutivo);
  
  return `${tipoCode}-${productoFolio}-${consecutivoStr}`;
};

/**
 * Parsea un número de boleta existente
 */
export const parseNumeroBoleta = (folio: string): {
  tipoCode: string;
  productoFolio: string;
  consecutivo: number;
} | null => {
  const parts = folio.split('-');
  if (parts.length !== 3) return null;
  
  return {
    tipoCode: parts[0],
    productoFolio: parts[1],
    consecutivo: parseInt(parts[2], 10),
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
 * Genera un folio para reciba basado en el producto
 */
export const generarFolioReciba = (producto: string, consecutivo: number): string => {
  return generateNumeroBoleta('Reciba', producto, consecutivo);
};
