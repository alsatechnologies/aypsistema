import React, { useState } from 'react';
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

interface Movimiento {
  id: number;
  folio: string;
  producto: string;
  clienteProveedor: string;
  tipo: 'Entrada' | 'Salida';
  transporte: 'Camión' | 'Ferroviaria';
  fecha: string;
  ubicacion: string;
  pesoNeto: number;
  pesoBruto?: number;
  pesoTara?: number;
  chofer?: string;
  placas?: string;
}

const Movimientos = () => {
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroProducto, setFiltroProducto] = useState<string>('todos');
  const [filtroTransporte, setFiltroTransporte] = useState<string>('todos');
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>();
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>();
  const [selectedMovimiento, setSelectedMovimiento] = useState<Movimiento | null>(null);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);

  const [movimientos] = useState<Movimiento[]>([
    { 
      id: 1, 
      folio: '0-03-0001',
      producto: 'Frijol Soya', 
      clienteProveedor: 'Oleaginosas del Bajío',
      tipo: 'Entrada',
      transporte: 'Camión',
      fecha: '2024-12-10',
      ubicacion: 'Silo 1',
      pesoNeto: 24300,
      pesoBruto: 39500,
      pesoTara: 15200,
      chofer: 'Juan Pérez',
      placas: 'ABC-123'
    },
    { 
      id: 2, 
      folio: '1-01-0001',
      producto: 'Aceite Crudo de Soya', 
      clienteProveedor: 'Aceites del Pacífico SA',
      tipo: 'Salida',
      transporte: 'Camión',
      fecha: '2024-12-10',
      ubicacion: 'Tanque A1',
      pesoNeto: 34300,
      pesoBruto: 48500,
      pesoTara: 14200,
      chofer: 'Miguel Torres'
    },
    { 
      id: 3, 
      folio: '0-04-0002',
      producto: 'Maíz', 
      clienteProveedor: 'Agrícola del Centro',
      tipo: 'Entrada',
      transporte: 'Ferroviaria',
      fecha: '2024-12-10',
      ubicacion: 'Silo 3',
      pesoNeto: 52100,
      pesoBruto: 67300,
      pesoTara: 15200
    },
    { 
      id: 4, 
      folio: '1-02-0002',
      producto: 'Pasta de Soya', 
      clienteProveedor: 'Alimentos Balanceados MX',
      tipo: 'Salida',
      transporte: 'Camión',
      fecha: '2024-12-09',
      ubicacion: 'Bodega 2',
      pesoNeto: 18500,
      pesoBruto: 33700,
      pesoTara: 15200,
      chofer: 'Roberto Sánchez'
    },
    { 
      id: 5, 
      folio: '2-01-0003',
      producto: 'Aceite Crudo de Soya', 
      clienteProveedor: 'Export Foods Inc.',
      tipo: 'Salida',
      transporte: 'Ferroviaria',
      fecha: '2024-12-09',
      ubicacion: 'Tanque A2',
      pesoNeto: 45200,
      pesoBruto: 60400,
      pesoTara: 15200
    },
    { 
      id: 6, 
      folio: '0-03-0003',
      producto: 'Frijol Soya', 
      clienteProveedor: 'Granos del Norte',
      tipo: 'Entrada',
      transporte: 'Camión',
      fecha: '2024-12-08',
      ubicacion: 'Silo 2',
      pesoNeto: 36300,
      pesoBruto: 51500,
      pesoTara: 15200,
      chofer: 'Carlos López'
    },
  ]);

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
    const matchSearch = m.producto.toLowerCase().includes(search.toLowerCase()) ||
      m.clienteProveedor.toLowerCase().includes(search.toLowerCase()) ||
      m.folio.includes(search);
    
    const matchTipo = filtroTipo === 'todos' || m.tipo === filtroTipo;
    const matchProducto = filtroProducto === 'todos' || m.producto === filtroProducto;
    const matchTransporte = filtroTransporte === 'todos' || m.transporte === filtroTransporte;
    
    const matchFechaDesde = !fechaDesde || new Date(m.fecha) >= fechaDesde;
    const matchFechaHasta = !fechaHasta || new Date(m.fecha) <= fechaHasta;

    return matchSearch && matchTipo && matchProducto && matchTransporte && matchFechaDesde && matchFechaHasta;
  });

  const formatNumber = (num: number) => num.toLocaleString('es-MX');

  const handleDownload = () => {
    const headers = ['Folio', 'Producto', 'Cliente/Proveedor', 'Tipo', 'Transporte', 'Fecha', 'Ubicación', 'Peso Neto (Kg)'];
    const rows = filteredMovimientos.map(m => [
      m.folio,
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

  const totalEntradas = filteredMovimientos.filter(m => m.tipo === 'Entrada').reduce((acc, m) => acc + m.pesoNeto, 0);
  const totalSalidas = filteredMovimientos.filter(m => m.tipo === 'Salida').reduce((acc, m) => acc + m.pesoNeto, 0);

  return (
    <Layout>
      <Header title="Movimientos" subtitle="Historial de entradas y salidas" />
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Entradas</CardTitle>
              <ArrowDown className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatNumber(totalEntradas)} Kg</div>
              <p className="text-xs text-muted-foreground">{filteredMovimientos.filter(m => m.tipo === 'Entrada').length} movimientos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Salidas</CardTitle>
              <ArrowUp className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatNumber(totalSalidas)} Kg</div>
              <p className="text-xs text-muted-foreground">{filteredMovimientos.filter(m => m.tipo === 'Salida').length} movimientos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
              <Calendar className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalEntradas - totalSalidas >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {totalEntradas - totalSalidas >= 0 ? '+' : ''}{formatNumber(totalEntradas - totalSalidas)} Kg
              </div>
              <p className="text-xs text-muted-foreground">Este período</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por folio, producto o cliente/proveedor..." 
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
                  <TableHead>Folio</TableHead>
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
                    <TableCell>
                      <Badge variant="outline" className="font-mono font-bold text-primary">{movimiento.folio}</Badge>
                    </TableCell>
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
                      {movimiento.tipo === 'Entrada' ? '+' : '-'}{formatNumber(movimiento.pesoNeto)} Kg
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
