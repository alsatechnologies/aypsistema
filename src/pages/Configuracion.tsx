import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Package, Warehouse, Users, FlaskConical, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Tipos de análisis disponibles según el PDF
const tiposAnalisis = [
  { id: 'humedad', nombre: 'Humedad' },
  { id: 'impurezas', nombre: 'Impurezas' },
  { id: 'impurezasInsolubles', nombre: 'Impurezas Insolubles' },
  { id: 'granosDanados', nombre: 'Granos Dañados' },
  { id: 'granosQuebrados', nombre: 'Granos Quebrados' },
  { id: 'pesoEspecifico', nombre: 'Peso Específico' },
  { id: 'aflatoxinas', nombre: 'Aflatoxinas' },
  { id: 'proteina', nombre: 'Proteína' },
  { id: 'grasa', nombre: 'Grasa' },
  { id: 'fibra', nombre: 'Fibra' },
  { id: 'cenizas', nombre: 'Cenizas' },
  { id: 'acidez', nombre: 'Acidez' },
  { id: 'acidoOleico', nombre: 'Ácido Oleico' },
  { id: 'indiceSaponificacion', nombre: 'Índice de Saponificación' },
  { id: 'indiceYodo', nombre: 'Índice de Yodo' },
  { id: 'indiceRefraccion', nombre: 'Índice de Refracción' },
  { id: 'colorRojo', nombre: 'Color Rojo' },
  { id: 'colorAmarillo', nombre: 'Color Amarillo' },
  { id: 'fosfolipidos', nombre: 'Fosfolípidos' },
  { id: 'insolubles', nombre: 'Insolubles en Acetona' },
];

// Roles según el PDF
const rolesDisponibles = [
  'Administrador',
  'Oficina',
  'Portero',
  'Báscula',
  'Calidad',
  'Laboratorio',
  'Producción',
];

interface RangoDescuento {
  porcentaje: number;
  kgDescuentoTon: number;
}

interface Analisis {
  id: string;
  nombre: string;
  generaDescuento: boolean;
  rangosDescuento?: RangoDescuento[];
}

interface Producto {
  id: number;
  nombre: string;
  codigoFolio: string;
  analisis: Analisis[];
}

interface Almacen {
  id: number;
  nombre: string;
  capacidadTotal: number;
  capacidadActual: number;
  unidad: string;
}

interface Usuario {
  id: number;
  nombreCompleto: string;
  correo: string;
  contrasena: string;
  rol: string;
}

