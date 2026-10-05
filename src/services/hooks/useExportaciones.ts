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

// ─── Datos de demostración (mientras no se aplique la migración 030) ──────────

const MOCK_CLIENTES: ClienteExportacion[] = [
  { id: 1, nombre: 'ADAMS',    tipo_unidad: 'jumbo',      activo: true },
  { id: 2, nombre: 'OILSEEDS', tipo_unidad: 'jumbo',      activo: true },
  { id: 3, nombre: 'AETH',     tipo_unidad: 'contenedor', activo: true },
  { id: 4, nombre: 'SAIKA',    tipo_unidad: 'contenedor', activo: true },
];

const MOCK_UNIDADES = [
  { id: 1,  identificador: 'GAMX-25042', tipo: 'jumbo', estatus: 'activo',        ubicacion_actual: 'APSA',          fecha_entrada_taller: null, notas: null, activo: true },
  { id: 2,  identificador: 'GAMX-6445',  tipo: 'jumbo', estatus: 'activo',        ubicacion_actual: 'APSA',          fecha_entrada_taller: null, notas: null, activo: true },
  { id: 3,  identificador: 'GAMX-6301',  tipo: 'jumbo', estatus: 'activo',        ubicacion_actual: 'APSA',          fecha_entrada_taller: null, notas: null, activo: true },
  { id: 4,  identificador: 'GAMX-6295',  tipo: 'jumbo', estatus: 'activo',        ubicacion_actual: 'APSA',          fecha_entrada_taller: null, notas: null, activo: true },
  { id: 5,  identificador: 'GAMX-6297',  tipo: 'jumbo', estatus: 'activo',        ubicacion_actual: 'APSA',          fecha_entrada_taller: null, notas: null, activo: true },
  { id: 6,  identificador: 'GAMX-25041', tipo: 'jumbo', estatus: 'activo',        ubicacion_actual: 'APSA',          fecha_entrada_taller: null, notas: null, activo: true },
  { id: 7,  identificador: 'GAMX-2683',  tipo: 'jumbo', estatus: 'activo',        ubicacion_actual: 'APSA',          fecha_entrada_taller: null, notas: null, activo: true },
  { id: 8,  identificador: 'GAMX-6453',  tipo: 'jumbo', estatus: 'activo',        ubicacion_actual: 'Culiacán, Sin', fecha_entrada_taller: null, notas: null, activo: true },
  { id: 9,  identificador: 'GAMX-6442',  tipo: 'jumbo', estatus: 'activo',        ubicacion_actual: 'Culiacán, Sin', fecha_entrada_taller: null, notas: null, activo: true },
  { id: 10, identificador: 'GAMX-25049', tipo: 'jumbo', estatus: 'activo',        ubicacion_actual: 'Mexicali, BC',  fecha_entrada_taller: null, notas: null, activo: true },
  { id: 11, identificador: 'GAMX-6447',  tipo: 'jumbo', estatus: 'activo',        ubicacion_actual: 'Mexicali, BC',  fecha_entrada_taller: null, notas: null, activo: true },
  { id: 12, identificador: 'GAMX-6299',  tipo: 'jumbo', estatus: 'activo',        ubicacion_actual: 'Mexicali, BC',  fecha_entrada_taller: null, notas: null, activo: true },
  { id: 13, identificador: 'GAMX-6289',  tipo: 'jumbo', estatus: 'activo',        ubicacion_actual: 'USA',           fecha_entrada_taller: null, notas: null, activo: true },
  { id: 14, identificador: 'GAMX-2680',  tipo: 'jumbo', estatus: 'en_reparacion', ubicacion_actual: 'Taller ANCAF',  fecha_entrada_taller: '2026-04-03', notas: 'Próximo a liberarse', activo: true },
  { id: 15, identificador: 'GAMX-6443',  tipo: 'jumbo', estatus: 'en_reparacion', ubicacion_actual: 'Taller ANCAF',  fecha_entrada_taller: '2026-05-04', notas: 'Próximo a liberarse', activo: true },
  { id: 16, identificador: 'GAMX-6458',  tipo: 'jumbo', estatus: 'en_reparacion', ubicacion_actual: 'Taller ANCAF',  fecha_entrada_taller: '2026-05-20', notas: null, activo: true },
  { id: 17, identificador: 'GAMX-6307',  tipo: 'jumbo', estatus: 'en_reparacion', ubicacion_actual: 'Taller ANCAF',  fecha_entrada_taller: '2026-07-18', notas: null, activo: true },
  { id: 18, identificador: 'ECNX-170366', tipo: 'tolva', estatus: 'activo',       ubicacion_actual: null,            fecha_entrada_taller: null, notas: null, activo: true },
  { id: 19, identificador: 'ECNX-170374', tipo: 'tolva', estatus: 'activo',       ubicacion_actual: null,            fecha_entrada_taller: null, notas: null, activo: true },
  { id: 20, identificador: 'ECNX-170388', tipo: 'tolva', estatus: 'activo',       ubicacion_actual: null,            fecha_entrada_taller: null, notas: null, activo: true },
  { id: 21, identificador: 'ECNX-170334', tipo: 'tolva', estatus: 'activo',       ubicacion_actual: null,            fecha_entrada_taller: null, notas: null, activo: true },
  { id: 22, identificador: 'GAMX-20360',  tipo: 'tolva', estatus: 'activo',       ubicacion_actual: null,            fecha_entrada_taller: null, notas: null, activo: true },
];

