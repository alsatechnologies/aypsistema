import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Scale, Truck, Train, Clock, CheckCircle, FileText, Printer, Save, BookmarkPlus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import AnalisisDinamico from '@/components/reciba/AnalisisDinamico';
import DescuentosPanel from '@/components/reciba/DescuentosPanel';
import NuevaOperacionDialog from '@/components/reciba/NuevaOperacionDialog';
import { generarBoletaEntradas } from '@/utils/folioGenerator';
import { generarCodigoLoteParaOperacion } from '@/services/supabase/lotes';
import { useRecepciones } from '@/services/hooks/useRecepciones';
import { useProductos } from '@/services/hooks/useProductos';
import { useProveedores } from '@/services/hooks/useProveedores';
import { useAlmacenes } from '@/services/hooks/useAlmacenes';
import { getProductoConAnalisis } from '@/services/supabase/productos';
import { createMovimiento } from '@/services/supabase/movimientos';
import type { Recepcion as RecepcionDB } from '@/services/supabase/recepciones';
import { formatDateTimeMST } from '@/utils/dateUtils';
import { getCurrentDateTimeMST } from '@/utils/dateUtils';
import { getScaleWeight, PREDEFINED_SCALES } from '@/services/api/scales';
import { generateBoletaRecibaPDF, openPDF } from '@/services/api/certificate';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Recepcion {
  id: number;
  boleta: string;
  producto: string;
  proveedor: string;
  chofer?: string | null;
  placas?: string | null;
  fecha: string;
  created_at?: string;
  estatus: 'Pendiente' | 'Peso Bruto' | 'En Descarga' | 'Peso Tara' | 'Completado';
  pesoBruto?: number | null;
  pesoTara?: number | null;
  pesoNeto?: number | null;
  tipoTransporte?: string | null;
  tipoBascula?: string | null;
  analisis?: Record<string, number> | null;
  codigoLote?: string | null;
  proveedorId?: number | null;
  productoId?: number | null;
  almacenId?: number | null;
  horaPesoBruto?: string | null;
  horaPesoTara?: string | null;
  horaPesoNeto?: string | null;
  observaciones?: string | null;
}

