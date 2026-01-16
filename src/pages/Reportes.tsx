import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  Package, 
  Factory,
  TrendingUp,
  TrendingDown,
  X,
  Droplet,
  AlertCircle
} from 'lucide-react';
import { Pie, PieChart } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { getRecepciones } from '@/services/supabase/recepciones';
import { getEmbarques, getTotalSalidasPasta } from '@/services/supabase/embarques';
import { useAlmacenes } from '@/services/hooks/useAlmacenes';
import { useProductos } from '@/services/hooks/useProductos';
import { useProveedores } from '@/services/hooks/useProveedores';
import { useClientes } from '@/services/hooks/useClientes';
import { useProduccion } from '@/services/hooks/useProduccion';
import { getTotalInventarioPorProducto } from '@/services/supabase/inventarioAlmacenes';
import type { Recepcion } from '@/services/supabase/recepciones';
import type { Embarque } from '@/services/supabase/embarques';

// Módulo de Reportes - Las gráficas visuales de tanques están AQUÍ en la pestaña Producción
const Reportes = () => {
  const [activeTab, setActiveTab] = useState('entradas');
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>();
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>();
  const [filtroProducto, setFiltroProducto] = useState<string>('todos');
  const [filtroProveedor, setFiltroProveedor] = useState<string>('todos');
  const [filtroCliente, setFiltroCliente] = useState<string>('todos');
  const [filtroAlmacen, setFiltroAlmacen] = useState<string>('todos');
  const [selectedReporteProduccion, setSelectedReporteProduccion] = useState<any>(null);
  const [isDetalleProduccionOpen, setIsDetalleProduccionOpen] = useState(false);

  // Data hooks
  const { productos } = useProductos();
  const { proveedores } = useProveedores();
  const { clientes } = useClientes();
  const { almacenes } = useAlmacenes();
  const { reportes: reportesProduccion } = useProduccion();

  // State for reports data
  const [recepciones, setRecepciones] = useState<Recepcion[]>([]);
  const [embarques, setEmbarques] = useState<Embarque[]>([]);
  const [inventarioPorProducto, setInventarioPorProducto] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInventario, setLoadingInventario] = useState(false);
  const [totalSalidasPasta, setTotalSalidasPasta] = useState<number>(0);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const filters = {
          fechaDesde: fechaDesde ? format(fechaDesde, 'yyyy-MM-dd') : undefined,
          fechaHasta: fechaHasta ? format(fechaHasta, 'yyyy-MM-dd') : undefined,
          producto_id: filtroProducto !== 'todos' ? parseInt(filtroProducto) : undefined,
        };

        if (activeTab === 'entradas') {
          const recepcionesData = await getRecepciones(filters);
          setRecepciones(Array.isArray(recepcionesData) ? recepcionesData : recepcionesData.data || []);
        }

        if (activeTab === 'salidas') {
          const embarquesData = await getEmbarques(filters);
          setEmbarques(Array.isArray(embarquesData) ? embarquesData : embarquesData.data || []);
        }

        if (activeTab === 'inventario') {
          setLoadingInventario(true);
          try {
            const inventarioData = await getTotalInventarioPorProducto();
            setInventarioPorProducto(inventarioData);
            
            // Cargar total de salidas de pasta para calcular capacidad real
            try {
              const salidasPasta = await getTotalSalidasPasta();
              setTotalSalidasPasta(salidasPasta);
            } catch (error) {
              console.error('Error loading salidas de pasta:', error);
              // No bloquear la carga si falla esto
            }
          } catch (error) {
            console.error('Error loading inventario:', error);
            toast.error('Error al cargar inventario por producto');
          } finally {
            setLoadingInventario(false);
          }
        }
      } catch (error) {
        console.error('Error loading report data:', error);
        toast.error('Error al cargar datos del reporte');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, fechaDesde, fechaHasta, filtroProducto]);

  // Filtered data
  const filteredRecepciones = useMemo(() => {
    return recepciones.filter(r => {
      const matchSearch = !search || 
        r.boleta.toLowerCase().includes(search.toLowerCase()) ||
        r.proveedor?.empresa.toLowerCase().includes(search.toLowerCase()) ||
        r.producto?.nombre.toLowerCase().includes(search.toLowerCase());
      
      const matchProveedor = filtroProveedor === 'todos' || 
        (r.proveedor_id && r.proveedor_id.toString() === filtroProveedor);
      
      return matchSearch && matchProveedor;
    });
  }, [recepciones, search, filtroProveedor]);

  const filteredEmbarques = useMemo(() => {
    return embarques.filter(e => {
      const matchSearch = !search || 
        e.boleta.toLowerCase().includes(search.toLowerCase()) ||
        e.cliente?.empresa.toLowerCase().includes(search.toLowerCase()) ||
        e.producto?.nombre.toLowerCase().includes(search.toLowerCase());
      
      const matchCliente = filtroCliente === 'todos' || 
        (e.cliente_id && e.cliente_id.toString() === filtroCliente);
      
      return matchSearch && matchCliente;
    });
  }, [embarques, search, filtroCliente]);

  // Calculate totals
  const totalEntradas = filteredRecepciones.reduce((acc, r) => acc + (r.peso_neto || 0), 0);
  const totalSalidas = filteredEmbarques.reduce((acc, e) => acc + (e.peso_neto || 0), 0);

  // Export functions
  const exportToCSV = (data: any[], headers: string[], filename: string) => {
    if (data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    // Map headers to data keys
    const headerToKey: Record<string, string> = {
      'Boleta': 'boleta',
      'Fecha': 'fecha',
      'Producto': 'producto',
      'Proveedor': 'proveedor',
      'Cliente': 'cliente',
      'Destino': 'destino',
      'Chofer': 'chofer',
      'Placas': 'placas',
      'Peso Bruto (Kg)': 'peso_bruto',
      'Peso Tara (Kg)': 'peso_tara',
      'Peso Neto (Kg)': 'peso_neto',
      'Lote': 'lote',
      'Estatus': 'estatus',
      'Cliente/Proveedor': 'cliente_proveedor',
      'Tipo': 'tipo',
      'Transporte': 'transporte',
      'Ubicación': 'ubicacion',
      'Almacén': 'almacen',
      'Capacidad Total': 'capacidad_total',
      'Capacidad Actual': 'capacidad_actual',
      'Disponible': 'disponible',
      'Porcentaje Ocupado': 'porcentaje_ocupado',
      'Unidad': 'unidad',
      'ID': 'id',
      'Responsable': 'responsable',
      'Tanques con Nivel': 'tanques_nivel',
      'Tanques con Gomas': 'tanques_gomas'
    };

    const rows = data.map(item => headers.map(header => {
      const key = headerToKey[header] || header.toLowerCase().replace(/\s+/g, '_');
      const value = item[key] ?? '';
      return `"${String(value).replace(/"/g, '""')}"`;
    }));
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    // BOM (\uFEFF) para que Excel detecte UTF-8 correctamente
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success('Reporte descargado correctamente');
  };

  const handleExportEntradas = () => {
    const headers = ['Boleta', 'Fecha', 'Producto', 'Proveedor', 'Chofer', 'Placas', 'Peso Bruto (Kg)', 'Peso Tara (Kg)', 'Peso Neto (Kg)', 'Lote', 'Estatus'];
    const data = filteredRecepciones.map(r => ({
      boleta: r.boleta,
      fecha: r.fecha,
      producto: r.producto?.nombre || '',
      proveedor: r.proveedor?.empresa || '',
      chofer: r.chofer || '',
      placas: r.placas || '',
      peso_bruto: r.peso_bruto || 0,
      peso_tara: r.peso_tara || 0,
      peso_neto: r.peso_neto || 0,
      lote: r.codigo_lote || '',
      estatus: r.estatus
    }));
    exportToCSV(data, headers, 'reporte_entradas');
  };

  const handleExportSalidas = () => {
    const headers = ['Boleta', 'Fecha', 'Producto', 'Cliente', 'Destino', 'Chofer', 'Placas', 'Peso Bruto (Kg)', 'Peso Tara (Kg)', 'Peso Neto (Kg)', 'Lote', 'Estatus'];
    const data = filteredEmbarques.map(e => ({
      boleta: e.boleta,
      fecha: e.fecha,
      producto: e.producto?.nombre || '',
      cliente: e.cliente?.empresa || '',
      destino: e.destino || '',
      chofer: e.chofer || '',
      placas: e.placas || '',
      peso_bruto: e.peso_bruto || 0,
      peso_tara: e.peso_tara || 0,
      peso_neto: e.peso_neto || 0,
      lote: e.codigo_lote || '',
      estatus: e.estatus
    }));
    exportToCSV(data, headers, 'reporte_salidas');
  };

  const handleExportSalidasPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Salidas (Embarque)', 14, 15);
    
    // Información del reporte
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const fechaReporte = new Date().toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generado el: ${fechaReporte}`, 14, 22);
    doc.text(`Total de registros: ${filteredEmbarques.length}`, 14, 27);
    
    // Calcular total de salidas
    const totalSalidas = filteredEmbarques.reduce((sum, e) => sum + (e.peso_neto || 0), 0);
    doc.text(`Total de Salidas: ${totalSalidas.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg`, 14, 32);
    
    // Preparar datos para la tabla
    const tableData = filteredEmbarques.map(e => {
      // Formatear fecha sin problemas de zona horaria
      const formatFecha = (fechaStr: string) => {
        if (!fechaStr) return '';
        const [año, mes, dia] = fechaStr.split('-');
        return `${dia}/${mes}/${año}`;
      };
      
      return [
      e.boleta || '',
      formatFecha(e.fecha),
      e.producto?.nombre || '',
      e.cliente?.empresa || '',
      e.destino || '',
      e.chofer || '',
      e.placas || '',
      (e.peso_bruto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      (e.peso_tara || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      (e.peso_neto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      e.codigo_lote || '',
      e.estatus || ''
    ];
    });
    
    // Crear tabla
    autoTable(doc, {
      head: [['Boleta', 'Fecha', 'Producto', 'Cliente', 'Destino', 'Chofer', 'Placas', 'Peso Bruto (Kg)', 'Peso Tara (Kg)', 'Peso Neto (Kg)', 'Lote', 'Estatus']],
      body: tableData,
      startY: 38,
      styles: { 
        fontSize: 6, 
        cellPadding: 1,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      headStyles: { 
        fillColor: [109, 34, 52], // #6D2234
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 7
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 38, left: 10, right: 10 },
      tableWidth: 'auto',
      columnStyles: {
        0: { cellWidth: 18 }, // Boleta
        1: { cellWidth: 18 }, // Fecha
        2: { cellWidth: 35 }, // Producto
        3: { cellWidth: 40 }, // Cliente
        4: { cellWidth: 28 }, // Destino
        5: { cellWidth: 28 }, // Chofer
        6: { cellWidth: 22 }, // Placas
        7: { cellWidth: 22 }, // Peso Bruto
        8: { cellWidth: 22 }, // Peso Tara
        9: { cellWidth: 25 }, // Peso Neto
        10: { cellWidth: 40 }, // Lote
        11: { cellWidth: 22 }  // Estatus
      }
    });
    
    // Guardar PDF
    const fechaArchivo = new Date().toISOString().split('T')[0];
    doc.save(`reporte_salidas_${fechaArchivo}.pdf`);
  };

  const handleExportInventario = () => {
    const headers = ['Almacén', 'Capacidad Total', 'Capacidad Actual', 'Disponible', 'Porcentaje Ocupado', 'Unidad'];
    const data = almacenes.map(a => ({
      almacen: a.nombre,
      capacidad_total: a.capacidad_total,
      capacidad_actual: a.capacidad_actual || 0,
      disponible: a.capacidad_actual || 0, // Disponible ahora muestra la capacidad actual
      porcentaje_ocupado: a.capacidad_total > 0 ? ((a.capacidad_actual || 0) / a.capacidad_total * 100).toFixed(2) : 0,
      unidad: a.unidad
    }));
    exportToCSV(data, headers, 'reporte_inventario');
  };

  const handleExportProduccion = () => {
    const headers = ['ID', 'Fecha', 'Responsable', 'Estatus', 'Tanques con Nivel', 'Tanques con Gomas'];
    const data = reportesProduccion.map(r => ({
      id: r.id,
      fecha: r.fecha,
      responsable: r.responsable,
      estatus: r.estatus,
      tanques_nivel: r.niveles_tanques?.length || 0,
      tanques_gomas: r.niveles_gomas?.length || 0
    }));
    exportToCSV(data, headers, 'reporte_produccion');
  };

  const limpiarFiltros = () => {
    setSearch('');
    setFechaDesde(undefined);
    setFechaHasta(undefined);
    setFiltroProducto('todos');
    setFiltroProveedor('todos');
    setFiltroCliente('todos');
    setFiltroAlmacen('todos');
  };

  const formatNumber = (num: number) => num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Layout>
      <Header title="Reportes" subtitle="Generación de reportes del sistema" />
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="entradas">Entradas</TabsTrigger>
            <TabsTrigger value="salidas">Salidas</TabsTrigger>
            <TabsTrigger value="inventario">Inventario</TabsTrigger>
            <TabsTrigger value="produccion">Producción</TabsTrigger>
          </TabsList>

          {/* Vista General de Producción - Solo visible en tab Producción */}
          {activeTab === 'produccion' && reportesProduccion.length > 0 && (() => {
            // Obtener el reporte más reciente basado en created_at (último guardado)
            const reporteMasReciente = [...reportesProduccion].sort((a, b) => {
              const fechaA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const fechaB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return fechaB - fechaA; // Orden descendente (más reciente primero)
            })[0];
            const nivelesTanques = reporteMasReciente.niveles_tanques || [];
            const nivelesGomas = reporteMasReciente.niveles_gomas || [];
            
            // Crear mapa de alturas máximas por nombre de tanque
            const alturasMaximasMap = new Map<string, number>();
            const factoresKgCmMap = new Map<string, number>();
            almacenes.forEach((almacen) => {
              if (almacen.altura_maxima) {
                alturasMaximasMap.set(almacen.nombre, almacen.altura_maxima);
              }
              if (almacen.factor_kg_cm) {
                factoresKgCmMap.set(almacen.nombre, almacen.factor_kg_cm);
              }
            });
            
            // Calcular totales
            const totalNivel = nivelesTanques.reduce((acc, t) => acc + (t.nivel || 0), 0);
            const totalGomas = nivelesGomas.reduce((acc, g) => acc + (g.nivel || 0), 0);
            const promedioNivel = nivelesTanques.length > 0 ? totalNivel / nivelesTanques.length : 0;
            const promedioGomas = nivelesGomas.length > 0 ? totalGomas / nivelesGomas.length : 0;
            
            // Agrupar por producto
            const porProducto = new Map<string, { tanques: number; nivelPromedio: number; totalNivel: number; volumenTotal: number }>();
            nivelesTanques.forEach(t => {
              const producto = t.producto || 'Sin producto';
              const actual = porProducto.get(producto) || { tanques: 0, nivelPromedio: 0, totalNivel: 0, volumenTotal: 0 };
              actual.tanques += 1;
              actual.totalNivel = (actual.totalNivel || 0) + (t.nivel || 0);
              actual.nivelPromedio = actual.totalNivel / actual.tanques;
              
              // Calcular volumen total aproximado (nivel * área promedio del tanque)
              // Usamos la altura máxima para calcular un volumen aproximado
              const alturaMaxima = alturasMaximasMap.get(t.tanque) || 1;
              const volumenAprox = (t.nivel || 0) * (alturaMaxima > 0 ? alturaMaxima : 1);
              actual.volumenTotal = (actual.volumenTotal || 0) + volumenAprox;
              
              porProducto.set(producto, actual);
            });

            // Agregar tanques de combustóleo y combustible alterno si tienen datos
            const tanquesCombustible: Array<{ nombre: string; nivel: number; alturaMaxima: number }> = [];
            
            if (reporteMasReciente.combustoleo_porcentaje) {
              const alturaCombustoleo = alturasMaximasMap.get('TANQUE COMBUSTÓLEO') || alturasMaximasMap.get('TANQUE COMBUSTÓLEO ') || 6.80;
              tanquesCombustible.push({
                nombre: 'TANQUE COMBUSTÓLEO',
                nivel: reporteMasReciente.combustoleo_porcentaje,
                alturaMaxima: alturaCombustoleo
              });
            }
            
            if (reporteMasReciente.comb_alterno_porcentaje) {
              const alturaCombAlterno = alturasMaximasMap.get('TANQUE COMBUSTIBLE ALTERNO') || 6.80;
              tanquesCombustible.push({
                nombre: 'TANQUE COMBUSTIBLE ALTERNO',
                nivel: reporteMasReciente.comb_alterno_porcentaje,
                alturaMaxima: alturaCombAlterno
              });
            }

            // Preparar datos para el gráfico donut
            const chartColors = [
              'hsl(var(--chart-1))',
              'hsl(var(--chart-2))',
              'hsl(var(--chart-3))',
              'hsl(var(--chart-4))',
              'hsl(var(--chart-5))',
            ];

            const chartData = Array.from(porProducto.entries())
              .map(([producto, datos], index) => {
                const color = chartColors[index % chartColors.length];
                const productoKey = producto.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                return {
                  producto: producto,
                  volumen: datos.volumenTotal || 0,
                  fill: color,
                  productoKey: productoKey,
                };
              })
              .filter(item => item.volumen > 0);

            // Crear config dinámico basado en los productos
            // Usar el nombre del producto como clave para que el tooltip funcione
            const chartConfig: ChartConfig = {
              volumen: {
                label: "Volumen",
              },
            };

            chartData.forEach((item, index) => {
              chartConfig[item.productoKey] = {
                label: item.producto,
                color: chartColors[index % chartColors.length],
              };
            });

            const getNivelColor = (porcentaje: number) => {
              if (porcentaje >= 80) return 'bg-blue-500';
              if (porcentaje >= 60) return 'bg-green-500';
              if (porcentaje >= 40) return 'bg-yellow-500';
              if (porcentaje >= 20) return 'bg-orange-500';
              return 'bg-red-500';
            };

            const getGomasColor = (gomas: number) => {
              if (gomas >= 5) return 'bg-red-400';
              if (gomas >= 3) return 'bg-orange-400';
              if (gomas >= 1) return 'bg-yellow-400';
              return 'bg-green-400';
            };

            return (
              <div className="mt-6 mb-4 space-y-4">
                {/* Header con información del reporte */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Factory className="h-5 w-5" />
                          Vista General de Producción
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {(() => {
                            // Parsear fecha desde string YYYY-MM-DD sin problemas de zona horaria
                            const [año, mes, dia] = reporteMasReciente.fecha.split('-').map(Number);
                            const fecha = new Date(año, mes - 1, dia);
                            const diaStr = String(fecha.getDate()).padStart(2, '0');
                            const mesStr = String(fecha.getMonth() + 1).padStart(2, '0');
                            const añoStr = fecha.getFullYear();
                            return `Reporte: ${reporteMasReciente.id} • ${diaStr}/${mesStr}/${añoStr}`;
                          })()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Resumen de aceite por tipo */}
                {(() => {
                  // Función para identificar el tipo de aceite por nombre del producto
                  const getTipoAceite = (nombreProducto: string | null): string | null => {
                    if (!nombreProducto) return null;
                    // Normalizar: mayúsculas, quitar tildes y espacios
                    const nombreNormalizado = nombreProducto
                      .toUpperCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
                      .trim();
                    
                    // Excluir semillas
                    if (nombreNormalizado.includes('SEMILLA')) {
                      return null;
                    }
                    
                    if (nombreNormalizado.includes('CARTAMO')) {
                      return 'Cártamo';
                    }
                    if (nombreNormalizado.includes('GIRASOL')) {
                      return 'Girasol';
                    }
                    if (nombreNormalizado === 'MEZCLAS' || nombreNormalizado.includes('MEZCLA')) {
                      return 'Mezclas';
                    }
                    return null;
                  };

                  // Agrupar por tipo de aceite y calcular totales en kg
                  const aceitePorTipo = new Map<string, number>();
                  
                  nivelesTanques.forEach(t => {
                    const tipoAceite = getTipoAceite(t.producto);
                    if (tipoAceite) {
                      const goma = nivelesGomas.find(g => g.goma === t.tanque);
                      const nivel = t.nivel || 0;
                      const gomas = goma?.nivel || 0;
                      
                      // Calcular nivel de aceite: Nivel - Gomas
                      const aceite = Math.max(0, nivel - gomas);
                      
                      // Obtener factor de conversión kg/cm del tanque
                      const factorKgCm = factoresKgCmMap.get(t.tanque);
                      
                      // Calcular peso en kg del aceite: (aceite en m × 100) × factor_kg_cm
                      if (factorKgCm && aceite > 0) {
                        const pesoAceiteKg = (aceite * 100) * factorKgCm;
                        const totalActual = aceitePorTipo.get(tipoAceite) || 0;
                        aceitePorTipo.set(tipoAceite, totalActual + pesoAceiteKg);
                      }
                    }
                  });

                  // Solo mostrar si hay datos
                  if (aceitePorTipo.size === 0) return null;

                  return (
                    <Card className="mt-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Droplet className="h-4 w-4" />
                          Aceite Disponible por Tipo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Array.from(aceitePorTipo.entries())
                            .sort(([tipoA], [tipoB]) => {
                              // Ordenar: Cártamo, Girasol, Mezclas
                              const orden: Record<string, number> = { 'Cártamo': 1, 'Girasol': 2, 'Mezclas': 3 };
                              return (orden[tipoA] || 999) - (orden[tipoB] || 999);
                            })
                            .map(([tipo, totalKg]) => {
                              const totalToneladas = totalKg / 1000;
                              return (
                                <Card key={tipo} className="p-4 bg-muted/50">
                                  <div className="text-center space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">{tipo}</p>
                                    <p className="text-2xl font-bold">
                                      {totalKg.toLocaleString('es-MX', { 
                                        minimumFractionDigits: 2, 
                                        maximumFractionDigits: 2 
                                      })} <span className="text-base font-medium text-muted-foreground">kg</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      ({totalToneladas.toLocaleString('es-MX', { 
                                        minimumFractionDigits: 2, 
                                        maximumFractionDigits: 2 
                                      })} ton)
                                    </p>
                                  </div>
                                </Card>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Vista Agrupada por Producto */}
                <div className="space-y-4">
                  {Array.from(porProducto.entries()).map(([producto, datos]) => {
                    const tanquesDelProducto = nivelesTanques.filter(t => (t.producto || 'Sin producto') === producto);
                    
                    return (
                      <Card key={producto}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {producto}
                            <Badge variant="secondary" className="ml-auto">
                              {datos.tanques} tanque{datos.tanques !== 1 ? 's' : ''}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tanquesDelProducto.map((tanque, idx) => {
                              const goma = nivelesGomas.find(g => g.goma === tanque.tanque);
                              const nivel = tanque.nivel || 0;
                              const gomas = goma?.nivel || 0;
                              
                              // Calcular nivel de aceite: Nivel - Gomas
                              const aceite = Math.max(0, nivel - gomas);
                              
                              // Obtener altura máxima del tanque
                              const alturaMaxima = alturasMaximasMap.get(tanque.tanque);
                              
                              // Calcular porcentaje basado en altura máxima
                              const porcentajeNivel = alturaMaxima && alturaMaxima > 0 
                                ? (nivel / alturaMaxima) * 100 
                                : 0;
                              
                              // Calcular porcentaje de aceite basado en altura máxima
                              const porcentajeAceite = alturaMaxima && alturaMaxima > 0 
                                ? (aceite / alturaMaxima) * 100 
                                : 0;
                              
                              // Calcular porcentaje de gomas basado en altura máxima del tanque
                              const porcentajeGomas = alturaMaxima && alturaMaxima > 0 
                                ? (gomas / alturaMaxima) * 100 
                                : 0;

                              // Obtener factor de conversión kg/cm del tanque
                              const factorKgCm = factoresKgCmMap.get(tanque.tanque);
                              
                              // Calcular peso en kg del aceite: (aceite en m × 100) × factor_kg_cm
                              const pesoAceiteKg = factorKgCm && aceite > 0
                                ? (aceite * 100) * factorKgCm
                                : null;

                              // Colores fijos: Aceite siempre azul, Gomas siempre rojo
                              const aceiteColor = '#3b82f6'; // Azul siempre
                              const gomasColor = gomas > 0 ? '#ef4444' : 'transparent'; // Rojo para gomas

                              // Preparar datos para el gráfico donut: Aceite, Gomas, Vacío
                              const donutData = [
                                { name: 'Aceite', value: Math.min(porcentajeAceite, 100), fill: aceiteColor },
                                { name: 'Gomas', value: Math.min(porcentajeGomas, 100), fill: gomasColor },
                                { name: 'Vacío', value: Math.max(0, 100 - Math.min(porcentajeAceite, 100) - Math.min(porcentajeGomas, 100)), fill: 'hsl(var(--muted))' },
                              ].filter(item => item.value > 0);

                              const donutConfig: ChartConfig = {
                                Aceite: { label: 'Aceite', color: aceiteColor },
                                Gomas: { label: 'Gomas', color: gomasColor },
                                Vacío: { label: 'Vacío', color: 'hsl(var(--muted))' },
                              };

                              return (
                                <Card key={idx} className="p-4">
                                  <div className="flex flex-col items-center space-y-3">
                                    <div className="w-full text-center">
                                      <h4 className="font-semibold text-sm mb-1">{tanque.tanque}</h4>
                                      {alturaMaxima && (
                                        <p className="text-xs text-muted-foreground">
                                          Altura máxima: {alturaMaxima.toFixed(2)} m
                                        </p>
                                      )}
                                    </div>
                                    <ChartContainer
                                      config={donutConfig}
                                      className="w-32 h-32"
                                    >
                                      <PieChart>
                                        <ChartTooltip
                                          cursor={false}
                                          content={<ChartTooltipContent hideLabel />}
                                        />
                                        <Pie
                                          data={donutData}
                                          dataKey="value"
                                          nameKey="name"
                                          innerRadius={30}
                                          outerRadius={50}
                                          startAngle={90}
                                          endAngle={-270}
                                        />
                                      </PieChart>
                                    </ChartContainer>
                                    <div className="space-y-1 text-xs text-center w-full">
                                      <div className="flex items-center justify-center gap-2">
                                        <span className="text-muted-foreground">Nivel:</span>
                                        <span className="font-medium">
                                          {nivel.toFixed(2)} m ({porcentajeNivel.toFixed(2)}%)
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-center gap-2">
                                        <span className="text-muted-foreground">Aceite:</span>
                                        <span className="font-medium">
                                          {aceite.toFixed(2)} m ({porcentajeAceite.toFixed(2)}%)
                                        </span>
                                      </div>
                                      {gomas > 0 && (
                                        <div className="flex items-center justify-center gap-2">
                                          <span className="text-muted-foreground">Gomas:</span>
                                          <span className="font-medium">
                                            {gomas.toFixed(2)} m ({porcentajeGomas.toFixed(2)}%)
                                          </span>
                                        </div>
                                      )}
                                      {pesoAceiteKg !== null && (
                                        <div className="flex items-center justify-center gap-2 pt-1 border-t">
                                          <span className="text-muted-foreground">Kg:</span>
                                          <span className="font-medium">
                                            {pesoAceiteKg.toLocaleString('es-MX', { maximumFractionDigits: 2 })} kg
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Tanques de Combustible (Combustóleo y Combustible Alterno) */}
                  {tanquesCombustible.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Tanques de Combustible
                          <Badge variant="secondary" className="ml-auto">
                            {tanquesCombustible.length} tanque{tanquesCombustible.length !== 1 ? 's' : ''}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {tanquesCombustible.map((tanqueComb, idx) => {
                            const porcentajeNivel = tanqueComb.alturaMaxima && tanqueComb.alturaMaxima > 0 
                              ? (tanqueComb.nivel / tanqueComb.alturaMaxima) * 100 
                              : 0;

                            // Colores fijos: Nivel siempre azul, Gomas siempre rojo
                            const nivelColor = '#3b82f6'; // Azul siempre
                            const gomasColor = 'transparent'; // Sin gomas para tanques de combustible

                            // Preparar datos para el gráfico donut
                            const donutData = [
                              { name: 'Nivel', value: Math.min(porcentajeNivel, 100), fill: nivelColor },
                              { name: 'Vacío', value: Math.max(0, 100 - Math.min(porcentajeNivel, 100)), fill: 'hsl(var(--muted))' },
                            ].filter(item => item.value > 0);

                            const donutConfig: ChartConfig = {
                              Nivel: { label: 'Nivel', color: nivelColor },
                              Vacío: { label: 'Vacío', color: 'hsl(var(--muted))' },
                            };

                            return (
                              <Card key={idx} className="p-4">
                                <div className="flex flex-col items-center space-y-3">
                                  <div className="w-full text-center">
                                    <h4 className="font-semibold text-sm mb-1">{tanqueComb.nombre}</h4>
                                    {tanqueComb.alturaMaxima && (
                                      <p className="text-xs text-muted-foreground">
                                        Altura máxima: {tanqueComb.alturaMaxima.toFixed(2)} m
                                      </p>
                                    )}
                                  </div>
                                  <ChartContainer
                                    config={donutConfig}
                                    className="w-32 h-32"
                                  >
                                    <PieChart>
                                      <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                      />
                                      <Pie
                                        data={donutData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={30}
                                        outerRadius={50}
                                        startAngle={90}
                                        endAngle={-270}
                                      />
                                    </PieChart>
                                  </ChartContainer>
                                  <div className="space-y-1 text-xs text-center w-full">
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="text-muted-foreground">Nivel:</span>
                                      <span className="font-medium">
                                        {tanqueComb.nivel.toFixed(2)} m ({porcentajeNivel.toFixed(2)}%)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Filtros comunes */}
          <div className="mt-6 mb-4 flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar..." 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-36 justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {fechaDesde ? format(fechaDesde, 'dd/MM/yyyy') : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={fechaDesde}
                    onSelect={setFechaDesde}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-36 justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {fechaHasta ? format(fechaHasta, 'dd/MM/yyyy') : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={fechaHasta}
                    onSelect={setFechaHasta}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {(activeTab === 'entradas' || activeTab === 'salidas') && (
              <div className="space-y-1">
                <Label className="text-xs">Producto</Label>
                <Select value={filtroProducto} onValueChange={setFiltroProducto}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {productos.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeTab === 'entradas' && (
              <div className="space-y-1">
                <Label className="text-xs">Proveedor</Label>
                <Select value={filtroProveedor} onValueChange={setFiltroProveedor}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {proveedores.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.empresa}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeTab === 'salidas' && (
              <div className="space-y-1">
                <Label className="text-xs">Cliente</Label>
                <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.empresa}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>

          {/* Tab: Entradas */}
          <TabsContent value="entradas" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Reporte de Entradas (Reciba)</CardTitle>
                    <CardDescription className="mt-1">
                      {filteredRecepciones.length} registro(s) encontrado(s)
                    </CardDescription>
                  </div>
                  <Button onClick={handleExportEntradas} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                ) : filteredRecepciones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay registros para mostrar</div>
                ) : (
                  <>
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700">
                        <TrendingUp className="h-5 w-5" />
                        <span className="font-semibold">Total de Entradas: {formatNumber(totalEntradas)} Kg</span>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Boleta</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Chofer</TableHead>
                          <TableHead>Placas</TableHead>
                          <TableHead className="text-right">Peso Bruto</TableHead>
                          <TableHead className="text-right">Peso Tara</TableHead>
                          <TableHead className="text-right">Peso Neto</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>Estatus</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecepciones.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.boleta}</TableCell>
                            <TableCell>{format(new Date(r.fecha), 'dd/MM/yyyy', { locale: es })}</TableCell>
                            <TableCell>{r.producto?.nombre || '-'}</TableCell>
                            <TableCell>{r.proveedor?.empresa || '-'}</TableCell>
                            <TableCell>{r.chofer || '-'}</TableCell>
                            <TableCell>{r.placas || '-'}</TableCell>
                            <TableCell className="text-right">{formatNumber(r.peso_bruto || 0)}</TableCell>
                            <TableCell className="text-right">{formatNumber(r.peso_tara || 0)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatNumber(r.peso_neto || 0)}</TableCell>
                            <TableCell>{r.codigo_lote || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={r.estatus === 'Cerrado' ? 'default' : 'secondary'}>
                                {r.estatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Salidas */}
          <TabsContent value="salidas" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Reporte de Salidas (Embarque)</CardTitle>
                    <CardDescription className="mt-1">
                      {filteredEmbarques.length} registro(s) encontrado(s)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleExportSalidas} variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Exportar CSV
                    </Button>
                    <Button onClick={handleExportSalidasPDF} className="flex items-center gap-2 bg-[#6D2234] hover:bg-[#5a1c2a] text-white">
                      <FileText className="h-4 w-4" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                ) : filteredEmbarques.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay registros para mostrar</div>
                ) : (
                  <>
                    <div className="mb-4 p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <TrendingDown className="h-5 w-5" />
                        <span className="font-semibold">Total de Salidas: {formatNumber(totalSalidas)} Kg</span>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Boleta</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Destino</TableHead>
                          <TableHead>Chofer</TableHead>
                          <TableHead>Placas</TableHead>
                          <TableHead className="text-right">Peso Bruto</TableHead>
                          <TableHead className="text-right">Peso Tara</TableHead>
                          <TableHead className="text-right">Peso Neto</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>Estatus</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmbarques.map((e) => {
                          // Formatear fecha sin problemas de zona horaria
                          const formatFecha = (fechaStr: string) => {
                            if (!fechaStr) return '-';
                            const [año, mes, dia] = fechaStr.split('-');
                            return `${dia}/${mes}/${año}`;
                          };
                          
                          return (
                          <TableRow key={e.id}>
                            <TableCell className="font-medium">{e.boleta}</TableCell>
                            <TableCell>{formatFecha(e.fecha)}</TableCell>
                            <TableCell>{e.producto?.nombre || '-'}</TableCell>
                            <TableCell>{e.cliente?.empresa || '-'}</TableCell>
                            <TableCell>{e.destino || '-'}</TableCell>
                            <TableCell>{e.chofer || '-'}</TableCell>
                            <TableCell>{e.placas || '-'}</TableCell>
                            <TableCell className="text-right">{formatNumber(e.peso_bruto || 0)}</TableCell>
                            <TableCell className="text-right">{formatNumber(e.peso_tara || 0)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatNumber(e.peso_neto || 0)}</TableCell>
                            <TableCell>{e.codigo_lote || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={e.estatus === 'Cerrado' ? 'default' : 'secondary'}>
                                {e.estatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Inventario */}
          <TabsContent value="inventario" className="space-y-4">
            {/* Inventario por Producto */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Inventario por Producto</CardTitle>
                    <CardDescription className="mt-1">
                      Total de inventario agrupado por producto (suma de todos los almacenes)
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => {
                      const headers = ['Producto', 'Cantidad Total'];
                      const data = inventarioPorProducto.map(item => ({
                        producto: item.producto?.nombre || `Producto #${item.producto_id}`,
                        cantidad: item.total
                      }));
                      exportToCSV(data, headers, 'inventario_por_producto');
                    }} 
                    className="flex items-center gap-2"
                    disabled={loadingInventario || inventarioPorProducto.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingInventario ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando inventario...</div>
                ) : inventarioPorProducto.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay productos en inventario. Agrega productos a los almacenes desde Configuración.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cantidad Total</TableHead>
                        <TableHead>Unidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventarioPorProducto.map((item) => (
                        <TableRow key={item.producto_id}>
                          <TableCell className="font-medium">
                            {item.producto?.nombre || `Producto #${item.producto_id}`}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatNumber(item.total)}
                          </TableCell>
                          <TableCell>{item.unidad || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Estado de Almacenes */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Estado de Almacenes</CardTitle>
                    <CardDescription className="mt-1">
                      Estado actual de almacenes y capacidad
                    </CardDescription>
                  </div>
                  <Button onClick={handleExportInventario} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {almacenes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay almacenes registrados</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Almacén</TableHead>
                        <TableHead className="text-right">Capacidad Total</TableHead>
                        <TableHead className="text-right">Capacidad Actual</TableHead>
                        <TableHead className="text-right">Disponible</TableHead>
                        <TableHead className="text-right">% Ocupado</TableHead>
                        <TableHead>Unidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {almacenes.map((a) => {
                        // Para almacenes de pasta, restar las salidas totales desde el inicio del sistema
                        const esPasta = a.nombre.toLowerCase().includes('pasta');
                        const capacidadConSalidas = esPasta && a.capacidad_actual
                          ? Math.max(0, (a.capacidad_actual || 0) - totalSalidasPasta)
                          : (a.capacidad_actual || 0);
                        
                        const porcentajeOcupado = a.capacidad_total > 0 
                          ? ((a.capacidad_actual || 0) / a.capacidad_total * 100) 
                          : 0;
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.nombre}</TableCell>
                            <TableCell className="text-right">{formatNumber(a.capacidad_total)}</TableCell>
                            <TableCell className="text-right">
                              {esPasta ? (
                                <div className="space-y-1">
                                  <div className="line-through text-muted-foreground text-sm">
                                    {formatNumber(a.capacidad_actual || 0)}
                                  </div>
                                  <div className="font-semibold">
                                    {formatNumber(capacidadConSalidas)}
                                  </div>
                                </div>
                              ) : (
                                formatNumber(a.capacidad_actual || 0)
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatNumber(capacidadConSalidas)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={porcentajeOcupado > 80 ? 'destructive' : porcentajeOcupado > 60 ? 'default' : 'secondary'}>
                                {porcentajeOcupado.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>{a.unidad}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Producción */}
          <TabsContent value="produccion" className="space-y-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Reporte de Producción</CardTitle>
                  <CardDescription className="mt-1">
                    {reportesProduccion.length} reporte(s) de producción
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {reportesProduccion.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay reportes de producción</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Tanques con Nivel</TableHead>
                        <TableHead>Tanques con Gomas</TableHead>
                        <TableHead>Expander (L)</TableHead>
                        <TableHead>Comb. Alterno (m)</TableHead>
                        <TableHead>Combustóleo (m)</TableHead>
                        <TableHead>Estatus</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportesProduccion.map((r) => {
                        // Parsear fecha desde string YYYY-MM-DD sin problemas de zona horaria
                        // Usar el mismo método que en Producción para consistencia
                        const [año, mes, dia] = r.fecha.split('-').map(Number);
                        const fecha = new Date(año, mes - 1, dia);
                        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                        const diaSemana = diasSemana[fecha.getDay()];
                        const diaStr = String(fecha.getDate()).padStart(2, '0');
                        const mesStr = String(fecha.getMonth() + 1).padStart(2, '0');
                        const añoStr = fecha.getFullYear();
                        const fechaFormateada = `${diaSemana} ${diaStr}/${mesStr}/${añoStr}`;
                        
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.id}</TableCell>
                            <TableCell>{fechaFormateada}</TableCell>
                            <TableCell>{r.responsable}</TableCell>
                            <TableCell className="text-center">{r.niveles_tanques?.length || 0}</TableCell>
                            <TableCell className="text-center">{r.niveles_gomas?.length || 0}</TableCell>
                            <TableCell className="text-right">{r.expander_litros ? formatNumber(r.expander_litros) : '-'}</TableCell>
                            <TableCell className="text-right">{r.comb_alterno_porcentaje ? formatNumber(r.comb_alterno_porcentaje) : '-'}</TableCell>
                            <TableCell className="text-right">{r.combustoleo_porcentaje ? formatNumber(r.combustoleo_porcentaje) : '-'}</TableCell>
                            <TableCell>
                              <Badge variant={r.estatus === 'Completado' ? 'default' : 'secondary'}>
                                {r.estatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedReporteProduccion(r);
                                  setIsDetalleProduccionOpen(true);
                                }}
                              >
                                Ver Detalle
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog: Detalle de Producción con Visualización de Tanques */}
        <Dialog open={isDetalleProduccionOpen} onOpenChange={setIsDetalleProduccionOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            {selectedReporteProduccion && (
              <Button 
                size="sm"
                onClick={() => {
                  const r = selectedReporteProduccion;
                  const headers = ['Tanque', 'Producto', 'Nivel (m)', 'Gomas (m)', 'Aceite (m)'];
                  const rows = (r.niveles_tanques || []).map(t => {
                    const goma = (r.niveles_gomas || []).find(g => g.goma === t.tanque);
                    const nivelGomas = goma?.nivel || 0;
                    const aceite = Math.max(0, (t.nivel || 0) - nivelGomas);
                    return [
                      t.tanque,
                      t.producto || '-',
                      (t.nivel || 0).toFixed(2),
                      nivelGomas.toFixed(2),
                      aceite.toFixed(2)
                    ].join(';');
                  });
                  const csvContent = [headers.join(';'), ...rows].join('\n');
                  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `reporte_produccion_${r.id}_${r.fecha}.csv`;
                  link.click();
                }}
                className="absolute right-16 top-4 flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            )}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Detalle del Reporte {selectedReporteProduccion?.id}
              </DialogTitle>
            </DialogHeader>

            {selectedReporteProduccion && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Fecha</Label>
                    <p className="font-medium">{(() => {
                      const fecha = new Date(selectedReporteProduccion.fecha);
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
                    <p className="font-medium">{selectedReporteProduccion.responsable}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estatus</Label>
                    <div className="mt-1">
                      <Badge variant={selectedReporteProduccion.estatus === 'Completado' ? 'default' : 'secondary'}>
                        {selectedReporteProduccion.estatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                {((selectedReporteProduccion.niveles_tanques && selectedReporteProduccion.niveles_tanques.length > 0) || 
                  (selectedReporteProduccion.niveles_gomas && selectedReporteProduccion.niveles_gomas.length > 0)) && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Niveles de Tanques y Gomas</Label>
                    
                    {/* Representación Visual de Tanques */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(() => {
                        const tanquesMap = new Map();
                        selectedReporteProduccion.niveles_tanques?.forEach((t: any) => {
                          tanquesMap.set(t.tanque, { producto: t.producto, nivel: t.nivel, unidad: t.unidad });
                        });

                        const gomasMap = new Map();
                        selectedReporteProduccion.niveles_gomas?.forEach((g: any) => {
                          gomasMap.set(g.goma, { nivel: g.nivel, unidad: g.unidad });
                        });

                        const todosTanques = new Set([
                          ...(selectedReporteProduccion.niveles_tanques?.map((t: any) => t.tanque) || []),
                          ...(selectedReporteProduccion.niveles_gomas?.map((g: any) => g.goma) || [])
                        ]);

                        // Crear mapa de alturas máximas y factores kg/cm por nombre de tanque
                        const alturasMaximasMap = new Map<string, number>();
                        const factoresKgCmMap = new Map<string, number>();
                        almacenes.forEach((almacen) => {
                          if (almacen.altura_maxima) {
                            alturasMaximasMap.set(almacen.nombre, almacen.altura_maxima);
                          }
                          if (almacen.factor_kg_cm) {
                            factoresKgCmMap.set(almacen.nombre, almacen.factor_kg_cm);
                          }
                        });

                        return Array.from(todosTanques).map((tanqueNombre: string, index: number) => {
                          const tanqueData = tanquesMap.get(tanqueNombre);
                          const gomaData = gomasMap.get(tanqueNombre);
                          const nivel = tanqueData?.nivel || 0;
                          const gomas = gomaData?.nivel || 0;
                          
                          // Calcular nivel de aceite: Nivel - Gomas
                          const aceite = Math.max(0, nivel - gomas);
                          
                          // Obtener altura máxima del tanque
                          const alturaMaxima = alturasMaximasMap.get(tanqueNombre);
                          
                          // Calcular porcentaje basado en altura máxima
                          const porcentajeNivel = alturaMaxima && alturaMaxima > 0 
                            ? (nivel / alturaMaxima) * 100 
                            : 0;
                          
                          // Calcular porcentaje de aceite basado en altura máxima
                          const porcentajeAceite = alturaMaxima && alturaMaxima > 0 
                            ? (aceite / alturaMaxima) * 100 
                            : 0;
                          
                          // Calcular porcentaje de gomas basado en altura máxima del tanque
                          const porcentajeGomas = alturaMaxima && alturaMaxima > 0 
                            ? (gomas / alturaMaxima) * 100 
                            : 0;

                          // Obtener factor de conversión kg/cm del tanque
                          const factorKgCm = factoresKgCmMap.get(tanqueNombre);
                          
                          // Calcular peso en kg del aceite: (aceite en m × 100) × factor_kg_cm
                          const pesoAceiteKg = factorKgCm && aceite > 0
                            ? (aceite * 100) * factorKgCm
                            : null;

                          // Colores fijos: Aceite siempre azul, Gomas siempre rojo
                          const aceiteColor = '#3b82f6'; // Azul siempre
                          const gomasColor = gomas > 0 ? '#ef4444' : 'transparent'; // Rojo para gomas

                          // Preparar datos para el gráfico donut: Aceite, Gomas, Vacío
                          const donutData = [
                            { name: 'Aceite', value: Math.min(porcentajeAceite, 100), fill: aceiteColor },
                            { name: 'Gomas', value: Math.min(porcentajeGomas, 100), fill: gomasColor },
                            { name: 'Vacío', value: Math.max(0, 100 - Math.min(porcentajeAceite, 100) - Math.min(porcentajeGomas, 100)), fill: 'hsl(var(--muted))' },
                          ].filter(item => item.value > 0);

                          const donutConfig: ChartConfig = {
                            Aceite: { label: 'Aceite', color: aceiteColor },
                            Gomas: { label: 'Gomas', color: gomasColor },
                            Vacío: { label: 'Vacío', color: 'hsl(var(--muted))' },
                          };

                          return (
                            <Card key={index} className="p-4">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">{tanqueNombre}</h4>
                                  {tanqueData?.producto && (
                                    <p className="text-xs text-muted-foreground">{tanqueData.producto}</p>
                                  )}
                                  {alturaMaxima && (
                                    <p className="text-xs text-muted-foreground">
                                      Altura máxima: {alturaMaxima.toFixed(2)} m
                                    </p>
                                  )}
                                </div>
                                
                                {/* Gráfico Donut */}
                                <div className="flex flex-col items-center">
                                  <ChartContainer
                                    config={donutConfig}
                                    className="w-32 h-32"
                                  >
                                    <PieChart>
                                      <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                      />
                                      <Pie
                                        data={donutData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={30}
                                        outerRadius={50}
                                        startAngle={90}
                                        endAngle={-270}
                                      />
                                    </PieChart>
                                  </ChartContainer>
                                  <div className="mt-2 space-y-1 text-xs text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="text-muted-foreground">Nivel:</span>
                                      <span className="font-medium">
                                        {nivel.toFixed(2)} m ({porcentajeNivel.toFixed(2)}%)
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="text-muted-foreground">Aceite:</span>
                                      <span className="font-medium">
                                        {aceite.toFixed(2)} m ({porcentajeAceite.toFixed(2)}%)
                                      </span>
                                    </div>
                                    {gomas > 0 && (
                                      <div className="flex items-center justify-center gap-2">
                                        <span className="text-muted-foreground">Gomas:</span>
                                        <span className="font-medium">
                                          {gomas.toFixed(2)} m ({porcentajeGomas.toFixed(2)}%)
                                        </span>
                                      </div>
                                    )}
                                    {pesoAceiteKg !== null && (
                                      <div className="flex items-center justify-center gap-2 pt-1 border-t">
                                        <span className="text-muted-foreground">Kg:</span>
                                        <span className="font-medium">
                                          {pesoAceiteKg.toLocaleString('es-MX', { maximumFractionDigits: 2 })} kg
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        });
                      })()}
                    </div>

                    {/* Tabla de datos */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanque</TableHead>
                          <TableHead className="text-center">Nivel (m)</TableHead>
                          <TableHead className="text-center">Gomas (m)</TableHead>
                          <TableHead>Producto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const tanquesMap = new Map();
                          selectedReporteProduccion.niveles_tanques?.forEach((t: any) => {
                            tanquesMap.set(t.tanque, { producto: t.producto, nivel: t.nivel, unidad: t.unidad });
                          });

                          const gomasMap = new Map();
                          selectedReporteProduccion.niveles_gomas?.forEach((g: any) => {
                            gomasMap.set(g.goma, { nivel: g.nivel, unidad: g.unidad });
                          });

                          const todosTanques = new Set([
                            ...(selectedReporteProduccion.niveles_tanques?.map((t: any) => t.tanque) || []),
                            ...(selectedReporteProduccion.niveles_gomas?.map((g: any) => g.goma) || [])
                          ]);

                          return Array.from(todosTanques).map((tanqueNombre: string, index: number) => {
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

                {/* Campos adicionales */}
                {(selectedReporteProduccion.expander_litros || selectedReporteProduccion.comb_alterno_porcentaje || selectedReporteProduccion.combustoleo_porcentaje) && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Información Adicional</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedReporteProduccion.expander_litros && (
                        <div>
                          <Label className="text-muted-foreground text-sm">Expander</Label>
                          <p className="font-medium">{selectedReporteProduccion.expander_litros.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L</p>
                        </div>
                      )}
                      {selectedReporteProduccion.comb_alterno_porcentaje && (
                        <div>
                          <Label className="text-muted-foreground text-sm">Comb. Alterno</Label>
                          <p className="font-medium">{selectedReporteProduccion.comb_alterno_porcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m</p>
                        </div>
                      )}
                      {selectedReporteProduccion.combustoleo_porcentaje && (
                        <div>
                          <Label className="text-muted-foreground text-sm">Combustóleo</Label>
                          <p className="font-medium">{selectedReporteProduccion.combustoleo_porcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedReporteProduccion.observaciones && (
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Observaciones</Label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedReporteProduccion.observaciones}</p>
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

export default Reportes;
