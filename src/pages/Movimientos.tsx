import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Download, ArrowDown, ArrowUp, Truck, Train, MapPin, Calendar, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DetalleMovimientoDialog from '@/components/movimientos/DetalleMovimientoDialog';
import { toast } from 'sonner';
import { useMovimientos } from '@/services/hooks/useMovimientos';
import type { Movimiento as MovimientoDB } from '@/services/supabase/movimientos';

interface Movimiento {
  id: number;
  boleta: string;
  producto: string;
  clienteProveedor?: string | null;
  tipo: 'Entrada' | 'Salida';
  transporte?: string | null;
  fecha: string;
  ubicacion?: string | null;
  pesoNeto?: number | null;
  pesoBruto?: number | null;
  pesoTara?: number | null;
  chofer?: string | null;
  placas?: string | null;
}

const Movimientos = () => {
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroProducto, setFiltroProducto] = useState<string>('todos');
  const [filtroTransporte, setFiltroTransporte] = useState<string>('todos');
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>();
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>();
  
  const filters = useMemo(() => ({
    fechaDesde: fechaDesde ? format(fechaDesde, 'yyyy-MM-dd') : undefined,
    fechaHasta: fechaHasta ? format(fechaHasta, 'yyyy-MM-dd') : undefined,
    tipo: filtroTipo !== 'todos' ? filtroTipo : undefined,
    producto_id: filtroProducto !== 'todos' ? parseInt(filtroProducto) : undefined
  }), [fechaDesde, fechaHasta, filtroTipo, filtroProducto]);
  
  const { movimientos: movimientosDB, loading, loadingMore, hasMore, loadMovimientos, loadMore } = useMovimientos(filters);
  const [selectedMovimiento, setSelectedMovimiento] = useState<Movimiento | null>(null);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);

  // Mapear movimientos de DB a formato local
  const movimientos: Movimiento[] = movimientosDB.map(m => ({
    id: m.id,
    boleta: m.boleta,
    producto: m.producto?.nombre || '',
    clienteProveedor: m.cliente_proveedor,
    tipo: m.tipo as 'Entrada' | 'Salida',
    transporte: m.transporte,
    fecha: m.fecha,
    ubicacion: m.ubicacion,
    pesoNeto: m.peso_neto,
    pesoBruto: m.peso_bruto,
    pesoTara: m.peso_tara,
    chofer: m.chofer,
    placas: m.placas
  }));

  const productos = [...new Set(movimientos.map(m => m.producto))];

  const getTipoBadge = (tipo: string) => {
    if (tipo === 'Entrada') {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1 w-fit">
          <ArrowDown className="h-3 w-3" />
          Entrada
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1 w-fit">
        <ArrowUp className="h-3 w-3" />
        Salida
      </Badge>
    );
  };

  const getTransporteBadge = (transporte: string) => {
    if (transporte === 'Camión') {
      return (
        <span className="flex items-center gap-1 text-sm">
          <Truck className="h-4 w-4 text-muted-foreground" />
          Camión
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-sm">
        <Train className="h-4 w-4 text-muted-foreground" />
        Ferroviaria
      </span>
    );
  };

  const filteredMovimientos = movimientos.filter(m => {
    const matchSearch = !search || 
      m.producto?.toLowerCase().includes(search.toLowerCase()) ||
      (m.clienteProveedor && m.clienteProveedor.toLowerCase().includes(search.toLowerCase())) ||
      m.boleta.includes(search);
    
    const matchTipo = filtroTipo === 'todos' || m.tipo === filtroTipo;
    const matchProducto = filtroProducto === 'todos' || m.producto === filtroProducto;
    const matchTransporte = filtroTransporte === 'todos' || (m.transporte && m.transporte === filtroTransporte);
    
    const matchFechaDesde = !fechaDesde || new Date(m.fecha) >= fechaDesde;
    const matchFechaHasta = !fechaHasta || new Date(m.fecha) <= fechaHasta;

    return matchSearch && matchTipo && matchProducto && matchTransporte && matchFechaDesde && matchFechaHasta;
  });

  const formatNumber = (num: number) => num.toLocaleString('es-MX');

  const handleDownload = () => {
    const headers = ['Boleta', 'Producto', 'Cliente/Proveedor', 'Tipo', 'Transporte', 'Fecha', 'Ubicación', 'Peso Neto (Kg)'];
    const rows = filteredMovimientos.map(m => [
      m.boleta,
      m.producto,
      m.clienteProveedor,
      m.tipo,
      m.transporte,
      m.fecha,
      m.ubicacion,
      m.pesoNeto.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `movimientos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success('Reporte descargado correctamente');
  };

  const handleRowClick = (movimiento: Movimiento) => {
    setSelectedMovimiento(movimiento);
    setIsDetalleOpen(true);
  };

  const limpiarFiltros = () => {
    setFiltroTipo('todos');
    setFiltroProducto('todos');
    setFiltroTransporte('todos');
    setFechaDesde(undefined);
    setFechaHasta(undefined);
    setSearch('');
  };

  const totalEntradas = filteredMovimientos.filter(m => m.tipo === 'Entrada').reduce((acc, m) => acc + (m.pesoNeto || 0), 0);
  const totalSalidas = filteredMovimientos.filter(m => m.tipo === 'Salida').reduce((acc, m) => acc + (m.pesoNeto || 0), 0);

  return (
    <Layout>
      <Header title="Movimientos" subtitle="Historial de entradas y salidas" />
      <div className="p-6">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por boleta, producto o cliente/proveedor..." 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Descargar CSV
            </Button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Entrada">Entradas</SelectItem>
                  <SelectItem value="Salida">Salidas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Producto</Label>
              <Select value={filtroProducto} onValueChange={setFiltroProducto}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {productos.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Transporte</Label>
              <Select value={filtroTransporte} onValueChange={setFiltroTransporte}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Camión">Camión</SelectItem>
                  <SelectItem value="Ferroviaria">Ferroviaria</SelectItem>
                </SelectContent>
              </Select>
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

            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Movimientos</CardTitle>
            <CardDescription>
              Registro completo de entradas y salidas de inventario 
              ({filteredMovimientos.length} resultados)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Boleta</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cliente/Proveedor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Transporte</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-right">Peso Neto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovimientos.map((movimiento) => (
                  <TableRow 
                    key={movimiento.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(movimiento)}
                  >
                    <TableCell className="font-mono font-bold text-primary">{movimiento.boleta}</TableCell>
                    <TableCell className="font-medium">{movimiento.producto}</TableCell>
                    <TableCell>{movimiento.clienteProveedor}</TableCell>
                    <TableCell>{getTipoBadge(movimiento.tipo)}</TableCell>
                    <TableCell>{getTransporteBadge(movimiento.transporte)}</TableCell>
                    <TableCell>{movimiento.fecha}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {movimiento.ubicacion}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${movimiento.tipo === 'Entrada' ? 'text-green-600' : 'text-blue-600'}`}>
                      {movimiento.tipo === 'Entrada' ? '+' : '-'}{formatNumber(movimiento.pesoNeto || 0)} Kg
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {hasMore && (
              <div className="flex justify-center mt-4 pb-4">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Cargando...' : 'Cargar más'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalle Dialog */}
        <DetalleMovimientoDialog
          open={isDetalleOpen}
          onOpenChange={setIsDetalleOpen}
          movimiento={selectedMovimiento}
        />
      </div>
    </Layout>
  );
};

export default Movimientos;