const Configuracion = () => {
  const [productos, setProductos] = useState<Producto[]>([
    { 
      id: 1, 
      nombre: 'Aceite de Soya', 
      codigoFolio: '01',
      analisis: [
        { id: 'acidez', nombre: 'Acidez', generaDescuento: true, rangosDescuento: [
          { porcentaje: 0.0, kgDescuentoTon: 0 },
          { porcentaje: 0.5, kgDescuentoTon: 0 },
          { porcentaje: 0.6, kgDescuentoTon: 5 },
          { porcentaje: 1.0, kgDescuentoTon: 10 },
        ]},
        { id: 'humedad', nombre: 'Humedad', generaDescuento: true, rangosDescuento: [
          { porcentaje: 0.0, kgDescuentoTon: 0 },
          { porcentaje: 0.1, kgDescuentoTon: 0 },
          { porcentaje: 0.2, kgDescuentoTon: 5 },
        ]},
        { id: 'impurezasInsolubles', nombre: 'Impurezas Insolubles', generaDescuento: false },
      ]
    },
    { 
      id: 2, 
      nombre: 'Pasta de Soya', 
      codigoFolio: '02',
      analisis: [
        { id: 'proteina', nombre: 'Proteína', generaDescuento: false },
        { id: 'humedad', nombre: 'Humedad', generaDescuento: true, rangosDescuento: [
          { porcentaje: 0.0, kgDescuentoTon: 0 },
          { porcentaje: 12.0, kgDescuentoTon: 0 },
          { porcentaje: 12.1, kgDescuentoTon: 10 },
        ]},
        { id: 'grasa', nombre: 'Grasa', generaDescuento: false },
        { id: 'fibra', nombre: 'Fibra', generaDescuento: false },
      ]
    },
    { 
      id: 3, 
      nombre: 'Soya', 
      codigoFolio: '03',
      analisis: [
        { id: 'humedad', nombre: 'Humedad', generaDescuento: true, rangosDescuento: [
          { porcentaje: 0.0, kgDescuentoTon: 0 },
          { porcentaje: 13.0, kgDescuentoTon: 0 },
          { porcentaje: 13.1, kgDescuentoTon: 10 },
          { porcentaje: 14.1, kgDescuentoTon: 20 },
        ]},
        { id: 'impurezas', nombre: 'Impurezas', generaDescuento: true, rangosDescuento: [
          { porcentaje: 0.0, kgDescuentoTon: 0 },
          { porcentaje: 2.0, kgDescuentoTon: 0 },
          { porcentaje: 2.1, kgDescuentoTon: 10 },
        ]},
        { id: 'granosDanados', nombre: 'Granos Dañados', generaDescuento: true, rangosDescuento: [
          { porcentaje: 0.0, kgDescuentoTon: 0 },
          { porcentaje: 5.0, kgDescuentoTon: 0 },
          { porcentaje: 5.1, kgDescuentoTon: 5 },
        ]},
      ]
    },
    { 
      id: 4, 
      nombre: 'Maíz', 
      codigoFolio: '04',
      analisis: [
        { id: 'humedad', nombre: 'Humedad', generaDescuento: true, rangosDescuento: [
          { porcentaje: 0.0, kgDescuentoTon: 0 },
          { porcentaje: 14.0, kgDescuentoTon: 0 },
          { porcentaje: 14.1, kgDescuentoTon: 10 },
        ]},
        { id: 'impurezas', nombre: 'Impurezas', generaDescuento: true, rangosDescuento: [
          { porcentaje: 0.0, kgDescuentoTon: 0 },
          { porcentaje: 2.0, kgDescuentoTon: 0 },
          { porcentaje: 2.1, kgDescuentoTon: 10 },
        ]},
        { id: 'granosDanados', nombre: 'Granos Dañados', generaDescuento: false },
        { id: 'granosQuebrados', nombre: 'Granos Quebrados', generaDescuento: false },
        { id: 'pesoEspecifico', nombre: 'Peso Específico', generaDescuento: false },
      ]
    },
    { 
      id: 5, 
      nombre: 'Sorgo', 
      codigoFolio: '05',
      analisis: [
        { id: 'humedad', nombre: 'Humedad', generaDescuento: true, rangosDescuento: [] },
        { id: 'impurezas', nombre: 'Impurezas', generaDescuento: true, rangosDescuento: [] },
      ]
    },
  ]);

  const [almacenes, setAlmacenes] = useState<Almacen[]>([
    { id: 1, nombre: 'Tanque Aceite 1', capacidadTotal: 500000, capacidadActual: 320000, unidad: 'Litros' },
    { id: 2, nombre: 'Tanque Aceite 2', capacidadTotal: 500000, capacidadActual: 180000, unidad: 'Litros' },
    { id: 3, nombre: 'Silo Pasta 1', capacidadTotal: 1000000, capacidadActual: 750000, unidad: 'Kg' },
    { id: 4, nombre: 'Bodega Grano', capacidadTotal: 2000000, capacidadActual: 1200000, unidad: 'Kg' },
  ]);

  const [usuarios, setUsuarios] = useState<Usuario[]>([
    { id: 1, nombreCompleto: 'Juan Pérez García', correo: 'juan.perez@empresa.com', contrasena: '********', rol: 'Administrador' },
    { id: 2, nombreCompleto: 'María López Hernández', correo: 'maria.lopez@empresa.com', contrasena: '********', rol: 'Oficina' },
    { id: 3, nombreCompleto: 'Carlos Ramírez Soto', correo: 'carlos.ramirez@empresa.com', contrasena: '********', rol: 'Portero' },
    { id: 4, nombreCompleto: 'Ana Martínez Cruz', correo: 'ana.martinez@empresa.com', contrasena: '********', rol: 'Báscula' },
    { id: 5, nombreCompleto: 'Roberto Sánchez Díaz', correo: 'roberto.sanchez@empresa.com', contrasena: '********', rol: 'Laboratorio' },
  ]);

  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [searchProducto, setSearchProducto] = useState('');
  const [searchAlmacen, setSearchAlmacen] = useState('');
  const [searchUsuario, setSearchUsuario] = useState('');

  // Estados para dialogs
  const [productoDialogOpen, setProductoDialogOpen] = useState(false);
  const [almacenDialogOpen, setAlmacenDialogOpen] = useState(false);
  const [usuarioDialogOpen, setUsuarioDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [editingAlmacen, setEditingAlmacen] = useState<Almacen | null>(null);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'producto' | 'almacen' | 'usuario'; id: number; nombre: string } | null>(null);

  // Estados para formularios
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', codigoFolio: '', analisis: [] as Analisis[] });
  const [nuevoAlmacen, setNuevoAlmacen] = useState({ nombre: '', capacidadTotal: '', unidad: '' });
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombreCompleto: '', correo: '', contrasena: '', rol: '' });

  // Estado para edición de análisis con descuentos
  const [editingAnalisis, setEditingAnalisis] = useState<{ productoId: number; analisis: Analisis } | null>(null);

  const getRolBadge = (rol: string) => {
    const colors: Record<string, string> = {
      'Administrador': 'bg-primary text-primary-foreground',
      'Oficina': 'bg-blue-500 text-white',
      'Portero': 'bg-green-500 text-white',
      'Báscula': 'bg-orange-500 text-white',
      'Calidad': 'bg-purple-500 text-white',
      'Laboratorio': 'bg-pink-500 text-white',
      'Producción': 'bg-cyan-500 text-white',
    };
    return <Badge className={colors[rol] || 'bg-muted text-muted-foreground'}>{rol}</Badge>;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('es-MX');
  };

  const filteredProductos = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchProducto.toLowerCase()) ||
    p.codigoFolio.includes(searchProducto)
  );

  const filteredAlmacenes = almacenes.filter(a => 
    a.nombre.toLowerCase().includes(searchAlmacen.toLowerCase())
  );

  const filteredUsuarios = usuarios.filter(u => 
    u.nombreCompleto.toLowerCase().includes(searchUsuario.toLowerCase()) ||
    u.correo.toLowerCase().includes(searchUsuario.toLowerCase())
  );

  // CRUD Productos
  const handleSaveProducto = () => {
    if (!nuevoProducto.nombre || !nuevoProducto.codigoFolio) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    if (editingProducto) {
      setProductos(prev => prev.map(p => 
        p.id === editingProducto.id 
          ? { ...p, nombre: nuevoProducto.nombre, codigoFolio: nuevoProducto.codigoFolio }
          : p
      ));
      toast.success('Producto actualizado correctamente');
    } else {
      const newId = Math.max(...productos.map(p => p.id), 0) + 1;
      setProductos(prev => [...prev, { id: newId, nombre: nuevoProducto.nombre, codigoFolio: nuevoProducto.codigoFolio, analisis: [] }]);
      toast.success('Producto creado correctamente');
    }

    setNuevoProducto({ nombre: '', codigoFolio: '', analisis: [] });
    setEditingProducto(null);
    setProductoDialogOpen(false);
  };

  const handleEditProducto = (producto: Producto) => {
    setEditingProducto(producto);
    setNuevoProducto({ nombre: producto.nombre, codigoFolio: producto.codigoFolio, analisis: producto.analisis });
    setProductoDialogOpen(true);
  };

  // CRUD Almacenes
  const handleSaveAlmacen = () => {
    if (!nuevoAlmacen.nombre || !nuevoAlmacen.capacidadTotal || !nuevoAlmacen.unidad) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    if (editingAlmacen) {
      setAlmacenes(prev => prev.map(a => 
        a.id === editingAlmacen.id 
          ? { ...a, nombre: nuevoAlmacen.nombre, capacidadTotal: Number(nuevoAlmacen.capacidadTotal), unidad: nuevoAlmacen.unidad }
          : a
      ));
      toast.success('Almacén actualizado correctamente');
    } else {
      const newId = Math.max(...almacenes.map(a => a.id), 0) + 1;
      setAlmacenes(prev => [...prev, { 
        id: newId, 
        nombre: nuevoAlmacen.nombre, 
        capacidadTotal: Number(nuevoAlmacen.capacidadTotal), 
        capacidadActual: 0, 
        unidad: nuevoAlmacen.unidad 
      }]);
      toast.success('Almacén creado correctamente');
    }

    setNuevoAlmacen({ nombre: '', capacidadTotal: '', unidad: '' });
    setEditingAlmacen(null);
    setAlmacenDialogOpen(false);
  };

  const handleEditAlmacen = (almacen: Almacen) => {
    setEditingAlmacen(almacen);
    setNuevoAlmacen({ nombre: almacen.nombre, capacidadTotal: almacen.capacidadTotal.toString(), unidad: almacen.unidad });
    setAlmacenDialogOpen(true);
  };

  // CRUD Usuarios
  const handleSaveUsuario = () => {
    if (!nuevoUsuario.nombreCompleto || !nuevoUsuario.correo || !nuevoUsuario.rol) {
      toast.error('Complete todos los campos requeridos');
      return;
    }
    if (!editingUsuario && !nuevoUsuario.contrasena) {
      toast.error('La contraseña es requerida');
      return;
    }

    if (editingUsuario) {
      setUsuarios(prev => prev.map(u => 
        u.id === editingUsuario.id 
          ? { ...u, nombreCompleto: nuevoUsuario.nombreCompleto, correo: nuevoUsuario.correo, rol: nuevoUsuario.rol, contrasena: nuevoUsuario.contrasena || u.contrasena }
          : u
      ));
      toast.success('Usuario actualizado correctamente');
    } else {
      const newId = Math.max(...usuarios.map(u => u.id), 0) + 1;
      setUsuarios(prev => [...prev, { 
        id: newId, 
        nombreCompleto: nuevoUsuario.nombreCompleto, 
        correo: nuevoUsuario.correo,
        contrasena: '********',
        rol: nuevoUsuario.rol 
      }]);
      toast.success('Usuario creado correctamente');
    }

    setNuevoUsuario({ nombreCompleto: '', correo: '', contrasena: '', rol: '' });
    setEditingUsuario(null);
    setUsuarioDialogOpen(false);
  };

  const handleEditUsuario = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setNuevoUsuario({ nombreCompleto: usuario.nombreCompleto, correo: usuario.correo, contrasena: '', rol: usuario.rol });
    setUsuarioDialogOpen(true);
  };

  // Delete handler
  const handleDelete = () => {
    if (!deleteDialog) return;

    if (deleteDialog.type === 'producto') {
      setProductos(prev => prev.filter(p => p.id !== deleteDialog.id));
    } else if (deleteDialog.type === 'almacen') {
      setAlmacenes(prev => prev.filter(a => a.id !== deleteDialog.id));
    } else if (deleteDialog.type === 'usuario') {
      setUsuarios(prev => prev.filter(u => u.id !== deleteDialog.id));
    }

    toast.success(`${deleteDialog.type === 'producto' ? 'Producto' : deleteDialog.type === 'almacen' ? 'Almacén' : 'Usuario'} eliminado correctamente`);
    setDeleteDialog(null);
  };

  // Agregar análisis a producto
  const handleAddAnalisis = (productoId: number, analisisId: string) => {
    const tipoAnalisis = tiposAnalisis.find(t => t.id === analisisId);
    if (!tipoAnalisis) return;

    setProductos(prev => prev.map(p => {
      if (p.id === productoId) {
        if (p.analisis.some(a => a.id === analisisId)) {
          toast.error('Este análisis ya está agregado');
          return p;
        }
        return {
          ...p,
          analisis: [...p.analisis, { id: analisisId, nombre: tipoAnalisis.nombre, generaDescuento: false, rangosDescuento: [] }]
        };
      }
      return p;
    }));
    toast.success('Análisis agregado');
  };

  // Eliminar análisis de producto
  const handleRemoveAnalisis = (productoId: number, analisisId: string) => {
    setProductos(prev => prev.map(p => {
      if (p.id === productoId) {
        return {
          ...p,
          analisis: p.analisis.filter(a => a.id !== analisisId)
        };
      }
      return p;
    }));
    toast.success('Análisis eliminado');
  };

  // Toggle genera descuento
  const handleToggleDescuento = (productoId: number, analisisId: string) => {
    setProductos(prev => prev.map(p => {
      if (p.id === productoId) {
        return {
          ...p,
          analisis: p.analisis.map(a => {
            if (a.id === analisisId) {
              return { ...a, generaDescuento: !a.generaDescuento, rangosDescuento: !a.generaDescuento ? [] : a.rangosDescuento };
            }
            return a;
          })
        };
      }
      return p;
    }));
  };

  // Editar rangos de descuento
  const handleEditRangos = (productoId: number, analisis: Analisis) => {
    setEditingAnalisis({ productoId, analisis: { ...analisis, rangosDescuento: analisis.rangosDescuento ? [...analisis.rangosDescuento] : [] } });
  };

  const handleSaveRangos = () => {
    if (!editingAnalisis) return;

    setProductos(prev => prev.map(p => {
      if (p.id === editingAnalisis.productoId) {
        return {
          ...p,
          analisis: p.analisis.map(a => {
            if (a.id === editingAnalisis.analisis.id) {
              return editingAnalisis.analisis;
            }
            return a;
          })
        };
      }
      return p;
    }));

    toast.success('Rangos de descuento actualizados');
    setEditingAnalisis(null);
  };

  const handleAddRango = () => {
    if (!editingAnalisis) return;
    setEditingAnalisis({
      ...editingAnalisis,
      analisis: {
        ...editingAnalisis.analisis,
        rangosDescuento: [...(editingAnalisis.analisis.rangosDescuento || []), { porcentaje: 0, kgDescuentoTon: 0 }]
      }
    });
  };

  const handleRemoveRango = (index: number) => {
    if (!editingAnalisis) return;
    setEditingAnalisis({
      ...editingAnalisis,
      analisis: {
        ...editingAnalisis.analisis,
        rangosDescuento: editingAnalisis.analisis.rangosDescuento?.filter((_, i) => i !== index) || []
      }
    });
  };

  const handleUpdateRango = (index: number, field: 'porcentaje' | 'kgDescuentoTon', value: number) => {
    if (!editingAnalisis) return;
    setEditingAnalisis({
      ...editingAnalisis,
      analisis: {
        ...editingAnalisis.analisis,
        rangosDescuento: editingAnalisis.analisis.rangosDescuento?.map((r, i) => 
          i === index ? { ...r, [field]: value } : r
        ) || []
      }
    });
  };

  return (
    <Layout>
      <Header title="Configuración" subtitle="Gestión del sistema" />
      <div className="p-6">
        <Tabs defaultValue="productos" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="productos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="almacenes" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Almacenes
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
          </TabsList>

          {/* TAB PRODUCTOS */}
          <TabsContent value="productos">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nombre o código..." 
                  className="pl-10"
                  value={searchProducto}
                  onChange={(e) => setSearchProducto(e.target.value)}
                />
              </div>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                setEditingProducto(null);
                setNuevoProducto({ nombre: '', codigoFolio: '', analisis: [] });
                setProductoDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Catálogo de Productos
                </CardTitle>
                <CardDescription>
                  Productos con sus códigos de folio y análisis dinámicos configurables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Código Folio</TableHead>
                      <TableHead>Análisis Configurados</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProductos.map((producto) => (
                      <React.Fragment key={producto.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedProduct(expandedProduct === producto.id ? null : producto.id)}
                        >
                          <TableCell>
                            {expandedProduct === producto.id ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{producto.nombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">{producto.codigoFolio}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {producto.analisis.slice(0, 3).map((a) => (
                                <Badge 
                                  key={a.id} 
                                  variant="secondary" 
                                  className={a.generaDescuento ? 'border-orange-500 border' : ''}
                                >
                                  {a.nombre}
                                </Badge>
                              ))}
                              {producto.analisis.length > 3 && (
                                <Badge variant="outline">+{producto.analisis.length - 3}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEditProducto(producto); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ type: 'producto', id: producto.id, nombre: producto.nombre }); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedProduct === producto.id && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={5} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium flex items-center gap-2">
                                    <FlaskConical className="h-4 w-4" />
                                    Configuración de Análisis
                                  </h4>
                                  <Select onValueChange={(value) => handleAddAnalisis(producto.id, value)}>
                                    <SelectTrigger className="w-48">
                                      <SelectValue placeholder="Agregar análisis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tiposAnalisis.filter(t => !producto.analisis.some(a => a.id === t.id)).map((tipo) => (
                                        <SelectItem key={tipo.id} value={tipo.id}>{tipo.nombre}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid gap-2">
                                  {producto.analisis.map((analisis) => (
                                    <div 
                                      key={analisis.id}
                                      className="flex items-center justify-between p-3 rounded-lg border bg-background"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="font-medium">{analisis.nombre}</span>
                                        <div className="flex items-center gap-2">
                                          <Checkbox 
                                            id={`descuento-${producto.id}-${analisis.id}`}
                                            checked={analisis.generaDescuento}
                                            onCheckedChange={() => handleToggleDescuento(producto.id, analisis.id)}
                                          />
                                          <Label htmlFor={`descuento-${producto.id}-${analisis.id}`} className="text-sm text-muted-foreground cursor-pointer">
                                            Genera Descuento
                                          </Label>
                                        </div>
                                        {analisis.generaDescuento && (
                                          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                                            {analisis.rangosDescuento?.length || 0} rangos
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {analisis.generaDescuento && (
                                          <Button variant="outline" size="sm" onClick={() => handleEditRangos(producto.id, analisis)}>
                                            Configurar Rangos
                                          </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveAnalisis(producto.id, analisis.id)}>
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                  {producto.analisis.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      No hay análisis configurados. Use el selector de arriba para agregar.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB ALMACENES */}
          <TabsContent value="almacenes">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar almacenes..." 
                  className="pl-10"
                  value={searchAlmacen}
                  onChange={(e) => setSearchAlmacen(e.target.value)}
                />
              </div>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                setEditingAlmacen(null);
                setNuevoAlmacen({ nombre: '', capacidadTotal: '', unidad: '' });
                setAlmacenDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Almacén
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  Almacenes y Tanques
                </CardTitle>
                <CardDescription>
                  Gestión de capacidades de almacenamiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Capacidad Total</TableHead>
                      <TableHead>Capacidad Actual</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlmacenes.map((almacen) => (
                      <TableRow key={almacen.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{almacen.nombre}</TableCell>
                        <TableCell>{formatNumber(almacen.capacidadTotal)} {almacen.unidad}</TableCell>
                        <TableCell>{formatNumber(almacen.capacidadActual)} {almacen.unidad}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditAlmacen(almacen)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ type: 'almacen', id: almacen.id, nombre: almacen.nombre })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB USUARIOS */}
          <TabsContent value="usuarios">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nombre o correo..." 
                  className="pl-10"
                  value={searchUsuario}
                  onChange={(e) => setSearchUsuario(e.target.value)}
                />
              </div>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                setEditingUsuario(null);
                setNuevoUsuario({ nombreCompleto: '', correo: '', contrasena: '', rol: '' });
                setUsuarioDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestión de Usuarios
                </CardTitle>
                <CardDescription>
                  Usuarios del sistema y sus roles asignados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsuarios.map((usuario) => (
                      <TableRow key={usuario.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{usuario.nombreCompleto}</TableCell>
                        <TableCell>{usuario.correo}</TableCell>
                        <TableCell>{getRolBadge(usuario.rol)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditUsuario(usuario)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ type: 'usuario', id: usuario.id, nombre: usuario.nombreCompleto })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Producto */}
      <Dialog open={productoDialogOpen} onOpenChange={setProductoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProducto ? 'Editar Producto' : 'Agregar Producto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Producto</Label>
              <Input 
                placeholder="Ej: Aceite Crudo de Soya" 
                value={nuevoProducto.nombre}
                onChange={(e) => setNuevoProducto(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Código Folio (2 dígitos)</Label>
              <Input 
                placeholder="Ej: 01" 
                maxLength={2}
                value={nuevoProducto.codigoFolio}
                onChange={(e) => setNuevoProducto(prev => ({ ...prev, codigoFolio: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Análisis Aplicables</Label>
              <p className="text-sm text-muted-foreground">
                Después de guardar el producto, podrás configurar los análisis expandiendo la fila en la tabla.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductoDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveProducto}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Almacen */}
      <Dialog open={almacenDialogOpen} onOpenChange={setAlmacenDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAlmacen ? 'Editar Almacén' : 'Agregar Almacén'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Almacén</Label>
              <Input 
                placeholder="Ej: Tanque Aceite 1"
                value={nuevoAlmacen.nombre}
                onChange={(e) => setNuevoAlmacen(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Capacidad Total</Label>
              <Input 
                type="number" 
                placeholder="Ej: 500000"
                value={nuevoAlmacen.capacidadTotal}
                onChange={(e) => setNuevoAlmacen(prev => ({ ...prev, capacidadTotal: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Unidad de Medida</Label>
              <Select value={nuevoAlmacen.unidad} onValueChange={(value) => setNuevoAlmacen(prev => ({ ...prev, unidad: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Litros">Litros</SelectItem>
                  <SelectItem value="Kg">Kilogramos</SelectItem>
                  <SelectItem value="Toneladas">Toneladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlmacenDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveAlmacen}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Usuario */}
      <Dialog open={usuarioDialogOpen} onOpenChange={setUsuarioDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUsuario ? 'Editar Usuario' : 'Agregar Usuario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input 
                placeholder="Ej: Juan Pérez García"
                value={nuevoUsuario.nombreCompleto}
                onChange={(e) => setNuevoUsuario(prev => ({ ...prev, nombreCompleto: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input 
                type="email" 
                placeholder="correo@empresa.com"
                value={nuevoUsuario.correo}
                onChange={(e) => setNuevoUsuario(prev => ({ ...prev, correo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{editingUsuario ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</Label>
              <Input 
                type="password" 
                placeholder="••••••••"
                value={nuevoUsuario.contrasena}
                onChange={(e) => setNuevoUsuario(prev => ({ ...prev, contrasena: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={nuevoUsuario.rol} onValueChange={(value) => setNuevoUsuario(prev => ({ ...prev, rol: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {rolesDisponibles.map((rol) => (
                    <SelectItem key={rol} value={rol}>
                      {rol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsuarioDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveUsuario}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Rangos de Descuento */}
      <Dialog open={!!editingAnalisis} onOpenChange={() => setEditingAnalisis(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar Rangos de Descuento - {editingAnalisis?.analisis.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Configure los rangos de porcentaje y el descuento en Kg por tonelada correspondiente.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Porcentaje %</TableHead>
                  <TableHead>Kg. Dscto x Ton</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editingAnalisis?.analisis.rangosDescuento?.map((rango, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input 
                        type="number" 
                        step="0.1"
                        value={rango.porcentaje}
                        onChange={(e) => handleUpdateRango(index, 'porcentaje', parseFloat(e.target.value) || 0)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        step="0.001"
                        value={rango.kgDescuentoTon}
                        onChange={(e) => handleUpdateRango(index, 'kgDescuentoTon', parseFloat(e.target.value) || 0)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveRango(index)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button variant="outline" size="sm" onClick={handleAddRango} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Fila
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAnalisis(null)}>Cancelar</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveRangos}>Guardar Rangos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para eliminación */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará "{deleteDialog?.nombre}" permanentemente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Configuracion;
