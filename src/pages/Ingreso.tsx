import React, { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, LogOut, Car, Clock, MapPin, User, Calendar, X, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import NuevoIngresoDialog, { NuevoIngresoData, MotivoVisita } from '@/components/ingreso/NuevoIngresoDialog';
import { useIngresos } from '@/services/hooks/useIngresos';
import { useOrdenes } from '@/services/hooks/useOrdenes';
import { useRecepciones } from '@/services/hooks/useRecepciones';
import { createRecepcion } from '@/services/supabase/recepciones';
import type { Ingreso as IngresoDB } from '@/services/supabase/ingresos';
import { getCurrentDateTimeMST, formatDateTimeMST } from '@/utils/dateUtils';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Ingreso {
  id: number;
  nombreChofer: string;
  empresa?: string | null;
  procedenciaDestino?: string | null;
  motivo: MotivoVisita;
  placas?: string | null;
  vehiculo?: string | null;
  fechaHoraIngreso: string;
  fechaHoraSalida: string | null;
  ubicacion?: string | null;
  producto?: string | null;
  cliente?: string | null;
  proveedor?: string | null;
  tipoTransporte?: string | null;
  enviadoAOficina: boolean;
}

const Ingreso = () => {
  const { ingresos: ingresosDB, loading, loadingMore, hasMore, addIngreso, updateIngreso, deleteIngreso, loadIngresos, loadMore } = useIngresos();
  const { addOrden } = useOrdenes();
  const { esAdministrador } = useAuth();
  
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [ingresoAEliminar, setIngresoAEliminar] = useState<number | null>(null);
  
  // Refs para sincronizar scrollbars
  const topScrollbarRef = useRef<HTMLDivElement>(null);
  const bottomScrollbarRef = useRef<HTMLDivElement>(null);
  const tableContentRef = useRef<HTMLDivElement>(null);
  
  const filteredIngresos = ingresos.filter(ing => {
    const matchesSearch = 
      ing.nombreChofer.toLowerCase().includes(search.toLowerCase()) ||
      ing.empresa?.toLowerCase().includes(search.toLowerCase()) ||
      ing.placas?.toLowerCase().includes(search.toLowerCase());
    
    let matchesDate = true;
    if (fechaDesde || fechaHasta) {
      const ingresoFecha = ing.fechaHoraIngreso ? ing.fechaHoraIngreso.split('T')[0] : '';
      if (fechaDesde && ingresoFecha < fechaDesde) matchesDate = false;
      if (fechaHasta && ingresoFecha > fechaHasta) matchesDate = false;
    }
    
    return matchesSearch && matchesDate;
  });

  // Sincronizar el ancho del scrollbar superior con el contenido
  useEffect(() => {
    const updateScrollbarWidth = () => {
      if (tableContentRef.current && topScrollbarRef.current) {
        const scrollWidth = tableContentRef.current.scrollWidth;
        const scrollbarContent = topScrollbarRef.current.querySelector('div') as HTMLElement;
        if (scrollbarContent) {
          scrollbarContent.style.minWidth = `${scrollWidth}px`;
        }
      }
    };
    
    // Esperar un frame para que el DOM se actualice
    requestAnimationFrame(() => {
      updateScrollbarWidth();
    });
    
    window.addEventListener('resize', updateScrollbarWidth);
    
    return () => {
      window.removeEventListener('resize', updateScrollbarWidth);
    };
  }, [filteredIngresos.length]);
  
  // Mapear ingresos de DB a formato local
  const ingresos: Ingreso[] = ingresosDB.map(i => ({
    id: i.id,
    nombreChofer: i.nombre_chofer,
    empresa: i.empresa,
    procedenciaDestino: i.procedencia_destino,
    motivo: i.motivo as MotivoVisita,
    placas: i.placas,
    vehiculo: i.vehiculo,
    fechaHoraIngreso: i.fecha_hora_ingreso,
    fechaHoraSalida: i.fecha_hora_salida,
    ubicacion: i.ubicacion,
    producto: i.producto,
    cliente: i.cliente,
    proveedor: i.proveedor,
    tipoTransporte: i.tipo_transporte,
    enviadoAOficina: i.enviado_a_oficina
  }));

  const getMotivoBadge = (motivo: string) => {
    const colors: Record<string, string> = {
      'Reciba': 'bg-green-100 text-green-700 border-green-300',
      'Embarque': 'bg-blue-100 text-blue-700 border-blue-300',
    };
    return <Badge className={colors[motivo] || 'bg-muted text-muted-foreground'}>{motivo}</Badge>;
  };

  const handleMarcarSalida = async (id: number) => {
    try {
      const now = getCurrentDateTimeMST();
      await updateIngreso(id, {
        fecha_hora_salida: now,
        ubicacion: null
      });
      await loadIngresos();
      toast.success('Salida registrada correctamente');
    } catch (error) {
      console.error('Error updating ingreso:', error);
      toast.error('Error al registrar salida');
    }
  };

  const handleEliminarIngreso = async () => {
    if (!ingresoAEliminar) return;
    
    try {
      await deleteIngreso(ingresoAEliminar);
      toast.success('Ingreso eliminado correctamente');
      setIngresoAEliminar(null);
    } catch (error) {
      console.error('Error eliminando ingreso:', error);
      toast.error('Error al eliminar ingreso');
    }
  };

  const handleNuevoIngreso = async (data: NuevoIngresoData) => {
    try {
      const now = getCurrentDateTimeMST();
      const esBascula = data.motivo === 'Reciba' || data.motivo === 'Embarque';

      // Crear el ingreso
      const nuevoIngreso = await addIngreso({
        nombre_chofer: data.nombreChofer,
        empresa: data.empresa || null,
        procedencia_destino: data.procedenciaDestino || null,
        motivo: data.motivo,
        placas: data.placas || null,
        vehiculo: data.vehiculo || null,
        fecha_hora_ingreso: now,
        fecha_hora_salida: null,
        ubicacion: data.ubicacion || 'Patio de espera',
        producto: null,
        cliente: null,
        proveedor: null,
        tipo_transporte: data.vehiculo ? (data.vehiculo === 'Ferrocarril' ? 'Ferroviaria' : 'Camión') : null,
        enviado_a_oficina: esBascula
      });
      
      // Si es Embarque, crear orden en Oficina para que completen los datos
      if (data.motivo === 'Embarque') {
        const tipoOperacion = 'Embarque Nacional';
        
        // Generar ticket temporal (se actualizará cuando se complete la orden en Oficina)
        // Formato: TEMP-YYYYMMDD-HHMMSS para identificar fácilmente
        const fecha = new Date();
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        const hours = String(fecha.getHours()).padStart(2, '0');
        const minutes = String(fecha.getMinutes()).padStart(2, '0');
        const seconds = String(fecha.getSeconds()).padStart(2, '0');
        const fechaStr = `${year}${month}${day}${hours}${minutes}${seconds}`;
        const ticketTemporal = `TEMP-${fechaStr}`;
        
        try {
          await addOrden({
            boleta: ticketTemporal,
            producto_id: null,
            cliente_id: null,
            tipo_operacion: tipoOperacion,
            destino: data.procedenciaDestino || null,
            nombre_chofer: data.nombreChofer,
            vehiculo: data.vehiculo || null,
            placas: data.placas || null,
            fecha_hora_ingreso: now,
            estatus: 'Nuevo'
          });
          
          toast.success('Ingreso registrado y ticket creado en Oficina');
        } catch (error) {
          console.error('Error creating orden:', error);
          toast.error('Ingreso registrado, pero hubo un error al crear el ticket en Oficina');
        }
      } else if (data.motivo === 'Reciba') {
        // Reciba va directamente al módulo de Reciba - crear recepción automáticamente
        try {
          // Generar ticket temporal con el mismo formato que Embarque
          // Formato: TEMP-YYYYMMDDHHMMSS para identificar fácilmente
          const fecha = new Date();
          const year = fecha.getFullYear();
          const month = String(fecha.getMonth() + 1).padStart(2, '0');
          const day = String(fecha.getDate()).padStart(2, '0');
          const hours = String(fecha.getHours()).padStart(2, '0');
          const minutes = String(fecha.getMinutes()).padStart(2, '0');
          const seconds = String(fecha.getSeconds()).padStart(2, '0');
          const fechaStr = `${year}${month}${day}${hours}${minutes}${seconds}`;
          const ticketTemporal = `TEMP-${fechaStr}`;
          
          // Obtener fecha actual en formato YYYY-MM-DD para el campo fecha
          const fechaActual = new Date();
          const fechaFormato = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}-${String(fechaActual.getDate()).padStart(2, '0')}`;
          
          // Crear recepción con datos básicos del ingreso
          // El producto y proveedor se completarán en el módulo de Reciba
          await createRecepcion({
            boleta: ticketTemporal, // Boleta temporal con formato TEMP-YYYYMMDDHHMMSS
            producto_id: null, // Se completará en Reciba
            proveedor_id: null, // Se completará en Reciba
            chofer: data.nombreChofer,
            placas: data.placas || null,
            fecha: fechaFormato,
            estatus: 'Pendiente',
            tipo_transporte: data.vehiculo ? (data.vehiculo === 'Ferrocarril' ? 'Ferroviaria' : 'Camión') : 'Camión',
            peso_bruto: null,
            peso_tara: null,
            peso_neto: null,
            tipo_bascula: null,
            sello_entrada_1: null,
            sello_entrada_2: null,
            sello_salida_1: null,
            sello_salida_2: null,
            analisis: null,
            hora_peso_bruto: null,
            hora_peso_tara: null,
            hora_peso_neto: null,
            observaciones: null,
            almacen_id: null
          });
          
          toast.success('Ingreso registrado. Vehículo listo para báscula de Reciba');
        } catch (error) {
          console.error('Error creating recepcion:', error);
          toast.error('Ingreso registrado, pero hubo un error al crear la recepción en Reciba');
        }
      } else {
        toast.success('Ingreso registrado correctamente');
      }
      
      await loadIngresos();
    } catch (error: any) {
      console.error('Error creating ingreso:', error);
      const errorMessage = error?.message || error?.details || 'Error desconocido';
      if (errorMessage.includes('CORS') || errorMessage.includes('NetworkError')) {
        toast.error('Error de conexión. Verifica tu conexión a internet y la configuración de Supabase.');
      } else {
        toast.error(`Error al registrar ingreso: ${errorMessage}`);
      }
    }
  };

  const vehiculosEnPlanta = ingresos.filter(ing => !ing.fechaHoraSalida).length;

  return (
    <Layout>
      <Header title="Ingreso" subtitle="Control de acceso - Portero" />
      <div className="p-6">
        {/* Search, Filters and New */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por chofer, empresa, placas..." 
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
              />
              <span className="text-muted-foreground">-</span>
              <Input 
                type="date" 
                className="w-36"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
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
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Registro
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Registro de Ingresos
            </CardTitle>
            <CardDescription>Control de entrada y salida de vehículos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Scrollbar superior sincronizado */}
              <div 
                ref={topScrollbarRef}
                className="overflow-x-auto overflow-y-hidden mb-0"
                style={{ 
                  height: '17px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgb(156 163 175) transparent'
                }}
                onScroll={(e) => {
                  if (bottomScrollbarRef.current && !bottomScrollbarRef.current.dataset.scrolling) {
                    bottomScrollbarRef.current.dataset.scrolling = 'true';
                    bottomScrollbarRef.current.scrollLeft = (e.target as HTMLElement).scrollLeft;
                    delete bottomScrollbarRef.current.dataset.scrolling;
                  }
                }}
              >
                <div style={{ minWidth: '1500px', height: '1px' }}></div>
              </div>
              
              {/* Contenido de la tabla con scrollbar inferior */}
              <div 
                ref={bottomScrollbarRef}
                className="overflow-x-auto"
                onScroll={(e) => {
                  if (topScrollbarRef.current && !topScrollbarRef.current.dataset.scrolling) {
                    topScrollbarRef.current.dataset.scrolling = 'true';
                    topScrollbarRef.current.scrollLeft = (e.target as HTMLElement).scrollLeft;
                    delete topScrollbarRef.current.dataset.scrolling;
                  }
                }}
              >
                <div ref={tableContentRef} className="inline-block min-w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Nombre Chofer</TableHead>
                        <TableHead className="min-w-[220px]">Empresa</TableHead>
                        <TableHead className="min-w-[140px]">Vehículo</TableHead>
                        <TableHead className="min-w-[130px]">Placas</TableHead>
                        <TableHead className="min-w-[200px]">Procedencia/Destino</TableHead>
                        <TableHead className="min-w-[180px]">Motivo</TableHead>
                        <TableHead className="min-w-[160px]">Ingreso</TableHead>
                        <TableHead className="min-w-[160px]">Salida</TableHead>
                        <TableHead className="text-right min-w-[160px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIngresos.map((ingreso) => (
                        <TableRow key={ingreso.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium min-w-[200px]">{ingreso.nombreChofer}</TableCell>
                          <TableCell className="min-w-[220px]">{ingreso.empresa || '-'}</TableCell>
                          <TableCell className="min-w-[140px]">{ingreso.vehiculo || '-'}</TableCell>
                          <TableCell className="font-mono text-sm min-w-[130px]">{ingreso.placas || '-'}</TableCell>
                          <TableCell className="min-w-[200px]">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {ingreso.procedenciaDestino || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[180px]">
                            {getMotivoBadge(ingreso.motivo)}
                          </TableCell>
                          <TableCell className="min-w-[160px]">{formatDateTimeMST(ingreso.fechaHoraIngreso)}</TableCell>
                          <TableCell className="min-w-[160px]">
                            {ingreso.fechaHoraSalida ? (
                              <span className="text-muted-foreground">{formatDateTimeMST(ingreso.fechaHoraSalida)}</span>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">En planta</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right min-w-[160px]">
                            <div className="flex items-center justify-end gap-2">
                              {!ingreso.fechaHoraSalida && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                                  onClick={() => handleMarcarSalida(ingreso.id)}
                                >
                                  <LogOut className="h-3 w-3 mr-1" />
                                  Marcar Salida
                                </Button>
                              )}
                              {esAdministrador() && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIngresoAEliminar(ingreso.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
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

        {/* Dialog */}
        <NuevoIngresoDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen}
          onSubmit={handleNuevoIngreso}
        />

        {/* Diálogo de confirmación para eliminar */}
        <AlertDialog open={ingresoAEliminar !== null} onOpenChange={(open) => !open && setIngresoAEliminar(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este ingreso?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El registro de ingreso será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleEliminarIngreso}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Ingreso;
