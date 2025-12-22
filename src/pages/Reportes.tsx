import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  Package, 
  Factory,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { getRecepciones } from '@/services/supabase/recepciones';
import { getEmbarques } from '@/services/supabase/embarques';
import { useAlmacenes } from '@/services/hooks/useAlmacenes';
import { useProductos } from '@/services/hooks/useProductos';
import { useProveedores } from '@/services/hooks/useProveedores';
import { useClientes } from '@/services/hooks/useClientes';
import { useProduccion } from '@/services/hooks/useProduccion';
import type { Recepcion } from '@/services/supabase/recepciones';
import type { Embarque } from '@/services/supabase/embarques';

const Reportes = () => {
  const [activeTab, setActiveTab] = useState('entradas');
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>();
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>();
  const [filtroProducto, setFiltroProducto] = useState<string>('todos');
  const [filtroProveedor, setFiltroProveedor] = useState<string>('todos');
  const [filtroCliente, setFiltroCliente] = useState<string>('todos');
  const [filtroAlmacen, setFiltroAlmacen] = useState<string>('todos');

  // Data hooks
  const { productos } = useProductos();
  const { proveedores } = useProveedores();
  const { clientes } = useClientes();
  const { almacenes } = useAlmacenes();
  const { reportes: reportesProduccion } = useProduccion();

  // State for reports data
  const [recepciones, setRecepciones] = useState<Recepcion[]>([]);
  const [embarques, setEmbarques] = useState<Embarque[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const filters = {
          fechaDesde: fechaDesde ? format(fechaDesde, 'yyyy-MM-dd') : undefined,
          fechaHasta: fechaHasta ? format(fechaHasta, 'yyyy-MM-dd') : undefined,
          producto_id: filtroProducto !== 'todos' ? parseInt(filtroProducto) : undefined,
        };

        if (activeTab === 'entradas') {
          const recepcionesData = await getRecepciones(filters);
          setRecepciones(Array.isArray(recepcionesData) ? recepcionesData : recepcionesData.data || []);
        }

        if (activeTab === 'salidas') {
          const embarquesData = await getEmbarques(filters);
          setEmbarques(Array.isArray(embarquesData) ? embarquesData : embarquesData.data || []);
        }
      } catch (error) {
        console.error('Error loading report data:', error);
        toast.error('Error al cargar datos del reporte');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, fechaDesde, fechaHasta, filtroProducto]);

  // Filtered data
  const filteredRecepciones = useMemo(() => {
    return recepciones.filter(r => {
      const matchSearch = !search || 
        r.boleta.toLowerCase().includes(search.toLowerCase()) ||
        r.proveedor?.empresa.toLowerCase().includes(search.toLowerCase()) ||
        r.producto?.nombre.toLowerCase().includes(search.toLowerCase());
      
      const matchProveedor = filtroProveedor === 'todos' || 
        (r.proveedor_id && r.proveedor_id.toString() === filtroProveedor);
      
      return matchSearch && matchProveedor;
    });
  }, [recepciones, search, filtroProveedor]);

  const filteredEmbarques = useMemo(() => {
    return embarques.filter(e => {
      const matchSearch = !search || 
        e.boleta.toLowerCase().includes(search.toLowerCase()) ||
        e.cliente?.empresa.toLowerCase().includes(search.toLowerCase()) ||
        e.producto?.nombre.toLowerCase().includes(search.toLowerCase());
      
      const matchCliente = filtroCliente === 'todos' || 
        (e.cliente_id && e.cliente_id.toString() === filtroCliente);
      
      return matchSearch && matchCliente;
    });
  }, [embarques, search, filtroCliente]);

  // Calculate totals
  const totalEntradas = filteredRecepciones.reduce((acc, r) => acc + (r.peso_neto || 0), 0);
  const totalSalidas = filteredEmbarques.reduce((acc, e) => acc + (e.peso_neto || 0), 0);

  // Export functions
  const exportToCSV = (data: any[], headers: string[], filename: string) => {
    if (data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    // Map headers to data keys
    const headerToKey: Record<string, string> = {
      'Boleta': 'boleta',
      'Fecha': 'fecha',
      'Producto': 'producto',
      'Proveedor': 'proveedor',
      'Cliente': 'cliente',
      'Destino': 'destino',
      'Chofer': 'chofer',
      'Placas': 'placas',
      'Peso Bruto (Kg)': 'peso_bruto',
      'Peso Tara (Kg)': 'peso_tara',
      'Peso Neto (Kg)': 'peso_neto',
      'Lote': 'lote',
      'Estatus': 'estatus',
      'Cliente/Proveedor': 'cliente_proveedor',
      'Tipo': 'tipo',
      'Transporte': 'transporte',
      'Ubicación': 'ubicacion',
      'Almacén': 'almacen',
      'Capacidad Total': 'capacidad_total',
      'Capacidad Actual': 'capacidad_actual',
      'Disponible': 'disponible',
      'Porcentaje Ocupado': 'porcentaje_ocupado',
      'Unidad': 'unidad',
      'ID': 'id',
      'Responsable': 'responsable',
      'Tanques con Nivel': 'tanques_nivel',
      'Tanques con Gomas': 'tanques_gomas'
    };

    const rows = data.map(item => headers.map(header => {
      const key = headerToKey[header] || header.toLowerCase().replace(/\s+/g, '_');
      const value = item[key] ?? '';
      return `"${String(value).replace(/"/g, '""')}"`;
    }));
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success('Reporte descargado correctamente');
  };

  const handleExportEntradas = () => {
    const headers = ['Boleta', 'Fecha', 'Producto', 'Proveedor', 'Chofer', 'Placas', 'Peso Bruto (Kg)', 'Peso Tara (Kg)', 'Peso Neto (Kg)', 'Lote', 'Estatus'];
    const data = filteredRecepciones.map(r => ({
      boleta: r.boleta,
      fecha: r.fecha,
      producto: r.producto?.nombre || '',
      proveedor: r.proveedor?.empresa || '',
      chofer: r.chofer || '',
      placas: r.placas || '',
      peso_bruto: r.peso_bruto || 0,
      peso_tara: r.peso_tara || 0,
      peso_neto: r.peso_neto || 0,
      lote: r.codigo_lote || '',
      estatus: r.estatus
    }));
    exportToCSV(data, headers, 'reporte_entradas');
  };

  const handleExportSalidas = () => {
    const headers = ['Boleta', 'Fecha', 'Producto', 'Cliente', 'Destino', 'Chofer', 'Placas', 'Peso Bruto (Kg)', 'Peso Tara (Kg)', 'Peso Neto (Kg)', 'Lote', 'Estatus'];
    const data = filteredEmbarques.map(e => ({
      boleta: e.boleta,
      fecha: e.fecha,
      producto: e.producto?.nombre || '',
      cliente: e.cliente?.empresa || '',
      destino: e.destino || '',
      chofer: e.chofer || '',
      placas: e.placas || '',
      peso_bruto: e.peso_bruto || 0,
      peso_tara: e.peso_tara || 0,
      peso_neto: e.peso_neto || 0,
      lote: e.codigo_lote || '',
      estatus: e.estatus
    }));
    exportToCSV(data, headers, 'reporte_salidas');
  };

  const handleExportInventario = () => {
    const headers = ['Almacén', 'Capacidad Total', 'Capacidad Actual', 'Disponible', 'Porcentaje Ocupado', 'Unidad'];
    const data = almacenes.map(a => ({
      almacen: a.nombre,
      capacidad_total: a.capacidad_total,
      capacidad_actual: a.capacidad_actual || 0,
      disponible: (a.capacidad_total - (a.capacidad_actual || 0)),
      porcentaje_ocupado: a.capacidad_total > 0 ? ((a.capacidad_actual || 0) / a.capacidad_total * 100).toFixed(2) : 0,
      unidad: a.unidad
    }));
    exportToCSV(data, headers, 'reporte_inventario');
  };

  const handleExportProduccion = () => {
    const headers = ['ID', 'Fecha', 'Responsable', 'Estatus', 'Tanques con Nivel', 'Tanques con Gomas'];
    const data = reportesProduccion.map(r => ({
      id: r.id,
      fecha: r.fecha,
      responsable: r.responsable,
      estatus: r.estatus,
      tanques_nivel: r.niveles_tanques?.length || 0,
      tanques_gomas: r.niveles_gomas?.length || 0
    }));
    exportToCSV(data, headers, 'reporte_produccion');
  };

  const limpiarFiltros = () => {
    setSearch('');
    setFechaDesde(undefined);
    setFechaHasta(undefined);
    setFiltroProducto('todos');
    setFiltroProveedor('todos');
    setFiltroCliente('todos');
    setFiltroAlmacen('todos');
  };

  const formatNumber = (num: number) => num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Layout>
      <Header title="Reportes" subtitle="Generación de reportes del sistema" />
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="entradas">Entradas</TabsTrigger>
            <TabsTrigger value="salidas">Salidas</TabsTrigger>
            <TabsTrigger value="inventario">Inventario</TabsTrigger>
            <TabsTrigger value="produccion">Producción</TabsTrigger>
          </TabsList>

          {/* Filtros comunes */}
          <div className="mt-6 mb-4 flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar..." 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-36 justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {fechaDesde ? format(fechaDesde, 'dd/MM/yyyy') : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={fechaDesde}
                    onSelect={setFechaDesde}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-36 justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {fechaHasta ? format(fechaHasta, 'dd/MM/yyyy') : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={fechaHasta}
                    onSelect={setFechaHasta}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {(activeTab === 'entradas' || activeTab === 'salidas') && (
              <div className="space-y-1">
                <Label className="text-xs">Producto</Label>
                <Select value={filtroProducto} onValueChange={setFiltroProducto}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {productos.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeTab === 'entradas' && (
              <div className="space-y-1">
                <Label className="text-xs">Proveedor</Label>
                <Select value={filtroProveedor} onValueChange={setFiltroProveedor}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {proveedores.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.empresa}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeTab === 'salidas' && (
              <div className="space-y-1">
                <Label className="text-xs">Cliente</Label>
                <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.empresa}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>

          {/* Tab: Entradas */}
          <TabsContent value="entradas" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Reporte de Entradas (Reciba)</CardTitle>
                    <CardDescription>
                      {filteredRecepciones.length} registro(s) encontrado(s)
                    </CardDescription>
                  </div>
                  <Button onClick={handleExportEntradas} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                ) : filteredRecepciones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay registros para mostrar</div>
                ) : (
                  <>
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700">
                        <TrendingUp className="h-5 w-5" />
                        <span className="font-semibold">Total de Entradas: {formatNumber(totalEntradas)} Kg</span>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Boleta</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Chofer</TableHead>
                          <TableHead>Placas</TableHead>
                          <TableHead className="text-right">Peso Bruto</TableHead>
                          <TableHead className="text-right">Peso Tara</TableHead>
                          <TableHead className="text-right">Peso Neto</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>Estatus</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecepciones.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.boleta}</TableCell>
                            <TableCell>{format(new Date(r.fecha), 'dd/MM/yyyy', { locale: es })}</TableCell>
                            <TableCell>{r.producto?.nombre || '-'}</TableCell>
                            <TableCell>{r.proveedor?.empresa || '-'}</TableCell>
                            <TableCell>{r.chofer || '-'}</TableCell>
                            <TableCell>{r.placas || '-'}</TableCell>
                            <TableCell className="text-right">{formatNumber(r.peso_bruto || 0)}</TableCell>
                            <TableCell className="text-right">{formatNumber(r.peso_tara || 0)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatNumber(r.peso_neto || 0)}</TableCell>
                            <TableCell>{r.codigo_lote || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={r.estatus === 'Cerrado' ? 'default' : 'secondary'}>
                                {r.estatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Salidas */}
          <TabsContent value="salidas" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Reporte de Salidas (Embarque)</CardTitle>
                    <CardDescription>
                      {filteredEmbarques.length} registro(s) encontrado(s)
                    </CardDescription>
                  </div>
                  <Button onClick={handleExportSalidas} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                ) : filteredEmbarques.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay registros para mostrar</div>
                ) : (
                  <>
                    <div className="mb-4 p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <TrendingDown className="h-5 w-5" />
                        <span className="font-semibold">Total de Salidas: {formatNumber(totalSalidas)} Kg</span>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Boleta</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Destino</TableHead>
                          <TableHead>Chofer</TableHead>
                          <TableHead>Placas</TableHead>
                          <TableHead className="text-right">Peso Bruto</TableHead>
                          <TableHead className="text-right">Peso Tara</TableHead>
                          <TableHead className="text-right">Peso Neto</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>Estatus</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmbarques.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell className="font-medium">{e.boleta}</TableCell>
                            <TableCell>{format(new Date(e.fecha), 'dd/MM/yyyy', { locale: es })}</TableCell>
                            <TableCell>{e.producto?.nombre || '-'}</TableCell>
                            <TableCell>{e.cliente?.empresa || '-'}</TableCell>
                            <TableCell>{e.destino || '-'}</TableCell>
                            <TableCell>{e.chofer || '-'}</TableCell>
                            <TableCell>{e.placas || '-'}</TableCell>
                            <TableCell className="text-right">{formatNumber(e.peso_bruto || 0)}</TableCell>
                            <TableCell className="text-right">{formatNumber(e.peso_tara || 0)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatNumber(e.peso_neto || 0)}</TableCell>
                            <TableCell>{e.codigo_lote || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={e.estatus === 'Cerrado' ? 'default' : 'secondary'}>
                                {e.estatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Inventario */}
          <TabsContent value="inventario" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Reporte de Inventario</CardTitle>
                    <CardDescription>
                      Estado actual de almacenes y capacidad
                    </CardDescription>
                  </div>
                  <Button onClick={handleExportInventario} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {almacenes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay almacenes registrados</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Almacén</TableHead>
                        <TableHead className="text-right">Capacidad Total</TableHead>
                        <TableHead className="text-right">Capacidad Actual</TableHead>
                        <TableHead className="text-right">Disponible</TableHead>
                        <TableHead className="text-right">% Ocupado</TableHead>
                        <TableHead>Unidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {almacenes.map((a) => {
                        const disponible = a.capacidad_total - (a.capacidad_actual || 0);
                        const porcentajeOcupado = a.capacidad_total > 0 
                          ? ((a.capacidad_actual || 0) / a.capacidad_total * 100) 
                          : 0;
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.nombre}</TableCell>
                            <TableCell className="text-right">{formatNumber(a.capacidad_total)}</TableCell>
                            <TableCell className="text-right">{formatNumber(a.capacidad_actual || 0)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatNumber(disponible)}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={porcentajeOcupado > 80 ? 'destructive' : porcentajeOcupado > 60 ? 'default' : 'secondary'}>
                                {porcentajeOcupado.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>{a.unidad}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Producción */}
          <TabsContent value="produccion" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Reporte de Producción</CardTitle>
                    <CardDescription>
                      {reportesProduccion.length} reporte(s) de producción
                    </CardDescription>
                  </div>
                  <Button onClick={handleExportProduccion} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {reportesProduccion.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay reportes de producción</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Tanques con Nivel</TableHead>
                        <TableHead>Tanques con Gomas</TableHead>
                        <TableHead>Expander (L)</TableHead>
                        <TableHead>Comb. Alterno (%)</TableHead>
                        <TableHead>Combustóleo (%)</TableHead>
                        <TableHead>Estatus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportesProduccion.map((r) => {
                        const fecha = new Date(r.fecha);
                        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                        const diaSemana = diasSemana[fecha.getDay()];
                        const fechaFormateada = `${diaSemana} ${format(fecha, 'dd/MM/yyyy', { locale: es })}`;
                        
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.id}</TableCell>
                            <TableCell>{fechaFormateada}</TableCell>
                            <TableCell>{r.responsable}</TableCell>
                            <TableCell className="text-center">{r.niveles_tanques?.length || 0}</TableCell>
                            <TableCell className="text-center">{r.niveles_gomas?.length || 0}</TableCell>
                            <TableCell className="text-right">{r.expander_litros ? formatNumber(r.expander_litros) : '-'}</TableCell>
                            <TableCell className="text-right">{r.comb_alterno_porcentaje ? formatNumber(r.comb_alterno_porcentaje) : '-'}</TableCell>
                            <TableCell className="text-right">{r.combustoleo_porcentaje ? formatNumber(r.combustoleo_porcentaje) : '-'}</TableCell>
                            <TableCell>
                              <Badge variant={r.estatus === 'Completado' ? 'default' : 'secondary'}>
                                {r.estatus}
                              </Badge>
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
      </div>
    </Layout>
  );
};

export default Reportes;
