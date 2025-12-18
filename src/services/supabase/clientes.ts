import { supabase } from '@/lib/supabase';
import { registrarAuditoria } from './auditoria';

export interface Cliente {
  id: number;
  empresa: string;
  rfc: string;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  tipo_cliente: string;
  created_at?: string;
  updated_at?: string;
  productos?: number[]; // IDs de productos
}

// Obtener todos los clientes (con paginación opcional)
export async function getClientes(filters?: {
  limit?: number;
  offset?: number;
}) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  let query = supabase
    .from('clientes')
    .select('*', { count: 'exact' })
    .eq('activo', true)
    .order('empresa');
  
  // Aplicar paginación si se proporciona
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset !== undefined && filters?.limit) {
    query = query.range(filters.offset, filters.offset + filters.limit - 1);
  }
  
  const { data: clientes, error: clientesError, count } = await query;
  
  if (clientesError) throw clientesError;
  
  // Obtener productos de cada cliente
  const clientesConProductos = await Promise.all(
    (clientes || []).map(async (cliente) => {
      const { data: productos } = await supabase
        .from('clientes_productos')
        .select('producto_id')
        .eq('cliente_id', cliente.id);
      
      return {
        ...cliente,
        productos: productos?.map(p => p.producto_id) || []
      };
    })
  );
  
  // Si no hay paginación, devolver directamente el array (compatibilidad hacia atrás)
  if (filters?.limit === undefined && filters?.offset === undefined) {
    return clientesConProductos;
  }
  
  // Si hay paginación, devolver objeto con data y count
  return { data: clientesConProductos, count: count || 0 };
}

// Obtener un cliente con sus productos
export async function getCliente(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { data: cliente, error: clienteError } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (clienteError) throw clienteError;
  
  const { data: productos } = await supabase
    .from('clientes_productos')
    .select('producto_id')
    .eq('cliente_id', id);
  
  return {
    ...cliente,
    productos: productos?.map(p => p.producto_id) || []
  };
}

// Crear cliente
export async function createCliente(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at' | 'productos'>, productosIds?: number[]) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  const { productos, ...clienteData } = cliente;
  
  const { data: clienteCreado, error: clienteError } = await supabase
    .from('clientes')
    .insert(clienteData)
    .select()
    .single();
  
  if (clienteError) throw clienteError;
  
  // Asignar productos si se proporcionaron
  if (productosIds && productosIds.length > 0) {
    const { error: productosError } = await supabase
      .from('clientes_productos')
      .insert(
        productosIds.map(productoId => ({
          cliente_id: clienteCreado.id,
          producto_id: productoId
        }))
      );
    
    if (productosError) throw productosError;
  }
  
  // Registrar en auditoría
  await registrarAuditoria({
    tabla: 'clientes',
    registro_id: clienteCreado.id,
    accion: 'INSERT',
    datos_nuevos: clienteCreado,
  });
  
  return clienteCreado;
}

// Actualizar cliente
export async function updateCliente(id: number, cliente: Partial<Cliente>, productosIds?: number[]) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  // Obtener datos anteriores para auditoría
  const { data: clienteAnterior } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();
  
  const { productos, ...clienteData } = cliente;
  
  const { data: clienteActualizado, error: clienteError } = await supabase
    .from('clientes')
    .update({ ...clienteData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (clienteError) throw clienteError;
  
  // Registrar en auditoría
  await registrarAuditoria({
    tabla: 'clientes',
    registro_id: id,
    accion: 'UPDATE',
    datos_anteriores: clienteAnterior || null,
    datos_nuevos: clienteActualizado,
  });
  
  // Actualizar productos si se proporcionaron
  if (productosIds !== undefined) {
    // Eliminar productos existentes
    await supabase
      .from('clientes_productos')
      .delete()
      .eq('cliente_id', id);
    
    // Insertar nuevos productos
    if (productosIds.length > 0) {
      const { error: productosError } = await supabase
        .from('clientes_productos')
        .insert(
          productosIds.map(productoId => ({
            cliente_id: id,
            producto_id: productoId
          }))
        );
      
      if (productosError) throw productosError;
    }
  }
  
  return clienteActualizado;
}

// Eliminar cliente (soft delete)
export async function deleteCliente(id: number) {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  // Obtener datos anteriores para auditoría
  const { data: clienteAnterior } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();
  
  const { error } = await supabase
    .from('clientes')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
  
  // Registrar en auditoría
  await registrarAuditoria({
    tabla: 'clientes',
    registro_id: id,
    accion: 'DELETE',
    datos_anteriores: clienteAnterior || null,
  });
}


