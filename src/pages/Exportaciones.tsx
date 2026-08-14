import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Search, Truck, Package, ClipboardList, Edit2, Trash2,
  MapPin, Calendar, ArrowRight, CheckCircle2, Clock, AlertCircle,
  Wrench, Ship
} from 'lucide-react';
import { toast } from 'sonner';
import { useExportaciones } from '@/services/hooks/useExportaciones';
import type { CargaExportacion, OrdenExportacion, UnidadExportacion } from '@/services/supabase/exportaciones';

const PRODUCTOS_EXPORTACION = [
  'A. Cártamo Prensa',
  'A. Cártamo Orgánico',
  'A. Cártamo Planta',
  'Semilla de Cártamo',
  'Otro',
];

const UBICACIONES = [
  'APSA',
  'Mexicali, BC',
  'Culiacán, Sin',
  'Mazatlán, Sin',
  'Empalme, Son',
  'USA',
  'En tránsito',
  'Taller ANCAF',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function estatusBadge(estatus: string) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    enviado:      { label: 'Enviado',      variant: 'default' },
    orden:        { label: 'Orden',        variant: 'secondary' },
    pendiente:    { label: 'Pendiente',    variant: 'outline' },
    en_proceso:   { label: 'En proceso',   variant: 'secondary' },
    completada:   { label: 'Completada',   variant: 'default' },
    cancelada:    { label: 'Cancelada',    variant: 'destructive' },
  };
  const cfg = map[estatus] ?? { label: estatus, variant: 'outline' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function estatusUnidadBadge(estatus: string) {
  if (estatus === 'activo')       return <Badge variant="default">Activo</Badge>;
  if (estatus === 'en_reparacion') return <Badge variant="destructive">En taller</Badge>;
  if (estatus === 'en_transito')  return <Badge variant="secondary">En tránsito</Badge>;
  return <Badge variant="outline">{estatus}</Badge>;
}

function diasEnTaller(fechaEntrada?: string | null) {
  if (!fechaEntrada) return null;
  const diff = Math.floor((Date.now() - new Date(fechaEntrada).getTime()) / 86_400_000);
  return diff;
}

// ─── Formulario de Carga ──────────────────────────────────────────────────────

interface FormCargaProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<CargaExportacion>) => Promise<void>;
  initial?: CargaExportacion | null;
  ordenes: OrdenExportacion[];
  unidades: UnidadExportacion[];
}

