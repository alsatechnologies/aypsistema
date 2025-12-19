import { getEmbarques } from '@/services/supabase/embarques';
import { getOrdenes } from '@/services/supabase/ordenes';
import { getRecepciones } from '@/services/supabase/recepciones';
import { parseNumeroBoleta } from './folioGenerator';
import type { TipoOperacion } from './folioGenerator';

/**
 * Calcula el siguiente consecutivo para una boleta considerando órdenes, embarques Y recepciones
 * Esto asegura que no se repitan consecutivos sin importar desde dónde se cree la boleta
 * @param tipoOperacion - Tipo de operación (Embarque Nacional, Exportación, Entradas)
 * @param productoId - ID del producto
 * @param codigoBoleta - Código de boleta del producto (2 dígitos)
 * @returns El siguiente consecutivo a usar
 */
export async function calcularSiguienteConsecutivo(
  tipoOperacion: TipoOperacion,
  productoId: number,
  codigoBoleta: string
): Promise<number> {
  const fechaActual = new Date();
  const añoActual = fechaActual.getFullYear();
  
  // Obtener el código de tipo de operación esperado
  const tipoCode = tipoOperacion === 'Entradas' ? '1' : 
                   tipoOperacion === 'Embarque Nacional' ? '2' : '3';
  
  // Obtener el código de producto esperado (2 dígitos)
  const productoCode = codigoBoleta.length === 2 ? codigoBoleta : codigoBoleta.padStart(2, '0');
  
  // Buscar todas las órdenes del año actual
  let ordenesDelAño: any[] = [];
  try {
    const ordenesResult = await getOrdenes();
    // Manejar tanto el formato antiguo (array) como el nuevo ({ data, count })
    const ordenes = Array.isArray(ordenesResult) ? ordenesResult : (ordenesResult.data || []);
    ordenesDelAño = ordenes.filter(o => {
      // Debe tener boleta final (no temporal)
      if (!o.boleta || o.boleta.startsWith('TEMP-')) return false;
      
      // Debe tener el mismo producto
      if (o.producto_id !== productoId) return false;
      
      // Debe tener el mismo tipo de operación
      const ordenTipoOperacion = o.tipo_operacion === 'Reciba' ? 'Entradas' :
                                 o.tipo_operacion === 'Embarque Nacional' ? 'Embarque Nacional' :
                                 o.tipo_operacion === 'Embarque Exportación' ? 'Exportación' : null;
      if (ordenTipoOperacion !== tipoOperacion) return false;
      
      // Debe ser del año actual (verificar desde fecha_hora_ingreso o created_at)
      const fechaOrden = o.fecha_hora_ingreso ? new Date(o.fecha_hora_ingreso) : 
                        o.created_at ? new Date(o.created_at) : null;
      if (!fechaOrden || fechaOrden.getFullYear() !== añoActual) return false;
      
      // Verificar que la boleta tenga el formato correcto
      const parsed = parseNumeroBoleta(o.boleta);
      if (!parsed) return false;
      
      // Verificar que coincida el tipo y producto
      if (parsed.tipoCode !== tipoCode || parsed.productoBoleta !== productoCode) return false;
      
      // Ignorar boletas que contengan "1212" (números incorrectos del código anterior)
      if (o.boleta.includes('1212')) return false;
      
      return true;
    });
  } catch (error) {
    console.error('Error al obtener órdenes para calcular consecutivo:', error);
  }
  
  // Buscar todos los embarques del año actual
  let embarquesDelAño: any[] = [];
  try {
    const embarquesResult = await getEmbarques();
    // Manejar tanto el formato antiguo (array) como el nuevo ({ data, count })
    const embarques = Array.isArray(embarquesResult) ? embarquesResult : (embarquesResult.data || []);
    embarquesDelAño = embarques.filter(e => {
      // Debe tener boleta
      if (!e.boleta) return false;
      
      // Debe tener el mismo producto
      if (e.producto_id !== productoId) return false;
      
      // Debe tener el mismo tipo de embarque
      const embarqueTipoOperacion = e.tipo_embarque === 'Nacional' ? 'Embarque Nacional' :
                                    e.tipo_embarque === 'Exportación' ? 'Exportación' : null;
      if (embarqueTipoOperacion !== tipoOperacion) return false;
      
      // Debe ser del año actual
      const fechaEmbarque = e.fecha ? new Date(e.fecha) : 
                           e.created_at ? new Date(e.created_at) : null;
      if (!fechaEmbarque || fechaEmbarque.getFullYear() !== añoActual) return false;
      
      // Verificar que la boleta tenga el formato correcto
      const parsed = parseNumeroBoleta(e.boleta);
      if (!parsed) return false;
      
      // Verificar que coincida el tipo y producto
      if (parsed.tipoCode !== tipoCode || parsed.productoBoleta !== productoCode) return false;
      
      // Ignorar boletas que contengan "1212"
      if (e.boleta.includes('1212')) return false;
      
      return true;
    });
  } catch (error) {
    console.error('Error al obtener embarques para calcular consecutivo:', error);
  }
  
  // Buscar todas las recepciones del año actual (solo para Entradas)
  let recepcionesDelAño: any[] = [];
  if (tipoOperacion === 'Entradas') {
    try {
      const recepcionesResult = await getRecepciones();
      // Manejar tanto el formato antiguo (array) como el nuevo ({ data, count })
      const recepciones = Array.isArray(recepcionesResult) ? recepcionesResult : (recepcionesResult.data || []);
      recepcionesDelAño = recepciones.filter(r => {
        // Debe tener boleta (no temporal)
        if (!r.boleta || r.boleta.startsWith('TEMP-')) return false;
        
        // Debe tener el mismo producto
        if (r.producto_id !== productoId) return false;
        
        // Debe ser del año actual
        const fechaRecepcion = r.fecha ? new Date(r.fecha) : 
                              r.created_at ? new Date(r.created_at) : null;
        if (!fechaRecepcion || fechaRecepcion.getFullYear() !== añoActual) return false;
        
        // Verificar que la boleta tenga el formato correcto
        const parsed = parseNumeroBoleta(r.boleta);
        if (!parsed) return false;
        
        // Verificar que coincida el tipo y producto
        if (parsed.tipoCode !== tipoCode || parsed.productoBoleta !== productoCode) return false;
        
        // Ignorar boletas que contengan "1212"
        if (r.boleta.includes('1212')) return false;
        
        return true;
      });
    } catch (error) {
      console.error('Error al obtener recepciones para calcular consecutivo:', error);
    }
  }
  
  // Extraer todos los consecutivos de órdenes, embarques Y recepciones
  const consecutivos: number[] = [];
  
  ordenesDelAño.forEach(o => {
    const parsed = parseNumeroBoleta(o.boleta);
    if (parsed) {
      consecutivos.push(parsed.consecutivo);
    }
  });
  
  embarquesDelAño.forEach(e => {
    const parsed = parseNumeroBoleta(e.boleta);
    if (parsed) {
      consecutivos.push(parsed.consecutivo);
    }
  });
  
  recepcionesDelAño.forEach(r => {
    const parsed = parseNumeroBoleta(r.boleta);
    if (parsed) {
      consecutivos.push(parsed.consecutivo);
    }
  });
  
  // Si no hay consecutivos, empezar en 1
  if (consecutivos.length === 0) {
    return 1;
  }
  
  // Encontrar el consecutivo más alto y retornar el siguiente
  const maxConsecutivo = Math.max(...consecutivos);
  return maxConsecutivo + 1;
}

