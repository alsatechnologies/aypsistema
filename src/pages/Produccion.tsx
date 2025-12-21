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
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Factory, Clock, CheckCircle, Eye, Trash2, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';
import { useProduccion } from '@/services/hooks/useProduccion';
import type { ReporteProduccion, NivelTanque, NivelGoma } from '@/services/supabase/produccion';
import { useAuth } from '@/contexts/AuthContext';

const Produccion = () => {
  const [search, setSearch] = useState('');
  const [isNuevoReporteOpen, setIsNuevoReporteOpen] = useState(false);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [selectedReporte, setSelectedReporte] = useState<ReporteProduccion | null>(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const { usuario } = useAuth();

  const [formData, setFormData] = useState({
    turno: 'Matutino' as 'Matutino' | 'Vespertino' | 'Nocturno',
    responsable: usuario?.nombre_completo || '',
    nivelesTanques: [{ tanque: '', nivel: '', unidad: 'L' }] as Array<{ tanque: string; nivel: string; unidad: string }>,
    nivelesGomas: [{ goma: '', nivel: '', unidad: 'L' }] as Array<{ goma: string; nivel: string; unidad: string }>,
    observaciones: ''
  });

  const { reportes, loading, addReporte, updateReporte, deleteReporte, loadReportes } = useProduccion();

  // Filtrar reportes
  const filteredReportes = reportes.filter(r => {
    const matchesSearch = !search || 
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.responsable.toLowerCase().includes(search.toLowerCase()) ||
      r.fecha.includes(search);
    
    let matchesDate = true;
    if (fechaDesde || fechaHasta) {
      const reporteFecha = r.fecha || '';
      if (fechaDesde && reporteFecha < fechaDesde) matchesDate = false;
      if (fechaHasta && reporteFecha > fechaHasta) matchesDate = false;
    }
    
    return matchesSearch && matchesDate;
  });

  const handleNuevoReporte = async () => {
    if (!formData.responsable) {
      toast.error('El responsable es obligatorio');
      return;
    }

    // Validar que haya al menos un tanque o una goma
    const tanquesValidos = formData.nivelesTanques.filter(t => t.tanque && t.nivel);
    const gomasValidas = formData.nivelesGomas.filter(g => g.goma && g.nivel);

    if (tanquesValidos.length === 0 && gomasValidas.length === 0) {
      toast.error('Debe registrar al menos un nivel de tanque o goma');
      return;
    }

    try {
      const nivelesTanques: NivelTanque[] = tanquesValidos.map(t => ({
        tanque: t.tanque,
        nivel: parseFloat(t.nivel) || 0,
        unidad: t.unidad || 'L'
      }));

      const nivelesGomas: NivelGoma[] = gomasValidas.map(g => ({
        goma: g.goma,
        nivel: parseFloat(g.nivel) || 0,
        unidad: g.unidad || 'L'
      }));

      await addReporte({
        id: '', // Se generará automáticamente
        fecha: new Date().toISOString().split('T')[0],
        responsable: formData.responsable,
        turno: formData.turno,
        estatus: 'Completado',
        niveles_tanques: nivelesTanques.length > 0 ? nivelesTanques : null,
        niveles_gomas: nivelesGomas.length > 0 ? nivelesGomas : null,
        observaciones: formData.observaciones || null
      });
      
      await loadReportes();
      
      // Resetear formulario
      setFormData({
        turno: 'Matutino',
        responsable: usuario?.nombre_completo || '',
        nivelesTanques: [{ tanque: '', nivel: '', unidad: 'L' }],
        nivelesGomas: [{ goma: '', nivel: '', unidad: 'L' }],
        observaciones: ''
      });
      setIsNuevoReporteOpen(false);
      toast.success('Reporte de producción creado');
    } catch (error) {
      console.error('Error creating reporte:', error);
      toast.error('Error al crear reporte');
    }
  };

  const handleVerDetalle = (reporte: ReporteProduccion) => {
    setSelectedReporte(reporte);
    setIsDetalleOpen(true);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este reporte?')) return;
    
    try {
      await deleteReporte(id);
      toast.success('Reporte eliminado');
      await loadReportes();
    } catch (error) {
      console.error('Error deleting reporte:', error);
      toast.error('Error al eliminar reporte');
    }
  };

  const agregarTanque = () => {
    setFormData({
      ...formData,
      nivelesTanques: [...formData.nivelesTanques, { tanque: '', nivel: '', unidad: 'L' }]
    });
  };

  const eliminarTanque = (index: number) => {
    const nuevos = formData.nivelesTanques.filter((_, i) => i !== index);
    setFormData({ ...formData, nivelesTanques: nuevos.length > 0 ? nuevos : [{ tanque: '', nivel: '', unidad: 'L' }] });
  };

  const agregarGoma = () => {
    setFormData({
      ...formData,
      nivelesGomas: [...formData.nivelesGomas, { goma: '', nivel: '', unidad: 'L' }]
    });
  };

  const eliminarGoma = (index: number) => {
    const nuevos = formData.nivelesGomas.filter((_, i) => i !== index);
    setFormData({ ...formData, nivelesGomas: nuevos.length > 0 ? nuevos : [{ goma: '', nivel: '', unidad: 'L' }] });
  };

  const getEstatusBadge = (estatus: string) => {
    switch (estatus) {
      case 'Completado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Completado</Badge>;
      case 'En proceso':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> En proceso</Badge>;
      default:
        return <Badge variant="outline">{estatus}</Badge>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <Header title="Producción" subtitle="Reportes diarios de niveles de aceite" />
        <div className="p-6 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando reportes...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="Producción" subtitle="Reportes diarios de niveles de aceite por tanque y gomas" />
      <div className="p-6">
        {/* Search, Filters and Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por ID, responsable..." 
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
          <Button onClick={() => setIsNuevoReporteOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Reporte
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reportes de Producción</CardTitle>
            <CardDescription>Registro diario de niveles de aceite por tanque y gomas</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredReportes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay reportes registrados
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>FECHA</TableHead>
                    <TableHead>RESPONSABLE</TableHead>
                    <TableHead>TURNO</TableHead>
                    <TableHead>ESTATUS</TableHead>
                    <TableHead>ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReportes.map((reporte) => (
                    <TableRow key={reporte.id}>
                      <TableCell className="font-medium">{reporte.id}</TableCell>
                      <TableCell>{new Date(reporte.fecha).toLocaleDateString('es-MX')}</TableCell>
                      <TableCell>{reporte.responsable}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{reporte.turno}</Badge>
                      </TableCell>
                      <TableCell>{getEstatusBadge(reporte.estatus)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVerDetalle(reporte)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEliminar(reporte.id)}
                            title="Eliminar"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog: Nuevo Reporte */}
        <Dialog open={isNuevoReporteOpen} onOpenChange={setIsNuevoReporteOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Nuevo Reporte de Producción
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha</Label>
                  <Input 
                    type="date" 
                    value={new Date().toISOString().split('T')[0]}
                    disabled
                  />
                </div>
                <div>
                  <Label>Turno *</Label>
                  <Select value={formData.turno} onValueChange={(v: any) => setFormData({ ...formData, turno: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Matutino">Matutino</SelectItem>
                      <SelectItem value="Vespertino">Vespertino</SelectItem>
                      <SelectItem value="Nocturno">Nocturno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Responsable *</Label>
                <Input 
                  value={formData.responsable}
                  onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                  placeholder="Nombre del responsable"
                />
              </div>

              {/* Niveles de Tanques */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Niveles de Tanques</Label>
                  <Button type="button" variant="outline" size="sm" onClick={agregarTanque}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Tanque
                  </Button>
                </div>
                {formData.nivelesTanques.map((tanque, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Label>Tanque</Label>
                      <Input
                        value={tanque.tanque}
                        onChange={(e) => {
                          const nuevos = [...formData.nivelesTanques];
                          nuevos[index].tanque = e.target.value;
                          setFormData({ ...formData, nivelesTanques: nuevos });
                        }}
                        placeholder="Ej: TANQUE 1"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Nivel</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={tanque.nivel}
                        onChange={(e) => {
                          const nuevos = [...formData.nivelesTanques];
                          nuevos[index].nivel = e.target.value;
                          setFormData({ ...formData, nivelesTanques: nuevos });
                        }}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Unidad</Label>
                      <Select
                        value={tanque.unidad}
                        onValueChange={(v) => {
                          const nuevos = [...formData.nivelesTanques];
                          nuevos[index].unidad = v;
                          setFormData({ ...formData, nivelesTanques: nuevos });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L">L (Litros)</SelectItem>
                          <SelectItem value="m³">m³ (Metros cúbicos)</SelectItem>
                          <SelectItem value="gal">gal (Galones)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      {formData.nivelesTanques.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarTanque(index)}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Niveles de Gomas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Niveles de Gomas</Label>
                  <Button type="button" variant="outline" size="sm" onClick={agregarGoma}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Goma
                  </Button>
                </div>
                {formData.nivelesGomas.map((goma, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Label>Goma</Label>
                      <Input
                        value={goma.goma}
                        onChange={(e) => {
                          const nuevos = [...formData.nivelesGomas];
                          nuevos[index].goma = e.target.value;
                          setFormData({ ...formData, nivelesGomas: nuevos });
                        }}
                        placeholder="Ej: GOMA 1"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Nivel</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={goma.nivel}
                        onChange={(e) => {
                          const nuevos = [...formData.nivelesGomas];
                          nuevos[index].nivel = e.target.value;
                          setFormData({ ...formData, nivelesGomas: nuevos });
                        }}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Unidad</Label>
                      <Select
                        value={goma.unidad}
                        onValueChange={(v) => {
                          const nuevos = [...formData.nivelesGomas];
                          nuevos[index].unidad = v;
                          setFormData({ ...formData, nivelesGomas: nuevos });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L">L (Litros)</SelectItem>
                          <SelectItem value="m³">m³ (Metros cúbicos)</SelectItem>
                          <SelectItem value="gal">gal (Galones)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      {formData.nivelesGomas.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarGoma(index)}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Observaciones */}
              <div>
                <Label>Observaciones</Label>
                <Textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleNuevoReporte}>Guardar Reporte</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Ver Detalle */}
        <Dialog open={isDetalleOpen} onOpenChange={setIsDetalleOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Detalle del Reporte {selectedReporte?.id}
              </DialogTitle>
            </DialogHeader>

            {selectedReporte && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Fecha</Label>
                    <p className="font-medium">{new Date(selectedReporte.fecha).toLocaleDateString('es-MX')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Responsable</Label>
                    <p className="font-medium">{selectedReporte.responsable}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Turno</Label>
                    <p className="font-medium">{selectedReporte.turno}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estatus</Label>
                    <div className="mt-1">{getEstatusBadge(selectedReporte.estatus)}</div>
                  </div>
                </div>

                {selectedReporte.niveles_tanques && selectedReporte.niveles_tanques.length > 0 && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Niveles de Tanques</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanque</TableHead>
                          <TableHead>Nivel</TableHead>
                          <TableHead>Unidad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReporte.niveles_tanques.map((tanque, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{tanque.tanque}</TableCell>
                            <TableCell>{tanque.nivel.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>{tanque.unidad}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {selectedReporte.niveles_gomas && selectedReporte.niveles_gomas.length > 0 && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Niveles de Gomas</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Goma</TableHead>
                          <TableHead>Nivel</TableHead>
                          <TableHead>Unidad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReporte.niveles_gomas.map((goma, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{goma.goma}</TableCell>
                            <TableCell>{goma.nivel.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>{goma.unidad}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {selectedReporte.observaciones && (
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Observaciones</Label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedReporte.observaciones}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button>Cerrar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Produccion;

