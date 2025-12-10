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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Tipos de análisis disponibles según el PDF
const tiposAnalisis = [
  { id: 'humedad', nombre: 'Humedad', generaDescuento: true },
  { id: 'impurezas', nombre: 'Impurezas', generaDescuento: true },
  { id: 'granosDanados', nombre: 'Granos Dañados', generaDescuento: true },
  { id: 'granosQuebrados', nombre: 'Granos Quebrados', generaDescuento: true },
  { id: 'aflatoxinas', nombre: 'Aflatoxinas', generaDescuento: false },
  { id: 'proteina', nombre: 'Proteína', generaDescuento: false },
  { id: 'grasa', nombre: 'Grasa', generaDescuento: false },
  { id: 'fibra', nombre: 'Fibra', generaDescuento: false },
  { id: 'cenizas', nombre: 'Cenizas', generaDescuento: false },
  { id: 'acidez', nombre: 'Acidez', generaDescuento: true },
  { id: 'colorRojo', nombre: 'Color Rojo', generaDescuento: false },
  { id: 'colorAmarillo', nombre: 'Color Amarillo', generaDescuento: false },
  { id: 'fosfolipidos', nombre: 'Fosfolípidos', generaDescuento: false },
  { id: 'insolubles', nombre: 'Insolubles en Acetona', generaDescuento: false },
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

interface Analisis {
  id: string;
  nombre: string;
  generaDescuento: boolean;
  rangoMinimo?: number;
  rangoMaximo?: number;
  porcentajeDescuento?: number;
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
  rol: string;
}

const Configuracion = () => {
  const [productos, setProductos] = useState<Producto[]>([
    { 
      id: 1, 
      nombre: 'Aceite Crudo de Soya', 
      codigoFolio: '01',
      analisis: [
        { id: 'acidez', nombre: 'Acidez', generaDescuento: true, rangoMinimo: 0, rangoMaximo: 3, porcentajeDescuento: 1 },
        { id: 'humedad', nombre: 'Humedad', generaDescuento: true, rangoMinimo: 0, rangoMaximo: 0.5, porcentajeDescuento: 0.5 },
        { id: 'fosfolipidos', nombre: 'Fosfolípidos', generaDescuento: false },
      ]
    },
    { 
      id: 2, 
      nombre: 'Pasta de Soya', 
      codigoFolio: '02',
      analisis: [
        { id: 'proteina', nombre: 'Proteína', generaDescuento: false },
        { id: 'humedad', nombre: 'Humedad', generaDescuento: true, rangoMinimo: 0, rangoMaximo: 12, porcentajeDescuento: 1 },
        { id: 'grasa', nombre: 'Grasa', generaDescuento: false },
        { id: 'fibra', nombre: 'Fibra', generaDescuento: false },
      ]
    },
    { 
      id: 3, 
      nombre: 'Frijol Soya', 
      codigoFolio: '03',
      analisis: [
        { id: 'humedad', nombre: 'Humedad', generaDescuento: true, rangoMinimo: 0, rangoMaximo: 14, porcentajeDescuento: 1 },
        { id: 'impurezas', nombre: 'Impurezas', generaDescuento: true, rangoMinimo: 0, rangoMaximo: 2, porcentajeDescuento: 1 },
        { id: 'granosDanados', nombre: 'Granos Dañados', generaDescuento: true, rangoMinimo: 0, rangoMaximo: 5, porcentajeDescuento: 0.5 },
      ]
    },
    { 
      id: 4, 
      nombre: 'Maíz', 
      codigoFolio: '04',
      analisis: [
        { id: 'humedad', nombre: 'Humedad', generaDescuento: true, rangoMinimo: 0, rangoMaximo: 14, porcentajeDescuento: 1 },
        { id: 'impurezas', nombre: 'Impurezas', generaDescuento: true, rangoMinimo: 0, rangoMaximo: 2, porcentajeDescuento: 1 },
        { id: 'aflatoxinas', nombre: 'Aflatoxinas', generaDescuento: false },
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
    { id: 1, nombreCompleto: 'Juan Pérez García', correo: 'juan.perez@empresa.com', rol: 'Administrador' },
    { id: 2, nombreCompleto: 'María López Hernández', correo: 'maria.lopez@empresa.com', rol: 'Oficina' },
    { id: 3, nombreCompleto: 'Carlos Ramírez Soto', correo: 'carlos.ramirez@empresa.com', rol: 'Portero' },
    { id: 4, nombreCompleto: 'Ana Martínez Cruz', correo: 'ana.martinez@empresa.com', rol: 'Báscula' },
    { id: 5, nombreCompleto: 'Roberto Sánchez Díaz', correo: 'roberto.sanchez@empresa.com', rol: 'Laboratorio' },
  ]);

  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [searchProducto, setSearchProducto] = useState('');
  const [searchAlmacen, setSearchAlmacen] = useState('');
  const [searchUsuario, setSearchUsuario] = useState('');

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

  const getCapacidadPorcentaje = (actual: number, total: number) => {
    return Math.round((actual / total) * 100);
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Producto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nombre del Producto</Label>
                      <Input placeholder="Ej: Aceite Crudo de Soya" />
                    </div>
                    <div className="space-y-2">
                      <Label>Código Folio (2 dígitos)</Label>
                      <Input placeholder="Ej: 01" maxLength={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>Análisis Aplicables</Label>
                      <p className="text-sm text-muted-foreground">
                        Después de crear el producto, podrás configurar los análisis y sus rangos de descuento.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button className="bg-primary hover:bg-primary/90">Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => e.stopPropagation()}>
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
                                  <Button size="sm" variant="outline">
                                    <Plus className="h-3 w-3 mr-1" />
                                    Agregar Análisis
                                  </Button>
                                </div>
                                <div className="grid gap-2">
                                  {producto.analisis.map((analisis) => (
                                    <div 
                                      key={analisis.id}
                                      className="flex items-center justify-between p-3 rounded-lg border bg-background"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="font-medium">{analisis.nombre}</span>
                                        {analisis.generaDescuento && (
                                          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                                            Genera Descuento
                                          </Badge>
                                        )}
                                      </div>
                                      {analisis.generaDescuento && analisis.rangoMinimo !== undefined && (
                                        <div className="text-sm text-muted-foreground">
                                          Rango: {analisis.rangoMinimo}% - {analisis.rangoMaximo}% | 
                                          Descuento: {analisis.porcentajeDescuento}% por cada % excedido
                                        </div>
                                      )}
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Almacén
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Almacén</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nombre del Almacén</Label>
                      <Input placeholder="Ej: Tanque Aceite 1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Capacidad Total</Label>
                      <Input type="number" placeholder="Ej: 500000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unidad de Medida</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar unidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="litros">Litros</SelectItem>
                          <SelectItem value="kg">Kilogramos</SelectItem>
                          <SelectItem value="toneladas">Toneladas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button className="bg-primary hover:bg-primary/90">Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                      <TableHead>Ocupación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlmacenes.map((almacen) => {
                      const porcentaje = getCapacidadPorcentaje(almacen.capacidadActual, almacen.capacidadTotal);
                      return (
                        <TableRow key={almacen.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{almacen.nombre}</TableCell>
                          <TableCell>{formatNumber(almacen.capacidadTotal)} {almacen.unidad}</TableCell>
                          <TableCell>{formatNumber(almacen.capacidadActual)} {almacen.unidad}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    porcentaje > 90 ? 'bg-destructive' : 
                                    porcentaje > 70 ? 'bg-orange-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${porcentaje}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{porcentaje}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Usuario</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nombre Completo</Label>
                      <Input placeholder="Ej: Juan Pérez García" />
                    </div>
                    <div className="space-y-2">
                      <Label>Correo Electrónico</Label>
                      <Input type="email" placeholder="correo@empresa.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Rol</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {rolesDisponibles.map((rol) => (
                            <SelectItem key={rol} value={rol.toLowerCase()}>
                              {rol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button className="bg-primary hover:bg-primary/90">Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
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
    </Layout>
  );
};

export default Configuracion;
