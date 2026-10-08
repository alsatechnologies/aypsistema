import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRightLeft, Lock, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAlmacenes } from '@/services/hooks/useAlmacenes';
import { toast } from 'sonner';
import { useProductos } from '@/services/hooks/useProductos';
import { createMovimiento, getMovimientos, updateMovimiento } from '@/services/supabase/movimientos';
import {
  getInventarioByProducto,
  recalcularInventarioDesdeBase,
  actualizarCapacidadActualAlmacen,
} from '@/services/supabase/inventarioAlmacenes';
import { useAuth } from '@/contexts/AuthContext';

// Almacén que tiene existencia del producto seleccionado
interface AlmacenConExistencia {
  id: number;
  nombre: string;
  cantidad: number;
}

const formatKg = (kg: number) => kg.toLocaleString('es-MX', { maximumFractionDigits: 0 });

// Acepta "62" (por ciento) o ".62" (fracción); devuelve el porcentaje 0–100, null si vacío, NaN si inválido
const parsePorcentaje = (texto: string): number | null => {
  const limpio = texto.replace('%', '').replace(',', '.').trim();
  if (limpio === '') return null;
  const n = Number(limpio);
  if (!isFinite(n) || n < 0) return NaN;
  const pct = n <= 1 ? n * 100 : n;
  return pct > 100 ? NaN : Math.round(pct * 100) / 100;
};

const normalizar = (texto: string) =>
  texto.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

type Especie = 'CARTAMO' | 'GIRASOL';

const especieDe = (nombre: string): Especie | null => {
  const n = normalizar(nombre);
  if (n.includes('GIRASOL')) return 'GIRASOL';
  if (n.includes('CARTAMO')) return 'CARTAMO';
  return null;
};

// Pasta que corresponde a la semilla: misma especie y mismo tipo (orgánica / convencional)
const productoPastaPara = <T extends { id: number; nombre: string }>(nombreSemilla: string, productos: T[]): T | undefined => {
  const especie = especieDe(nombreSemilla);
  if (!especie) return undefined;
  const organica = normalizar(nombreSemilla).includes('ORGANIC');
  return productos.find(p => {
    const n = normalizar(p.nombre);
    return n.includes('PASTA') && n.includes(especie) && n.includes('ORGANIC') === organica;
  });
};

// % de pasta en el historial: se captura una sola vez (al día siguiente del pase) y queda bloqueado
const PorcentajePastaInput: React.FC<{
  valor: number | null | undefined;
  puedeCorregir: boolean;
  onCapturar: (porcentaje: number) => void;
}> = ({ valor, puedeCorregir, onCapturar }) => {
  const [texto, setTexto] = useState('');
  const [corrigiendo, setCorrigiendo] = useState(false);

  if (valor != null && !corrigiendo) {
    return (
      <span className="inline-flex items-center gap-1 tabular-nums" title="Registrado">
        {valor}%
        <Lock className="h-3 w-3 text-muted-foreground" aria-label="Bloqueado" />
        {puedeCorregir && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Corregir % de pasta"
            title="Corregir % de pasta"
            onClick={() => { setTexto(String(valor)); setCorrigiendo(true); }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </span>
    );
  }

  const confirmar = () => {
    const pct = parsePorcentaje(texto);
    setCorrigiendo(false);
    if (pct === null || pct === valor) { setTexto(''); return; }
    if (isNaN(pct) || pct === 0) {
      toast.error('Porcentaje inválido: use un valor mayor a 0 y hasta 100 (ej. 62 o .62)');
      setTexto('');
      return;
    }
    setTexto('');
    // Se abre después de que termine el clic / cambio de foco que disparó el blur;
    // si se abre en el mismo evento, ese clic se toma como "fuera del diálogo" y lo cierra
    setTimeout(() => onCapturar(pct), 0);
  };

  return (
    <div className="relative ml-auto w-24">
      <Input
        inputMode="decimal"
        value={texto}
        placeholder="—"
        aria-label="Porcentaje de pasta"
        className="h-8 pr-6 text-right tabular-nums"
        onChange={e => setTexto(e.target.value)}
        autoFocus={corrigiendo}
        onBlur={confirmar}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
          if (e.key === 'Escape') { setTexto(''); setCorrigiendo(false); }
        }}
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
    </div>
  );
};

