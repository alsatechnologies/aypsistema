import { supabase } from '@/lib/supabase';
import { parseNumeroBoleta } from './folioGenerator';
import type { TipoOperacion } from './folioGenerator';

/**
 * Calcula el siguiente consecutivo para una boleta considerando órdenes, embarques Y recepciones.
 * Consulta SIN filtrar por activo para que los registros eliminados (soft-delete) también
 * sean contados — de lo contrario se puede generar un número ya usado que viola la unique constraint.
 */
export async function calcularSiguienteConsecutivo(
  tipoOperacion: TipoOperacion,
  productoId: number,
  codigoBoleta: string
): Promise<number> {
  if (!supabase) throw new Error('Supabase no está configurado');

  const añoActual = new Date().getFullYear();

  const tipoCode = tipoOperacion === 'Entradas' ? '1'
                 : tipoOperacion === 'Embarque Nacional' ? '2' : '3';

  const productoCode = codigoBoleta.length === 2 ? codigoBoleta : codigoBoleta.padStart(2, '0');

  const consecutivos: number[] = [];

  const isValid = (boleta: string, fecha: string | null, createdAt: string | null): boolean => {
    if (!boleta || boleta.startsWith('TEMP-') || boleta.includes('1212')) return false;
    const d = fecha ? new Date(fecha) : createdAt ? new Date(createdAt) : null;
    if (!d || d.getFullYear() !== añoActual) return false;
    const parsed = parseNumeroBoleta(boleta);
    if (!parsed) return false;
    return parsed.tipoCode === tipoCode && parsed.productoBoleta === productoCode;
  };

  // Ordenes — sin filtro activo, solo boletas finales del mismo producto y tipo
  try {
    const tipoOperacionDB = tipoOperacion === 'Entradas' ? 'Reciba'
                          : tipoOperacion === 'Embarque Nacional' ? 'Embarque Nacional'
                          : 'Embarque Exportación';

    const { data, error } = await supabase
      .from('ordenes')
      .select('boleta, fecha_hora_ingreso, created_at')
      .eq('producto_id', productoId)
      .eq('tipo_operacion', tipoOperacionDB)
      .not('boleta', 'like', 'TEMP-%')
      .limit(10000);

    if (error) throw error;
    for (const o of data ?? []) {
      if (isValid(o.boleta, o.fecha_hora_ingreso, o.created_at)) {
        const parsed = parseNumeroBoleta(o.boleta);
        if (parsed) consecutivos.push(parsed.consecutivo);
      }
    }
  } catch (error) {
    console.error('Error al obtener órdenes para calcular consecutivo:', error);
  }

  // Embarques — sin filtro activo
  if (tipoOperacion === 'Embarque Nacional' || tipoOperacion === 'Exportación') {
    try {
      const tipoEmbarqueDB = tipoOperacion === 'Embarque Nacional' ? 'Nacional' : 'Exportación';

      const { data, error } = await supabase
        .from('embarques')
        .select('boleta, fecha, created_at')
        .eq('producto_id', productoId)
        .eq('tipo_embarque', tipoEmbarqueDB)
        .limit(10000);

      if (error) throw error;
      for (const e of data ?? []) {
        if (isValid(e.boleta, e.fecha, e.created_at)) {
          const parsed = parseNumeroBoleta(e.boleta);
          if (parsed) consecutivos.push(parsed.consecutivo);
        }
      }
    } catch (error) {
      console.error('Error al obtener embarques para calcular consecutivo:', error);
    }
  }

  // Recepciones — sin filtro activo (solo para Entradas)
  if (tipoOperacion === 'Entradas') {
    try {
      const { data, error } = await supabase
        .from('recepciones')
        .select('boleta, fecha, created_at')
        .eq('producto_id', productoId)
        .not('boleta', 'like', 'TEMP-%')
        .limit(10000);

      if (error) throw error;
      for (const r of data ?? []) {
        if (isValid(r.boleta, r.fecha, r.created_at)) {
          const parsed = parseNumeroBoleta(r.boleta);
          if (parsed) consecutivos.push(parsed.consecutivo);
        }
      }
    } catch (error) {
      console.error('Error al obtener recepciones para calcular consecutivo:', error);
    }
  }

  if (consecutivos.length === 0) return 1;

  return Math.max(...consecutivos) + 1;
}
