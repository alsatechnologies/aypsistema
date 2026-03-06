import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, History, User, Calendar as CalendarIcon, Filter, Eye, Plus, Edit, Trash2, RefreshCw, ChevronDown, ChevronRight, Truck, PackageOpen, LayoutGrid } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatDateTimeMST } from '@/utils/dateUtils';

interface AuditoriaEntry {
  id: number;
  tabla: string;
  registro_id: number;
  accion: 'INSERT' | 'UPDATE' | 'DELETE' | 'DELETE_PERMANENT';
  datos_anteriores: Record<string, any> | null;
  datos_nuevos: Record<string, any> | null;
  usuario_id: number | null;
  usuario_email: string | null;
  fecha_hora: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface GrupoBoleta {
  boleta: string;
  ultimoCambio: AuditoriaEntry;
  totalCambios: number;
  cambios: AuditoriaEntry[];
}

const TABLAS_AMIGABLES: Record<string, string> = {
  'embarques': 'Embarques',
  'recepciones': 'Recibas',
  'ordenes': 'Órdenes',
  'movimientos': 'Movimientos',
  'clientes': 'Clientes',
  'proveedores': 'Proveedores',
  'productos': 'Productos',
  'almacenes': 'Almacenes',
  'usuarios': 'Usuarios',
  'ingresos': 'Ingresos',
  'reportes_laboratorio': 'Reportes Lab',
  'inventario_almacenes': 'Inventario',
  'reportes_produccion': 'Producción',
};

const ACCIONES_AMIGABLES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'INSERT': { label: 'Creación', color: 'bg-green-100 text-green-700 border-green-300', icon: <Plus className="h-3 w-3" /> },
  'UPDATE': { label: 'Modificación', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: <Edit className="h-3 w-3" /> },
  'DELETE': { label: 'Eliminación', color: 'bg-red-100 text-red-700 border-red-300', icon: <Trash2 className="h-3 w-3" /> },
  'DELETE_PERMANENT': { label: 'Eliminación Permanente', color: 'bg-red-200 text-red-800 border-red-400', icon: <Trash2 className="h-3 w-3" /> },
};

const CAMPOS_AMIGABLES: Record<string, string> = {
  'cantidad': 'Cantidad',
  'producto_id': 'ID Producto',
  'almacen_id': 'ID Almacén',
  '_producto': 'Producto',
  '_almacen': 'Almacén',
  '_reporte_id': 'Reporte',
  '_responsable': 'Responsable',
  '_fecha': 'Fecha',
  'peso_bruto': 'Peso Bruto',
  'peso_tara': 'Peso Tara',
  'peso_neto': 'Peso Neto',
  'estatus': 'Estatus',
  'boleta': 'Boleta',
  'codigo_lote': 'Código de Lote',
  'producto': 'Producto',
  'cliente': 'Cliente',
  'proveedor': 'Proveedor',
  'chofer': 'Chofer',
  'placas': 'Placas',
  'observaciones': 'Observaciones',
  'destino': 'Destino',
  'origen': 'Origen',
  'tipo_transporte': 'Tipo Transporte',
  'tipo_operacion': 'Tipo Operación',
  'fecha_hora_ingreso': 'Fecha/Hora Ingreso',
  'fecha_hora_salida': 'Fecha/Hora Salida',
  'hora_peso_bruto': 'Hora Peso Bruto',
  'hora_peso_tara': 'Hora Peso Tara',
  'analisis': 'Análisis',
  'niveles_tanques': 'Niveles de Tanques',
  'niveles_gomas': 'Niveles de Gomas',
  'responsable': 'Responsable',
  'turno': 'Turno',
  'fecha': 'Fecha',
  'expander_litros': 'Expander (litros)',
  'comb_alterno_porcentaje': 'Comb. Alterno (%)',
  'combustoleo_porcentaje': 'Combustóleo (%)',
  'activo': 'Activo',
};

