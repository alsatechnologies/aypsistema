import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Scale, Truck, Train, Clock, CheckCircle, FileText, Printer, Save, Ship, Plus, Eye, BookmarkPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import SellosSection from '@/components/reciba/SellosSection';
import AnalisisDinamico from '@/components/reciba/AnalisisDinamico';
import DescuentosPanel from '@/components/reciba/DescuentosPanel';
import NuevoEmbarqueDialog from '@/components/embarque/NuevoEmbarqueDialog';
import BoletaEmbarqueDialog from '@/components/embarque/BoletaEmbarqueDialog';
import { generateNumeroBoleta, TipoOperacion } from '@/utils/folioGenerator';
import { toast } from 'sonner';
import { generarCodigoLoteParaOperacion } from '@/services/supabase/lotes';
import { useEmbarques } from '@/services/hooks/useEmbarques';
import { useProductos } from '@/services/hooks/useProductos';
import { useClientes } from '@/services/hooks/useClientes';
import { useAlmacenes } from '@/services/hooks/useAlmacenes';
import { getProductoConAnalisis } from '@/services/supabase/productos';
import { createMovimiento } from '@/services/supabase/movimientos';
import { getCurrentDateTimeMST, formatDateTimeMST } from '@/utils/dateUtils';
import type { Embarque as EmbarqueDB } from '@/services/supabase/embarques';
import { getScaleWeight, PREDEFINED_SCALES } from '@/services/api/scales';

interface Embarque {
  id: number;
  boleta: string;
  producto: string;
  cliente: string;
  chofer?: string | null;
  placas?: string | null;
  destino?: string | null;
  fecha: string;
  estatus: 'Pendiente' | 'Peso Tara' | 'En Carga' | 'Peso Bruto' | 'Completado';
  pesoBruto?: number | null;
  pesoTara?: number | null;
  pesoNeto?: number | null;
  tipoTransporte?: string | null;
  tipoEmbarque?: string | null;
  sellos?: {
    selloEntrada1: string;
    selloEntrada2: string;
    selloSalida1: string;
    selloSalida2: string;
  };
  valoresAnalisis?: Record<string, number> | null;
  codigoLote?: string | null;
  clienteId?: number | null;
  productoId?: number | null;
  almacenId?: number | null;
}

