import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Clock, CheckCircle, Printer, Eye, Truck, Ship } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BoletaPreviewDialog from '@/components/oficina/BoletaPreviewDialog';
import { generateNumeroBoleta, TipoOperacion } from '@/utils/folioGenerator';

interface Orden {
  id: number;
  boleta: string;
  producto: string;
  cliente: string;
  tipoOperacion: TipoOperacion;
  destino: string;
  nombreChofer: string;
  vehiculo: string;
  placas: string;
  fechaHoraIngreso: string;
  estatus: 'Pendiente' | 'En Báscula' | 'En Proceso' | 'Completado';
}

const Oficina = () => {
  const [search, setSearch] = useState('');
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [ordenes, setOrdenes] = useState<Orden[]>([
    { 
      id: 1, 
      boleta: generateNumeroBoleta('Embarque Nacional', 'Aceite Crudo de Soya', 1),
      producto: 'Aceite Crudo de Soya', 
      cliente: 'Aceites del Pacífico SA',
      tipoOperacion: 'Embarque Nacional',
      destino: 'Guadalajara, JAL',
      nombreChofer: 'Juan Carlos Mendoza',
      vehiculo: 'Pipa',
      placas: 'ABC-123-A',
      fechaHoraIngreso: '2024-12-10 08:30',
      estatus: 'En Báscula'
    },
    { 
      id: 2, 
      boleta: generateNumeroBoleta('Entradas', 'Frijol Soya', 2),
      producto: 'Frijol Soya', 
      cliente: 'Granos Selectos',
      tipoOperacion: 'Entradas',
      destino: 'Planta AP',
      nombreChofer: 'Pedro Ramírez López',
      vehiculo: 'Tractocamión',
      placas: 'XYZ-789-B',
      fechaHoraIngreso: '2024-12-10 09:15',
      estatus: 'Pendiente'
    },
    { 
      id: 3, 
      boleta: generateNumeroBoleta('Embarque Nacional', 'Pasta de Soya', 3),
      producto: 'Pasta de Soya', 
      cliente: 'Alimentos Balanceados MX',
      tipoOperacion: 'Embarque Nacional',
      destino: 'Monterrey, NL',
      nombreChofer: 'Miguel Ángel Torres',
      vehiculo: 'Torton',
      placas: 'DEF-456-C',
      fechaHoraIngreso: '2024-12-10 07:45',
      estatus: 'Completado'
    },
    { 
      id: 4, 
      boleta: generateNumeroBoleta('Exportación', 'Aceite Crudo de Soya', 4),
      producto: 'Aceite Crudo de Soya', 
      cliente: 'Export Foods Inc.',
      tipoOperacion: 'Exportación',
      destino: 'Houston, TX',
      nombreChofer: 'Roberto Sánchez',
      vehiculo: 'Contenedor',
      placas: 'GHI-321-D',
      fechaHoraIngreso: '2024-12-10 10:00',
      estatus: 'En Proceso'
    },
  ]);

  const handleViewBoleta = (orden: Orden) => {
    setSelectedOrden(orden);
    setShowPreview(true);
  };

  const getEstatusBadge = (estatus: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      'Pendiente': { className: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: <Clock className="h-3 w-3 mr-1" /> },
      'En Báscula': { className: 'bg-blue-100 text-blue-700 border-blue-300', icon: <Truck className="h-3 w-3 mr-1" /> },
      'En Proceso': { className: 'bg-orange-100 text-orange-700 border-orange-300', icon: <FileText className="h-3 w-3 mr-1" /> },
      'Completado': { className: 'bg-green-100 text-green-700 border-green-300', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    };
    const { className, icon } = config[estatus] || { className: 'bg-muted', icon: null };
    return <Badge className={`flex items-center w-fit ${className}`}>{icon}{estatus}</Badge>;
  };

  const getTipoOperacionBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      'Reciba': 'bg-green-500 text-white',
      'Embarque Nacional': 'bg-blue-500 text-white',
      'Embarque Exportación': 'bg-purple-500 text-white',
    };
    return <Badge className={colors[tipo]}>{tipo}</Badge>;
  };

  const filteredOrdenes = ordenes.filter(o => 
    o.producto.toLowerCase().includes(search.toLowerCase()) ||
    o.cliente.toLowerCase().includes(search.toLowerCase()) ||
    o.boleta.includes(search) ||
    o.nombreChofer.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    pendientes: ordenes.filter(o => o.estatus === 'Pendiente').length,
    enProceso: ordenes.filter(o => o.estatus === 'En Báscula' || o.estatus === 'En Proceso').length,
    completados: ordenes.filter(o => o.estatus === 'Completado').length,
  };
  return (
    <Layout>
      <Header title="Oficina" subtitle="Gestión de órdenes y documentación" />
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendientes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Proceso</CardTitle>
              <Truck className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.enProceso}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completados Hoy</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.completados}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and New */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por folio, producto, cliente..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Orden
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nueva Orden</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="nacional" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="reciba" className="flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    Reciba
                  </TabsTrigger>
                  <TabsTrigger value="nacional" className="flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    Embarque Nacional
                  </TabsTrigger>
                  <TabsTrigger value="exportacion" className="flex items-center gap-1">
                    <Ship className="h-3 w-3" />
                    Exportación
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="reciba" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Proveedor</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prov1">Oleaginosas del Bajío</SelectItem>
                          <SelectItem value="prov2">Granos del Norte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Producto</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="frijol">Frijol Soya</SelectItem>
                          <SelectItem value="maiz">Maíz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Origen</Label>
                      <Input placeholder="Ciudad, Estado" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Transporte</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="camion">Camión</SelectItem>
                          <SelectItem value="ferroviaria">Ferroviaria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="nacional" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cliente</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cli1">Aceites del Pacífico SA</SelectItem>
                          <SelectItem value="cli2">Alimentos Balanceados MX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Producto</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aceite">Aceite Crudo de Soya</SelectItem>
                          <SelectItem value="pasta">Pasta de Soya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Destino</Label>
                      <Input placeholder="Ciudad, Estado" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Transporte</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="camion">Camión</SelectItem>
                          <SelectItem value="ferroviaria">Ferroviaria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="exportacion" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cliente Internacional</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exp1">Export Foods Inc.</SelectItem>
                          <SelectItem value="exp2">Global Oils LLC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Producto</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aceite">Aceite Crudo de Soya</SelectItem>
                          <SelectItem value="pasta">Pasta de Soya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>País / Puerto Destino</Label>
                      <Input placeholder="Ej: Houston, TX" />
                    </div>
                    <div className="space-y-2">
                      <Label>Incoterm</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fob">FOB</SelectItem>
                          <SelectItem value="cif">CIF</SelectItem>
                          <SelectItem value="exw">EXW</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Datos del Transporte</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del Chofer</Label>
                    <Input placeholder="Nombre completo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Vehículo</Label>
                    <Input placeholder="Tipo de vehículo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Placas</Label>
                    <Input placeholder="ABC-123-A" />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button className="bg-primary hover:bg-primary/90">Crear Orden</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Órdenes del Día
            </CardTitle>
            <CardDescription>Gestión de órdenes de reciba y embarque</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Folio</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cliente/Proveedor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Destino/Origen</TableHead>
                  <TableHead>Chofer</TableHead>
                  <TableHead>Placas</TableHead>
                  <TableHead>Ingreso</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrdenes.map((orden) => (
                  <TableRow key={orden.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono font-bold text-primary">{orden.boleta}</TableCell>
                    <TableCell className="font-medium">{orden.producto}</TableCell>
                    <TableCell>{orden.cliente}</TableCell>
                    <TableCell>{getTipoOperacionBadge(orden.tipoOperacion)}</TableCell>
                    <TableCell>{orden.destino}</TableCell>
                    <TableCell>{orden.nombreChofer}</TableCell>
                    <TableCell className="font-mono text-sm">{orden.placas}</TableCell>
                    <TableCell>{orden.fechaHoraIngreso}</TableCell>
                    <TableCell>{getEstatusBadge(orden.estatus)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleViewBoleta(orden)}
                        title="Ver boleta"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleViewBoleta(orden)}
                        title="Imprimir boleta"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Boleta Preview Dialog */}
        <BoletaPreviewDialog 
          open={showPreview} 
          onOpenChange={setShowPreview} 
          orden={selectedOrden} 
        />
      </div>
    </Layout>
  );
};

export default Oficina;
