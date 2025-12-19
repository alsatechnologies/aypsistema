import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Clock, CheckCircle, Printer, Eye, Truck, Ship, Calendar, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BoletaPreviewDialog from '@/components/oficina/BoletaPreviewDialog';
import { generateNumeroBoleta, TipoOperacion } from '@/utils/folioGenerator';
import { useOrdenes } from '@/services/hooks/useOrdenes';
import { useProductos } from '@/services/hooks/useProductos';
import { useClientes } from '@/services/hooks/useClientes';
import { useProveedores } from '@/services/hooks/useProveedores';
import type { Orden as OrdenDB } from '@/services/supabase/ordenes';
import CompletarOrdenDialog from '@/components/oficina/CompletarOrdenDialog';
import { toast } from 'sonner';
import { formatDateTimeMST } from '@/utils/dateUtils';
import { createEmbarque, getEmbarqueByBoleta, updateEmbarque } from '@/services/supabase/embarques';
import { createRecepcion, getRecepcionByBoleta, updateRecepcion } from '@/services/supabase/recepciones';
import { getMovimientoByBoleta, updateMovimiento } from '@/services/supabase/movimientos';
import { createOrden, deleteOrden } from '@/services/supabase/ordenes';
import { getCurrentDateTimeMST } from '@/utils/dateUtils';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Orden {
  id: number;
  boleta: string;
  producto: string;
  cliente?: string | null;
  tipoOperacion: 'Reciba' | 'Embarque Nacional' | 'Embarque Exportación';
  destino?: string | null;
  nombreChofer?: string | null;
  vehiculo?: string | null;
  placas?: string | null;
  fechaHoraIngreso?: string | null;
  estatus: 'Nuevo' | 'En Proceso' | 'Completado';
}