const MOCK_ORDENES = [
  {
    id: 1, cliente_id: 1, producto: 'A. Cártamo Orgánico', fecha_pedido: '2026-04-06',
    fecha_embarque: '2026-04-08', unidades_solicitadas: 6, tipo_unidad: 'jumbo',
    notas: null, estatus: 'en_proceso',
    cliente: MOCK_CLIENTES[0],
    cargas: [] as any[],
  },
  {
    id: 2, cliente_id: 2, producto: 'A. Cártamo Planta', fecha_pedido: '2026-04-20',
    fecha_embarque: '2026-04-20', unidades_solicitadas: 1, tipo_unidad: 'jumbo',
    notas: null, estatus: 'completada',
    cliente: MOCK_CLIENTES[1],
    cargas: [] as any[],
  },
  {
    id: 3, cliente_id: 3, producto: 'A. Cártamo Prensa', fecha_pedido: '2026-04-20',
    fecha_embarque: null, unidades_solicitadas: 1, tipo_unidad: 'contenedor',
    notas: '1 flexi', estatus: 'en_proceso',
    cliente: MOCK_CLIENTES[2],
    cargas: [] as any[],
  },
  {
    id: 4, cliente_id: 4, producto: 'A. Cártamo Prensa', fecha_pedido: '2026-04-28',
    fecha_embarque: null, unidades_solicitadas: 4, tipo_unidad: 'contenedor',
    notas: null, estatus: 'pendiente',
    cliente: MOCK_CLIENTES[3],
    cargas: [] as any[],
  },
];