const EmbarquePage = () => {
  const { embarques: embarquesDB, loading, loadingMore, hasMore, addEmbarque, updateEmbarque, loadEmbarques, loadMore } = useEmbarques();
  const { productos: productosDB } = useProductos();
  const { clientes: clientesDB } = useClientes();
  const { almacenes: almacenesDB } = useAlmacenes();
  
  const [search, setSearch] = useState('');
  const [selectedEmbarque, setSelectedEmbarque] = useState<Embarque | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNuevoDialogOpen, setIsNuevoDialogOpen] = useState(false);
  const [isBoletaDialogOpen, setIsBoletaDialogOpen] = useState(false);
  const [consecutivo, setConsecutivo] = useState(5);

  // Mapear embarques de DB a formato local
  const embarques: Embarque[] = embarquesDB.map(e => ({
    id: e.id,
    boleta: e.boleta,
    producto: e.producto?.nombre || '',
    cliente: e.cliente?.empresa || '',
    chofer: e.chofer,
    placas: e.placas,
    destino: e.destino,
    fecha: e.fecha,
    estatus: e.estatus as any,
    pesoBruto: e.peso_bruto,
    pesoTara: e.peso_tara,
    pesoNeto: e.peso_neto,
    tipoTransporte: e.tipo_transporte as any,
    tipoEmbarque: e.tipo_embarque as any,
    sellos: e.sello_entrada_1 || e.sello_entrada_2 || e.sello_salida_1 || e.sello_salida_2 ? {
      selloEntrada1: e.sello_entrada_1 || '',
      selloEntrada2: e.sello_entrada_2 || '',
      selloSalida1: e.sello_salida_1 || '',
      selloSalida2: e.sello_salida_2 || ''
    } : undefined,
    valoresAnalisis: e.valores_analisis as Record<string, number> | null,
    codigoLote: e.codigo_lote,
    clienteId: e.cliente_id,
    productoId: e.producto_id,
    almacenId: e.almacen_id
  }));

  const [formData, setFormData] = useState({
    sellos: { selloEntrada1: '', selloEntrada2: '', selloSalida1: '', selloSalida2: '' },
    valoresAnalisis: {} as Record<string, number>,
    pesoBruto: 0,
    pesoTara: 0,
    almacenId: null as number | null,
    placas: ''
  });

  const [analisisProducto, setAnalisisProducto] = useState<any[]>([]);
  const [horaPesoTara, setHoraPesoTara] = useState<string | null>(null);
  const [horaPesoBruto, setHoraPesoBruto] = useState<string | null>(null);
  const [horaPesoNeto, setHoraPesoNeto] = useState<string | null>(null);

  // Cargar análisis cuando se selecciona un embarque
  useEffect(() => {
    const cargarAnalisis = async () => {
      if (selectedEmbarque?.productoId) {
        try {
          const productoCompleto = await getProductoConAnalisis(selectedEmbarque.productoId);
          setAnalisisProducto(productoCompleto.analisis || []);
        } catch (error) {
          console.error('Error loading analisis:', error);
          setAnalisisProducto([]);
        }
      } else {
        setAnalisisProducto([]);
      }
    };

    cargarAnalisis();
  }, [selectedEmbarque?.productoId]);

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
      pesoTara: embarque.pesoTara || 0,
      almacenId: embarque.almacenId || null,
      placas: embarque.placas || ''
    });
    // Resetear horas de captura
    setHoraPesoTara(null);
    setHoraPesoBruto(null);
    setHoraPesoNeto(null);
    setIsDialogOpen(true);
  };

  // Actualizar hora de peso neto cuando se calcula
  useEffect(() => {
    if (formData.pesoBruto > 0 && formData.pesoTara > 0 && !horaPesoNeto) {
      const pesoNeto = formData.pesoBruto - formData.pesoTara;
      if (pesoNeto > 0) {
        setHoraPesoNeto(getCurrentDateTimeMST());
      }
    }
  }, [formData.pesoBruto, formData.pesoTara, horaPesoNeto]);

  const handleCapturarPesoTara = async () => {
    // Leer desde la API según el tipo de transporte
    const scaleId = selectedEmbarque?.tipoTransporte === 'Ferroviaria' 
      ? PREDEFINED_SCALES.FERROVIARIA.scale_id 
      : PREDEFINED_SCALES.CAMION.scale_id;
    
    try {
      toast.loading('Leyendo peso de la báscula...', { id: 'reading-weight-tara' });
      const result = await getScaleWeight(scaleId, 'weight');
      
      if (result.success && result.weight !== undefined) {
        const nuevoPesoTara = Math.round(result.weight);
        setFormData({ ...formData, pesoTara: nuevoPesoTara });
        setHoraPesoTara(getCurrentDateTimeMST());
        toast.success(`Peso tara capturado: ${nuevoPesoTara} kg`, { id: 'reading-weight-tara' });
      } else {
        toast.error(result.error || 'Error al leer peso de la báscula', { id: 'reading-weight-tara' });
      }
    } catch (error) {
      console.error('Error al leer peso:', error);
      toast.error('Error al comunicarse con la báscula', { id: 'reading-weight-tara' });
    }
  };

  const handleCapturarPesoBruto = async () => {
    // Leer desde la API según el tipo de transporte
    const scaleId = selectedEmbarque?.tipoTransporte === 'Ferroviaria' 
      ? PREDEFINED_SCALES.FERROVIARIA.scale_id 
      : PREDEFINED_SCALES.CAMION.scale_id;
    
    try {
      toast.loading('Leyendo peso de la báscula...', { id: 'reading-weight-bruto' });
      const result = await getScaleWeight(scaleId, 'weight');
      
      if (result.success && result.weight !== undefined) {
        const nuevoPesoBruto = Math.round(result.weight);
        setFormData({ ...formData, pesoBruto: nuevoPesoBruto });
        setHoraPesoBruto(getCurrentDateTimeMST());
        toast.success(`Peso bruto capturado: ${nuevoPesoBruto} kg`, { id: 'reading-weight-bruto' });
      } else {
        toast.error(result.error || 'Error al leer peso de la báscula', { id: 'reading-weight-bruto' });
      }
    } catch (error) {
      console.error('Error al leer peso:', error);
      toast.error('Error al comunicarse con la báscula', { id: 'reading-weight-bruto' });
    }
  };

  const handlePesoTaraChange = (value: number) => {
    setFormData({ ...formData, pesoTara: value });
    // Si se ingresa manualmente y no hay hora, capturarla
    if (value > 0 && !horaPesoTara) {
      setHoraPesoTara(getCurrentDateTimeMST());
    }
  };

  const handlePesoBrutoChange = (value: number) => {
    setFormData({ ...formData, pesoBruto: value });
    // Si se ingresa manualmente y no hay hora, capturarla
    if (value > 0 && !horaPesoBruto) {
      setHoraPesoBruto(getCurrentDateTimeMST());
    }
  };

  const handleNuevoEmbarque = async (data: {
    productoId: number;
    clienteId: number;
    destino: string;
    chofer: string;
    tipoTransporte: 'Camión' | 'Ferroviaria';
    tipoEmbarque: 'Nacional' | 'Exportación';
  }) => {
    try {
      const producto = productosDB.find(p => p.id === data.productoId);
      if (!producto) {
        toast.error('Producto no encontrado');
        return;
      }
      
      const tipoOperacion: TipoOperacion = data.tipoEmbarque === 'Nacional' ? 'Embarque Nacional' : 'Exportación';
      // Usar codigo_boleta de la base de datos, con fallback al nombre si no existe
      const codigoBoleta = producto.codigo_boleta || producto.nombre;
      const nuevaBoleta = generateNumeroBoleta(tipoOperacion, codigoBoleta, consecutivo);
      
      await addEmbarque({
        boleta: nuevaBoleta,
        producto_id: data.productoId,
        cliente_id: data.clienteId,
        destino: data.destino,
        chofer: data.chofer,
        fecha: new Date().toISOString().split('T')[0],
        estatus: 'Pendiente',
        tipo_transporte: data.tipoTransporte,
        tipo_embarque: data.tipoEmbarque
      });
      
      await loadEmbarques();
      setConsecutivo(consecutivo + 1);
      toast.success('Embarque creado correctamente');
    } catch (error) {
      console.error('Error creating embarque:', error);
      toast.error('Error al crear embarque');
    }
  };

  const handlePreviewBoleta = () => {
    setIsBoletaDialogOpen(true);
  };

  const handlePreGuardar = async () => {
    if (!selectedEmbarque) return;
    
    const pesoNeto = formData.pesoBruto - formData.pesoTara;
    
    // Determinar el estatus basado en los pesos capturados (flujo: Tara → Bruto → Neto)
    const nuevoEstatus = formData.pesoTara > 0 && formData.pesoBruto === 0 ? 'Peso Tara' : 
                         formData.pesoTara > 0 && formData.pesoBruto > 0 ? 'Peso Bruto' : 
                         selectedEmbarque.estatus || 'Pendiente';
    
    try {
      await updateEmbarque(selectedEmbarque.id, {
        peso_bruto: formData.pesoBruto > 0 ? formData.pesoBruto : null,
        peso_tara: formData.pesoTara > 0 ? formData.pesoTara : null,
        peso_neto: pesoNeto > 0 ? pesoNeto : null,
        sello_entrada_1: formData.sellos.selloEntrada1 || null,
        sello_entrada_2: formData.sellos.selloEntrada2 || null,
        sello_salida_1: formData.sellos.selloSalida1 || null,
        sello_salida_2: formData.sellos.selloSalida2 || null,
        valores_analisis: Object.keys(formData.valoresAnalisis).length > 0 ? formData.valoresAnalisis : null,
        estatus: nuevoEstatus,
        almacen_id: formData.almacenId || null,
        placas: formData.placas || null
      });
      
      await loadEmbarques();
      toast.success('Datos pre-guardados correctamente');
    } catch (error) {
      console.error('Error saving embarque:', error);
      toast.error('Error al guardar datos');
    }
  };

  const handleGuardar = async () => {
    if (!selectedEmbarque) return;
    
    const pesoNeto = formData.pesoBruto - formData.pesoTara;

    // Generar código de lote automáticamente
    let codigoLote = selectedEmbarque.codigoLote;
    if (!codigoLote && selectedEmbarque.clienteId && selectedEmbarque.productoId && selectedEmbarque.almacenId) {
      try {
        const tipoOperacion = selectedEmbarque.tipoEmbarque === 'Nacional' ? 'Embarque Nacional' : 'Embarque Exportación';
        const { codigo } = await generarCodigoLoteParaOperacion(
          tipoOperacion,
          selectedEmbarque.clienteId,
          null,
          selectedEmbarque.productoId,
          selectedEmbarque.almacenId
        );
        codigoLote = codigo;
      } catch (error) {
        console.error('Error al generar código de lote:', error);
        toast.error('Error al generar código de lote, pero el embarque se guardará');
      }
    }
    
    try {
      const embarqueActualizado = await updateEmbarque(selectedEmbarque.id, {
        peso_bruto: formData.pesoBruto,
        peso_tara: formData.pesoTara,
        peso_neto: pesoNeto,
        sello_entrada_1: formData.sellos.selloEntrada1 || null,
        sello_entrada_2: formData.sellos.selloEntrada2 || null,
        sello_salida_1: formData.sellos.selloSalida1 || null,
        sello_salida_2: formData.sellos.selloSalida2 || null,
        valores_analisis: Object.keys(formData.valoresAnalisis).length > 0 ? formData.valoresAnalisis : null,
        estatus: 'Completado',
        codigo_lote: codigoLote || null,
        almacen_id: formData.almacenId || null,
        placas: formData.placas || null
      });
      
      const codigoLoteFinal = embarqueActualizado?.codigo_lote || codigoLote;
      
      // Crear movimiento de salida
      try {
        const producto = productosDB.find(p => p.id === selectedEmbarque.productoId);
        const cliente = clientesDB.find(c => c.id === selectedEmbarque.clienteId);
        const almacen = formData.almacenId ? almacenesDB.find(a => a.id === formData.almacenId) : null;
        
        await createMovimiento({
          boleta: selectedEmbarque.boleta,
          producto_id: selectedEmbarque.productoId || null,
          cliente_proveedor: cliente?.empresa || null,
          tipo: 'Salida',
          transporte: selectedEmbarque.tipoTransporte || null,
          fecha: selectedEmbarque.fecha,
          ubicacion: almacen?.nombre || selectedEmbarque.destino || null,
          peso_neto: pesoNeto,
          peso_bruto: formData.pesoBruto,
          peso_tara: formData.pesoTara,
          chofer: selectedEmbarque.chofer || null,
          placas: formData.placas || null
        });
      } catch (error) {
        console.error('Error creating movimiento:', error);
        // No mostrar error al usuario, solo loguear
      }
      
      await loadEmbarques();
      setIsDialogOpen(false);
      toast.success('Embarque guardado correctamente' + (codigoLoteFinal ? ` - Lote: ${codigoLoteFinal}` : ''));
    } catch (error) {
      console.error('Error saving embarque:', error);
      toast.error('Error al guardar embarque');
    }
  };

  const filteredEmbarques = embarques.filter(e => 
    e.producto.toLowerCase().includes(search.toLowerCase()) ||
    e.cliente.toLowerCase().includes(search.toLowerCase()) ||
    e.boleta.includes(search) ||
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
              placeholder="Buscar por boleta, producto, cliente o chofer..." 
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
                  <TableHead>Boleta</TableHead>
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
                    <TableCell className="font-mono font-bold text-primary">{embarque.boleta}</TableCell>
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

        {/* Formulario de Báscula Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedEmbarque && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Boleta de Embarque - {selectedEmbarque.boleta}
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
                      <Label className="text-xs text-muted-foreground">Boleta</Label>
                      <p className="font-medium font-mono">{selectedEmbarque.boleta}</p>
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

                  {/* Destino y Almacén en la misma fila */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Destino */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label className="text-xs text-blue-700">Destino</Label>
                      <p className="font-medium text-lg">{selectedEmbarque.destino}</p>
                    </div>

                    {/* Almacén */}
                    <div className="space-y-2">
                      <Label>Almacén (Origen de la mercancía) *</Label>
                      <Select 
                        value={formData.almacenId ? String(formData.almacenId) : ''} 
                        onValueChange={(v) => setFormData({ ...formData, almacenId: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar almacén" />
                        </SelectTrigger>
                        <SelectContent>
                          {almacenesDB.map(almacen => (
                            <SelectItem key={almacen.id} value={String(almacen.id)}>
                              {almacen.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                          <Input 
                            placeholder="ABC-123-A" 
                            value={formData.placas}
                            onChange={(e) => setFormData({ ...formData, placas: e.target.value })}
                          />
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
                            onChange={(e) => handlePesoTaraChange(Number(e.target.value))}
                            placeholder="0"
                          />
                          <Button className="w-full mt-2" size="sm" onClick={handleCapturarPesoTara}>
                            Capturar Peso
                          </Button>
                          {horaPesoTara && (
                            <p className="text-xs text-center text-muted-foreground mt-2">
                              {formatDateTimeMST(horaPesoTara)}
                            </p>
                          )}
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
                            onChange={(e) => handlePesoBrutoChange(Number(e.target.value))}
                            placeholder="0"
                          />
                          <Button className="w-full mt-2" size="sm" variant="outline" onClick={handleCapturarPesoBruto}>
                            Capturar Peso
                          </Button>
                          {horaPesoBruto && (
                            <p className="text-xs text-center text-muted-foreground mt-2">
                              {formatDateTimeMST(horaPesoBruto)}
                            </p>
                          )}
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
                          {horaPesoNeto && (
                            <p className="text-xs text-center text-muted-foreground mt-1">
                              {formatDateTimeMST(horaPesoNeto)}
                            </p>
                          )}
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
                      analisis={analisisProducto}
                      valores={formData.valoresAnalisis}
                      onChange={(nombre, valor) => setFormData({ 
                        ...formData, 
                        valoresAnalisis: { ...formData.valoresAnalisis, [nombre]: valor } 
                      })}
                    />
                  </div>

                  <Separator />

                  {/* Sellos */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Sellos de Seguridad</h4>
                    <SellosSection 
                      sellos={formData.sellos}
                      onChange={(sellos) => setFormData({ ...formData, sellos })}
                      simple={true}
                    />
                  </div>

                  {/* En Embarque no se aplican descuentos, solo se registran análisis para informar al cliente */}

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
          productos={productosDB}
          clientes={clientesDB}
        />

        {/* Boleta Preview Dialog */}
        <BoletaEmbarqueDialog
          open={isBoletaDialogOpen}
          onOpenChange={setIsBoletaDialogOpen}
          embarque={selectedEmbarque ? {
            boleta: selectedEmbarque.boleta,
            producto: selectedEmbarque.producto,
            cliente: selectedEmbarque.cliente,
            destino: selectedEmbarque.destino,
            chofer: selectedEmbarque.chofer || '',
            fecha: selectedEmbarque.fecha,
            tipoTransporte: selectedEmbarque.tipoTransporte || 'Camión',
            tipoEmbarque: selectedEmbarque.tipoEmbarque || 'Nacional',
            estatus: selectedEmbarque.estatus,
            pesoBruto: formData.pesoBruto,
            pesoTara: formData.pesoTara,
            pesoNeto: formData.pesoBruto - formData.pesoTara,
            codigoLote: selectedEmbarque.codigoLote,
            valoresAnalisis: formData.valoresAnalisis,
            sellos: formData.sellos
          } : null}
        />
      </div>
    </Layout>
  );
};

export default EmbarquePage;