const Auditoria = () => {
  const [registros, setRegistros] = useState<AuditoriaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroTabla, setFiltroTabla] = useState<string>('all');
  const [filtroAccion, setFiltroAccion] = useState<string>('all');
  const [filtroUsuario, setFiltroUsuario] = useState<string>('all');
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>();
  const [fechaFin, setFechaFin] = useState<Date | undefined>();
  const [selectedEntry, setSelectedEntry] = useState<AuditoriaEntry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [usuariosMap, setUsuariosMap] = useState<Map<string, string>>(new Map());
  const [inventarioProductosMap, setInventarioProductosMap] = useState<Map<number, string>>(new Map());
  const [expandedBoleta, setExpandedBoleta] = useState<string | null>(null);

  const loadUsuarios = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('correo, nombre_completo');
      if (error) throw error;
      const map = new Map<string, string>();
      (data || []).forEach(u => {
        if (u.correo && u.nombre_completo) map.set(u.correo, u.nombre_completo);
      });
      setUsuariosMap(map);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const loadInventarioProductos = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('inventario_almacenes')
        .select(`id, producto:productos(nombre)`);
      if (error) throw error;
      const map = new Map<number, string>();
      (data || []).forEach((item: any) => {
        if (item.id && item.producto?.nombre) map.set(item.id, item.producto.nombre);
      });
      setInventarioProductosMap(map);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
    }
  };

  const loadAuditoria = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('auditoria')
        .select('*')
        .order('fecha_hora', { ascending: false })
        .limit(500);
      if (error) throw error;
      setRegistros(data || []);
    } catch (error) {
      console.error('Error al cargar auditoría:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
    loadInventarioProductos();
    loadAuditoria();
  }, []);

  const getNombreUsuario = (email: string | null) => {
    if (!email) return 'Sistema';
    return usuariosMap.get(email) || email;
  };

  const getRegistroIdentificador = (registro: AuditoriaEntry) => {
    const boleta = registro.datos_nuevos?.boleta || registro.datos_anteriores?.boleta;
    if (boleta) return boleta;
    const reporteId = registro.datos_nuevos?._reporte_id || registro.datos_anteriores?._reporte_id;
    if (reporteId) return reporteId;
    const producto = registro.datos_nuevos?._producto || registro.datos_anteriores?._producto;
    if (producto) return producto;
    if (registro.tabla === 'inventario_almacenes') {
      const nombreProducto = inventarioProductosMap.get(registro.registro_id);
      if (nombreProducto) return nombreProducto;
    }
    return `#${registro.registro_id}`;
  };

  const usuariosUnicos = useMemo(() => {
    const emails = new Set(registros.map(r => r.usuario_email).filter(Boolean));
    return Array.from(emails).map(email => ({
      email: email as string,
      nombre: usuariosMap.get(email as string) || email as string
    }));
  }, [registros, usuariosMap]);

  const tablasUnicas = useMemo(() => {
    const tablas = new Set(
      registros
        .filter(r => r.tabla !== 'embarques' && r.tabla !== 'recepciones')
        .map(r => r.tabla)
    );
    return Array.from(tablas);
  }, [registros]);

  // Filtrar registros base (sin filtro de tabla para tabs de embarques/recepciones)
  const registrosFiltradosBase = useMemo(() => {
    return registros.filter(registro => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchBoleta = registro.datos_nuevos?.boleta?.toString().toLowerCase().includes(searchLower) ||
                            registro.datos_anteriores?.boleta?.toString().toLowerCase().includes(searchLower);
        const matchEmail = registro.usuario_email?.toLowerCase().includes(searchLower);
        const matchNombre = getNombreUsuario(registro.usuario_email).toLowerCase().includes(searchLower);
        const matchRegistroId = registro.registro_id.toString().includes(search);
        if (!matchBoleta && !matchEmail && !matchNombre && !matchRegistroId) return false;
      }
      if (filtroAccion !== 'all' && registro.accion !== filtroAccion) return false;
      if (filtroUsuario !== 'all' && registro.usuario_email !== filtroUsuario) return false;
      if (fechaInicio || fechaFin) {
        const fechaRegistro = new Date(registro.fecha_hora);
        if (fechaInicio && fechaRegistro < fechaInicio) return false;
        if (fechaFin) {
          const finDelDia = new Date(fechaFin);
          finDelDia.setHours(23, 59, 59, 999);
          if (fechaRegistro > finDelDia) return false;
        }
      }
      return true;
    });
  }, [registros, search, filtroAccion, filtroUsuario, fechaInicio, fechaFin]);

  // Registros filtrados para "Otros" (respeta filtro de tabla)
  const registrosFiltradosOtros = useMemo(() => {
    return registrosFiltradosBase.filter(r => {
      if (r.tabla === 'embarques' || r.tabla === 'recepciones') return false;
      if (filtroTabla !== 'all' && r.tabla !== filtroTabla) return false;
      return true;
    });
  }, [registrosFiltradosBase, filtroTabla]);

  // Agrupar embarques por boleta
  const embarquesAgrupados = useMemo((): GrupoBoleta[] => {
    const registrosEmb = registrosFiltradosBase.filter(r => r.tabla === 'embarques');
    const grupos = new Map<string, AuditoriaEntry[]>();
    registrosEmb.forEach(r => {
      const boleta = r.datos_nuevos?.boleta || r.datos_anteriores?.boleta;
      if (!boleta) return;
      if (!grupos.has(boleta)) grupos.set(boleta, []);
      grupos.get(boleta)!.push(r);
    });
    return Array.from(grupos.entries())
      .map(([boleta, cambios]) => {
        const ordenados = [...cambios].sort(
          (a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()
        );
        return { boleta, ultimoCambio: ordenados[0], totalCambios: cambios.length, cambios: ordenados };
      })
      .sort((a, b) => new Date(b.ultimoCambio.fecha_hora).getTime() - new Date(a.ultimoCambio.fecha_hora).getTime());
  }, [registrosFiltradosBase]);

  // Agrupar recepciones por boleta
  const recepcionesAgrupadas = useMemo((): GrupoBoleta[] => {
    const registrosRec = registrosFiltradosBase.filter(r => r.tabla === 'recepciones');
    const grupos = new Map<string, AuditoriaEntry[]>();
    registrosRec.forEach(r => {
      const boleta = r.datos_nuevos?.boleta || r.datos_anteriores?.boleta;
      if (!boleta) return;
      if (!grupos.has(boleta)) grupos.set(boleta, []);
      grupos.get(boleta)!.push(r);
    });
    return Array.from(grupos.entries())
      .map(([boleta, cambios]) => {
        const ordenados = [...cambios].sort(
          (a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()
        );
        return { boleta, ultimoCambio: ordenados[0], totalCambios: cambios.length, cambios: ordenados };
      })
      .sort((a, b) => new Date(b.ultimoCambio.fecha_hora).getTime() - new Date(a.ultimoCambio.fecha_hora).getTime());
  }, [registrosFiltradosBase]);

  const getAccionBadge = (accion: string) => {
    const config = ACCIONES_AMIGABLES[accion] || { label: accion, color: 'bg-gray-100 text-gray-700', icon: null };
    return (
      <Badge className={`flex items-center gap-1 w-fit ${config.color}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getTablaNombre = (tabla: string) => TABLAS_AMIGABLES[tabla] || tabla;

  const handleVerDetalle = (entry: AuditoriaEntry) => {
    setSelectedEntry(entry);
    setIsDetailOpen(true);
  };

  const getEtiquetaCampo = (key: string) => CAMPOS_AMIGABLES[key] || key;

  const renderJsonDiff = (anterior: Record<string, any> | null, nuevo: Record<string, any> | null) => {
    const allKeys = new Set([
      ...Object.keys(anterior || {}),
      ...Object.keys(nuevo || {})
    ]);
    const excludeKeys = ['created_at', 'updated_at', 'id', 'producto_id', 'almacen_id', 'cliente_id', 'proveedor_id', 'activo'];
    const contextKeys = ['_producto', '_almacen', '_reporte_id', '_responsable', '_fecha'];
    const contexto = contextKeys
      .filter(key => nuevo?.[key] || anterior?.[key])
      .map(key => ({ label: getEtiquetaCampo(key), value: nuevo?.[key] || anterior?.[key] }));

    return (
      <div className="space-y-3">
        {contexto.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-600 font-medium mb-1">Contexto:</p>
            {contexto.map((ctx, idx) => (
              <p key={idx} className="text-sm">
                <span className="font-medium">{ctx.label}:</span> {ctx.value}
              </p>
            ))}
          </div>
        )}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {Array.from(allKeys)
            .filter(key => !excludeKeys.includes(key) && !contextKeys.includes(key))
            .map(key => {
              const valorAnterior = anterior?.[key];
              const valorNuevo = nuevo?.[key];
              const cambio = JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo);
              if (!cambio && anterior && nuevo) return null;
              return (
                <div key={key} className={cn(
                  "p-2 rounded text-sm",
                  cambio ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"
                )}>
                  <span className="font-medium text-gray-700">{getEtiquetaCampo(key)}:</span>
                  {anterior && valorAnterior !== undefined && (
                    <div className="ml-2 text-red-600">
                      <span className="text-xs text-gray-500">Antes: </span>
                      {typeof valorAnterior === 'object' ? JSON.stringify(valorAnterior) : String(valorAnterior || '-')}
                    </div>
                  )}
                  {nuevo && valorNuevo !== undefined && (
                    <div className="ml-2 text-green-600">
                      <span className="text-xs text-gray-500">Después: </span>
                      {typeof valorNuevo === 'object' ? JSON.stringify(valorNuevo) : String(valorNuevo || '-')}
                    </div>
                  )}
                </div>
              );
            })
            .filter(Boolean)}
        </div>
      </div>
    );
  };

  const limpiarFiltros = () => {
    setSearch('');
    setFiltroTabla('all');
    setFiltroAccion('all');
    setFiltroUsuario('all');
    setFechaInicio(undefined);
    setFechaFin(undefined);
    setExpandedBoleta(null);
  };

  const handleToggleBoleta = (boleta: string) => {
    setExpandedBoleta(prev => prev === boleta ? null : boleta);
  };

  // Tabla agrupada para embarques o recepciones
  const renderTablaBoletas = (grupos: GrupoBoleta[]) => {
    if (grupos.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No se encontraron registros
        </div>
      );
    }

    return (
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[140px]">Boleta</TableHead>
              <TableHead className="w-[130px]">Última Acción</TableHead>
              <TableHead className="w-[170px]">Fecha/Hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead className="w-[100px] text-center">Cambios</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grupos.map((grupo) => (
              <React.Fragment key={grupo.boleta}>
                {/* Fila de boleta */}
                <TableRow
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleToggleBoleta(grupo.boleta)}
                >
                  <TableCell className="text-muted-foreground">
                    {expandedBoleta === grupo.boleta
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />
                    }
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {grupo.boleta}
                  </TableCell>
                  <TableCell>
                    {getAccionBadge(grupo.ultimoCambio.accion)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatDateTimeMST(grupo.ultimoCambio.fecha_hora)}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {getNombreUsuario(grupo.ultimoCambio.usuario_email)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {grupo.totalCambios} {grupo.totalCambios === 1 ? 'cambio' : 'cambios'}
                    </Badge>
                  </TableCell>
                </TableRow>

                {/* Timeline expandido */}
                {expandedBoleta === grupo.boleta && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/20 p-0">
                      <div className="p-4 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Timeline de cambios — {grupo.boleta}
                        </p>
                        {grupo.cambios.map((entry, idx) => (
                          <div key={entry.id} className="flex gap-3">
                            {/* Línea de tiempo */}
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                              {idx < grupo.cambios.length - 1 && (
                                <div className="w-px flex-1 bg-border mt-1" />
                              )}
                            </div>
                            {/* Contenido */}
                            <div className="flex-1 pb-3">
                              <div className="flex items-center gap-2 mb-2">
                                {getAccionBadge(entry.accion)}
                                <span className="text-xs text-muted-foreground font-mono">
                                  {formatDateTimeMST(entry.fecha_hora)}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {getNombreUsuario(entry.usuario_email)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 ml-auto"
                                  onClick={(e) => { e.stopPropagation(); handleVerDetalle(entry); }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Detalle</span>
                                </Button>
                              </div>
                              {renderJsonDiff(entry.datos_anteriores, entry.datos_nuevos)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Tabla estándar para "Otros"
  const renderTablaOtros = () => {
    if (registrosFiltradosOtros.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No se encontraron registros de auditoría
        </div>
      );
    }

    return (
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[160px]">Fecha/Hora</TableHead>
              <TableHead className="w-[100px]">Módulo</TableHead>
              <TableHead className="w-[100px]">Registro</TableHead>
              <TableHead className="w-[120px]">Acción</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead className="w-[100px]">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrosFiltradosOtros.map((registro) => (
              <TableRow key={registro.id} className="hover:bg-muted/50">
                <TableCell className="font-mono text-xs">
                  {formatDateTimeMST(registro.fecha_hora)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getTablaNombre(registro.tabla)}</Badge>
                </TableCell>
                <TableCell className="text-sm max-w-[200px] truncate" title={getRegistroIdentificador(registro)}>
                  {getRegistroIdentificador(registro)}
                </TableCell>
                <TableCell>
                  {getAccionBadge(registro.accion)}
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {getNombreUsuario(registro.usuario_email)}
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => handleVerDetalle(registro)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Layout>
      <Header title="Historial de Modificaciones" subtitle="Auditoría del sistema" />

      <div className="p-6 space-y-6">
        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Búsqueda */}
              <div className="lg:col-span-2">
                <Label className="text-xs text-muted-foreground">Buscar</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Boleta, email, ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Filtro de tabla (solo para Otros) */}
              <div>
                <Label className="text-xs text-muted-foreground">Módulo (Otros)</Label>
                <Select value={filtroTabla} onValueChange={setFiltroTabla}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {tablasUnicas.map(tabla => (
                      <SelectItem key={tabla} value={tabla}>
                        {getTablaNombre(tabla)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de acción */}
              <div>
                <Label className="text-xs text-muted-foreground">Acción</Label>
                <Select value={filtroAccion} onValueChange={setFiltroAccion}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="INSERT">Creación</SelectItem>
                    <SelectItem value="UPDATE">Modificación</SelectItem>
                    <SelectItem value="DELETE">Eliminación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de usuario */}
              <div>
                <Label className="text-xs text-muted-foreground">Usuario</Label>
                <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {usuariosUnicos.map(u => (
                      <SelectItem key={u.email} value={u.email}>
                        {u.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botones */}
              <div className="flex items-end gap-2">
                <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                  Limpiar
                </Button>
                <Button variant="outline" size="sm" onClick={loadAuditoria}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filtros de fecha */}
            <div className="flex gap-4 mt-4">
              <div>
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[180px] justify-start text-left font-normal mt-1">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaInicio ? format(fechaInicio, 'dd/MM/yyyy') : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={fechaInicio} onSelect={setFechaInicio} locale={es} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[180px] justify-start text-left font-normal mt-1">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaFin ? format(fechaFin, 'dd/MM/yyyy') : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={fechaFin} onSelect={setFechaFin} locale={es} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tabs defaultValue="embarques">
                <TabsList className="mb-4">
                  <TabsTrigger value="embarques" className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Embarques
                    <Badge variant="secondary" className="ml-1 text-xs">{embarquesAgrupados.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="recepciones" className="flex items-center gap-2">
                    <PackageOpen className="h-4 w-4" />
                    Recibas
                    <Badge variant="secondary" className="ml-1 text-xs">{recepcionesAgrupadas.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="otros" className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Otros
                    <Badge variant="secondary" className="ml-1 text-xs">{registrosFiltradosOtros.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="embarques">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">
                      {embarquesAgrupados.length} {embarquesAgrupados.length === 1 ? 'boleta' : 'boletas'} encontradas
                    </p>
                  </div>
                  {renderTablaBoletas(embarquesAgrupados)}
                </TabsContent>

                <TabsContent value="recepciones">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">
                      {recepcionesAgrupadas.length} {recepcionesAgrupadas.length === 1 ? 'boleta' : 'boletas'} encontradas
                    </p>
                  </div>
                  {renderTablaBoletas(recepcionesAgrupadas)}
                </TabsContent>

                <TabsContent value="otros">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">
                      {registrosFiltradosOtros.length} registros encontrados
                    </p>
                  </div>
                  {renderTablaOtros()}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de detalle */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Detalle del Cambio
            </DialogTitle>
            <DialogDescription>
              {selectedEntry && (
                <span>
                  {getTablaNombre(selectedEntry.tabla)} • {formatDateTimeMST(selectedEntry.fecha_hora)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Módulo</Label>
                  <p className="font-medium">{getTablaNombre(selectedEntry.tabla)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Registro</Label>
                  <p className="font-medium">{getRegistroIdentificador(selectedEntry)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Acción</Label>
                  <div className="mt-1">{getAccionBadge(selectedEntry.accion)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Usuario</Label>
                  <p className="font-medium">{getNombreUsuario(selectedEntry.usuario_email)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Cambios Realizados</Label>
                <div className="mt-2">
                  {renderJsonDiff(selectedEntry.datos_anteriores, selectedEntry.datos_nuevos)}
                </div>
              </div>

              {selectedEntry.user_agent && (
                <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                  <strong>Navegador:</strong> {selectedEntry.user_agent.substring(0, 100)}...
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Auditoria;
