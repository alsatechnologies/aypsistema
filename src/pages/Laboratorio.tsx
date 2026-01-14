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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, FlaskConical, Clock, CheckCircle, Eye, FileText, Trash2, Calendar, X, Factory, Settings2, Droplets, Thermometer, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import { useLaboratorio } from '@/services/hooks/useLaboratorio';
import type { ReporteLab as ReporteLabDB } from '@/services/supabase/laboratorio';

interface ReporteLab {
  id: string;
  fecha: string;
  responsable: string;
  turno: 'Matutino' | 'Vespertino' | 'Nocturno';
  estatus: 'Pendiente' | 'En proceso' | 'Completado';
  pasta?: {
    textura: {
      promedio: number;
      alto: number;
      bajo: number;
    };
    humedad: {
      promedio: number;
      alto: number;
      bajo: number;
    };
    proteina: Array<{ valor: number; porcentaje: number }>;
    residuales: {
      promedio: number;
      alto: number;
      bajo: number;
    };
    temperaturaPromedio: number;
  };
  expander?: {
    hojuela: {
      residual: number;
      humedad: number;
    };
    semilla: {
      humedad: number;
      contenidoAceite: number;
    };
    costraVibrador: {
      residual: number;
      humedad: number;
    };
    costraDirecta: {
      residual: number;
      humedad: number;
    };
    aceite: Array<{
      tipo: 'Expander' | 'Prensa' | 'Desborrador' | 'Filtro';
      filtroNumeros?: string;
      humedad: number;
      acidez: number;
      acidoOleico: number;
    }>;
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
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const [formData, setFormData] = useState({
    turno: 'Matutino' as 'Matutino' | 'Vespertino' | 'Nocturno',
    responsable: '',
    // Pasta
    pastaTexturaPromedio: '',
    pastaTexturaAlto: '',
    pastaTexturaBajo: '',
    pastaHumedadPromedio: '',
    pastaHumedadAlto: '',
    pastaHumedadBajo: '',
    pastaProteina: [{ valor: '', porcentaje: '' }],
    pastaResidualesPromedio: '',
    pastaResidualesAlto: '',
    pastaResidualesBajo: '',
    pastaTemperatura: '',
    // Expander
    expanderHojuelaResidual: '',
    expanderHojuelaHumedad: '',
    expanderSemillaHumedad: '',
    expanderSemillaContenidoAceite: '',
    expanderCostraVibradorResidual: '',
    expanderCostraVibradorHumedad: '',
    expanderCostraDirectaResidual: '',
    expanderCostraDirectaHumedad: '',
    expanderAceite: [{ tipo: 'Expander' as 'Expander' | 'Prensa' | 'Desborrador' | 'Filtro', filtroNumeros: '', humedad: '', acidez: '', acidoOleico: '' }],
    // Aceite Planta
    aceiteAcidez: '',
    aceiteOleico: '',
    aceiteHumedad: '',
    aceiteFlashPoint: '-' as '+' | '-',
    aceiteFlashPointValor: ''
  });

  const { reportes: reportesDB, loading, addReporte, updateReporte, deleteReporte, loadReportes } = useLaboratorio();
  
  // Mapear reportes de DB a formato local
  const reportes: ReporteLab[] = reportesDB.map(r => {
    const pasta = r.planta_textura_promedio !== null ? {
      textura: {
        promedio: r.planta_textura_promedio || 0,
        alto: r.planta_textura_alto || 0,
        bajo: r.planta_textura_bajo || 0
      },
      humedad: {
        promedio: r.planta_humedad_promedio || 0,
        alto: r.planta_humedad_alto || 0,
        bajo: r.planta_humedad_bajo || 0
      },
      proteina: (r.planta_proteina || []) as Array<{ valor: number; porcentaje: number }>,
      residuales: {
        promedio: r.planta_residuales_promedio || 0,
        alto: r.planta_residuales_alto || 0,
        bajo: r.planta_residuales_bajo || 0
      },
      temperaturaPromedio: r.planta_temperatura_promedio || 0
    } : undefined;
    
    const expander = r.expander_hojuela_residual !== null ? {
      hojuela: {
        residual: r.expander_hojuela_residual || 0,
        humedad: r.expander_hojuela_humedad || 0
      },
      semilla: {
        humedad: r.expander_semilla_humedad || 0,
        contenidoAceite: r.expander_semilla_contenido_aceite || 0
      },
      costraVibrador: {
        residual: r.expander_costra_vibrador_residual || 0,
        humedad: r.expander_costra_vibrador_humedad || 0
      },
      costraDirecta: {
        residual: r.expander_costra_directa_residual || 0,
        humedad: r.expander_costra_directa_humedad || 0
      },
      aceite: (r.expander_aceite || []) as Array<{
        tipo: 'Expander' | 'Prensa' | 'Desborrador' | 'Filtro';
        filtroNumeros?: string;
        humedad: number;
        acidez: number;
        acidoOleico: number;
      }>
    } : undefined;
    
    const aceitePlanta = r.planta_aceite_acidez !== null ? {
      acidez: r.planta_aceite_acidez || 0,
      acidoOleico: r.planta_aceite_oleico || 0,
      humedad: r.planta_aceite_humedad || 0,
      flashPoint: (r.planta_aceite_flash_point || '+') as '+' | '-'
    } : undefined;
    
    return {
      id: r.id,
      fecha: r.fecha,
      responsable: r.responsable,
      turno: r.turno as 'Matutino' | 'Vespertino' | 'Nocturno',
      estatus: r.estatus as 'Pendiente' | 'En proceso' | 'Completado',
      pasta,
      expander,
      aceitePlanta
    };
  });

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

  const filteredReportes = reportes.filter(r => {
    const matchesSearch = 
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
      toast.error('Seleccione un responsable');
      return;
    }

    try {
      const proteina = formData.pastaProteina
        .filter(item => item.valor && item.porcentaje)
        .map(item => ({
          valor: parseFloat(item.valor) || 0,
          porcentaje: parseFloat(item.porcentaje) || 0,
        }));
      
      const expanderAceite = formData.expanderAceite
        .filter(item => item.humedad || item.acidez || item.acidoOleico)
        .map(item => ({
          tipo: item.tipo,
          filtroNumeros: item.filtroNumeros || undefined,
          humedad: parseFloat(item.humedad) || 0,
          acidez: parseFloat(item.acidez) || 0,
          acidoOleico: parseFloat(item.acidoOleico) || 0,
        }));

      await addReporte({
        id: '', // Se generará automáticamente
        fecha: new Date().toISOString().split('T')[0],
        responsable: formData.responsable,
        turno: formData.turno,
        estatus: 'Pendiente',
        // PLANTA
        planta_textura_promedio: formData.pastaTexturaPromedio ? parseFloat(formData.pastaTexturaPromedio) : null,
        planta_textura_alto: formData.pastaTexturaAlto ? parseFloat(formData.pastaTexturaAlto) : null,
        planta_textura_bajo: formData.pastaTexturaBajo ? parseFloat(formData.pastaTexturaBajo) : null,
        planta_humedad_promedio: formData.pastaHumedadPromedio ? parseFloat(formData.pastaHumedadPromedio) : null,
        planta_humedad_alto: formData.pastaHumedadAlto ? parseFloat(formData.pastaHumedadAlto) : null,
        planta_humedad_bajo: formData.pastaHumedadBajo ? parseFloat(formData.pastaHumedadBajo) : null,
        planta_proteina: proteina.length > 0 ? proteina : null,
        planta_residuales_promedio: formData.pastaResidualesPromedio ? parseFloat(formData.pastaResidualesPromedio) : null,
        planta_residuales_alto: formData.pastaResidualesAlto ? parseFloat(formData.pastaResidualesAlto) : null,
        planta_residuales_bajo: formData.pastaResidualesBajo ? parseFloat(formData.pastaResidualesBajo) : null,
        planta_temperatura_promedio: formData.pastaTemperatura ? parseFloat(formData.pastaTemperatura) : null,
        planta_aceite_acidez: formData.aceiteAcidez ? parseFloat(formData.aceiteAcidez) : null,
        planta_aceite_oleico: formData.aceiteOleico ? parseFloat(formData.aceiteOleico) : null,
        planta_aceite_humedad: formData.aceiteHumedad ? parseFloat(formData.aceiteHumedad) : null,
        planta_aceite_flash_point: formData.aceiteFlashPoint === '+' && formData.aceiteFlashPointValor 
          ? `+${formData.aceiteFlashPointValor}` 
          : formData.aceiteFlashPoint || null,
        // EXPANDER
        expander_hojuela_residual: formData.expanderHojuelaResidual ? parseFloat(formData.expanderHojuelaResidual) : null,
        expander_hojuela_humedad: formData.expanderHojuelaHumedad ? parseFloat(formData.expanderHojuelaHumedad) : null,
        expander_semilla_humedad: formData.expanderSemillaHumedad ? parseFloat(formData.expanderSemillaHumedad) : null,
        expander_semilla_contenido_aceite: formData.expanderSemillaContenidoAceite ? parseFloat(formData.expanderSemillaContenidoAceite) : null,
        expander_costra_vibrador_residual: formData.expanderCostraVibradorResidual ? parseFloat(formData.expanderCostraVibradorResidual) : null,
        expander_costra_vibrador_humedad: formData.expanderCostraVibradorHumedad ? parseFloat(formData.expanderCostraVibradorHumedad) : null,
        expander_costra_directa_residual: formData.expanderCostraDirectaResidual ? parseFloat(formData.expanderCostraDirectaResidual) : null,
        expander_costra_directa_humedad: formData.expanderCostraDirectaHumedad ? parseFloat(formData.expanderCostraDirectaHumedad) : null,
        expander_aceite: expanderAceite.length > 0 ? expanderAceite : null
      });
      
      await loadReportes();
      
      setFormData({
        turno: 'Matutino',
        responsable: '',
        pastaTexturaPromedio: '',
        pastaTexturaAlto: '',
        pastaTexturaBajo: '',
        pastaHumedadPromedio: '',
        pastaHumedadAlto: '',
        pastaHumedadBajo: '',
        pastaProteina: [{ valor: '', porcentaje: '' }],
        pastaResidualesPromedio: '',
        pastaResidualesAlto: '',
        pastaResidualesBajo: '',
        pastaTemperatura: '',
        expanderHojuelaResidual: '',
        expanderHojuelaHumedad: '',
        expanderSemillaHumedad: '',
        expanderSemillaContenidoAceite: '',
        expanderCostraVibradorResidual: '',
        expanderCostraVibradorHumedad: '',
        expanderCostraDirectaResidual: '',
        expanderCostraDirectaHumedad: '',
        expanderAceite: [{ tipo: 'Expander' as 'Expander' | 'Prensa' | 'Desborrador' | 'Filtro', filtroNumeros: '', humedad: '', acidez: '', acidoOleico: '' }],
        aceiteAcidez: '',
        aceiteOleico: '',
        aceiteHumedad: '',
        aceiteFlashPoint: '-',
        aceiteFlashPointValor: ''
      });
      setIsNuevoReporteOpen(false);
      toast.success('Reporte de laboratorio creado');
    } catch (error) {
      console.error('Error creating reporte:', error);
      toast.error('Error al crear reporte');
    }
  };

  const handleVerDetalle = (reporte: ReporteLab) => {
    setSelectedReporte(reporte);
    setIsDetalleOpen(true);
  };

  return (
    <Layout>
      <Header title="Laboratorio" subtitle="Reportes diarios de análisis de laboratorio" />
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
            <CardTitle>Reportes de Laboratorio</CardTitle>
            <CardDescription>Registro diario de análisis de calidad</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>FECHA</TableHead>
                  <TableHead>RESPONSABLE</TableHead>
                  <TableHead>TURNO</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReportes.map((reporte) => (
                  <TableRow 
                    key={reporte.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleVerDetalle(reporte)}
                  >
                    <TableCell className="font-medium">{reporte.id}</TableCell>
                    <TableCell>{reporte.fecha}</TableCell>
                    <TableCell>{reporte.responsable}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{reporte.turno}</Badge>
                    </TableCell>
                    <TableCell>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Nuevo Reporte Dialog */}
        <Dialog open={isNuevoReporteOpen} onOpenChange={setIsNuevoReporteOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                  <FlaskConical className="h-5 w-5 text-white" />
                </div>
                Nuevo Reporte de Laboratorio
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              {/* Info General - Card moderna */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Turno</Label>
                    <Select value={formData.turno} onValueChange={(v) => setFormData({ ...formData, turno: v as any })}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Matutino">🌅 Matutino</SelectItem>
                        <SelectItem value="Vespertino">🌤️ Vespertino</SelectItem>
                        <SelectItem value="Nocturno">🌙 Nocturno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Responsable</Label>
                    <Select value={formData.responsable} onValueChange={(v) => setFormData({ ...formData, responsable: v })}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {responsables.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Fecha</Label>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-2 text-sm">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs principales */}
              <Tabs defaultValue="planta" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-slate-100 rounded-lg mb-6">
                  <TabsTrigger 
                    value="planta" 
                    className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md transition-all"
                  >
                    <Factory className="h-4 w-4" />
                    PLANTA
                  </TabsTrigger>
                  <TabsTrigger 
                    value="expander" 
                    className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md transition-all"
                  >
                    <Settings2 className="h-4 w-4" />
                    EXPANDER
                  </TabsTrigger>
                </TabsList>

                {/* TAB PLANTA */}
                <TabsContent value="planta" className="space-y-4 mt-0">
                  {/* PASTA */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <TestTube className="h-4 w-4" />
                        PASTA
                      </h3>
                    </div>
                    <div className="p-4 space-y-5 bg-white">
                      {/* TEXTURA */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-3 block">TEXTURA</Label>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-blue-600 font-medium">Promedio (%)</Label>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="border-slate-200 focus:border-blue-400"
                              value={formData.pastaTexturaPromedio} 
                              onChange={(e) => setFormData({ ...formData, pastaTexturaPromedio: e.target.value })} 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-blue-600 font-medium">Alto (%)</Label>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="border-slate-200 focus:border-blue-400"
                              value={formData.pastaTexturaAlto} 
                              onChange={(e) => setFormData({ ...formData, pastaTexturaAlto: e.target.value })} 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-blue-600 font-medium">Bajo (%)</Label>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="border-slate-200 focus:border-blue-400"
                              value={formData.pastaTexturaBajo} 
                              onChange={(e) => setFormData({ ...formData, pastaTexturaBajo: e.target.value })} 
                            />
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-slate-100" />

                      {/* HUMEDAD */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          HUMEDAD
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-blue-600 font-medium">Promedio (%)</Label>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="border-slate-200 focus:border-blue-400"
                              value={formData.pastaHumedadPromedio} 
                              onChange={(e) => setFormData({ ...formData, pastaHumedadPromedio: e.target.value })} 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-blue-600 font-medium">Alto (%)</Label>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="border-slate-200 focus:border-blue-400"
                              value={formData.pastaHumedadAlto} 
                              onChange={(e) => setFormData({ ...formData, pastaHumedadAlto: e.target.value })} 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-blue-600 font-medium">Bajo (%)</Label>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="border-slate-200 focus:border-blue-400"
                              value={formData.pastaHumedadBajo} 
                              onChange={(e) => setFormData({ ...formData, pastaHumedadBajo: e.target.value })} 
                            />
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-slate-100" />

                      {/* PROTEINA */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-semibold text-slate-700">PROTEÍNA</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                pastaProteina: [...formData.pastaProteina, { valor: '', porcentaje: '' }]
                              });
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Agregar
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {formData.pastaProteina.map((item, index) => (
                            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end bg-slate-50 p-2 rounded-lg">
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Valor</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="5.30"
                                  className="h-9 border-slate-200"
                                  value={item.valor}
                                  onChange={(e) => {
                                    const newProteina = [...formData.pastaProteina];
                                    newProteina[index].valor = e.target.value;
                                    setFormData({ ...formData, pastaProteina: newProteina });
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Porcentaje (%)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="21.47"
                                  className="h-9 border-slate-200"
                                  value={item.porcentaje}
                                  onChange={(e) => {
                                    const newProteina = [...formData.pastaProteina];
                                    newProteina[index].porcentaje = e.target.value;
                                    setFormData({ ...formData, pastaProteina: newProteina });
                                  }}
                                />
                              </div>
                              {formData.pastaProteina.length > 1 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-9 w-9 p-0"
                                  onClick={() => {
                                    const newProteina = formData.pastaProteina.filter((_, i) => i !== index);
                                    setFormData({ ...formData, pastaProteina: newProteina });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator className="bg-slate-100" />

                      {/* RESIDUALES */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-3 block">RESIDUALES</Label>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-blue-600 font-medium">Promedio (%)</Label>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="border-slate-200 focus:border-blue-400"
                              value={formData.pastaResidualesPromedio} 
                              onChange={(e) => setFormData({ ...formData, pastaResidualesPromedio: e.target.value })} 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-blue-600 font-medium">Alto (%)</Label>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="border-slate-200 focus:border-blue-400"
                              value={formData.pastaResidualesAlto} 
                              onChange={(e) => setFormData({ ...formData, pastaResidualesAlto: e.target.value })} 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-blue-600 font-medium">Bajo (%)</Label>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="border-slate-200 focus:border-blue-400"
                              value={formData.pastaResidualesBajo} 
                              onChange={(e) => setFormData({ ...formData, pastaResidualesBajo: e.target.value })} 
                            />
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-slate-100" />

                      {/* TEMPERATURA */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-orange-500" />
                          TEMPERATURA PROMEDIO
                        </Label>
                        <div className="max-w-[200px]">
                          <Input 
                            type="number" 
                            step="0.1" 
                            placeholder="48.5 °C"
                            className="border-slate-200 focus:border-orange-400"
                            value={formData.pastaTemperatura} 
                            onChange={(e) => setFormData({ ...formData, pastaTemperatura: e.target.value })} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACEITE PLANTA */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-3">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        ACEITE PLANTA
                      </h3>
                    </div>
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-amber-600 font-medium">Acidez (%)</Label>
                          <Input type="number" step="0.01" className="border-slate-200 focus:border-amber-400" value={formData.aceiteAcidez} onChange={(e) => setFormData({ ...formData, aceiteAcidez: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-amber-600 font-medium">Ácido Oleico (%)</Label>
                          <Input type="number" step="0.1" className="border-slate-200 focus:border-amber-400" value={formData.aceiteOleico} onChange={(e) => setFormData({ ...formData, aceiteOleico: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-amber-600 font-medium">Humedad (%)</Label>
                          <Input type="number" step="0.01" className="border-slate-200 focus:border-amber-400" value={formData.aceiteHumedad} onChange={(e) => setFormData({ ...formData, aceiteHumedad: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-amber-600 font-medium">Flash Point</Label>
                          <Select value={formData.aceiteFlashPoint} onValueChange={(v) => setFormData({ ...formData, aceiteFlashPoint: v as '+' | '-', aceiteFlashPointValor: v === '-' ? '' : formData.aceiteFlashPointValor })}>
                            <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+">+ (Positivo)</SelectItem>
                              <SelectItem value="-">- (Negativo)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.aceiteFlashPoint === '+' && (
                          <div className="space-y-1.5">
                            <Label className="text-xs text-amber-600 font-medium">Valor Flash Point</Label>
                            <Input 
                              type="number" 
                              step="0.1" 
                              placeholder="250"
                              className="border-slate-200 focus:border-amber-400"
                              value={formData.aceiteFlashPointValor} 
                              onChange={(e) => setFormData({ ...formData, aceiteFlashPointValor: e.target.value })} 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB EXPANDER */}
                <TabsContent value="expander" className="space-y-4 mt-0">
                  {/* Grid de 2 columnas para las primeras 4 secciones */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* HOJUELA */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2">
                        <h3 className="font-semibold text-white text-sm">HOJUELA (PROVISIONAL)</h3>
                      </div>
                      <div className="p-4 bg-white space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-orange-600 font-medium">Residual (%)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            className="h-9 border-slate-200 focus:border-orange-400"
                            value={formData.expanderHojuelaResidual} 
                            onChange={(e) => setFormData({ ...formData, expanderHojuelaResidual: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-orange-600 font-medium">Humedad (%)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            className="h-9 border-slate-200 focus:border-orange-400"
                            value={formData.expanderHojuelaHumedad} 
                            onChange={(e) => setFormData({ ...formData, expanderHojuelaHumedad: e.target.value })} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* SEMILLA */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2">
                        <h3 className="font-semibold text-white text-sm">SEMILLA</h3>
                      </div>
                      <div className="p-4 bg-white space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-green-600 font-medium">Humedad (%)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            className="h-9 border-slate-200 focus:border-green-400"
                            value={formData.expanderSemillaHumedad} 
                            onChange={(e) => setFormData({ ...formData, expanderSemillaHumedad: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-green-600 font-medium">Contenido Aceite (%)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            className="h-9 border-slate-200 focus:border-green-400"
                            value={formData.expanderSemillaContenidoAceite} 
                            onChange={(e) => setFormData({ ...formData, expanderSemillaContenidoAceite: e.target.value })} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* COSTRA VIBRADOR */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-violet-500 px-4 py-2">
                        <h3 className="font-semibold text-white text-sm">COSTRA VIBRADOR</h3>
                      </div>
                      <div className="p-4 bg-white space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-purple-600 font-medium">Residual (%)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            className="h-9 border-slate-200 focus:border-purple-400"
                            value={formData.expanderCostraVibradorResidual} 
                            onChange={(e) => setFormData({ ...formData, expanderCostraVibradorResidual: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-purple-600 font-medium">Humedad (%)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            className="h-9 border-slate-200 focus:border-purple-400"
                            value={formData.expanderCostraVibradorHumedad} 
                            onChange={(e) => setFormData({ ...formData, expanderCostraVibradorHumedad: e.target.value })} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* COSTRA DIRECTA */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2">
                        <h3 className="font-semibold text-white text-sm">COSTRA DIRECTA</h3>
                      </div>
                      <div className="p-4 bg-white space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-rose-600 font-medium">Residual (%)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            className="h-9 border-slate-200 focus:border-rose-400"
                            value={formData.expanderCostraDirectaResidual} 
                            onChange={(e) => setFormData({ ...formData, expanderCostraDirectaResidual: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-rose-600 font-medium">Humedad (%)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            className="h-9 border-slate-200 focus:border-rose-400"
                            value={formData.expanderCostraDirectaHumedad} 
                            onChange={(e) => setFormData({ ...formData, expanderCostraDirectaHumedad: e.target.value })} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACEITE - Tabla moderna */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-3 flex items-center justify-between">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        ACEITE
                      </h3>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            expanderAceite: [...formData.expanderAceite, { tipo: 'Expander', filtroNumeros: '', humedad: '', acidez: '', acidoOleico: '' }]
                          });
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar
                      </Button>
                    </div>
                    <div className="p-4 bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-2 px-2 text-slate-500 font-medium text-xs">Tipo</th>
                              <th className="text-left py-2 px-2 text-slate-500 font-medium text-xs">Filtro</th>
                              <th className="text-left py-2 px-2 text-slate-500 font-medium text-xs">Humedad</th>
                              <th className="text-left py-2 px-2 text-slate-500 font-medium text-xs">Acidez</th>
                              <th className="text-left py-2 px-2 text-slate-500 font-medium text-xs">Ác. Oleico</th>
                              <th className="w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.expanderAceite.map((item, index) => (
                              <tr key={index} className="border-b border-slate-100 last:border-0">
                                <td className="py-2 px-2">
                                  <Select 
                                    value={item.tipo} 
                                    onValueChange={(v) => {
                                      const newAceite = [...formData.expanderAceite];
                                      newAceite[index].tipo = v as any;
                                      setFormData({ ...formData, expanderAceite: newAceite });
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs border-slate-200">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Expander">Expander</SelectItem>
                                      <SelectItem value="Prensa">Prensa</SelectItem>
                                      <SelectItem value="Desborrador">Desborrador</SelectItem>
                                      <SelectItem value="Filtro">Filtro</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="py-2 px-2">
                                  {item.tipo === 'Filtro' ? (
                                    <Input
                                      placeholder="19, 23, 2..."
                                      className="h-8 text-xs border-slate-200"
                                      value={item.filtroNumeros}
                                      onChange={(e) => {
                                        const newAceite = [...formData.expanderAceite];
                                        newAceite[index].filtroNumeros = e.target.value;
                                        setFormData({ ...formData, expanderAceite: newAceite });
                                      }}
                                    />
                                  ) : (
                                    <Input disabled className="h-8 text-xs bg-slate-50 border-slate-200" />
                                  )}
                                </td>
                                <td className="py-2 px-2">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="h-8 text-xs border-slate-200"
                                    value={item.humedad}
                                    onChange={(e) => {
                                      const newAceite = [...formData.expanderAceite];
                                      newAceite[index].humedad = e.target.value;
                                      setFormData({ ...formData, expanderAceite: newAceite });
                                    }}
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="h-8 text-xs border-slate-200"
                                    value={item.acidez}
                                    onChange={(e) => {
                                      const newAceite = [...formData.expanderAceite];
                                      newAceite[index].acidez = e.target.value;
                                      setFormData({ ...formData, expanderAceite: newAceite });
                                    }}
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <Input
                                    type="number"
                                    step="0.0001"
                                    placeholder="0.0000"
                                    className="h-8 text-xs border-slate-200"
                                    value={item.acidoOleico}
                                    onChange={(e) => {
                                      const newAceite = [...formData.expanderAceite];
                                      newAceite[index].acidoOleico = e.target.value;
                                      setFormData({ ...formData, expanderAceite: newAceite });
                                    }}
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  {formData.expanderAceite.length > 1 && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      onClick={() => {
                                        const newAceite = formData.expanderAceite.filter((_, i) => i !== index);
                                        setFormData({ ...formData, expanderAceite: newAceite });
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-600" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
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
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            {selectedReporte && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Reporte {selectedReporte.id} - {selectedReporte.fecha}
                  </DialogTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span><strong>Responsable:</strong> {selectedReporte.responsable}</span>
                    <span><strong>Turno:</strong> <Badge variant="outline" className="ml-1">{selectedReporte.turno}</Badge></span>
                  </div>
                </DialogHeader>
                <div className="py-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Columna Izquierda - PLANTA */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg mb-4 pb-2 border-b">PLANTA</h3>
                      
                      {selectedReporte.pasta && (
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-base mb-3">PASTA</h4>
                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="font-semibold text-red-600">TEXTURA:</span>
                                <div className="ml-2 mt-1 space-y-1">
                                  <div>PROMEDIO: <span className="font-medium">{selectedReporte.pasta.textura.promedio}%</span></div>
                                  <div>ALTO: <span className="font-medium">{selectedReporte.pasta.textura.alto}%</span></div>
                                  <div>BAJO: <span className="font-medium">{selectedReporte.pasta.textura.bajo}%</span></div>
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <span className="font-semibold text-red-600">HUMEDAD:</span>
                                <div className="ml-2 mt-1 space-y-1">
                                  <div>PROMEDIO: <span className="font-medium">{selectedReporte.pasta.humedad.promedio}%</span></div>
                                  <div>ALTO: <span className="font-medium">{selectedReporte.pasta.humedad.alto}%</span></div>
                                  <div>BAJO: <span className="font-medium">{selectedReporte.pasta.humedad.bajo}%</span></div>
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <span className="font-semibold text-red-600">PROTEINA:</span>
                                <div className="ml-2 mt-1 space-y-1">
                                  {selectedReporte.pasta.proteina.map((item, idx) => (
                                    <div key={idx}><span className="font-medium">{item.valor}</span>: <span className="font-medium">{item.porcentaje}%</span></div>
                                  ))}
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <span className="font-semibold text-red-600">RESIDUALES:</span>
                                <div className="ml-2 mt-1 space-y-1">
                                  <div>PROMEDIO: <span className="font-medium">{selectedReporte.pasta.residuales.promedio}%</span></div>
                                  <div>ALTO: <span className="font-medium">{selectedReporte.pasta.residuales.alto}%</span></div>
                                  <div>BAJO: <span className="font-medium">{selectedReporte.pasta.residuales.bajo}%</span></div>
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <span className="font-semibold text-red-600">TEMPERATURA PROMEDIO:</span> <span className="font-medium">{selectedReporte.pasta.temperaturaPromedio}°C</span>
                              </div>
                            </div>
                          </div>

                          {selectedReporte.aceitePlanta && (
                            <div className="border rounded-lg p-4 bg-gray-50">
                              <h4 className="font-semibold text-base mb-3">ACEITE PLANTA</h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-muted-foreground">Acidez:</span> <span className="font-medium">{selectedReporte.aceitePlanta.acidez}%</span></div>
                                <div><span className="text-muted-foreground">Ác. Oleico:</span> <span className="font-medium">{selectedReporte.aceitePlanta.acidoOleico}%</span></div>
                                <div><span className="text-muted-foreground">Humedad:</span> <span className="font-medium">{selectedReporte.aceitePlanta.humedad}%</span></div>
                                <div><span className="text-muted-foreground">Flash Point:</span> <span className="font-medium">{selectedReporte.aceitePlanta.flashPoint}</span></div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Columna Derecha - EXPANDER */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg mb-4 pb-2 border-b">EXPANDER</h3>
                      
                      {selectedReporte.expander && (
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-base mb-3">HOJUELA (PROVISIONAL)</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div><span className="text-muted-foreground">RESIDUAL:</span> <span className="font-medium">{selectedReporte.expander.hojuela.residual}%</span></div>
                              <div><span className="text-muted-foreground">HUMEDAD:</span> <span className="font-medium">{selectedReporte.expander.hojuela.humedad}%</span></div>
                            </div>
                          </div>

                          <div className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-base mb-3">SEMILLA</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div><span className="text-muted-foreground">HUMEDAD:</span> <span className="font-medium">{selectedReporte.expander.semilla.humedad}%</span></div>
                              <div><span className="text-muted-foreground">CONTENIDO ACEITE:</span> <span className="font-medium">{selectedReporte.expander.semilla.contenidoAceite}%</span></div>
                            </div>
                          </div>

                          <div className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-base mb-3">COSTRA VIBRADOR</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div><span className="text-muted-foreground">RESIDUAL:</span> <span className="font-medium">{selectedReporte.expander.costraVibrador.residual}%</span></div>
                              <div><span className="text-muted-foreground">HUMEDAD:</span> <span className="font-medium">{selectedReporte.expander.costraVibrador.humedad}%</span></div>
                            </div>
                          </div>

                          <div className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-base mb-3">COSTRA DIRECTA</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div><span className="text-muted-foreground">RESIDUAL:</span> <span className="font-medium">{selectedReporte.expander.costraDirecta.residual}%</span></div>
                              <div><span className="text-muted-foreground">HUMEDAD:</span> <span className="font-medium">{selectedReporte.expander.costraDirecta.humedad}%</span></div>
                            </div>
                          </div>

                          <div className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-semibold text-base mb-3">ACEITE</h4>
                            <div className="space-y-2 text-sm">
                              {selectedReporte.expander.aceite.map((item, idx) => (
                                <div key={idx} className="pb-2 border-b last:border-0">
                                  <div className="font-medium mb-1">
                                    {item.tipo === 'Filtro' && item.filtroNumeros 
                                      ? `Filtro (${item.filtroNumeros})`
                                      : item.tipo
                                    }
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                                    <div>HUMEDAD: <span className="font-medium text-foreground">{item.humedad}%</span></div>
                                    <div>ACIDEZ: <span className="font-medium text-foreground">{item.acidez}%</span></div>
                                    <div>ÁCIDO OLEICO: <span className="font-medium text-foreground">{item.acidoOleico}%</span></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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