import { supabase } from '@/lib/supabase';
import { parseNumeroBoleta } from './folioGenerator';
import type { TipoOperacion } from './folioGenerator';

/**
 * Calcula el siguiente consecutivo para una boleta.
 *
 * Filtra por PREFIJO DE BOLETA (tipoCode + productoCode) en lugar de producto_id,
 * porque la unique constraint "ordenes_boleta_key" es GLOBAL — dos productos con el
 * mismo codigo_boleta comparten el mismo espacio de numeración y deben verse entre sí.
 * También consulta sin filtro activo para incluir registros eliminados (soft-delete).
 */
export async function calcularSiguienteConsecutivo(
  tipoOperacion: TipoOperacion,
  _productoId: number,
  codigoBoleta: string
): Promise<number> {
  if (!supabase) throw new Error('Supabase no está configurado');

  const añoActual = new Date().getFullYear();

  const tipoCode = tipoOperacion === 'Entradas' ? '1'
                 : tipoOperacion === 'Embarque Nacional' ? '2' : '3';

  const productoCode = codigoBoleta.length === 2 ? codigoBoleta : codigoBoleta.padStart(2, '0');

  // Prefijo exacto de 3 chars que deben tener todas las boletas de este tipo+producto
  const prefijo = `${tipoCode}${productoCode}`;

  const consecutivos: number[] = [];

  const extraer = (boleta: string, fecha: string | null, createdAt: string | null) => {
    if (!boleta || boleta.startsWith('TEMP-') || boleta.includes('1212')) return;
    const d = fecha ? new Date(fecha) : createdAt ? new Date(createdAt) : null;
    if (!d || d.getFullYear() !== añoActual) return;
    const parsed = parseNumeroBoleta(boleta);
    if (parsed) consecutivos.push(parsed.consecutivo);
  };

  // Ordenes: buscar por prefijo (incluye todos los productos con el mismo codigo_boleta, activos e inactivos)
  try {
    const { data, error } = await supabase
      .from('ordenes')
      .select('boleta, fecha_hora_ingreso, created_at')
      .like('boleta', `${prefijo}%`)
      .limit(10000);

    if (error) throw error;
    for (const o of data ?? []) extraer(o.boleta, o.fecha_hora_ingreso, o.created_at);
  } catch (error) {
    console.error('Error al obtener órdenes para calcular consecutivo:', error);
  }

  // Embarques: buscar por prefijo (sin filtro activo ni producto_id)
  if (tipoOperacion === 'Embarque Nacional' || tipoOperacion === 'Exportación') {
    try {
      const { data, error } = await supabase
        .from('embarques')
        .select('boleta, fecha, created_at')
        .like('boleta', `${prefijo}%`)
        .limit(10000);

      if (error) throw error;
      for (const e of data ?? []) extraer(e.boleta, e.fecha, e.created_at);
    } catch (error) {
      console.error('Error al obtener embarques para calcular consecutivo:', error);
    }
  }

  // Recepciones: buscar por prefijo (sin filtro activo ni producto_id)
  if (tipoOperacion === 'Entradas') {
    try {
      const { data, error } = await supabase
        .from('recepciones')
        .select('boleta, fecha, created_at')
        .like('boleta', `${prefijo}%`)
        .not('boleta', 'like', 'TEMP-%')
        .limit(10000);

      if (error) throw error;
      for (const r of data ?? []) extraer(r.boleta, r.fecha, r.created_at);
    } catch (error) {
      console.error('Error al obtener recepciones para calcular consecutivo:', error);
    }
  }

  if (consecutivos.length === 0) return 1;

  return Math.max(...consecutivos) + 1;
}
