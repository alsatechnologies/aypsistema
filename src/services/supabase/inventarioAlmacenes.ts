import { supabase } from '@/lib/supabase';
import { registrarAuditoria } from './auditoria';

export interface InventarioAlmacen {
  id: number;
  almacen_id: number;
  producto_id: number;
  cantidad: number;
  created_at?: string;
  updated_at?: string;
  producto?: { id: number; nombre: string };
}

// Obtener inventario de un almacén específico
export async function getInventarioByAlmacen(almacenId: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('inventario_almacenes')
    .select(`
      *,
      producto:productos(id, nombre)
    `)
    .eq('almacen_id', almacenId)
    .order('producto_id');
  
  if (error) throw error;
  return data || [];
}

// Obtener inventario de todos los almacenes (agrupado por producto)
export async function getInventarioByProducto(productoId?: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  let query = supabase
    .from('inventario_almacenes')
    .select(`
      *,
      producto:productos(id, nombre),
      almacen:almacenes(id, nombre)
    `);
  
  if (productoId) {
    query = query.eq('producto_id', productoId);
  }
  
  const { data, error } = await query.order('producto_id');
  
  if (error) throw error;
  return data || [];
}

// Obtener total de inventario por producto (suma de todas las cantidades)
export async function getTotalInventarioPorProducto() {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data, error } = await supabase
    .from('inventario_almacenes')
    .select(`
      producto_id,
      cantidad,
      producto:productos(id, nombre),
      almacen:almacenes(id, nombre, unidad)
    `);
  
  if (error) throw error;
  
  // Agrupar por producto y sumar cantidades
  const agrupado = (data || []).reduce((acc: any, item: any) => {
    const productoId = item.producto_id;
    if (!acc[productoId]) {
      acc[productoId] = {
        producto_id: productoId,
        producto: item.producto,
        total: 0,
        unidad: item.almacen?.unidad || '' // Tomar la unidad del almacén
      };
    }
    acc[productoId].total += Number(item.cantidad) || 0;
    return acc;
  }, {});
  
  return Object.values(agrupado);
}

// Crear o actualizar inventario
export async function upsertInventarioAlmacen(
  almacenId: number,
  productoId: number,
  cantidad: number
) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  // Obtener nombres de producto y almacén para el registro de auditoría
  const { data: producto } = await supabase
    .from('productos')
    .select('nombre')
    .eq('id', productoId)
    .single();
  
  const { data: almacen } = await supabase
    .from('almacenes')
    .select('nombre')
    .eq('id', almacenId)
    .single();
  
  const nombreProducto = producto?.nombre || `Producto #${productoId}`;
  const nombreAlmacen = almacen?.nombre || `Almacén #${almacenId}`;
  
  // Verificar si ya existe
  const { data: existente } = await supabase
    .from('inventario_almacenes')
    .select('*')
    .eq('almacen_id', almacenId)
    .eq('producto_id', productoId)
    .single();
  
  if (existente) {
    // Actualizar
    const { data, error } = await supabase
      .from('inventario_almacenes')
      .update({ 
        cantidad,
        updated_at: new Date().toISOString()
      })
      .eq('id', existente.id)
      .select()
      .single();
    
    if (error) throw error;
    await registrarAuditoria({ 
      tabla: 'inventario_almacenes', 
      registro_id: existente.id, 
      accion: 'UPDATE', 
      datos_anteriores: { ...existente, _producto: nombreProducto, _almacen: nombreAlmacen }, 
      datos_nuevos: { ...data, _producto: nombreProducto, _almacen: nombreAlmacen }
    });
    return data;
  } else {
    // Crear
    const { data, error } = await supabase
      .from('inventario_almacenes')
      .insert({
        almacen_id: almacenId,
        producto_id: productoId,
        cantidad
      })
      .select()
      .single();
    
    if (error) throw error;
    await registrarAuditoria({ 
      tabla: 'inventario_almacenes', 
      registro_id: data.id, 
      accion: 'INSERT', 
      datos_nuevos: { ...data, _producto: nombreProducto, _almacen: nombreAlmacen }
    });
    return data;
  }
}

// Eliminar inventario
export async function deleteInventarioAlmacen(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data: oldData } = await supabase
    .from('inventario_almacenes')
    .select('*')
    .eq('id', id)
    .single();
  
  const { error } = await supabase
    .from('inventario_almacenes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  await registrarAuditoria({ 
    tabla: 'inventario_almacenes', 
    registro_id: id, 
    accion: 'DELETE', 
    datos_anteriores: oldData 
  });
}

// Actualizar capacidad_actual del almacén basado en la suma de productos
export async function actualizarCapacidadActualAlmacen(almacenId: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  // Obtener suma de todas las cantidades
  const { data, error } = await supabase
    .from('inventario_almacenes')
    .select('cantidad')
    .eq('almacen_id', almacenId);
  
  if (error) throw error;
  
  const suma = (data || []).reduce((total, item) => total + (Number(item.cantidad) || 0), 0);
  
  // Actualizar capacidad_actual del almacén
  const { error: updateError } = await supabase
    .from('almacenes')
    .update({ 
      capacidad_actual: suma,
      updated_at: new Date().toISOString()
    })
    .eq('id', almacenId);
  
  if (updateError) throw updateError;
  return suma;
}