const MOCK_CARGAS = [
  {
    id: 1, orden_id: 1, unidad_id: 1, carga_anterior: 'A. Cártamo Prensa',
    proxima_carga: 'A. Cártamo Orgánico', ubicacion_actual: 'APSA',
    eta_apsa: '2026-04-19', fecha_embarque: '2026-04-30', estatus: 'enviado', notas: null, peso_neto: null, ajuste_kg: null,
    unidad: MOCK_UNIDADES[0], orden: { ...MOCK_ORDENES[0] },
  },
  {
    id: 2, orden_id: 1, unidad_id: 2, carga_anterior: 'A. Cártamo Prensa',
    proxima_carga: 'A. Cártamo Orgánico', ubicacion_actual: 'APSA',
    eta_apsa: '2026-04-19', fecha_embarque: '2026-04-30', estatus: 'enviado', notas: null, peso_neto: null, ajuste_kg: null,
    unidad: MOCK_UNIDADES[1], orden: { ...MOCK_ORDENES[0] },
  },
  {
    id: 3, orden_id: 1, unidad_id: 3, carga_anterior: 'A. Cártamo Prensa',
    proxima_carga: 'A. Cártamo Orgánico', ubicacion_actual: 'APSA',
    eta_apsa: '2026-04-24', fecha_embarque: '2026-04-30', estatus: 'enviado', notas: null, peso_neto: null, ajuste_kg: null,
    unidad: MOCK_UNIDADES[2], orden: { ...MOCK_ORDENES[0] },
  },
  {
    id: 4, orden_id: 1, unidad_id: 4, carga_anterior: 'A. Cártamo Prensa',
    proxima_carga: 'A. Cártamo Prensa', ubicacion_actual: 'APSA',
    eta_apsa: '2026-04-06', fecha_embarque: '2026-04-08', estatus: 'enviado', notas: null, peso_neto: null, ajuste_kg: null,
    unidad: MOCK_UNIDADES[3], orden: { ...MOCK_ORDENES[0] },
  },
  {
    id: 5, orden_id: 1, unidad_id: 5, carga_anterior: 'A. Cártamo Orgánico',
    proxima_carga: 'A. Cártamo Prensa', ubicacion_actual: 'APSA',
    eta_apsa: '2026-04-06', fecha_embarque: '2026-04-08', estatus: 'enviado', notas: null, peso_neto: null, ajuste_kg: null,
    unidad: MOCK_UNIDADES[4], orden: { ...MOCK_ORDENES[0] },
  },
  {
    id: 6, orden_id: 1, unidad_id: 6, carga_anterior: 'A. Cártamo Orgánico',
    proxima_carga: 'A. Cártamo Prensa', ubicacion_actual: 'APSA',
    eta_apsa: '2026-04-06', fecha_embarque: '2026-04-08', estatus: 'enviado', notas: null, peso_neto: null, ajuste_kg: null,
    unidad: MOCK_UNIDADES[5], orden: { ...MOCK_ORDENES[0] },
  },
  {
    id: 7, orden_id: 2, unidad_id: 7, carga_anterior: 'A. Cártamo Prensa',
    proxima_carga: 'A. Cártamo Planta', ubicacion_actual: 'APSA',
    eta_apsa: '2026-04-16', fecha_embarque: '2026-04-20', estatus: 'enviado', notas: null, peso_neto: null, ajuste_kg: null,
    unidad: MOCK_UNIDADES[6], orden: { ...MOCK_ORDENES[1] },
  },
  {
    id: 8, orden_id: 3, unidad_id: null, carga_anterior: null,
    proxima_carga: 'A. Cártamo Prensa', ubicacion_actual: 'APSA',
    eta_apsa: '2026-04-20', fecha_embarque: '2026-04-20', estatus: 'enviado', notas: '1 flexi', peso_neto: null, ajuste_kg: null,
    unidad: null, orden: { ...MOCK_ORDENES[2] },
  },
  {
    id: 9, orden_id: 4, unidad_id: null, carga_anterior: null,
    proxima_carga: 'A. Cártamo Prensa', ubicacion_actual: null,
    eta_apsa: '2026-04-28', fecha_embarque: null, estatus: 'pendiente', notas: '4 contenedores', peso_neto: null, ajuste_kg: null,
    unidad: null, orden: { ...MOCK_ORDENES[3] },
  },
  {
    id: 10, orden_id: 1, unidad_id: 8, carga_anterior: 'A. Cártamo Planta',
    proxima_carga: 'A. Cártamo Orgánico', ubicacion_actual: 'Culiacán, Sin',
    eta_apsa: '2026-04-23', fecha_embarque: null, estatus: 'orden', notas: null, peso_neto: null, ajuste_kg: null,
    unidad: MOCK_UNIDADES[7], orden: { ...MOCK_ORDENES[0] },
  },
  {
    id: 11, orden_id: 1, unidad_id: 10, carga_anterior: 'A. Cártamo Planta',
    proxima_carga: 'A. Cártamo Orgánico', ubicacion_actual: 'Mexicali, BC',
    eta_apsa: '2026-04-26', fecha_embarque: null, estatus: 'orden', notas: null,
    unidad: MOCK_UNIDADES[9], orden: { ...MOCK_ORDENES[0] },
  },
  {
    id: 12, orden_id: 1, unidad_id: 13, carga_anterior: 'A. Cártamo Orgánico',
    proxima_carga: 'A. Cártamo Orgánico', ubicacion_actual: 'USA',
    eta_apsa: '2026-05-05', fecha_embarque: null, estatus: 'pendiente', notas: null,
    unidad: MOCK_UNIDADES[12], orden: { ...MOCK_ORDENES[0] },
  },
];

// ─────────────────────────────────────────────────────────────────────────────

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
      // Tablas aún no creadas — usar datos de demostración
      console.warn('Tablas de exportaciones no encontradas, usando datos demo:', err);
      setClientes(MOCK_CLIENTES);
      setUnidades(MOCK_UNIDADES as any);
      setOrdenes(MOCK_ORDENES as any);
      setCargas(MOCK_CARGAS as any);
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
