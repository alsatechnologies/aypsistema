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
import { Separator } from '@/components/ui/separator';
import { Search, Plus, FlaskConical, Clock, CheckCircle, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ReporteLab {
  id: string;
  fecha: string;
  responsable: string;
  turno: 'Matutino' | 'Vespertino' | 'Nocturno';
  estatus: 'Pendiente' | 'En proceso' | 'Completado';
  pasta?: {
    textura: 'Alto' | 'Bajo';
    humedadPromedio: number;
    costraVibrador: 'Alto' | 'Bajo';
    proteina: number;
    residuales: number;
    temperaturaPromedio: number;
  };
  expander?: {
    residual: number;
    humedad: number;
  };
  hojuela?: {
    porcentaje: number;
  };
  semilla?: {
    residual: number;
    humedad: number;
  };
  aceitePlanta?: {
    acidez: number;
    acidoOleico: number;
    humedad: number;
    flashPoint: '+' | '-';
  };
}

const Laboratorio = () => {
  const [search, setSearch] = useState('');
  const [isNuevoReporteOpen, setIsNuevoReporteOpen] = useState(false);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [selectedReporte, setSelectedReporte] = useState<ReporteLab | null>(null);

  const [formData, setFormData] = useState({
    turno: 'Matutino' as 'Matutino' | 'Vespertino' | 'Nocturno',
    responsable: '',
    // Pasta
    pastaTextura: 'Alto' as 'Alto' | 'Bajo',
    pastaHumedad: '',
    pastaCostra: 'Alto' as 'Alto' | 'Bajo',
    pastaProteina: '',
    pastaResiduales: '',
    pastaTemperatura: '',
    // Expander
    expanderResidual: '',
    expanderHumedad: '',
    // Hojuela
    hojuelaPorcentaje: '',
    // Semilla
    semillaResidual: '',
    semillaHumedad: '',
    // Aceite Planta
    aceiteAcidez: '',
    aceiteOleico: '',
    aceiteHumedad: '',
    aceiteFlashPoint: '+' as '+' | '-'
  });

  const [reportes, setReportes] = useState<ReporteLab[]>([
    { 
      id: 'REP-001', 
      fecha: '2024-12-10', 
      responsable: 'Q.F.B. Karen López', 
      turno: 'Matutino', 
      estatus: 'Completado',
      pasta: { textura: 'Alto', humedadPromedio: 12.5, costraVibrador: 'Bajo', proteina: 46.2, residuales: 0.8, temperaturaPromedio: 85 },
      expander: { residual: 1.2, humedad: 11.0 },
      hojuela: { porcentaje: 98.5 },
      semilla: { residual: 0.5, humedad: 10.8 },
      aceitePlanta: { acidez: 0.15, acidoOleico: 23.5, humedad: 0.08, flashPoint: '+' }
    },
    { 
      id: 'REP-002', 
      fecha: '2024-12-09', 
      responsable: 'Q.F.B. Karen López', 
      turno: 'Vespertino', 
      estatus: 'Completado',
      pasta: { textura: 'Bajo', humedadPromedio: 11.8, costraVibrador: 'Alto', proteina: 45.8, residuales: 0.9, temperaturaPromedio: 82 },
      expander: { residual: 1.5, humedad: 11.5 },
      hojuela: { porcentaje: 97.8 },
      semilla: { residual: 0.6, humedad: 11.2 },
      aceitePlanta: { acidez: 0.18, acidoOleico: 24.1, humedad: 0.10, flashPoint: '+' }
    },
    { 
      id: 'REP-003', 
      fecha: '2024-12-09', 
      responsable: 'Ing. Carlos Mendoza', 
      turno: 'Nocturno', 
      estatus: 'En proceso',
      pasta: { textura: 'Alto', humedadPromedio: 12.1, costraVibrador: 'Bajo', proteina: 46.0, residuales: 0.7, temperaturaPromedio: 84 }
    },
    { 
      id: 'REP-004', 
      fecha: '2024-12-08', 
      responsable: 'Q.F.B. Karen López', 
      turno: 'Matutino', 
      estatus: 'Completado',
      pasta: { textura: 'Alto', humedadPromedio: 12.3, costraVibrador: 'Bajo', proteina: 46.5, residuales: 0.6, temperaturaPromedio: 86 },
      expander: { residual: 1.1, humedad: 10.8 },
      hojuela: { porcentaje: 99.0 },
      semilla: { residual: 0.4, humedad: 10.5 },
      aceitePlanta: { acidez: 0.12, acidoOleico: 23.0, humedad: 0.07, flashPoint: '+' }
    },
    { id: 'REP-005', fecha: '2024-12-08', responsable: 'Ing. Carlos Mendoza', turno: 'Vespertino', estatus: 'Pendiente' },
  ]);

  const responsables = ['Q.F.B. Karen López', 'Ing. Carlos Mendoza', 'Q.F.B. Ana García'];

  const getEstatusBadge = (estatus: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      'Pendiente': { className: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3 mr-1" /> },
      'En proceso': { className: 'bg-blue-100 text-blue-700', icon: <FlaskConical className="h-3 w-3 mr-1" /> },
      'Completado': { className: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    };
    const { className, icon } = config[estatus] || { className: 'bg-muted', icon: null };
    return <Badge className={`flex items-center w-fit ${className}`}>{icon}{estatus}</Badge>;
  };

  const filteredReportes = reportes.filter(r =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.responsable.toLowerCase().includes(search.toLowerCase()) ||
    r.fecha.includes(search)
  );

  const handleNuevoReporte = () => {
    if (!formData.responsable) {
      toast.error('Seleccione un responsable');
      return;
    }

    const nuevoReporte: ReporteLab = {
      id: `REP-${String(reportes.length + 1).padStart(3, '0')}`,
      fecha: new Date().toISOString().split('T')[0],
      responsable: formData.responsable,
      turno: formData.turno,
      estatus: 'Pendiente',
      pasta: formData.pastaHumedad ? {
        textura: formData.pastaTextura,
        humedadPromedio: parseFloat(formData.pastaHumedad) || 0,
        costraVibrador: formData.pastaCostra,
        proteina: parseFloat(formData.pastaProteina) || 0,
        residuales: parseFloat(formData.pastaResiduales) || 0,
        temperaturaPromedio: parseFloat(formData.pastaTemperatura) || 0
      } : undefined,
      expander: formData.expanderResidual ? {
        residual: parseFloat(formData.expanderResidual) || 0,
        humedad: parseFloat(formData.expanderHumedad) || 0
      } : undefined,
      hojuela: formData.hojuelaPorcentaje ? {
        porcentaje: parseFloat(formData.hojuelaPorcentaje) || 0
      } : undefined,
      semilla: formData.semillaResidual ? {
        residual: parseFloat(formData.semillaResidual) || 0,
        humedad: parseFloat(formData.semillaHumedad) || 0
      } : undefined,
      aceitePlanta: formData.aceiteAcidez ? {
        acidez: parseFloat(formData.aceiteAcidez) || 0,
        acidoOleico: parseFloat(formData.aceiteOleico) || 0,
        humedad: parseFloat(formData.aceiteHumedad) || 0,
        flashPoint: formData.aceiteFlashPoint
      } : undefined
    };

    setReportes([nuevoReporte, ...reportes]);
    setFormData({
      turno: 'Matutino',
      responsable: '',
      pastaTextura: 'Alto',
      pastaHumedad: '',
      pastaCostra: 'Alto',
      pastaProteina: '',
      pastaResiduales: '',
      pastaTemperatura: '',
      expanderResidual: '',
      expanderHumedad: '',
      hojuelaPorcentaje: '',
      semillaResidual: '',
      semillaHumedad: '',
      aceiteAcidez: '',
      aceiteOleico: '',
      aceiteHumedad: '',
      aceiteFlashPoint: '+'
    });
    setIsNuevoReporteOpen(false);
    toast.success('Reporte de laboratorio creado');
  };

  const handleVerDetalle = (reporte: ReporteLab) => {
    setSelectedReporte(reporte);
    setIsDetalleOpen(true);
  };

  return (
    <Layout>
      <Header title="Laboratorio" subtitle="Reportes diarios de análisis de laboratorio" />
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reportes Hoy</CardTitle>
              <FileText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {reportes.filter(r => r.fecha === new Date().toISOString().split('T')[0]).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{reportes.filter(r => r.estatus === 'Pendiente').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Proceso</CardTitle>
              <FlaskConical className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{reportes.filter(r => r.estatus === 'En proceso').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{reportes.filter(r => r.estatus === 'Completado').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por ID, responsable o fecha..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsNuevoReporteOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Reporte
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reportes de Laboratorio</CardTitle>
            <CardDescription>Registro diario de análisis de calidad</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>FECHA</TableHead>
                  <TableHead>RESPONSABLE</TableHead>
                  <TableHead>TURNO</TableHead>
                  <TableHead>ESTATUS</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReportes.map((reporte) => (
                  <TableRow key={reporte.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{reporte.fecha}</TableCell>
                    <TableCell>{reporte.responsable}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{reporte.turno}</Badge>
                    </TableCell>
                    <TableCell>{getEstatusBadge(reporte.estatus)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleVerDetalle(reporte)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Nuevo Reporte Dialog */}
        <Dialog open={isNuevoReporteOpen} onOpenChange={setIsNuevoReporteOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Nuevo Reporte de Laboratorio
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Info General */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Turno *</Label>
                  <Select value={formData.turno} onValueChange={(v) => setFormData({ ...formData, turno: v as any })}>
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
                <div className="space-y-2">
                  <Label>Responsable *</Label>
                  <Select value={formData.responsable} onValueChange={(v) => setFormData({ ...formData, responsable: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      {responsables.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* PASTA */}
              <div>
                <h3 className="font-semibold text-lg mb-3">PASTA</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Textura</Label>
                    <Select value={formData.pastaTextura} onValueChange={(v) => setFormData({ ...formData, pastaTextura: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alto">Alto</SelectItem>
                        <SelectItem value="Bajo">Bajo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Humedad Promedio (%)</Label>
                    <Input type="number" step="0.1" value={formData.pastaHumedad} onChange={(e) => setFormData({ ...formData, pastaHumedad: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Costra Vibrador</Label>
                    <Select value={formData.pastaCostra} onValueChange={(v) => setFormData({ ...formData, pastaCostra: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alto">Alto</SelectItem>
                        <SelectItem value="Bajo">Bajo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Proteína (%)</Label>
                    <Input type="number" step="0.1" value={formData.pastaProteina} onChange={(e) => setFormData({ ...formData, pastaProteina: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Residuales (%)</Label>
                    <Input type="number" step="0.1" value={formData.pastaResiduales} onChange={(e) => setFormData({ ...formData, pastaResiduales: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Temperatura Promedio (°C)</Label>
                    <Input type="number" value={formData.pastaTemperatura} onChange={(e) => setFormData({ ...formData, pastaTemperatura: e.target.value })} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* EXPANDER */}
              <div>
                <h3 className="font-semibold text-lg mb-3">EXPANDER</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Residual (%)</Label>
                    <Input type="number" step="0.1" value={formData.expanderResidual} onChange={(e) => setFormData({ ...formData, expanderResidual: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Humedad (%)</Label>
                    <Input type="number" step="0.1" value={formData.expanderHumedad} onChange={(e) => setFormData({ ...formData, expanderHumedad: e.target.value })} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* HOJUELA */}
              <div>
                <h3 className="font-semibold text-lg mb-3">HOJUELA (PROVISIONAL)</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Porcentaje (%)</Label>
                    <Input type="number" step="0.1" value={formData.hojuelaPorcentaje} onChange={(e) => setFormData({ ...formData, hojuelaPorcentaje: e.target.value })} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* SEMILLA */}
              <div>
                <h3 className="font-semibold text-lg mb-3">SEMILLA</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Residual (%)</Label>
                    <Input type="number" step="0.1" value={formData.semillaResidual} onChange={(e) => setFormData({ ...formData, semillaResidual: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Humedad (%)</Label>
                    <Input type="number" step="0.1" value={formData.semillaHumedad} onChange={(e) => setFormData({ ...formData, semillaHumedad: e.target.value })} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* ACEITE PLANTA */}
              <div>
                <h3 className="font-semibold text-lg mb-3">ACEITE PLANTA</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Acidez (%)</Label>
                    <Input type="number" step="0.01" value={formData.aceiteAcidez} onChange={(e) => setFormData({ ...formData, aceiteAcidez: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ácido Oleico (%)</Label>
                    <Input type="number" step="0.1" value={formData.aceiteOleico} onChange={(e) => setFormData({ ...formData, aceiteOleico: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Humedad (%)</Label>
                    <Input type="number" step="0.01" value={formData.aceiteHumedad} onChange={(e) => setFormData({ ...formData, aceiteHumedad: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Flash Point</Label>
                    <Select value={formData.aceiteFlashPoint} onValueChange={(v) => setFormData({ ...formData, aceiteFlashPoint: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+">+ (Positivo)</SelectItem>
                        <SelectItem value="-">- (Negativo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleNuevoReporte}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Reporte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detalle Reporte Dialog */}
        <Dialog open={isDetalleOpen} onOpenChange={setIsDetalleOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedReporte && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Reporte {selectedReporte.id} - {selectedReporte.fecha}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Responsable</Label>
                      <p className="font-medium">{selectedReporte.responsable}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Turno</Label>
                      <Badge variant="outline">{selectedReporte.turno}</Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Estatus</Label>
                      {getEstatusBadge(selectedReporte.estatus)}
                    </div>
                  </div>

                  {selectedReporte.pasta && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">PASTA</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div><span className="text-muted-foreground">Textura:</span> {selectedReporte.pasta.textura}</div>
                          <div><span className="text-muted-foreground">Humedad:</span> {selectedReporte.pasta.humedadPromedio}%</div>
                          <div><span className="text-muted-foreground">Costra:</span> {selectedReporte.pasta.costraVibrador}</div>
                          <div><span className="text-muted-foreground">Proteína:</span> {selectedReporte.pasta.proteina}%</div>
                          <div><span className="text-muted-foreground">Residuales:</span> {selectedReporte.pasta.residuales}%</div>
                          <div><span className="text-muted-foreground">Temp:</span> {selectedReporte.pasta.temperaturaPromedio}°C</div>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedReporte.expander && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">EXPANDER</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-muted-foreground">Residual:</span> {selectedReporte.expander.residual}%</div>
                          <div><span className="text-muted-foreground">Humedad:</span> {selectedReporte.expander.humedad}%</div>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedReporte.hojuela && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">HOJUELA</h4>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Porcentaje:</span> {selectedReporte.hojuela.porcentaje}%
                        </div>
                      </div>
                    </>
                  )}

                  {selectedReporte.semilla && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">SEMILLA</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-muted-foreground">Residual:</span> {selectedReporte.semilla.residual}%</div>
                          <div><span className="text-muted-foreground">Humedad:</span> {selectedReporte.semilla.humedad}%</div>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedReporte.aceitePlanta && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">ACEITE PLANTA</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-muted-foreground">Acidez:</span> {selectedReporte.aceitePlanta.acidez}%</div>
                          <div><span className="text-muted-foreground">Ác. Oleico:</span> {selectedReporte.aceitePlanta.acidoOleico}%</div>
                          <div><span className="text-muted-foreground">Humedad:</span> {selectedReporte.aceitePlanta.humedad}%</div>
                          <div><span className="text-muted-foreground">Flash Point:</span> {selectedReporte.aceitePlanta.flashPoint}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cerrar</Button>
                  </DialogClose>
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