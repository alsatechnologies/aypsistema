import { supabase } from '@/lib/supabase';

export interface Producto {
  id: number;
  nombre: string;
  codigo_boleta: string;
  codigo_lote?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TipoAnalisis {
  id: string;
  nombre: string;
}

export interface ProductoAnalisis {
  id: number;
  producto_id: number;
  tipo_analisis_id: string;
  genera_descuento: boolean;
  tipo_analisis?: TipoAnalisis;
  rangos_descuento?: RangoDescuento[];
}

export interface RangoDescuento {
  id: number;
  producto_analisis_id: number;
  porcentaje: number;
  kg_descuento_ton: number;
  orden: number;
}

// Obtener todos los productos
export async function getProductos() {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre');
  
  if (error) throw error;
  return data;
}

// Obtener un producto con sus análisis
export async function getProductoConAnalisis(productoId: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data: producto, error: productoError } = await supabase
    .from('productos')
    .select('*')
    .eq('id', productoId)
    .single();
  
  if (productoError) throw productoError;
  
  // Obtener análisis del producto
  const { data: analisis, error: analisisError } = await supabase
    .from('productos_analisis')
    .select(`
      *,
      tipo_analisis:tipos_analisis(*),
      rangos_descuento:rangos_descuento(*)
    `)
    .eq('producto_id', productoId)
    .order('tipo_analisis_id');
  
  if (analisisError) {
    console.error('Error al obtener análisis:', analisisError);
    throw analisisError;
  }
  
  console.log('Análisis raw de Supabase:', analisis);
  
  // Obtener rangos de descuento por separado si es necesario
  const analisisConRangos = await Promise.all((analisis || []).map(async (a: any) => {
    const { data: rangos, error: rangosError } = await supabase
      .from('rangos_descuento')
      .select('*')
      .eq('producto_analisis_id', a.id)
      .order('orden');
    
    if (rangosError) {
      console.error('Error al obtener rangos:', rangosError);
    }
    
    return {
      id: a.tipo_analisis?.id || a.tipo_analisis_id,
      nombre: a.tipo_analisis?.nombre || '',
      generaDescuento: a.genera_descuento || false,
      productoAnalisisId: a.id,
      rangosDescuento: (rangos || []).sort((a: RangoDescuento, b: RangoDescuento) => a.orden - b.orden).map((r: any) => ({
        porcentaje: r.porcentaje,
        kgDescuentoTon: r.kg_descuento_ton
      }))
    };
  }));
  
  console.log('Análisis procesados:', analisisConRangos);
  
  return {
    ...producto,
    analisis: analisisConRangos
  };
}

// Crear producto
export async function createProducto(producto: Omit<Producto, 'id' | 'created_at' | 'updated_at'>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('productos')
    .insert(producto)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Actualizar producto
export async function updateProducto(id: number, producto: Partial<Producto>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('productos')
    .update({ ...producto, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Eliminar producto
export async function deleteProducto(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Agregar análisis a producto
export async function addAnalisisToProducto(productoId: number, tipoAnalisisId: string, generaDescuento: boolean) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('productos_analisis')
    .insert({
      producto_id: productoId,
      tipo_analisis_id: tipoAnalisisId,
      genera_descuento: generaDescuento
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Eliminar análisis de producto
export async function removeAnalisisFromProducto(productoId: number, tipoAnalisisId: string) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('productos_analisis')
    .delete()
    .eq('producto_id', productoId)
    .eq('tipo_analisis_id', tipoAnalisisId);
  
  if (error) throw error;
}

// Actualizar rangos de descuento
export async function updateRangosDescuento(productoAnalisisId: number, rangos: Array<{ porcentaje: number; kgDescuentoTon: number }>) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  // Eliminar rangos existentes
  await supabase
    .from('rangos_descuento')
    .delete()
    .eq('producto_analisis_id', productoAnalisisId);
  
  // Insertar nuevos rangos
  if (rangos.length > 0) {
    const { error } = await supabase
      .from('rangos_descuento')
      .insert(
        rangos.map((rango, index) => ({
          producto_analisis_id: productoAnalisisId,
          porcentaje: rango.porcentaje,
          kg_descuento_ton: rango.kgDescuentoTon,
          orden: index
        }))
      );
    
    if (error) throw error;
  }
}

// Actualizar estado de genera_descuento
export async function updateGeneraDescuento(productoAnalisisId: number, generaDescuento: boolean) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('productos_analisis')
    .update({ genera_descuento: generaDescuento })
    .eq('id', productoAnalisisId);
  
  if (error) throw error;
}

// Obtener todos los tipos de análisis
export async function getTiposAnalisis() {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('tipos_analisis')
    .select('*')
    .order('nombre');
  
  if (error) throw error;
  return data;
}

// Crear tipo de análisis
export async function createTipoAnalisis(id: string, nombre: string) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('tipos_analisis')
    .insert({ id, nombre })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Eliminar tipo de análisis
export async function deleteTipoAnalisis(id: string) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { error } = await supabase
    .from('tipos_analisis')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

