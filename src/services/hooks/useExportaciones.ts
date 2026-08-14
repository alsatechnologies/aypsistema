import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getClientesExportacion,
  getUnidadesExportacion,
  getOrdenesExportacion,
  getCargasExportacion,
  createClienteExportacion,
  updateClienteExportacion,
  createUnidadExportacion,
  updateUnidadExportacion,
  createOrdenExportacion,
  updateOrdenExportacion,
  createCargaExportacion,
  updateCargaExportacion,
  deleteCargaExportacion,
  type ClienteExportacion,
  type UnidadExportacion,
  type OrdenExportacion,
  type CargaExportacion,
} from '../supabase/exportaciones';

export function useExportaciones() {
  const [clientes, setClientes] = useState<ClienteExportacion[]>([]);
  const [unidades, setUnidades] = useState<UnidadExportacion[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenExportacion[]>([]);
  const [cargas, setCargas] = useState<CargaExportacion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, u, o, ca] = await Promise.all([
        getClientesExportacion(),
        getUnidadesExportacion(),
        getOrdenesExportacion(),
        getCargasExportacion(),
      ]);
      setClientes(c);
      setUnidades(u);
      setOrdenes(o);
      setCargas(ca);
    } catch (err) {
      toast.error('Error al cargar datos de exportaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─── Clientes ────────────────────────────────────────────────────────────────

  const addCliente = async (cliente: Omit<ClienteExportacion, 'id' | 'created_at'>) => {
    const nuevo = await createClienteExportacion(cliente);
    setClientes(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    toast.success('Cliente agregado');
    return nuevo;
  };

  const editCliente = async (id: number, updates: Partial<ClienteExportacion>) => {
    const actualizado = await updateClienteExportacion(id, updates);
    setClientes(prev => prev.map(c => c.id === id ? actualizado : c));
    toast.success('Cliente actualizado');
    return actualizado;
  };

  // ─── Unidades ────────────────────────────────────────────────────────────────

  const addUnidad = async (unidad: Omit<UnidadExportacion, 'id' | 'created_at' | 'updated_at'>) => {
    const nueva = await createUnidadExportacion(unidad);
    setUnidades(prev => [...prev, nueva]);
    toast.success('Unidad agregada');
    return nueva;
  };

  const editUnidad = async (id: number, updates: Partial<UnidadExportacion>) => {
    const actualizada = await updateUnidadExportacion(id, updates);
    setUnidades(prev => prev.map(u => u.id === id ? actualizada : u));
    toast.success('Unidad actualizada');
    return actualizada;
  };

  // ─── Órdenes ─────────────────────────────────────────────────────────────────

  const addOrden = async (orden: Omit<OrdenExportacion, 'id' | 'created_at' | 'updated_at' | 'cliente' | 'cargas'>) => {
    const nueva = await createOrdenExportacion(orden);
    await loadAll();
    toast.success('Orden creada');
    return nueva;
  };

  const editOrden = async (id: number, updates: Partial<OrdenExportacion>) => {
    const actualizada = await updateOrdenExportacion(id, updates);
    await loadAll();
    toast.success('Orden actualizada');
    return actualizada;
  };

  // ─── Cargas ──────────────────────────────────────────────────────────────────

  const addCarga = async (carga: Omit<CargaExportacion, 'id' | 'created_at' | 'updated_at' | 'unidad' | 'orden'>) => {
    const nueva = await createCargaExportacion(carga);
    await loadAll();
    toast.success('Carga registrada');
    return nueva;
  };

  const editCarga = async (id: number, updates: Partial<CargaExportacion>) => {
    const actualizada = await updateCargaExportacion(id, updates);
    setCargas(prev => prev.map(c => c.id === id ? { ...c, ...actualizada } : c));
    setOrdenes(prev => prev.map(o => ({
      ...o,
      cargas: o.cargas?.map(c => c.id === id ? { ...c, ...actualizada } : c)
    })));
    toast.success('Carga actualizada');
    return actualizada;
  };

  const removeCarga = async (id: number) => {
    await deleteCargaExportacion(id);
    setCargas(prev => prev.filter(c => c.id !== id));
    setOrdenes(prev => prev.map(o => ({
      ...o,
      cargas: o.cargas?.filter(c => c.id !== id)
    })));
    toast.success('Carga eliminada');
  };

  return {
    clientes,
    unidades,
    ordenes,
    cargas,
    loading,
    loadAll,
    addCliente,
    editCliente,
    addUnidad,
    editUnidad,
    addOrden,
    editOrden,
    addCarga,
    editCarga,
    removeCarga,
  };
}
