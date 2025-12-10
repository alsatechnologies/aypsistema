import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, LogOut, Car, Clock, MapPin, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Ingreso {
  id: number;
  nombreChofer: string;
  empresa: string;
  procedenciaDestino: string;
  motivo: 'Reciba' | 'Embarque' | 'Visita' | 'Proveedor';
  placas: string;
  vehiculo: string;
  fechaHoraIngreso: string;
  fechaHoraSalida: string | null;
  ubicacion: string;
}

const Ingreso = () => {
  const [search, setSearch] = useState('');
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
      ubicacion: 'Báscula 1'
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
      ubicacion: 'Patio de espera'
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
      ubicacion: '-'
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
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Ingreso</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del Chofer</Label>
                    <Input placeholder="Nombre completo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa</Label>
                    <Input placeholder="Nombre de la empresa" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vehículo</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de vehículo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tractocamion">Tractocamión</SelectItem>
                        <SelectItem value="pipa">Pipa</SelectItem>
                        <SelectItem value="torton">Torton</SelectItem>
                        <SelectItem value="camioneta">Camioneta</SelectItem>
                        <SelectItem value="ferrocarril">Ferrocarril</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Placas</Label>
                    <Input placeholder="ABC-123-A" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Motivo</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reciba">Reciba</SelectItem>
                        <SelectItem value="embarque">Embarque</SelectItem>
                        <SelectItem value="visita">Visita</SelectItem>
                        <SelectItem value="proveedor">Proveedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ubicación</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Asignar ubicación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bascula1">Báscula 1</SelectItem>
                        <SelectItem value="bascula2">Báscula 2</SelectItem>
                        <SelectItem value="patio">Patio de espera</SelectItem>
                        <SelectItem value="descarga">Área de descarga</SelectItem>
                        <SelectItem value="carga">Área de carga</SelectItem>
                        <SelectItem value="oficinas">Oficinas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Procedencia / Destino</Label>
                  <Input placeholder="Ej: Guadalajara, JAL" />
                </div>
                <div className="space-y-2">
                  <Label>Proveedor (opcional)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prov1">Oleaginosas del Bajío</SelectItem>
                      <SelectItem value="prov2">Granos del Norte</SelectItem>
                      <SelectItem value="prov3">Aceites Industriales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button className="bg-primary hover:bg-primary/90">Registrar Ingreso</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  <TableHead>Procedencia/Destino</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Placas</TableHead>
                  <TableHead>Fecha/Hora Ingreso</TableHead>
                  <TableHead>Fecha/Hora Salida</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngresos.map((ingreso) => (
                  <TableRow key={ingreso.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{ingreso.nombreChofer}</TableCell>
                    <TableCell>{ingreso.empresa}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {ingreso.procedenciaDestino}
                      </div>
                    </TableCell>
                    <TableCell>{getMotivoBadge(ingreso.motivo)}</TableCell>
                    <TableCell className="font-mono text-sm">{ingreso.placas}</TableCell>
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
      </div>
    </Layout>
  );
};

export default Ingreso;
