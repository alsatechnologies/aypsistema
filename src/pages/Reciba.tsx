import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Scale, Truck, Train, Clock, CheckCircle, FileText, Printer, Save, BookmarkPlus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import AnalisisDinamico from '@/components/reciba/AnalisisDinamico';
import DescuentosPanel from '@/components/reciba/DescuentosPanel';
import SellosSection from '@/components/reciba/SellosSection';
import NuevaOperacionDialog from '@/components/reciba/NuevaOperacionDialog';
import { generarBoletaEntradas } from '@/utils/folioGenerator';

interface Recepcion {
  id: number;
  folio: string;
  producto: string;
  proveedor: string;
  chofer: string;
  placas: string;
  fecha: string;
  estatus: 'Pendiente' | 'Peso Bruto' | 'En Descarga' | 'Peso Tara' | 'Completado';
  pesoBruto?: number;
  pesoTara?: number;
  pesoNeto?: number;
  tipoTransporte: 'Camión' | 'Ferroviaria';
  tipoBascula?: 'Camión' | 'Ferroviaria';
  sellos?: {
    selloEntrada1: string;
    selloEntrada2: string;
    selloSalida1: string;
    selloSalida2: string;
  };
  analisis?: Record<string, number>;
}

const Reciba = () => {
  const [search, setSearch] = useState('');
  const [selectedRecepcion, setSelectedRecepcion] = useState<Recepcion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNuevaOperacionOpen, setIsNuevaOperacionOpen] = useState(false);
  const [tipoBascula, setTipoBascula] = useState<'Camión' | 'Ferroviaria'>('Camión');
  
  // Estado del formulario
  const [pesoBruto, setPesoBruto] = useState<number>(0);
  const [pesoTara, setPesoTara] = useState<number>(0);
  const [valoresAnalisis, setValoresAnalisis] = useState<Record<string, number>>({});
  const [sellos, setSellos] = useState({
    selloEntrada1: '',
    selloEntrada2: '',
    selloSalida1: '',
    selloSalida2: '',
  });

  const [recepciones, setRecepciones] = useState<Recepcion[]>([
    { 
      id: 1, 
      folio: '0-03-0001',
      producto: 'Frijol Soya', 
      proveedor: 'Oleaginosas del Bajío',
      chofer: 'Juan Carlos Mendoza',
      placas: 'ABC-123-A',
      fecha: '2024-12-10',
      estatus: 'Peso Bruto',
      pesoBruto: 45200,
      tipoTransporte: 'Camión',
      tipoBascula: 'Camión',
      sellos: { selloEntrada1: 'AP-001', selloEntrada2: 'AP-002', selloSalida1: '', selloSalida2: '' }
    },
    { 
      id: 2, 
      folio: '0-03-0002',
      producto: 'Frijol Soya', 
      proveedor: 'Granos del Norte',
      chofer: 'Pedro Ramírez',
      placas: 'XYZ-789-B',
      fecha: '2024-12-10',
      estatus: 'Pendiente',
      tipoTransporte: 'Ferroviaria'
    },
    { 
      id: 3, 
      folio: '0-06-0003',
      producto: 'Maíz', 
      proveedor: 'Agrícola del Centro',
      chofer: 'Miguel Torres',
      placas: 'DEF-456-C',
      fecha: '2024-12-10',
      estatus: 'Completado',
      pesoBruto: 38500,
      pesoTara: 14200,
      pesoNeto: 24300,
      tipoTransporte: 'Camión',
      tipoBascula: 'Camión',
      analisis: { Humedad: 13.5, Impurezas: 1.8, 'Granos Dañados': 2.5 }
    },
    { 
      id: 4, 
      folio: '0-03-0004',
      producto: 'Frijol Soya', 
      proveedor: 'Exportadora de Granos',
      chofer: 'Roberto Sánchez',
      placas: 'GHI-321-D',
      fecha: '2024-12-09',
      estatus: 'Completado',
      pesoBruto: 52100,
      pesoTara: 15800,
      pesoNeto: 36300,
      tipoTransporte: 'Camión',
      tipoBascula: 'Camión'
    },
  ]);

  // Sincronizar estado del formulario cuando se selecciona una recepción
  useEffect(() => {
    if (selectedRecepcion) {
      setPesoBruto(selectedRecepcion.pesoBruto || 0);
      setPesoTara(selectedRecepcion.pesoTara || 0);
      setValoresAnalisis(selectedRecepcion.analisis || {});
      setSellos(selectedRecepcion.sellos || {
        selloEntrada1: '',
        selloEntrada2: '',
        selloSalida1: '',
        selloSalida2: '',
      });
      setTipoBascula(selectedRecepcion.tipoBascula || selectedRecepcion.tipoTransporte || 'Camión');
    }
  }, [selectedRecepcion]);

  const pesoNeto = pesoBruto - pesoTara;

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

  const getTransporteBadge = (tipo: string) => {
    if (tipo === 'Ferroviaria') {
      return <Badge variant="outline" className="flex items-center gap-1"><Train className="h-3 w-3" />Ferroviaria</Badge>;
    }
    return <Badge variant="outline" className="flex items-center gap-1"><Truck className="h-3 w-3" />Camión</Badge>;
  };

  const handleRowClick = (recepcion: Recepcion) => {
    setSelectedRecepcion(recepcion);
    setIsDialogOpen(true);
  };

  const handleAnalisisChange = (nombre: string, valor: number) => {
    setValoresAnalisis(prev => ({ ...prev, [nombre]: valor }));
  };

  const handleCrearOperacion = (operacion: {
    producto: string;
    proveedor: string;
    chofer: string;
    placas: string;
    tipoTransporte: 'Camión' | 'Ferroviaria';
  }) => {
    const nuevoId = Math.max(...recepciones.map(r => r.id)) + 1;
    const nuevaBoleta = generarBoletaEntradas(operacion.producto, recepciones.length + 1);
    
    const nuevaRecepcion: Recepcion = {
      id: nuevoId,
      folio: nuevaBoleta,
      producto: operacion.producto,
      proveedor: operacion.proveedor,
      chofer: operacion.chofer,
      placas: operacion.placas,
      fecha: new Date().toISOString().split('T')[0],
      estatus: 'Pendiente',
      tipoTransporte: operacion.tipoTransporte,
    };

    setRecepciones(prev => [nuevaRecepcion, ...prev]);
  };

  const handlePreGuardar = () => {
    if (!selectedRecepcion) return;
    
    const nuevoEstatus = pesoBruto > 0 && pesoTara === 0 ? 'Peso Bruto' : 
                         pesoBruto > 0 && pesoTara > 0 ? 'Peso Tara' : 'Pendiente';
    
    setRecepciones(prev => prev.map(r => 
      r.id === selectedRecepcion.id ? {
        ...r,
        pesoBruto,
        pesoTara,
        pesoNeto: pesoNeto > 0 ? pesoNeto : undefined,
        sellos,
        analisis: valoresAnalisis,
        estatus: nuevoEstatus,
        tipoBascula
      } : r
    ));
    
    toast.success('Datos pre-guardados correctamente');
  };

  const handleGuardarBoleta = () => {
    if (!selectedRecepcion) return;
    
    if (pesoBruto <= 0) {
      toast.error('Debe registrar el peso bruto');
      return;
    }
    if (pesoTara <= 0) {
      toast.error('Debe registrar el peso tara');
      return;
    }
    
    setRecepciones(prev => prev.map(r => 
      r.id === selectedRecepcion.id ? {
        ...r,
        pesoBruto,
        pesoTara,
        pesoNeto,
        sellos,
        analisis: valoresAnalisis,
        estatus: 'Completado',
        tipoBascula
      } : r
    ));
    
    toast.success('Boleta guardada correctamente');
    setIsDialogOpen(false);
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

        {/* Search y Nueva Operación */}
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
          <Button onClick={() => setIsNuevaOperacionOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Operación
          </Button>
        </div>

        {/* Tabla unificada de recepciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Recepciones Pendientes
            </CardTitle>
            <CardDescription>Haz clic en una fila para abrir el formulario de báscula</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Folio</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Chofer</TableHead>
                  <TableHead>Placas</TableHead>
                  <TableHead>Transporte</TableHead>
                  <TableHead>Estatus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecepciones.length > 0 ? filteredRecepciones.map((recepcion) => (
                  <TableRow 
                    key={recepcion.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(recepcion)}
                  >
                    <TableCell className="font-mono font-bold text-primary">{recepcion.folio}</TableCell>
                    <TableCell className="font-medium">{recepcion.producto}</TableCell>
                    <TableCell>{recepcion.proveedor}</TableCell>
                    <TableCell>{recepcion.chofer}</TableCell>
                    <TableCell className="font-mono">{recepcion.placas}</TableCell>
                    <TableCell>{getTransporteBadge(recepcion.tipoTransporte)}</TableCell>
                    <TableCell>{getEstatusBadge(recepcion.estatus)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No hay recepciones pendientes
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog Nueva Operación */}
        <NuevaOperacionDialog 
          open={isNuevaOperacionOpen}
          onOpenChange={setIsNuevaOperacionOpen}
          onCrear={handleCrearOperacion}
        />

        {/* Formulario de Báscula Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            {selectedRecepcion && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Boleta de Recepción - {selectedRecepcion.folio}
                    <span className="ml-2">{getEstatusBadge(selectedRecepcion.estatus)}</span>
                    {getTransporteBadge(selectedRecepcion.tipoTransporte)}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Header Info */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">Fecha/Hora</Label>
                      <p className="font-medium">{selectedRecepcion.fecha} 10:30</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Folio</Label>
                      <p className="font-medium font-mono text-primary">{selectedRecepcion.folio}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Producto</Label>
                      <p className="font-medium">{selectedRecepcion.producto}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Proveedor</Label>
                      <p className="font-medium">{selectedRecepcion.proveedor}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Chofer / Placas</Label>
                      <p className="font-medium">{selectedRecepcion.chofer}</p>
                      <p className="text-sm font-mono text-muted-foreground">{selectedRecepcion.placas}</p>
                    </div>
                  </div>

                  {/* Selección de Báscula */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Tipo de Báscula
                    </h4>
                    <RadioGroup 
                      value={tipoBascula} 
                      onValueChange={(v) => setTipoBascula(v as 'Camión' | 'Ferroviaria')}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Camión" id="bascula-camion" />
                        <Label htmlFor="bascula-camion" className="flex items-center gap-2 cursor-pointer">
                          <Truck className="h-4 w-4" />
                          Báscula Camión
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Ferroviaria" id="bascula-ferroviaria" />
                        <Label htmlFor="bascula-ferroviaria" className="flex items-center gap-2 cursor-pointer">
                          <Train className="h-4 w-4" />
                          Báscula Ferroviaria
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Sellos */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Sellos de Seguridad
                    </h4>
                    <SellosSection 
                      sellos={sellos} 
                      onChange={setSellos}
                      readOnlyEntrada={selectedRecepcion.estatus !== 'Pendiente'}
                    />
                  </div>

                  <Separator />

                  {/* Pesos - BRUTO → TARA → NETO para Reciba */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Registro de Pesos (Kg) - Orden: Bruto → Descarga → Tara
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="border-2 border-blue-200 bg-blue-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-blue-700">1. Peso Bruto</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Input 
                            type="number" 
                            className="text-2xl font-bold text-center h-14"
                            value={pesoBruto || ''}
                            onChange={(e) => setPesoBruto(parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                          <Button className="w-full mt-2" size="sm">
                            Capturar Peso
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-orange-200 bg-orange-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-orange-700">2. Peso Tara</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Input 
                            type="number" 
                            className="text-2xl font-bold text-center h-14"
                            value={pesoTara || ''}
                            onChange={(e) => setPesoTara(parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                          <Button className="w-full mt-2" size="sm" variant="outline">
                            Capturar Peso
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-green-200 bg-green-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-green-700">3. Peso Neto</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-center h-14 flex items-center justify-center bg-white rounded-md border">
                            {pesoNeto > 0 ? formatNumber(pesoNeto) : '0'}
                          </div>
                          <p className="text-xs text-center text-muted-foreground mt-2">Calculado automáticamente</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Análisis dinámicos según producto */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Análisis de Calidad - {selectedRecepcion.producto}
                    </h4>
                    <AnalisisDinamico 
                      producto={selectedRecepcion.producto}
                      valores={valoresAnalisis}
                      onChange={handleAnalisisChange}
                    />
                  </div>

                  <Separator />

                  {/* Descuentos calculados */}
                  <DescuentosPanel 
                    producto={selectedRecepcion.producto}
                    valoresAnalisis={valoresAnalisis}
                    pesoNeto={pesoNeto > 0 ? pesoNeto : 0}
                  />
                </div>

                <DialogFooter className="mt-6 gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handlePreGuardar}
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    Pre-Guardar
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                    onClick={handleGuardarBoleta}
                  >
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
