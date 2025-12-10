import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Scale, Truck, Train, Clock, CheckCircle, FileText, Printer, Save, Ship, Plus, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import SellosSection from '@/components/reciba/SellosSection';
import AnalisisDinamico from '@/components/reciba/AnalisisDinamico';
import DescuentosPanel from '@/components/reciba/DescuentosPanel';
import NuevoEmbarqueDialog from '@/components/embarque/NuevoEmbarqueDialog';
import BoletaEmbarqueDialog from '@/components/embarque/BoletaEmbarqueDialog';
import { generateNumeroBoleta, TipoOperacion } from '@/utils/folioGenerator';
import { toast } from 'sonner';

interface Embarque {
  id: number;
  folio: string;
  producto: string;
  cliente: string;
  chofer: string;
  destino: string;
  fecha: string;
  estatus: 'Pendiente' | 'Peso Tara' | 'En Carga' | 'Peso Bruto' | 'Completado';
  pesoBruto?: number;
  pesoTara?: number;
  pesoNeto?: number;
  tipoTransporte: 'Camión' | 'Ferroviaria';
  tipoEmbarque: 'Nacional' | 'Exportación';
  sellos?: {
    selloEntrada1: string;
    selloEntrada2: string;
    selloSalida1: string;
    selloSalida2: string;
  };
  valoresAnalisis?: Record<string, number>;
}

