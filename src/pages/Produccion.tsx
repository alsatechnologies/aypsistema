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
import { Search, Plus, Factory, Clock, CheckCircle, Eye, Trash2, Calendar, X, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useProduccion } from '@/services/hooks/useProduccion';
import type { ReporteProduccion, NivelTanque, NivelGoma } from '@/services/supabase/produccion';
import { useAuth } from '@/contexts/AuthContext';
import { useAlmacenes } from '@/services/hooks/useAlmacenes';
import { useProductos } from '@/services/hooks/useProductos';

const Produccion = () => {
  const [search, setSearch] = useState('');
  const [isNuevoReporteOpen, setIsNuevoReporteOpen] = useState(false);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [selectedReporte, setSelectedReporte] = useState<ReporteProduccion | null>(null);
  const [reporteEditando, setReporteEditando] = useState<ReporteProduccion | null>(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const { usuario } = useAuth();
  const { almacenes } = useAlmacenes();
  const { productos: productosDB } = useProductos();

  // Filtrar tanques (almacenes que contienen "TQ" en el nombre) y ordenar por nombre
  // Excluir COMBUSTÓLEO, DIESEL y HEXANO
  const tanques = almacenes
    .filter(a => {
      const nombreUpper = a.nombre.toUpperCase();
      return (a.nombre.includes('TQ') || a.nombre.includes('TANQUE')) &&
             !nombreUpper.includes('COMBUSTÓLEO') &&
             !nombreUpper.includes('COMBUSTOLEO') &&
             !nombreUpper.includes('DIESEL') &&
             !nombreUpper.includes('HEXANO');
    })
    .sort((a, b) => {
      // Extraer números de los nombres para ordenar correctamente (TQ 201, TQ 202, etc.)
      const numA = parseInt(a.nombre.match(/\d+/)?.[0] || '999') || 999;
      const numB = parseInt(b.nombre.match(/\d+/)?.[0] || '999') || 999;
      return numA - numB;
    });
  
  // Campos adicionales al final
  const [expanderLitros, setExpanderLitros] = useState<string>('');
  const [combAlternoPorcentaje, setCombAlternoPorcentaje] = useState<string>('');
  const [combustoleoPorcentaje, setCombustoleoPorcentaje] = useState<string>('');
  
  // Filtrar gomas (si existen almacenes con "GOMA" en el nombre)
  const gomas = almacenes.filter(a => 
    a.nombre.toUpperCase().includes('GOMA') || 
    a.nombre.toUpperCase().includes('GOMAS')
  );

  // Estado para niveles: key es el ID del almacén, value es el nivel
  const [nivelesTanques, setNivelesTanques] = useState<Record<number, string>>({});
  const [nivelesGomas, setNivelesGomas] = useState<Record<number, string>>({});
  // Estado para productos por tanque: key es el ID del almacén, value es el ID del producto
  const [productosTanques, setProductosTanques] = useState<Record<number, string>>({});

  const [formData, setFormData] = useState({
    responsable: usuario?.nombre_completo || '',
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

    // Validar que haya al menos un nivel de tanque registrado
    const tanquesConDatos = tanques
      .map(almacen => {
        const nivel = nivelesTanques[almacen.id];
        const nivelGomas = nivelesGomas[almacen.id];
        const nivelNum = nivel ? parseFloat(nivel) : 0;
        const gomasNum = nivelGomas ? parseFloat(nivelGomas) : 0;
        
        // Incluir si tiene al menos nivel o gomas
        if (nivelNum > 0 || gomasNum > 0) {
          return { almacen, nivel: nivelNum, gomas: gomasNum };
        }
        return null;
      })
      .filter((item): item is { almacen: typeof tanques[0]; nivel: number; gomas: number } => item !== null);

    if (tanquesConDatos.length === 0) {
      toast.error('Debe registrar al menos un nivel de tanque o gomas');
      return;
    }

    try {
      // Convertir niveles de tanques a formato esperado
      const nivelesTanquesData: NivelTanque[] = tanquesConDatos
        .filter(item => item.nivel > 0)
        .map(({ almacen, nivel }) => {
          const productoId = productosTanques[almacen.id];
          const producto = productoId ? productosDB.find(p => p.id === parseInt(productoId)) : null;
          return {
            tanque: almacen.nombre,
            producto: producto?.nombre || null,
            nivel: nivel,
            unidad: '%' // Nivel se mide en porcentaje
          };
        });

      // Convertir niveles de gomas a formato esperado (gomas por tanque)
      const nivelesGomasData: NivelGoma[] = tanquesConDatos
        .filter(item => item.gomas > 0)
        .map(({ almacen, gomas }) => ({
          goma: almacen.nombre,
          nivel: gomas,
          unidad: '%' // Gomas se miden en porcentaje
        }));

      // Función helper para parsear números con comas
      const parseNumber = (value: string): number | null => {
        if (!value) return null;
        // Remover comas y espacios, luego parsear
        const cleanValue = value.replace(/,/g, '').replace(/\s/g, '');
        const parsed = parseFloat(cleanValue);
        return isNaN(parsed) || parsed <= 0 ? null : parsed;
      };

      if (reporteEditando) {
        // Actualizar reporte existente
        await updateReporte(reporteEditando.id, {
          responsable: formData.responsable,
          turno: reporteEditando.turno, // Mantener el turno original
          estatus: reporteEditando.estatus, // Mantener el estatus original
          niveles_tanques: nivelesTanquesData.length > 0 ? nivelesTanquesData : null,
          niveles_gomas: nivelesGomasData.length > 0 ? nivelesGomasData : null,
          expander_litros: parseNumber(expanderLitros),
          comb_alterno_porcentaje: parseNumber(combAlternoPorcentaje),
          combustoleo_porcentaje: parseNumber(combustoleoPorcentaje),
          observaciones: formData.observaciones || null
        });
        toast.success('Reporte de producción actualizado exitosamente');
      } else {
        // Crear nuevo reporte
        await addReporte({
          id: '', // Se generará automáticamente
          fecha: new Date().toISOString().split('T')[0],
          responsable: formData.responsable,
          turno: 'Matutino', // Mantener turno en BD pero no mostrar en formulario
          estatus: 'Completado',
          niveles_tanques: nivelesTanquesData.length > 0 ? nivelesTanquesData : null,
          niveles_gomas: nivelesGomasData.length > 0 ? nivelesGomasData : null,
          expander_litros: parseNumber(expanderLitros),
          comb_alterno_porcentaje: parseNumber(combAlternoPorcentaje),
          combustoleo_porcentaje: parseNumber(combustoleoPorcentaje),
          observaciones: formData.observaciones || null
        });
        toast.success('Reporte de producción creado exitosamente');
      }
      
      await loadReportes();
      
      // Resetear formulario
      setFormData({
        responsable: usuario?.nombre_completo || '',
        observaciones: ''
      });
      setNivelesTanques({});
      setNivelesGomas({});
      setProductosTanques({});
      setExpanderLitros('');
      setCombAlternoPorcentaje('');
      setCombustoleoPorcentaje('');
      setReporteEditando(null);
      setIsNuevoReporteOpen(false);
    } catch (error) {
      console.error('Error creating reporte:', error);
      toast.error('Error al crear reporte');
    }
  };

  const handleEditar = (reporte: ReporteProduccion) => {
    setReporteEditando(reporte);
    
    // Cargar datos del reporte en el formulario
    setFormData({
      responsable: reporte.responsable,
      observaciones: reporte.observaciones || ''
    });

    // Cargar niveles de tanques
    const tanquesData: Record<number, string> = {};
    const productosData: Record<number, string> = {};
    if (reporte.niveles_tanques) {
      reporte.niveles_tanques.forEach(t => {
        const tanque = tanques.find(a => a.nombre.trim() === t.tanque.trim());
        if (tanque) {
          tanquesData[tanque.id] = String(t.nivel);
          // Cargar producto si existe
          if (t.producto) {
            const producto = productosDB.find(p => p.nombre === t.producto);
            if (producto) {
              productosData[tanque.id] = String(producto.id);
            }
          }
        }
      });
    }
    setNivelesTanques(tanquesData);
    setProductosTanques(productosData);

    // Cargar niveles de gomas
    const gomasData: Record<number, string> = {};
    if (reporte.niveles_gomas) {
      reporte.niveles_gomas.forEach(g => {
        const tanque = tanques.find(a => a.nombre.trim() === g.goma.trim());
        if (tanque) {
          gomasData[tanque.id] = String(g.nivel);
        }
      });
    }
    setNivelesGomas(gomasData);

    // Cargar campos adicionales
    setExpanderLitros(reporte.expander_litros ? reporte.expander_litros.toLocaleString('es-MX', { maximumFractionDigits: 2 }) : '');
    setCombAlternoPorcentaje(reporte.comb_alterno_porcentaje ? String(reporte.comb_alterno_porcentaje) : '');
    setCombustoleoPorcentaje(reporte.combustoleo_porcentaje ? String(reporte.combustoleo_porcentaje) : '');

    setIsNuevoReporteOpen(true);
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
          <Button onClick={() => {
            setReporteEditando(null);
            setFormData({
              responsable: usuario?.nombre_completo || '',
              observaciones: ''
            });
            setNivelesTanques({});
            setNivelesGomas({});
            setExpanderLitros('');
            setCombAlternoPorcentaje('');
            setCombustoleoPorcentaje('');
            setIsNuevoReporteOpen(true);
          }}>
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
                    <TableHead>ESTATUS</TableHead>
                    <TableHead>ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReportes.map((reporte) => {
                    const fecha = new Date(reporte.fecha);
                    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const diaSemana = diasSemana[fecha.getDay()];
                    const dia = String(fecha.getDate()).padStart(2, '0');
                    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                    const año = fecha.getFullYear();
                    const fechaFormateada = `${diaSemana} ${dia}/${mes}/${año}`;
                    
                    return (
                      <TableRow key={reporte.id}>
                        <TableCell className="font-medium">{reporte.id}</TableCell>
                        <TableCell>{fechaFormateada}</TableCell>
                        <TableCell>{reporte.responsable}</TableCell>
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
                            onClick={() => handleEditar(reporte)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
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
                    );
                  })}
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
                {reporteEditando ? 'Editar Reporte de Producción' : 'Nuevo Reporte de Producción'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha</Label>
                  <Input 
                    type="text" 
                    value={(() => {
                      const fecha = reporteEditando ? new Date(reporteEditando.fecha) : new Date();
                      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                      const diaSemana = diasSemana[fecha.getDay()];
                      const dia = String(fecha.getDate()).padStart(2, '0');
                      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                      const año = fecha.getFullYear();
                      return `${diaSemana} ${dia}/${mes}/${año}`;
                    })()}
                    disabled
                  />
                </div>
                <div>
                  <Label>Responsable *</Label>
                  <Input 
                    value={formData.responsable}
                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                    placeholder="Nombre del responsable"
                  />
                </div>
              </div>

              {/* Niveles de Tanques */}
              {tanques.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Niveles de Tanques</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanque</TableHead>
                          <TableHead className="text-center">Nivel (%)</TableHead>
                          <TableHead className="text-center">Gomas (%)</TableHead>
                          <TableHead>Producto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tanques.map((tanque) => (
                          <TableRow key={tanque.id}>
                            <TableCell className="font-medium">{tanque.nombre.trim()}</TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={nivelesTanques[tanque.id] || ''}
                                onChange={(e) => {
                                  setNivelesTanques({
                                    ...nivelesTanques,
                                    [tanque.id]: e.target.value
                                  });
                                }}
                                className="w-32 mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={nivelesGomas[tanque.id] || ''}
                                onChange={(e) => {
                                  setNivelesGomas({
                                    ...nivelesGomas,
                                    [tanque.id]: e.target.value
                                  });
                                }}
                                className="w-32 mx-auto"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={productosTanques[tanque.id] || ''}
                                onValueChange={(value) => {
                                  setProductosTanques({
                                    ...productosTanques,
                                    [tanque.id]: value
                                  });
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Seleccionar producto" />
                                </SelectTrigger>
                                <SelectContent>
                                  {productosDB
                                    .filter(producto => {
                                      // Normalizar el nombre: convertir a mayúsculas, quitar tildes y espacios
                                      const nombreNormalizado = producto.nombre
                                        .toUpperCase()
                                        .normalize('NFD')
                                        .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
                                        .trim();
                                      // Excluir productos de semilla
                                      if (nombreNormalizado.includes('SEMILLA')) {
                                        return false;
                                      }
                                      return (
                                        (nombreNormalizado.includes('CARTAMO') && nombreNormalizado.includes('PRENSA')) ||
                                        (nombreNormalizado.includes('GIRASOL') && nombreNormalizado.includes('PRENSA')) ||
                                        (nombreNormalizado.includes('SOYA') && nombreNormalizado.includes('PRENSA')) ||
                                        (nombreNormalizado.includes('CARTAMO') && nombreNormalizado.includes('SOLVENTE')) ||
                                        (nombreNormalizado.includes('GIRASOL') && nombreNormalizado.includes('SOLVENTE')) ||
                                        (nombreNormalizado.includes('SOYA') && nombreNormalizado.includes('SOLVENTE')) ||
                                        (nombreNormalizado.includes('CARTAMO') && nombreNormalizado.includes('ORGANICO')) ||
                                        (nombreNormalizado.includes('GIRASOL') && nombreNormalizado.includes('ORGANICO')) ||
                                        nombreNormalizado === 'MEZCLAS'
                                      );
                                    })
                                    .map((producto) => (
                                      <SelectItem key={producto.id} value={String(producto.id)}>
                                        {producto.nombre}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Campos adicionales */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-base font-semibold">Información Adicional</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Expander (Litros)</Label>
                    <Input
                      type="text"
                      placeholder="0"
                      value={expanderLitros}
                      onChange={(e) => {
                        // Permitir números, comas, puntos y espacios
                        const value = e.target.value.replace(/[^\d.,]/g, '');
                        setExpanderLitros(value);
                      }}
                      onBlur={(e) => {
                        // Formatear con comas cuando pierde el foco
                        const value = e.target.value.replace(/,/g, '').replace(/\s/g, '');
                        if (value && !isNaN(parseFloat(value))) {
                          const num = parseFloat(value);
                          if (num >= 1000) {
                            setExpanderLitros(num.toLocaleString('es-MX', { maximumFractionDigits: 2 }));
                          }
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label>Comb. Alterno (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={combAlternoPorcentaje}
                      onChange={(e) => setCombAlternoPorcentaje(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Combustóleo (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={combustoleoPorcentaje}
                      onChange={(e) => setCombustoleoPorcentaje(e.target.value)}
                    />
                  </div>
                </div>
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
              <Button onClick={handleNuevoReporte}>
                {reporteEditando ? 'Actualizar Reporte' : 'Guardar Reporte'}
              </Button>
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
                    <p className="font-medium">{(() => {
                      const fecha = new Date(selectedReporte.fecha);
                      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                      const diaSemana = diasSemana[fecha.getDay()];
                      const dia = String(fecha.getDate()).padStart(2, '0');
                      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                      const año = fecha.getFullYear();
                      return `${diaSemana} ${dia}/${mes}/${año}`;
                    })()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Responsable</Label>
                    <p className="font-medium">{selectedReporte.responsable}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estatus</Label>
                    <div className="mt-1">{getEstatusBadge(selectedReporte.estatus)}</div>
                  </div>
                </div>

                {((selectedReporte.niveles_tanques && selectedReporte.niveles_tanques.length > 0) || 
                  (selectedReporte.niveles_gomas && selectedReporte.niveles_gomas.length > 0)) && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Niveles de Tanques y Gomas</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanque</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">Nivel (%)</TableHead>
                          <TableHead className="text-center">Gomas (%)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          // Crear un mapa de tanques para fácil acceso
                          const tanquesMap = new Map();
                          selectedReporte.niveles_tanques?.forEach(t => {
                            tanquesMap.set(t.tanque, { producto: t.producto, nivel: t.nivel, unidad: t.unidad });
                          });

                          // Crear un mapa de gomas
                          const gomasMap = new Map();
                          selectedReporte.niveles_gomas?.forEach(g => {
                            gomasMap.set(g.goma, { nivel: g.nivel, unidad: g.unidad });
                          });

                          // Obtener todos los tanques únicos (de niveles_tanques y niveles_gomas)
                          const todosTanques = new Set([
                            ...(selectedReporte.niveles_tanques?.map(t => t.tanque) || []),
                            ...(selectedReporte.niveles_gomas?.map(g => g.goma) || [])
                          ]);

                          // Crear filas combinadas
                          return Array.from(todosTanques).map((tanqueNombre, index) => {
                            const tanqueData = tanquesMap.get(tanqueNombre);
                            const gomaData = gomasMap.get(tanqueNombre);
                            
                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{tanqueNombre}</TableCell>
                                <TableCell className="text-center">
                                  {tanqueData 
                                    ? tanqueData.nivel.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                  {gomaData 
                                    ? gomaData.nivel.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : '-'}
                                </TableCell>
                                <TableCell>{tanqueData?.producto || '-'}</TableCell>
                              </TableRow>
                            );
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Campos adicionales en detalle */}
                {(selectedReporte.expander_litros || selectedReporte.comb_alterno_porcentaje || selectedReporte.combustoleo_porcentaje) && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Información Adicional</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedReporte.expander_litros && (
                        <div>
                          <Label className="text-muted-foreground text-sm">Expander</Label>
                          <p className="font-medium">{selectedReporte.expander_litros.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L</p>
                        </div>
                      )}
                      {selectedReporte.comb_alterno_porcentaje && (
                        <div>
                          <Label className="text-muted-foreground text-sm">Comb. Alterno</Label>
                          <p className="font-medium">{selectedReporte.comb_alterno_porcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %</p>
                        </div>
                      )}
                      {selectedReporte.combustoleo_porcentaje && (
                        <div>
                          <Label className="text-muted-foreground text-sm">Combustóleo</Label>
                          <p className="font-medium">{selectedReporte.combustoleo_porcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %</p>
                        </div>
                      )}
                    </div>
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

