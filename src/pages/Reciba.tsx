import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Scale, Truck, Train, Clock, CheckCircle, FileText, Printer, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface Recepcion {
  id: number;
  folio: string;
  producto: string;
  proveedor: string;
  chofer: string;
  fecha: string;
  estatus: 'Pendiente' | 'Peso Bruto' | 'En Descarga' | 'Peso Tara' | 'Completado';
  pesoBruto?: number;
  pesoTara?: number;
  pesoNeto?: number;
  tipoTransporte: 'Camión' | 'Ferroviaria';
}

const Reciba = () => {
  const [search, setSearch] = useState('');
  const [selectedRecepcion, setSelectedRecepcion] = useState<Recepcion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [recepciones] = useState<Recepcion[]>([
    { 
      id: 1, 
      folio: '0-03-0001',
      producto: 'Frijol Soya', 
      proveedor: 'Oleaginosas del Bajío',
      chofer: 'Juan Carlos Mendoza',
      fecha: '2024-12-10',
      estatus: 'Peso Bruto',
      pesoBruto: 45200,
      tipoTransporte: 'Camión'
    },
    { 
      id: 2, 
      folio: '0-03-0002',
      producto: 'Frijol Soya', 
      proveedor: 'Granos del Norte',
      chofer: 'Pedro Ramírez',
      fecha: '2024-12-10',
      estatus: 'Pendiente',
      tipoTransporte: 'Ferroviaria'
    },
    { 
      id: 3, 
      folio: '0-04-0003',
      producto: 'Maíz', 
      proveedor: 'Agrícola del Centro',
      chofer: 'Miguel Torres',
      fecha: '2024-12-10',
      estatus: 'Completado',
      pesoBruto: 38500,
      pesoTara: 14200,
      pesoNeto: 24300,
      tipoTransporte: 'Camión'
    },
    { 
      id: 4, 
      folio: '0-03-0004',
      producto: 'Frijol Soya', 
      proveedor: 'Exportadora de Granos',
      chofer: 'Roberto Sánchez',
      fecha: '2024-12-09',
      estatus: 'Completado',
      pesoBruto: 52100,
      pesoTara: 15800,
      pesoNeto: 36300,
      tipoTransporte: 'Camión'
    },
  ]);

  const getEstatusBadge = (estatus: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      'Pendiente': { className: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3 mr-1" /> },
      'Peso Bruto': { className: 'bg-blue-100 text-blue-700', icon: <Scale className="h-3 w-3 mr-1" /> },
      'En Descarga': { className: 'bg-orange-100 text-orange-700', icon: <Truck className="h-3 w-3 mr-1" /> },
      'Peso Tara': { className: 'bg-purple-100 text-purple-700', icon: <Scale className="h-3 w-3 mr-1" /> },
      'Completado': { className: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    };
    const { className, icon } = config[estatus] || { className: 'bg-muted', icon: null };
    return <Badge className={`flex items-center w-fit ${className}`}>{icon}{estatus}</Badge>;
  };

  const handleRowClick = (recepcion: Recepcion) => {
    setSelectedRecepcion(recepcion);
    setIsDialogOpen(true);
  };

  const filteredRecepciones = recepciones.filter(r => 
    r.producto.toLowerCase().includes(search.toLowerCase()) ||
    r.proveedor.toLowerCase().includes(search.toLowerCase()) ||
    r.folio.includes(search) ||
    r.chofer.toLowerCase().includes(search.toLowerCase())
  );

  const formatNumber = (num?: number) => num ? num.toLocaleString('es-MX') : '-';

  return (
    <Layout>
      <Header title="Reciba" subtitle="Báscula - Recepción de materia prima" />
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Espera</CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{recepciones.filter(r => r.estatus === 'Pendiente').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Báscula</CardTitle>
              <Scale className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{recepciones.filter(r => r.estatus === 'Peso Bruto' || r.estatus === 'Peso Tara').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Descarga</CardTitle>
              <Truck className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{recepciones.filter(r => r.estatus === 'En Descarga').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completados Hoy</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{recepciones.filter(r => r.estatus === 'Completado').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por folio, producto, proveedor o chofer..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Recepciones del Día
            </CardTitle>
            <CardDescription>Haz clic en una fila para abrir el formulario de báscula</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Folio</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Chofer</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estatus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecepciones.map((recepcion) => (
                  <TableRow 
                    key={recepcion.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(recepcion)}
                  >
                    <TableCell className="font-medium">{recepcion.producto}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{recepcion.folio}</Badge>
                    </TableCell>
                    <TableCell>{recepcion.proveedor}</TableCell>
                    <TableCell>{recepcion.chofer}</TableCell>
                    <TableCell>{recepcion.fecha}</TableCell>
                    <TableCell>{getEstatusBadge(recepcion.estatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Formulario de Báscula Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedRecepcion && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Boleta de Recepción - {selectedRecepcion.folio}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Header Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">Fecha/Hora</Label>
                      <p className="font-medium">{selectedRecepcion.fecha} 10:30</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Folio</Label>
                      <p className="font-medium font-mono">{selectedRecepcion.folio}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Producto</Label>
                      <p className="font-medium">{selectedRecepcion.producto}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Proveedor</Label>
                      <p className="font-medium">{selectedRecepcion.proveedor}</p>
                    </div>
                  </div>

                  {/* Tipo de Transporte Tabs */}
                  <Tabs defaultValue={selectedRecepcion.tipoTransporte.toLowerCase()} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="camión" className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Camión
                      </TabsTrigger>
                      <TabsTrigger value="ferroviaria" className="flex items-center gap-2">
                        <Train className="h-4 w-4" />
                        Ferroviaria
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="camión" className="mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Chofer</Label>
                          <Input value={selectedRecepcion.chofer} readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label>Placas</Label>
                          <Input placeholder="ABC-123-A" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="ferroviaria" className="mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Número de Carro</Label>
                          <Input placeholder="FERR-12345" />
                        </div>
                        <div className="space-y-2">
                          <Label>Línea Ferroviaria</Label>
                          <Input placeholder="Ferromex" />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Separator />

                  {/* Pesos - BRUTO → TARA → NETO para Reciba */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Registro de Pesos (Kg)
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="border-2 border-blue-200 bg-blue-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-blue-700">Peso Bruto</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Input 
                            type="number" 
                            className="text-2xl font-bold text-center h-14"
                            value={selectedRecepcion.pesoBruto || ''}
                            placeholder="0"
                          />
                          <Button className="w-full mt-2" size="sm">
                            Capturar Peso
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-orange-200 bg-orange-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-orange-700">Peso Tara</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Input 
                            type="number" 
                            className="text-2xl font-bold text-center h-14"
                            value={selectedRecepcion.pesoTara || ''}
                            placeholder="0"
                          />
                          <Button className="w-full mt-2" size="sm" variant="outline">
                            Capturar Peso
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-green-200 bg-green-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-green-700">Peso Neto</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-center h-14 flex items-center justify-center bg-background rounded-md border">
                            {selectedRecepcion.pesoNeto ? formatNumber(selectedRecepcion.pesoNeto) : 
                              (selectedRecepcion.pesoBruto && selectedRecepcion.pesoTara) ? 
                                formatNumber(selectedRecepcion.pesoBruto - selectedRecepcion.pesoTara) : '0'}
                          </div>
                          <p className="text-xs text-center text-muted-foreground mt-2">Calculado automáticamente</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Análisis dinámicos */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Análisis de Calidad
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Humedad (%)</Label>
                        <Input type="number" step="0.1" placeholder="0.0" />
                        <p className="text-xs text-muted-foreground">Rango: 0-14%</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Impurezas (%)</Label>
                        <Input type="number" step="0.1" placeholder="0.0" />
                        <p className="text-xs text-muted-foreground">Rango: 0-2%</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Granos Dañados (%)</Label>
                        <Input type="number" step="0.1" placeholder="0.0" />
                        <p className="text-xs text-muted-foreground">Rango: 0-5%</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Aflatoxinas (ppb)</Label>
                        <Input type="number" step="0.1" placeholder="0.0" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Descuentos calculados */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Descuentos Aplicados</h4>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span>Humedad:</span>
                          <span className="font-medium text-destructive">-0.0%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Impurezas:</span>
                          <span className="font-medium text-destructive">-0.0%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Granos Dañados:</span>
                          <span className="font-medium text-destructive">-0.0%</span>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Peso Neto Final:</span>
                        <span className="text-primary">{formatNumber(selectedRecepcion.pesoNeto || 0)} Kg</span>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Guardar Boleta
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Reciba;
