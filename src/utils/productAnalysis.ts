/**
 * Configuración de análisis por producto
 * Cada producto tiene diferentes parámetros de calidad a medir
 */

export interface AnalisisConfig {
  nombre: string;
  unidad: string;
  rangoMin?: number;
  rangoMax?: number;
  descuento?: boolean; // Si aplica para cálculo de descuento
  tolerancia?: number; // Valor a partir del cual aplica descuento
}

export interface ProductoAnalisis {
  producto: string;
  folioCode: string;
  analisis: AnalisisConfig[];
}

// Configuración de análisis por producto
export const PRODUCTOS_ANALISIS: ProductoAnalisis[] = [
  {
    producto: 'Frijol Soya',
    folioCode: '03',
    analisis: [
      { nombre: 'Humedad', unidad: '%', rangoMin: 0, rangoMax: 14, descuento: true, tolerancia: 13 },
      { nombre: 'Impurezas', unidad: '%', rangoMin: 0, rangoMax: 3, descuento: true, tolerancia: 1 },
      { nombre: 'Granos Dañados', unidad: '%', rangoMin: 0, rangoMax: 8, descuento: true, tolerancia: 2 },
      { nombre: 'Granos Quebrados', unidad: '%', rangoMin: 0, rangoMax: 10, descuento: true, tolerancia: 5 },
      { nombre: 'Aceite', unidad: '%', rangoMin: 18, rangoMax: 22, descuento: false },
      { nombre: 'Proteína', unidad: '%', rangoMin: 34, rangoMax: 40, descuento: false },
    ]
  },
  {
    producto: 'Maíz',
    folioCode: '06',
    analisis: [
      { nombre: 'Humedad', unidad: '%', rangoMin: 0, rangoMax: 14, descuento: true, tolerancia: 14 },
      { nombre: 'Impurezas', unidad: '%', rangoMin: 0, rangoMax: 3, descuento: true, tolerancia: 2 },
      { nombre: 'Granos Dañados', unidad: '%', rangoMin: 0, rangoMax: 5, descuento: true, tolerancia: 3 },
      { nombre: 'Aflatoxinas', unidad: 'ppb', rangoMin: 0, rangoMax: 20, descuento: false },
    ]
  },
  {
    producto: 'Sorgo',
    folioCode: '07',
    analisis: [
      { nombre: 'Humedad', unidad: '%', rangoMin: 0, rangoMax: 14, descuento: true, tolerancia: 14 },
      { nombre: 'Impurezas', unidad: '%', rangoMin: 0, rangoMax: 3, descuento: true, tolerancia: 2 },
      { nombre: 'Granos Dañados', unidad: '%', rangoMin: 0, rangoMax: 5, descuento: true, tolerancia: 3 },
      { nombre: 'Taninos', unidad: '%', rangoMin: 0, rangoMax: 1, descuento: false },
    ]
  },
  {
    producto: 'Aceite Crudo de Soya',
    folioCode: '01',
    analisis: [
      { nombre: 'Acidez', unidad: '%', rangoMin: 0, rangoMax: 3, descuento: true, tolerancia: 0.5 },
      { nombre: 'Humedad', unidad: '%', rangoMin: 0, rangoMax: 0.5, descuento: true, tolerancia: 0.1 },
      { nombre: 'Impurezas', unidad: '%', rangoMin: 0, rangoMax: 0.5, descuento: true, tolerancia: 0.1 },
      { nombre: 'Índice de Peróxidos', unidad: 'meq/kg', rangoMin: 0, rangoMax: 10, descuento: false },
    ]
  },
  {
    producto: 'Pasta de Soya',
    folioCode: '02',
    analisis: [
      { nombre: 'Humedad', unidad: '%', rangoMin: 0, rangoMax: 12, descuento: true, tolerancia: 12 },
      { nombre: 'Proteína', unidad: '%', rangoMin: 44, rangoMax: 48, descuento: false },
      { nombre: 'Grasa', unidad: '%', rangoMin: 0, rangoMax: 2, descuento: false },
      { nombre: 'Fibra', unidad: '%', rangoMin: 0, rangoMax: 7, descuento: false },
    ]
  },
  {
    producto: 'Cascarilla de Soya',
    folioCode: '05',
    analisis: [
      { nombre: 'Humedad', unidad: '%', rangoMin: 0, rangoMax: 12, descuento: true, tolerancia: 12 },
      { nombre: 'Proteína', unidad: '%', rangoMin: 10, rangoMax: 14, descuento: false },
      { nombre: 'Fibra', unidad: '%', rangoMin: 30, rangoMax: 40, descuento: false },
    ]
  },
];

/**
 * Obtiene la configuración de análisis para un producto
 */
export const getProductoAnalisis = (producto: string): AnalisisConfig[] => {
  const config = PRODUCTOS_ANALISIS.find(p => p.producto === producto);
  return config?.analisis || [];
};

/**
 * Calcula el descuento basado en el valor y la tolerancia
 * Retorna el porcentaje de descuento
 */
export const calcularDescuento = (
  valor: number,
  tolerancia: number,
  factorDescuento: number = 1.3 // Factor de descuento por cada punto sobre tolerancia
): number => {
  if (valor <= tolerancia) return 0;
  const exceso = valor - tolerancia;
  return exceso * factorDescuento;
};

/**
 * Calcula todos los descuentos para un conjunto de valores de análisis
 */
export const calcularDescuentosTotales = (
  producto: string,
  valores: Record<string, number>
): { descuentos: Record<string, number>; totalDescuento: number } => {
  const analisis = getProductoAnalisis(producto);
  const descuentos: Record<string, number> = {};
  let totalDescuento = 0;

  analisis.forEach(a => {
    if (a.descuento && a.tolerancia !== undefined) {
      const valor = valores[a.nombre] || 0;
      const descuento = calcularDescuento(valor, a.tolerancia);
      descuentos[a.nombre] = descuento;
      totalDescuento += descuento;
    }
  });

  return { descuentos, totalDescuento };
};

/**
 * Calcula el peso neto final después de aplicar descuentos
 */
export const calcularPesoNetoFinal = (
  pesoNeto: number,
  totalDescuento: number
): number => {
  const descuentoKg = (pesoNeto * totalDescuento) / 100;
  return Math.max(0, pesoNeto - descuentoKg);
};
