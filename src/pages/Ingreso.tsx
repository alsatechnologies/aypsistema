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

interface Ingreso {
  id: number;
  nombreChofer: string;
  empresa: string;
  procedenciaDestino: string;
  motivo: MotivoVisita;
  placas: string;
  vehiculo: string;
  fechaHoraIngreso: string;
  fechaHoraSalida: string | null;
  ubicacion: string;
  // Campos para Báscula
  producto?: string;
  cliente?: string;
  proveedor?: string;
  tipoTransporte?: 'Camión' | 'Ferroviaria';
  enviadoAOficina?: boolean;
}

const Ingreso = () => {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ingresos, setIngresos] = useState<Ingreso[]>([
    { 
      id: 1, 
      nombreChofer: 'Juan Carlos Mendoza', 
      empresa: 'Transportes del Norte', 
      procedenciaDestino: 'Guadalajara, JAL',
      motivo: 'Reciba',
      placas: 'ABC-123-A',
      vehiculo: 'Tractocamión',
      fechaHoraIngreso: '2024-12-10 08:30',
      fechaHoraSalida: null,
      ubicacion: 'Báscula Camión',
      producto: 'Frijol Soya',
      proveedor: 'Oleaginosas del Bajío',
      tipoTransporte: 'Camión',
      enviadoAOficina: true
    },
    { 
      id: 2, 
      nombreChofer: 'Pedro Ramírez López', 
      empresa: 'Fletes Rápidos SA', 
      procedenciaDestino: 'Monterrey, NL',
      motivo: 'Embarque',
      placas: 'XYZ-789-B',
      vehiculo: 'Pipa',
      fechaHoraIngreso: '2024-12-10 09:15',
      fechaHoraSalida: null,
      ubicacion: 'Patio de espera',
      producto: 'Aceite Crudo de Soya',
      cliente: 'Aceites del Pacífico SA',
      tipoTransporte: 'Camión',
      enviadoAOficina: true
    },
    { 
      id: 3, 
      nombreChofer: 'Miguel Ángel Torres', 
      empresa: 'Logística Express', 
      procedenciaDestino: 'CDMX',
      motivo: 'Reciba',
      placas: 'DEF-456-C',
      vehiculo: 'Torton',
      fechaHoraIngreso: '2024-12-10 07:45',
      fechaHoraSalida: '2024-12-10 11:30',
      ubicacion: '-',
      producto: 'Pasta de Soya',
      proveedor: 'Granos del Norte',
      tipoTransporte: 'Camión',
      enviadoAOficina: true
    },
    { 
      id: 4, 
      nombreChofer: 'Roberto Sánchez', 
      empresa: 'Servicios Técnicos', 
      procedenciaDestino: 'Local',
      motivo: 'Visita',
      placas: 'GHI-321-D',
      vehiculo: 'Camioneta',
      fechaHoraIngreso: '2024-12-10 10:00',
      fechaHoraSalida: null,
      ubicacion: 'Oficinas'
    },
  ]);

  const getMotivoBadge = (motivo: string) => {
    const colors: Record<string, string> = {
      'Reciba': 'bg-green-100 text-green-700 border-green-300',
      'Embarque': 'bg-blue-100 text-blue-700 border-blue-300',
      'Visita': 'bg-purple-100 text-purple-700 border-purple-300',
      'Proveedor': 'bg-orange-100 text-orange-700 border-orange-300',
    };
    return <Badge className={colors[motivo] || 'bg-muted text-muted-foreground'}>{motivo}</Badge>;
  };

  const handleMarcarSalida = (id: number) => {
    const now = new Date().toLocaleString('es-MX', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');
    
    setIngresos(prev => prev.map(ing => 
      ing.id === id ? { ...ing, fechaHoraSalida: now, ubicacion: '-' } : ing
    ));
    toast.success('Salida registrada correctamente');
  };

  const handleNuevoIngreso = (data: NuevoIngresoData) => {
    const now = new Date().toLocaleString('es-MX', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');

    const esBascula = data.motivo === 'Reciba' || data.motivo === 'Embarque';

    const nuevoIngreso: Ingreso = {
      id: Date.now(),
      nombreChofer: data.nombreChofer,
      empresa: data.empresa,
      procedenciaDestino: data.procedenciaDestino,
      motivo: data.motivo,
      placas: data.placas,
      vehiculo: data.vehiculo,
      fechaHoraIngreso: now,
      fechaHoraSalida: null,
      ubicacion: data.ubicacion || 'Patio de espera',
      producto: data.producto,
      cliente: data.cliente,
      proveedor: data.proveedor,
      tipoTransporte: data.tipoTransporte,
      enviadoAOficina: esBascula,
    };

    setIngresos(prev => [nuevoIngreso, ...prev]);

    if (esBascula) {
      toast.success('Ingreso registrado y enviado a Oficina para generar orden de báscula');
    } else {
      toast.success('Ingreso registrado correctamente');
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Chofer</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Placas</TableHead>
                  <TableHead>Procedencia/Destino</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Ingreso</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngresos.map((ingreso) => (
                  <TableRow key={ingreso.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{ingreso.nombreChofer}</TableCell>
                    <TableCell>{ingreso.empresa}</TableCell>
                    <TableCell>{ingreso.vehiculo}</TableCell>
                    <TableCell className="font-mono text-sm">{ingreso.placas}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {ingreso.procedenciaDestino}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMotivoBadge(ingreso.motivo)}
                        {ingreso.enviadoAOficina && (
                          <Badge variant="outline" className="text-xs text-primary border-primary">
                            Oficina
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{ingreso.fechaHoraIngreso}</TableCell>
                    <TableCell>
                      {ingreso.fechaHoraSalida ? (
                        <span className="text-muted-foreground">{ingreso.fechaHoraSalida}</span>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">En planta</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
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