const PaseProduccionPanel: React.FC = () => {
  const { productos: productosDB } = useProductos();
  const { almacenes: almacenesDB } = useAlmacenes();
  const { usuario } = useAuth();
  // Báscula y Administrador pueden corregir un % de pasta ya registrado
  const puedeCorregirPasta = usuario?.rol === 'Administrador' || usuario?.rol === 'Báscula';

  const [ppProductoId, setPpProductoId] = useState<string>('');
  const [ppCantidad, setPpCantidad] = useState<string>('');
  const [ppDestino, setPpDestino] = useState<string>('');
  const [ppAlmacenId, setPpAlmacenId] = useState<string>('');
  const [ppGuardando, setPpGuardando] = useState(false);
  const [ppHistorial, setPpHistorial] = useState<any[]>([]);
  const [ppLoadingHistorial, setPpLoadingHistorial] = useState(false);
  const [almacenesConProducto, setAlmacenesConProducto] = useState<AlmacenConExistencia[]>([]);
  const [cargandoAlmacenes, setCargandoAlmacenes] = useState(false);

  const productosSemilla = productosDB.filter(p =>
    p.nombre.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes('SEMILLA')
  );

  const cargarHistorialPP = async () => {
    setPpLoadingHistorial(true);
    try {
      const data = await getMovimientos({ tipo: 'Producción', limit: 50 }) as any;
      setPpHistorial(Array.isArray(data) ? data : data.data || []);
    } catch { /* silencioso */ }
    finally { setPpLoadingHistorial(false); }
  };

  useEffect(() => { cargarHistorialPP(); }, []);

  // Solo se ofrecen los almacenes que tienen existencia del producto seleccionado
  const cargarAlmacenesConProducto = async (productoId: string) => {
    if (!productoId) { setAlmacenesConProducto([]); return; }
    setCargandoAlmacenes(true);
    try {
      const data = await getInventarioByProducto(parseInt(productoId)) as any[];
      setAlmacenesConProducto(
        data
          .filter(i => Number(i.cantidad) > 0 && i.almacen)
          .map(i => ({ id: i.almacen.id, nombre: i.almacen.nombre, cantidad: Number(i.cantidad) }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
    } catch {
      setAlmacenesConProducto([]);
      toast.error('No se pudo consultar el inventario del producto');
    } finally {
      setCargandoAlmacenes(false);
    }
  };

  const handleProductoChange = (productoId: string) => {
    setPpProductoId(productoId);
    setPpAlmacenId('');
    cargarAlmacenesConProducto(productoId);
  };

  // ─── % de pasta → diálogo de bodega de pasta ───
  const bodegasPasta = almacenesDB.filter(a => normalizar(a.nombre).includes('BODEGA DE PASTA'));
  const productosPasta = productosDB;

  const [pastaPendiente, setPastaPendiente] = useState<{ movimiento: any; porcentaje: number } | null>(null);
  const [bodegaPastaId, setBodegaPastaId] = useState<string>('');
  const [guardandoPasta, setGuardandoPasta] = useState(false);

  const especiePendiente = pastaPendiente ? especieDe(pastaPendiente.movimiento.producto?.nombre || '') : null;
  const productoPastaPendiente = pastaPendiente
    ? productoPastaPara(pastaPendiente.movimiento.producto?.nombre || '', productosPasta)
    : undefined;
  const kgPastaPendiente = pastaPendiente
    ? (pastaPendiente.movimiento.peso_neto || 0) * pastaPendiente.porcentaje / 100
    : 0;

  const abrirDialogoPasta = (movimiento: any, porcentaje: number) => {
    const especie = especieDe(movimiento.producto?.nombre || '');
    const sugerida = bodegasPasta.find(b => especie && normalizar(b.nombre).includes(especie));
    setBodegaPastaId(sugerida ? sugerida.id.toString() : '');
    setPastaPendiente({ movimiento, porcentaje });
  };

  const confirmarPasta = async () => {
    if (!pastaPendiente) return;
    const bodega = bodegasPasta.find(b => b.id.toString() === bodegaPastaId);
    if (!bodega) { toast.error('Seleccione la bodega de pasta'); return; }
    if (!productoPastaPendiente) {
      toast.error('No se encontró el producto de pasta que corresponde a esta semilla');
      return;
    }
    const { movimiento, porcentaje } = pastaPendiente;
    const cambios = {
      porcentaje_pasta: porcentaje,
      almacen_pasta_id: bodega.id,
      producto_pasta_id: productoPastaPendiente.id,
    };

    setGuardandoPasta(true);
    try {
      await updateMovimiento(movimiento.id, cambios);
      try {
        await recalcularInventarioDesdeBase(bodega.id, productoPastaPendiente.id);
        await actualizarCapacidadActualAlmacen(bodega.id);
        // En una corrección, la bodega/producto anterior también se recalcula
        const anteriorBodega = movimiento.almacen_pasta_id;
        const anteriorProducto = movimiento.producto_pasta_id;
        if (anteriorBodega != null && anteriorProducto != null &&
            (anteriorBodega !== bodega.id || anteriorProducto !== productoPastaPendiente.id)) {
          await recalcularInventarioDesdeBase(anteriorBodega, anteriorProducto);
          await actualizarCapacidadActualAlmacen(anteriorBodega);
        }
      } catch {
        toast.warning('El % se registró, pero no se pudo actualizar el inventario de pasta. Revise la bodega.');
      }
      setPpHistorial(prev => prev.map(m => m.id === movimiento.id ? { ...m, ...cambios } : m));
      toast.success(`${formatKg(kgPastaPendiente)} kg de ${productoPastaPendiente.nombre.trim()} → ${bodega.nombre}`);
      setPastaPendiente(null);
    } catch (err: any) {
      toast.error(err?.message ? `No se registró: ${err.message}` : 'No se pudo registrar el % de pasta');
    } finally {
      setGuardandoPasta(false);
    }
  };

  const nombreBodega = (id: number | null | undefined) =>
    id == null ? '' : (bodegasPasta.find(b => b.id === id)?.nombre ?? '');

  const almacenSeleccionado = almacenesConProducto.find(a => a.id.toString() === ppAlmacenId);
  const kgCapturados = parseFloat(ppCantidad) || 0;
  const excedeExistencia = !!almacenSeleccionado && kgCapturados > almacenSeleccionado.cantidad;

  const handlePaseProduccion = async () => {
    if (!ppProductoId) { toast.error('Seleccione un producto'); return; }
    const kg = parseFloat(ppCantidad);
    if (!kg || kg <= 0) { toast.error('Ingrese una cantidad válida'); return; }
    const almacen = almacenSeleccionado;
    if (!almacen) { toast.error('Seleccione el almacén de procedencia'); return; }
    if (kg > almacen.cantidad) {
      toast.error(`Inventario insuficiente: ${almacen.nombre} tiene ${formatKg(almacen.cantidad)} kg`);
      return;
    }
    if (!ppDestino.trim()) { toast.error('Ingrese el destino'); return; }

    setPpGuardando(true);
    try {
      const ahora = new Date();
      const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}-${String(ahora.getDate()).padStart(2,'0')}`;
      const boleta = `PP-${fecha.replace(/-/g,'')}-${Date.now().toString().slice(-6)}`;

      await createMovimiento({
        boleta,
        producto_id: parseInt(ppProductoId),
        cliente_proveedor: ppDestino.trim(),
        tipo: 'Producción',
        transporte: null,
        fecha,
        ubicacion: almacen.nombre,
        almacen_id: almacen.id,
        peso_neto: kg,
        peso_bruto: kg,
        peso_tara: null,
        chofer: null,
        placas: null,
      });

      // Descontar del inventario del almacén (base + entradas - salidas - pases)
      const productoId = parseInt(ppProductoId);
      try {
        await recalcularInventarioDesdeBase(almacen.id, productoId);
        await actualizarCapacidadActualAlmacen(almacen.id);
      } catch {
        toast.warning('El pase se registró, pero no se pudo actualizar el inventario. Revise el almacén.');
      }

      toast.success(`Pase registrado — ${formatKg(kg)} kg de ${almacen.nombre} → ${ppDestino}`);
      setPpProductoId('');
      setPpCantidad('');
      setPpDestino('');
      setPpAlmacenId('');
      setAlmacenesConProducto([]);
      await cargarHistorialPP();
    } catch (err: any) {
      // La base de datos rechaza pases sin existencia del producto en el almacén
      toast.error(err?.message ? `No se registró el pase: ${err.message}` : 'Error al registrar el pase');
    } finally {
      setPpGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Registrar Pase de Semilla a Producción
          </CardTitle>
          <CardDescription>
            La cantidad se descuenta del inventario del producto en el almacén de procedencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Producto (Semilla) *</Label>
            <Select value={ppProductoId} onValueChange={handleProductoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar semilla..." />
              </SelectTrigger>
              <SelectContent>
                {productosSemilla.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Procedencia (almacén) *</Label>
            <Select
              value={ppAlmacenId}
              onValueChange={setPpAlmacenId}
              disabled={!ppProductoId || cargandoAlmacenes || almacenesConProducto.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !ppProductoId ? 'Primero seleccione la semilla'
                    : cargandoAlmacenes ? 'Consultando inventario...'
                    : almacenesConProducto.length === 0 ? 'Ningún almacén tiene este producto'
                    : '¿De qué almacén sale la semilla?'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {almacenesConProducto.map(a => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.nombre} — {formatKg(a.cantidad)} kg disponibles
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {ppProductoId && !cargandoAlmacenes && almacenesConProducto.length === 0 && (
              <p className="text-xs text-destructive">No hay inventario de esta semilla en ningún almacén.</p>
            )}
          </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Cantidad (kg) *</Label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={ppCantidad}
                onChange={e => setPpCantidad(e.target.value)}
                max={almacenSeleccionado?.cantidad}
                aria-invalid={excedeExistencia}
              />
              {almacenSeleccionado && (
                <p className={`text-xs ${excedeExistencia ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {excedeExistencia ? 'Excede lo disponible: ' : 'Disponible: '}{formatKg(almacenSeleccionado.cantidad)} kg
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Destino *</Label>
              <Input
                placeholder="Ej: Extracción Planta 1"
                value={ppDestino}
                onChange={e => setPpDestino(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
          <Button
            className="w-full sm:w-auto sm:min-w-[220px] bg-primary hover:bg-primary/90"
            onClick={handlePaseProduccion}
            disabled={ppGuardando || excedeExistencia}
          >
            {ppGuardando ? 'Registrando...' : 'Registrar Movimiento'}
          </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de Pases</CardTitle>
        </CardHeader>
        <CardContent>
          {ppLoadingHistorial ? (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
          ) : ppHistorial.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin registros aún</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Boleta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Procedencia</TableHead>
                  <TableHead className="text-right">Cantidad (kg)</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-right">% de pasta</TableHead>
                  <TableHead className="text-right">Kg de pasta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ppHistorial.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm text-primary whitespace-nowrap">{m.boleta}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">{m.fecha}</TableCell>
                    <TableCell>{m.producto?.nombre || '-'}</TableCell>
                    <TableCell>{m.ubicacion && m.ubicacion !== m.cliente_proveedor ? m.ubicacion : '-'}</TableCell>
                    <TableCell className="text-right font-medium text-orange-600 whitespace-nowrap tabular-nums">
                      -{(m.peso_neto || 0).toLocaleString('es-MX')}
                    </TableCell>
                    <TableCell>{m.cliente_proveedor || '-'}</TableCell>
                    <TableCell className="text-right">
                      <PorcentajePastaInput
                        valor={m.porcentaje_pasta}
                        puedeCorregir={puedeCorregirPasta}
                        onCapturar={(pct) => abrirDialogoPasta(m, pct)}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                      {m.porcentaje_pasta != null ? (
                        <div className="flex flex-col items-end leading-tight">
                          <span>{formatKg((m.peso_neto || 0) * m.porcentaje_pasta / 100)}</span>
                          {m.almacen_pasta_id != null && (
                            <span className="text-xs font-normal text-muted-foreground">{nombreBodega(m.almacen_pasta_id)}</span>
                          )}
                        </div>
                      ) : <span className="text-muted-foreground font-normal">Pendiente</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo: ¿a qué bodega va la pasta? */}
      <Dialog open={!!pastaPendiente} onOpenChange={(abierto) => { if (!abierto && !guardandoPasta) setPastaPendiente(null); }}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {pastaPendiente?.movimiento.porcentaje_pasta != null ? 'Corregir % de pasta' : '¿A qué bodega va la pasta?'}
            </DialogTitle>
            <DialogDescription>
              {pastaPendiente?.movimiento.porcentaje_pasta != null
                ? `Antes: ${pastaPendiente.movimiento.porcentaje_pasta}%. El inventario de pasta se ajusta con el nuevo valor.`
                : 'Al confirmar, el % de pasta queda registrado y solo Báscula o Administración pueden corregirlo.'}
            </DialogDescription>
          </DialogHeader>

          {pastaPendiente && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Pase</span>
                  <span className="font-mono">{pastaPendiente.movimiento.boleta}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Cálculo</span>
                  <span className="tabular-nums">
                    {formatKg(pastaPendiente.movimiento.peso_neto || 0)} kg × {pastaPendiente.porcentaje}%
                  </span>
                </div>
                <div className="flex justify-between gap-4 font-semibold">
                  <span>Kg de pasta</span>
                  <span className="tabular-nums">{formatKg(kgPastaPendiente)} kg</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Producto</span>
                  <span className="text-right">{productoPastaPendiente?.nombre.trim() ?? 'No encontrado'}</span>
                </div>
              </div>

              <RadioGroup value={bodegaPastaId} onValueChange={setBodegaPastaId} className="space-y-2">
                {bodegasPasta.map(b => {
                  const permitida = !!especiePendiente && normalizar(b.nombre).includes(especiePendiente);
                  return (
                    <Label
                      key={b.id}
                      htmlFor={`bodega-pasta-${b.id}`}
                      className={`flex items-center gap-3 rounded-md border p-3 ${permitida ? 'cursor-pointer hover:bg-muted/50' : 'cursor-not-allowed opacity-50'}`}
                    >
                      <RadioGroupItem id={`bodega-pasta-${b.id}`} value={b.id.toString()} disabled={!permitida} />
                      <span className="flex flex-col">
                        <span className="font-medium">{b.nombre}</span>
                        {!permitida && (
                          <span className="text-xs font-normal text-muted-foreground">
                            Solo para pasta de {normalizar(b.nombre).includes('GIRASOL') ? 'girasol' : 'cártamo'}
                          </span>
                        )}
                      </span>
                    </Label>
                  );
                })}
              </RadioGroup>
              {bodegasPasta.length === 0 && (
                <p className="text-sm text-destructive">No hay bodegas de pasta dadas de alta.</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPastaPendiente(null)} disabled={guardandoPasta}>
              Cancelar
            </Button>
            <Button onClick={confirmarPasta} disabled={guardandoPasta || !bodegaPastaId || !productoPastaPendiente}>
              {guardandoPasta ? 'Registrando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaseProduccionPanel;