const FormCarga: React.FC<FormCargaProps> = ({ open, onClose, onSave, initial, ordenes, unidades }) => {
  const [form, setForm] = useState<Partial<CargaExportacion>>({
    orden_id: initial?.orden_id ?? undefined,
    unidad_id: initial?.unidad_id ?? undefined,
    carga_anterior: initial?.carga_anterior ?? '',
    proxima_carga: initial?.proxima_carga ?? '',
    ubicacion_actual: initial?.ubicacion_actual ?? '',
    eta_apsa: initial?.eta_apsa ?? '',
    fecha_embarque: initial?.fecha_embarque ?? '',
    estatus: initial?.estatus ?? 'pendiente',
    notas: initial?.notas ?? '',
  });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setForm({
      orden_id: initial?.orden_id ?? undefined,
      unidad_id: initial?.unidad_id ?? undefined,
      carga_anterior: initial?.carga_anterior ?? '',
      proxima_carga: initial?.proxima_carga ?? '',
      ubicacion_actual: initial?.ubicacion_actual ?? '',
      eta_apsa: initial?.eta_apsa ?? '',
      fecha_embarque: initial?.fecha_embarque ?? '',
      estatus: initial?.estatus ?? 'pendiente',
      notas: initial?.notas ?? '',
    });
  }, [initial, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const unidadesDisponibles = unidades.filter(u =>
    u.estatus === 'activo' || u.id === initial?.unidad_id
  );

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar carga' : 'Nueva carga'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Orden</Label>
              <Select
                value={form.orden_id?.toString() ?? ''}
                onValueChange={v => setForm(f => ({ ...f, orden_id: v ? Number(v) : undefined }))}
              >
                <SelectTrigger><SelectValue placeholder="Sin orden" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin orden</SelectItem>
                  {ordenes.filter(o => o.estatus !== 'cancelada' && o.estatus !== 'completada').map(o => (
                    <SelectItem key={o.id} value={o.id.toString()}>
                      {o.cliente?.nombre} — {o.producto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Unidad</Label>
              <Select
                value={form.unidad_id?.toString() ?? ''}
                onValueChange={v => setForm(f => ({ ...f, unidad_id: v ? Number(v) : undefined }))}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {unidadesDisponibles.map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.identificador} ({u.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Carga anterior</Label>
              <Select
                value={form.carga_anterior ?? ''}
                onValueChange={v => setForm(f => ({ ...f, carga_anterior: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {PRODUCTOS_EXPORTACION.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Próxima carga</Label>
              <Select
                value={form.proxima_carga ?? ''}
                onValueChange={v => setForm(f => ({ ...f, proxima_carga: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {PRODUCTOS_EXPORTACION.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Ubicación actual</Label>
              <Select
                value={form.ubicacion_actual ?? ''}
                onValueChange={v => setForm(f => ({ ...f, ubicacion_actual: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {UBICACIONES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>ETA a APSA</Label>
              <Input
                type="date"
                value={form.eta_apsa ?? ''}
                onChange={e => setForm(f => ({ ...f, eta_apsa: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Fecha de embarque</Label>
              <Input
                type="date"
                value={form.fecha_embarque ?? ''}
                onChange={e => setForm(f => ({ ...f, fecha_embarque: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Estatus</Label>
              <Select
                value={form.estatus ?? 'pendiente'}
                onValueChange={v => setForm(f => ({ ...f, estatus: v as CargaExportacion['estatus'] }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="orden">Orden</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea
              value={form.notas ?? ''}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              rows={2}
              placeholder="Observaciones opcionales..."
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Formulario de Orden ──────────────────────────────────────────────────────

interface FormOrdenProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<OrdenExportacion>) => Promise<void>;
  initial?: OrdenExportacion | null;
  clientes: Array<{ id: number; nombre: string; tipo_unidad: string }>;
}

const FormOrden: React.FC<FormOrdenProps> = ({ open, onClose, onSave, initial, clientes }) => {
  const [form, setForm] = useState<Partial<OrdenExportacion>>({
    cliente_id: initial?.cliente_id,
    producto: initial?.producto ?? '',
    fecha_pedido: initial?.fecha_pedido ?? '',
    fecha_embarque: initial?.fecha_embarque ?? '',
    unidades_solicitadas: initial?.unidades_solicitadas ?? 1,
    tipo_unidad: initial?.tipo_unidad ?? 'jumbo',
    notas: initial?.notas ?? '',
    estatus: initial?.estatus ?? 'pendiente',
  });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setForm({
      cliente_id: initial?.cliente_id,
      producto: initial?.producto ?? '',
      fecha_pedido: initial?.fecha_pedido ?? '',
      fecha_embarque: initial?.fecha_embarque ?? '',
      unidades_solicitadas: initial?.unidades_solicitadas ?? 1,
      tipo_unidad: initial?.tipo_unidad ?? 'jumbo',
      notas: initial?.notas ?? '',
      estatus: initial?.estatus ?? 'pendiente',
    });
  }, [initial, open]);

  const handleSave = async () => {
    if (!form.cliente_id || !form.producto || !form.fecha_pedido) {
      toast.error('Cliente, producto y fecha de pedido son obligatorios');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar orden' : 'Nueva orden de exportación'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1">
            <Label>Cliente *</Label>
            <Select
              value={form.cliente_id?.toString() ?? ''}
              onValueChange={v => setForm(f => ({ ...f, cliente_id: Number(v) }))}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
              <SelectContent>
                {clientes.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Producto *</Label>
            <Select
              value={form.producto ?? ''}
              onValueChange={v => setForm(f => ({ ...f, producto: v }))}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
              <SelectContent>
                {PRODUCTOS_EXPORTACION.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Fecha de pedido *</Label>
              <Input
                type="date"
                value={form.fecha_pedido ?? ''}
                onChange={e => setForm(f => ({ ...f, fecha_pedido: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Fecha de embarque</Label>
              <Input
                type="date"
                value={form.fecha_embarque ?? ''}
                onChange={e => setForm(f => ({ ...f, fecha_embarque: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Unidades solicitadas</Label>
              <Input
                type="number"
                min={1}
                value={form.unidades_solicitadas ?? 1}
                onChange={e => setForm(f => ({ ...f, unidades_solicitadas: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo de unidad</Label>
              <Select
                value={form.tipo_unidad ?? 'jumbo'}
                onValueChange={v => setForm(f => ({ ...f, tipo_unidad: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="jumbo">Jumbo</SelectItem>
                  <SelectItem value="contenedor">Contenedor</SelectItem>
                  <SelectItem value="tolva">Tolva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {initial && (
            <div className="space-y-1">
              <Label>Estatus</Label>
              <Select
                value={form.estatus ?? 'pendiente'}
                onValueChange={v => setForm(f => ({ ...f, estatus: v as OrdenExportacion['estatus'] }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_proceso">En proceso</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea
              value={form.notas ?? ''}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              rows={2}
              placeholder="Observaciones opcionales..."
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Formulario de Unidad ─────────────────────────────────────────────────────

interface FormUnidadProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<UnidadExportacion>) => Promise<void>;
  initial?: UnidadExportacion | null;
}

const FormUnidad: React.FC<FormUnidadProps> = ({ open, onClose, onSave, initial }) => {
  const [form, setForm] = useState<Partial<UnidadExportacion>>({
    identificador: initial?.identificador ?? '',
    tipo: initial?.tipo ?? 'jumbo',
    estatus: initial?.estatus ?? 'activo',
    ubicacion_actual: initial?.ubicacion_actual ?? '',
    fecha_entrada_taller: initial?.fecha_entrada_taller ?? '',
    notas: initial?.notas ?? '',
  });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setForm({
      identificador: initial?.identificador ?? '',
      tipo: initial?.tipo ?? 'jumbo',
      estatus: initial?.estatus ?? 'activo',
      ubicacion_actual: initial?.ubicacion_actual ?? '',
      fecha_entrada_taller: initial?.fecha_entrada_taller ?? '',
      notas: initial?.notas ?? '',
    });
  }, [initial, open]);

  const handleSave = async () => {
    if (!form.identificador) { toast.error('El identificador es obligatorio'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar unidad' : 'Nueva unidad'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Identificador *</Label>
              <Input
                value={form.identificador ?? ''}
                onChange={e => setForm(f => ({ ...f, identificador: e.target.value.toUpperCase() }))}
                placeholder="GAMX-6295"
                disabled={!!initial}
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select
                value={form.tipo ?? 'jumbo'}
                onValueChange={v => setForm(f => ({ ...f, tipo: v as UnidadExportacion['tipo'] }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="jumbo">Jumbo</SelectItem>
                  <SelectItem value="tolva">Tolva</SelectItem>
                  <SelectItem value="contenedor">Contenedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Estatus</Label>
              <Select
                value={form.estatus ?? 'activo'}
                onValueChange={v => setForm(f => ({ ...f, estatus: v as UnidadExportacion['estatus'] }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="en_reparacion">En taller</SelectItem>
                  <SelectItem value="en_transito">En tránsito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Ubicación actual</Label>
              <Select
                value={form.ubicacion_actual ?? ''}
                onValueChange={v => setForm(f => ({ ...f, ubicacion_actual: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {UBICACIONES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.estatus === 'en_reparacion' && (
            <div className="space-y-1">
              <Label>Fecha de entrada a taller</Label>
              <Input
                type="date"
                value={form.fecha_entrada_taller ?? ''}
                onChange={e => setForm(f => ({ ...f, fecha_entrada_taller: e.target.value }))}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea
              value={form.notas ?? ''}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              rows={2}
              placeholder="Observaciones..."
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────

const Exportaciones = () => {
  const { clientes, unidades, ordenes, cargas, loading, addOrden, editOrden, addCarga, editCarga, removeCarga, addUnidad, editUnidad } = useExportaciones();

  const [search, setSearch] = useState('');
  const [tabFlota, setTabFlota] = useState('todas');

  const [formCargaOpen, setFormCargaOpen]   = useState(false);
  const [formOrdenOpen, setFormOrdenOpen]   = useState(false);
  const [formUnidadOpen, setFormUnidadOpen] = useState(false);
  const [editingCarga, setEditingCarga]     = useState<CargaExportacion | null>(null);
  const [editingOrden, setEditingOrden]     = useState<OrdenExportacion | null>(null);
  const [editingUnidad, setEditingUnidad]   = useState<UnidadExportacion | null>(null);
  const [confirmDelete, setConfirmDelete]   = useState<CargaExportacion | null>(null);

  // Resumen flota
  const enviados   = cargas.filter(c => c.estatus === 'enviado').length;
  const enApsa     = unidades.filter(u => u.ubicacion_actual === 'APSA' && u.estatus === 'activo').length;
  const enTaller   = unidades.filter(u => u.estatus === 'en_reparacion').length;
  const enTransito = cargas.filter(c => c.estatus !== 'enviado' && c.ubicacion_actual && c.ubicacion_actual !== 'APSA').length;

  // Filtros
  const cargasFiltradas = cargas.filter(c => {
    const q = search.toLowerCase();
    return (
      c.unidad?.identificador?.toLowerCase().includes(q) ||
      c.proxima_carga?.toLowerCase().includes(q) ||
      c.orden?.cliente?.nombre?.toLowerCase().includes(q) ||
      c.ubicacion_actual?.toLowerCase().includes(q)
    );
  });

  const ordenesFiltradas = ordenes.filter(o => {
    const q = search.toLowerCase();
    return (
      o.cliente?.nombre?.toLowerCase().includes(q) ||
      o.producto?.toLowerCase().includes(q)
    );
  });

  const unidadesFiltradas = unidades.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.identificador.toLowerCase().includes(q) || u.tipo.toLowerCase().includes(q);
    if (tabFlota === 'todas') return matchSearch;
    if (tabFlota === 'jumbo') return matchSearch && u.tipo === 'jumbo';
    if (tabFlota === 'tolva') return matchSearch && u.tipo === 'tolva';
    if (tabFlota === 'contenedor') return matchSearch && u.tipo === 'contenedor';
    if (tabFlota === 'taller') return matchSearch && u.estatus === 'en_reparacion';
    return matchSearch;
  });

  const handleSaveCarga = async (data: Partial<CargaExportacion>) => {
    if (editingCarga) {
      await editCarga(editingCarga.id, data);
    } else {
      await addCarga(data as any);
    }
    setEditingCarga(null);
  };

  const handleSaveOrden = async (data: Partial<OrdenExportacion>) => {
    if (editingOrden) {
      await editOrden(editingOrden.id, data);
    } else {
      await addOrden(data as any);
    }
    setEditingOrden(null);
  };

  const handleSaveUnidad = async (data: Partial<UnidadExportacion>) => {
    if (editingUnidad) {
      await editUnidad(editingUnidad.id, data);
    } else {
      await addUnidad(data as any);
    }
    setEditingUnidad(null);
  };

  return (
    <Layout>
      <Header title="Exportaciones" description="Control de órdenes, cargas y flota de exportación" />

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enviados</p>
                <p className="text-2xl font-bold">{enviados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En APSA</p>
                <p className="text-2xl font-bold">{enApsa}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Truck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En tránsito</p>
                <p className="text-2xl font-bold">{enTransito}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <Wrench className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En taller</p>
                <p className="text-2xl font-bold">{enTaller}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buscador global */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por unidad, cliente, producto o ubicación..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="cargas">
        <TabsList className="mb-4">
          <TabsTrigger value="cargas">
            <Ship className="h-4 w-4 mr-2" />
            Cargas
          </TabsTrigger>
          <TabsTrigger value="ordenes">
            <ClipboardList className="h-4 w-4 mr-2" />
            Órdenes
          </TabsTrigger>
          <TabsTrigger value="flota">
            <Truck className="h-4 w-4 mr-2" />
            Flota
          </TabsTrigger>
        </TabsList>

        {/* ── TAB CARGAS ─────────────────────────────────────────────────────── */}
        <TabsContent value="cargas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Próximas cargas</CardTitle>
                <CardDescription>Asignación de unidades a órdenes de exportación</CardDescription>
              </div>
              <Button onClick={() => { setEditingCarga(null); setFormCargaOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Nueva carga
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Cargando...</p>
              ) : cargasFiltradas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay cargas registradas</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>ETA APSA</TableHead>
                      <TableHead>Carga anterior</TableHead>
                      <TableHead>Próxima carga</TableHead>
                      <TableHead>Fecha embarque</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Estatus</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargasFiltradas.map(carga => (
                      <TableRow key={carga.id}>
                        <TableCell className="font-mono font-medium">
                          {carga.unidad?.identificador ?? '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {carga.ubicacion_actual ?? '—'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{carga.eta_apsa ?? '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{carga.carga_anterior ?? '—'}</TableCell>
                        <TableCell className="text-sm font-medium">{carga.proxima_carga ?? '—'}</TableCell>
                        <TableCell className="text-sm">
                          {carga.fecha_embarque ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {carga.fecha_embarque}
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-sm">{carga.orden?.cliente?.nombre ?? '—'}</TableCell>
                        <TableCell>{estatusBadge(carga.estatus)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingCarga(carga); setFormCargaOpen(true); }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmDelete(carga)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB ÓRDENES ────────────────────────────────────────────────────── */}
        <TabsContent value="ordenes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Órdenes de exportación</CardTitle>
                <CardDescription>Pedidos por cliente</CardDescription>
              </div>
              <Button onClick={() => { setEditingOrden(null); setFormOrdenOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Nueva orden
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Cargando...</p>
              ) : ordenesFiltradas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay órdenes registradas</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Fecha pedido</TableHead>
                      <TableHead>Fecha embarque</TableHead>
                      <TableHead>Unidades</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cargas asignadas</TableHead>
                      <TableHead>Estatus</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordenesFiltradas.map(orden => {
                      const cargasOrden = orden.cargas ?? [];
                      const enviadas = cargasOrden.filter(c => c.estatus === 'enviado').length;
                      return (
                        <TableRow key={orden.id}>
                          <TableCell className="font-medium">{orden.cliente?.nombre ?? '—'}</TableCell>
                          <TableCell>{orden.producto}</TableCell>
                          <TableCell className="text-sm">{orden.fecha_pedido}</TableCell>
                          <TableCell className="text-sm">{orden.fecha_embarque ?? '—'}</TableCell>
                          <TableCell className="text-center">{orden.unidades_solicitadas}</TableCell>
                          <TableCell className="capitalize text-sm">{orden.tipo_unidad}</TableCell>
                          <TableCell>
                            <span className="text-sm">
                              <span className="font-medium text-green-600">{enviadas}</span>
                              <span className="text-muted-foreground"> / {cargasOrden.length} asignadas</span>
                            </span>
                          </TableCell>
                          <TableCell>{estatusBadge(orden.estatus)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingOrden(orden); setFormOrdenOpen(true); }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB FLOTA ──────────────────────────────────────────────────────── */}
        <TabsContent value="flota">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Flota de unidades</CardTitle>
                <CardDescription>Jumbos, tolvas y contenedores</CardDescription>
              </div>
              <Button onClick={() => { setEditingUnidad(null); setFormUnidadOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Nueva unidad
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs value={tabFlota} onValueChange={setTabFlota} className="mb-4">
                <TabsList>
                  <TabsTrigger value="todas">Todas</TabsTrigger>
                  <TabsTrigger value="jumbo">Jumbos</TabsTrigger>
                  <TabsTrigger value="tolva">Tolvas</TabsTrigger>
                  <TabsTrigger value="contenedor">Contenedores</TabsTrigger>
                  <TabsTrigger value="taller">
                    <Wrench className="h-3 w-3 mr-1" />
                    En taller
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Cargando...</p>
              ) : unidadesFiltradas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay unidades</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Identificador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Estatus</TableHead>
                      <TableHead>Días en taller</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unidadesFiltradas.map(u => {
                      const dias = diasEnTaller(u.fecha_entrada_taller);
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-mono font-medium">{u.identificador}</TableCell>
                          <TableCell className="capitalize text-sm">{u.tipo}</TableCell>
                          <TableCell className="text-sm">{u.ubicacion_actual ?? '—'}</TableCell>
                          <TableCell>{estatusUnidadBadge(u.estatus)}</TableCell>
                          <TableCell>
                            {dias !== null ? (
                              <span className={`text-sm font-medium ${dias > 90 ? 'text-destructive' : dias > 30 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                {dias} días
                              </span>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                            {u.notas ?? '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingUnidad(u); setFormUnidadOpen(true); }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <FormCarga
        open={formCargaOpen}
        onClose={() => { setFormCargaOpen(false); setEditingCarga(null); }}
        onSave={handleSaveCarga}
        initial={editingCarga}
        ordenes={ordenes}
        unidades={unidades}
      />
      <FormOrden
        open={formOrdenOpen}
        onClose={() => { setFormOrdenOpen(false); setEditingOrden(null); }}
        onSave={handleSaveOrden}
        initial={editingOrden}
        clientes={clientes}
      />
      <FormUnidad
        open={formUnidadOpen}
        onClose={() => { setFormUnidadOpen(false); setEditingUnidad(null); }}
        onSave={handleSaveUnidad}
        initial={editingUnidad}
      />

      {/* Confirmar eliminación */}
      <Dialog open={!!confirmDelete} onOpenChange={v => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar carga</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de eliminar la carga de <strong>{confirmDelete?.unidad?.identificador ?? '—'}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirmDelete) {
                  await removeCarga(confirmDelete.id);
                  setConfirmDelete(null);
                }
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Exportaciones;
