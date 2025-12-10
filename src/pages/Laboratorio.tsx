import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, FlaskConical, Beaker, FileText, Clock, CheckCircle, AlertTriangle, Wrench, Eye, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface Muestra {
  id: string;
  folioBoleta: string;
  fecha: string;
  hora: string;
  tipo: 'Materia Prima' | 'Producto Terminado';
  producto: string;
  proveedor?: string;
  cliente?: string;
  analista: string;
  estado: 'Pendiente' | 'En análisis' | 'Completado';
  resultados?: Record<string, number>;
}

interface Equipo {
  id: number;
  nombre: string;
  modelo: string;
  estado: 'Disponible' | 'En uso' | 'Mantenimiento' | 'Calibración';
  ultimaCalibracion: string;
  proximaCalibracion: string;
  responsable: string;
}

const Laboratorio = () => {
  const [search, setSearch] = useState('');
  const [isNuevaMuestraOpen, setIsNuevaMuestraOpen] = useState(false);
  const [isResultadosOpen, setIsResultadosOpen] = useState(false);
  const [selectedMuestra, setSelectedMuestra] = useState<Muestra | null>(null);

  const [formData, setFormData] = useState({
    folioBoleta: '',
    tipo: 'Materia Prima' as 'Materia Prima' | 'Producto Terminado',
    producto: '',
    analista: ''
  });

  const [muestras, setMuestras] = useState<Muestra[]>([
    { id: 'LAB-001', folioBoleta: '0-03-0001', fecha: '2024-12-10', hora: '08:30', tipo: 'Materia Prima', producto: 'Frijol Soya', proveedor: 'Oleaginosas del Bajío', analista: 'Juan Pérez', estado: 'En análisis', resultados: { Humedad: 12.5, Impurezas: 1.2 } },
    { id: 'LAB-002', folioBoleta: '1-01-0001', fecha: '2024-12-10', hora: '09:15', tipo: 'Producto Terminado', producto: 'Aceite Crudo de Soya', cliente: 'Aceites del Pacífico', analista: 'María García', estado: 'Completado', resultados: { Acidez: 0.8, Humedad: 0.15, 'Color Rojo': 3.2 } },
    { id: 'LAB-003', folioBoleta: '0-04-0002', fecha: '2024-12-10', hora: '10:00', tipo: 'Materia Prima', producto: 'Maíz', proveedor: 'Agrícola del Centro', analista: 'Carlos López', estado: 'Pendiente' },
    { id: 'LAB-004', folioBoleta: '1-02-0002', fecha: '2024-12-09', hora: '14:30', tipo: 'Producto Terminado', producto: 'Pasta de Soya', cliente: 'Alimentos Balanceados MX', analista: 'Ana Martínez', estado: 'Completado', resultados: { Proteína: 46.5, Humedad: 11.8, Fibra: 4.2 } },
    { id: 'LAB-005', folioBoleta: '0-03-0003', fecha: '2024-12-09', hora: '11:45', tipo: 'Materia Prima', producto: 'Frijol Soya', proveedor: 'Granos del Norte', analista: 'Juan Pérez', estado: 'Completado', resultados: { Humedad: 11.8, Impurezas: 0.9, 'Grano Dañado': 2.1 } },
  ]);

  const [equipos] = useState<Equipo[]>([
    { id: 1, nombre: 'Espectrofotómetro UV-Vis', modelo: 'Shimadzu UV-1800', estado: 'Disponible', ultimaCalibracion: '2024-12-01', proximaCalibracion: '2025-03-01', responsable: 'Juan Pérez' },
    { id: 2, nombre: 'Cromatógrafo de Gases', modelo: 'Agilent 7890B', estado: 'En uso', ultimaCalibracion: '2024-11-15', proximaCalibracion: '2025-02-15', responsable: 'María García' },
    { id: 3, nombre: 'Analizador de Humedad', modelo: 'Mettler Toledo HB43-S', estado: 'Disponible', ultimaCalibracion: '2024-12-05', proximaCalibracion: '2025-01-05', responsable: 'Carlos López' },
    { id: 4, nombre: 'pH-metro Digital', modelo: 'Hanna HI5222', estado: 'Mantenimiento', ultimaCalibracion: '2024-11-20', proximaCalibracion: '2024-12-20', responsable: 'Ana Martínez' },
    { id: 5, nombre: 'Balanza Analítica', modelo: 'Sartorius Quintix', estado: 'Disponible', ultimaCalibracion: '2024-12-08', proximaCalibracion: '2025-01-08', responsable: 'Juan Pérez' },
    { id: 6, nombre: 'Titulador Automático', modelo: 'Metrohm 905', estado: 'Calibración', ultimaCalibracion: '2024-10-15', proximaCalibracion: '2024-12-15', responsable: 'María García' },
  ]);

  const analistas = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez'];
  const productosMP = ['Frijol Soya', 'Maíz', 'Sorgo', 'Trigo', 'Canola', 'Girasol'];
  const productosPT = ['Aceite Crudo de Soya', 'Aceite Refinado', 'Pasta de Soya', 'Cascarilla de Soya', 'Lecitina'];

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      'Pendiente': { className: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3 mr-1" /> },
      'En análisis': { className: 'bg-blue-100 text-blue-700', icon: <FlaskConical className="h-3 w-3 mr-1" /> },
      'Completado': { className: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      'Disponible': { className: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      'En uso': { className: 'bg-blue-100 text-blue-700', icon: <Beaker className="h-3 w-3 mr-1" /> },
      'Mantenimiento': { className: 'bg-red-100 text-red-700', icon: <Wrench className="h-3 w-3 mr-1" /> },
      'Calibración': { className: 'bg-orange-100 text-orange-700', icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
    };
    const { className, icon } = config[estado] || { className: 'bg-muted', icon: null };
    return <Badge className={`flex items-center w-fit ${className}`}>{icon}{estado}</Badge>;
  };

  const filteredMuestras = muestras.filter(m =>
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    m.producto.toLowerCase().includes(search.toLowerCase()) ||
    m.folioBoleta.includes(search) ||
    m.analista.toLowerCase().includes(search.toLowerCase())
  );

  const handleNuevaMuestra = () => {
    if (!formData.folioBoleta || !formData.producto || !formData.analista) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    const nuevaMuestra: Muestra = {
      id: `LAB-${String(muestras.length + 1).padStart(3, '0')}`,
      folioBoleta: formData.folioBoleta,
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      tipo: formData.tipo,
      producto: formData.producto,
      analista: formData.analista,
      estado: 'Pendiente'
    };

    setMuestras([nuevaMuestra, ...muestras]);
    setFormData({ folioBoleta: '', tipo: 'Materia Prima', producto: '', analista: '' });
    setIsNuevaMuestraOpen(false);
    toast.success('Muestra registrada correctamente');
  };

  const handleVerResultados = (muestra: Muestra) => {
    setSelectedMuestra(muestra);
    setIsResultadosOpen(true);
  };

  return (
    <Layout>
      <Header title="Laboratorio" subtitle="Gestión de análisis y control de calidad" />
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{muestras.filter(m => m.estado === 'Pendiente').length}</div>
              <p className="text-xs text-muted-foreground">Por analizar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Análisis</CardTitle>
              <FlaskConical className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{muestras.filter(m => m.estado === 'En análisis').length}</div>
              <p className="text-xs text-muted-foreground">En proceso</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{muestras.filter(m => m.estado === 'Completado').length}</div>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Equipos Disponibles</CardTitle>
              <Beaker className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{equipos.filter(e => e.estado === 'Disponible').length}/{equipos.length}</div>
              <p className="text-xs text-muted-foreground">Operativos</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="muestras" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="muestras" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Muestras
            </TabsTrigger>
            <TabsTrigger value="equipos" className="flex items-center gap-2">
              <Beaker className="h-4 w-4" />
              Equipos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="muestras">
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por ID, producto, folio o analista..." 
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsNuevaMuestraOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Muestra
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Registro de Muestras</CardTitle>
                <CardDescription>Muestras de laboratorio para análisis de calidad</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Muestra</TableHead>
                      <TableHead>Folio Boleta</TableHead>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Proveedor/Cliente</TableHead>
                      <TableHead>Analista</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMuestras.map((muestra) => (
                      <TableRow key={muestra.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <Badge variant="outline" className="font-mono font-bold text-primary">{muestra.id}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{muestra.folioBoleta}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{muestra.fecha}</p>
                            <p className="text-muted-foreground">{muestra.hora}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={muestra.tipo === 'Materia Prima' ? 'border-green-300 text-green-700' : 'border-blue-300 text-blue-700'}>
                            {muestra.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{muestra.producto}</TableCell>
                        <TableCell>{muestra.proveedor || muestra.cliente || '-'}</TableCell>
                        <TableCell>{muestra.analista}</TableCell>
                        <TableCell>{getEstadoBadge(muestra.estado)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleVerResultados(muestra)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipos">
            <Card>
              <CardHeader>
                <CardTitle>Equipos de Laboratorio</CardTitle>
                <CardDescription>Estado y calibración de equipos</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Última Calibración</TableHead>
                      <TableHead>Próxima Calibración</TableHead>
                      <TableHead>Responsable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipos.map((equipo) => (
                      <TableRow key={equipo.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{equipo.nombre}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{equipo.modelo}</TableCell>
                        <TableCell>{getEstadoBadge(equipo.estado)}</TableCell>
                        <TableCell>{equipo.ultimaCalibracion}</TableCell>
                        <TableCell>
                          <span className={new Date(equipo.proximaCalibracion) < new Date() ? 'text-red-600 font-medium' : ''}>
                            {equipo.proximaCalibracion}
                          </span>
                        </TableCell>
                        <TableCell>{equipo.responsable}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Nueva Muestra Dialog */}
        <Dialog open={isNuevaMuestraOpen} onOpenChange={setIsNuevaMuestraOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Nueva Muestra de Laboratorio
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Folio de Boleta *</Label>
                <Input 
                  value={formData.folioBoleta}
                  onChange={(e) => setFormData({ ...formData, folioBoleta: e.target.value })}
                  placeholder="0-03-0001"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Muestra *</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v as any, producto: '' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Materia Prima">Materia Prima</SelectItem>
                    <SelectItem value="Producto Terminado">Producto Terminado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Producto *</Label>
                <Select value={formData.producto} onValueChange={(v) => setFormData({ ...formData, producto: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.tipo === 'Materia Prima' ? productosMP : productosPT).map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Analista Asignado *</Label>
                <Select value={formData.analista} onValueChange={(v) => setFormData({ ...formData, analista: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar analista" />
                  </SelectTrigger>
                  <SelectContent>
                    {analistas.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleNuevaMuestra}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Muestra
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Resultados Dialog */}
        <Dialog open={isResultadosOpen} onOpenChange={setIsResultadosOpen}>
          <DialogContent className="max-w-lg">
            {selectedMuestra && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Resultados - {selectedMuestra.id}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Folio Boleta</Label>
                      <p className="font-mono">{selectedMuestra.folioBoleta}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Producto</Label>
                      <p className="font-medium">{selectedMuestra.producto}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Fecha/Hora</Label>
                      <p>{selectedMuestra.fecha} {selectedMuestra.hora}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Analista</Label>
                      <p>{selectedMuestra.analista}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Resultados del Análisis</h4>
                    {selectedMuestra.resultados ? (
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedMuestra.resultados).map(([key, value]) => (
                          <div key={key} className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">{key}</p>
                            <p className="text-lg font-bold">{value}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Análisis pendiente - Sin resultados disponibles
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cerrar</Button>
                  </DialogClose>
                  {selectedMuestra.estado === 'Completado' && (
                    <Button variant="outline">
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir Certificado
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Laboratorio;