const Oficina = () => {
  const { usuario } = useAuth();
  const { ordenes: ordenesDB, loading, loadingMore, hasMore, loadOrdenes, loadMore, updateOrden } = useOrdenes();
  const { productos } = useProductos();
  const { clientes: clientesDB = [] } = useClientes();
  const { proveedores } = useProveedores();
  
  const [search, setSearch] = useState('');
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCompletarDialog, setShowCompletarDialog] = useState(false);
  const [ordenParaCompletar, setOrdenParaCompletar] = useState<OrdenDB | null>(null);
  const [isNuevaOrdenOpen, setIsNuevaOrdenOpen] = useState(false);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [ordenAEliminar, setOrdenAEliminar] = useState<Orden | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Verificar si el usuario puede editar/eliminar
  const puedeEditarEliminar = usuario?.rol === 'Administrador' || usuario?.rol === 'Oficina';
  
  // Estado para el formulario de nueva orden
  const [nuevaOrdenData, setNuevaOrdenData] = useState({
    tipoOperacion: 'Embarque Nacional' as 'Reciba' | 'Embarque Nacional' | 'Embarque Exportación',
    productoId: '',
    clienteId: '',
    proveedorId: '',
    destino: '',
    tipoTransporte: '',
    chofer: '',
    vehiculo: '',
    placas: ''
  });

  // Resetear formulario cuando se cierra el diálogo
  useEffect(() => {
    if (!isNuevaOrdenOpen) {
      setNuevaOrdenData({
      tipoOperacion: 'Embarque Nacional',
        productoId: '',
        clienteId: '',
        proveedorId: '',
        destino: '',
        tipoTransporte: '',
        chofer: '',
        vehiculo: '',
        placas: ''
      });
    }
  }, [isNuevaOrdenOpen]);

  // Mapear órdenes de DB a formato local
  const ordenes: Orden[] = ordenesDB.map(o => ({
    id: o.id,
    boleta: o.boleta,
    producto: o.producto?.nombre || '',
    cliente: o.cliente?.empresa,
    tipoOperacion: o.tipo_operacion as any,
    destino: o.destino,
    nombreChofer: o.nombre_chofer,
    vehiculo: o.vehiculo,
    placas: o.placas,
    fechaHoraIngreso: o.fecha_hora_ingreso,
    estatus: o.estatus as any
  }));

  const handleViewTicket = (orden: Orden) => {
    setSelectedOrden(orden);
    setShowPreview(true);
  };

  const handleCompletarOrden = (orden: Orden) => {
    // Buscar la orden completa en ordenesDB
    const ordenCompleta = ordenesDB.find(o => o.id === orden.id);
    if (ordenCompleta) {
      setOrdenParaCompletar(ordenCompleta);
      setShowCompletarDialog(true);
    }
  };

  const handleEditar = (orden: Orden) => {
    // Buscar la orden completa en ordenesDB
    const ordenCompleta = ordenesDB.find(o => o.id === orden.id);
    if (ordenCompleta) {
      setOrdenParaCompletar(ordenCompleta);
      setShowCompletarDialog(true);
    }
  };

  const handleMarcarCompletado = async (orden: Orden) => {
    try {
      await updateOrden(orden.id, { estatus: 'Completado' });
      await loadOrdenes();
      toast.success(`Orden ${orden.boleta} marcada como completada`);
    } catch (error) {
      console.error('Error al marcar como completado:', error);
      toast.error('Error al actualizar el estatus');
    }
  };

  const handleCrearNuevaOrden = async () => {
    // Validaciones básicas
    if (!nuevaOrdenData.productoId) {
      toast.error('Debe seleccionar un producto');
      return;
    }

    if (nuevaOrdenData.tipoOperacion === 'Reciba' && !nuevaOrdenData.proveedorId) {
      toast.error('Debe seleccionar un proveedor para Reciba');
      return;
    }

    if ((nuevaOrdenData.tipoOperacion === 'Embarque Nacional' || nuevaOrdenData.tipoOperacion === 'Embarque Exportación') && !nuevaOrdenData.clienteId) {
      toast.error('Debe seleccionar un cliente para Embarque');
      return;
    }

    try {
      // Obtener producto para generar boleta
      const producto = productos.find(p => p.id === parseInt(nuevaOrdenData.productoId));
      if (!producto) {
        toast.error('Producto no encontrado');
        return;
      }

      // Generar boleta final inmediatamente (no usar TEMP-)
      const tipoOperacion: TipoOperacion = nuevaOrdenData.tipoOperacion === 'Reciba' 
        ? 'Entradas' 
        : nuevaOrdenData.tipoOperacion === 'Embarque Nacional' 
        ? 'Embarque Nacional' 
        : 'Exportación';
      
      // Usar codigo_boleta de la base de datos, con fallback al nombre si no existe
      const codigoBoleta = producto.codigo_boleta || producto.nombre;
      
      // Calcular consecutivo anual considerando todas las boletas existentes
      const { calcularSiguienteConsecutivo } = await import('@/utils/consecutivoBoleta');
      const consecutivo = await calcularSiguienteConsecutivo(tipoOperacion, parseInt(nuevaOrdenData.productoId), codigoBoleta);
      
      // Generar boleta final
      const boletaFinal = generateNumeroBoleta(tipoOperacion, codigoBoleta, consecutivo);

      // Crear orden con boleta final
      const ordenCreada = await createOrden({
        boleta: boletaFinal,
        producto_id: parseInt(nuevaOrdenData.productoId),
        cliente_id: nuevaOrdenData.tipoOperacion === 'Reciba' ? null : (nuevaOrdenData.clienteId ? parseInt(nuevaOrdenData.clienteId) : null),
        proveedor_id: nuevaOrdenData.tipoOperacion === 'Reciba' ? (nuevaOrdenData.proveedorId ? parseInt(nuevaOrdenData.proveedorId) : null) : null,
        destino: nuevaOrdenData.destino || null,
        nombre_chofer: nuevaOrdenData.chofer || null,
        vehiculo: nuevaOrdenData.vehiculo || null,
        placas: nuevaOrdenData.placas || null,
        fecha_hora_ingreso: getCurrentDateTimeMST(),
        estatus: 'En Proceso', // Directamente en proceso, lista para imprimir
        tipo_operacion: nuevaOrdenData.tipoOperacion,
        tipo_transporte: nuevaOrdenData.tipoTransporte || null
      });

      // Crear embarque o recepción según el tipo de operación
      const fechaActual = new Date();
      const fechaMST = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}-${String(fechaActual.getDate()).padStart(2, '0')}`;

      if (nuevaOrdenData.tipoOperacion === 'Reciba') {
        if (nuevaOrdenData.proveedorId) {
          await createRecepcion({
            boleta: boletaFinal,
            producto_id: parseInt(nuevaOrdenData.productoId),
            proveedor_id: parseInt(nuevaOrdenData.proveedorId),
            chofer: nuevaOrdenData.chofer || null,
            placas: nuevaOrdenData.placas || null,
            fecha: fechaMST,
            tipo_transporte: nuevaOrdenData.tipoTransporte || null,
            tipo_bascula: nuevaOrdenData.tipoTransporte === 'Ferroviaria' ? 'Ferroviaria' : 'Camión',
            estatus: 'Pendiente'
          });
        }
      } else {
        // Embarque Nacional o Exportación
        if (nuevaOrdenData.clienteId) {
          await createEmbarque({
            boleta: boletaFinal,
            producto_id: parseInt(nuevaOrdenData.productoId),
            cliente_id: parseInt(nuevaOrdenData.clienteId),
            chofer: nuevaOrdenData.chofer || null,
            placas: nuevaOrdenData.placas || null,
            destino: nuevaOrdenData.destino || null,
            fecha: fechaMST,
            tipo_transporte: nuevaOrdenData.tipoTransporte || null,
            tipo_embarque: nuevaOrdenData.tipoOperacion === 'Embarque Nacional' ? 'Nacional' : 'Exportación',
            estatus: 'Pendiente'
          });
        }
      }

      await loadOrdenes();
      
      // Cerrar diálogo de creación
      setIsNuevaOrdenOpen(false);
      
      // Resetear formulario
      setNuevaOrdenData({
        tipoOperacion: 'Embarque Nacional',
        productoId: '',
        clienteId: '',
        proveedorId: '',
        destino: '',
        tipoTransporte: '',
        chofer: '',
        vehiculo: '',
        placas: ''
      });

      // Preparar orden para vista previa
      const ordenParaPreview: Orden = {
        id: ordenCreada.id,
        boleta: boletaFinal,
        producto: producto.nombre,
        cliente: nuevaOrdenData.tipoOperacion === 'Reciba' 
          ? null 
          : (clientesDB.find(c => c.id === parseInt(nuevaOrdenData.clienteId))?.empresa || null),
        tipoOperacion: nuevaOrdenData.tipoOperacion,
        destino: nuevaOrdenData.destino || null,
        nombreChofer: nuevaOrdenData.chofer || null,
        vehiculo: nuevaOrdenData.vehiculo || null,
        placas: nuevaOrdenData.placas || null,
        fechaHoraIngreso: getCurrentDateTimeMST(),
        estatus: 'En Proceso'
      };

      // Abrir vista previa directamente
      setSelectedOrden(ordenParaPreview);
      setShowPreview(true);
      
      toast.success('Orden creada y lista para imprimir');
    } catch (error) {
      console.error('Error creating orden:', error);
      toast.error('Error al crear la orden');
    }
  };

  const handleSaveOrden = async (ordenId: number, data: {
    producto_id: number;
    cliente_id?: number | null;
    proveedor_id?: number | null;
    tipo_transporte?: string;
  }) => {
    try {
      const orden = ordenesDB.find(o => o.id === ordenId);
      if (!orden) {
        toast.error('Orden no encontrada');
        return;
      }

      // Obtener producto para generar boleta
      const productosService = await import('@/services/supabase/productos');
      const productos = await productosService.getProductos();
      const producto = productos.find(p => p.id === data.producto_id);
      
      if (!producto) {
        toast.error('Producto no encontrado');
        return;
      }
      
      // Generar ticket final solo si es temporal, mantener el existente si ya tiene boleta
      let ticketFinal = orden.boleta;
      const esTemporal = orden.boleta.startsWith('TEMP-');
      if (esTemporal) {
        const tipoOperacion: TipoOperacion = orden.tipo_operacion === 'Reciba' 
          ? 'Entradas' 
          : orden.tipo_operacion === 'Embarque Nacional' 
          ? 'Embarque Nacional' 
          : 'Exportación';
        
        // Usar codigo_boleta de la base de datos, con fallback al nombre si no existe
        const codigoBoleta = producto.codigo_boleta || producto.nombre;
        
        // Calcular consecutivo anual considerando todas las boletas existentes (órdenes, embarques y recepciones)
        const { calcularSiguienteConsecutivo } = await import('@/utils/consecutivoBoleta');
        const consecutivo = await calcularSiguienteConsecutivo(tipoOperacion, data.producto_id, codigoBoleta);
        
        // Generar boleta final con el consecutivo calculado
        ticketFinal = generateNumeroBoleta(tipoOperacion, codigoBoleta, consecutivo);
      }

      // Actualizar la orden
      const updateData: any = {
        producto_id: data.producto_id,
        cliente_id: data.cliente_id,
        proveedor_id: data.proveedor_id,
        tipo_transporte: data.tipo_transporte || null
      };

      // Solo actualizar boleta y estatus si es temporal
      if (esTemporal) {
        updateData.boleta = ticketFinal;
        updateData.estatus = 'En Proceso';
      }

      await updateOrden(ordenId, updateData);

      // Si es una orden de Reciba, crear o actualizar el registro en recepciones
      if (orden.tipo_operacion === 'Reciba') {
        if (data.proveedor_id && data.producto_id) {
          try {
            const fechaActual = new Date();
            const fechaMST = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}-${String(fechaActual.getDate()).padStart(2, '0')}`;
            
            // Verificar si ya existe una recepción con esta boleta
            const recepcionExistente = await getRecepcionByBoleta(ticketFinal);
            
            const recepcionData = {
              producto_id: data.producto_id,
              proveedor_id: data.proveedor_id,
              chofer: orden.nombre_chofer || null,
              placas: orden.placas || null,
              fecha: fechaMST,
              tipo_transporte: data.tipo_transporte || null,
              estatus: 'Pendiente'
            };
            
            if (recepcionExistente) {
              // Actualizar recepción existente
              await updateRecepcion(recepcionExistente.id, recepcionData);
              
              // Actualizar también el movimiento asociado si existe
              try {
                const movimientoExistente = await getMovimientoByBoleta(ticketFinal);
                if (movimientoExistente && proveedoresDB && proveedoresDB.length > 0) {
                  // Obtener el nombre del proveedor actualizado
                  const proveedorActualizado = proveedoresDB.find(p => p.id === data.proveedor_id);
                  if (proveedorActualizado && proveedorActualizado.empresa) {
                    await updateMovimiento(movimientoExistente.id, {
                      cliente_proveedor: proveedorActualizado.empresa
                    });
                  }
                }
              } catch (error) {
                console.error('Error updating movimiento:', error);
                // No lanzamos error para no interrumpir el flujo
              }
            } else {
              // Crear nueva recepción
              await createRecepcion({
                boleta: ticketFinal,
                ...recepcionData
              });
            }
          } catch (error) {
            console.error('Error creating/updating recepcion:', error);
            // No lanzamos error para no interrumpir el flujo, solo lo registramos
          }
        }
      }

      // Si es una orden de Embarque, crear o actualizar el registro en embarques
      if (orden.tipo_operacion === 'Embarque Nacional' || orden.tipo_operacion === 'Embarque Exportación') {
        if (data.cliente_id && data.producto_id) {
          try {
            const fechaActual = new Date();
            const fechaMST = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}-${String(fechaActual.getDate()).padStart(2, '0')}`;
            
            // Verificar si ya existe un embarque con esta boleta
            const embarqueExistente = await getEmbarqueByBoleta(ticketFinal);
            
            const embarqueData = {
              producto_id: data.producto_id,
              cliente_id: data.cliente_id,
              chofer: orden.nombre_chofer || null,
              placas: orden.placas || null,
              destino: orden.destino || null,
              fecha: fechaMST,
              tipo_transporte: data.tipo_transporte || null,
              tipo_embarque: orden.tipo_operacion === 'Embarque Nacional' ? 'Nacional' : 'Exportación'
            };
            
            if (embarqueExistente) {
              // Actualizar embarque existente
              await updateEmbarque(embarqueExistente.id, embarqueData);
              
              // Actualizar también el movimiento asociado si existe
              try {
                const movimientoExistente = await getMovimientoByBoleta(ticketFinal);
                if (movimientoExistente && clientesDB && clientesDB.length > 0) {
                  // Obtener el nombre del cliente actualizado
                  const clienteActualizado = clientesDB.find(c => c.id === data.cliente_id);
                  if (clienteActualizado && clienteActualizado.empresa) {
                    await updateMovimiento(movimientoExistente.id, {
                      cliente_proveedor: clienteActualizado.empresa
                    });
                  }
                }
              } catch (error) {
                console.error('Error updating movimiento:', error);
                // No lanzamos error para no interrumpir el flujo
              }
            } else {
              // Crear nuevo embarque
              await createEmbarque({
                boleta: ticketFinal,
                estatus: 'Pendiente',
                ...embarqueData
              });
            }
          } catch (error) {
            console.error('Error creating/updating embarque:', error);
            // No lanzamos error para no interrumpir el flujo, solo lo registramos
          }
        }
      }

      await loadOrdenes();
      toast.success('Orden completada correctamente');
    } catch (error) {
      console.error('Error saving orden:', error);
      throw error;
    }
  };

  const handleEliminar = async (orden: Orden) => {
    if (!puedeEditarEliminar) {
      toast.error('No tienes permisos para eliminar órdenes');
      return;
    }
    setOrdenAEliminar(orden);
    setShowDeleteDialog(true);
  };

  const confirmarEliminar = async () => {
    if (!ordenAEliminar) return;
    
    try {
      await deleteOrden(ordenAEliminar.id);
      await loadOrdenes();
      toast.success('Orden eliminada permanentemente');
      setShowDeleteDialog(false);
      setOrdenAEliminar(null);
    } catch (error: any) {
      console.error('Error al eliminar orden:', error);
      const errorMessage = error?.message || 'Error al eliminar orden';
      toast.error(errorMessage);
    }
  };

  const getEstatusBadge = (estatus: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      'Nuevo': { className: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: <Clock className="h-3 w-3 mr-1" /> },
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
    return <Badge className={colors[tipo] || 'bg-gray-500 text-white'}>{tipo}</Badge>;
  };

  const filteredOrdenes = ordenes.filter(o => {
    // Filtro de búsqueda
    const matchesSearch = 
    o.producto.toLowerCase().includes(search.toLowerCase()) ||
      (o.cliente && o.cliente.toLowerCase().includes(search.toLowerCase())) ||
    o.boleta.includes(search) ||
      (o.nombreChofer && o.nombreChofer.toLowerCase().includes(search.toLowerCase()));
    
    // Filtro de fecha
    let matchesDate = true;
    if (fechaDesde || fechaHasta) {
      const ordenFecha = o.fechaHoraIngreso ? o.fechaHoraIngreso.split('T')[0] : '';
      if (fechaDesde && ordenFecha < fechaDesde) matchesDate = false;
      if (fechaHasta && ordenFecha > fechaHasta) matchesDate = false;
    }
    
    return matchesSearch && matchesDate;
  });

  return (
    <Layout>
      <Header title="Oficina" subtitle="Gestión de órdenes y documentación" />
      <div className="p-6">
        {/* Search, Filters and New */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Buscar por boleta, producto, cliente..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input 
                type="date" 
                className="w-36"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                placeholder="Desde"
              />
              <span className="text-muted-foreground">-</span>
              <Input 
                type="date" 
                className="w-36"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                placeholder="Hasta"
              />
              {(fechaDesde || fechaHasta) && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                  title="Limpiar filtros"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <Dialog open={isNuevaOrdenOpen} onOpenChange={setIsNuevaOrdenOpen}>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsNuevaOrdenOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Button>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nueva Orden</DialogTitle>
              </DialogHeader>
              <Tabs 
                defaultValue="nacional" 
                className="w-full"
                onValueChange={(value) => {
                  const tipoOperacion = value === 'reciba' 
                    ? 'Reciba' 
                    : value === 'nacional' 
                    ? 'Embarque Nacional' 
                    : 'Embarque Exportación';
                  setNuevaOrdenData(prev => ({ ...prev, tipoOperacion }));
                }}
              >
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
                      <Label>Proveedor *</Label>
                      <Select 
                        value={nuevaOrdenData.proveedorId} 
                        onValueChange={(value) => setNuevaOrdenData(prev => ({ ...prev, proveedorId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {proveedores.map((prov) => (
                            <SelectItem key={prov.id} value={prov.id.toString()}>
                              {prov.empresa}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Producto *</Label>
                      <Select 
                        value={nuevaOrdenData.productoId} 
                        onValueChange={(value) => setNuevaOrdenData(prev => ({ ...prev, productoId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {productos.map((prod) => (
                            <SelectItem key={prod.id} value={prod.id.toString()}>
                              {prod.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Origen</Label>
                      <Input 
                        placeholder="Ciudad, Estado" 
                        value={nuevaOrdenData.destino}
                        onChange={(e) => setNuevaOrdenData(prev => ({ ...prev, destino: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Transporte</Label>
                      <Select 
                        value={nuevaOrdenData.tipoTransporte} 
                        onValueChange={(value) => setNuevaOrdenData(prev => ({ ...prev, tipoTransporte: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Camión">Camión</SelectItem>
                          <SelectItem value="Ferroviaria">Ferroviaria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="nacional" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cliente *</Label>
                      <Select 
                        value={nuevaOrdenData.clienteId} 
                        onValueChange={(value) => setNuevaOrdenData(prev => ({ ...prev, clienteId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientesDB.map((cli) => (
                            <SelectItem key={cli.id} value={cli.id.toString()}>
                              {cli.empresa}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Producto *</Label>
                      <Select 
                        value={nuevaOrdenData.productoId} 
                        onValueChange={(value) => setNuevaOrdenData(prev => ({ ...prev, productoId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {productos.map((prod) => (
                            <SelectItem key={prod.id} value={prod.id.toString()}>
                              {prod.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Destino</Label>
                      <Input 
                        placeholder="Ciudad, Estado" 
                        value={nuevaOrdenData.destino}
                        onChange={(e) => setNuevaOrdenData(prev => ({ ...prev, destino: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Transporte</Label>
                      <Select 
                        value={nuevaOrdenData.tipoTransporte} 
                        onValueChange={(value) => setNuevaOrdenData(prev => ({ ...prev, tipoTransporte: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Camión">Camión</SelectItem>
                          <SelectItem value="Ferroviaria">Ferroviaria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="exportacion" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cliente Internacional *</Label>
                      <Select 
                        value={nuevaOrdenData.clienteId} 
                        onValueChange={(value) => setNuevaOrdenData(prev => ({ ...prev, clienteId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientesDB.map((cli) => (
                            <SelectItem key={cli.id} value={cli.id.toString()}>
                              {cli.empresa}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Producto *</Label>
                      <Select 
                        value={nuevaOrdenData.productoId} 
                        onValueChange={(value) => setNuevaOrdenData(prev => ({ ...prev, productoId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {productos.map((prod) => (
                            <SelectItem key={prod.id} value={prod.id.toString()}>
                              {prod.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>País / Puerto Destino</Label>
                      <Input 
                        placeholder="Ej: Houston, TX" 
                        value={nuevaOrdenData.destino}
                        onChange={(e) => setNuevaOrdenData(prev => ({ ...prev, destino: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Incoterm</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FOB">FOB</SelectItem>
                          <SelectItem value="CIF">CIF</SelectItem>
                          <SelectItem value="EXW">EXW</SelectItem>
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
                    <Input 
                      placeholder="Nombre completo" 
                      value={nuevaOrdenData.chofer}
                      onChange={(e) => setNuevaOrdenData(prev => ({ ...prev, chofer: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vehículo</Label>
                    <Input 
                      placeholder="Tipo de vehículo" 
                      value={nuevaOrdenData.vehiculo}
                      onChange={(e) => setNuevaOrdenData(prev => ({ ...prev, vehiculo: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Placas</Label>
                    <Input 
                      placeholder="ABC-123-A" 
                      value={nuevaOrdenData.placas}
                      onChange={(e) => setNuevaOrdenData(prev => ({ ...prev, placas: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={handleCrearNuevaOrden}
                >
                  Crear Orden
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historial de Ordenes
            </CardTitle>
            <CardDescription>Gestión de órdenes de reciba y embarque</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Boleta</TableHead>
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
                  <TableRow 
                    key={orden.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      if (orden.estatus === 'Nuevo' && orden.boleta.startsWith('TEMP-')) {
                        handleCompletarOrden(orden);
                      } else {
                        handleViewTicket(orden);
                      }
                    }}
                  >
                    <TableCell className="font-mono font-bold text-primary">{orden.boleta}</TableCell>
                    <TableCell className="font-medium">{orden.producto || '-'}</TableCell>
                    <TableCell>{orden.cliente || '-'}</TableCell>
                    <TableCell>{getTipoOperacionBadge(orden.tipoOperacion)}</TableCell>
                    <TableCell>{orden.destino}</TableCell>
                    <TableCell>{orden.nombreChofer}</TableCell>
                    <TableCell className="font-mono text-sm">{orden.placas}</TableCell>
                    <TableCell>{formatDateTimeMST(orden.fechaHoraIngreso || null)}</TableCell>
                    <TableCell>{getEstatusBadge(orden.estatus)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {orden.estatus === 'Nuevo' && orden.boleta.startsWith('TEMP-') ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleCompletarOrden(orden)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            Completar Orden
                          </Button>
                          {puedeEditarEliminar && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleEliminar(orden)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                            onClick={() => handleViewTicket(orden)}
                            title="Ver ticket"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                            onClick={() => handleViewTicket(orden)}
                            title="Imprimir ticket"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                          {puedeEditarEliminar && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditar(orden);
                                }}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEliminar(orden);
                                }}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {orden.estatus === 'En Proceso' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleMarcarCompletado(orden)}
                              className="ml-2 border-green-500 text-green-600 hover:bg-green-50"
                              title="Marcar como completado"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Completar
                            </Button>
                          )}
                        </div>
                      )}
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

        {/* Ticket Preview Dialog */}
        <BoletaPreviewDialog 
          open={showPreview} 
          onOpenChange={setShowPreview} 
          orden={selectedOrden} 
        />

        {/* Completar Orden Dialog */}
        {ordenParaCompletar && (
          <CompletarOrdenDialog
            open={showCompletarDialog}
            onOpenChange={setShowCompletarDialog}
            orden={ordenParaCompletar}
            onSave={handleSaveOrden}
          />
        )}

        {/* Diálogo de confirmación de eliminación */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">⚠️ Eliminación Permanente</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-3">
                  <p className="font-semibold text-destructive">
                    Esta acción eliminará la orden "{ordenAEliminar?.boleta}" <strong>PERMANENTEMENTE</strong> de la base de datos.
                  </p>
                  <p className="text-sm">
                    Esta acción <strong>NO se puede deshacer</strong>. El registro será eliminado completamente y no podrá ser recuperado.
                  </p>
                  {ordenAEliminar && (
                    <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                      <p className="font-medium">Detalles de la orden a eliminar:</p>
                      <p>Boleta: <strong>{ordenAEliminar.boleta}</strong></p>
                      <p>Producto: {ordenAEliminar.producto || '-'}</p>
                      <p>Cliente/Proveedor: {ordenAEliminar.cliente || '-'}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Si esta orden tiene embarques, recepciones o movimientos asociados, la eliminación será bloqueada.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmarEliminar}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar Permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Oficina;