const EmbarquePage = () => {
  const [search, setSearch] = useState('');
  const [selectedEmbarque, setSelectedEmbarque] = useState<Embarque | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNuevoDialogOpen, setIsNuevoDialogOpen] = useState(false);
  const [isBoletaDialogOpen, setIsBoletaDialogOpen] = useState(false);
  const [consecutivo, setConsecutivo] = useState(5);

  const [embarques, setEmbarques] = useState<Embarque[]>([
    { 
      id: 1, 
      folio: '1-01-0001',
      producto: 'Aceite Crudo de Soya', 
      cliente: 'Aceites del Pacífico SA',
      chofer: 'Juan Carlos Mendoza',
      destino: 'Guadalajara, JAL',
      fecha: '2024-12-10',
      estatus: 'Peso Tara',
      pesoTara: 15200,
      tipoTransporte: 'Camión',
      tipoEmbarque: 'Nacional',
      sellos: { selloEntrada1: '', selloEntrada2: '', selloSalida1: '', selloSalida2: '' },
      valoresAnalisis: {}
    },
    { 
      id: 2, 
      folio: '1-02-0002',
      producto: 'Pasta de Soya', 
      cliente: 'Alimentos Balanceados MX',
      chofer: 'Pedro Ramírez',
      destino: 'Monterrey, NL',
      fecha: '2024-12-10',
      estatus: 'Pendiente',
      tipoTransporte: 'Camión',
      tipoEmbarque: 'Nacional',
      sellos: { selloEntrada1: '', selloEntrada2: '', selloSalida1: '', selloSalida2: '' },
      valoresAnalisis: {}
    },
    { 
      id: 3, 
      folio: '2-01-0003',
      producto: 'Aceite Crudo de Soya', 
      cliente: 'Export Foods Inc.',
      chofer: 'Miguel Torres',
      destino: 'Houston, TX',
      fecha: '2024-12-10',
      estatus: 'Completado',
      pesoBruto: 48500,
      pesoTara: 14200,
      pesoNeto: 34300,
      tipoTransporte: 'Ferroviaria',
      tipoEmbarque: 'Exportación',
      sellos: { selloEntrada1: 'SEL-001', selloEntrada2: 'SEL-002', selloSalida1: 'SEL-003', selloSalida2: 'SEL-004' },
      valoresAnalisis: {}
    },
    { 
      id: 4, 
      folio: '1-01-0004',
      producto: 'Aceite Crudo de Soya', 
      cliente: 'Industrias Graseras',
      chofer: 'Roberto Sánchez',
      destino: 'CDMX',
      fecha: '2024-12-09',
      estatus: 'Completado',
      pesoBruto: 52100,
      pesoTara: 15800,
      pesoNeto: 36300,
      tipoTransporte: 'Camión',
      tipoEmbarque: 'Nacional',
      sellos: { selloEntrada1: 'SEL-005', selloEntrada2: 'SEL-006', selloSalida1: 'SEL-007', selloSalida2: 'SEL-008' },
      valoresAnalisis: {}
    },
  ]);

  const [formData, setFormData] = useState({
    sellos: { selloEntrada1: '', selloEntrada2: '', selloSalida1: '', selloSalida2: '' },
    valoresAnalisis: {} as Record<string, number>,
    pesoBruto: 0,
    pesoTara: 0
  });

  const getEstatusBadge = (estatus: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      'Pendiente': { className: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3 mr-1" /> },
      'Peso Tara': { className: 'bg-purple-100 text-purple-700', icon: <Scale className="h-3 w-3 mr-1" /> },
      'En Carga': { className: 'bg-orange-100 text-orange-700', icon: <Truck className="h-3 w-3 mr-1" /> },
      'Peso Bruto': { className: 'bg-blue-100 text-blue-700', icon: <Scale className="h-3 w-3 mr-1" /> },
      'Completado': { className: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    };
    const { className, icon } = config[estatus] || { className: 'bg-muted', icon: null };
    return <Badge className={`flex items-center w-fit ${className}`}>{icon}{estatus}</Badge>;
  };

  const getTipoEmbarqueBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      'Nacional': 'bg-blue-500 text-white',
      'Exportación': 'bg-purple-500 text-white',
    };
    return <Badge className={colors[tipo]}>{tipo}</Badge>;
  };

  const getTransporteIcon = (tipo: string) => {
    return tipo === 'Camión' ? <Truck className="h-4 w-4 text-muted-foreground" /> : <Train className="h-4 w-4 text-muted-foreground" />;
  };

  const handleRowClick = (embarque: Embarque) => {
    setSelectedEmbarque(embarque);
    setFormData({
      sellos: embarque.sellos || { selloEntrada1: '', selloEntrada2: '', selloSalida1: '', selloSalida2: '' },
      valoresAnalisis: embarque.valoresAnalisis || {},
      pesoBruto: embarque.pesoBruto || 0,
      pesoTara: embarque.pesoTara || 0
    });
    setIsDialogOpen(true);
  };

  const handleNuevoEmbarque = (data: {
    producto: string;
    cliente: string;
    destino: string;
    chofer: string;
    tipoTransporte: 'Camión' | 'Ferroviaria';
    tipoEmbarque: 'Nacional' | 'Exportación';
  }) => {
    const tipoOperacion: TipoOperacion = data.tipoEmbarque === 'Nacional' ? 'Embarque Nacional' : 'Embarque Exportación';
    const nuevoFolio = generateNumeroBoleta(tipoOperacion, data.producto, consecutivo);
    
    const nuevoEmbarque: Embarque = {
      id: embarques.length + 1,
      folio: nuevoFolio,
      producto: data.producto,
      cliente: data.cliente,
      destino: data.destino,
      chofer: data.chofer,
      fecha: new Date().toISOString().split('T')[0],
      estatus: 'Pendiente',
      tipoTransporte: data.tipoTransporte,
      tipoEmbarque: data.tipoEmbarque,
      sellos: { selloEntrada1: '', selloEntrada2: '', selloSalida1: '', selloSalida2: '' },
      valoresAnalisis: {}
    };

    setEmbarques([nuevoEmbarque, ...embarques]);
    setConsecutivo(consecutivo + 1);
  };

  const handlePreviewBoleta = () => {
    setIsBoletaDialogOpen(true);
  };

  const handleGuardar = () => {
    if (!selectedEmbarque) return;
    
    const pesoNeto = formData.pesoBruto - formData.pesoTara;
    
    setEmbarques(embarques.map(e => 
      e.id === selectedEmbarque.id 
        ? { 
            ...e, 
            sellos: formData.sellos, 
            valoresAnalisis: formData.valoresAnalisis,
            pesoBruto: formData.pesoBruto,
            pesoTara: formData.pesoTara,
            pesoNeto: pesoNeto,
            estatus: 'Completado' as const
          }
        : e
    ));
    
    setIsDialogOpen(false);
    toast.success('Embarque guardado correctamente');
  };

  const filteredEmbarques = embarques.filter(e => 
    e.producto.toLowerCase().includes(search.toLowerCase()) ||
    e.cliente.toLowerCase().includes(search.toLowerCase()) ||
    e.folio.includes(search) ||
    e.chofer.toLowerCase().includes(search.toLowerCase())
  );

  const formatNumber = (num?: number) => num ? num.toLocaleString('es-MX') : '-';

  return (
    <Layout>
      <Header title="Embarque" subtitle="Báscula - Salida de producto terminado" />
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Espera</CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{embarques.filter(e => e.estatus === 'Pendiente').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Báscula</CardTitle>
              <Scale className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{embarques.filter(e => e.estatus === 'Peso Tara' || e.estatus === 'Peso Bruto').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Carga</CardTitle>
              <Truck className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{embarques.filter(e => e.estatus === 'En Carga').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completados Hoy</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{embarques.filter(e => e.estatus === 'Completado').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and New Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por folio, producto, cliente o chofer..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsNuevoDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Embarque
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              Embarques del Día
            </CardTitle>
            <CardDescription>Haz clic en una fila para abrir el formulario de báscula</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Transporte</TableHead>
                  <TableHead>Chofer</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estatus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmbarques.map((embarque) => (
                  <TableRow 
                    key={embarque.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(embarque)}
                  >
                    <TableCell>
                      <Badge variant="outline" className="font-mono font-bold text-primary">{embarque.folio}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{embarque.producto}</TableCell>
                    <TableCell>{embarque.cliente}</TableCell>
                    <TableCell>{embarque.destino}</TableCell>
                    <TableCell>{getTipoEmbarqueBadge(embarque.tipoEmbarque)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {getTransporteIcon(embarque.tipoTransporte)}
                        {embarque.tipoTransporte}
                      </span>
                    </TableCell>
                    <TableCell>{embarque.chofer}</TableCell>
                    <TableCell>{embarque.fecha}</TableCell>
                    <TableCell>{getEstatusBadge(embarque.estatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Formulario de Báscula Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedEmbarque && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Boleta de Embarque - {selectedEmbarque.folio}
                    {selectedEmbarque.tipoEmbarque === 'Exportación' && (
                      <Badge className="bg-purple-500 text-white ml-2">Exportación</Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Header Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">Fecha/Hora</Label>
                      <p className="font-medium">{selectedEmbarque.fecha} 14:30</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Folio</Label>
                      <p className="font-medium font-mono">{selectedEmbarque.folio}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Producto</Label>
                      <p className="font-medium">{selectedEmbarque.producto}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Cliente</Label>
                      <p className="font-medium">{selectedEmbarque.cliente}</p>
                    </div>
                  </div>

                  {/* Destino */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Label className="text-xs text-blue-700">Destino</Label>
                    <p className="font-medium text-lg">{selectedEmbarque.destino}</p>
                  </div>

                  {/* Tipo de Transporte Tabs */}
                  <Tabs defaultValue={selectedEmbarque.tipoTransporte.toLowerCase()} className="w-full">
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
                          <Input value={selectedEmbarque.chofer} readOnly />
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

                  {/* Sellos */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Sellos de Seguridad</h4>
                    <SellosSection 
                      sellos={formData.sellos}
                      onChange={(sellos) => setFormData({ ...formData, sellos })}
                    />
                  </div>

                  <Separator />

                  {/* Pesos - TARA → BRUTO → NETO para Embarque */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Registro de Pesos (Kg) - Embarque: Tara → Bruto → Neto
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="border-2 border-orange-200 bg-orange-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-orange-700">1. Peso Tara (Vacío)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Input 
                            type="number" 
                            className="text-2xl font-bold text-center h-14"
                            value={formData.pesoTara || ''}
                            onChange={(e) => setFormData({ ...formData, pesoTara: Number(e.target.value) })}
                            placeholder="0"
                          />
                          <Button className="w-full mt-2" size="sm">
                            Capturar Peso
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-blue-200 bg-blue-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-blue-700">2. Peso Bruto (Cargado)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Input 
                            type="number" 
                            className="text-2xl font-bold text-center h-14"
                            value={formData.pesoBruto || ''}
                            onChange={(e) => setFormData({ ...formData, pesoBruto: Number(e.target.value) })}
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
                            {formData.pesoBruto && formData.pesoTara ? 
                              formatNumber(formData.pesoBruto - formData.pesoTara) : '0'}
                          </div>
                          <p className="text-xs text-center text-muted-foreground mt-2">Bruto - Tara</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Análisis Dinámico */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Análisis de Calidad
                    </h4>
                    <AnalisisDinamico
                      producto={selectedEmbarque.producto}
                      valores={formData.valoresAnalisis}
                      onChange={(valores) => setFormData({ ...formData, valoresAnalisis: valores })}
                    />
                  </div>

                  {/* Descuentos Panel */}
                  {formData.pesoBruto > 0 && formData.pesoTara > 0 && (
                    <>
                      <Separator />
                      <DescuentosPanel
                        producto={selectedEmbarque.producto}
                        valoresAnalisis={formData.valoresAnalisis}
                        pesoNeto={formData.pesoBruto - formData.pesoTara}
                      />
                    </>
                  )}

                  <Separator />

                  {/* Resumen */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Resumen de Embarque</h4>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span>Producto:</span>
                          <span className="font-medium">{selectedEmbarque.producto}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Destino:</span>
                          <span className="font-medium">{selectedEmbarque.destino}</span>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Peso Neto Embarcado:</span>
                        <span className="text-primary">
                          {formatNumber(formData.pesoBruto - formData.pesoTara)} Kg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button variant="outline" onClick={handlePreviewBoleta} className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Vista Previa
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                  <Button onClick={handleGuardar} className="bg-primary hover:bg-primary/90 flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Guardar Boleta
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Nuevo Embarque Dialog */}
        <NuevoEmbarqueDialog
          open={isNuevoDialogOpen}
          onOpenChange={setIsNuevoDialogOpen}
          onCrear={handleNuevoEmbarque}
        />

        {/* Boleta Preview Dialog */}
        <BoletaEmbarqueDialog
          open={isBoletaDialogOpen}
          onOpenChange={setIsBoletaDialogOpen}
          embarque={selectedEmbarque ? {
            folio: selectedEmbarque.folio,
            producto: selectedEmbarque.producto,
            cliente: selectedEmbarque.cliente,
            destino: selectedEmbarque.destino,
            chofer: selectedEmbarque.chofer,
            fecha: selectedEmbarque.fecha,
            tipoTransporte: selectedEmbarque.tipoTransporte,
            tipoEmbarque: selectedEmbarque.tipoEmbarque,
            estatus: selectedEmbarque.estatus,
            pesoBruto: formData.pesoBruto,
            pesoTara: formData.pesoTara,
            pesoNeto: formData.pesoBruto - formData.pesoTara,
            sellos: formData.sellos
          } : null}
        />
      </div>
    </Layout>
  );
};

export default EmbarquePage;
