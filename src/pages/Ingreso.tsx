import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, LogOut, Car, Clock, MapPin, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import NuevoIngresoDialog, { NuevoIngresoData, MotivoVisita } from '@/components/ingreso/NuevoIngresoDialog';
import { useIngresos } from '@/services/hooks/useIngresos';
import { useOrdenes } from '@/services/hooks/useOrdenes';
import { useRecepciones } from '@/services/hooks/useRecepciones';
import type { Ingreso as IngresoDB } from '@/services/supabase/ingresos';
import { getCurrentDateTimeMST, formatDateTimeMST } from '@/utils/dateUtils';

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
  const { ingresos: ingresosDB, loading, addIngreso, updateIngreso, loadIngresos } = useIngresos();
  const { addOrden } = useOrdenes();
  
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
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
        // Reciba va directamente al módulo de Reciba, no a Oficina
        toast.success('Ingreso registrado. Vehículo listo para báscula de Reciba');
      } else {
        toast.success('Ingreso registrado correctamente');
      }
      
      await loadIngresos();
    } catch (error) {
      console.error('Error creating ingreso:', error);
      toast.error('Error al registrar ingreso');
    }
  };

  const filteredIngresos = ingresos.filter(ing => 
    ing.nombreChofer.toLowerCase().includes(search.toLowerCase()) ||
    ing.empresa.toLowerCase().includes(search.toLowerCase()) ||
    ing.placas.toLowerCase().includes(search.toLowerCase())
  );

  const vehiculosEnPlanta = ingresos.filter(ing => !ing.fechaHoraSalida).length;

  return (
    <Layout>
      <Header title="Ingreso" subtitle="Control de acceso - Portero" />
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vehículos en Planta</CardTitle>
              <Car className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{vehiculosEnPlanta}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Hoy</CardTitle>
              <Clock className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{ingresos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Salidas Hoy</CardTitle>
              <LogOut className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{ingresos.filter(i => i.fechaHoraSalida).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and New */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por chofer, empresa o placas..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
            <div className="overflow-x-auto">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog */}
        <NuevoIngresoDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen}
          onSubmit={handleNuevoIngreso}
        />
      </div>
    </Layout>
  );
};

export default Ingreso;