const Reciba = () => {
  const { recepciones: recepcionesDB, loading, loadingMore, hasMore, addRecepcion, updateRecepcion, loadRecepciones, loadMore } = useRecepciones();
  const { productos: productosDB } = useProductos();
  const { proveedores: proveedoresDB, addProveedor } = useProveedores();
  const { almacenes: almacenesDB } = useAlmacenes();
  
  const [search, setSearch] = useState('');
  const [selectedRecepcion, setSelectedRecepcion] = useState<Recepcion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNuevaOperacionOpen, setIsNuevaOperacionOpen] = useState(false);
  const [tipoBascula, setTipoBascula] = useState<'Camión' | 'Ferroviaria'>('Camión');
  
  // Estado del formulario
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<number | null>(null);
  const [proveedorPersonalizado, setProveedorPersonalizado] = useState<string>('');
  const [mostrarProveedorPersonalizado, setMostrarProveedorPersonalizado] = useState(false);
  const [pesoBruto, setPesoBruto] = useState<number>(0);
  const [pesoTara, setPesoTara] = useState<number>(0);
  const [horaPesoBruto, setHoraPesoBruto] = useState<string | null>(null);
  const [horaPesoTara, setHoraPesoTara] = useState<string | null>(null);
  const [horaPesoNeto, setHoraPesoNeto] = useState<string | null>(null);
  const [valoresAnalisis, setValoresAnalisis] = useState<Record<string, number>>({});
  const [analisisProducto, setAnalisisProducto] = useState<any[]>([]);
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState<string>('');

  // Mapear recepciones de DB a formato local
  const recepciones: Recepcion[] = recepcionesDB.map(r => ({
    id: r.id,
    boleta: r.boleta,
    producto: r.producto?.nombre || '',
    proveedor: r.proveedor?.empresa || '',
    chofer: r.chofer,
    placas: r.placas,
    fecha: r.fecha,
    created_at: r.created_at,
    estatus: r.estatus as any,
    pesoBruto: r.peso_bruto,
    pesoTara: r.peso_tara,
    pesoNeto: r.peso_neto,
    tipoTransporte: r.tipo_transporte as any,
    tipoBascula: r.tipo_bascula as any,
    analisis: r.analisis as Record<string, number> | null,
    codigoLote: r.codigo_lote,
    proveedorId: r.proveedor_id,
    productoId: r.producto_id,
    almacenId: r.almacen_id || null,
    horaPesoBruto: r.hora_peso_bruto || null,
    horaPesoTara: r.hora_peso_tara || null,
    horaPesoNeto: r.hora_peso_neto || null,
    observaciones: r.observaciones || null
  }));

  // Cargar análisis cuando se selecciona un producto
  useEffect(() => {
    const cargarAnalisis = async () => {
      if (productoSeleccionado) {
        try {
          console.log('Cargando análisis para producto:', productoSeleccionado);
          const productoCompleto = await getProductoConAnalisis(productoSeleccionado);
          console.log('Producto completo recibido:', productoCompleto);
          console.log('Análisis recibidos:', productoCompleto.analisis);
          setAnalisisProducto(productoCompleto.analisis || []);
        } catch (error) {
          console.error('Error loading analisis:', error);
          setAnalisisProducto([]);
        }
      } else {
        console.log('No hay producto seleccionado, limpiando análisis');
        setAnalisisProducto([]);
      }
    };
    cargarAnalisis();
  }, [productoSeleccionado]);

  // Sincronizar estado del formulario cuando se selecciona una recepción
  useEffect(() => {
    if (selectedRecepcion) {
      setProductoSeleccionado(selectedRecepcion.productoId || null);
      setProveedorSeleccionado(selectedRecepcion.proveedorId || null);
      setProveedorPersonalizado(selectedRecepcion.proveedorId ? '' : selectedRecepcion.proveedor || '');
      setMostrarProveedorPersonalizado(!selectedRecepcion.proveedorId && selectedRecepcion.proveedor !== '');
      setPesoBruto(selectedRecepcion.pesoBruto || 0);
      setPesoTara(selectedRecepcion.pesoTara || 0);
      setValoresAnalisis(selectedRecepcion.analisis || {});
      setTipoBascula((selectedRecepcion.tipoBascula || selectedRecepcion.tipoTransporte || 'Camión') as 'Camión' | 'Ferroviaria');
      setAlmacenSeleccionado(selectedRecepcion.almacenId || null);
      // Cargar horas de captura desde la base de datos
      setHoraPesoBruto(selectedRecepcion.horaPesoBruto || null);
      setHoraPesoTara(selectedRecepcion.horaPesoTara || null);
      setHoraPesoNeto(selectedRecepcion.horaPesoNeto || null);
      setObservaciones(selectedRecepcion.observaciones || '');
    }
  }, [selectedRecepcion]);

  const pesoNeto = pesoBruto - pesoTara;
  
  // Actualizar hora de peso neto cuando se calcula
  useEffect(() => {
    if (pesoBruto > 0 && pesoTara > 0 && pesoNeto > 0 && !horaPesoNeto) {
      setHoraPesoNeto(getCurrentDateTimeMST());
    }
  }, [pesoBruto, pesoTara, pesoNeto, horaPesoNeto]);

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

  const getTransporteIcon = (tipo: string) => {
    return tipo === 'Camión' ? <Truck className="h-4 w-4 text-muted-foreground" /> : <Train className="h-4 w-4 text-muted-foreground" />;
  };

  const handleRowClick = (recepcion: Recepcion) => {
    setSelectedRecepcion(recepcion);
    setIsDialogOpen(true);
  };

  const handleAnalisisChange = (nombre: string, valor: number) => {
    setValoresAnalisis(prev => ({ ...prev, [nombre]: valor }));
  };

  const handleCrearOperacion = async (operacion: {
    productoId: number;
    proveedorId: number;
    chofer: string;
    placas: string;
    tipoTransporte: 'Camión' | 'Ferroviaria';
  }) => {
    try {
      const producto = productosDB.find(p => p.id === operacion.productoId);
      if (!producto) {
        toast.error('Producto no encontrado');
        return;
      }
      
      // Usar codigo_boleta de la base de datos, con fallback al nombre si no existe
      const codigoBoleta = producto.codigo_boleta || producto.nombre;
      const nuevaBoleta = generarBoletaEntradas(codigoBoleta, recepciones.length + 1);
      
      await addRecepcion({
        boleta: nuevaBoleta,
        producto_id: operacion.productoId,
        proveedor_id: operacion.proveedorId,
        chofer: operacion.chofer,
        placas: operacion.placas,
        fecha: new Date().toISOString().split('T')[0],
        estatus: 'Pendiente',
        tipo_transporte: operacion.tipoTransporte
      });
      
      await loadRecepciones();
      toast.success('Operación creada correctamente');
    } catch (error) {
      console.error('Error creating recepcion:', error);
      toast.error('Error al crear operación');
    }
  };

  const handlePreGuardar = async () => {
    if (!selectedRecepcion) return;
    
    // Manejar proveedor personalizado
    let proveedorIdFinal = proveedorSeleccionado;
    if (mostrarProveedorPersonalizado && proveedorPersonalizado.trim()) {
      try {
        const nuevoProveedor = await addProveedor({
          empresa: proveedorPersonalizado.trim(),
          contacto: null,
          telefono: null,
          correo: null,
          direccion: null
        });
        proveedorIdFinal = nuevoProveedor.id;
        toast.success('Proveedor creado correctamente');
      } catch (error) {
        console.error('Error creating proveedor:', error);
        toast.error('Error al crear proveedor');
        return;
      }
    }
    
    const nuevoEstatus = pesoBruto > 0 && pesoTara === 0 ? 'Peso Bruto' : 
                         pesoBruto > 0 && pesoTara > 0 ? 'Peso Tara' : 'Pendiente';
    
    try {
      await updateRecepcion(selectedRecepcion.id, {
        producto_id: productoSeleccionado,
        proveedor_id: proveedorIdFinal,
        peso_bruto: pesoBruto > 0 ? pesoBruto : null,
        peso_tara: pesoTara > 0 ? pesoTara : null,
        peso_neto: pesoNeto > 0 ? pesoNeto : null,
        analisis: Object.keys(valoresAnalisis).length > 0 ? valoresAnalisis : null,
        estatus: nuevoEstatus,
        tipo_bascula: tipoBascula,
        hora_peso_bruto: horaPesoBruto || null,
        hora_peso_tara: horaPesoTara || null,
        hora_peso_neto: horaPesoNeto || null,
        observaciones: observaciones || null
      });
      
      await loadRecepciones();
      toast.success('Datos pre-guardados correctamente');
    } catch (error) {
      console.error('Error saving recepcion:', error);
      toast.error('Error al guardar datos');
    }
  };

  const handleCapturarPesoBruto = async () => {
    // Leer desde la API según el tipo de báscula seleccionada
    const scaleId = tipoBascula === 'Ferroviaria' 
      ? PREDEFINED_SCALES.FERROVIARIA.scale_id 
      : PREDEFINED_SCALES.CAMION.scale_id;
    
    try {
      toast.loading('Leyendo peso de la báscula...', { id: 'reading-weight' });
      const result = await getScaleWeight(scaleId, 'weight');
      
      if (result.success && result.weight !== undefined) {
        setPesoBruto(Math.round(result.weight));
        setHoraPesoBruto(getCurrentDateTimeMST());
        toast.success(`Peso bruto capturado: ${Math.round(result.weight)} kg`, { id: 'reading-weight' });
      } else {
        toast.error(result.error || 'Error al leer peso de la báscula', { id: 'reading-weight' });
      }
    } catch (error) {
      console.error('Error al leer peso:', error);
      toast.error('Error al comunicarse con la báscula', { id: 'reading-weight' });
    }
  };

  const handleCapturarPesoTara = async () => {
    // Leer desde la API según el tipo de báscula seleccionada
    const scaleId = tipoBascula === 'Ferroviaria' 
      ? PREDEFINED_SCALES.FERROVIARIA.scale_id 
      : PREDEFINED_SCALES.CAMION.scale_id;
    
    try {
      toast.loading('Leyendo peso de la báscula...', { id: 'reading-weight-tara' });
      const result = await getScaleWeight(scaleId, 'weight');
      
      if (result.success && result.weight !== undefined) {
        const nuevoPesoTara = Math.round(result.weight);
        setPesoTara(nuevoPesoTara);
        setHoraPesoTara(getCurrentDateTimeMST());
        
        // Calcular peso neto y su hora
        const nuevoPesoNeto = pesoBruto - nuevoPesoTara;
        if (nuevoPesoNeto > 0) {
          setHoraPesoNeto(getCurrentDateTimeMST());
        }
        
        toast.success(`Peso tara capturado: ${nuevoPesoTara} kg`, { id: 'reading-weight-tara' });
      } else {
        toast.error(result.error || 'Error al leer peso de la báscula', { id: 'reading-weight-tara' });
      }
    } catch (error) {
      console.error('Error al leer peso:', error);
      toast.error('Error al comunicarse con la báscula', { id: 'reading-weight-tara' });
    }
  };

  const handleGuardarBoleta = async () => {
    if (!selectedRecepcion) return;
    
    if (pesoBruto <= 0) {
      toast.error('Debe registrar el peso bruto');
      return;
    }
    if (pesoTara <= 0) {
      toast.error('Debe registrar el peso tara');
      return;
    }
    if (!productoSeleccionado) {
      toast.error('Debe seleccionar un producto');
      return;
    }
    
    // Manejar proveedor personalizado
    let proveedorIdFinal = proveedorSeleccionado;
    if (mostrarProveedorPersonalizado && proveedorPersonalizado.trim()) {
      try {
        const nuevoProveedor = await addProveedor({
          empresa: proveedorPersonalizado.trim(),
          contacto: null,
          telefono: null,
          correo: null,
          direccion: null
        });
        proveedorIdFinal = nuevoProveedor.id;
        toast.success('Proveedor creado correctamente');
      } catch (error) {
        console.error('Error creating proveedor:', error);
        toast.error('Error al crear proveedor');
        return;
      }
    }
    
    if (!proveedorIdFinal) {
      toast.error('Debe seleccionar o ingresar un proveedor');
      return;
    }

    // Generar boleta final si aún no tiene una (boleta es temporal)
    let boletaFinal = selectedRecepcion.boleta;
    if (selectedRecepcion.boleta.startsWith('TEMP-') || !selectedRecepcion.boleta) {
      const producto = productosDB.find(p => p.id === productoSeleccionado);
      if (!producto) {
        toast.error('Producto no encontrado');
        return;
      }

      // Calcular consecutivo: contar recepciones del año actual para el mismo producto
      const fechaActual = new Date();
      const añoActual = fechaActual.getFullYear();
      
      const recepcionesDelAño = recepciones.filter(r => {
        if (!r.fecha || r.productoId !== productoSeleccionado) return false;
        const fechaRecepcion = new Date(r.fecha);
        return fechaRecepcion.getFullYear() === añoActual &&
               r.boleta && !r.boleta.startsWith('TEMP-');
      });
      
      const consecutivo = recepcionesDelAño.length + 1;
      // Usar codigo_boleta de la base de datos, con fallback al nombre si no existe
      const codigoBoleta = producto.codigo_boleta || producto.nombre;
      boletaFinal = generarBoletaEntradas(codigoBoleta, consecutivo);
    }

    // El código de lote se generará automáticamente en updateRecepcion si se proporciona almacen_id
    try {
      const recepcionActualizada = await updateRecepcion(selectedRecepcion.id, {
        boleta: boletaFinal,
        producto_id: productoSeleccionado,
        proveedor_id: proveedorIdFinal,
        peso_bruto: pesoBruto,
        peso_tara: pesoTara,
        peso_neto: pesoNeto,
        analisis: Object.keys(valoresAnalisis).length > 0 ? valoresAnalisis : null,
        estatus: 'Completado',
        tipo_bascula: tipoBascula,
        almacen_id: almacenSeleccionado || null,
        placas: selectedRecepcion.placas || null,
        hora_peso_bruto: horaPesoBruto || null,
        hora_peso_tara: horaPesoTara || null,
        hora_peso_neto: horaPesoNeto || null,
        observaciones: observaciones || null
      });
      
      const mensajeLote = recepcionActualizada?.codigo_lote ? ` - Lote: ${recepcionActualizada.codigo_lote}` : '';
      
      // Crear movimiento de entrada
      try {
        const producto = productosDB.find(p => p.id === productoSeleccionado);
        const proveedor = proveedoresDB.find(p => p.id === proveedorIdFinal);
        const almacen = almacenSeleccionado ? almacenesDB.find(a => a.id === almacenSeleccionado) : null;
        
        await createMovimiento({
          boleta: boletaFinal,
          producto_id: productoSeleccionado,
          cliente_proveedor: proveedor?.empresa || null,
          tipo: 'Entrada',
          transporte: tipoBascula === 'Camión' ? 'Camión' : 'Ferroviaria',
          fecha: selectedRecepcion.fecha,
          ubicacion: almacen?.nombre || null,
          peso_neto: pesoNeto,
          peso_bruto: pesoBruto,
          peso_tara: pesoTara,
          chofer: selectedRecepcion.chofer || null,
          placas: selectedRecepcion.placas || null
        });
      } catch (error) {
        console.error('Error creating movimiento:', error);
        // No mostrar error al usuario, solo loguear
      }
      
      await loadRecepciones();
      toast.success('Boleta guardada correctamente' + mensajeLote);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving recepcion:', error);
      toast.error('Error al guardar boleta');
    }
  };

  // Función para calcular descuentos (igual que DescuentosPanel)
  const calcularDescuentos = () => {
    if (!productoSeleccionado || !analisisProducto.length) {
      return { totalDescuentoKg: 0, pesoNetoAnalizado: pesoNeto };
    }

    const descuentosActivos = analisisProducto.filter(a => a.generaDescuento);
    let totalDescuentoKg = 0;

    descuentosActivos.forEach(item => {
      const valor = valoresAnalisis[item.nombre] || 0;
      if (!item.rangosDescuento || item.rangosDescuento.length === 0 || !valor) return;
      
      // Ordenar rangos por porcentaje descendente
      const rangosOrdenados = [...item.rangosDescuento].sort((a, b) => b.porcentaje - a.porcentaje);
      const rangoAplicable = rangosOrdenados.find(rango => valor >= rango.porcentaje);
      
      if (rangoAplicable) {
        // Convertir kg por tonelada a kg totales
        const descuentoKg = (rangoAplicable.kgDescuentoTon * pesoNeto) / 1000;
        totalDescuentoKg += descuentoKg;
      }
    });

    const pesoNetoAnalizado = Math.max(0, pesoNeto - totalDescuentoKg);
    return { totalDescuentoKg, pesoNetoAnalizado };
  };

  // Función para formatear fecha y hora según formato esperado por la API
  const formatearFechaHora = (fechaHora: string | null) => {
    if (!fechaHora) return { fecha: '', hora: '' };
    try {
      // fechaHora viene en formato ISO: YYYY-MM-DDTHH:mm:ss.mmm
      const fecha = new Date(fechaHora);
      const fechaStr = format(fecha, 'dd/MM/yyyy', { locale: es });
      const horaStr = format(fecha, 'HH:mm', { locale: es });
      return { fecha: fechaStr, hora: horaStr };
    } catch {
      return { fecha: '', hora: '' };
    }
  };

  const handleImprimir = async () => {
    if (!selectedRecepcion) return;
    
    // Validar que tenga los datos necesarios
    if (!productoSeleccionado || !proveedorSeleccionado) {
      toast.error('Debe completar producto y proveedor antes de imprimir');
      return;
    }

    if (pesoBruto <= 0 || pesoTara <= 0) {
      toast.error('Debe registrar los pesos antes de imprimir');
      return;
    }

    try {
      const producto = productosDB.find(p => p.id === productoSeleccionado);
      const proveedor = proveedoresDB.find(p => p.id === proveedorSeleccionado);
      
      if (!producto || !proveedor) {
        toast.error('Error al obtener datos del producto o proveedor');
        return;
      }

      // Calcular descuentos
      const { totalDescuentoKg, pesoNetoAnalizado } = calcularDescuentos();

      // Preparar datos para la API
      const fechaActual = format(new Date(), 'dd/MM/yyyy', { locale: es });
      
      // Formatear fechas y horas
      const fechaHoraBruto = formatearFechaHora(horaPesoBruto);
      const fechaHoraTara = formatearFechaHora(horaPesoTara);
      const fechaHoraNeto = formatearFechaHora(horaPesoNeto);
      
      // Convertir análisis a formato esperado por la API
      const analisisArray = Object.entries(valoresAnalisis).map(([nombre, valor]) => ({
        nombre,
        valor,
        unidad: 'kg'
      }));

      const boletaData = {
        boleta_no: selectedRecepcion.boleta.startsWith('TEMP-') ? 'PENDIENTE' : selectedRecepcion.boleta,
        fecha: fechaActual,
        lote: selectedRecepcion.codigoLote || '',
        productor: proveedor.empresa,
        producto: producto.nombre,
        procedencia: selectedRecepcion.destino || 'N/A',
        vehiculo: selectedRecepcion.tipoTransporte || 'N/A',
        placas: selectedRecepcion.placas || 'N/A',
        chofer: selectedRecepcion.chofer || 'N/A',
        analisis: analisisArray,
        pesos_info1: {
          peso_bruto: pesoBruto,
          peso_tara: pesoTara,
          peso_neto: pesoNeto,
          fechaneto: fechaHoraNeto.fecha,
          fechabruto: fechaHoraBruto.fecha,
          fechatara: fechaHoraTara.fecha,
          horabruto: fechaHoraBruto.hora,
          horatara: fechaHoraTara.hora
        },
        pesos_info2: {
          deduccion: totalDescuentoKg,
          peso_neto_analizado: pesoNetoAnalizado
        },
        observaciones: observaciones || ''
      };

      toast.loading('Generando boleta PDF...', { id: 'generating-pdf' });
      
      const result = await generateBoletaRecibaPDF(boletaData);
      
      if (result.success) {
        toast.success('Boleta generada correctamente', { id: 'generating-pdf' });
        openPDF(result.pdf_url, result.pdf_base64);
      } else {
        toast.error(result.error || 'Error al generar boleta PDF', { id: 'generating-pdf' });
      }
    } catch (error) {
      console.error('Error al imprimir boleta:', error);
      toast.error('Error al comunicarse con la API de certificados', { id: 'generating-pdf' });
    }
  };

  const filteredRecepciones = recepciones.filter(r => 
    r.producto.toLowerCase().includes(search.toLowerCase()) ||
    r.proveedor.toLowerCase().includes(search.toLowerCase()) ||
    (r.boleta && !r.boleta.startsWith('TEMP-') && r.boleta.includes(search)) ||
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
              placeholder="Buscar por boleta, producto, proveedor o chofer..." 
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
              Historial de Recepciones
            </CardTitle>
            <CardDescription>Haz clic en una fila para abrir el formulario de báscula</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Boleta</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Chofer</TableHead>
                  <TableHead>Placas</TableHead>
                  <TableHead>Transporte</TableHead>
                  <TableHead>Fecha</TableHead>
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
                    <TableCell className="font-mono font-bold text-primary">
                      {recepcion.boleta.startsWith('TEMP-') ? '-' : recepcion.boleta}
                    </TableCell>
                    <TableCell className="font-medium">{recepcion.producto}</TableCell>
                    <TableCell>{recepcion.proveedor}</TableCell>
                    <TableCell>{recepcion.chofer}</TableCell>
                    <TableCell className="font-mono">{recepcion.placas}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {getTransporteIcon(recepcion.tipoTransporte)}
                        {recepcion.tipoTransporte}
                      </span>
                    </TableCell>
                    <TableCell>{recepcion.fecha}</TableCell>
                    <TableCell>{getEstatusBadge(recepcion.estatus)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No hay recepciones
                    </TableCell>
                  </TableRow>
                )}
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

        {/* Dialog Nueva Operación */}
        <NuevaOperacionDialog 
          open={isNuevaOperacionOpen}
          onOpenChange={setIsNuevaOperacionOpen}
          onCrear={handleCrearOperacion}
          productos={productosDB}
          proveedores={proveedoresDB}
        />

        {/* Formulario de Báscula Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            {selectedRecepcion && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 flex-wrap">
                    <Scale className="h-5 w-5" />
                    Boleta de Recepción - {selectedRecepcion.boleta.startsWith('TEMP-') ? '-' : selectedRecepcion.boleta}
                    {selectedRecepcion.codigoLote && (
                      <span className="text-sm font-normal">
                        | Lote: <span className="text-primary font-semibold">{selectedRecepcion.codigoLote}</span>
                      </span>
                    )}
                    <span className="ml-2">{getEstatusBadge(selectedRecepcion.estatus)}</span>
                    <span className="flex items-center gap-1">
                      {getTransporteIcon(selectedRecepcion.tipoTransporte)}
                      {selectedRecepcion.tipoTransporte}
                    </span>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Header Info - Primera fila: Fecha/Hora, Boleta, Código de Lote, Chofer/Placas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">Fecha/Hora</Label>
                      <p className="font-medium">
                        {selectedRecepcion.created_at 
                          ? formatDateTimeMST(selectedRecepcion.created_at) 
                          : selectedRecepcion.fecha}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Boleta</Label>
                      <p className="font-medium font-mono text-primary">
                        {selectedRecepcion.boleta.startsWith('TEMP-') ? '-' : selectedRecepcion.boleta}
                      </p>
                    </div>
                    {selectedRecepcion.codigoLote && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Código de Lote</Label>
                        <p className="font-medium font-mono text-primary font-bold">{selectedRecepcion.codigoLote}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-muted-foreground">Chofer / Placas</Label>
                      <p className="font-medium">{selectedRecepcion.chofer}</p>
                      <p className="text-sm font-mono text-muted-foreground">{selectedRecepcion.placas}</p>
                    </div>
                  </div>

                  {/* Segunda fila: Producto, Proveedor, Almacén */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">Producto</Label>
                      <Select 
                        value={productoSeleccionado ? String(productoSeleccionado) : ''} 
                        onValueChange={(v) => setProductoSeleccionado(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {productosDB.map(p => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Proveedor</Label>
                      {!mostrarProveedorPersonalizado ? (
                        <Select 
                          value={proveedorSeleccionado ? String(proveedorSeleccionado) : ''} 
                          onValueChange={(v) => {
                            if (v === 'otro') {
                              setMostrarProveedorPersonalizado(true);
                              setProveedorSeleccionado(null);
                            } else {
                              setProveedorSeleccionado(parseInt(v));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar proveedor" />
                          </SelectTrigger>
                          <SelectContent>
                            {proveedoresDB.map(p => (
                              <SelectItem key={p.id} value={String(p.id)}>{p.empresa}</SelectItem>
                            ))}
                            <SelectItem value="otro">+ Agregar nuevo proveedor</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            value={proveedorPersonalizado}
                            onChange={(e) => setProveedorPersonalizado(e.target.value)}
                            placeholder="Nombre del proveedor"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setMostrarProveedorPersonalizado(false);
                              setProveedorPersonalizado('');
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Almacén (Destino de la mercancía) *</Label>
                      <Select 
                        value={almacenSeleccionado ? String(almacenSeleccionado) : ''} 
                        onValueChange={(v) => setAlmacenSeleccionado(parseInt(v))}
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
                            onChange={(e) => {
                              const valor = parseInt(e.target.value) || 0;
                              setPesoBruto(valor);
                              if (valor > 0 && !horaPesoBruto) {
                                setHoraPesoBruto(getCurrentDateTimeMST());
                              }
                            }}
                            placeholder="0"
                          />
                          <Button 
                            className="w-full mt-2" 
                            size="sm"
                            onClick={handleCapturarPesoBruto}
                          >
                            Capturar Peso
                          </Button>
                          {horaPesoBruto && (
                            <p className="text-xs text-center text-muted-foreground mt-2">
                              {formatDateTimeMST(horaPesoBruto)}
                            </p>
                          )}
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
                            onChange={(e) => {
                              const valor = parseInt(e.target.value) || 0;
                              setPesoTara(valor);
                              if (valor > 0 && !horaPesoTara) {
                                setHoraPesoTara(getCurrentDateTimeMST());
                              }
                            }}
                            placeholder="0"
                          />
                          <Button 
                            className="w-full mt-2" 
                            size="sm" 
                            variant="outline"
                            onClick={handleCapturarPesoTara}
                          >
                            Capturar Peso
                          </Button>
                          {horaPesoTara && (
                            <p className="text-xs text-center text-muted-foreground mt-2">
                              {formatDateTimeMST(horaPesoTara)}
                            </p>
                          )}
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

                  {/* Análisis dinámicos según producto */}
                  {productoSeleccionado && (
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Análisis de Calidad - {productosDB.find(p => p.id === productoSeleccionado)?.nombre || 'Producto'}
                      </h4>
                      <AnalisisDinamico 
                        analisis={analisisProducto}
                        valores={valoresAnalisis}
                        onChange={handleAnalisisChange}
                      />
                    </div>
                  )}

                  <Separator />

                  {/* Descuentos calculados */}
                  {productoSeleccionado && analisisProducto.length > 0 && (
                    <DescuentosPanel 
                      analisis={analisisProducto}
                      valoresAnalisis={valoresAnalisis}
                      pesoNeto={pesoNeto > 0 ? pesoNeto : 0}
                    />
                  )}

                  <Separator />

                  {/* Observaciones */}
                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      placeholder="Ingrese observaciones adicionales..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Separator />

                  {/* Resumen */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Resumen de Recepción</h4>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span>Producto:</span>
                          <span className="font-medium">
                            {productosDB.find(p => p.id === productoSeleccionado)?.nombre || '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Proveedor:</span>
                          <span className="font-medium">
                            {proveedoresDB.find(p => p.id === proveedorSeleccionado)?.empresa || '-'}
                          </span>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Peso Neto a Liquidar:</span>
                        <span className="text-primary">
                          {calcularDescuentos().pesoNetoAnalizado > 0 
                            ? calcularDescuentos().pesoNetoAnalizado.toLocaleString('es-MX') 
                            : pesoNeto > 0 ? pesoNeto.toLocaleString('es-MX') : 0} Kg
                        </span>
                      </div>
                    </div>
                  </div>
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
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleImprimir}
                  >
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

